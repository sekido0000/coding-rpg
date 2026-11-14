"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import { VillageScenery } from "@/components/world/village-scenery";
import { getCharacterEvolution } from "@/lib/characters/catalog";
import {
  getDepth,
  getInitialPosition,
  getWalkDuration,
  pickIdleTime,
  pickTarget,
  type Position,
} from "@/lib/world/movement";
import type { Character } from "@/types/character";

type RepositoryWorldProps = {
  characters: Character[];
};

type Walker = {
  position: Position;
  // 今の場所まで歩いてくるのにかける時間（ミリ秒）
  duration: number;
  isFacingLeft: boolean;
  // 次に歩き出す時刻
  nextMoveAt: number;
};

// 歩き出すかを確かめる間隔（ミリ秒）
const TICK_INTERVAL = 500;

// 最初に歩き出すまでの時間の最大（全員が同時に動き出さないようにずらす）
const FIRST_MOVE_DELAY = 3000;

// これより多い時は，キャラクターを小さく表示する
const CROWDED_COUNT = 12;

function getInitialWalker(
  index: number,
  total: number,
): Walker {
  return {
    position: getInitialPosition(index, total),
    duration: 0,
    isFacingLeft: false,
    nextMoveAt: 0,
  };
}

/*
 * 自分のキャラクター全員が暮らす世界．
 * キャラクターは歩き回り，押すとそのキャラクターの詳細画面へ移る．
 */
export function RepositoryWorld({
  characters,
}: RepositoryWorldProps) {
  const [walkers, setWalkers] = useState<
    Record<string, Walker>
  >({});

  const characterIds = characters
    .map((character) => character.id)
    .join(",");

  useEffect(() => {
    // 動きを減らす設定の人には，歩かせずに並べて表示する
    const reducesMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducesMotion) {
      return;
    }

    const ids = characterIds.split(",");

    const timer = window.setInterval(() => {
      // 別のタブを見ている間は動かさない
      if (document.hidden) {
        return;
      }

      const now = Date.now();

      setWalkers((current) => {
        const next = { ...current };
        let hasChanged = false;

        ids.forEach((id, index) => {
          const walker = current[id];

          // 初めての時は，少しずつずらして歩き出す
          if (!walker) {
            next[id] = {
              ...getInitialWalker(index, ids.length),
              nextMoveAt:
                now + Math.random() * FIRST_MOVE_DELAY,
            };
            hasChanged = true;
            return;
          }

          if (now < walker.nextMoveAt) {
            return;
          }

          const target = pickTarget(Math.random);
          const duration = getWalkDuration(
            walker.position,
            target,
          );

          next[id] = {
            position: target,
            duration,
            isFacingLeft:
              target.x < walker.position.x,
            nextMoveAt:
              now + duration + pickIdleTime(Math.random),
          };
          hasChanged = true;
        });

        return hasChanged ? next : current;
      });
    }, TICK_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [characterIds]);

  const isCrowded = characters.length > CROWDED_COUNT;

  return (
    <section
      aria-labelledby="repository-world-title"
      className="repo-stage relative mb-10 h-[340px] overflow-hidden rounded-[2rem] border border-emerald-400/15 sm:h-[420px]"
    >
      <div className="repo-moon" />
      <div className="repo-stars" />

      {/* 村の入り口の看板 */}
      <div className="absolute left-4 top-4 z-[110] sm:left-6 sm:top-5">
        <div className="rounded-lg border-2 border-[#4a2a14] bg-[#7a4a26] px-4 py-2 shadow-[0_4px_0_#3a200f,0_10px_18px_rgba(0,0,0,0.45)] sm:px-5 sm:py-2.5">
          <h2
            id="repository-world-title"
            className="text-lg font-black tracking-wide text-amber-50 [text-shadow:0_2px_0_#3a200f] sm:text-2xl"
          >
            リポジトリワールド
          </h2>
        </div>
        <p className="mt-2 text-xs text-slate-300 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
          キャラクターを押すと，詳細が見られます
        </p>
      </div>

      {/*
       * 歩ける範囲に合わせて地面を高くし，
       * 家を置けるよう上の端のカーブをゆるやかにする．
       */}
      <div
        className="repo-ground"
        style={{
          height: "40%",
          borderRadius: "50% 50% 0 0 / 12% 12% 0 0",
        }}
      />

      <VillageScenery />

      {characters.map((character, index) => {
        const walker =
          walkers[character.id] ??
          getInitialWalker(index, characters.length);

        const evolution = getCharacterEvolution(
          character.characterType,
          character.level,
        );

        const repositoryName =
          `${character.repositoryOwner}/${character.repositoryName}`;

        return (
          <Link
            key={character.id}
            href={`/repositories/${character.repositoryId}`}
            aria-label={`${character.name}（${repositoryName}・レベル${character.level}）の詳細を見る`}
            className="group absolute z-[var(--depth)] -translate-x-1/2 -translate-y-full rounded-xl outline-none hover:z-[100] focus-visible:z-[100] focus-visible:ring-2 focus-visible:ring-emerald-300"
            style={
              {
                left: `${walker.position.x}%`,
                top: `${walker.position.y}%`,
                transition: `left ${walker.duration}ms linear, top ${walker.duration}ms linear`,
                "--depth": getDepth(walker.position),
              } as CSSProperties
            }
          >
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/90 px-2.5 py-1.5 text-center text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="block font-bold">
                {character.name}
                <span className="ml-1.5 font-mono text-emerald-300">
                  Lv.{character.level}
                </span>
              </span>
              <span className="block text-slate-400">
                {repositoryName}
              </span>
            </span>

            <span
              className="repo-character-float block"
              // 全員が同じ調子で揺れないよう，揺れ始めをずらす
              style={{
                animationDelay: `${-index * 0.37}s`,
              }}
            >
              <Image
                src={evolution.imagePath}
                alt=""
                width={96}
                height={96}
                className={`repo-pixel-image block h-auto drop-shadow-[0_10px_8px_rgba(0,0,0,0.45)] ${
                  isCrowded
                    ? "w-14 sm:w-16"
                    : "w-20 sm:w-24"
                } ${walker.isFacingLeft ? "-scale-x-100" : ""}`}
              />
            </span>

            <span className="mx-auto -mt-1 block h-2 w-3/5 rounded-full bg-black/40 blur-[2px]" />
          </Link>
        );
      })}
    </section>
  );
}
