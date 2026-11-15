import type { ItemId } from "@/lib/items/catalog";

/*
 * おとものドット絵．12×12マスの文字の並びで描く．
 * 「.」は透明，ほかの文字は palette の色で塗る．
 */
type PixelArt = {
  palette: Record<string, string>;
  rows: string[];
};

export const COMPANION_ART: Partial<Record<ItemId, PixelArt>> = {
  chick: {
    palette: { Y: "#fde047", y: "#eab308", K: "#1e293b", O: "#f97316" },
    rows: [
      "............",
      "....YYYY....",
      "...YYYYYY...",
      "...YYKYYOO..",
      "...YYYYYY...",
      "..YYYYYYYY..",
      ".YYyyYYYYYY.",
      ".YYYyyYYYYY.",
      ".YYYYYYYYYY.",
      "..YYYYYYYY..",
      "...YYYYYY...",
      "....O..O....",
    ],
  },
  rubber_duck: {
    palette: { Y: "#facc15", y: "#ca8a04", K: "#1e293b", O: "#fb923c" },
    rows: [
      "............",
      ".....YYYY...",
      "....YYYYYY..",
      "....YYYKYYOO",
      "....YYYYYYOO",
      "....YYYYYY..",
      "Y...YYYYY...",
      "YYYYYYYYYYY.",
      "YYYyyyyYYYY.",
      "YYYYyyYYYYY.",
      ".YYYYYYYYY..",
      "..YYYYYYY...",
    ],
  },
  coffee: {
    palette: {
      S: "#cbd5e1",
      W: "#f8fafc",
      B: "#78350f",
      R: "#10b981",
      P: "#94a3b8",
    },
    rows: [
      "...S..S.....",
      "....S..S....",
      "...S..S.....",
      "............",
      ".WWWWWWWW...",
      ".WBBBBBBW...",
      ".WWWWWWWWWW.",
      ".WWWWWWWW.W.",
      ".WWRWRWWW.W.",
      ".WWWWWWWWWW.",
      "..WWWWWW....",
      ".PPPPPPPPP..",
    ],
  },
  cat: {
    palette: { G: "#f59e0b", g: "#b45309", K: "#1e293b", P: "#f9a8d4" },
    rows: [
      "............",
      ".G......G...",
      ".GG....GG...",
      ".GGGGGGGG...",
      ".GKGGGGKG...",
      ".GGGPPGGG...",
      "..GGGGGG....",
      ".GGGGGGGG...",
      ".GGgGGgGG.GG",
      ".GGGGGGGG.G.",
      ".GGGGGGGGG..",
      ".GG.GG.GG...",
    ],
  },
  baby_dragon: {
    palette: { D: "#22c55e", w: "#86efac", K: "#1e293b", L: "#fef08a" },
    rows: [
      "........D...",
      ".......DDD..",
      ".......DKDD.",
      "..w....DDDDD",
      ".ww...DDD...",
      ".wwwDDDDD...",
      "..wwDDDDDD..",
      "...DDLLDDD..",
      "D..DDLLDDD..",
      "DDDDDDDDD...",
      "...DD..DD...",
      "............",
    ],
  },
};

type CompanionSpriteProps = {
  itemId: ItemId;
  className?: string;
};

export function CompanionSprite({
  itemId,
  className,
}: CompanionSpriteProps) {
  const art = COMPANION_ART[itemId];

  if (!art) {
    return null;
  }

  return (
    <svg
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`block ${className ?? ""}`}
    >
      {art.rows.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={art.palette[cell]}
            />
          ),
        ),
      )}
    </svg>
  );
}
