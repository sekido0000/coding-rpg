"use client";

import { DotGothic16 } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { openQuestPanel } from "@/components/quests/quest-panel";
import { EquipmentLayers } from "@/components/items/equipment-layers";
import {
  FlowerBed,
  HOUSE_COLORS,
  House,
  GeneralStore,
  QuestBoardSign,
  Tree,
  Well,
  Bench,
  BUILDING_EXTERIORS,
} from "@/components/world/buildings";
import { useConversations } from "@/components/world/use-conversations";
import { useDragScroll } from "@/components/world/use-drag-scroll";
import { BuildingDialog } from "@/components/world/building-dialog";
import { CharacterLinkStatus } from "@/components/world/character-link-status";
import {
  HouseInterior,
  StoreInterior,
} from "@/components/world/interiors";
import type { Inventory } from "@/data/inventory";
import { useGrowthReactions } from "@/components/world/use-growth-reactions";
import {
  useSpeeches,
  type Speech,
} from "@/components/world/use-speeches";
import { getCharacterEvolution } from "@/lib/characters/catalog";
import type { ActivitySummary } from "@/lib/world/activity";
import {
  buildWorldMap,
  ROAD_WIDTH,
  TILE,
  type Lot,
  type WorldMap,
} from "@/lib/world/map";
import { getDepth, type Position } from "@/lib/world/movement";
import {
  BUILDING_CATALOG,
  type BuildingId,
  type PlacedBuilding,
} from "@/lib/buildings/catalog";
import type { Character } from "@/types/character";
import {
  demolishBuildingAction,
  moveBuildingAction,
  purchaseBuildingAction,
  type BuildingActionResult,
} from "@/app/actions/building-actions";
import { BuildingInterior } from "@/components/world/building-interiors";
import { BuildMenu, ManageBuilding } from "@/components/world/build-menus";
import {
  getInitialWalker,
  stepWalker,
  type VisitTarget,
  type Walker,
} from "@/components/world/walker";

/*
 * 見出しに使うドット文字のフォント．
 * 日本語の文字は数が多く，先読みの対象（subsets）に含められないため，
 * 先読みはしない．
 */
const pixelFont = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

type RepositoryWorldProps = {
  characters: Character[];
  // キャラクターごとの最近の様子（セリフ選びに使う）
  activity: Record<string, ActivitySummary>;
  // 受け取り待ちのクエストの報酬がある時は，掲示板に印を付ける
  hasPendingRewards: boolean;
  // 持っているゴールドと装備（雑貨店の中で買い物をする時に使う）
  inventory: Inventory;
  // 建てた建物と，その場所
  buildings: PlacedBuilding[];
};

// 中の様子を開いている建物
type OpenBuilding =
  | { kind: "house"; characterId: string }
  | { kind: "store" }
  | { kind: "building"; buildingId: BuildingId };

/*
 * 建築モードで開いている画面．
 * - build：空いた区画を押して，建てる建物を選ぶ
 * - manage：建てた建物を押して，移すか取り壊すかを選ぶ
 * - move：移す先の空いた区画を選んでいる
 */
type BuildAction =
  | { kind: "build"; row: 0 | 1; offset: number }
  | { kind: "manage"; buildingId: BuildingId }
  | { kind: "move"; buildingId: BuildingId };

// 歩き出すかを確かめる間隔（ミリ秒）
const TICK_INTERVAL = 500;

// 最初に歩き出すまでの時間の最大（全員が同時に動き出さないようにずらす）
const FIRST_MOVE_DELAY = 3000;

// キャラクターの重なり順の上限．押せるものや吹き出しは，これより手前に出す
const FRONT_DEPTH = 5000;

const SPEECH_STYLES: Record<
  Speech["kind"],
  { bubble: string; tail: string }
> = {
  solo: {
    bubble: "bg-white text-slate-900",
    tail: "border-t-white",
  },
  talk: {
    bubble:
      "bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400",
    tail: "border-t-emerald-400",
  },
  reaction: {
    bubble:
      "bg-amber-50 font-bold text-amber-950 ring-2 ring-amber-400",
    tail: "border-t-amber-400",
  },
};

type SpeechBubbleProps = {
  speech: Speech;
  // キャラクターの横の位置（世界の幅に対する%）．世界の端ではみ出さないよう，吹き出しの向きを変える
  x: number;
  /*
   * 会話で並んだ2人の吹き出しが重ならないよう，左側の吹き出しを高く出す．
   * 左上 → 右下の順に読めるので，漫画のようにやり取りとして読める．
   */
  isRaised: boolean;
};

function SpeechBubble({
  speech,
  x,
  isRaised,
}: SpeechBubbleProps) {
  const align =
    x < 8
      ? { bubble: "left-0", tail: "left-6" }
      : x > 92
        ? { bubble: "right-0", tail: "right-6" }
        : {
            bubble: "left-1/2 -translate-x-1/2",
            tail: "left-1/2 -translate-x-1/2",
          };

  // 独り言は白，会話は緑，経験値が入った時の反応は「+XP」と同じ金色にする
  const style = SPEECH_STYLES[speech.kind];

  return (
    <span
      className={`pointer-events-none absolute bottom-full w-max max-w-[11rem] rounded-xl px-3 py-1.5 text-left text-xs leading-5 shadow-lg transition group-hover:opacity-0 group-focus-visible:opacity-0 sm:max-w-[14rem] sm:text-sm ${
        isRaised ? "mb-16 sm:mb-14" : "mb-2"
      } ${style.bubble} ${align.bubble}`}
    >
      {speech.text}
      <span
        className={`absolute top-full border-x-[6px] border-t-[6px] border-x-transparent ${style.tail} ${align.tail}`}
      />
    </span>
  );
}

// 建物の札（家の名前など）
function Nameplate({ children }: { children: string }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/75 px-1.5 py-0.5 text-[11px] font-bold text-white">
      {children}
    </span>
  );
}

/*
 * 区画に建つ建物．足元（正面の下端）を区画の位置に合わせて置く．
 * 建物の札は，押せることが分かるよう，押せる建物だけ光らせる．
 */
function LotBuilding({
  lot,
  houseIndex,
  owner,
  hasPendingRewards,
  isBuildMode,
  movingBuildingId,
  onOpen,
  onBuildAction,
}: {
  lot: Lot;
  houseIndex: number;
  owner?: Character;
  hasPendingRewards: boolean;
  // 建築モードの時は，空いた区画と建てた建物だけを押せる
  isBuildMode: boolean;
  // 建物を移す先を選んでいる時は，その建物
  movingBuildingId: BuildingId | null;
  // 建物を押した時に，中の様子を開く
  onOpen: (building: OpenBuilding) => void;
  // 建築モードで区画や建物を押した時
  onBuildAction: (lot: Lot) => void;
}) {
  const style: CSSProperties = {
    left: lot.x,
    top: lot.bottom,
    zIndex: lot.bottom,
  };
  const base = "absolute -translate-x-1/2 -translate-y-full";
  const clickable =
    "rounded-lg outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-300";
  // 建築モードでは，押せない建物を暗くする
  const dimmed = "pointer-events-none opacity-50";

  switch (lot.kind) {
    case "house":
      return owner ? (
        <button
          type="button"
          onClick={() =>
            onOpen({ kind: "house", characterId: owner.id })
          }
          aria-label={`${owner.name}の家（中をのぞく）`}
          className={`${base} ${isBuildMode ? dimmed : clickable}`}
          style={style}
        >
          <House colors={HOUSE_COLORS[houseIndex % HOUSE_COLORS.length]} />
          <Nameplate>{`${owner.name}の家`}</Nameplate>
        </button>
      ) : null;

    case "quest_board":
      return (
        <button
          type="button"
          onClick={openQuestPanel}
          aria-label="クエスト掲示板（今週のクエストを開く）"
          className={`${base} ${isBuildMode ? dimmed : clickable}`}
          style={style}
        >
          <QuestBoardSign hasNotice={hasPendingRewards} />
          <Nameplate>📜 クエスト掲示板</Nameplate>
        </button>
      );

    case "general_store":
      return (
        <button
          type="button"
          onClick={() => onOpen({ kind: "store" })}
          aria-label="雑貨店（中に入る）"
          className={`${base} ${isBuildMode ? dimmed : clickable}`}
          style={style}
        >
          <GeneralStore />
          <Nameplate>🏪 雑貨店</Nameplate>
        </button>
      );

    case "building": {
      const building = BUILDING_CATALOG[lot.buildingId!];
      const Exterior = BUILDING_EXTERIORS[lot.buildingId!];
      const isMoving = movingBuildingId === lot.buildingId;

      return (
        <button
          type="button"
          onClick={() =>
            isBuildMode
              ? onBuildAction(lot)
              : onOpen({ kind: "building", buildingId: lot.buildingId! })
          }
          aria-label={
            isBuildMode
              ? `${building.name}（移す・取り壊す）`
              : `${building.name}（中をのぞく）`
          }
          className={`${base} ${clickable} ${
            isBuildMode
              ? "ring-2 ring-amber-300/80 ring-offset-2 ring-offset-transparent"
              : ""
          } ${isMoving ? "animate-pulse" : ""}`}
          style={style}
        >
          <Exterior />
          {/* 研究所は，ときどき屋根から煙が出る */}
          {lot.buildingId === "lab" && (
            <span
              aria-hidden="true"
              className="lab-smoke absolute left-[78%] top-0 block h-5 w-5 rounded-full bg-slate-200/80"
            />
          )}
          <Nameplate>{`${building.icon} ${building.name}`}</Nameplate>
        </button>
      );
    }

    case "empty": {
      const decoration =
        lot.decoration === "grove" ? (
          <>
            <Tree />
            <span className="-ml-6 mb-3 block">
              <Tree />
            </span>
          </>
        ) : lot.decoration === "well" ? (
          <Well />
        ) : lot.decoration === "bench" ? (
          <>
            <FlowerBed />
            <Bench />
          </>
        ) : (
          <>
            <FlowerBed />
            <FlowerBed />
          </>
        );

      // ふだんは飾りだけ（押せない）
      if (!isBuildMode) {
        return (
          <div
            className={`${base} pointer-events-none flex items-end gap-2`}
            style={style}
          >
            {decoration}
          </div>
        );
      }

      // 建築モードでは，建てられる区画として光らせる
      return (
        <button
          type="button"
          onClick={() => onBuildAction(lot)}
          aria-label={
            movingBuildingId ? "この区画へ移す" : "この区画に建てる"
          }
          className={`${base} ${clickable} group/lot flex h-36 w-48 items-end justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300/80 bg-amber-300/15`}
          style={style}
        >
          <span className="opacity-40">{decoration}</span>
          <span className="absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-amber-300 px-3 py-1 text-sm font-black text-slate-950 shadow-lg transition group-hover/lot:scale-110">
              {movingBuildingId ? "ここへ移す" : "＋ 建てる"}
            </span>
          </span>
        </button>
      );
    }
  }
}

/*
 * 地図を飾る木の位置．奥の端と手前の端に並べる．
 * サーバーとブラウザで同じ画面になるよう，乱数は使わず位置から決める．
 */
function getTreePositions(map: WorldMap): Position[] {
  const trees: Position[] = [];

  for (let x = TILE; x < map.width; x += TILE * 2.5) {
    const shift = ((x * 7) % 5) * 4;

    trees.push({ x: x + shift, y: TILE * 3.5 - shift / 2 });
    trees.push({ x: x + TILE * 1.2 - shift, y: map.height - TILE * 0.5 });
  }

  return trees;
}

/*
 * 自分のキャラクター全員が暮らす世界．斜め上から見下ろした地図で，
 * ドラッグやホイールで見渡せる．キャラクターは道を歩き，ときどき自分の家に入る．
 * キャラクターを押すと詳細画面へ，掲示板を押すとクエスト，雑貨店を押すとお店が開く．
 */
export function RepositoryWorld({
  characters,
  activity,
  hasPendingRewards,
  inventory,
  buildings,
}: RepositoryWorldProps) {
  const [openBuilding, setOpenBuilding] = useState<OpenBuilding | null>(
    null,
  );

  // 建築モード（空いた区画を押して建てる・建物を移す・取り壊す）
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [buildAction, setBuildAction] = useState<BuildAction | null>(null);
  // 建てた・移した・取り壊した時のお知らせ
  const [buildMessage, setBuildMessage] = useState<string | null>(null);

  const characterIds = characters
    .map((character) => character.id)
    .join(",");

  // 建物の並びが変わった時だけ，地図を作り直す
  const buildingsKey = buildings
    .map((building) => `${building.buildingId}:${building.row}:${building.offset}`)
    .sort()
    .join(",");

  const map = useMemo(
    () =>
      buildWorldMap(
        characterIds.split(",").filter(Boolean),
        buildingsKey
          ? buildingsKey.split(",").map((item) => {
              const [buildingId, row, offset] = item.split(":");

              return {
                buildingId: buildingId as BuildingId,
                row: Number(row) as 0 | 1,
                offset: Number(offset),
              };
            })
          : [],
      ),
    [characterIds, buildingsKey],
  );

  const doors = useMemo(
    () =>
      new Map(
        map.lots
          .filter((lot) => lot.kind === "house" && lot.characterId)
          .map((lot) => [lot.characterId!, lot.door]),
      ),
    [map],
  );

  // 立ち寄れる建物の扉
  const visitTargets = useMemo(
    () =>
      new Map<BuildingId, VisitTarget>(
        map.lots
          .filter((lot) => lot.kind === "building" && lot.buildingId)
          .map((lot) => [
            lot.buildingId!,
            {
              door: lot.door,
              isIndoor: BUILDING_CATALOG[lot.buildingId!].isIndoor,
            },
          ]),
      ),
    [map],
  );

  const trees = useMemo(() => getTreePositions(map), [map]);

  const [walkers, setWalkers] = useState<Record<string, Walker>>({});

  // 会話のタイマーの中から最新の位置を読むために，参照でも持っておく
  const walkersRef = useRef(walkers);

  useEffect(() => {
    walkersRef.current = walkers;
  }, [walkers]);

  const { speeches, say, setBusy, isSpeaking } = useSpeeches(
    characters,
    activity,
  );

  const { reactions, announcement } = useGrowthReactions(
    characters,
    activity,
    say,
  );

  useConversations({
    characters,
    activity,
    walkersRef,
    setWalkers,
    say,
    setBusy,
    isSpeaking,
  });

  // 見渡す操作（ドラッグ・ホイール）と，最初に世界の真ん中を映す
  const scrollRef = useRef<HTMLDivElement>(null);

  useDragScroll(scrollRef);

  useEffect(() => {
    const element = scrollRef.current;

    if (element) {
      element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
      element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
    }
  }, []);

  useEffect(() => {
    // 動きを減らす設定の人には，歩かせずに家の前に立たせておく
    const reducesMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducesMotion) {
      return;
    }

    const ids = characterIds.split(",").filter(Boolean);

    const timer = window.setInterval(() => {
      // 別のタブを見ている間は動かさない
      if (document.hidden) {
        return;
      }

      const now = Date.now();
      const current = walkersRef.current;
      const next = { ...current };
      const entered: string[] = [];
      const exited: string[] = [];
      let hasChanged = false;

      for (const id of ids) {
        const door = doors.get(id);

        if (!door) {
          continue;
        }

        const walker = current[id];

        // 初めての時は，少しずつずらして歩き出す
        if (!walker) {
          next[id] = {
            ...getInitialWalker(door),
            nextMoveAt: now + Math.random() * FIRST_MOVE_DELAY,
          };
          hasChanged = true;
          continue;
        }

        const stepped = stepWalker(walker, {
          map,
          homeDoor: door,
          buildings: visitTargets,
          now,
          random: Math.random,
        });

        if (stepped !== walker) {
          if (!walker.insideUntil && stepped.insideUntil) {
            entered.push(id);
          }

          if (walker.insideUntil && !stepped.insideUntil) {
            exited.push(id);
          }

          next[id] = stepped;
          hasChanged = true;
        }
      }

      if (!hasChanged) {
        return;
      }

      /*
       * 会話で歩み寄った分などを消さないよう，変わったキャラクターだけを書き換える．
       * 中に入った・出てきたことは，書き換える前に分かるようにしておく
       * （状態の更新の中で調べると，更新が遅れて取りこぼすため）．
       */
      setWalkers((latest) => {
        const merged = { ...latest };

        for (const id of ids) {
          if (next[id] !== current[id]) {
            merged[id] = next[id];
          }
        }

        return merged;
      });

      // 中にいる間は，独り言や会話をしない
      if (entered.length > 0) {
        setBusy(entered, true);
      }

      if (exited.length > 0) {
        setBusy(exited, false);
      }
    }, TICK_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [characterIds, doors, map, visitTargets, setBusy]);

  // 建築モードで，区画や建物を押した時
  const handleBuildAction = (lot: Lot) => {
    if (buildAction?.kind === "move") {
      if (lot.kind === "empty") {
        void runBuildAction(() =>
          moveBuildingAction(buildAction.buildingId, lot.row, lot.offset),
        );
      }

      return;
    }

    if (lot.kind === "empty") {
      setBuildAction({ kind: "build", row: lot.row, offset: lot.offset });
    } else if (lot.kind === "building" && lot.buildingId) {
      setBuildAction({ kind: "manage", buildingId: lot.buildingId });
    }
  };

  // 建てる・移す・取り壊すを行い，結果をお知らせに出す
  const runBuildAction = async (
    action: () => Promise<BuildingActionResult>,
  ) => {
    const result = await action();

    setBuildMessage(result.message);
    window.setTimeout(() => setBuildMessage(null), 4000);

    if (result.ok) {
      setBuildAction(null);
    }

    return result;
  };

  const exitBuildMode = () => {
    setIsBuildMode(false);
    setBuildAction(null);
  };

  // 建物の中にいるキャラクター（中の様子に出す）
  const visitorsOf = (buildingId: BuildingId) =>
    characters.filter((character) => {
      const walker = walkers[character.id];

      return (
        walker &&
        ((walker.insideOf === buildingId && walker.insideUntil > 0) ||
          walker.restingAt === buildingId)
      );
    });

  const builtIds = new Set(buildings.map((building) => building.buildingId));

  return (
    <section
      aria-labelledby="repository-world-title"
      // 画面いっぱいに広げる（高さは置く側で決める）
      className="relative h-full overflow-hidden bg-[#2f5d34]"
    >
      {/* 見出し（地図の上に重ねる．地図と一緒には動かない） */}
      <div className="pointer-events-none absolute left-4 top-3 z-[6000] sm:left-6 sm:top-4">
        <h2
          id="repository-world-title"
          className={`${pixelFont.className} text-xl tracking-wider text-emerald-50 [text-shadow:2px_2px_0_#064e3b,4px_4px_0_rgba(0,0,0,0.45)] sm:text-3xl`}
        >
          リポジトリワールド
        </h2>
        <p className="mt-1 text-xs text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
          ドラッグで見渡せます．キャラクターや建物を押してみましょう
        </p>
      </div>

      {/* 建築モードの切り替え（右上） */}
      <div className="absolute right-3 top-3 z-[6000] flex flex-col items-end gap-2 sm:right-5 sm:top-4">
        {isBuildMode ? (
          <button
            type="button"
            onClick={exitBuildMode}
            className="rounded-xl bg-slate-950/90 px-3 py-1.5 text-sm font-bold text-white shadow-lg ring-2 ring-amber-300 transition hover:bg-slate-900"
          >
            ✕ 建築モードをやめる
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsBuildMode(true)}
            className="rounded-xl bg-amber-300 px-3 py-1.5 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-200"
          >
            🔨 建てる
          </button>
        )}

        {isBuildMode && (
          <p className="max-w-64 rounded-lg bg-slate-950/85 px-3 py-1.5 text-right text-xs text-amber-100 shadow">
            {buildAction?.kind === "move"
              ? `${BUILDING_CATALOG[buildAction.buildingId].name}を移す先の区画を押してください`
              : "光っている区画を押すと建てられます．建てた建物を押すと，移したり取り壊したりできます"}
          </p>
        )}

        {buildAction?.kind === "move" && (
          <button
            type="button"
            onClick={() => setBuildAction(null)}
            className="rounded-lg bg-slate-950/85 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-900"
          >
            移すのをやめる
          </button>
        )}
      </div>

      {/* 建てた・移した・取り壊した時のお知らせ */}
      {buildMessage && (
        <div
          role="status"
          className="world-announce pointer-events-none absolute inset-x-0 top-20 z-[6000] flex justify-center px-4 sm:top-6"
        >
          <p className="rounded-lg border-2 border-amber-300 bg-slate-950/90 px-4 py-1.5 text-center text-sm font-bold text-amber-100 shadow-lg sm:text-base">
            {buildMessage}
          </p>
        </div>
      )}

      {/* 経験値が入ったことのお知らせ */}
      {announcement && (
        <div
          key={announcement.key}
          role="status"
          className="world-announce pointer-events-none absolute inset-x-0 top-20 z-[6000] flex justify-center px-4 sm:top-6"
        >
          <p
            className={`${pixelFont.className} rounded-lg border-2 px-4 py-1.5 text-center text-base shadow-lg sm:text-xl ${
              announcement.isLevelUp
                ? "border-amber-300 bg-amber-500/90 text-white [text-shadow:2px_2px_0_#78350f]"
                : "border-amber-300/80 bg-slate-950/85 text-amber-200 [text-shadow:2px_2px_0_#000]"
            }`}
          >
            {announcement.isLevelUp ? "★ " : ""}
            {announcement.text}
          </p>
        </div>
      )}

      {/* 見渡せる範囲．地図が画面より小さい時は真ん中に置く */}
      <div
        ref={scrollRef}
        className="world-scroll h-full overflow-auto data-[dragging=true]:cursor-grabbing"
      >
        <div className="flex min-h-full min-w-full items-center justify-center">
          <div
            className="world-ground relative shrink-0"
            style={{ width: map.width, height: map.height }}
          >
            {/* 道（2本の道と，そのあいだのつなぎの道） */}
            {map.roadYs.map((y) => (
              <div
                key={`road-${y}`}
                className="world-road absolute"
                style={{
                  left: map.roadMinX - ROAD_WIDTH / 2,
                  width: map.roadMaxX - map.roadMinX + ROAD_WIDTH,
                  top: y - ROAD_WIDTH / 2,
                  height: ROAD_WIDTH,
                }}
              />
            ))}
            {map.connectorXs.map((x) => (
              <div
                key={`connector-${x}`}
                className="world-road absolute"
                style={{
                  left: x - ROAD_WIDTH / 2,
                  width: ROAD_WIDTH,
                  top: map.roadYs[0],
                  height: map.roadYs[1] - map.roadYs[0],
                }}
              />
            ))}

            {/* 木 */}
            {trees.map((tree, index) => (
              <div
                key={`tree-${index}`}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
                style={{ left: tree.x, top: tree.y, zIndex: Math.round(tree.y) }}
              >
                <Tree />
              </div>
            ))}

            {/* 建物 */}
            {map.lots.map((lot) => {
              // 家の色は，キャラクターの順番で決める
              const ownerIndex = characters.findIndex(
                (character) => character.id === lot.characterId,
              );

              return (
                <LotBuilding
                  key={`${lot.row}-${lot.x}`}
                  lot={lot}
                  houseIndex={Math.max(ownerIndex, 0)}
                  owner={characters[ownerIndex]}
                  hasPendingRewards={hasPendingRewards}
                  isBuildMode={isBuildMode}
                  movingBuildingId={
                    buildAction?.kind === "move"
                      ? buildAction.buildingId
                      : null
                  }
                  onOpen={setOpenBuilding}
                  onBuildAction={handleBuildAction}
                />
              );
            })}

            {/* キャラクター */}
            {characters.map((character, index) => {
              const door = doors.get(character.id);

              if (!door) {
                return null;
              }

              const walker =
                walkers[character.id] ?? getInitialWalker(door);

              const evolution = getCharacterEvolution(
                character.characterType,
                character.level,
              );

              const repositoryName = `${character.repositoryOwner}/${character.repositoryName}`;

              const speech = speeches[character.id];
              const reaction = reactions[character.id];

              // 家の中にいる時は見せない（経験値が入った時は，反応を見せるために出す）
              const isInside = walker.insideUntil > 0 && !reaction;

              return (
                <Link
                  key={character.id}
                  href={`/repositories/${character.repositoryId}`}
                  aria-label={`${character.name}（${repositoryName}・レベル${character.level}）の詳細を見る`}
                  tabIndex={isInside ? -1 : undefined}
                  className={`group absolute z-[var(--depth)] -translate-x-1/2 -translate-y-full cursor-pointer rounded-xl outline-none before:absolute before:-inset-3 before:content-[''] hover:z-[5001] focus-visible:z-[5001] focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                    isInside
                      ? "pointer-events-none opacity-0"
                      : isBuildMode
                        ? // 建築モードでは押せないようにし，少し薄くする
                          "pointer-events-none opacity-60"
                        : ""
                  }`}
                  style={
                    {
                      left: walker.position.x,
                      // 足元を道の真ん中より少し下にして，道の上に立っているように見せる
                      top: walker.position.y + 6,
                      transition: `left ${walker.duration}ms linear, top ${walker.duration}ms linear, opacity 300ms`,
                      // 話している時は，吹き出しが建物などに隠れないよう手前に出す
                      "--depth": speech
                        ? FRONT_DEPTH
                        : getDepth(walker.position),
                    } as CSSProperties
                  }
                >
                  {/* 押した後，詳細画面が開くまでの吹き出し */}
                  <CharacterLinkStatus />

                  {speech && (
                    <SpeechBubble
                      speech={speech}
                      x={(walker.position.x / map.width) * 100}
                      // 会話の相手が右にいる（右を向いている）のは，左側のキャラクター
                      isRaised={
                        speech.kind === "talk" && !walker.isFacingLeft
                      }
                    />
                  )}

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

                  {/*
                   * マウスを乗せると光り，押した瞬間に少し縮む．
                   * 押せる範囲は，絵より少し広くしてある（Link の before）．
                   */}
                  <span
                    className="repo-character-float relative block transition-[filter,scale] duration-150 group-hover:drop-shadow-[0_0_10px_rgba(253,224,71,0.95)] group-active:scale-90"
                    // 全員が同じ調子で揺れないよう，揺れ始めをずらす
                    style={{
                      animationDelay: `${-index * 0.37}s`,
                    }}
                  >
                    {/* レベルが上がった時に，まわりを光らせる */}
                    {reaction?.isLevelUp && (
                      <span
                        key={`glow-${reaction.key}`}
                        className="world-level-up pointer-events-none absolute -inset-3 rounded-full bg-amber-300/60 blur-xl"
                      />
                    )}

                    {/* 経験値が入った時に，数字を浮かべる */}
                    {reaction && (
                      <span
                        key={`xp-${reaction.key}`}
                        className={`${pixelFont.className} world-xp-pop pointer-events-none absolute -top-4 right-0 z-10 translate-x-2/3 whitespace-nowrap text-xl text-amber-200 [text-shadow:2px_2px_0_#78350f,3px_3px_0_rgba(0,0,0,0.5)] sm:text-2xl`}
                      >
                        +{reaction.xp} XP
                      </span>
                    )}

                    {/* おともは，歩く向きの後ろからついていく */}
                    <EquipmentLayers
                      companionItem={character.companionItem}
                      auraItem={character.auraItem}
                      companionSide={walker.isFacingLeft ? "right" : "left"}
                    >
                      <Image
                        // 経験値が入るたびに跳ねる動きをやり直すため，キーを変える
                        key={reaction ? `hop-${reaction.key}` : "idle"}
                        src={evolution.imagePath}
                        alt=""
                        width={96}
                        height={96}
                        draggable={false}
                        className={`repo-pixel-image relative block h-auto w-16 drop-shadow-[0_6px_4px_rgba(0,0,0,0.45)] sm:w-20 ${
                          walker.isFacingLeft ? "-scale-x-100" : ""
                        } ${reaction ? "world-hop" : ""}`}
                      />
                    </EquipmentLayers>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 建物の中の様子 */}
      {openBuilding?.kind === "store" && (
        <BuildingDialog
          title="🏪 雑貨店"
          onClose={() => setOpenBuilding(null)}
        >
          <StoreInterior inventory={inventory} />
        </BuildingDialog>
      )}

      {openBuilding?.kind === "house" &&
        (() => {
          const character = characters.find(
            (item) => item.id === openBuilding.characterId,
          );

          if (!character) {
            return null;
          }

          const walker = walkers[character.id];
          const insideUntil = walker?.insideUntil ?? 0;

          return (
            <BuildingDialog
              title={`🏠 ${character.name}の家`}
              onClose={() => setOpenBuilding(null)}
            >
              <HouseInterior
                character={character}
                isHome={walker?.insideOf === "home" && insideUntil > 0}
                // 家に入るたびに，最初にいる場所が変わる
                seed={Math.floor(insideUntil / 1000)}
              />
            </BuildingDialog>
          );
        })()}

      {openBuilding?.kind === "building" &&
        builtIds.has(openBuilding.buildingId) && (
          <BuildingDialog
            title={`${BUILDING_CATALOG[openBuilding.buildingId].icon} ${BUILDING_CATALOG[openBuilding.buildingId].name}`}
            onClose={() => setOpenBuilding(null)}
          >
            <BuildingInterior
              buildingId={openBuilding.buildingId}
              visitors={visitorsOf(openBuilding.buildingId)}
            />
          </BuildingDialog>
        )}

      {/* 建築モードの画面 */}
      {buildAction?.kind === "build" && (
        <BuildingDialog
          title="🔨 ここに建てる"
          onClose={() => setBuildAction(null)}
        >
          <BuildMenu
            gold={inventory.gold}
            builtIds={builtIds}
            onBuild={(buildingId) =>
              runBuildAction(() =>
                purchaseBuildingAction(
                  buildingId,
                  buildAction.row,
                  buildAction.offset,
                ),
              )
            }
          />
        </BuildingDialog>
      )}

      {buildAction?.kind === "manage" && (
        <BuildingDialog
          title={`${BUILDING_CATALOG[buildAction.buildingId].icon} ${BUILDING_CATALOG[buildAction.buildingId].name}`}
          onClose={() => setBuildAction(null)}
        >
          <ManageBuilding
            buildingId={buildAction.buildingId}
            onMove={() =>
              setBuildAction({
                kind: "move",
                buildingId: buildAction.buildingId,
              })
            }
            onDemolish={() =>
              runBuildAction(() =>
                demolishBuildingAction(buildAction.buildingId),
              )
            }
          />
        </BuildingDialog>
      )}
    </section>
  );
}
