"use client";

import { useEffect, useRef, useState } from "react";

import {
  getRecentLineIds,
  rememberLineId,
  type Speech,
} from "@/components/world/use-speeches";
import { getTotalXp } from "@/lib/growth/level";
import type { ActivitySummary } from "@/lib/world/activity";
import { pickLineForSituation } from "@/lib/world/speech";
import type { Character } from "@/types/character";

export type GrowthReaction = {
  // 同じキャラクターに続けて経験値が入った時に，演出をやり直すためのキー
  key: number;
  xp: number;
  isLevelUp: boolean;
};

// 世界の上の方に出す，経験値が入ったことのお知らせ
export type GrowthAnnouncement = {
  key: number;
  text: string;
  isLevelUp: boolean;
};

// 「+XP」やレベルアップの光を出しておく時間（ミリ秒）
const REACTION_DURATION = 4000;

// お知らせを出しておく時間（ミリ秒．CSS の world-announce と合わせる）
const ANNOUNCEMENT_DURATION = 4000;

// 経験値が入った時のセリフを出しておく時間（ミリ秒）
const REACTION_SPEECH_DURATION = 6000;

type Say = (
  characterId: string,
  text: string,
  duration?: number,
  kind?: Speech["kind"],
) => void;

/*
 * push で経験値が入ったことに反応する．
 *
 * ホームの Realtime でキャラクターが更新されると，characters が変わる．
 * 前の値と比べて経験値が増えたキャラクターに「+XP」を浮かべ，
 * 性格に合ったセリフを言わせる．レベルが上がった時は光らせる．
 * 世界の上の方にも，誰が何XP得たかのお知らせを出す．
 */
export function useGrowthReactions(
  characters: Character[],
  activity: Record<string, ActivitySummary>,
  say: Say,
) {
  const [reactions, setReactions] = useState<
    Record<string, GrowthReaction>
  >({});

  const [announcement, setAnnouncement] =
    useState<GrowthAnnouncement | null>(null);

  const previousRef = useRef(
    new Map(
      characters.map((character) => [character.id, character]),
    ),
  );

  /*
   * 演出を消すタイマー．続けて更新が来ても途中で止めないよう，
   * 更新のたびではなく，画面を離れた時にだけ止める．
   */
  const timersRef = useRef(new Set<number>());

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    const previous = previousRef.current;
    const timers = timersRef.current;

    for (const character of characters) {
      const before = previous.get(character.id);

      if (!before) {
        continue;
      }

      const gainedXp =
        getTotalXp(character.level, character.currentXp) -
        getTotalXp(before.level, before.currentXp);

      if (gainedXp <= 0) {
        continue;
      }

      const isLevelUp = character.level > before.level;
      const key = Date.now();

      setReactions((current) => ({
        ...current,
        [character.id]: { key, xp: gainedXp, isLevelUp },
      }));

      const timer = window.setTimeout(() => {
        timers.delete(timer);
        setReactions((current) => {
          // 次の経験値で演出がやり直されていたら，そちらは消さない
          if (current[character.id]?.key !== key) {
            return current;
          }

          const next = { ...current };
          delete next[character.id];
          return next;
        });
      }, REACTION_DURATION);

      timers.add(timer);

      const line = pickLineForSituation({
        personality: character.personality,
        situation: isLevelUp ? "just_leveled" : "gained_xp",
        context: {
          name: character.name,
          repositoryName: character.repositoryName,
          level: character.level,
          currentXp: character.currentXp,
          requiredXp: character.requiredXp,
          activity: activity[character.id],
        },
        now: new Date(),
        random: Math.random,
        recentIds: getRecentLineIds(),
        extraSlots: { xp: String(gainedXp) },
      });

      rememberLineId(line.id);
      say(
        character.id,
        line.text,
        REACTION_SPEECH_DURATION,
        "reaction",
      );

      setAnnouncement({
        key,
        text: isLevelUp
          ? `${character.name}がレベル${character.level}に進化！`
          : `${character.name}が ${gainedXp} XP 獲得！`,
        isLevelUp,
      });

      const announcementTimer = window.setTimeout(() => {
        timers.delete(announcementTimer);
        setAnnouncement((current) =>
          current?.key === key ? null : current,
        );
      }, ANNOUNCEMENT_DURATION);

      timers.add(announcementTimer);
    }

    previousRef.current = new Map(
      characters.map((character) => [character.id, character]),
    );
  }, [characters, activity, say]);

  return { reactions, announcement };
}
