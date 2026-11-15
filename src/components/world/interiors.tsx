"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { EquipmentLayers } from "@/components/items/equipment-layers";
import { CompanionSprite } from "@/components/items/companion-sprite";
import { PendingLink } from "@/components/ui/pending-link";
import { ShopItemList } from "@/components/shop/shop-item-list";
import type { Inventory } from "@/data/inventory";
import { getCharacterEvolution } from "@/lib/characters/catalog";
import { ITEM_IDS, ITEM_CATALOG } from "@/lib/items/catalog";
import type { Character } from "@/types/character";

/*
 * 建物の中の様子．
 * 部屋の絵は，壁と床を CSS で，家具をドット絵（四角の並び）で描く．
 * 家具の位置と大きさは部屋に対する割合（%）なので，画面の幅に合わせて伸び縮みする．
 */

type Rect = [number, number, number, number, string];

function Pixels({
  width,
  height,
  rects,
}: {
  width: number;
  height: number;
  rects: Rect[];
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="block h-auto w-full"
    >
      {rects.map(([x, y, w, h, fill], index) => (
        <rect key={index} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  );
}

// 部屋の中に家具を置く（left・bottom・width は部屋に対する%）
function Placed({
  left,
  bottom,
  width,
  children,
  className,
}: {
  left: number;
  bottom: number;
  width: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute ${className ?? ""}`}
      style={{ left: `${left}%`, bottom: `${bottom}%`, width: `${width}%` }}
    >
      {children}
    </div>
  );
}

// 部屋の壁と床．wall と floor は CSS の背景．aspect は部屋の縦横の比
function Room({
  wall,
  floor,
  aspect = "aspect-[16/9]",
  children,
}: {
  wall: string;
  floor: string;
  aspect?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border-4 border-[#3b2412] bg-[#3b2412] ${aspect}`}
    >
      <div className="absolute inset-x-0 top-0 h-[42%]" style={{ background: wall }} />
      <div className="absolute inset-x-0 bottom-0 h-[58%]" style={{ background: floor }} />
      {/* 壁と床の境目（幅木） */}
      <div className="absolute inset-x-0 top-[41%] h-[2%] bg-[#5b3a1e]" />
      {children}
    </div>
  );
}

/* ---------- 家具 ---------- */

const WINDOW: Rect[] = [
  [0, 0, 14, 10, "#5b3a1e"],
  [1, 1, 12, 8, "#7dd3fc"],
  [1, 1, 12, 3, "#bae6fd"],
  [6, 1, 2, 8, "#5b3a1e"],
  [1, 4, 12, 1, "#5b3a1e"],
];

const BED: Rect[] = [
  [0, 0, 4, 12, "#7c4a1e"],
  [2, 3, 20, 7, "#f8fafc"],
  [2, 3, 5, 4, "#e2e8f0"],
  [8, 2, 14, 9, "#3b82f6"],
  [8, 2, 14, 1, "#1d4ed8"],
  [0, 10, 24, 2, "#5b3a1e"],
];

// 机とパソコン（コードが映っている）
const DESK: Rect[] = [
  [3, 0, 14, 9, "#1e293b"],
  [4, 1, 12, 7, "#0f172a"],
  [5, 2, 6, 1, "#4ade80"],
  [6, 3, 7, 1, "#38bdf8"],
  [6, 4, 4, 1, "#f472b6"],
  [5, 5, 8, 1, "#4ade80"],
  [9, 9, 2, 2, "#334155"],
  [6, 11, 8, 1, "#475569"],
  [0, 12, 20, 2, "#a16207"],
  [1, 14, 2, 6, "#7c4a1e"],
  [17, 14, 2, 6, "#7c4a1e"],
];

const BOOKSHELF: Rect[] = [
  [0, 0, 14, 20, "#7c4a1e"],
  [1, 1, 12, 5, "#451a03"],
  [1, 7, 12, 5, "#451a03"],
  [1, 13, 12, 6, "#451a03"],
  [2, 2, 2, 4, "#ef4444"],
  [4, 3, 2, 3, "#3b82f6"],
  [7, 2, 2, 4, "#22c55e"],
  [10, 3, 2, 3, "#eab308"],
  [2, 8, 3, 4, "#a855f7"],
  [6, 8, 2, 4, "#f97316"],
  [9, 9, 3, 3, "#06b6d4"],
  [3, 15, 4, 4, "#f43f5e"],
  [8, 14, 3, 5, "#84cc16"],
];

const PLANT: Rect[] = [
  [3, 0, 2, 3, "#22c55e"],
  [0, 2, 4, 3, "#16a34a"],
  [4, 1, 4, 4, "#15803d"],
  [2, 5, 4, 4, "#b45309"],
];

// 雑貨店の棚（3段）
const SHELF: Rect[] = [
  [0, 0, 30, 1, "#5b3a1e"],
  [0, 7, 30, 1, "#5b3a1e"],
  [0, 14, 30, 1, "#5b3a1e"],
  [0, 0, 1, 15, "#5b3a1e"],
  [29, 0, 1, 15, "#5b3a1e"],
];

// カウンター（上にレジが乗っている）
const COUNTER: Rect[] = [
  [30, 0, 6, 4, "#facc15"],
  [31, 1, 4, 1, "#fde68a"],
  [0, 4, 40, 3, "#b45309"],
  [0, 7, 40, 10, "#92400e"],
  [2, 9, 36, 1, "#78350f"],
  [2, 13, 36, 1, "#78350f"],
];

// 雑貨店の店主
const SHOPKEEPER: Rect[] = [
  [3, 0, 6, 2, "#78350f"],
  [2, 2, 8, 6, "#fcd34d"],
  [3, 4, 1, 1, "#1e293b"],
  [8, 4, 1, 1, "#1e293b"],
  [5, 6, 2, 1, "#b91c1c"],
  [1, 8, 10, 8, "#16a34a"],
  [3, 9, 6, 7, "#f8fafc"],
];

/* ---------- 家の中 ---------- */

// 部屋の中で過ごす場所と，そこでしていること
type RoomSpot = "desk" | "bookshelf" | "window" | "rug" | "bed";

const ROOM_SPOTS: Record<
  RoomSpot,
  {
    // 立つ位置と大きさ（部屋に対する%）
    left: number;
    bottom: number;
    width: number;
    label: string;
    // そこにいる時間（ミリ秒）
    stay: [number, number];
  }
> = {
  desk: { left: 56, bottom: 14, width: 13, label: "机でコードを書いています", stay: [9000, 14000] },
  bookshelf: { left: 18, bottom: 30, width: 12, label: "本を読んでいます", stay: [7000, 11000] },
  window: { left: 42, bottom: 36, width: 11, label: "窓の外をながめています", stay: [5000, 8000] },
  rug: { left: 45, bottom: 10, width: 12, label: "体をのばしています", stay: [5000, 7000] },
  bed: { left: 16, bottom: 16, width: 12, label: "ベッドで休んでいます", stay: [10000, 16000] },
};

const SPOT_NAMES = Object.keys(ROOM_SPOTS) as RoomSpot[];

// 部屋の中を歩く時間（ミリ秒．CSS の移り変わりの時間と合わせる）
const ROOM_WALK_TIME = 1500;

type HouseInteriorProps = {
  character: Character;
  // キャラクターが家の中にいる時は true
  isHome: boolean;
  // 家に入るたびに変わる数．最初にいる場所を決めるのに使う
  seed: number;
};

/*
 * 家の中．キャラクターが家にいる時は，机・本棚・窓・じゅうたん・ベッドを
 * 行き来しながら過ごす様子が見える．
 */
export function HouseInterior({
  character,
  isHome,
  seed,
}: HouseInteriorProps) {
  const evolution = getCharacterEvolution(
    character.characterType,
    character.level,
  );

  const [spot, setSpot] = useState<RoomSpot>(
    SPOT_NAMES[seed % SPOT_NAMES.length],
  );
  const [isWalking, setIsWalking] = useState(false);
  const [isFacingLeft, setIsFacingLeft] = useState(false);

  // しばらくすると，別の場所へ歩いていく
  useEffect(() => {
    if (!isHome || isWalking) {
      return;
    }

    const [min, max] = ROOM_SPOTS[spot].stay;
    const timer = window.setTimeout(
      () => {
        const others = SPOT_NAMES.filter((name) => name !== spot);
        const next = others[Math.floor(Math.random() * others.length)];

        setIsFacingLeft(ROOM_SPOTS[next].left < ROOM_SPOTS[spot].left);
        setIsWalking(true);
        setSpot(next);
      },
      min + Math.random() * (max - min),
    );

    return () => window.clearTimeout(timer);
  }, [isHome, isWalking, spot]);

  // 歩き終わったら，その場所ですることを始める
  useEffect(() => {
    if (!isWalking) {
      return;
    }

    const timer = window.setTimeout(
      () => setIsWalking(false),
      ROOM_WALK_TIME,
    );

    return () => window.clearTimeout(timer);
  }, [isWalking]);

  const place = ROOM_SPOTS[spot];
  const doing = isWalking ? null : spot;

  return (
    <div className="space-y-4">
      <Room
        wall="repeating-linear-gradient(90deg, #fde7c3 0 18px, #f6d8a8 18px 36px)"
        floor="repeating-linear-gradient(0deg, #b7793f 0 22px, #a96c35 22px 24px)"
      >
        <Placed left={40} bottom={68} width={16}>
          <Pixels width={14} height={10} rects={WINDOW} />
        </Placed>
        <Placed left={5} bottom={38} width={14}>
          <Pixels width={14} height={20} rects={BOOKSHELF} />
        </Placed>
        <Placed left={5} bottom={6} width={28}>
          <Pixels width={24} height={12} rects={BED} />
        </Placed>
        <Placed left={66} bottom={20} width={24}>
          <Pixels width={20} height={20} rects={DESK} />
        </Placed>
        <Placed left={90} bottom={44} width={7}>
          <Pixels width={8} height={9} rects={PLANT} />
        </Placed>
        {/* じゅうたん */}
        <div className="absolute bottom-[8%] left-[38%] h-[18%] w-[26%] rounded-[50%] bg-[#be123c]/70 ring-4 ring-[#9f1239]/60" />

        {isHome ? (
          <div
            className="absolute transition-[left,bottom,width] ease-in-out"
            style={{
              left: `${place.left}%`,
              bottom: `${place.bottom}%`,
              width: `${place.width}%`,
              transitionDuration: `${ROOM_WALK_TIME}ms`,
            }}
          >
            {/* 本を読んでいる時は，本を持つ */}
            {doing === "bookshelf" && (
              <span className="room-bob absolute -right-1 top-[35%] z-10 text-xl sm:text-2xl">
                📖
              </span>
            )}

            {/* 寝ている時は，Z が浮かんでいく */}
            {doing === "bed" && (
              <span aria-hidden="true" className="absolute -top-2 right-0">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="room-zzz absolute text-base font-black text-sky-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] sm:text-xl"
                    style={{ animationDelay: `${index * 0.8}s` }}
                  >
                    Z
                  </span>
                ))}
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
                className={`repo-pixel-image block h-auto w-full ${
                  isFacingLeft ? "-scale-x-100" : ""
                } ${
                  isWalking
                    ? "room-walk"
                    : doing === "bed"
                      ? "rotate-[-80deg]"
                      : doing === "desk"
                        ? "room-typing"
                        : doing === "rug"
                          ? "room-stretch"
                          : "repo-character-float"
                }`}
              />
            </EquipmentLayers>
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-[30%] flex justify-center px-4">
            <p className="rounded-lg bg-slate-950/80 px-4 py-2 text-center text-sm text-white">
              <span className="block font-bold">
                {character.name}は出かけています
              </span>
              <span className="mt-0.5 block text-xs text-slate-300">
                しばらくすると帰ってくるかもしれません
              </span>
            </p>
          </div>
        )}

        {/* 家にいる時は，何をしているかを部屋の左上に出す */}
        {isHome && (
          <p className="absolute left-2 top-2 rounded-lg bg-slate-950/75 px-2.5 py-1 text-xs font-bold text-white sm:left-3 sm:top-3 sm:text-sm">
            {character.name}は
            {doing ? place.label : "歩いています"}
          </p>
        )}

        {/* キャラクターの詳細画面への入口は，部屋の右下に置く（部屋の下に何も残さない） */}
        <PendingLink
          href={`/repositories/${character.repositoryId}`}
          className="absolute bottom-2 right-2 rounded-lg border border-emerald-300/50 bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-slate-900 sm:bottom-3 sm:right-3 sm:text-sm"
        >
          📊 {character.name}のステータス →
        </PendingLink>
      </Room>
    </div>
  );
}

/* ---------- 雑貨店の中 ---------- */

export function StoreInterior({ inventory }: { inventory: Inventory }) {
  // 棚に飾る品物（おともの絵）
  const displayed = ITEM_IDS.filter(
    (id) => ITEM_CATALOG[id].slot === "companion",
  );

  // 品物の一覧（部屋の下）．「品物を見る」を押すと，ここまで動かす
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      {/*
       * 部屋は低めにして，開いた時に下の品物の見出しまで見えるようにする．
       * 下に品物があると分かるよう，部屋の中にも「品物を見る」ボタンを置く．
       */}
      <Room
        wall="repeating-linear-gradient(90deg, #d9f99d 0 20px, #bef264 20px 40px)"
        floor="repeating-conic-gradient(#e7d3b0 0 25%, #d6bf96 0 50%) 0 0 / 40px 40px"
        aspect="aspect-[16/7]"
      >
        {/* 棚と，飾ってある品物 */}
        <Placed left={6} bottom={46} width={32}>
          <Pixels width={30} height={15} rects={SHELF} />
          <div className="absolute inset-x-[4%] top-[4%] flex justify-around">
            {displayed.slice(0, 3).map((id) => (
              <CompanionSprite key={id} itemId={id} className="w-[22%]" />
            ))}
          </div>
          <div className="absolute inset-x-[4%] top-[52%] flex justify-around">
            {displayed.slice(3).map((id) => (
              <CompanionSprite key={id} itemId={id} className="w-[22%]" />
            ))}
          </div>
        </Placed>
        <Placed left={58} bottom={62} width={14}>
          <Pixels width={14} height={10} rects={WINDOW} />
        </Placed>
        <Placed left={84} bottom={44} width={8}>
          <Pixels width={8} height={9} rects={PLANT} />
        </Placed>

        {/* 店主とカウンター */}
        <Placed left={62} bottom={22} width={10}>
          <Pixels width={12} height={16} rects={SHOPKEEPER} />
        </Placed>
        <Placed left={50} bottom={4} width={44}>
          <Pixels width={40} height={17} rects={COUNTER} />
        </Placed>
        {/* 店主の吹き出し．頭のすぐ上に出し，しっぽを店主に向ける */}
        <div className="absolute bottom-[56%] left-[67%] -translate-x-1/2 whitespace-nowrap rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-lg sm:text-sm">
          いらっしゃい！
          <span className="hidden sm:inline">ゆっくり見ていってね</span>
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-white" />
        </div>

        <button
          type="button"
          onClick={() =>
            listRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          className="absolute bottom-3 left-3 animate-bounce rounded-xl bg-amber-300 px-3 py-1.5 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-200 motion-reduce:animate-none"
        >
          🛍️ 品物を見る ▼
        </button>
      </Room>

      <div ref={listRef} className="scroll-mt-4 border-t border-slate-700 pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">🛍️ 品物</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              買った装備は，キャラクターの詳細ページの「装備」から付けられます．
            </p>
          </div>
          <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-200">
            所持金 💰 {inventory.gold} G
          </p>
        </div>

        <ShopItemList inventory={inventory} compact />
      </div>
    </div>
  );
}
