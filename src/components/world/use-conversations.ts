"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

import {
  getRecentLineIds,
  rememberLineId,
} from "@/components/world/use-speeches";
import type { ActivitySummary } from "@/lib/world/activity";
import {
  pickConversation,
  type Talker,
} from "@/lib/world/conversation";
import type { Position } from "@/lib/world/movement";
import type { Character } from "@/types/character";

export type ConversationWalker = {
  position: Position;
  isFacingLeft: boolean;
  // 目的地に着く時刻
  arrivedAt: number;
  // 次に歩き出す時刻（会話中は Infinity にして止める）
  nextMoveAt: number;
};

// 会話を始めるか確かめる間隔（ミリ秒）
const CHECK_INTERVAL = 1500;

// この距離（%）より近くで立ち止まっている2人が会話する
const TALK_DISTANCE = 22;

// 近くにいても，すぐには話しかけない（確かめるたびにこの確率で始める）
const START_CHANCE = 0.5;

// 1人のキャラクターが，次に会話するまで空ける時間（ミリ秒）
const TALK_COOLDOWN = 25000;

// 会話のセリフを出す間隔と，出しておく時間（ミリ秒）
const LINE_GAP = 3300;
const LINE_DURATION = 3100;

type UseConversationsParams<T extends ConversationWalker> = {
  characters: Character[];
  activity: Record<string, ActivitySummary>;
  walkersRef: RefObject<Record<string, T>>;
  setWalkers: Dispatch<SetStateAction<Record<string, T>>>;
  say: (characterId: string, text: string, duration?: number) => void;
  setBusy: (characterIds: string[], isBusy: boolean) => void;
  isSpeaking: (characterId: string) => boolean;
};

function toTalker(
  character: Character,
  activity: Record<string, ActivitySummary>,
): Talker {
  return {
    personality: character.personality,
    context: {
      name: character.name,
      repositoryName: character.repositoryName,
      level: character.level,
      currentXp: character.currentXp,
      requiredXp: character.requiredXp,
      activity: activity[character.id],
    },
  };
}

/*
 * 近くで立ち止まった2人に会話をさせる．
 *
 * 会話の間は2人とも歩くのをやめ，向かい合って，
 * 「話しかけ → 返事 → 締め」を順に吹き出しで出す．
 * 終わったら，また歩き出す．
 */
export function useConversations<T extends ConversationWalker>({
  characters,
  activity,
  walkersRef,
  setWalkers,
  say,
  setBusy,
  isSpeaking,
}: UseConversationsParams<T>) {
  // タイマーの中から最新の値を読むために，参照でも持っておく
  const charactersRef = useRef(characters);
  const activityRef = useRef(activity);

  useEffect(() => {
    charactersRef.current = characters;
    activityRef.current = activity;
  }, [characters, activity]);

  useEffect(() => {
    let isTalking = false;
    const lastTalkAt = new Map<string, number>();
    const timers = new Set<number>();

    const later = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);

      timers.add(timer);
    };

    const canTalk = (character: Character, now: number) => {
      const walker = walkersRef.current[character.id];

      return (
        !!walker &&
        now >= walker.arrivedAt &&
        Number.isFinite(walker.nextMoveAt) &&
        !isSpeaking(character.id) &&
        now - (lastTalkAt.get(character.id) ?? 0) >=
          TALK_COOLDOWN
      );
    };

    const findPair = (now: number) => {
      const ready = charactersRef.current.filter((character) =>
        canTalk(character, now),
      );

      for (let i = 0; i < ready.length; i += 1) {
        for (let j = i + 1; j < ready.length; j += 1) {
          const a = walkersRef.current[ready[i].id];
          const b = walkersRef.current[ready[j].id];

          if (
            Math.hypot(
              a.position.x - b.position.x,
              a.position.y - b.position.y,
            ) <= TALK_DISTANCE
          ) {
            // どちらが話しかけるかは毎回変える
            return Math.random() < 0.5
              ? [ready[i], ready[j]]
              : [ready[j], ready[i]];
          }
        }
      }

      return null;
    };

    const startConversation = (
      speaker: Character,
      listener: Character,
    ) => {
      isTalking = true;
      const ids = [speaker.id, listener.id];

      setBusy(ids, true);

      // 2人とも止めて，向かい合わせる
      setWalkers((current) => {
        const a = current[speaker.id];
        const b = current[listener.id];

        if (!a || !b) {
          return current;
        }

        return {
          ...current,
          [speaker.id]: {
            ...a,
            nextMoveAt: Infinity,
            isFacingLeft: b.position.x < a.position.x,
          },
          [listener.id]: {
            ...b,
            nextMoveAt: Infinity,
            isFacingLeft: a.position.x < b.position.x,
          },
        };
      });

      const recentIds = getRecentLineIds();
      const conversation = pickConversation({
        speaker: toTalker(speaker, activityRef.current),
        listener: toTalker(listener, activityRef.current),
        now: new Date(),
        random: Math.random,
        recentIds,
      });

      rememberLineId(conversation.topicId);

      conversation.lines.forEach((line, index) => {
        later(() => {
          rememberLineId(line.id);
          say(
            line.by === "speaker" ? speaker.id : listener.id,
            line.text,
            LINE_DURATION,
          );
        }, index * LINE_GAP);
      });

      // 会話が終わったら，また歩き出す
      later(() => {
        const now = Date.now();

        setBusy(ids, false);
        ids.forEach((id) => lastTalkAt.set(id, now));

        setWalkers((current) => {
          const next = { ...current };

          for (const id of ids) {
            if (next[id]) {
              next[id] = {
                ...next[id],
                nextMoveAt: now + 500 + Math.random() * 2000,
              };
            }
          }

          return next;
        });

        isTalking = false;
      }, conversation.lines.length * LINE_GAP);
    };

    const interval = window.setInterval(() => {
      if (isTalking || document.hidden) {
        return;
      }

      const pair = findPair(Date.now());

      if (pair && Math.random() < START_CHANCE) {
        startConversation(pair[0], pair[1]);
      }
    }, CHECK_INTERVAL);

    return () => {
      window.clearInterval(interval);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [walkersRef, setWalkers, say, setBusy, isSpeaking]);
}
