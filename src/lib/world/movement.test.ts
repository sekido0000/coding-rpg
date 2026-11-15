import { describe, expect, it } from "vitest";

import {
  IDLE_TIME,
  getDepth,
  getWalkDuration,
  pickIdleTime,
} from "./movement";

describe("歩く時間と待つ時間", () => {
  it("遠いほど，歩くのに時間がかかる", () => {
    const from = { x: 100, y: 320 };

    expect(
      getWalkDuration(from, { x: 800, y: 320 }),
    ).toBeGreaterThan(getWalkDuration(from, { x: 200, y: 320 }));
  });

  it("同じ場所なら，歩く時間は0", () => {
    expect(
      getWalkDuration({ x: 300, y: 320 }, { x: 300, y: 320 }),
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
  it("下にいるものほど手前になる", () => {
    expect(getDepth({ x: 50, y: 576 })).toBeGreaterThan(
      getDepth({ x: 50, y: 320 }),
    );
  });
});
