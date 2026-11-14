/*
 * リポジトリワールドで，キャラクターが言うセリフを選ぶ．
 */

import type { CharacterPersonality } from "../characters/personality";
import { SOLO_LINES } from "./lines/solo";
import {
  getEligibleSituations,
  getSlotValues,
  type SpeakerContext,
} from "./situations";

export type Line = {
  // 同じセリフが続けて出ないよう，覚えておくためのID
  id: string;
  text: string;
};

// {name} などの差し込みを，値に置き換える
export function fillSlots(
  template: string,
  values: Record<string, string>,
) {
  return template.replace(
    /\{(\w+)\}/g,
    (match, key: string) => values[key] ?? match,
  );
}

// 重みに応じて，1つ選ぶ
function pickWeighted<T extends { weight: number }>(
  items: T[],
  random: () => number,
): T {
  const total = items.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  let point = random() * total;

  for (const item of items) {
    point -= item.weight;

    if (point < 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

type PickSoloLineParams = {
  personality: CharacterPersonality;
  context: SpeakerContext;
  now: Date;
  random: () => number;
  // 最近出したセリフのID（これらはなるべく選ばない）
  recentIds: ReadonlySet<string>;
};

/*
 * 独り言を1つ選ぶ．
 * 今当てはまる場面から重みに応じて場面を選び，
 * その場面のセリフのうち，最近出していないものから選ぶ．
 */
export function pickSoloLine({
  personality,
  context,
  now,
  random,
  recentIds,
}: PickSoloLineParams): Line {
  const situation = pickWeighted(
    getEligibleSituations(context, now),
    random,
  ).id;

  const candidates = SOLO_LINES[personality][situation].map(
    (template, index) => ({
      id: `${personality}:${situation}:${index}`,
      template,
    }),
  );

  const fresh = candidates.filter(
    (candidate) => !recentIds.has(candidate.id),
  );

  // その場面のセリフを出し尽くした時は，全部から選び直す
  const pool = fresh.length > 0 ? fresh : candidates;
  const chosen = pool[Math.floor(random() * pool.length)];

  return {
    id: chosen.id,
    text: fillSlots(
      chosen.template,
      getSlotValues(situation, context, now),
    ),
  };
}
