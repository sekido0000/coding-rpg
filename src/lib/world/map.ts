/*
 * リポジトリワールドの地図．
 *
 * 斜め上から見下ろした世界で，建物が何列かに並び，それぞれの列の前に道がある．
 * キャラクターは道の上を歩き，列のあいだは縦のつなぎの道で行き来する．
 * 横長になりすぎないよう，区画が足りなくなったら横と縦に交互に広げる．
 *
 * 位置と大きさはすべてピクセルで表す．地図は画面より広くなることがあり，
 * ドラッグなどで見渡す．
 */

import {
  houseLotKey,
  isBuildingId,
  isFixedLotKey,
  type BuildingId,
  type LotKey,
  type Placement,
} from "@/lib/buildings/catalog";
import type { Position } from "@/lib/world/movement";

// 1マスの大きさ（ピクセル）
export const TILE = 32;

// 建物1つ分の区画の幅（マス）．家（5マス）と，両側の隙間
const LOT_TILES = 7;

// 列と列の間隔（マス）
const ROW_TILES = 8;

// 地図の左右の余白（マス）
const MARGIN_TILES = 3;

// 一番上の列の，建物の正面の下端（マス）．上の余白には木を植える
const FIRST_BUILDING_BOTTOM_TILES = 9;

// 一番下の道から，地図の下端までの余白（マス）
const BOTTOM_MARGIN_TILES = 4;

/*
 * 最初の広さ．列は掲示板の列を 0 として，上をマイナス，下をプラスで数える．
 * 最初は -1〜2 の4列で，1列に8区画．
 */
const FIRST_ROW = -1;
const LAST_ROW = 2;
const MIN_COLUMNS = 8;

// 見た目の横:縦がこれより横長なら，縦に1列足す（そうでなければ横に2区画足す）
const MAX_ASPECT = 1.4;

// 建物を建てられるよう，空いた区画をこれだけは残す
const SPARE_LOTS = 6;

// 列を広げるのは，ここまで（DB に保存できる列の範囲と合わせる）
const ROW_LIMIT = 20;

// つなぎの道を置く間隔（区画の数）
const CONNECTOR_EVERY = 3;

// 道の太さ（ピクセル）
export const ROAD_WIDTH = TILE * 1.5;

export type LotKind =
  | "house"
  | "quest_board"
  | "general_store"
  | "dungeon_gate"
  | "workshop"
  | "building"
  | "empty";

// 空いた区画の飾り
export type LotDecoration = "flowers" | "grove" | "well" | "bench";

const DECORATIONS: LotDecoration[] = ["flowers", "grove", "bench", "well"];

export type Lot = {
  kind: LotKind;
  // 何列目か（掲示板の列が 0．上はマイナス，下はプラス）
  row: number;
  // 区画の真ん中の横の位置（ピクセル）
  x: number;
  // 建物の正面の下端（ピクセル）
  bottom: number;
  // 扉の前の，道の上の位置（キャラクターが出入りする場所）
  door: Position;
  // 真ん中（掲示板）の区画から何区画ずれているか（建物の場所として保存する値）
  offset: number;
  // 移せる建物（家・掲示板・雑貨店・ボス戦の入口・工房・建てた建物）の時は，場所を保存する時の名前
  key?: LotKey;
  // 家の時は，住んでいるキャラクター
  characterId?: string;
  // 建てた建物の時は，その建物
  buildingId?: BuildingId;
  // 空いた区画の時は，その飾り
  decoration?: LotDecoration;
};

export type WorldMap = {
  width: number;
  height: number;
  lots: Lot[];
  // 道の真ん中の縦の位置（ピクセル）．上の道から順に並ぶ
  roadYs: number[];
  // 道の左端と右端（ピクセル）
  roadMinX: number;
  roadMaxX: number;
  /*
   * キャラクターが歩く範囲の左端と右端（ピクセル）．
   * 建物が建っているあたりだけを歩き，誰もいない世界の端まで行かないようにする．
   */
  walkMinX: number;
  walkMaxX: number;
  // つなぎの道の横の位置（ピクセル）
  connectorXs: number[];
};

/*
 * 列の範囲と1列の区画の数を決める．
 * 場所を保存した建物が収まり，空いた区画も残るまで，横長なら縦に，そうでなければ横に広げる．
 */
function getGridSize(lotCount: number, placements: Placement[]) {
  let firstRow = Math.min(FIRST_ROW, ...placements.map((p) => p.row));
  let lastRow = Math.max(LAST_ROW, ...placements.map((p) => p.row));
  // 場所を保存した建物が端にあっても収まる広さにする（掲示板が真ん中に来るよう偶数）
  const farthest = Math.max(
    0,
    ...placements.map((placement) => Math.abs(placement.offset) + 1),
  );
  let columns = Math.max(MIN_COLUMNS, farthest * 2 + 2);

  const rowCount = () => lastRow - firstRow + 1;

  while (rowCount() * columns < lotCount + SPARE_LOTS) {
    const aspect = (columns * LOT_TILES) / (rowCount() * ROW_TILES);

    if (aspect > MAX_ASPECT && rowCount() < ROW_LIMIT * 2) {
      // 真ん中の2列（0 と 1）から見て，列の少ない側に足す
      if (lastRow - 1 <= -firstRow) {
        lastRow += 1;
      } else {
        firstRow -= 1;
      }
    } else {
      columns += 2;
    }
  }

  return { firstRow, lastRow, columns };
}

/*
 * キャラクターと，保存した建物の場所から地図を作る．
 *
 * 場所を保存した建物（建てた建物や，移した家・掲示板・雑貨店など）は，その場所に置く．
 * 掲示板と雑貨店は，移していなければ 0 の列の真ん中に置く．
 * 移していない家は，残りの区画に真ん中から近い順に並べ，その次にボス戦の入口と工房を置く．
 * 空いた区画には飾りを置く．
 */
export function buildWorldMap(
  characterIds: string[],
  placements: Placement[] = [],
): WorldMap {
  const purchasedCount = placements.filter((placement) =>
    isBuildingId(placement.key),
  ).length;
  // 家・建てた建物と，掲示板・雑貨店・ボス戦の入口・工房
  const lotCount = characterIds.length + 4 + purchasedCount;
  const { firstRow, lastRow, columns } = getGridSize(lotCount, placements);
  const rows = Array.from(
    { length: lastRow - firstRow + 1 },
    (_, index) => firstRow + index,
  );

  const width = (columns * LOT_TILES + MARGIN_TILES * 2) * TILE;
  const center = (columns - 1) / 2;
  const middle = Math.floor(center);

  // 列ごとの，建物の正面の下端と道の位置（マス）
  const buildingBottomOf = (row: number) =>
    FIRST_BUILDING_BOTTOM_TILES + (row - firstRow) * ROW_TILES;
  const roadOf = (row: number) => buildingBottomOf(row) + 1;

  /*
   * すべての区画を，真ん中（掲示板のあたり）から近い順に並べる．
   * 横の近さを基本に，0 と 1 の列から離れるほど後回しにする．
   */
  const rowDistance = (row: number) => Math.abs(row - 0.5);
  const slots = rows
    .flatMap((row) =>
      Array.from({ length: columns }, (_, column) => ({ row, column })),
    )
    .sort(
      (a, b) =>
        Math.abs(a.column - center) +
          rowDistance(a.row) * 1.2 -
          (Math.abs(b.column - center) + rowDistance(b.row) * 1.2) ||
        rowDistance(a.row) - rowDistance(b.row) ||
        a.row - b.row ||
        a.column - b.column,
    );

  type LotContent = {
    kind: LotKind;
    key?: LotKey;
    characterId?: string;
    buildingId?: BuildingId;
  };

  // 保存した場所の名前から，区画に置くものを決める．置かないもの（消えたキャラクターの家など）は null
  const characterSet = new Set(characterIds);
  const toContent = (key: LotKey): LotContent | null => {
    if (isFixedLotKey(key)) {
      return { kind: key, key };
    }

    if (isBuildingId(key)) {
      return { kind: "building", key, buildingId: key };
    }

    const characterId = key.slice("house:".length);

    return characterSet.has(characterId)
      ? { kind: "house", key, characterId }
      : null;
  };

  const occupied = new Map<string, LotContent>();

  // 区画に置く．地図の外や，すでに何かがある区画には置かない
  const placeAt = (row: number, offset: number, content: LotContent) => {
    const column = middle + offset;
    const slot = `${row}:${column}`;

    if (
      column < 0 ||
      column >= columns ||
      row < firstRow ||
      row > lastRow ||
      occupied.has(slot)
    ) {
      return false;
    }

    occupied.set(slot, content);
    return true;
  };

  // 場所を保存した建物
  const placedKeys = new Set<LotKey>();

  for (const placement of placements) {
    const content = toContent(placement.key);

    if (content && placeAt(placement.row, placement.offset, content)) {
      placedKeys.add(placement.key);
    }
  }

  // 移していない掲示板と雑貨店は，0 の列の真ん中に左右に並べる
  const waiting: LotContent[] = [];

  for (const [key, offset] of [
    ["quest_board", 0],
    ["general_store", 1],
  ] as const) {
    if (!placedKeys.has(key) && !placeAt(0, offset, { kind: key, key })) {
      // 真ん中がふさがっている時は，家と同じく空いた区画に置く
      waiting.push({ kind: key, key });
    }
  }

  // 移していない家は，残りの区画に真ん中から近い順に並べる
  for (const characterId of characterIds) {
    const key = houseLotKey(characterId);

    if (!placedKeys.has(key)) {
      waiting.push({ kind: "house", key, characterId });
    }
  }

  /*
   * 移していないボス戦の入口と工房は，家の後に（家が並んだ次の空いた区画に）置く．
   * あとから増えた建物なので，先に並んでいた家の場所が変わらないようにする．
   */
  for (const key of ["dungeon_gate", "workshop"] as const) {
    if (!placedKeys.has(key)) {
      waiting.push({ kind: key, key });
    }
  }

  const lots: Lot[] = [];

  for (const { row, column } of slots) {
    const content: LotContent =
      occupied.get(`${row}:${column}`) ?? waiting.shift() ?? { kind: "empty" };

    const x = (MARGIN_TILES + column * LOT_TILES + LOT_TILES / 2) * TILE;
    const decorationIndex =
      (((column * 3 + row * 2) % DECORATIONS.length) + DECORATIONS.length) %
      DECORATIONS.length;

    lots.push({
      ...content,
      row,
      x,
      offset: column - middle,
      bottom: buildingBottomOf(row) * TILE,
      door: { x, y: roadOf(row) * TILE },
      // 空いた区画は，場所によって飾りを変える（毎回同じになるよう，位置から決める）
      ...(content.kind === "empty"
        ? { decoration: DECORATIONS[decorationIndex] }
        : {}),
    });
  }

  lots.sort((a, b) => a.row - b.row || a.x - b.x);

  const boundaryX = (boundary: number) =>
    (MARGIN_TILES + boundary * LOT_TILES) * TILE;

  // つなぎの道を置く区画の境目
  const connectorBoundaries = Array.from(
    { length: columns + 1 },
    (_, boundary) => boundary,
  ).filter(
    (boundary) =>
      boundary === 0 ||
      boundary === columns ||
      boundary % CONNECTOR_EVERY === 0,
  );

  /*
   * キャラクターが歩く範囲．建物が建っている区画を含み，
   * 両端がつなぎの道になるところまで広げる（端からも，ほかの道へ行けるように）．
   */
  const builtColumns = lots
    .filter((lot) => lot.kind !== "empty")
    // 区画の真ん中の位置から，何番目の区画かに戻す
    .map((lot) => (lot.x / TILE - MARGIN_TILES - LOT_TILES / 2) / LOT_TILES);
  const firstBuilt = Math.min(...builtColumns);
  const lastBuilt = Math.max(...builtColumns);

  const walkStart = connectorBoundaries.filter(
    (boundary) => boundary <= firstBuilt,
  ).at(-1)!;
  const walkEnd = connectorBoundaries.find(
    (boundary) => boundary >= lastBuilt + 1,
  )!;

  const connectorXs = connectorBoundaries.map(boundaryX);

  return {
    width,
    height: (roadOf(lastRow) + BOTTOM_MARGIN_TILES) * TILE,
    lots,
    roadYs: rows.map((row) => roadOf(row) * TILE),
    roadMinX: connectorXs[0],
    roadMaxX: connectorXs[connectorXs.length - 1],
    walkMinX: boundaryX(walkStart),
    walkMaxX: boundaryX(walkEnd),
    connectorXs,
  };
}

/*
 * 道の上の，次に歩いていく場所を選ぶ．
 * random には 0以上1未満の数を返す関数を渡す（テストで固定できるように）．
 */
export function pickRoadTarget(
  map: WorldMap,
  random: () => number,
): Position {
  const road = Math.min(
    Math.floor(random() * map.roadYs.length),
    map.roadYs.length - 1,
  );

  return {
    x: map.walkMinX + (map.walkMaxX - map.walkMinX) * random(),
    y: map.roadYs[road],
  };
}

/*
 * from から to まで，道に沿って歩く道順（通る場所の並び）．
 * 同じ道の上なら真っすぐ，違う道なら，近いつなぎの道を通って行く．
 * from と to は，いずれかの道の上にあるものとする．
 */
export function planRoute(
  map: WorldMap,
  from: Position,
  to: Position,
): Position[] {
  if (from.y === to.y) {
    return [to];
  }

  // 歩く範囲の中にあるつなぎの道だけを使う（範囲の両端には必ずある）
  const connectors = map.connectorXs.filter(
    (x) => x >= map.walkMinX && x <= map.walkMaxX,
  );

  const connector = connectors.reduce((best, x) =>
    Math.abs(from.x - x) + Math.abs(x - to.x) <
    Math.abs(from.x - best) + Math.abs(best - to.x)
      ? x
      : best,
  );

  return [
    { x: connector, y: from.y },
    { x: connector, y: to.y },
    to,
  ];
}

/*
 * その場所に建物を建てられるか（空いた区画か）．
 * 家・掲示板・雑貨店・ほかの建物がある区画や，地図の外には建てられない．
 */
export function isBuildableLot(
  map: WorldMap,
  row: number,
  offset: number,
) {
  return map.lots.some(
    (lot) =>
      lot.row === row && lot.offset === offset && lot.kind === "empty",
  );
}

/*
 * 地図の上の位置（ピクセル）にある区画．建物をドラッグして離した場所を調べるのに使う．
 * 区画の横幅の中で，建物の絵のあたり（正面の下端から上へ5マス，下へ1マス）にあれば，その区画とみなす．
 */
export function findLotAt(
  map: WorldMap,
  x: number,
  y: number,
): Lot | null {
  return (
    map.lots.find(
      (lot) =>
        Math.abs(x - lot.x) <= (LOT_TILES * TILE) / 2 &&
        y >= lot.bottom - TILE * 5 &&
        y <= lot.bottom + TILE,
    ) ?? null
  );
}
