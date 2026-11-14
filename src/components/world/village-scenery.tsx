/*
 * リポジトリワールドの村の景色（家・木・街灯・道）．
 *
 * キャラクターと同じく，小さなマス目に色を置いたドット絵（SVG）で描く．
 * 位置は世界の幅・高さに対する割合で決め，画面の大きさが変わっても崩れないようにする．
 * 夜の景色なので，家の窓と街灯には明かりを灯す．
 */

type Pixel = [x: number, y: number, width: number, height: number, color: string];

type PixelArtProps = {
  width: number;
  height: number;
  pixels: Pixel[];
  className?: string;
};

function PixelArt({
  width,
  height,
  pixels,
  className,
}: PixelArtProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {pixels.map(([x, y, w, h, color], index) => (
        <rect
          key={index}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={color}
        />
      ))}
    </svg>
  );
}

const WINDOW_LIGHT = "#ffd75e";
const WOOD_DARK = "#5a3720";

type HouseColors = {
  roof: string;
  roofShadow: string;
  wall: string;
  wallShadow: string;
};

const HOUSE_COLORS: HouseColors[] = [
  {
    roof: "#c2473f",
    roofShadow: "#8e2f2a",
    wall: "#eadbb4",
    wallShadow: "#c9b88d",
  },
  {
    roof: "#3f72c2",
    roofShadow: "#2b4f8e",
    wall: "#e3e0d2",
    wallShadow: "#bdb9a8",
  },
  {
    roof: "#3f9b5c",
    roofShadow: "#2b6e40",
    wall: "#efe2c4",
    wallShadow: "#cbbb95",
  },
];

// 16×16マスの家
function getHousePixels({
  roof,
  roofShadow,
  wall,
  wallShadow,
}: HouseColors): Pixel[] {
  return [
    // 煙突（屋根の後ろ）
    [11, 1, 2, 4, "#6b6b78"],
    // 屋根（階段状の三角形）
    [7, 0, 2, 1, roof],
    [6, 1, 4, 1, roof],
    [5, 2, 6, 1, roof],
    [4, 3, 8, 1, roof],
    [3, 4, 10, 1, roof],
    [2, 5, 12, 1, roof],
    [1, 6, 14, 1, roofShadow],
    // 壁
    [2, 7, 12, 9, wall],
    [13, 7, 1, 9, wallShadow],
    // 窓（明かり）
    [3, 9, 3, 2, WINDOW_LIGHT],
    [10, 9, 3, 2, WINDOW_LIGHT],
    // 扉
    [7, 11, 2, 5, WOOD_DARK],
    [8, 13, 1, 1, "#d9a441"],
  ];
}

// 12×16マスの木
const TREE_PIXELS: Pixel[] = [
  [4, 0, 4, 1, "#2f7d4a"],
  [2, 1, 8, 1, "#2f7d4a"],
  [1, 2, 10, 2, "#2f7d4a"],
  [0, 4, 12, 4, "#2f7d4a"],
  [1, 8, 10, 2, "#2f7d4a"],
  [3, 10, 6, 1, "#2f7d4a"],
  // 葉の明るいところ
  [3, 2, 3, 2, "#4caf6a"],
  [2, 4, 3, 2, "#4caf6a"],
  // 幹
  [5, 11, 2, 5, "#6b4226"],
];

// 5×16マスの街灯
const LAMP_PIXELS: Pixel[] = [
  [0, 0, 5, 1, "#3a3a46"],
  [1, 1, 3, 3, "#ffe08a"],
  [2, 4, 1, 12, "#3a3a46"],
  [1, 15, 3, 1, "#3a3a46"],
];

// 16×6マスの柵
const FENCE_PIXELS: Pixel[] = [
  [0, 1, 16, 1, "#8a5a32"],
  [0, 4, 16, 1, "#8a5a32"],
  [1, 0, 1, 6, "#6b4226"],
  [7, 0, 1, 6, "#6b4226"],
  [13, 0, 1, 6, "#6b4226"],
];

type Placement = {
  // 左端からの位置（%．物の真ん中の位置）
  left: number;
  // 下端からの位置（%．物の足元の位置）
  bottom: number;
  className: string;
};

/*
 * 地面は世界の下から40%．家や木は地面の奥（上の端のあたり）に置き，
 * キャラクターがその手前を歩くようにする．
 */
const HOUSES: (Placement & { colors: HouseColors })[] = [
  {
    left: 20,
    bottom: 37,
    className: "w-16 sm:w-24",
    colors: HOUSE_COLORS[0],
  },
  {
    left: 50,
    bottom: 38,
    className: "w-20 sm:w-28",
    colors: HOUSE_COLORS[1],
  },
  {
    left: 79,
    bottom: 37,
    className: "w-16 sm:w-24",
    colors: HOUSE_COLORS[2],
  },
];

const TREES: Placement[] = [
  { left: 5, bottom: 36, className: "w-12 sm:w-16" },
  { left: 35, bottom: 38, className: "w-9 sm:w-12" },
  { left: 65, bottom: 38, className: "w-9 sm:w-12" },
  { left: 95, bottom: 36, className: "w-12 sm:w-16" },
];

const LAMPS: Placement[] = [
  { left: 42, bottom: 36, className: "w-3 sm:w-4" },
  { left: 58, bottom: 36, className: "w-3 sm:w-4" },
];

const FENCES: Placement[] = [
  { left: 28, bottom: 37, className: "w-10 sm:w-14" },
  { left: 72, bottom: 37, className: "w-10 sm:w-14" },
];

function placementStyle({ left, bottom }: Placement) {
  return {
    left: `${left}%`,
    bottom: `${bottom}%`,
  };
}

export function VillageScenery() {
  return (
    <>
      {/* 手前から村の奥へ続く道 */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-[1] h-[40%] bg-[#6e5a3c]/70"
        style={{
          clipPath:
            "polygon(38% 100%, 62% 100%, 53% 0%, 47% 0%)",
        }}
      />

      {FENCES.map((fence, index) => (
        <div
          key={`fence-${index}`}
          className={`absolute z-[2] -translate-x-1/2 ${fence.className}`}
          style={placementStyle(fence)}
        >
          <PixelArt
            width={16}
            height={6}
            pixels={FENCE_PIXELS}
            className="h-auto w-full"
          />
        </div>
      ))}

      {HOUSES.map((house, index) => (
        <div
          key={`house-${index}`}
          className={`absolute z-[3] -translate-x-1/2 drop-shadow-[0_6px_6px_rgba(0,0,0,0.4)] ${house.className}`}
          style={placementStyle(house)}
        >
          <PixelArt
            width={16}
            height={16}
            pixels={getHousePixels(house.colors)}
            className="h-auto w-full"
          />
        </div>
      ))}

      {TREES.map((tree, index) => (
        <div
          key={`tree-${index}`}
          className={`absolute z-[4] -translate-x-1/2 ${tree.className}`}
          style={placementStyle(tree)}
        >
          <PixelArt
            width={12}
            height={16}
            pixels={TREE_PIXELS}
            className="h-auto w-full"
          />
        </div>
      ))}

      {LAMPS.map((lamp, index) => (
        <div
          key={`lamp-${index}`}
          className={`absolute z-[4] -translate-x-1/2 ${lamp.className}`}
          style={placementStyle(lamp)}
        >
          {/* 街灯のまわりの光 */}
          <div className="absolute -left-4 -right-4 -top-4 aspect-square rounded-full bg-amber-200/25 blur-md" />
          <PixelArt
            width={5}
            height={16}
            pixels={LAMP_PIXELS}
            className="relative h-auto w-full"
          />
        </div>
      ))}
    </>
  );
}
