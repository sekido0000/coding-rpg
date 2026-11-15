import { describe, expect, it } from "vitest";

import {
  evaluateWeeklyQuests,
  getQuestRewards,
  getWeekRange,
  getWeekStart,
  type QuestEvent,
} from "@/lib/quests/weekly";

// 2026-11-16（月）から始まる週
const WEEK = "2026-11-16";

function commit(
  createdAt: string,
  overrides: Partial<QuestEvent> = {},
): QuestEvent {
  return {
    event_type: "commit_feat",
    xp: 20,
    created_at: createdAt,
    body_xp: 5,
    is_vague: false,
    ...overrides,
  };
}

function progressOf(events: QuestEvent[]) {
  return Object.fromEntries(
    evaluateWeeklyQuests(events, WEEK).map((progress) => [
      progress.quest.id,
      progress,
    ]),
  );
}

describe("週の計算", () => {
  it("日本時間の月曜0時で週が切り替わる", () => {
    // 日本時間 11/16（月）0:00 は UTC 11/15 15:00
    expect(getWeekStart(new Date("2026-11-15T15:00:00Z"))).toBe(
      "2026-11-16",
    );
    // その1秒前は前の週（日曜）
    expect(getWeekStart(new Date("2026-11-15T14:59:59Z"))).toBe(
      "2026-11-09",
    );
    // 日曜の夜も同じ週
    expect(getWeekStart(new Date("2026-11-22T14:00:00Z"))).toBe(
      "2026-11-16",
    );
  });

  it("週の範囲は日本時間の月曜0時から7日間", () => {
    expect(getWeekRange(WEEK)).toEqual({
      from: "2026-11-15T15:00:00.000Z",
      to: "2026-11-22T15:00:00.000Z",
    });
  });
});

describe("クエストの進み具合", () => {
  it("回数・日数・経験値を数え，達成した段階を出す", () => {
    const progress = progressOf([
      commit("2026-11-16T01:00:00Z"),
      commit("2026-11-16T02:00:00Z"),
      commit("2026-11-17T01:00:00Z"),
    ]);

    expect(progress.commits).toMatchObject({
      value: 3,
      achievedStages: 2,
    });
    expect(progress.days).toMatchObject({
      value: 2,
      achievedStages: 2,
    });
    expect(progress.xp).toMatchObject({
      value: 60,
      achievedStages: 2,
    });
    expect(progress.every_time).toMatchObject({
      value: 3,
      achievedStages: 1,
      isFailed: false,
    });
  });

  it("経験値0のコミット，進化の記録，週の外のコミットは数えない", () => {
    const progress = progressOf([
      commit("2026-11-16T01:00:00Z"),
      commit("2026-11-16T02:00:00Z", { xp: 0 }),
      commit("2026-11-16T03:00:00Z", {
        event_type: "level_up",
      }),
      // 前の週（日本時間の日曜23時）
      commit("2026-11-15T14:00:00Z"),
    ]);

    expect(progress.commits.value).toBe(1);
  });

  it("日数は日本時間の日付で数える", () => {
    // 日本時間ではどちらも 11/17
    const progress = progressOf([
      commit("2026-11-16T16:00:00Z"),
      commit("2026-11-17T10:00:00Z"),
    ]);

    expect(progress.days.value).toBe(1);
  });

  it("毎回クエストは，理由なしのコミットが1回でもあると失敗", () => {
    const progress = progressOf([
      commit("2026-11-16T01:00:00Z"),
      commit("2026-11-16T02:00:00Z"),
      commit("2026-11-16T03:00:00Z"),
      commit("2026-11-16T04:00:00Z", { body_xp: 0 }),
    ]);

    expect(progress.every_time).toMatchObject({
      achievedStages: 0,
      isFailed: true,
    });
  });

  it("内訳のない古い履歴は，毎回クエストでは数えない", () => {
    const progress = progressOf([
      commit("2026-11-16T01:00:00Z", { body_xp: null }),
      commit("2026-11-16T02:00:00Z"),
    ]);

    expect(progress.every_time).toMatchObject({
      value: 1,
      isFailed: false,
    });
    expect(progress.commits.value).toBe(2);
  });
});

describe("クエストの報酬", () => {
  it("達成した段階ごとに報酬を出す", () => {
    const rewards = getQuestRewards(
      evaluateWeeklyQuests(
        [commit("2026-11-16T01:00:00Z")],
        WEEK,
      ),
    );

    expect(rewards).toEqual([
      { quest_id: "commits", stage: 1, gold: 10 },
      { quest_id: "days", stage: 1, gold: 10 },
    ]);
  });

  it("★が増えるほど報酬が増え，毎回クエストは30", () => {
    const rewards = getQuestRewards(
      evaluateWeeklyQuests(
        [
          commit("2026-11-16T01:00:00Z"),
          commit("2026-11-16T02:00:00Z"),
          commit("2026-11-17T01:00:00Z"),
        ],
        WEEK,
      ),
    );

    expect(rewards).toEqual([
      { quest_id: "commits", stage: 1, gold: 10 },
      { quest_id: "commits", stage: 2, gold: 20 },
      { quest_id: "days", stage: 1, gold: 10 },
      { quest_id: "days", stage: 2, gold: 20 },
      { quest_id: "xp", stage: 1, gold: 10 },
      { quest_id: "xp", stage: 2, gold: 20 },
      { quest_id: "every_time", stage: 1, gold: 30 },
    ]);
  });
});
