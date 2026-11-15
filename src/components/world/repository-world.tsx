"use client";

import { DotGothic16 } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useOptimistic,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { openQuestPanel } from "@/components/quests/quest-panel";
import { Spinner } from "@/components/ui/spinner";
import { EquipmentLayers } from "@/components/items/equipment-layers";
import {
  FlowerBed,
  HOUSE_COLORS,
  House,
  DungeonGate,
  Workshop,
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
  findLotAt,
  ROAD_WIDTH,
  TILE,
  type Lot,
  type WorldMap,
} from "@/lib/world/map";
import { getDepth, type Position } from "@/lib/world/movement";
import {
  BUILDING_CATALOG,
  houseLotKey,
  isBuildingId,
  type BuildingId,
  type HouseLotKey,
  type LotKey,
  type Placement,
} from "@/lib/buildings/catalog";
import type { Character } from "@/types/character";
import {
  demolishBuildingAction,
  moveBuildingAction,
  purchaseBuildingAction,
  type BuildingActionResult,
} from "@/app/actions/building-actions";
import { BuildingInterior } from "@/components/world/building-interiors";
import { BuildMenu, ManageLot } from "@/components/world/build-menus";
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
  // 建物の場所（建てた建物と，移した家・掲示板・雑貨店）
  placements: Placement[];
};

// 建物の場所の変更（押した瞬間に表示を切り替えるために使う）
type PlacementChange =
  | { kind: "place"; placement: Placement }
  | { kind: "remove"; key: LotKey }
  // まだ場所を保存していない家・掲示板・雑貨店を，今の場所のまま保存する
  | { kind: "freeze"; placements: Placement[] };

// 中の様子を開いている建物
type OpenBuilding =
  | { kind: "house"; characterId: string }
  | { kind: "store" }
  | { kind: "building"; buildingId: BuildingId };

/*
 * 建築モードで開いている画面．
 * - build：空いた区画を押して，建てる建物を選ぶ
 * - manage：建物を押して，移すか（建てた建物は）取り壊すかを選ぶ
 * - move：移す先の空いた区画を選んでいる
 */
type BuildAction =
  | { kind: "build"; row: 0 | 1; offset: number }
  | { kind: "manage"; key: LotKey }
  | { kind: "move"; key: LotKey };

// 建物をドラッグしている時の，地図の上の位置
type Dragging = {
  key: LotKey;
  x: number;
  y: number;
  // 押した位置から動かしたか（動かしていなければ，離した時は押したのと同じにする）
  hasMoved: boolean;
};

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
function Nameplate({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/75 px-1.5 py-0.5 text-[11px] font-bold text-white">
      {children}
    </span>
  );
}

// 区画に建つ建物の絵（ドラッグ中の影にも使う）
function LotArt({
  lot,
  houseIndex,
  hasPendingRewards,
}: {
  lot: Lot;
  houseIndex: number;
  hasPendingRewards: boolean;
}) {
  switch (lot.kind) {
    case "house":
      return (
        <House colors={HOUSE_COLORS[houseIndex % HOUSE_COLORS.length]} />
      );
    case "quest_board":
      return <QuestBoardSign hasNotice={hasPendingRewards} />;
    case "general_store":
      return <GeneralStore />;
    case "dungeon_gate":
      return <DungeonGate />;
    case "workshop":
      return <Workshop />;
    case "building": {
      const Exterior = BUILDING_EXTERIORS[lot.buildingId!];

      return <Exterior />;
    }
    default:
      return null;
  }
}

// 空いた区画の飾り
function LotDecorationArt({ lot }: { lot: Lot }) {
  if (lot.decoration === "grove") {
    return (
      <>
        <Tree />
        <span className="-ml-6 mb-3 block">
          <Tree />
        </span>
      </>
    );
  }

  if (lot.decoration === "well") {
    return <Well />;
  }

  if (lot.decoration === "bench") {
    return (
      <>
        <FlowerBed />
        <Bench />
      </>
    );
  }

  return (
    <>
      <FlowerBed />
      <FlowerBed />
    </>
  );
}

// 建物の名前（札やお知らせに使う）
function getLotLabel(lot: Lot, owner?: Character) {
  switch (lot.kind) {
    case "house":
      return owner ? `${owner.name}の家` : "家";
    case "quest_board":
      return "📜 クエスト掲示板";
    case "general_store":
      return "🏪 雑貨店";
    case "dungeon_gate":
      return "⚔️ ボスに挑む";
    case "workshop":
      return "🔨 工房";
    case "building": {
      const building = BUILDING_CATALOG[lot.buildingId!];

      return `${building.icon} ${building.name}`;
    }
    default:
      return "";
  }
}

/*
 * 建物の中にいるキャラクターを，外から分かるように屋根の上に出す吹き出し．
 * 3人まで顔を並べ，それより多い時は「+2」のように数を出す．
 */
function VisitorsBubble({ visitors }: { visitors: Character[] }) {
  if (visitors.length === 0) {
    return null;
  }

  return (
    <span
      className="pointer-events-none absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 shadow-lg"
      aria-label={`${visitors.map((visitor) => visitor.name).join("・")}が中にいます`}
    >
      {visitors.slice(0, 3).map((visitor) => (
        <Image
          key={visitor.id}
          src={
            getCharacterEvolution(visitor.characterType, visitor.level)
              .imagePath
          }
          alt=""
          width={24}
          height={24}
          className="repo-pixel-image h-6 w-6"
        />
      ))}
      {visitors.length > 3 && (
        <span className="px-0.5 text-xs font-bold text-slate-700">
          +{visitors.length - 3}
        </span>
      )}
      <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-white" />
    </span>
  );
}

/*
 * 区画に建つ建物．足元（正面の下端）を区画の位置に合わせて置く．
 *
 * ふだんは押すと中の様子を開く．建築モードでは，押すと移す・取り壊すを選べ，
 * ドラッグして空いた区画へ移せる．空いた区画は，建築モードの時だけ押せる．
 */
function LotBuilding({
  lot,
  houseIndex,
  owner,
  hasPendingRewards,
  visitors,
  isBuildMode,
  movingKey,
  isDropTarget,
  isDragged,
  onOpen,
  onBuildAction,
  onDragStart,
}: {
  lot: Lot;
  houseIndex: number;
  owner?: Character;
  hasPendingRewards: boolean;
  // 中にいるキャラクター
  visitors: Character[];
  isBuildMode: boolean;
  // 移す先を選んでいる建物
  movingKey: LotKey | null;
  // ドラッグしている建物を，この区画の上に重ねている
  isDropTarget: boolean;
  // この建物をドラッグしている
  isDragged: boolean;
  onOpen: (building: OpenBuilding) => void;
  onBuildAction: (lot: Lot) => void;
  onDragStart: (lot: Lot, event: ReactPointerEvent) => void;
}) {
  const router = useRouter();
  // ボス戦のページへ移っている間は，押せたことが分かるよう「移動中…」を出す
  const [isNavigating, startNavigation] = useTransition();
  const style: CSSProperties = {
    left: lot.x,
    top: lot.bottom,
    zIndex: lot.bottom,
  };
  const base = "absolute -translate-x-1/2 -translate-y-full";
  const clickable =
    "rounded-lg outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-300";

  if (lot.kind === "empty") {
    // ふだんは飾りだけ（押せない）
    if (!isBuildMode) {
      return (
        <div
          className={`${base} pointer-events-none flex items-end gap-2`}
          style={style}
        >
          <LotDecorationArt lot={lot} />
        </div>
      );
    }

    // 建築モードでは，建てられる（移せる）区画として光らせる
    return (
      <button
        type="button"
        onClick={() => onBuildAction(lot)}
        aria-label={movingKey ? "この区画へ移す" : "この区画に建てる"}
        className={`${base} ${clickable} group/lot flex h-36 w-48 items-end justify-center gap-2 rounded-xl border-2 border-dashed ${
          isDropTarget
            ? "scale-105 border-amber-200 bg-amber-300/40"
            : "border-amber-300/80 bg-amber-300/15"
        }`}
        style={style}
      >
        <span className="opacity-40">
          <LotDecorationArt lot={lot} />
        </span>
        <span className="absolute inset-0 grid place-items-center">
          <span className="rounded-full bg-amber-300 px-3 py-1 text-sm font-black text-slate-950 shadow-lg transition group-hover/lot:scale-110">
            {movingKey || isDropTarget ? "ここへ移す" : "＋ 建てる"}
          </span>
        </span>
      </button>
    );
  }

  const label = getLotLabel(lot, owner);

  // ふだん押した時に開く画面（掲示板はクエストのパネル，ダンジョンの入口はボス戦のページ，工房は工房のページ）
  const open = () => {
    if (lot.kind === "house" && owner) {
      onOpen({ kind: "house", characterId: owner.id });
    } else if (lot.kind === "general_store") {
      onOpen({ kind: "store" });
    } else if (lot.kind === "building" && lot.buildingId) {
      onOpen({ kind: "building", buildingId: lot.buildingId });
    } else if (lot.kind === "quest_board") {
      openQuestPanel();
    } else if (lot.kind === "dungeon_gate") {
      startNavigation(() => router.push("/battle"));
    } else if (lot.kind === "workshop") {
      startNavigation(() => router.push("/workshop"));
    }
  };

  return (
    <button
      type="button"
      onClick={() => (isBuildMode ? onBuildAction(lot) : open())}
      onPointerDown={(event) => {
        if (isBuildMode) {
          onDragStart(lot, event);
        }
      }}
      // 建築モードでドラッグする時は，指でのスクロールにしない
      data-build-draggable={isBuildMode ? "true" : undefined}
      aria-label={
        isBuildMode
          ? `${label}（ドラッグで移す・押すと移す/取り壊す）`
          : lot.kind === "dungeon_gate"
            ? `${label}（ボス戦のページへ）`
            : lot.kind === "workshop"
              ? `${label}（工房のページへ）`
            : `${label}（中をのぞく）`
      }
      className={`${base} ${clickable} ${
        isBuildMode
          ? "cursor-grab touch-none ring-2 ring-amber-300/80"
          : ""
      } ${movingKey === lot.key ? "animate-pulse" : ""} ${
        isDragged ? "opacity-30" : ""
      }`}
      style={style}
    >
      {/* 中にいるキャラクター */}
      {!isBuildMode && <VisitorsBubble visitors={visitors} />}

      <LotArt
        lot={lot}
        houseIndex={houseIndex}
        hasPendingRewards={hasPendingRewards}
      />

      {/* 研究所は，ときどき屋根から煙が出る */}
      {lot.buildingId === "lab" && (
        <span
          aria-hidden="true"
          className="lab-smoke absolute left-[78%] top-0 block h-5 w-5 rounded-full bg-slate-200/80"
        />
      )}

      <Nameplate>
        {isNavigating ? (
          <span className="inline-flex items-center gap-1.5">
            <Spinner />
            移動中…
          </span>
        ) : (
          label
        )}
      </Nameplate>
    </button>
  );
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
  placements,
}: RepositoryWorldProps) {
  const [openBuilding, setOpenBuilding] = useState<OpenBuilding | null>(
    null,
  );

  // 建築モード（空いた区画を押して建てる・建物を移す・取り壊す）
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [buildAction, setBuildAction] = useState<BuildAction | null>(null);
  // 建てた・移した・取り壊した時のお知らせ
  const [buildMessage, setBuildMessage] = useState<string | null>(null);
  // 建物をドラッグしている時の位置
  const [dragging, setDragging] = useState<Dragging | null>(null);

  /*
   * 建物の場所．移した・建てた・取り壊した瞬間に表示を切り替え（楽観的更新），
   * 保存は裏で行う．保存に失敗した時は，元の場所に戻る．
   */
  const [shownPlacements, changePlacement] = useOptimistic<
    Placement[],
    PlacementChange
  >(placements, (current, change) => {
    if (change.kind === "freeze") {
      const saved = new Set(current.map((placement) => placement.key));

      return [
        ...current,
        ...change.placements.filter((placement) => !saved.has(placement.key)),
      ];
    }

    const others = current.filter((placement) =>
      change.kind === "place"
        ? placement.key !== change.placement.key
        : placement.key !== change.key,
    );

    return change.kind === "place"
      ? [...others, change.placement]
      : others;
  });
  const [, startPlacementTransition] = useTransition();

  const characterIds = characters
    .map((character) => character.id)
    .join(",");

  // 建物の並びが変わった時だけ，地図を作り直す
  const placementsKey = shownPlacements
    .map((placement) => `${placement.key}|${placement.row}|${placement.offset}`)
    .sort()
    .join(",");

  const map = useMemo(
    () =>
      buildWorldMap(
        characterIds.split(",").filter(Boolean),
        placementsKey
          ? placementsKey.split(",").map((item) => {
              const [key, row, offset] = item.split("|");

              return {
                key: key as LotKey,
                row: Number(row) as 0 | 1,
                offset: Number(offset),
              };
            })
          : [],
      ),
    [characterIds, placementsKey],
  );

  // ほかのキャラクターの家の扉（遊びに行く先）
  const houseDoors = useMemo(
    () =>
      new Map<HouseLotKey, Position>(
        map.lots
          .filter((lot) => lot.kind === "house" && lot.characterId)
          .map((lot) => [houseLotKey(lot.characterId!), lot.door]),
      ),
    [map],
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

        // 遊びに行けるのは，自分以外のキャラクターの家
        const friendHouses = new Map(houseDoors);
        friendHouses.delete(houseLotKey(id));

        const stepped = stepWalker(walker, {
          map,
          homeDoor: door,
          buildings: visitTargets,
          friendHouses,
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
  }, [characterIds, doors, houseDoors, map, visitTargets, setBusy]);

  // 建てた・移した・取り壊した時のお知らせを，しばらく出す
  const showBuildMessage = (message: string) => {
    setBuildMessage(message);
    window.setTimeout(() => setBuildMessage(null), 4000);
  };

  /*
   * 建物の場所を変える．押した瞬間に表示を切り替え，裏で保存する．
   * 保存に失敗した時は，元の場所に戻ってお知らせを出す．
   */
  const changeLot = (
    change: PlacementChange,
    action: () => Promise<BuildingActionResult>,
  ) =>
    new Promise<BuildingActionResult>((resolve) => {
      setBuildAction(null);

      /*
       * 場所を保存していない家・掲示板・雑貨店は，空いた区画に自動で並ぶ．
       * そのままだと，建物を移して空いた場所へ別の家が詰めてきてしまうので，
       * 変える前に今の並びを保存しておく（サーバーでも同じように保存する）．
       */
      const saved = new Set(shownPlacements.map((placement) => placement.key));
      const autoPlaced = map.lots.flatMap((lot) =>
        lot.key &&
        !isBuildingId(lot.key) &&
        !saved.has(lot.key)
          ? [{ key: lot.key, row: lot.row, offset: lot.offset }]
          : [],
      );

      startPlacementTransition(async () => {
        if (autoPlaced.length > 0) {
          changePlacement({ kind: "freeze", placements: autoPlaced });
        }

        changePlacement(change);
        const result = await action();

        showBuildMessage(result.message);
        resolve(result);
      });
    });

  // 建物を空いた区画へ移す
  const moveLot = (key: LotKey, lot: Lot) =>
    changeLot(
      { kind: "place", placement: { key, row: lot.row, offset: lot.offset } },
      () => moveBuildingAction(key, lot.row, lot.offset),
    );

  // 建築モードで，区画や建物を押した時
  const handleBuildAction = (lot: Lot) => {
    if (buildAction?.kind === "move") {
      if (lot.kind === "empty") {
        void moveLot(buildAction.key, lot);
      }

      return;
    }

    if (lot.kind === "empty") {
      setBuildAction({ kind: "build", row: lot.row, offset: lot.offset });
    } else if (lot.key) {
      setBuildAction({ kind: "manage", key: lot.key });
    }
  };

  /*
   * 建築モードで，建物をドラッグして空いた区画へ移す．
   * 押した位置から少し動かしたらドラッグとみなし，地図の上で建物の影を指に付いてこさせる．
   * 動かさずに離した時は，押した時と同じ（移す・取り壊すを選ぶ画面）にする．
   */
  const groundRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<Dragging | null>(null);

  const toMapPosition = (clientX: number, clientY: number) => {
    const rect = groundRef.current?.getBoundingClientRect();

    return rect
      ? { x: clientX - rect.left, y: clientY - rect.top }
      : { x: 0, y: 0 };
  };

  const handleDragStart = (lot: Lot, event: ReactPointerEvent) => {
    if (!lot.key || event.button !== 0) {
      return;
    }

    const start = { x: event.clientX, y: event.clientY };
    const key = lot.key;

    const onMove = (moveEvent: PointerEvent) => {
      const hasMoved =
        draggingRef.current?.hasMoved ||
        Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y) >
          8;

      if (!hasMoved) {
        return;
      }

      const next = {
        key,
        ...toMapPosition(moveEvent.clientX, moveEvent.clientY),
        hasMoved: true,
      };

      draggingRef.current = next;
      setDragging(next);
    };

    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      const current = draggingRef.current;
      draggingRef.current = null;
      setDragging(null);

      if (!current?.hasMoved) {
        return;
      }

      // ドラッグした後のクリックで，移す・取り壊すの画面が開かないようにする
      window.addEventListener(
        "click",
        (clickEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        },
        { capture: true, once: true },
      );

      const position = toMapPosition(upEvent.clientX, upEvent.clientY);
      const target = findLotAt(map, position.x, position.y);

      if (target?.kind === "empty") {
        void moveLot(key, target);
      } else if (target && target.key !== key) {
        showBuildMessage("空いている区画にだけ移せます");
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // ドラッグしている建物を重ねている区画
  const dropTarget = dragging
    ? findLotAt(map, dragging.x, dragging.y)
    : null;
  const draggedLot = dragging
    ? map.lots.find((lot) => lot.key === dragging.key)
    : undefined;

  const exitBuildMode = () => {
    setIsBuildMode(false);
    setBuildAction(null);
  };

  // 建物の中にいるキャラクター（中の様子と，屋根の上の吹き出しに出す）
  const visitorsOf = (visit: string) =>
    characters.filter((character) => {
      const walker = walkers[character.id];

      if (!walker) {
        return false;
      }

      // 自分の家にいるキャラクターは，その家の中にいる
      const insideOf =
        walker.insideOf === "home"
          ? houseLotKey(character.id)
          : walker.insideOf;

      return (
        (insideOf === visit && walker.insideUntil > 0) ||
        walker.restingAt === visit
      );
    });

  const builtIds = new Set(
    shownPlacements
      .map((placement) => placement.key)
      .filter(isBuildingId),
  );

  // 移す・取り壊すの画面に出す建物の名前
  const getKeyLabel = (key: LotKey) => {
    const lot = map.lots.find((item) => item.key === key);

    return lot
      ? getLotLabel(
          lot,
          characters.find((character) => character.id === lot.characterId),
        )
      : "";
  };

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

        {/* 移す先を選んでいる時だけ，案内を出す */}
        {isBuildMode && buildAction?.kind === "move" && (
          <p className="max-w-64 rounded-lg bg-slate-950/85 px-3 py-1.5 text-right text-xs text-amber-100 shadow">
            {getKeyLabel(buildAction.key)}を移す先の区画を押してください
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
        {/*
         * 地図が画面より小さい時だけ真ん中に置く．
         * justify-center で寄せると，画面より大きい時に左（上）にはみ出した部分へ
         * スクロールできなくなるので，地図の側の m-auto で寄せる．
         */}
        <div className="flex min-h-full min-w-full">
          <div
            ref={groundRef}
            className="world-ground relative m-auto shrink-0"
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
                  visitors={lot.key ? visitorsOf(lot.key) : []}
                  isBuildMode={isBuildMode}
                  movingKey={
                    buildAction?.kind === "move" ? buildAction.key : null
                  }
                  isDropTarget={
                    !!dropTarget &&
                    dropTarget.kind === "empty" &&
                    dropTarget.row === lot.row &&
                    dropTarget.offset === lot.offset
                  }
                  isDragged={!!dragging && dragging.key === lot.key}
                  onOpen={setOpenBuilding}
                  onBuildAction={handleBuildAction}
                  onDragStart={handleDragStart}
                />
              );
            })}

            {/* ドラッグしている建物の影（指に付いてくる） */}
            {dragging && draggedLot && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-[85%] opacity-80 drop-shadow-[0_12px_12px_rgba(0,0,0,0.5)]"
                style={{ left: dragging.x, top: dragging.y, zIndex: FRONT_DEPTH }}
              >
                <LotArt
                  lot={draggedLot}
                  houseIndex={Math.max(
                    characters.findIndex(
                      (character) => character.id === draggedLot.characterId,
                    ),
                    0,
                  )}
                  hasPendingRewards={hasPendingRewards}
                />
              </div>
            )}

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
                // 遊びに来ているほかのキャラクター
                guests={visitorsOf(houseLotKey(character.id)).filter(
                  (visitor) => visitor.id !== character.id,
                )}
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
              changeLot(
                {
                  kind: "place",
                  placement: {
                    key: buildingId,
                    row: buildAction.row,
                    offset: buildAction.offset,
                  },
                },
                () =>
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
          title={getKeyLabel(buildAction.key)}
          onClose={() => setBuildAction(null)}
        >
          <ManageLot
            lotKey={buildAction.key}
            onMove={() =>
              setBuildAction({ kind: "move", key: buildAction.key })
            }
            onDemolish={
              // 取り壊せるのは，建てた建物だけ
              isBuildingId(buildAction.key)
                ? () => {
                    const key = buildAction.key as BuildingId;

                    return changeLot({ kind: "remove", key }, () =>
                      demolishBuildingAction(key),
                    );
                  }
                : undefined
            }
          />
        </BuildingDialog>
      )}
    </section>
  );
}
