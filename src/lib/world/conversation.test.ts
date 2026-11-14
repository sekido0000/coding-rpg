import { describe, expect, it } from "vitest";

import { CHARACTER_PERSONALITIES } from "../characters/personality";
import { summarizeActivity } from "./activity";
import {
  CONVERSATION_TOPICS,
  pickConversation,
  type Talker,
} from "./conversation";
import type { Answer } from "./conversations/types";
import type { SpeakerContext } from "./situations";

const NOW = new Date("2026-11-15T12:00:00+09:00");
const ANSWERS: Answer[] = ["yes", "no"];

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

function talker(
  personality: Talker["personality"],
  overrides: Partial<SpeakerContext> = {},
): Talker {
  return { personality, context: context(overrides) };
}

function slotsIn(line: string) {
  return [...line.matchAll(/\{(\w+)\}/g)].map(
    ([, slot]) => slot,
  );
}

describe("会話の台本の抜けと書き方", () => {
  it("すべての話題・性格・答えに，話しかけ・返事・締めがある", () => {
    for (const topic of CONVERSATION_TOPICS) {
      for (const personality of CHARACTER_PERSONALITIES) {
        expect(
          topic.opener[personality].length,
          `${topic.id} / opener / ${personality}`,
        ).toBeGreaterThan(0);

        for (const answer of ANSWERS) {
          expect(
            topic.reply[answer][personality].length,
            `${topic.id} / reply / ${answer} / ${personality}`,
          ).toBeGreaterThan(0);

          expect(
            topic.closer[answer][personality].length,
            `${topic.id} / closer / ${answer} / ${personality}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("使える差し込みだけを使っている", () => {
    for (const topic of CONVERSATION_TOPICS) {
      const replySlots = new Set([
        "partner",
        ...(topic.replySlots ?? []),
      ]);

      for (const personality of CHARACTER_PERSONALITIES) {
        for (const line of topic.opener[personality]) {
          expect(
            slotsIn(line).every((slot) => slot === "partner"),
            `${topic.id}: ${line}`,
          ).toBe(true);
        }

        for (const answer of ANSWERS) {
          for (const line of topic.reply[answer][personality]) {
            expect(
              slotsIn(line).every((slot) => replySlots.has(slot)),
              `${topic.id}: ${line}`,
            ).toBe(true);
          }

          for (const line of topic.closer[answer][personality]) {
            expect(
              slotsIn(line).every((slot) => slot === "partner"),
              `${topic.id}: ${line}`,
            ).toBe(true);
          }
        }
      }
    }
  });
});

describe("返事は事実に合わせる", () => {
  const testTopic = CONVERSATION_TOPICS.find(
    (topic) => topic.id === "test",
  )!;

  it("最近テストを書いていれば「書いてる」，書いていなければ「書いてない」", () => {
    const wroteTests = summarizeActivity(
      [
        {
          character_id: "c1",
          event_type: "commit_test",
          created_at: hoursAgo(24),
        },
      ],
      NOW,
    ).c1;

    expect(
      testTopic.answer(
        context(),
        context({ activity: wroteTests }),
        NOW,
        () => 0,
      ),
    ).toBe("yes");

    expect(
      testTopic.answer(context(), context(), NOW, () => 0),
    ).toBe("no");
  });

  it("レベルの締めは，話しかけられた側の方が上かで分ける", () => {
    const levelTopic = CONVERSATION_TOPICS.find(
      (topic) => topic.id === "level",
    )!;

    expect(
      levelTopic.answer(
        context({ level: 2 }),
        context({ level: 4 }),
        NOW,
        () => 0,
      ),
    ).toBe("yes");

    // 同じレベルの時は「上ではない」
    expect(
      levelTopic.answer(
        context({ level: 3 }),
        context({ level: 3 }),
        NOW,
        () => 0,
      ),
    ).toBe("no");
  });
});

describe("会話の組み立て", () => {
  it("話しかけ・返事・締めの順に，名前やレベルが入った3つのセリフができる", () => {
    const conversation = pickConversation({
      speaker: talker("cheerful", { name: "タロウ" }),
      listener: talker("cool", { name: "ハナコ", level: 4 }),
      now: NOW,
      random: () => 0,
      recentIds: new Set(),
    });

    expect(
      conversation.lines.map((line) => line.by),
    ).toEqual(["speaker", "listener", "speaker"]);

    for (const line of conversation.lines) {
      expect(line.text).not.toMatch(/\{\w+\}/);
    }
  });

  it("返事と締めは，同じ答え（yes/no）の言い回しから選ばれる", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      let value = seed;
      const random = () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
      };

      const conversation = pickConversation({
        speaker: talker("tsundere"),
        listener: talker("timid"),
        now: NOW,
        random,
        recentIds: new Set(),
      });

      const [, reply, closer] = conversation.lines;
      const replyAnswer = reply.id.split(":")[3];
      const closerAnswer = closer.id.split(":")[3];

      expect(replyAnswer).toBe(closerAnswer);
    }
  });

  it("最近出した話題は，他の話題があれば選ばない", () => {
    const recentIds = new Set(
      CONVERSATION_TOPICS.slice(1).map(
        (topic) => `topic:${topic.id}`,
      ),
    );

    const conversation = pickConversation({
      speaker: talker("calm"),
      listener: talker("serious"),
      now: NOW,
      random: () => 0.7,
      recentIds,
    });

    expect(conversation.topicId).toBe(
      `topic:${CONVERSATION_TOPICS[0].id}`,
    );
  });
});
