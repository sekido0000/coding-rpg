/// <reference types="vite/client" />

import { describe, it } from "vitest";

import {
  CHARACTER_PERSONALITIES,
  PERSONALITY_INFO,
} from "../characters/personality";
import { summarizeActivity } from "./activity";
import { pickConversation } from "./conversation";

/*
 * 会話のサンプルをランダムに作って表示する．不自然な会話がないかを目で確かめる用．
 * 普段のテストや CI では動かさず，`npm run world:samples` の時だけ動く．
 */

const SAMPLE_COUNT = 40;

describe.runIf(import.meta.env.MODE === "samples")(
  "会話のサンプル",
  () => {
    it("ランダムな会話を表示する", () => {
      const now = new Date();
      const names = ["ポチ", "タマ", "ゴロー", "ミケ", "ハナ"];

      // テストを書いた・修正が多い・忙しい，などの様子を混ぜる
      const activity = summarizeActivity(
        [
          ...Array.from({ length: 6 }, (_, index) => ({
            character_id: "active",
            event_type: index < 3 ? "commit_fix" : "commit_test",
            created_at: new Date(
              now.getTime() - index * 60 * 60 * 1000,
            ).toISOString(),
          })),
        ],
        now,
      );

      const output: string[] = [];

      for (let index = 0; index < SAMPLE_COUNT; index += 1) {
        const pick = <T,>(items: readonly T[]) =>
          items[Math.floor(Math.random() * items.length)];

        const speakerPersonality = pick(CHARACTER_PERSONALITIES);
        const listenerPersonality = pick(CHARACTER_PERSONALITIES);
        const speakerName = pick(names);
        const listenerName = pick(
          names.filter((name) => name !== speakerName),
        );

        const conversation = pickConversation({
          speaker: {
            personality: speakerPersonality,
            context: {
              name: speakerName,
              repositoryName: "demo",
              level: 1 + Math.floor(Math.random() * 6),
              currentXp: 0,
              requiredXp: 100,
              activity: undefined,
            },
          },
          listener: {
            personality: listenerPersonality,
            context: {
              name: listenerName,
              repositoryName: "demo",
              level: 1 + Math.floor(Math.random() * 6),
              currentXp: 0,
              requiredXp: 100,
              activity:
                Math.random() < 0.5 ? activity.active : undefined,
            },
          },
          now,
          random: Math.random,
          recentIds: new Set(),
        });

        const label = (name: string, personality: typeof speakerPersonality) =>
          `${name}（${PERSONALITY_INFO[personality].label}）`;

        output.push(
          `--- ${index + 1}. ${conversation.topicId}`,
          ...conversation.lines.map((line) =>
            line.by === "speaker"
              ? `${label(speakerName, speakerPersonality)}「${line.text}」`
              : `${label(listenerName, listenerPersonality)}「${line.text}」`,
          ),
        );
      }

      console.log(output.join("\n"));
    });
  },
);
