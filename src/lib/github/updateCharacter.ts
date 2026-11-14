import { createAdminClient } from "@/lib/supabase/admin";
import { getCommitFiles } from "@/lib/github/commits";
import {
  calculateCommitXp,
  toCommitEventType,
  type ChangedFile,
} from "@/lib/growth/xp";
import {
  addXp,
  type LevelUpResult,
} from "@/lib/growth/level";
import {
  getCharacterEvolution,
  isCharacterType,
} from "@/lib/characters/catalog";
import type { CharacterType } from "@/lib/characters/generated-types";

// 同時更新で競合した時に，読み直してやり直す回数の上限
const MAX_UPDATE_ATTEMPTS = 3;

/*
 * 1回のpushで，GitHub APIから差分を取得するコミットの数の上限．
 * GitHubの回数制限（1時間に5,000回）と，通知に10秒以内に返事する制限に
 * 余裕を持って収まるようにする．
 */
const MAX_FETCHED_COMMITS = 50;

type SupabaseAdminClient = ReturnType<
  typeof createAdminClient
>;

type CharacterRow = {
  id: string;
  character_type: CharacterType;
  level: number;
  current_xp: number;
  required_xp: number;
  created_at: string;
};

/*
 * キャラクターを取得する．
 * まだ作られていない時はnull，取得自体に失敗した時は例外を投げる
 * （例外にすると，GitHubからの再送でやり直せる）．
 */
async function fetchCharacter(
  supabase: SupabaseAdminClient,
  repositoryId: string,
): Promise<CharacterRow | null> {
  const { data, error } = await supabase
    .from("characters")
    .select(
      "id, character_type, level, current_xp, required_xp, created_at",
    )
    .eq("repository_id", repositoryId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch character: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  if (!isCharacterType(data.character_type)) {
    console.error(
      "Invalid character type:",
      data.character_type,
    );
    return null;
  }

  return data as CharacterRow;
}

type PushCommit = {
  id: string;
  message: string;
  timestamp?: string;
  /*
   * falseの時は，別のpushですでに届いたコミット
   * （ブランチのマージなど）．
   */
  distinct?: boolean;
  added?: string[];
  modified?: string[];
  removed?: string[];
};

export type PushWebhookPayload = {
  repository: {
    id: number;
    name: string;
    owner: {
      login?: string;
      name?: string;
    };
  };
  installation?: {
    id: number;
  };
  /*
   * force pushの時はtrue．
   */
  forced?: boolean;
  commits: PushCommit[];
};

/*
 * Webhookの通知に含まれるファイル一覧を使う．
 * 行数は分からないのでnullにする．
 */
function getFilesFromPayload(
  commit: PushCommit,
): ChangedFile[] {
  const toFiles = (
    filenames: string[] | undefined,
    status: string,
  ) =>
    (filenames ?? []).map((filename) => ({
      filename,
      status,
      additions: null,
      deletions: null,
    }));

  return [
    ...toFiles(commit.added, "added"),
    ...toFiles(commit.modified, "modified"),
    ...toFiles(commit.removed, "removed"),
  ];
}

/*
 * GitHub APIで変更行数まで取得する．
 * 取得できなかったコミットと，上限を超えた分のコミットは，
 * 通知のファイル一覧で代用する（行数が分からないので変更量ボーナスは付かない）．
 */
async function getChangedFiles(
  payload: PushWebhookPayload,
  commits: PushCommit[],
) {
  const owner =
    payload.repository.owner.login ??
    payload.repository.owner.name;

  let filesBySha = new Map<string, ChangedFile[]>();

  if (payload.installation && owner) {
    try {
      filesBySha = await getCommitFiles({
        installationId: payload.installation.id,
        owner,
        repo: payload.repository.name,
        shas: commits
          .slice(0, MAX_FETCHED_COMMITS)
          .map((commit) => commit.id),
      });
    } catch (error) {
      console.error(
        "Failed to fetch commit files:",
        error,
      );
    }
  }

  return commits.map(
    (commit) =>
      filesBySha.get(commit.id) ??
      getFilesFromPayload(commit),
  );
}

/*
 * pushの通知を受けて，キャラクターに経験値を加える．
 *
 * 経験値を付けなくてよい時（force push，連携していないリポジトリなど）は
 * そのまま終わる．DBの読み書きに失敗した時は例外を投げ，
 * Webhookの受信記録を消して，GitHubからの再送でやり直せるようにする．
 */
export async function updateCharacter(
  payload: PushWebhookPayload,
) {
  const githubRepositoryId = payload.repository.id;

  /*
   * force pushでは，作り直した（amend・rebaseした）コミットが
   * 新しいコミットとして届くため，経験値を付けない．
   * （同じ変更で何度も経験値を得られないようにする）
   */
  if (payload.forced) {
    return;
  }

  // マージなどで再び届いたコミットは二重に数えない
  const commits = (payload.commits ?? []).filter(
    (commit) => commit.distinct !== false,
  );

  if (commits.length === 0) {
    return;
  }

  if (!payload.installation) {
    console.error(
      "Installation is missing in push payload",
    );
    return;
  }

  const supabase = createAdminClient();

  // 通知を送ってきたインストールを取得
  const {
    data: installation,
    error: installationError,
  } = await supabase
    .from("github_installations")
    .select("id")
    .eq(
      "github_installation_id",
      payload.installation.id,
    )
    .maybeSingle();

  if (installationError) {
    throw new Error(
      `Failed to fetch GitHub installation: ${installationError.message}`,
    );
  }

  if (!installation) {
    console.error(
      "GitHub installation not found",
    );
    return;
  }

  /*
   * Repository取得．
   * アプリ上で連携を解除したリポジトリ（is_active=false）には
   * GitHubから通知が届いても経験値を付けない．
   */
  const {
    data: repository,
    error: repositoryError,
  } = await supabase
    .from("repositories")
    .select("*")
    .eq(
      "github_installation_id",
      installation.id,
    )
    .eq(
      "github_repository_id",
      githubRepositoryId,
    )
    .eq("is_active", true)
    .maybeSingle();

  if (repositoryError) {
    throw new Error(
      `Failed to fetch repository: ${repositoryError.message}`,
    );
  }

  if (!repository) {
    return;
  }


  // Character取得
  const firstCharacter = await fetchCharacter(
    supabase,
    repository.id,
  );

  if (!firstCharacter) {
    return;
  }

  /*
   * キャラクターが誕生する前に作られたコミットには経験値を付けない．
   * 過去の履歴をまとめてpushした時に，一気に育たないようにする．
   */
  const birthTime = new Date(
    firstCharacter.created_at,
  ).getTime();

  const countedCommits = commits.filter(
    (commit) =>
      !commit.timestamp ||
      new Date(commit.timestamp).getTime() >= birthTime,
  );

  if (countedCommits.length === 0) {
    return;
  }


  // コミットごとに経験値を計算
  const changedFiles = await getChangedFiles(
    payload,
    countedCommits,
  );

  const results = countedCommits.map((commit, index) =>
    calculateCommitXp({
      message: commit.message,
      files: changedFiles[index],
    }),
  );

  const gainedXp = results.reduce(
    (total, result) => total + result.xp,
    0,
  );

  // 空コミットなど，経験値の入るコミットがない時は何もしない
  if (gainedXp === 0) {
    return;
  }


  /*
   * キャラクター更新．
   * 同じキャラクターへの通知が同時に届くと，片方の加算が
   * 上書きで消えてしまう．読み込んだ時からレベルと経験値が
   * 変わっていない時だけ更新し，変わっていたら読み直してやり直す．
   */
  let character: CharacterRow | null = firstCharacter;
  let growth: LevelUpResult | null = null;

  for (
    let attempt = 1;
    attempt <= MAX_UPDATE_ATTEMPTS && character;
    attempt += 1
  ) {
    const nextGrowth = addXp(
      {
        level: character.level,
        currentXp: character.current_xp,
        requiredXp: character.required_xp,
      },
      gainedXp,
    );

    const evolution = getCharacterEvolution(
      character.character_type,
      nextGrowth.level,
    );

    const activity =
      nextGrowth.reachedLevels.length > 0
        ? `レベル${nextGrowth.level}に進化しました！`
        : `${gainedXp} XP獲得しました`;

    const {
      data: updated,
      error: updateError,
    } = await supabase
      .from("characters")
      .update({
        level: nextGrowth.level,
        current_xp: nextGrowth.currentXp,
        required_xp: nextGrowth.requiredXp,
        image_path: evolution.imagePath,
        latest_activity: activity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", character.id)
      .eq("level", character.level)
      .eq("current_xp", character.current_xp)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw new Error(
        `Failed to update character: ${updateError.message}`,
      );
    }

    if (updated) {
      growth = nextGrowth;
      break;
    }

    // 他の通知が先に更新したので読み直す
    character = await fetchCharacter(
      supabase,
      repository.id,
    );
  }

  // 読み直している間にキャラクターが消えた時は，加える先がないので終わる
  if (!character) {
    return;
  }

  if (!growth) {
    throw new Error(
      "Character update conflicted too many times",
    );
  }

  const updatedCharacter = character;


  // 成長履歴（コミットごと＋レベルアップごと）
  const now = new Date().toISOString();

  // 経験値の入らなかったコミット（空コミット・マージなど）は履歴に残さない
  const commitEvents = results.flatMap(
    (result, index) =>
      result.xp > 0
        ? [
            {
              character_id: updatedCharacter.id,
              event_type: toCommitEventType(
                result.category,
              ),
              xp: result.xp,
              description: result.subject,
              created_at:
                countedCommits[index].timestamp ?? now,
            },
          ]
        : [],
  );

  const levelUpEvents = growth.reachedLevels.map(
    (level) => ({
      character_id: updatedCharacter.id,
      event_type: "level_up",
      xp: 0,
      description: `レベル${level}：${
        getCharacterEvolution(
          updatedCharacter.character_type,
          level,
        ).name
      }へ進化しました！`,
      created_at: now,
    }),
  );

  const { error: eventError } = await supabase
    .from("growth_events")
    .insert([
      ...commitEvents,
      ...levelUpEvents,
    ]);

  /*
   * キャラクターの経験値はすでに加えているので，ここでは例外を投げない．
   * 例外にすると再送で経験値がもう一度加わってしまうため，
   * 履歴が欠ける方を選ぶ．
   */
  if (eventError) {
    console.error(
      "Growth event insert failed:",
      eventError,
    );
  }

  console.log(
    `Repository ${repository.name}: +${gainedXp} XP`,
  );
}
