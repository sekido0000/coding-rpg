/*
 * キャラクターが独り言を言う「場面」．
 * 最近のコミットの様子や時間帯から，今どの場面に当てはまるかを決める．
 */

import type { ActivitySummary } from "./activity";

export const SITUATIONS = [
  "morning",
  "evening",
  "late_night",
  "weekend",
  "recent_feat",
  "recent_fix",
  "many_fixes",
  "recent_test",
  "recent_docs",
  "recent_refactor",
  "busy_week",
  "streak",
  "quiet",
  "long_quiet",
  "near_level_up",
  "just_leveled",
  "final_form",
  "chitchat",
] as const;

export type SituationId = (typeof SITUATIONS)[number];

// セリフの中で使える差し込み（{name} など）
export const COMMON_SLOTS = ["name", "repo", "level"] as const;

// 場面ごとに，追加で使える差し込み
export const SITUATION_SLOTS: Partial<
  Record<SituationId, readonly string[]>
> = {
  many_fixes: ["count"],
  busy_week: ["count"],
  quiet: ["days"],
  near_level_up: ["next"],
};

export type SpeakerContext = {
  name: string;
  repositoryName: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  activity: ActivitySummary | undefined;
};

type WeightedSituation = {
  id: SituationId;
  weight: number;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// 最終形態のレベル（5段階で進化する）
const FINAL_FORM_LEVEL = 5;

function isWithin(
  value: string | null | undefined,
  now: Date,
  milliseconds: number,
) {
  return (
    !!value &&
    now.getTime() - new Date(value).getTime() <= milliseconds
  );
}

function getDaysSinceLastCommit(
  context: SpeakerContext,
  now: Date,
) {
  const lastCommitAt = context.activity?.lastCommitAt;

  if (!lastCommitAt) {
    return null;
  }

  return Math.floor(
    (now.getTime() - new Date(lastCommitAt).getTime()) / DAY,
  );
}

/*
 * 今当てはまる場面と，その選ばれやすさ（重み）．
 * 時間帯は，見ている人のパソコンの時計で決める．
 */
export function getEligibleSituations(
  context: SpeakerContext,
  now: Date,
): WeightedSituation[] {
  const situations: WeightedSituation[] = [
    { id: "chitchat", weight: 2 },
  ];

  const add = (id: SituationId, weight: number) => {
    situations.push({ id, weight });
  };

  const hour = now.getHours();
  const day = now.getDay();
  const activity = context.activity;
  const latest = activity?.latestCategoryAt ?? {};

  if (hour >= 5 && hour <= 9) add("morning", 2);
  if (hour >= 17 && hour <= 21) add("evening", 2);
  if (hour >= 0 && hour <= 3) add("late_night", 2);
  if (day === 0 || day === 6) add("weekend", 1);

  if (isWithin(latest.feat, now, 3 * DAY)) add("recent_feat", 3);
  if (isWithin(latest.fix, now, 3 * DAY)) add("recent_fix", 3);
  if ((activity?.weeklyCategories.fix ?? 0) >= 3) {
    add("many_fixes", 3);
  }
  if (isWithin(latest.test, now, 3 * DAY)) add("recent_test", 3);
  if (isWithin(latest.docs, now, 3 * DAY)) add("recent_docs", 3);
  if (isWithin(latest.refactor, now, 3 * DAY)) {
    add("recent_refactor", 3);
  }

  if ((activity?.weeklyCommits ?? 0) >= 10) add("busy_week", 3);
  if ((activity?.activeDaysInLast4 ?? 0) >= 3) add("streak", 3);

  const days = getDaysSinceLastCommit(context, now);

  if (days === null) {
    add("long_quiet", 2);
  } else if (days >= 3) {
    add("quiet", 2);
  }

  if (
    context.requiredXp > 0 &&
    context.currentXp / context.requiredXp >= 0.8
  ) {
    add("near_level_up", 3);
  }

  if (isWithin(activity?.lastLevelUpAt, now, DAY)) {
    add("just_leveled", 5);
  }

  if (context.level >= FINAL_FORM_LEVEL) add("final_form", 1);

  return situations;
}

// セリフの差し込みに入れる値
export function getSlotValues(
  situation: SituationId,
  context: SpeakerContext,
  now: Date,
): Record<string, string> {
  const values: Record<string, string> = {
    name: context.name,
    repo: context.repositoryName,
    level: String(context.level),
  };

  if (situation === "many_fixes") {
    values.count = String(
      context.activity?.weeklyCategories.fix ?? 0,
    );
  }

  if (situation === "busy_week") {
    values.count = String(context.activity?.weeklyCommits ?? 0);
  }

  if (situation === "quiet") {
    values.days = String(getDaysSinceLastCommit(context, now) ?? 0);
  }

  if (situation === "near_level_up") {
    values.next = String(
      Math.max(0, context.requiredXp - context.currentXp),
    );
  }

  return values;
}
