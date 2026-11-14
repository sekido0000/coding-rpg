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

// 同時に吹き出しを出すキャラクターの最大
const MAX_SPEAKERS = 2;

// 次の独り言までの間隔（ミリ秒）
const SPEAK_INTERVAL = {
  min: 2500,
  max: 6000,
} as const;

// 吹き出しを出しておく時間（ミリ秒）
export const SPEECH_DURATION = 5000;

// 画面を開いてから最初の独り言までの時間（ミリ秒）
const FIRST_SPEECH_DELAY = 1500;

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
    Record<string, string>
  >({});

  // タイマーの中から最新の値を読むために，参照でも持っておく
  const charactersRef = useRef(characters);
  const activityRef = useRef(activity);
  const speechesRef = useRef(speeches);
  const hideTimersRef = useRef(new Map<string, number>());

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
    ) => {
      const timers = hideTimersRef.current;

      window.clearTimeout(timers.get(characterId));

      setSpeeches((current) => ({
        ...current,
        [characterId]: text,
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
        (character) => !speaking[character.id],
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

  return { speeches, say };
}
