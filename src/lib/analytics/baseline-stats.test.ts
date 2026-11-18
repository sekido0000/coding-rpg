import { describe, expect, it } from "vitest";

import {
  computeBaselineStats,
  getBaselinePeriod,
} from "@/lib/analytics/baseline-stats";
import { isClientUsageEvent, toJstDay } from "@/lib/analytics/events";

describe("比べる元（使い始める前のコミットの姿）", () => {
  it("件数・日数・理由を書いた数・あいまいな数を数え，マージは数えない", () => {
    const stats = computeBaselineStats([
      {
        message: "feat: ログイン画面を追加\n\nパスワードを忘れた人が戻れるようにするため",
        date: "2026-10-01T01:00:00Z",
      },
      { message: "update", date: "2026-10-01T03:00:00Z" },
      { message: "fix: 保存できない不具合を修正", date: "2026-10-03T10:00:00Z" },
      { message: "Merge pull request #1 from someone/branch", date: "2026-10-04T00:00:00Z" },
    ]);

    expect(stats).toEqual({
      commitCount: 3,
      activeDays: 2,
      bodyCount: 1,
      vagueCount: 1,
    });
  });

  it("コミットがない時は，すべて0（比べる元なし）", () => {
    expect(computeBaselineStats([])).toEqual({
      commitCount: 0,
      activeDays: 0,
      bodyCount: 0,
      vagueCount: 0,
    });
  });

  it("期間は，キャラクターが生まれる前の90日間", () => {
    const period = getBaselinePeriod("2026-11-18T00:00:00.000Z");

    expect(period.end).toBe("2026-11-18T00:00:00.000Z");
    expect(period.start).toBe("2026-08-20T00:00:00.000Z");
  });
});

describe("使い方の回数", () => {
  it("日付は日本時間で数える", () => {
    expect(toJstDay(new Date("2026-11-17T15:30:00Z"))).toBe("2026-11-18");
  });

  it("ブラウザから送れるのは，決まった種類だけ", () => {
    expect(isClientUsageEvent("building_peek")).toBe(true);
    expect(isClientUsageEvent("battle_challenge")).toBe(false);
    expect(isClientUsageEvent("anything")).toBe(false);
  });
});
