import { describe, expect, it } from "vitest";

import {
  getInitialWalker,
  stepWalker,
  type Walker,
  type WalkerContext,
} from "@/components/world/walker";
import { buildWorldMap } from "@/lib/world/map";

const map = buildWorldMap(["a", "b"], [
  { key: "cafe", row: 1, offset: 1 },
  { key: "fountain", row: 1, offset: 2 },
]);

const homeDoor = map.lots.find((lot) => lot.characterId === "a")!.door;
const friendDoor = map.lots.find((lot) => lot.characterId === "b")!.door;
const cafeDoor = map.lots.find((lot) => lot.buildingId === "cafe")!.door;
const fountainDoor = map.lots.find(
  (lot) => lot.buildingId === "fountain",
)!.door;

function context(
  now: number,
  random: () => number = () => 0.5,
): WalkerContext {
  return {
    map,
    homeDoor,
    buildings: new Map([
      ["cafe", { door: cafeDoor, isIndoor: true }],
      ["fountain", { door: fountainDoor, isIndoor: false }],
    ]),
    friendHouses: new Map([["house:b", friendDoor]]),
    now,
    random,
  };
}

// 着くまで歩かせる（曲がり角も含めて，行き先に着いて次の動きを決めるまで）
function walkUntilArrived(walker: Walker, start: number) {
  let current = walker;
  let now = start;

  for (let step = 0; step < 10 && (current.route.length > 0 || current.goingTo); step += 1) {
    now = Math.max(now, current.nextMoveAt);
    current = stepWalker(current, context(now));
  }

  return { walker: current, now };
}

describe("キャラクターの動き", () => {
  it("家に帰ると，中に入ってしばらく出てこない", () => {
    // 1つ目の乱数（行き先を選ぶ）が小さいと家に帰る
    const start = stepWalker(
      { ...getInitialWalker(cafeDoor) },
      context(0, () => 0.1),
    );

    expect(start.goingTo).toBe("home");

    const { walker, now } = walkUntilArrived(start, 0);

    expect(walker.insideOf).toBe("home");
    expect(walker.insideUntil).toBeGreaterThan(now);
    expect(walker.position).toEqual(homeDoor);

    // 中にいる間は動かない
    expect(stepWalker(walker, context(now + 1000))).toBe(walker);
  });

  it("建物に立ち寄ると，中に入る", () => {
    const walker: Walker = {
      ...getInitialWalker(homeDoor),
      goingTo: "cafe",
    };
    const { walker: arrived } = walkUntilArrived(walker, 0);

    expect(arrived.insideOf).toBe("cafe");
    expect(arrived.position).toEqual(cafeDoor);
  });

  it("外の建物（噴水）では，中に入らずにそばで休む", () => {
    const walker: Walker = {
      ...getInitialWalker(homeDoor),
      goingTo: "fountain",
    };
    const { walker: arrived, now } = walkUntilArrived(walker, 0);

    expect(arrived.insideOf).toBeNull();
    expect(arrived.restingAt).toBe("fountain");
    expect(arrived.nextMoveAt).toBeGreaterThan(now);
  });

  it("中から出てくると，外を歩けるようになる", () => {
    const inside: Walker = {
      ...getInitialWalker(cafeDoor),
      insideOf: "cafe",
      insideUntil: 1000,
    };
    const out = stepWalker(inside, context(2000));

    expect(out.insideOf).toBeNull();
    expect(out.insideUntil).toBe(0);
  });

  it("立ち寄る途中で建物が取り壊されたら，やめて歩き回る", () => {
    const walker: Walker = {
      ...getInitialWalker(homeDoor),
      goingTo: "library",
    };

    expect(stepWalker(walker, context(0)).goingTo).toBeNull();
  });
});

describe("友だちの家へ遊びに行く", () => {
  it("ほかのキャラクターの家に遊びに行くと，その家の中に入る", () => {
    const walker: Walker = {
      ...getInitialWalker(homeDoor),
      goingTo: "house:b",
    };
    const { walker: arrived } = walkUntilArrived(walker, 0);

    expect(arrived.insideOf).toBe("house:b");
    expect(arrived.position).toEqual(friendDoor);
  });
});
