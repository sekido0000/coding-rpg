/*
 * リポジトリワールドで，2人のキャラクターがする会話を組み立てる．
 * 台本の仕組みは conversations/types.ts を参照．
 */

import type { CharacterPersonality } from "../characters/personality";
import { bugsTopic, busyTopic, testTopic } from "./conversations/topics-commits";
import {
  greetingTopic,
  levelTopic,
  snackTopic,
} from "./conversations/topics-daily";
import type { ConversationTopic } from "./conversations/types";
import type { SpeakerContext } from "./situations";
import { fillSlots } from "./speech";

export const CONVERSATION_TOPICS: ConversationTopic[] = [
  testTopic,
  bugsTopic,
  busyTopic,
  levelTopic,
  greetingTopic,
  snackTopic,
];

export type Talker = {
  personality: CharacterPersonality;
  context: SpeakerContext;
};

export type ConversationLine = {
  // 話すのは，話しかけた側（speaker）か，話しかけられた側（listener）か
  by: "speaker" | "listener";
  id: string;
  text: string;
};

export type Conversation = {
  topicId: string;
  lines: ConversationLine[];
};

type PickConversationParams = {
  speaker: Talker;
  listener: Talker;
  now: Date;
  random: () => number;
  // 最近出した話題やセリフのID（これらはなるべく選ばない）
  recentIds: ReadonlySet<string>;
};

// 最近出していないものから1つ選ぶ（出し尽くした時は全部から選ぶ）
function pickFresh<T extends { id: string }>(
  items: T[],
  recentIds: ReadonlySet<string>,
  random: () => number,
): T {
  const fresh = items.filter((item) => !recentIds.has(item.id));
  const pool = fresh.length > 0 ? fresh : items;

  return pool[Math.floor(random() * pool.length)];
}

function pickLine(
  lines: string[],
  idPrefix: string,
  recentIds: ReadonlySet<string>,
  random: () => number,
) {
  return pickFresh(
    lines.map((template, index) => ({
      id: `${idPrefix}:${index}`,
      template,
    })),
    recentIds,
    random,
  );
}

export function getTopicId(topic: ConversationTopic) {
  return `topic:${topic.id}`;
}

/*
 * 会話を1つ組み立てる．
 * 話題を選び，話しかけられた側の答えを決めてから，
 * 話しかけ・返事・締めを，それぞれの性格の言い回しから選ぶ．
 */
export function pickConversation({
  speaker,
  listener,
  now,
  random,
  recentIds,
}: PickConversationParams): Conversation {
  const topic = pickFresh(
    CONVERSATION_TOPICS.map((item) => ({
      ...item,
      id: getTopicId(item),
      topic: item,
    })),
    recentIds,
    random,
  ).topic;

  const answer = topic.answer(
    speaker.context,
    listener.context,
    now,
    random,
  );

  const opener = pickLine(
    topic.opener[speaker.personality],
    `talk:${topic.id}:opener:${speaker.personality}`,
    recentIds,
    random,
  );

  const reply = pickLine(
    topic.reply[answer][listener.personality],
    `talk:${topic.id}:reply:${answer}:${listener.personality}`,
    recentIds,
    random,
  );

  const closer = pickLine(
    topic.closer[answer][speaker.personality],
    `talk:${topic.id}:closer:${answer}:${speaker.personality}`,
    recentIds,
    random,
  );

  return {
    topicId: getTopicId(topic),
    lines: [
      {
        by: "speaker",
        id: opener.id,
        text: fillSlots(opener.template, {
          partner: listener.context.name,
        }),
      },
      {
        by: "listener",
        id: reply.id,
        text: fillSlots(reply.template, {
          partner: speaker.context.name,
          level: String(listener.context.level),
        }),
      },
      {
        by: "speaker",
        id: closer.id,
        text: fillSlots(closer.template, {
          partner: listener.context.name,
        }),
      },
    ],
  };
}
