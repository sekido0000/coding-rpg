"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { ActivitySummary } from "@/lib/world/activity";
import { pickSoloLine } from "@/lib/world/speech";
import type { Character } from "@/types/character";

// 吹き出しがこの数以上出ている時は，独り言を始めない（会話中も含む）
const MAX_SPEAKERS = 1;

// 次の独り言までの間隔（ミリ秒）
const SPEAK_INTERVAL = {
  min: 9000,
  max: 16000,
} as const;

// 吹き出しを出しておく時間（ミリ秒）
export const SPEECH_DURATION = 5000;

// 画面を開いてから最初の独り言までの時間（ミリ秒）
const FIRST_SPEECH_DELAY = 3000;

/*
 * 最近出したセリフを，見ている人のブラウザに覚えておく．
 * 使うたびに同じセリフばかりにならないようにするため．
 * 保存できない環境（プライベートウィンドウなど）でも動くようにする．
 */
const RECENT_LINES_KEY = "coding-rpg:recent-lines";
const RECENT_LINES_LIMIT = 80;

function loadRecentLineIds(): string[] {
  try {
    const value = window.localStorage.getItem(RECENT_LINES_KEY);
    const ids: unknown = value ? JSON.parse(value) : [];

    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function rememberLineId(id: string) {
  try {
    const ids = [...loadRecentLineIds(), id].slice(
      -RECENT_LINES_LIMIT,
    );

    window.localStorage.setItem(
      RECENT_LINES_KEY,
      JSON.stringify(ids),
    );
  } catch {
    // 覚えられなくても，セリフは出せる
  }
}

export function getRecentLineIds() {
  return new Set(loadRecentLineIds());
}

/*
 * 吹き出しの中身．種類ごとに色を変えて見分けられるようにする．
 * solo：独り言，talk：会話，reaction：経験値が入った時の反応
 */
export type Speech = {
  text: string;
  kind: "solo" | "talk" | "reaction";
};

function randomBetween({ min, max }: { min: number; max: number }) {
  return min + Math.random() * (max - min);
}

/*
 * キャラクターの吹き出しを管理する．
 * 数秒ごとに誰か1人が独り言を言い，しばらくすると消える．
 * say を使うと，好きなキャラクターに好きなセリフを言わせられる．
 */
export function useSpeeches(
  characters: Character[],
  activity: Record<string, ActivitySummary>,
) {
  const [speeches, setSpeeches] = useState<
    Record<string, Speech>
  >({});

  // タイマーの中から最新の値を読むために，参照でも持っておく
  const charactersRef = useRef(characters);
  const activityRef = useRef(activity);
  const speechesRef = useRef(speeches);
  const hideTimersRef = useRef(new Map<string, number>());

  // 会話中のキャラクター．会話の途中で独り言を言わないようにする
  const busyIdsRef = useRef(new Set<string>());

  useEffect(() => {
    charactersRef.current = characters;
    activityRef.current = activity;
  }, [characters, activity]);

  useEffect(() => {
    speechesRef.current = speeches;
  }, [speeches]);

  const say = useCallback(
    (
      characterId: string,
      text: string,
      duration = SPEECH_DURATION,
      kind: Speech["kind"] = "solo",
    ) => {
      const timers = hideTimersRef.current;

      window.clearTimeout(timers.get(characterId));

      setSpeeches((current) => ({
        ...current,
        [characterId]: { text, kind },
      }));

      timers.set(
        characterId,
        window.setTimeout(() => {
          timers.delete(characterId);
          setSpeeches((current) => {
            const next = { ...current };
            delete next[characterId];
            return next;
          });
        }, duration),
      );
    },
    [],
  );

  useEffect(() => {
    let timer: number;

    const speak = () => {
      const speaking = speechesRef.current;
      const candidates = charactersRef.current.filter(
        (character) =>
          !speaking[character.id] &&
          !busyIdsRef.current.has(character.id),
      );

      // 別のタブを見ている間や，吹き出しが多い時は話さない
      if (
        !document.hidden &&
        Object.keys(speaking).length < MAX_SPEAKERS &&
        candidates.length > 0
      ) {
        const character =
          candidates[
            Math.floor(Math.random() * candidates.length)
          ];

        const line = pickSoloLine({
          personality: character.personality,
          context: {
            name: character.name,
            repositoryName: character.repositoryName,
            level: character.level,
            currentXp: character.currentXp,
            requiredXp: character.requiredXp,
            activity: activityRef.current[character.id],
          },
          now: new Date(),
          random: Math.random,
          recentIds: getRecentLineIds(),
        });

        rememberLineId(line.id);
        say(character.id, line.text);
      }

      timer = window.setTimeout(
        speak,
        randomBetween(SPEAK_INTERVAL),
      );
    };

    timer = window.setTimeout(speak, FIRST_SPEECH_DELAY);

    const hideTimers = hideTimersRef.current;

    return () => {
      window.clearTimeout(timer);
      hideTimers.forEach((hideTimer) =>
        window.clearTimeout(hideTimer),
      );
      hideTimers.clear();
    };
  }, [say]);

  // 会話を始める・終える時に呼ぶ
  const setBusy = useCallback(
    (characterIds: string[], isBusy: boolean) => {
      for (const id of characterIds) {
        if (isBusy) {
          busyIdsRef.current.add(id);
        } else {
          busyIdsRef.current.delete(id);
        }
      }
    },
    [],
  );

  const isSpeaking = useCallback(
    (characterId: string) =>
      !!speechesRef.current[characterId] ||
      busyIdsRef.current.has(characterId),
    [],
  );

  return { speeches, say, setBusy, isSpeaking };
}
