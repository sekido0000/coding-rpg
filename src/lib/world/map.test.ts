import { describe, expect, it } from "vitest";

import {
  buildWorldMap,
  findLotAt,
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

  it("キャラクターが増えると，縦にも横にも広がり，正方形に近い形を保つ", () => {
    const small = buildWorldMap(ids(2));
    const large = buildWorldMap(ids(60));

    expect(large.width).toBeGreaterThan(small.width);
    expect(large.height).toBeGreaterThan(small.height);
    expect(large.width / large.height).toBeLessThan(2);
    expect(large.lots.filter((lot) => lot.kind === "house")).toHaveLength(
      60,
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
  it("キャラクターが少なくても，4列×8区画ある", () => {
    const map = buildWorldMap(ids(1));

    expect(map.roadYs).toHaveLength(4);
    expect(map.lots.filter((lot) => lot.row === 0)).toHaveLength(8);
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
  it("建物が建っているあたりを歩き，地図の外には出ない", () => {
    const map = buildWorldMap(ids(3));
    const built = map.lots.filter((lot) => lot.kind !== "empty");

    expect(map.walkMinX).toBeGreaterThanOrEqual(map.roadMinX);
    expect(map.walkMaxX).toBeLessThanOrEqual(map.roadMaxX);

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
      { key: "cafe", row: 1, offset: 0 },
    ]);
    const cafe = map.lots.find((lot) => lot.buildingId === "cafe")!;

    expect(cafe.kind).toBe("building");
    expect(cafe.row).toBe(1);
    expect(cafe.offset).toBe(0);
    expect(map.lots.filter((lot) => lot.kind === "house")).toHaveLength(3);
  });

  it("キャラクターが増えて世界が広がっても，建物の場所は掲示板から見て同じ", () => {
    const building = { key: "library" as const, row: 0 as const, offset: 3 };
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

  it("掲示板の最初の場所に別の建物がある時は，掲示板が空いた区画に移る", () => {
    // 掲示板を移したあとに，空いたその場所へカフェを建てた時など
    const map = buildWorldMap(ids(1), [
      { key: "cafe", row: 0, offset: 0 },
    ]);
    const cafe = map.lots.find((lot) => lot.buildingId === "cafe")!;

    expect([cafe.row, cafe.offset]).toEqual([0, 0]);
    expect(map.lots.filter((lot) => lot.kind === "quest_board")).toHaveLength(1);
  });

  it("端の建物も収まるように，世界が広がる", () => {
    const map = buildWorldMap(ids(1), [
      { key: "lab", row: 1, offset: 12 },
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

describe("家・掲示板・雑貨店を移す", () => {
  it("移した掲示板と雑貨店は，その場所に置かれる", () => {
    const map = buildWorldMap(ids(2), [
      { key: "quest_board", row: 1, offset: -3 },
      { key: "general_store", row: 1, offset: 4 },
    ]);
    const board = map.lots.find((lot) => lot.kind === "quest_board")!;
    const store = map.lots.find((lot) => lot.kind === "general_store")!;

    expect([board.row, board.offset]).toEqual([1, -3]);
    expect([store.row, store.offset]).toEqual([1, 4]);
  });

  it("移した家はその場所に置かれ，ほかの家は残りの区画に建つ", () => {
    const map = buildWorldMap(ids(3), [
      { key: "house:character-1", row: 0, offset: 5 },
    ]);
    const moved = map.lots.find((lot) => lot.characterId === "character-1")!;

    expect([moved.row, moved.offset]).toEqual([0, 5]);
    expect(moved.key).toBe("house:character-1");
    expect(map.lots.filter((lot) => lot.kind === "house")).toHaveLength(3);
  });

  it("いなくなったキャラクターの家の場所は，空いた区画として扱う", () => {
    const map = buildWorldMap(ids(1), [
      { key: "house:gone", row: 0, offset: 5 },
    ]);
    const lot = map.lots.find((item) => item.row === 0 && item.offset === 5)!;

    expect(lot.kind).toBe("empty");
  });

  it("移せる建物には，場所を保存する時の名前がある", () => {
    const map = buildWorldMap(ids(1), [{ key: "cafe", row: 1, offset: 2 }]);

    for (const lot of map.lots) {
      if (lot.kind === "empty") {
        expect(lot.key).toBeUndefined();
      } else {
        expect(lot.key).toBeDefined();
      }
    }
  });
});

describe("位置から区画を探す", () => {
  it("建物の絵のあたりの位置から，その区画が分かる", () => {
    const map = buildWorldMap(ids(2));
    const lot = map.lots[3];

    expect(findLotAt(map, lot.x + 20, lot.bottom - 40)).toBe(lot);
  });

  it("道の真ん中など，区画のない位置では見つからない", () => {
    const map = buildWorldMap(ids(2));

    expect(findLotAt(map, map.lots[0].x, map.height + 100)).toBeNull();
  });
});

describe("ダンジョンの入口", () => {
  it("ダンジョンの入口が1つあり，家の場所は入口がない時と変わらない", () => {
    const map = buildWorldMap(ids(4));
    const gates = map.lots.filter((lot) => lot.kind === "dungeon_gate");

    expect(gates).toHaveLength(1);

    // 入口は，家が並んだ次の空いた区画に置かれるので，家はすべて入口より真ん中に近い
    const distance = (lot: { row: number; offset: number }) =>
      Math.abs(lot.offset - 0.5) + lot.row * 0.5;
    const houses = map.lots.filter((lot) => lot.kind === "house");

    for (const house of houses) {
      expect(distance(house)).toBeLessThanOrEqual(distance(gates[0]));
    }
  });

  it("移したダンジョンの入口は，その場所に置かれる", () => {
    const map = buildWorldMap(ids(2), [
      { key: "dungeon_gate", row: 1, offset: -3 },
    ]);
    const gate = map.lots.find((lot) => lot.kind === "dungeon_gate");

    expect(gate).toMatchObject({ row: 1, offset: -3, key: "dungeon_gate" });
  });
});

describe("工房", () => {
  it("工房が1つあり，家より後（真ん中から遠い側）に置かれる", () => {
    const map = buildWorldMap(ids(4));
    const workshops = map.lots.filter((lot) => lot.kind === "workshop");

    expect(workshops).toHaveLength(1);

    const distance = (lot: { row: number; offset: number }) =>
      Math.abs(lot.offset - 0.5) + lot.row * 0.5;

    for (const house of map.lots.filter((lot) => lot.kind === "house")) {
      expect(distance(house)).toBeLessThanOrEqual(distance(workshops[0]));
    }
  });
});

describe("正方形に近いワールド", () => {
  it("上の列（マイナス）に保存した建物も，その場所に置かれる", () => {
    const map = buildWorldMap(ids(2), [{ key: "cafe", row: -1, offset: 2 }]);
    const cafe = map.lots.find((lot) => lot.buildingId === "cafe");

    expect(cafe).toMatchObject({ row: -1, offset: 2 });
    expect(cafe!.bottom).toBeLessThan(
      map.lots.find((lot) => lot.kind === "quest_board")!.bottom,
    );
  });

  it("家は，掲示板の列とその下の列から先に埋まる", () => {
    const map = buildWorldMap(ids(4));
    const rows = map.lots
      .filter((lot) => lot.kind === "house")
      .map((lot) => lot.row);

    expect(rows.every((row) => row === 0 || row === 1)).toBe(true);
  });

  it("どの道からどの道へも，つなぎの道を通って行ける", () => {
    const map = buildWorldMap(ids(10));
    const from = { x: map.walkMinX, y: map.roadYs[0] };
    const to = { x: map.walkMaxX, y: map.roadYs.at(-1)! };
    const route = planRoute(map, from, to);

    expect(route.at(-1)).toEqual(to);
    expect(map.connectorXs).toContain(route[0].x);
  });
});
