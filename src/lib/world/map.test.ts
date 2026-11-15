import { describe, expect, it } from "vitest";

import {
  buildWorldMap,
  pickRoadTarget,
  planRoute,
} from "@/lib/world/map";

const ids = (count: number) =>
  Array.from({ length: count }, (_, index) => `character-${index}`);

describe("ワールドの地図", () => {
  it("キャラクター1体につき家が1軒あり，掲示板と道具屋が1つずつある", () => {
    const map = buildWorldMap(ids(5));
    const houses = map.lots.filter((lot) => lot.kind === "house");

    expect(houses.map((lot) => lot.characterId).sort()).toEqual(
      ids(5).sort(),
    );
    expect(
      map.lots.filter((lot) => lot.kind === "quest_board"),
    ).toHaveLength(1);
    expect(
      map.lots.filter((lot) => lot.kind === "item_shop"),
    ).toHaveLength(1);
  });

  it("掲示板と道具屋は，奥の列の真ん中に並ぶ", () => {
    const map = buildWorldMap(ids(3));
    const board = map.lots.find((lot) => lot.kind === "quest_board")!;
    const shop = map.lots.find((lot) => lot.kind === "item_shop")!;

    expect(board.row).toBe(0);
    expect(shop.row).toBe(0);
    expect(Math.abs((board.x + shop.x) / 2 - map.width / 2)).toBeLessThan(
      1,
    );
  });

  it("キャラクターが増えると，世界が横に広がる", () => {
    const small = buildWorldMap(ids(2));
    const large = buildWorldMap(ids(30));

    expect(large.width).toBeGreaterThan(small.width);
    expect(large.lots.filter((lot) => lot.kind === "house")).toHaveLength(
      30,
    );
  });

  it("区画は重ならない", () => {
    const map = buildWorldMap(ids(20));
    const keys = map.lots.map((lot) => `${lot.row}-${lot.x}`);

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("道に沿った移動", () => {
  const map = buildWorldMap(ids(5));
  const [roadA, roadB] = map.roadYs;

  it("同じ道の上なら，真っすぐ歩く", () => {
    expect(
      planRoute(map, { x: 200, y: roadA }, { x: 600, y: roadA }),
    ).toEqual([{ x: 600, y: roadA }]);
  });

  it("違う道へは，近いつなぎの道を通って行く", () => {
    const route = planRoute(
      map,
      { x: 200, y: roadA },
      { x: 300, y: roadB },
    );

    expect(route).toHaveLength(3);
    expect(route[0].y).toBe(roadA);
    expect(route[1].y).toBe(roadB);
    expect(route[0].x).toBe(route[1].x);
    expect(map.connectorXs).toContain(route[0].x);
    expect(route[2]).toEqual({ x: 300, y: roadB });
  });

  it("歩いていく場所は，どちらかの道の上", () => {
    for (const value of [0, 0.3, 0.6, 0.99]) {
      const target = pickRoadTarget(map, () => value);

      expect(map.roadYs).toContain(target.y);
      expect(target.x).toBeGreaterThanOrEqual(map.roadMinX);
      expect(target.x).toBeLessThanOrEqual(map.roadMaxX);
    }
  });
});
