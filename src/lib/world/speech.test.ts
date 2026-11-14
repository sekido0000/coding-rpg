import { describe, expect, it } from "vitest";

import { CHARACTER_PERSONALITIES } from "../characters/personality";
import { summarizeActivity } from "./activity";
import { SOLO_LINES } from "./lines/solo";
import {
  COMMON_SLOTS,
  SITUATIONS,
  SITUATION_SLOTS,
  getEligibleSituations,
  type SpeakerContext,
} from "./situations";
import { fillSlots, pickSoloLine } from "./speech";

const NOW = new Date("2026-11-15T12:00:00+09:00");

const hoursAgo = (hours: number) =>
  new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString();

function context(
  overrides: Partial<SpeakerContext> = {},
): SpeakerContext {
  return {
    name: "ポチ",
    repositoryName: "demo",
    level: 2,
    currentXp: 10,
    requiredXp: 200,
    activity: undefined,
    ...overrides,
  };
}

function situationIds(target: SpeakerContext, now = NOW) {
  return getEligibleSituations(target, now).map(
    (situation) => situation.id,
  );
}

describe("独り言のセリフの数と書き方", () => {
  it("すべての性格の，すべての場面にセリフが十分ある", () => {
    for (const personality of CHARACTER_PERSONALITIES) {
      for (const situation of SITUATIONS) {
        const lines = SOLO_LINES[personality][situation];
        const minimum = situation === "chitchat" ? 10 : 4;

        expect(
          lines.length,
          `${personality} / ${situation}`,
        ).toBeGreaterThanOrEqual(minimum);
      }
    }
  });

  it("同じ場面に同じセリフが重複していない", () => {
    for (const personality of CHARACTER_PERSONALITIES) {
      for (const situation of SITUATIONS) {
        const lines = SOLO_LINES[personality][situation];

        expect(
          new Set(lines).size,
          `${personality} / ${situation}`,
        ).toBe(lines.length);
      }
    }
  });

  it("その場面で使えない差し込みを使っていない", () => {
    for (const personality of CHARACTER_PERSONALITIES) {
      for (const situation of SITUATIONS) {
        const allowed = new Set<string>([
          ...COMMON_SLOTS,
          ...(SITUATION_SLOTS[situation] ?? []),
        ]);

        for (const line of SOLO_LINES[personality][situation]) {
          for (const [, slot] of line.matchAll(/\{(\w+)\}/g)) {
            expect(
              allowed.has(slot),
              `${personality} / ${situation}: ${line}`,
            ).toBe(true);
          }
        }
      }
    }
  });
});

describe("当てはまる場面", () => {
  it("雑談はいつでも当てはまる", () => {
    expect(situationIds(context())).toContain("chitchat");
  });

  it("最近テストを書いていると「テスト」の場面になる", () => {
    const activity = summarizeActivity(
      [
        {
          character_id: "c1",
          event_type: "commit_test",
          created_at: hoursAgo(5),
        },
      ],
      NOW,
    ).c1;

    expect(situationIds(context({ activity }))).toContain(
      "recent_test",
    );
  });

  it("4日前のテストは「最近」に入らない", () => {
    const activity = summarizeActivity(
      [
        {
          character_id: "c1",
          event_type: "commit_test",
          created_at: hoursAgo(96),
        },
      ],
      NOW,
    ).c1;

    expect(situationIds(context({ activity }))).not.toContain(
      "recent_test",
    );
  });

  it("コミットの記録がない時は「長いお休み」，数日空くと「お休み」になる", () => {
    expect(situationIds(context())).toContain("long_quiet");

    const activity = summarizeActivity(
      [
        {
          character_id: "c1",
          event_type: "commit_feat",
          created_at: hoursAgo(5 * 24),
        },
      ],
      NOW,
    ).c1;

    expect(situationIds(context({ activity }))).toContain(
      "quiet",
    );
  });

  it("経験値が8割を超えると「もうすぐ進化」になる", () => {
    expect(
      situationIds(context({ currentXp: 170, requiredXp: 200 })),
    ).toContain("near_level_up");
  });

  it("朝の時間帯には「朝」の場面になる", () => {
    const morning = new Date(NOW);
    morning.setHours(7);

    expect(situationIds(context(), morning)).toContain(
      "morning",
    );
  });
});

describe("セリフの選び方", () => {
  it("差し込みが値に置き換わる", () => {
    expect(
      fillSlots("{name}の{repo}", {
        name: "ポチ",
        repo: "demo",
      }),
    ).toBe("ポチのdemo");
  });

  it("選んだセリフに，置き換え忘れの差し込みが残らない", () => {
    const activity = summarizeActivity(
      [
        {
          character_id: "c1",
          event_type: "commit_fix",
          created_at: hoursAgo(1),
        },
      ],
      NOW,
    ).c1;

    for (let seed = 0; seed < 200; seed += 1) {
      let value = seed;
      const random = () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
      };

      for (const personality of CHARACTER_PERSONALITIES) {
        const line = pickSoloLine({
          personality,
          context: context({
            activity,
            currentXp: 190,
          }),
          now: NOW,
          random,
          recentIds: new Set(),
        });

        expect(line.text).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it("最近出したセリフは，同じ場面に他のセリフがあれば選ばない", () => {
    const recentIds = new Set(
      SOLO_LINES.cool.long_quiet
        .slice(1)
        .map((_, index) => `cool:long_quiet:${index + 1}`),
    );

    // いろいろな乱数で選び，「長いお休み」の場面になった時を確かめる
    const chosen = Array.from({ length: 100 }, (_, seed) => {
      let value = seed + 1;
      const random = () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
      };

      return pickSoloLine({
        personality: "cool",
        context: context(),
        now: NOW,
        random,
        recentIds,
      }).id;
    }).filter((id) => id.startsWith("cool:long_quiet"));

    expect(chosen.length).toBeGreaterThan(0);
    expect(new Set(chosen)).toEqual(
      new Set(["cool:long_quiet:0"]),
    );
  });
});
