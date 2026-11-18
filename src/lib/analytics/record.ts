import "server-only";

import {
  BASELINE_MAX_COMMITS,
  computeBaselineStats,
  getBaselinePeriod,
} from "@/lib/analytics/baseline-stats";
import { toJstDay, type UsageEvent } from "@/lib/analytics/events";
import { createGitHubApp } from "@/lib/github/app";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * アプリの改善のための記録．
 * 「分析に使わない」を選んだ人のものは記録しない．
 * 記録に失敗しても，アプリの動きは止めない（ログに残すだけ）．
 * ページの表示を遅らせないよう，after() の中から呼ぶ．
 */

export async function isAnalyticsOptedOut(userId: string) {
  const { data, error } = await createAdminClient()
    .from("user_profiles")
    .select("analytics_opt_out")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to read analytics setting:", error);
    // 設定が読めない時は，記録しない側に倒す
    return true;
  }

  return data?.analytics_opt_out ?? false;
}

// 使い方の回数を1つ足す
export async function recordUsage(
  userId: string,
  event: UsageEvent,
  target = "",
) {
  try {
    if (await isAnalyticsOptedOut(userId)) {
      return;
    }

    const { error } = await createAdminClient().rpc("increment_usage", {
      p_user_id: userId,
      p_day: toJstDay(new Date()),
      p_event: event,
      p_target: target,
    });

    if (error) {
      console.error("Failed to record usage:", error);
    }
  } catch (error) {
    console.error("Failed to record usage:", error);
  }
}

// 一度に計算する比べる元の数（ページを開くたびに少しずつ進める）
const BASELINES_PER_RUN = 3;

type RepositoryRow = {
  id: string;
  owner: string;
  name: string;
  characters: { created_at: string }[] | { created_at: string } | null;
  github_installations:
    | { github_installation_id: number }[]
    | { github_installation_id: number }
    | null;
};

const first = <T,>(value: T[] | T | null): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

/*
 * まだ比べる元がないリポジトリについて，キャラクターが生まれる前の90日間のコミットを
 * GitHub から読み（最大50件，1回の問い合わせ），数だけを保存する．
 */
export async function ensureCommitBaselines(userId: string) {
  try {
    if (await isAnalyticsOptedOut(userId)) {
      return;
    }

    const admin = createAdminClient();
    const [repositories, baselines] = await Promise.all([
      admin
        .from("repositories")
        .select(
          "id, owner, name, characters(created_at), github_installations(github_installation_id)",
        )
        .eq("user_id", userId)
        .eq("is_active", true),
      admin.from("commit_baselines").select("repository_id").eq("user_id", userId),
    ]);

    if (repositories.error || baselines.error) {
      console.error(
        "Failed to read repositories for baselines:",
        repositories.error ?? baselines.error,
      );
      return;
    }

    const done = new Set(
      (baselines.data ?? []).map((row) => row.repository_id as string),
    );
    const targets = ((repositories.data ?? []) as RepositoryRow[])
      .filter((repository) => !done.has(repository.id))
      .slice(0, BASELINES_PER_RUN);

    const app = createGitHubApp();

    for (const repository of targets) {
      const character = first(repository.characters);
      const installation = first(repository.github_installations);

      // キャラクターがまだ生まれていないリポジトリは，生まれてから計算する
      if (!character || !installation) {
        continue;
      }

      const period = getBaselinePeriod(character.created_at);
      let commits: { message: string; date: string }[];

      try {
        const octokit = await app.getInstallationOctokit(
          installation.github_installation_id,
        );
        const { data } = await octokit.rest.repos.listCommits({
          owner: repository.owner,
          repo: repository.name,
          since: period.start,
          until: period.end,
          per_page: BASELINE_MAX_COMMITS,
        });

        commits = data.map((commit) => ({
          message: commit.commit.message,
          date:
            commit.commit.author?.date ??
            commit.commit.committer?.date ??
            period.end,
        }));
      } catch (error) {
        // 空のリポジトリ（コミットが1つもない）では，GitHub が 409 を返す．その時は0件として保存する
        if ((error as { status?: number }).status === 409) {
          commits = [];
        } else {
          console.error("Failed to list commits for baseline:", error);
          continue;
        }
      }

      const stats = computeBaselineStats(commits);

      const { error } = await admin.from("commit_baselines").upsert({
        repository_id: repository.id,
        user_id: userId,
        period_start: period.start,
        period_end: period.end,
        commit_count: stats.commitCount,
        active_days: stats.activeDays,
        body_count: stats.bodyCount,
        vague_count: stats.vagueCount,
      });

      if (error) {
        console.error("Failed to save commit baseline:", error);
      }
    }
  } catch (error) {
    console.error("Failed to compute commit baselines:", error);
  }
}

export type BattleResultRecord = {
  bossId: string;
  star: number;
  isWin: boolean;
  isTimeout: boolean;
  rounds: number;
  // キャラクターの種類・レベル・役割・助っ人かどうか・付けている装備の数だけ
  party: {
    characterType: string;
    level: number;
    role: string;
    isHelper: boolean;
    gearCount: number;
  }[];
};

// ボス戦の結果を残す（ボスや★ごとの勝率を見て，難しさを調整するため）
export async function recordBattleResult(
  userId: string,
  record: BattleResultRecord,
) {
  try {
    if (await isAnalyticsOptedOut(userId)) {
      return;
    }

    const { error } = await createAdminClient().from("battle_results").insert({
      user_id: userId,
      boss_id: record.bossId,
      star: record.star,
      is_win: record.isWin,
      is_timeout: record.isTimeout,
      rounds: record.rounds,
      party: record.party,
    });

    if (error) {
      console.error("Failed to record battle result:", error);
    }
  } catch (error) {
    console.error("Failed to record battle result:", error);
  }
}
