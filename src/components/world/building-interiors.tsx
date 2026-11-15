"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

import { EquipmentLayers } from "@/components/items/equipment-layers";
import {
  BOOKSHELF,
  PLANT,
  Pixels,
  Placed,
  Room,
  WINDOW,
  type Rect,
} from "@/components/world/interiors";
import {
  BUILDING_CATALOG,
  type BuildingId,
} from "@/lib/buildings/catalog";
import { getCharacterEvolution } from "@/lib/characters/catalog";
import type { Character } from "@/types/character";

/*
 * 建てた建物の中の様子．
 * 建物ごとに，壁と床・家具・立ち寄ったキャラクターが過ごす場所を決めておき，
 * 1つの部品で描く．
 */

/* ---------- 家具 ---------- */

// 長いカウンター（ラーメン屋台）
const LONG_COUNTER: Rect[] = [
  [0, 0, 60, 3, "#ca8a04"],
  [0, 3, 60, 9, "#a16207"],
  [0, 7, 60, 1, "#854d0e"],
];

// どんぶり
const BOWL: Rect[] = [
  [0, 0, 8, 1, "#fde68a"],
  [0, 1, 8, 3, "#f8fafc"],
  [1, 4, 6, 1, "#e2e8f0"],
  [1, 1, 2, 1, "#f97316"],
];

// のれん
const NOREN: Rect[] = [
  [0, 0, 40, 1, "#78350f"],
  [1, 1, 12, 8, "#1e3a8a"],
  [14, 1, 12, 8, "#1e3a8a"],
  [27, 1, 12, 8, "#1e3a8a"],
  [5, 3, 4, 4, "#f8fafc"],
  [18, 3, 4, 4, "#f8fafc"],
  [31, 3, 4, 4, "#f8fafc"],
];

// 丸いテーブルとカップ（カフェ）
const CAFE_TABLE: Rect[] = [
  [0, 0, 16, 3, "#f8fafc"],
  [6, 3, 4, 9, "#78350f"],
  [3, 12, 10, 2, "#451a03"],
  [3, -2, 3, 2, "#f8fafc"],
];

// コーヒーメーカーの置かれた棚
const COFFEE_BAR: Rect[] = [
  [0, 6, 30, 10, "#78350f"],
  [0, 6, 30, 2, "#a16207"],
  [3, 0, 8, 6, "#1e293b"],
  [5, 2, 4, 2, "#ef4444"],
  [14, 2, 4, 4, "#f8fafc"],
  [20, 2, 4, 4, "#f8fafc"],
];

// 読書机（図書館）
const READING_DESK: Rect[] = [
  [0, 0, 30, 3, "#a16207"],
  [2, 3, 2, 8, "#78350f"],
  [26, 3, 2, 8, "#78350f"],
  [6, -3, 6, 3, "#3b82f6"],
  [18, -2, 5, 2, "#22c55e"],
  [24, -6, 3, 6, "#fde68a"],
];

// ゲーム機
const ARCADE_MACHINE: Rect[] = [
  [0, 0, 14, 24, "#312e81"],
  [1, 1, 12, 3, "#f472b6"],
  [2, 5, 10, 8, "#0f172a"],
  [0, 14, 14, 3, "#4338ca"],
  [3, 14, 2, 2, "#ef4444"],
  [8, 14, 2, 2, "#22d3ee"],
  [10, 14, 2, 2, "#facc15"],
];

// ごちそうの並んだテーブル（レストラン）
const DINNER_TABLE: Rect[] = [
  [0, 0, 32, 4, "#fef2f2"],
  [0, 4, 32, 4, "#fecaca"],
  [3, 8, 2, 8, "#78350f"],
  [27, 8, 2, 8, "#78350f"],
  [4, -3, 8, 3, "#f8fafc"],
  [5, -4, 6, 1, "#f97316"],
  [20, -3, 8, 3, "#f8fafc"],
  [21, -4, 6, 1, "#16a34a"],
  [15, -7, 2, 7, "#fef3c7"],
  [15, -8, 2, 1, "#f59e0b"],
];

// 実験台とフラスコ（研究所）
const LAB_BENCH: Rect[] = [
  [0, 0, 40, 3, "#e2e8f0"],
  [0, 3, 40, 10, "#94a3b8"],
  [2, 5, 36, 1, "#64748b"],
  [4, -6, 4, 6, "#4ade80"],
  [5, -8, 2, 2, "#e2e8f0"],
  [14, -5, 5, 5, "#a855f7"],
  [15, -7, 3, 2, "#e2e8f0"],
  [26, -9, 6, 9, "#38bdf8"],
  [28, -11, 2, 2, "#e2e8f0"],
];

// 光る機械（研究所）
const LAB_MACHINE: Rect[] = [
  [0, 0, 16, 22, "#475569"],
  [2, 2, 12, 6, "#0f172a"],
  [3, 3, 4, 1, "#4ade80"],
  [3, 5, 8, 1, "#22d3ee"],
  [3, 10, 3, 3, "#ef4444"],
  [7, 10, 3, 3, "#facc15"],
  [11, 10, 3, 3, "#4ade80"],
];

// 大きな噴水とベンチ（公園）
const BIG_FOUNTAIN: Rect[] = [
  [17, 0, 6, 3, "#bae6fd"],
  [12, 2, 5, 3, "#bae6fd"],
  [23, 2, 5, 3, "#bae6fd"],
  [18, 3, 4, 12, "#cbd5e1"],
  [2, 12, 36, 12, "#94a3b8"],
  [4, 14, 32, 6, "#38bdf8"],
  [4, 14, 32, 2, "#7dd3fc"],
];

const PARK_BENCH: Rect[] = [
  [0, 0, 24, 2, "#92400e"],
  [0, 2, 24, 2, "#78350f"],
  [0, 6, 24, 2, "#b45309"],
  [2, 8, 2, 4, "#451a03"],
  [20, 8, 2, 4, "#451a03"],
];

/* ---------- 建物ごとの部屋 ---------- */

type VisitSpot = {
  left: number;
  bottom: number;
  width: number;
  // その場所での動き（CSS のクラス）
  motion: string;
};

type InteriorConfig = {
  wall: string;
  floor: string;
  // 家具（壁や床に置くもの）
  furniture: ReactNode;
  // 立ち寄ったキャラクターが過ごす場所（左から順に使う）
  spots: VisitSpot[];
  // 中で何をしているか（「〇〇は〜」に続く言葉）
  doing: string;
  // キャラクターより手前に置くもの（カウンターや机など）
  front?: ReactNode;
};

function Steam({ left, bottom }: { left: number; bottom: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute"
      style={{ left: `${left}%`, bottom: `${bottom}%` }}
    >
      {[0, 1].map((index) => (
        <span
          key={index}
          className="interior-steam absolute block h-3 w-1.5 rounded-full bg-white/70"
          style={{ left: index * 8, animationDelay: `${index * 0.7}s` }}
        />
      ))}
    </span>
  );
}

const INTERIORS: Record<BuildingId, InteriorConfig> = {
  ramen_stall: {
    wall: "linear-gradient(#7f1d1d, #991b1b)",
    floor: "repeating-linear-gradient(90deg, #57534e 0 30px, #44403c 30px 32px)",
    furniture: (
      <>
        <Placed left={10} bottom={72} width={80}>
          <Pixels width={40} height={9} rects={NOREN} />
        </Placed>
        <div className="absolute left-[8%] top-[46%] rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-red-800 sm:text-xs">
          しょうゆ ¥600
        </div>
        <div className="absolute right-[8%] top-[46%] rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-red-800 sm:text-xs">
          みそ ¥700
        </div>
      </>
    ),
    front: (
      <>
        <Placed left={5} bottom={4} width={90}>
          <Pixels width={60} height={12} rects={LONG_COUNTER} />
        </Placed>
        {[18, 40, 62].map((left) => (
          <span key={left}>
            <Placed left={left} bottom={22} width={10}>
              <Pixels width={8} height={5} rects={BOWL} />
            </Placed>
            <Steam left={left + 3} bottom={28} />
          </span>
        ))}
      </>
    ),
    spots: [
      { left: 16, bottom: 14, width: 13, motion: "room-typing" },
      { left: 38, bottom: 14, width: 13, motion: "room-typing" },
      { left: 60, bottom: 14, width: 13, motion: "room-typing" },
    ],
    doing: "ラーメンを食べています",
  },
  fountain: {
    wall: "linear-gradient(#7dd3fc, #bae6fd)",
    floor: "repeating-linear-gradient(45deg, #4d7c0f 0 14px, #4a7a12 14px 28px)",
    furniture: (
      <>
        <Placed left={30} bottom={28} width={40}>
          <Pixels width={40} height={24} rects={BIG_FOUNTAIN} />
        </Placed>
        <Placed left={4} bottom={10} width={22}>
          <Pixels width={24} height={12} rects={PARK_BENCH} />
        </Placed>
        <Placed left={74} bottom={10} width={22}>
          <Pixels width={24} height={12} rects={PARK_BENCH} />
        </Placed>
      </>
    ),
    spots: [
      { left: 8, bottom: 14, width: 12, motion: "repo-character-float" },
      { left: 78, bottom: 14, width: 12, motion: "repo-character-float" },
      { left: 44, bottom: 6, width: 12, motion: "room-stretch" },
    ],
    doing: "噴水のそばでひと休みしています",
  },
  cafe: {
    wall: "repeating-linear-gradient(90deg, #fef3c7 0 24px, #fde68a 24px 48px)",
    floor: "repeating-conic-gradient(#78350f 0 25%, #92400e 0 50%) 0 0 / 36px 36px",
    furniture: (
      <>
        <Placed left={40} bottom={66} width={16}>
          <Pixels width={14} height={10} rects={WINDOW} />
        </Placed>
        <Placed left={68} bottom={40} width={28}>
          <Pixels width={30} height={16} rects={COFFEE_BAR} />
        </Placed>
        <Placed left={4} bottom={44} width={7}>
          <Pixels width={8} height={9} rects={PLANT} />
        </Placed>
      </>
    ),
    front: (
      <>
        <Placed left={12} bottom={8} width={16}>
          <Pixels width={16} height={14} rects={CAFE_TABLE} />
        </Placed>
        <Placed left={44} bottom={8} width={16}>
          <Pixels width={16} height={14} rects={CAFE_TABLE} />
        </Placed>
      </>
    ),
    spots: [
      { left: 4, bottom: 10, width: 12, motion: "repo-character-float" },
      { left: 26, bottom: 10, width: 12, motion: "repo-character-float" },
      { left: 36, bottom: 10, width: 12, motion: "repo-character-float" },
      { left: 58, bottom: 10, width: 12, motion: "repo-character-float" },
    ],
    doing: "コーヒーを飲んでいます",
  },
  library: {
    wall: "linear-gradient(#78350f, #92400e)",
    floor: "repeating-linear-gradient(0deg, #a16207 0 22px, #854d0e 22px 24px)",
    furniture: (
      <>
        {[4, 20, 66, 82].map((left) => (
          <Placed key={left} left={left} bottom={40} width={14}>
            <Pixels width={14} height={20} rects={BOOKSHELF} />
          </Placed>
        ))}
        <Placed left={40} bottom={64} width={16}>
          <Pixels width={14} height={10} rects={WINDOW} />
        </Placed>
      </>
    ),
    front: (
      <Placed left={30} bottom={10} width={40}>
        <Pixels width={30} height={11} rects={READING_DESK} />
      </Placed>
    ),
    spots: [
      { left: 33, bottom: 12, width: 12, motion: "repo-character-float" },
      { left: 55, bottom: 12, width: 12, motion: "repo-character-float" },
      { left: 8, bottom: 14, width: 12, motion: "room-walk" },
      { left: 80, bottom: 14, width: 12, motion: "repo-character-float" },
    ],
    doing: "本を読んでいます",
  },
  arcade: {
    wall: "linear-gradient(#1e1b4b, #312e81)",
    floor: "repeating-conic-gradient(#1e1b4b 0 25%, #3730a3 0 50%) 0 0 / 32px 32px",
    furniture: (
      <>
        {[6, 28, 50, 72].map((left, index) => (
          <Placed key={left} left={left} bottom={26} width={14}>
            <span className={`interior-screen block`} style={{ animationDelay: `${index * 0.4}s` }}>
              <Pixels width={14} height={24} rects={ARCADE_MACHINE} />
            </span>
          </Placed>
        ))}
      </>
    ),
    spots: [
      { left: 7, bottom: 8, width: 12, motion: "room-typing" },
      { left: 29, bottom: 8, width: 12, motion: "room-typing" },
      { left: 51, bottom: 8, width: 12, motion: "room-typing" },
      { left: 73, bottom: 8, width: 12, motion: "room-typing" },
    ],
    doing: "ゲームで遊んでいます",
  },
  restaurant: {
    wall: "repeating-linear-gradient(90deg, #fff1f2 0 20px, #ffe4e6 20px 40px)",
    floor: "repeating-conic-gradient(#f8fafc 0 25%, #1e293b 0 50%) 0 0 / 40px 40px",
    furniture: (
      <>
        <Placed left={20} bottom={64} width={16}>
          <Pixels width={14} height={10} rects={WINDOW} />
        </Placed>
        <Placed left={64} bottom={64} width={16}>
          <Pixels width={14} height={10} rects={WINDOW} />
        </Placed>
      </>
    ),
    front: (
      <>
        <Placed left={10} bottom={8} width={32}>
          <Pixels width={32} height={16} rects={DINNER_TABLE} />
        </Placed>
        <Placed left={56} bottom={8} width={32}>
          <Pixels width={32} height={16} rects={DINNER_TABLE} />
        </Placed>
      </>
    ),
    spots: [
      { left: 13, bottom: 14, width: 12, motion: "room-typing" },
      { left: 27, bottom: 14, width: 12, motion: "room-typing" },
      { left: 59, bottom: 14, width: 12, motion: "room-typing" },
      { left: 73, bottom: 14, width: 12, motion: "room-typing" },
    ],
    doing: "ごちそうを食べています",
  },
  lab: {
    wall: "linear-gradient(#e2e8f0, #cbd5e1)",
    floor: "repeating-linear-gradient(90deg, #94a3b8 0 36px, #64748b 36px 38px)",
    furniture: (
      <>
        <Placed left={6} bottom={38} width={16}>
          <span className="interior-screen block">
            <Pixels width={16} height={22} rects={LAB_MACHINE} />
          </span>
        </Placed>
        <Placed left={78} bottom={38} width={16}>
          <span className="interior-screen block" style={{ animationDelay: "0.6s" }}>
            <Pixels width={16} height={22} rects={LAB_MACHINE} />
          </span>
        </Placed>
        <span aria-hidden="true" className="lab-smoke absolute left-[62%] bottom-[46%] block h-6 w-6 rounded-full bg-slate-300/80" />
      </>
    ),
    front: (
      <Placed left={26} bottom={8} width={48}>
        <Pixels width={40} height={13} rects={LAB_BENCH} />
      </Placed>
    ),
    spots: [
      { left: 30, bottom: 12, width: 12, motion: "room-typing" },
      { left: 50, bottom: 12, width: 12, motion: "room-typing" },
      { left: 4, bottom: 10, width: 12, motion: "repo-character-float" },
      { left: 84, bottom: 10, width: 12, motion: "repo-character-float" },
    ],
    doing: "実験をしています",
  },
};

// カフェで2人以上いる時のおしゃべり
const CAFE_TALK = [
  "このコーヒー，おいしいね",
  "今日はどんなコミットした？",
  "ちょっと休憩しよう",
  "次は何を作ろうかな",
  "バグ，やっと直ったんだ",
  "いい香り〜",
];

type BuildingInteriorProps = {
  buildingId: BuildingId;
  // 今この建物に立ち寄っているキャラクター
  visitors: Character[];
};

export function BuildingInterior({
  buildingId,
  visitors,
}: BuildingInteriorProps) {
  const config = INTERIORS[buildingId];
  const building = BUILDING_CATALOG[buildingId];
  const shown = visitors.slice(0, config.spots.length);

  // カフェのおしゃべり．数秒ごとに話す人とセリフが変わる
  const [talkIndex, setTalkIndex] = useState(0);
  const isChatting = buildingId === "cafe" && shown.length >= 2;

  useEffect(() => {
    if (!isChatting) {
      return;
    }

    const timer = window.setInterval(
      () => setTalkIndex((index) => index + 1),
      3500,
    );

    return () => window.clearInterval(timer);
  }, [isChatting]);

  return (
    <Room wall={config.wall} floor={config.floor}>
      {config.furniture}

      {shown.map((character, index) => {
        const spot = config.spots[index];
        const evolution = getCharacterEvolution(
          character.characterType,
          character.level,
        );
        const isTalking =
          isChatting && talkIndex % shown.length === index;

        return (
          <div
            key={character.id}
            className="absolute"
            style={{
              left: `${spot.left}%`,
              bottom: `${spot.bottom}%`,
              width: `${spot.width}%`,
            }}
          >
            {isTalking && (
              <span className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-xl bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-950 shadow ring-2 ring-emerald-400 sm:text-xs">
                {CAFE_TALK[talkIndex % CAFE_TALK.length]}
              </span>
            )}
            <EquipmentLayers
              companionItem={character.companionItem}
              auraItem={null}
            >
              <Image
                src={evolution.imagePath}
                alt={character.name}
                width={128}
                height={128}
                className={`repo-pixel-image block h-auto w-full ${spot.motion} ${
                  // 右半分にいるキャラクターは，部屋の真ん中を向く
                  spot.left > 50 ? "-scale-x-100" : ""
                }`}
              />
            </EquipmentLayers>
          </div>
        );
      })}

      {config.front}

      <p className="absolute left-2 top-2 max-w-[70%] rounded-lg bg-slate-950/75 px-2.5 py-1 text-xs font-bold text-white sm:left-3 sm:top-3 sm:text-sm">
        {shown.length > 0
          ? `${shown.map((character) => character.name).join("・")}は${config.doing}`
          : `${building.icon} いまは誰もいません．しばらくすると誰か来るかもしれません`}
      </p>
    </Room>
  );
}
