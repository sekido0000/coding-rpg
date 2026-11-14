/*
 * 成長履歴から，キャラクターごとの最近の様子をまとめる．
 * リポジトリワールドで，どんなセリフを言うかを選ぶのに使う．
 */

import {
  getCommitCategoryFromEventType,
  type CommitCategory,
} from "../growth/xp";

export type GrowthEventRecord = {
  character_id: string;
  event_type: string;
  created_at: string;
};

export type ActivitySummary = {
  // 直近7日のコミット数
  weeklyCommits: number;
  // 直近7日の，種類ごとのコミット数
  weeklyCategories: Partial<Record<CommitCategory, number>>;
  // 種類ごとの，最後にコミットした日時
  latestCategoryAt: Partial<Record<CommitCategory, string>>;
  lastCommitAt: string | null;
  lastLevelUpAt: string | null;
  // 直近4日のうち，コミットがあった日数
  activeDaysInLast4: number;
};

const DAY = 24 * 60 * 60 * 1000;

function createEmptySummary(): ActivitySummary {
  return {
    weeklyCommits: 0,
    weeklyCategories: {},
    latestCategoryAt: {},
    lastCommitAt: null,
    lastLevelUpAt: null,
    activeDaysInLast4: 0,
  };
}

function isLater(value: string, current: string | null | undefined) {
  return !current || new Date(value) > new Date(current);
}

// 日本時間での日付（"2026-11-15" の形）
function toJapanDate(value: string) {
  return new Date(value).toLocaleDateString("sv-SE", {
    timeZone: "Asia/Tokyo",
  });
}

export function summarizeActivity(
  events: GrowthEventRecord[],
  now: Date,
): Record<string, ActivitySummary> {
  const summaries: Record<string, ActivitySummary> = {};
  const activeDays: Record<string, Set<string>> = {};

  for (const event of events) {
    const summary = (summaries[event.character_id] ??=
      createEmptySummary());
    const elapsed =
      now.getTime() - new Date(event.created_at).getTime();

    if (event.event_type === "level_up") {
      if (isLater(event.created_at, summary.lastLevelUpAt)) {
        summary.lastLevelUpAt = event.created_at;
      }
      continue;
    }

    const category = getCommitCategoryFromEventType(
      event.event_type,
    );

    if (!category) {
      continue;
    }

    if (isLater(event.created_at, summary.lastCommitAt)) {
      summary.lastCommitAt = event.created_at;
    }

    if (
      isLater(
        event.created_at,
        summary.latestCategoryAt[category],
      )
    ) {
      summary.latestCategoryAt[category] = event.created_at;
    }

    if (elapsed <= 7 * DAY) {
      summary.weeklyCommits += 1;
      summary.weeklyCategories[category] =
        (summary.weeklyCategories[category] ?? 0) + 1;
    }

    if (elapsed <= 4 * DAY) {
      (activeDays[event.character_id] ??= new Set()).add(
        toJapanDate(event.created_at),
      );
    }
  }

  for (const [characterId, days] of Object.entries(
    activeDays,
  )) {
    summaries[characterId].activeDaysInLast4 = days.size;
  }

  return summaries;
}
