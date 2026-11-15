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
  ItemShop,
  QuestBoardSign,
  Tree,
} from "@/components/world/buildings";
import { useConversations } from "@/components/world/use-conversations";
import { useDragScroll } from "@/components/world/use-drag-scroll";
import { useGrowthReactions } from "@/components/world/use-growth-reactions";
import {
  useSpeeches,
  type Speech,
} from "@/components/world/use-speeches";
import { getCharacterEvolution } from "@/lib/characters/catalog";
import type { ActivitySummary } from "@/lib/world/activity";
import {
  buildWorldMap,
  pickRoadTarget,
  planRoute,
  ROAD_WIDTH,
  TILE,
  type Lot,
  type WorldMap,
} from "@/lib/world/map";
import {
  getDepth,
  getWalkDuration,
  pickIdleTime,
  type Position,
} from "@/lib/world/movement";
import type { Character } from "@/types/character";

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
};

type Walker = {
  position: Position;
  // 今の場所まで歩いてくるのにかける時間（ミリ秒）
  duration: number;
  isFacingLeft: boolean;
  // 今の場所に着く時刻
  arrivedAt: number;
  // 次に歩き出す時刻（会話中は Infinity にして止める）
  nextMoveAt: number;
  // この先に通る場所（道に沿って歩いている途中）
  route: Position[];
  // 自分の家に帰る途中
  isGoingHome: boolean;
  // 家の中にいる間は，この時刻まで出てこない（0 の時は外にいる）
  insideUntil: number;
};

// 歩き出すかを確かめる間隔（ミリ秒）
const TICK_INTERVAL = 500;

// 最初に歩き出すまでの時間の最大（全員が同時に動き出さないようにずらす）
const FIRST_MOVE_DELAY = 3000;

// 次の行き先を選ぶ時に，自分の家に帰る確率
const GO_HOME_CHANCE = 0.2;

// 家の中にいる時間（ミリ秒）
const INSIDE_TIME = {
  min: 8000,
  max: 15000,
} as const;

// キャラクターの重なり順の上限．押せるものや吹き出しは，これより手前に出す
const FRONT_DEPTH = 5000;

// 最初は自分の家の前に立つ（サーバーとブラウザで同じ画面になるよう，乱数は使わない）
function getInitialWalker(door: Position): Walker {
  return {
    position: door,
    duration: 0,
    isFacingLeft: false,
    arrivedAt: 0,
    nextMoveAt: 0,
    route: [],
    isGoingHome: false,
    insideUntil: 0,
  };
}

// 次の場所へ歩き出す
function walkTo(
  walker: Walker,
  route: Position[],
  now: number,
): Walker {
  const [target, ...rest] = route;
  const duration = getWalkDuration(walker.position, target);
  const isLast = rest.length === 0;

  return {
    ...walker,
    position: target,
    duration,
    // 真上・真下に歩く時は，向きを変えない
    isFacingLeft:
      target.x === walker.position.x
        ? walker.isFacingLeft
        : target.x < walker.position.x,
    arrivedAt: now + duration,
    // 途中の曲がり角では止まらず，最後の場所に着いたら少し休む
    nextMoveAt:
      now +
      duration +
      (isLast && !walker.isGoingHome ? pickIdleTime(Math.random) : 0),
    route: rest,
  };
}

function isSamePosition(a: Position, b: Position) {
  return a.x === b.x && a.y === b.y;
}

/*
 * 1人のキャラクターの次の動きを決める．
 * 動かない時は，受け取った walker をそのまま返す．
 */
function stepWalker(
  walker: Walker,
  door: Position,
  map: WorldMap,
  now: number,
): Walker {
  // 家の中にいる
  if (walker.insideUntil > now) {
    return walker;
  }

  // 家から出てきた
  if (walker.insideUntil > 0) {
    return {
      ...walker,
      insideUntil: 0,
      nextMoveAt: now + pickIdleTime(Math.random),
    };
  }

  if (now < walker.nextMoveAt) {
    return walker;
  }

  // 道の途中なら，次の曲がり角へ
  if (walker.route.length > 0) {
    return walkTo(walker, walker.route, now);
  }

  if (walker.isGoingHome) {
    // 家の前に着いたら，中に入る
    if (isSamePosition(walker.position, door)) {
      return {
        ...walker,
        isGoingHome: false,
        insideUntil:
          now +
          INSIDE_TIME.min +
          (INSIDE_TIME.max - INSIDE_TIME.min) * Math.random(),
      };
    }

    // 会話などで寄り道した時は，改めて家へ向かう
    return walkTo(walker, planRoute(map, walker.position, door), now);
  }

  // 次の行き先を選ぶ
  const isGoingHome = Math.random() < GO_HOME_CHANCE;
  const target = isGoingHome ? door : pickRoadTarget(map, Math.random);

  return walkTo(
    { ...walker, isGoingHome },
    planRoute(map, walker.position, target),
    now,
  );
}

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
}: {
  lot: Lot;
  houseIndex: number;
  owner?: Character;
  hasPendingRewards: boolean;
}) {
  const style: CSSProperties = {
    left: lot.x,
    top: lot.bottom,
    zIndex: lot.bottom,
  };
  const base = "absolute -translate-x-1/2 -translate-y-full";
  const clickable =
    "rounded-lg outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-300";

  switch (lot.kind) {
    case "house":
      return (
        <div className={base} style={style}>
          <House colors={HOUSE_COLORS[houseIndex % HOUSE_COLORS.length]} />
          {owner && <Nameplate>{`${owner.name}の家`}</Nameplate>}
        </div>
      );

    case "quest_board":
      return (
        <button
          type="button"
          onClick={openQuestPanel}
          aria-label="クエスト掲示板（今週のクエストを開く）"
          className={`${base} ${clickable}`}
          style={style}
        >
          <QuestBoardSign hasNotice={hasPendingRewards} />
          <Nameplate>📜 クエスト掲示板</Nameplate>
        </button>
      );

    case "item_shop":
      return (
        <Link
          href="/shop"
          aria-label="道具屋（お店を開く）"
          className={`${base} ${clickable}`}
          style={style}
        >
          <ItemShop />
          <Nameplate>🏪 道具屋</Nameplate>
        </Link>
      );

    case "empty":
      return (
        <div className={`${base} pointer-events-none`} style={style}>
          <FlowerBed />
        </div>
      );
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
 * キャラクターを押すと詳細画面へ，掲示板を押すとクエスト，道具屋を押すとお店が開く．
 */
export function RepositoryWorld({
  characters,
  activity,
  hasPendingRewards,
}: RepositoryWorldProps) {
  const characterIds = characters
    .map((character) => character.id)
    .join(",");

  const map = useMemo(
    () => buildWorldMap(characterIds.split(",").filter(Boolean)),
    [characterIds],
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
      const entered: string[] = [];
      const exited: string[] = [];

      setWalkers((current) => {
        const next = { ...current };
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

          const stepped = stepWalker(walker, door, map, now);

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

        return hasChanged ? next : current;
      });

      // 家の中にいる間は，独り言や会話をしない
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
  }, [characterIds, doors, map, setBusy]);

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
                  className={`group absolute z-[var(--depth)] -translate-x-1/2 -translate-y-full rounded-xl outline-none hover:z-[5001] focus-visible:z-[5001] focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                    isInside ? "pointer-events-none opacity-0" : ""
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

                  <span
                    className="repo-character-float relative block"
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
    </section>
  );
}
