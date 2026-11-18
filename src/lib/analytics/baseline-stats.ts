/*
 * 使い始める前のコミットの姿（比べる元）の計算．
 * コミットのメッセージと日時から，数を数えるだけ（メッセージそのものは返さない）．
 */

import { toJstDay } from "@/lib/analytics/events";
import { analyzeCommitMessage } from "@/lib/growth/xp";

// キャラクターが生まれる前の，この日数を比べる元にする
export const BASELINE_DAYS = 90;

// 読むコミットの最大数（GitHub への問い合わせ1回分）
export const BASELINE_MAX_COMMITS = 50;

export type BaselineCommit = {
  message: string;
  date: string;
};

export type BaselineStats = {
  commitCount: number;
  activeDays: number;
  bodyCount: number;
  vagueCount: number;
};

// マージコミットは数えない（経験値の計算と同じ）
export function computeBaselineStats(commits: BaselineCommit[]): BaselineStats {
  const counted = commits
    .map((commit) => ({ ...commit, ...analyzeCommitMessage(commit.message) }))
    .filter((commit) => !commit.isMerge);

  return {
    commitCount: counted.length,
    activeDays: new Set(
      counted.map((commit) => toJstDay(new Date(commit.date))),
    ).size,
    bodyCount: counted.filter((commit) => commit.hasBody).length,
    vagueCount: counted.filter((commit) => commit.isVague).length,
  };
}

// 比べる元の期間（キャラクターが生まれる前の90日間）
export function getBaselinePeriod(characterCreatedAt: string) {
  const end = new Date(characterCreatedAt);
  const start = new Date(end.getTime() - BASELINE_DAYS * 24 * 60 * 60 * 1000);

  return { start: start.toISOString(), end: end.toISOString() };
}
