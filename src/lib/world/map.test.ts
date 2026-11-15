import { describe, expect, it } from "vitest";

import {
  buildWorldMap,
  isBuildableLot,
  pickRoadTarget,
  planRoute,
} from "@/lib/world/map";

const ids = (count: number) =>
  Array.from({ length: count }, (_, index) => `character-${index}`);

describe("ワールドの地図", () => {
  it("キャラクター1体につき家が1軒あり，掲示板と雑貨店が1つずつある", () => {
    const map = buildWorldMap(ids(5));
    const houses = map.lots.filter((lot) => lot.kind === "house");

    expect(houses.map((lot) => lot.characterId).sort()).toEqual(
      ids(5).sort(),
    );
    expect(
      map.lots.filter((lot) => lot.kind === "quest_board"),
    ).toHaveLength(1);
    expect(
      map.lots.filter((lot) => lot.kind === "general_store"),
    ).toHaveLength(1);
  });

  it("掲示板と雑貨店は，奥の列の真ん中に並ぶ", () => {
    const map = buildWorldMap(ids(3));
    const board = map.lots.find((lot) => lot.kind === "quest_board")!;
    const shop = map.lots.find((lot) => lot.kind === "general_store")!;

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

describe("ワールドの広さと飾り", () => {
  it("キャラクターが少なくても，1列に14区画ある", () => {
    const map = buildWorldMap(ids(1));

    expect(map.lots.filter((lot) => lot.row === 0)).toHaveLength(14);
  });

  it("空いた区画には，飾りがある", () => {
    const map = buildWorldMap(ids(3));
    const empty = map.lots.filter((lot) => lot.kind === "empty");

    expect(empty.length).toBeGreaterThan(0);
    expect(empty.every((lot) => lot.decoration)).toBe(true);
  });

  it("掲示板と雑貨店は，キャラクターが多くても真ん中に並ぶ", () => {
    // 区画が奇数列になりそうな数でも，列は偶数にそろえる
    const map = buildWorldMap(ids(31));
    const board = map.lots.find((lot) => lot.kind === "quest_board")!;
    const shop = map.lots.find((lot) => lot.kind === "general_store")!;

    expect(Math.abs((board.x + shop.x) / 2 - map.width / 2)).toBeLessThan(
      1,
    );
  });
});

describe("キャラクターが歩く範囲", () => {
  it("建物が建っているあたりだけを歩き，世界の端までは行かない", () => {
    const map = buildWorldMap(ids(3));
    const built = map.lots.filter((lot) => lot.kind !== "empty");

    expect(map.walkMinX).toBeGreaterThan(map.roadMinX);
    expect(map.walkMaxX).toBeLessThan(map.roadMaxX);

    // すべての建物の扉が，歩く範囲の中にある
    for (const lot of built) {
      expect(lot.door.x).toBeGreaterThan(map.walkMinX);
      expect(lot.door.x).toBeLessThan(map.walkMaxX);
    }
  });

  it("歩く範囲の両端は，つなぎの道になっている", () => {
    const map = buildWorldMap(ids(9));

    expect(map.connectorXs).toContain(map.walkMinX);
    expect(map.connectorXs).toContain(map.walkMaxX);
  });

  it("道順は，歩く範囲の外のつなぎの道を通らない", () => {
    const map = buildWorldMap(ids(3));
    const [roadA, roadB] = map.roadYs;

    for (const x of [map.walkMinX, (map.walkMinX + map.walkMaxX) / 2, map.walkMaxX]) {
      const route = planRoute(map, { x, y: roadA }, { x, y: roadB });

      expect(route[0].x).toBeGreaterThanOrEqual(map.walkMinX);
      expect(route[0].x).toBeLessThanOrEqual(map.walkMaxX);
    }
  });

  it("キャラクターが増えると，歩く範囲も広がる", () => {
    const small = buildWorldMap(ids(2));
    const large = buildWorldMap(ids(20));

    expect(large.walkMaxX - large.walkMinX).toBeGreaterThan(
      small.walkMaxX - small.walkMinX,
    );
  });
});

describe("建てた建物", () => {
  it("建てた建物は，その場所に置かれ，家はほかの区画に建つ", () => {
    const map = buildWorldMap(ids(3), [
      { buildingId: "cafe", row: 1, offset: 0 },
    ]);
    const cafe = map.lots.find((lot) => lot.buildingId === "cafe")!;

    expect(cafe.kind).toBe("building");
    expect(cafe.row).toBe(1);
    expect(cafe.offset).toBe(0);
    expect(map.lots.filter((lot) => lot.kind === "house")).toHaveLength(3);
  });

  it("キャラクターが増えて世界が広がっても，建物の場所は掲示板から見て同じ", () => {
    const building = { buildingId: "library" as const, row: 0 as const, offset: 3 };
    const small = buildWorldMap(ids(2), [building]);
    const large = buildWorldMap(ids(40), [building]);

    const boardX = (map: typeof small) =>
      map.lots.find((lot) => lot.kind === "quest_board")!.x;
    const libraryX = (map: typeof small) =>
      map.lots.find((lot) => lot.buildingId === "library")!.x;

    expect(libraryX(small) - boardX(small)).toBe(
      libraryX(large) - boardX(large),
    );
  });

  it("掲示板や雑貨店の場所には，建物を置かない", () => {
    const map = buildWorldMap(ids(1), [
      { buildingId: "cafe", row: 0, offset: 0 },
    ]);

    expect(map.lots.find((lot) => lot.buildingId === "cafe")).toBeUndefined();
    expect(map.lots.filter((lot) => lot.kind === "quest_board")).toHaveLength(1);
  });

  it("端の建物も収まるように，世界が広がる", () => {
    const map = buildWorldMap(ids(1), [
      { buildingId: "lab", row: 1, offset: 12 },
    ]);

    expect(map.lots.find((lot) => lot.buildingId === "lab")).toBeDefined();
  });

  it("空いた区画にだけ建てられる", () => {
    const map = buildWorldMap(ids(1));
    const empty = map.lots.find((lot) => lot.kind === "empty")!;

    expect(isBuildableLot(map, empty.row, empty.offset)).toBe(true);
    // 掲示板の場所
    expect(isBuildableLot(map, 0, 0)).toBe(false);
    // 地図の外
    expect(isBuildableLot(map, 0, 99)).toBe(false);
  });
});
