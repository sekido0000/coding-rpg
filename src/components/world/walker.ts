/*
 * リポジトリワールドのキャラクター1人の動き．
 *
 * 道を歩き回り，ときどき自分の家や，建てた建物に立ち寄る．
 * 家や屋内の建物では中に入ってしばらく過ごし，
 * 噴水のような外の建物では，そばでひと休みする．
 */

import type { BuildingId, HouseLotKey } from "@/lib/buildings/catalog";
import {
  pickRoadTarget,
  planRoute,
  type WorldMap,
} from "@/lib/world/map";
import {
  getWalkDuration,
  pickIdleTime,
  type Position,
} from "@/lib/world/movement";

// 立ち寄る先．home は自分の家，house:〜 はほかのキャラクターの家
export type Visit = "home" | BuildingId | HouseLotKey;

export type Walker = {
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
  // 立ち寄ろうとしている先
  goingTo: Visit | null;
  // 中に入っている建物（家を含む）．外にいる時は null
  insideOf: Visit | null;
  // 中にいる間は，この時刻まで出てこない（0 の時は外にいる）
  insideUntil: number;
  // 外の建物（噴水など）のそばで休んでいる時は，その建物
  restingAt: BuildingId | null;
};

// 立ち寄れる建物の扉と，中に入るか
export type VisitTarget = {
  door: Position;
  isIndoor: boolean;
};

export type WalkerContext = {
  map: WorldMap;
  // 自分の家の扉
  homeDoor: Position;
  // 建てた建物
  buildings: Map<BuildingId, VisitTarget>;
  // ほかのキャラクターの家の扉（遊びに行く先）
  friendHouses: Map<HouseLotKey, Position>;
  now: number;
  random: () => number;
};

// 次の行き先を選ぶ時に，自分の家に帰る確率
const GO_HOME_CHANCE = 0.2;

// 次の行き先を選ぶ時に，ほかのキャラクターの家へ遊びに行く確率（ほかのキャラクターがいる時）
const VISIT_FRIEND_CHANCE = 0.1;

// 次の行き先を選ぶ時に，建てた建物に立ち寄る確率（建物がある時）
const VISIT_BUILDING_CHANCE = 0.3;

// 家・建物の中にいる時間（ミリ秒）
const INSIDE_TIME: Record<"home" | "building", [number, number]> = {
  home: [30000, 60000],
  building: [20000, 40000],
};

// 外の建物のそばで休む時間（ミリ秒）
const REST_TIME: [number, number] = [15000, 25000];

function between([min, max]: [number, number], random: () => number) {
  return min + (max - min) * random();
}

// 最初は自分の家の前に立つ（サーバーとブラウザで同じ画面になるよう，乱数は使わない）
export function getInitialWalker(door: Position): Walker {
  return {
    position: door,
    duration: 0,
    isFacingLeft: false,
    arrivedAt: 0,
    nextMoveAt: 0,
    route: [],
    goingTo: null,
    insideOf: null,
    insideUntil: 0,
    restingAt: null,
  };
}

// 次の場所へ歩き出す
function walkTo(
  walker: Walker,
  route: Position[],
  now: number,
  random: () => number,
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
    // 途中の曲がり角では止まらず，最後の場所に着いたら少し休む（立ち寄る時は休まない）
    nextMoveAt:
      now +
      duration +
      (isLast && !walker.goingTo ? pickIdleTime(random) : 0),
    route: rest,
    restingAt: null,
  };
}

function isSamePosition(a: Position, b: Position) {
  return a.x === b.x && a.y === b.y;
}

// 立ち寄る先の扉．建物が取り壊されていた時は null
function getVisitTarget(
  visit: Visit,
  context: WalkerContext,
): VisitTarget | null {
  if (visit === "home") {
    return { door: context.homeDoor, isIndoor: true };
  }

  if (visit.startsWith("house:")) {
    const door = context.friendHouses.get(visit as HouseLotKey);

    return door ? { door, isIndoor: true } : null;
  }

  return context.buildings.get(visit as BuildingId) ?? null;
}

/*
 * 1人のキャラクターの次の動きを決める．
 * 動かない時は，受け取った walker をそのまま返す．
 */
export function stepWalker(
  walker: Walker,
  context: WalkerContext,
): Walker {
  const { map, now, random } = context;

  // 中にいる
  if (walker.insideUntil > now) {
    return walker;
  }

  // 中から出てきた
  if (walker.insideUntil > 0) {
    return {
      ...walker,
      insideOf: null,
      insideUntil: 0,
      nextMoveAt: now + pickIdleTime(random),
    };
  }

  if (now < walker.nextMoveAt) {
    return walker;
  }

  // 道の途中なら，次の曲がり角へ
  if (walker.route.length > 0) {
    return walkTo(walker, walker.route, now, random);
  }

  if (walker.goingTo) {
    const target = getVisitTarget(walker.goingTo, context);

    // 建物が取り壊されていたら，やめて歩き回る
    if (!target) {
      return { ...walker, goingTo: null };
    }

    if (isSamePosition(walker.position, target.door)) {
      const visit = walker.goingTo;

      // 外の建物では，中に入らずにそばで休む（家は必ず中に入る）
      if (!target.isIndoor && visit !== "home" && !visit.startsWith("house:")) {
        return {
          ...walker,
          goingTo: null,
          restingAt: visit as BuildingId,
          nextMoveAt: now + between(REST_TIME, random),
        };
      }

      return {
        ...walker,
        goingTo: null,
        insideOf: visit,
        insideUntil:
          now +
          between(
            INSIDE_TIME[visit === "home" ? "home" : "building"],
            random,
          ),
      };
    }

    // 会話などで寄り道した時は，改めて向かう
    return walkTo(
      walker,
      planRoute(map, walker.position, target.door),
      now,
      random,
    );
  }

  // 次の行き先を選ぶ（家に帰る・友だちの家へ遊びに行く・建物に立ち寄る・歩き回る）
  const roll = random();
  const buildingIds = [...context.buildings.keys()];
  const friendKeys = [...context.friendHouses.keys()];
  const pick = <T,>(items: T[]) =>
    items[Math.floor(random() * items.length)];
  let goingTo: Visit | null = null;

  if (roll < GO_HOME_CHANCE) {
    goingTo = "home";
  } else if (
    friendKeys.length > 0 &&
    roll < GO_HOME_CHANCE + VISIT_FRIEND_CHANCE
  ) {
    goingTo = pick(friendKeys);
  } else if (
    buildingIds.length > 0 &&
    roll < GO_HOME_CHANCE + VISIT_FRIEND_CHANCE + VISIT_BUILDING_CHANCE
  ) {
    goingTo = pick(buildingIds);
  }

  const destination = goingTo
    ? getVisitTarget(goingTo, context)!.door
    : pickRoadTarget(map, random);

  return walkTo(
    { ...walker, goingTo },
    planRoute(map, walker.position, destination),
    now,
    random,
  );
}
