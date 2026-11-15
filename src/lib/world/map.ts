/*
 * リポジトリワールドの地図．
 *
 * 斜め上から見下ろした世界で，建物が2列に並び，それぞれの列の前に道がある．
 * キャラクターは道の上を歩き，列のあいだは横道（つなぎの道）で行き来する．
 *
 * 位置と大きさはすべてピクセルで表す．地図は画面より広くなることがあり，
 * ドラッグなどで見渡す．
 */

import type { Position } from "@/lib/world/movement";

// 1マスの大きさ（ピクセル）
export const TILE = 32;

// 建物1つ分の区画の幅（マス）．家（5マス）と，両側の隙間
const LOT_TILES = 7;

// 地図の左右の余白（マス）
const MARGIN_TILES = 3;

// 1列に並べる区画の最小数（キャラクターが少なくても，見渡しがいのある広さにする）
const MIN_COLUMNS = 14;

// つなぎの道を置く間隔（区画の数）
const CONNECTOR_EVERY = 3;

/*
 * 縦方向の配置（マス）．
 * 建物の正面の下端と，その前の道の真ん中．
 */
const ROWS = [
  { buildingBottom: 9, road: 10 },
  { buildingBottom: 17, road: 18 },
] as const;

// 地図の高さ（マス）
const MAP_HEIGHT_TILES = 22;

// 道の太さ（ピクセル）
export const ROAD_WIDTH = TILE * 1.5;

export type LotKind = "house" | "quest_board" | "general_store" | "empty";

// 空いた区画の飾り
export type LotDecoration = "flowers" | "grove" | "well" | "bench";

const DECORATIONS: LotDecoration[] = ["flowers", "grove", "bench", "well"];

export type Lot = {
  kind: LotKind;
  // 何列目か（0：奥，1：手前）
  row: 0 | 1;
  // 区画の真ん中の横の位置（ピクセル）
  x: number;
  // 建物の正面の下端（ピクセル）
  bottom: number;
  // 扉の前の，道の上の位置（キャラクターが出入りする場所）
  door: Position;
  // 家の時は，住んでいるキャラクター
  characterId?: string;
  // 空いた区画の時は，その飾り
  decoration?: LotDecoration;
};

export type WorldMap = {
  width: number;
  height: number;
  lots: Lot[];
  // 道の真ん中の縦の位置（ピクセル）．0：奥の道，1：手前の道
  roadYs: [number, number];
  // 道の左端と右端（ピクセル）
  roadMinX: number;
  roadMaxX: number;
  // つなぎの道の横の位置（ピクセル）
  connectorXs: number[];
};

/*
 * キャラクターの数から地図を作る．
 * 掲示板と雑貨店を奥の列の真ん中に置き，家はそこから近い順に並べる．
 * 空いた区画は，のちに買った建物を建てる場所になる．
 */
export function buildWorldMap(characterIds: string[]): WorldMap {
  const lotCount = characterIds.length + 2;
  // 掲示板と雑貨店がちょうど真ん中に来るよう，列の数は偶数にする
  const needed = Math.ceil(lotCount / 2);
  const columns = Math.max(MIN_COLUMNS, needed + (needed % 2));
  const width = (columns * LOT_TILES + MARGIN_TILES * 2) * TILE;
  const center = (columns - 1) / 2;

  // すべての区画を，真ん中（奥の列）から近い順に並べる
  const slots = ROWS.flatMap((_, row) =>
    Array.from({ length: columns }, (_, column) => ({
      row: row as 0 | 1,
      column,
    })),
  ).sort(
    (a, b) =>
      Math.abs(a.column - center) +
      a.row * 0.5 -
      (Math.abs(b.column - center) + b.row * 0.5) ||
      a.column - b.column,
  );

  // 掲示板と雑貨店は，奥の列の真ん中に左右に並べる
  const middle = Math.floor(center);
  const fixed = new Map<string, { kind: LotKind }>([
    [`0-${middle}`, { kind: "quest_board" }],
    [`0-${middle + 1}`, { kind: "general_store" }],
  ]);

  const houses = characterIds.map((characterId) => ({
    kind: "house" as const,
    characterId,
  }));

  const lots: Lot[] = [];

  for (const { row, column } of slots) {
    const content: { kind: LotKind; characterId?: string } =
      fixed.get(`${row}-${column}`) ??
      houses.shift() ?? { kind: "empty" };

    const x = (MARGIN_TILES + column * LOT_TILES + LOT_TILES / 2) * TILE;
    const { buildingBottom, road } = ROWS[row];

    lots.push({
      ...content,
      row,
      x,
      bottom: buildingBottom * TILE,
      door: { x, y: road * TILE },
      // 空いた区画は，場所によって飾りを変える（毎回同じになるよう，位置から決める）
      ...(content.kind === "empty"
        ? {
            decoration:
              DECORATIONS[(column * 3 + row * 2) % DECORATIONS.length],
          }
        : {}),
    });
  }

  lots.sort((a, b) => a.row - b.row || a.x - b.x);

  const connectorXs = Array.from(
    { length: columns + 1 },
    (_, boundary) => boundary,
  )
    .filter(
      (boundary) =>
        boundary === 0 ||
        boundary === columns ||
        boundary % CONNECTOR_EVERY === 0,
    )
    .map((boundary) => (MARGIN_TILES + boundary * LOT_TILES) * TILE);

  return {
    width,
    height: MAP_HEIGHT_TILES * TILE,
    lots,
    roadYs: [ROWS[0].road * TILE, ROWS[1].road * TILE],
    roadMinX: connectorXs[0],
    roadMaxX: connectorXs[connectorXs.length - 1],
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
  const road = random() < 0.5 ? 0 : 1;

  return {
    x: map.roadMinX + (map.roadMaxX - map.roadMinX) * random(),
    y: map.roadYs[road],
  };
}

/*
 * from から to まで，道に沿って歩く道順（通る場所の並び）．
 * 同じ道の上なら真っすぐ，違う道なら，近いつなぎの道を通って行く．
 * from と to は，どちらかの道の上にあるものとする．
 */
export function planRoute(
  map: WorldMap,
  from: Position,
  to: Position,
): Position[] {
  if (from.y === to.y) {
    return [to];
  }

  const connector = map.connectorXs.reduce((best, x) =>
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
