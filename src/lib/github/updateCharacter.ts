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

type SupabaseAdminClient = ReturnType<
  typeof createAdminClient
>;

type CharacterRow = {
  id: string;
  character_type: CharacterType;
  level: number;
  current_xp: number;
  required_xp: number;
};

async function fetchCharacter(
  supabase: SupabaseAdminClient,
  repositoryId: string,
): Promise<CharacterRow | null> {
  const { data, error } = await supabase
    .from("characters")
    .select(
      "id, character_type, level, current_xp, required_xp",
    )
    .eq("repository_id", repositoryId)
    .maybeSingle();

  if (error || !data) {
    console.error(
      "Character not found",
      error,
    );
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
 * 取得できなかったコミットは通知のファイル一覧で代用する．
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
        shas: commits.map((commit) => commit.id),
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

  if (installationError || !installation) {
    console.error(
      "GitHub installation not found",
      installationError,
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
    console.error(
      "Failed to fetch repository",
      repositoryError,
    );
    return;
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


  // コミットごとに経験値を計算
  const changedFiles = await getChangedFiles(
    payload,
    commits,
  );

  const results = commits.map((commit, index) =>
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
      console.error(
        "Character update failed:",
        updateError,
      );
      return;
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

  if (!character || !growth) {
    console.error(
      "Character update conflicted too many times",
    );
    return;
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
              created_at: commits[index].timestamp ?? now,
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
