/*
 * リポジトリワールドの建物や木のドット絵（斜め上から見下ろした形）．
 * 四角の並び [x, y, 幅, 高さ, 色] で描く．1マスは地図の 8 ピクセル分．
 */

import type { ReactElement } from "react";

import type { BuildingId } from "@/lib/buildings/catalog";

type Rect = [number, number, number, number, string];

type PixelArtProps = {
  width: number;
  height: number;
  rects: Rect[];
  className?: string;
};

// 1マスを何ピクセルで表示するか
const CELL = 8;

function PixelArt({ width, height, rects, className }: PixelArtProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * CELL}
      height={height * CELL}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`block ${className ?? ""}`}
    >
      {rects.map(([x, y, w, h, fill], index) => (
        <rect key={index} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  );
}

/* ---------- 家 ---------- */

export type HouseColors = {
  roof: string;
  roofDark: string;
  wall: string;
  wallDark: string;
};

export const HOUSE_COLORS: HouseColors[] = [
  { roof: "#dc2626", roofDark: "#991b1b", wall: "#fef3c7", wallDark: "#d6c08f" },
  { roof: "#2563eb", roofDark: "#1e3a8a", wall: "#f1f5f9", wallDark: "#cbd5e1" },
  { roof: "#16a34a", roofDark: "#14532d", wall: "#fde68a", wallDark: "#d4b45a" },
  { roof: "#9333ea", roofDark: "#581c87", wall: "#fae8ff", wallDark: "#d8b4fe" },
  { roof: "#ea580c", roofDark: "#9a3412", wall: "#ffedd5", wallDark: "#e8b98a" },
  { roof: "#0891b2", roofDark: "#164e63", wall: "#ecfeff", wallDark: "#a5d8e0" },
];

/*
 * 家（20×20マス）．上が屋根（上から見た面），下が正面の壁で，
 * 壁の真ん中の下に扉がある．
 */
export function House({ colors }: { colors: HouseColors }) {
  const { roof, roofDark, wall, wallDark } = colors;

  return (
    <PixelArt
      width={20}
      height={20}
      rects={[
        // 煙突
        [14, 0, 2, 3, "#7c2d12"],
        // 屋根と，瓦の段
        [1, 1, 18, 8, roof],
        [1, 3, 18, 1, roofDark],
        [1, 6, 18, 1, roofDark],
        // 屋根の手前のふち（ひさし）
        [0, 9, 20, 2, roofDark],
        // 壁
        [2, 11, 16, 8, wall],
        [2, 18, 16, 1, wallDark],
        // 窓（明かり）
        [4, 13, 3, 3, "#fde68a"],
        [13, 13, 3, 3, "#fde68a"],
        [4, 13, 3, 1, "#a16207"],
        [13, 13, 3, 1, "#a16207"],
        // 扉
        [8, 13, 4, 6, "#7c4a1e"],
        [11, 16, 1, 1, "#fbbf24"],
        // 足元の影
        [1, 19, 18, 1, "rgba(0,0,0,0.3)"],
      ]}
    />
  );
}

/* ---------- クエスト掲示板 ---------- */

// 掲示板（14×14マス）．板に依頼の紙が貼ってある
export function QuestBoardSign({ hasNotice }: { hasNotice: boolean }) {
  return (
    <PixelArt
      width={14}
      height={14}
      rects={[
        // 小さな屋根
        [0, 0, 14, 2, "#7c2d12"],
        // 柱
        [2, 6, 1, 7, "#6b4226"],
        [11, 6, 1, 7, "#6b4226"],
        // 板と枠
        [1, 2, 12, 7, "#a16207"],
        [1, 2, 12, 1, "#713f12"],
        [1, 8, 12, 1, "#713f12"],
        // 依頼の紙
        [2, 3, 3, 4, "#f8fafc"],
        [6, 4, 3, 3, "#fef3c7"],
        [10, 3, 2, 4, "#f8fafc"],
        // 受け取り待ちの報酬がある時は，赤い印を付ける
        ...(hasNotice ? ([[6, 3, 3, 1, "#ef4444"]] as Rect[]) : []),
        // 足元の影
        [1, 13, 12, 1, "rgba(0,0,0,0.3)"],
      ]}
    />
  );
}

/* ---------- 雑貨店 ---------- */

// 雑貨店（24×20マス）．しま模様のひさしと，薬のびんの看板
export function GeneralStore() {
  const awning: Rect[] = Array.from({ length: 12 }, (_, index) => [
    index * 2,
    10,
    2,
    2,
    index % 2 === 0 ? "#ef4444" : "#f8fafc",
  ]);

  return (
    <PixelArt
      width={24}
      height={20}
      rects={[
        // 屋根
        [1, 0, 22, 9, "#78350f"],
        [1, 3, 22, 1, "#451a03"],
        [1, 6, 22, 1, "#451a03"],
        [0, 9, 24, 1, "#451a03"],
        // しま模様のひさし
        ...awning,
        // 壁
        [2, 12, 20, 7, "#fef3c7"],
        [2, 18, 20, 1, "#d6c08f"],
        // 店先の棚と商品
        [3, 14, 6, 3, "#a16207"],
        [4, 14, 1, 2, "#22c55e"],
        [6, 14, 1, 2, "#3b82f6"],
        [8, 14, 1, 2, "#ef4444"],
        [15, 14, 6, 3, "#a16207"],
        [16, 14, 1, 2, "#facc15"],
        [18, 14, 1, 2, "#a855f7"],
        // 扉
        [10, 13, 4, 6, "#7c4a1e"],
        // 看板（薬のびん）
        [10, 1, 4, 5, "#fef3c7"],
        [11, 2, 2, 1, "#94a3b8"],
        [11, 3, 2, 2, "#22c55e"],
        // 足元の影
        [1, 19, 22, 1, "rgba(0,0,0,0.3)"],
      ]}
    />
  );
}

/* ---------- 木と花 ---------- */

// 木（10×12マス）
export function Tree() {
  return (
    <PixelArt
      width={10}
      height={12}
      rects={[
        [2, 0, 6, 1, "#15803d"],
        [1, 1, 8, 6, "#16a34a"],
        [0, 2, 10, 4, "#16a34a"],
        [2, 1, 3, 2, "#4ade80"],
        [1, 6, 8, 1, "#15803d"],
        [4, 7, 2, 4, "#7c4a1e"],
        [2, 11, 6, 1, "rgba(0,0,0,0.3)"],
      ]}
    />
  );
}

// 花壇（8×4マス）．空いた区画を飾る
export function FlowerBed() {
  return (
    <PixelArt
      width={8}
      height={4}
      rects={[
        [0, 1, 8, 3, "#65a30d"],
        [1, 1, 1, 1, "#f472b6"],
        [3, 2, 1, 1, "#facc15"],
        [5, 1, 1, 1, "#f87171"],
        [6, 2, 1, 1, "#a78bfa"],
        [2, 3, 1, 1, "#fde68a"],
      ]}
    />
  );
}

// 井戸（12×12マス）
export function Well() {
  return (
    <PixelArt
      width={12}
      height={12}
      rects={[
        // 屋根
        [1, 0, 10, 2, "#7c2d12"],
        [0, 2, 12, 1, "#451a03"],
        // 柱
        [2, 3, 1, 4, "#6b4226"],
        [9, 3, 1, 4, "#6b4226"],
        // つるべ
        [5, 3, 2, 3, "#a16207"],
        // 石の囲いと水
        [1, 7, 10, 4, "#94a3b8"],
        [2, 7, 8, 2, "#1e3a8a"],
        [1, 10, 10, 1, "#64748b"],
        [1, 11, 10, 1, "rgba(0,0,0,0.3)"],
      ]}
    />
  );
}

// ベンチ（12×6マス）
export function Bench() {
  return (
    <PixelArt
      width={12}
      height={6}
      rects={[
        // 背もたれ
        [0, 0, 12, 1, "#92400e"],
        [0, 1, 12, 1, "#78350f"],
        // 座面
        [0, 3, 12, 1, "#b45309"],
        // 脚
        [1, 4, 1, 2, "#451a03"],
        [10, 4, 1, 2, "#451a03"],
      ]}
    />
  );
}

/* ---------- 建てられる建物 ---------- */

const SHADOW: Rect = [1, 19, 22, 1, "rgba(0,0,0,0.3)"];

// ラーメン屋台（24×20マス）．のれんと赤ちょうちん
function RamenStall() {
  return (
    <PixelArt
      width={24}
      height={20}
      rects={[
        [1, 2, 22, 4, "#b91c1c"],
        [0, 6, 24, 1, "#7f1d1d"],
        [2, 7, 1, 9, "#78350f"],
        [21, 7, 1, 9, "#78350f"],
        [4, 7, 4, 4, "#f8fafc"],
        [10, 7, 4, 4, "#f8fafc"],
        [16, 7, 3, 4, "#f8fafc"],
        [5, 8, 2, 2, "#dc2626"],
        [11, 8, 2, 2, "#dc2626"],
        [20, 8, 3, 4, "#ef4444"],
        [20, 8, 3, 1, "#facc15"],
        [2, 13, 20, 3, "#a16207"],
        [2, 13, 20, 1, "#ca8a04"],
        [6, 12, 3, 1, "#f8fafc"],
        [14, 12, 3, 1, "#f8fafc"],
        [3, 16, 18, 2, "#7c2d12"],
        [4, 17, 3, 3, "#1e293b"],
        [17, 17, 3, 3, "#1e293b"],
        SHADOW,
      ]}
    />
  );
}

// 公園の噴水（20×14マス）
function Fountain() {
  return (
    <PixelArt
      width={20}
      height={14}
      rects={[
        [8, 1, 4, 2, "#bae6fd"],
        [6, 2, 2, 2, "#bae6fd"],
        [12, 2, 2, 2, "#bae6fd"],
        [9, 3, 2, 6, "#cbd5e1"],
        [2, 7, 16, 6, "#94a3b8"],
        [3, 8, 14, 3, "#38bdf8"],
        [3, 8, 14, 1, "#7dd3fc"],
        [2, 12, 16, 1, "#64748b"],
        [2, 13, 16, 1, "rgba(0,0,0,0.3)"],
      ]}
    />
  );
}

// カフェ（24×20マス）．緑のしまのひさしと，コーヒーカップの看板
function Cafe() {
  const awning: Rect[] = Array.from({ length: 12 }, (_, index) => [
    index * 2,
    10,
    2,
    2,
    index % 2 === 0 ? "#16a34a" : "#f8fafc",
  ]);

  return (
    <PixelArt
      width={24}
      height={20}
      rects={[
        [1, 0, 22, 9, "#92400e"],
        [1, 6, 22, 1, "#78350f"],
        [0, 9, 24, 1, "#78350f"],
        [9, 1, 5, 4, "#f8fafc"],
        [10, 2, 3, 2, "#78350f"],
        [14, 2, 1, 2, "#f8fafc"],
        ...awning,
        [2, 12, 20, 7, "#fef9c3"],
        [2, 18, 20, 1, "#d6c08f"],
        [3, 13, 6, 4, "#bae6fd"],
        [15, 13, 6, 4, "#bae6fd"],
        [10, 13, 4, 6, "#7c4a1e"],
        SHADOW,
      ]}
    />
  );
}

// 図書館（24×20マス）．柱の並ぶ石造り
function Library() {
  return (
    <PixelArt
      width={24}
      height={20}
      rects={[
        [2, 0, 20, 2, "#1e3a8a"],
        [1, 2, 22, 6, "#1e40af"],
        [1, 5, 22, 1, "#1e3a8a"],
        [10, 2, 4, 3, "#fde68a"],
        [11, 2, 2, 3, "#ef4444"],
        [0, 8, 24, 2, "#e2e8f0"],
        [2, 10, 20, 8, "#cbd5e1"],
        [3, 10, 2, 8, "#f8fafc"],
        [7, 10, 2, 8, "#f8fafc"],
        [15, 10, 2, 8, "#f8fafc"],
        [19, 10, 2, 8, "#f8fafc"],
        [10, 12, 4, 6, "#7c4a1e"],
        [1, 18, 22, 1, "#94a3b8"],
        SHADOW,
      ]}
    />
  );
}

// ゲームセンター（24×20マス）．光る看板とゲーム機
function Arcade() {
  return (
    <PixelArt
      width={24}
      height={20}
      className="arcade-glow"
      rects={[
        [1, 0, 22, 8, "#3b0764"],
        [0, 8, 24, 2, "#581c87"],
        [3, 2, 18, 4, "#0f172a"],
        [5, 3, 2, 2, "#f472b6"],
        [8, 3, 2, 2, "#22d3ee"],
        [11, 3, 2, 2, "#facc15"],
        [14, 3, 2, 2, "#4ade80"],
        [17, 3, 2, 2, "#f472b6"],
        [2, 10, 20, 9, "#4c1d95"],
        [3, 12, 4, 6, "#0f172a"],
        [4, 13, 2, 2, "#f472b6"],
        [17, 12, 4, 6, "#0f172a"],
        [18, 13, 2, 2, "#22d3ee"],
        [9, 12, 6, 7, "#67e8f9"],
        [12, 12, 1, 7, "#4c1d95"],
        SHADOW,
      ]}
    />
  );
}

// レストラン（24×20マス）．赤い屋根と，ナイフとフォークの看板
function Restaurant() {
  return (
    <PixelArt
      width={24}
      height={20}
      rects={[
        [1, 0, 22, 9, "#be123c"],
        [1, 6, 22, 1, "#9f1239"],
        [0, 9, 24, 2, "#9f1239"],
        [9, 1, 6, 5, "#fef3c7"],
        [10, 2, 1, 3, "#64748b"],
        [13, 2, 1, 3, "#64748b"],
        [11, 3, 2, 2, "#f8fafc"],
        [2, 11, 20, 8, "#fff7ed"],
        [2, 18, 20, 1, "#e8b98a"],
        [3, 13, 5, 3, "#fde68a"],
        [16, 13, 5, 3, "#fde68a"],
        [3, 16, 5, 1, "#16a34a"],
        [16, 16, 5, 1, "#16a34a"],
        [4, 15, 1, 1, "#f472b6"],
        [6, 15, 1, 1, "#facc15"],
        [17, 15, 1, 1, "#f472b6"],
        [19, 15, 1, 1, "#facc15"],
        [10, 13, 4, 6, "#7c2d12"],
        SHADOW,
      ]}
    />
  );
}

// 研究所（24×20マス）．丸い屋根とアンテナ，フラスコの看板
function Lab() {
  return (
    <PixelArt
      width={24}
      height={20}
      rects={[
        [6, 0, 12, 2, "#cbd5e1"],
        [4, 2, 16, 3, "#e2e8f0"],
        [19, 0, 1, 5, "#64748b"],
        [18, 0, 3, 1, "#ef4444"],
        [1, 5, 22, 4, "#94a3b8"],
        [0, 9, 24, 1, "#64748b"],
        [11, 5, 2, 1, "#e2e8f0"],
        [10, 6, 4, 3, "#4ade80"],
        [2, 10, 20, 9, "#f8fafc"],
        [2, 18, 20, 1, "#cbd5e1"],
        [3, 12, 5, 3, "#a7f3d0"],
        [16, 12, 5, 3, "#a7f3d0"],
        [10, 12, 4, 7, "#475569"],
        SHADOW,
      ]}
    />
  );
}

// 建物の種類ごとの外の絵
export const BUILDING_EXTERIORS: Record<BuildingId, () => ReactElement> = {
  ramen_stall: RamenStall,
  fountain: Fountain,
  cafe: Cafe,
  library: Library,
  arcade: Arcade,
  restaurant: Restaurant,
  lab: Lab,
};
