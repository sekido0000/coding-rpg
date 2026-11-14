import { describe, expect, it } from "vitest";

import {
  IDLE_TIME,
  WALK_AREA,
  getDepth,
  getInitialPosition,
  getWalkDuration,
  pickIdleTime,
  pickTarget,
} from "./movement";

function isInWalkArea({ x, y }: { x: number; y: number }) {
  return (
    x >= WALK_AREA.minX &&
    x <= WALK_AREA.maxX &&
    y >= WALK_AREA.minY &&
    y <= WALK_AREA.maxY
  );
}

describe("最初に立つ場所", () => {
  it("全員が歩ける範囲の中に，重ならずに並ぶ", () => {
    const positions = Array.from({ length: 5 }, (_, index) =>
      getInitialPosition(index, 5),
    );

    expect(positions.every(isInWalkArea)).toBe(true);
    expect(
      new Set(positions.map((position) => position.x)).size,
    ).toBe(5);
  });

  it("同じ順番なら毎回同じ場所になる（サーバーとブラウザで食い違わない）", () => {
    expect(getInitialPosition(2, 4)).toEqual(
      getInitialPosition(2, 4),
    );
  });
});

describe("次に歩いていく場所", () => {
  it("乱数が端の値でも，歩ける範囲からはみ出さない", () => {
    expect(isInWalkArea(pickTarget(() => 0))).toBe(true);
    expect(isInWalkArea(pickTarget(() => 0.9999))).toBe(true);
  });
});

describe("歩く時間と待つ時間", () => {
  it("遠いほど，歩くのに時間がかかる", () => {
    const from = { x: 10, y: 60 };

    expect(
      getWalkDuration(from, { x: 80, y: 60 }),
    ).toBeGreaterThan(getWalkDuration(from, { x: 20, y: 60 }));
  });

  it("同じ場所なら，歩く時間は0", () => {
    expect(
      getWalkDuration({ x: 30, y: 70 }, { x: 30, y: 70 }),
    ).toBe(0);
  });

  it("待つ時間は決めた範囲に収まる", () => {
    expect(pickIdleTime(() => 0)).toBe(IDLE_TIME.min);
    expect(pickIdleTime(() => 0.9999)).toBeLessThanOrEqual(
      IDLE_TIME.max,
    );
  });
});

describe("重なり順", () => {
  it("下にいるキャラクターほど手前になる", () => {
    expect(getDepth({ x: 50, y: 80 })).toBeGreaterThan(
      getDepth({ x: 50, y: 60 }),
    );
  });
});
