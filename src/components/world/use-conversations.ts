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
  type Speech,
} from "@/components/world/use-speeches";
import type { ActivitySummary } from "@/lib/world/activity";
import {
  pickConversation,
  type Talker,
} from "@/lib/world/conversation";
import {
  getWalkDuration,
  type Position,
} from "@/lib/world/movement";
import type { Character } from "@/types/character";

export type ConversationWalker = {
  position: Position;
  // 今の場所まで歩いてくるのにかける時間（ミリ秒）
  duration: number;
  isFacingLeft: boolean;
  // 目的地に着く時刻
  arrivedAt: number;
  // 次に歩き出す時刻（会話中は Infinity にして止める）
  nextMoveAt: number;
  // この先に通る場所（道に沿って歩いている途中）
  route?: Position[];
  // 建物の中にいる間は，この時刻まで外に出てこない
  insideUntil?: number;
};

// 会話を始めるか確かめる間隔（ミリ秒）
const CHECK_INTERVAL = 1500;

// この距離（ピクセル）より近くで，同じ道に立ち止まっている2人が，歩み寄って会話する
const TALK_DISTANCE = 360;

// 会話する時に並ぶ，2人の間の距離（ピクセル）
const MEETING_GAP = 64;

// 歩み寄ってから話し始めるまでの間（ミリ秒）
const MEETING_PAUSE = 400;

// 近くにいても，すぐには話しかけない（確かめるたびにこの確率で始める）
const START_CHANCE = 0.5;

// 1人のキャラクターが，次に会話するまで空ける時間（ミリ秒）
const TALK_COOLDOWN = 25000;

// 会話のセリフを出す間隔と，最後のセリフを出しておく時間（ミリ秒）
const LINE_GAP = 3000;
const LAST_LINE_DURATION = 3500;

/*
 * 2人が会話する時に並ぶ場所．
 * 2人の真ん中を中心に，今の左右の並びを保ったまま横に並べる．
 * 2人は同じ道の上にいるので，並ぶ場所も道の上になる．
 */
function getMeetingPositions(a: Position, b: Position) {
  const centerX = (a.x + b.x) / 2;
  const y = (a.y + b.y) / 2;
  const aIsLeft = a.x <= b.x;

  return {
    a: {
      x: centerX + (aIsLeft ? -1 : 1) * (MEETING_GAP / 2),
      y,
    },
    b: {
      x: centerX + (aIsLeft ? 1 : -1) * (MEETING_GAP / 2),
      y,
    },
  };
}

type UseConversationsParams<T extends ConversationWalker> = {
  characters: Character[];
  activity: Record<string, ActivitySummary>;
  walkersRef: RefObject<Record<string, T>>;
  setWalkers: Dispatch<SetStateAction<Record<string, T>>>;
  say: (
    characterId: string,
    text: string,
    duration?: number,
    kind?: Speech["kind"],
  ) => void;
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
        // 道を歩いている途中や，建物の中にいる時は話さない
        !walker.route?.length &&
        !((walker.insideUntil ?? 0) > now) &&
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

          // 同じ道の上で，近くにいる2人
          if (
            a.position.y === b.position.y &&
            Math.abs(a.position.x - b.position.x) <= TALK_DISTANCE
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

      /*
       * 会話していると分かるよう，2人を真ん中あたりへ歩み寄らせ，
       * 並んで向かい合わせてから話し始める．
       */
      const now = Date.now();
      const a = walkersRef.current[speaker.id];
      const b = walkersRef.current[listener.id];
      const meeting = getMeetingPositions(a.position, b.position);
      const walkTime = Math.max(
        getWalkDuration(a.position, meeting.a),
        getWalkDuration(b.position, meeting.b),
      );

      setWalkers((current) => {
        if (!current[speaker.id] || !current[listener.id]) {
          return current;
        }

        return {
          ...current,
          [speaker.id]: {
            ...current[speaker.id],
            position: meeting.a,
            duration: getWalkDuration(a.position, meeting.a),
            isFacingLeft: meeting.b.x < meeting.a.x,
            arrivedAt: now + walkTime,
            nextMoveAt: Infinity,
          },
          [listener.id]: {
            ...current[listener.id],
            position: meeting.b,
            duration: getWalkDuration(b.position, meeting.b),
            isFacingLeft: meeting.a.x < meeting.b.x,
            arrivedAt: now + walkTime,
            nextMoveAt: Infinity,
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

      // 歩み寄ってから話し始め，最後のセリフを読み終えたら終わる
      const startAt = walkTime + MEETING_PAUSE;
      const endAt =
        startAt +
        (conversation.lines.length - 1) * LINE_GAP +
        LAST_LINE_DURATION;

      /*
       * 吹き出しは会話が終わるまで残し，やり取りとして読めるようにする．
       * 同じキャラクターの次のセリフが出ると，前のセリフと入れ替わる．
       */
      conversation.lines.forEach((line, index) => {
        const lineAt = startAt + index * LINE_GAP;

        later(() => {
          rememberLineId(line.id);
          say(
            line.by === "speaker" ? speaker.id : listener.id,
            line.text,
            endAt - lineAt,
            "talk",
          );
        }, lineAt);
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
      }, endAt);
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
