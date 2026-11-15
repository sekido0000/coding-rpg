import { GEAR_CATALOG, type GearId, type GearShape } from "@/lib/battle/gear";

/*
 * 武器・防具の小さなドット絵（12×12マス）．
 * 形は種類ごとに共通で，色（1：主な色，2：飾りの色）を装備ごとに変える．
 * o：ふち，w：光，b：持ち手（木）．
 */
export const GEAR_SHAPES: Record<GearShape, string[]> = {
  sword: [
    "..........oo",
    ".........o1o",
    "........o1wo",
    ".......o1wo.",
    "......o1wo..",
    "..o..o1wo...",
    "..o2o1wo....",
    "...o22o.....",
    "..obo22o....",
    ".obo..oo....",
    "obo.........",
    "oo..........",
  ],
  hammer: [
    ".oooooooooo.",
    ".o1w111111o.",
    ".o11111111o.",
    ".o11111111o.",
    ".oooo22oooo.",
    "....obbo....",
    "....obbo....",
    "....obbo....",
    "....obbo....",
    "....o22o....",
    "....obbo....",
    "....oooo....",
  ],
  staff: [
    "....oooo....",
    "...o1111o...",
    "...o1w11o...",
    "...o1111o...",
    "....o22o....",
    ".....o2o....",
    ".....o2o....",
    ".....o2o....",
    ".....o2o....",
    ".....o2o....",
    ".....o2o....",
    ".....ooo....",
  ],
  wand: [
    "........o...",
    ".......o2o..",
    "......o2w2o.",
    ".......o2o..",
    "......o1o...",
    ".....o1o....",
    "....o1o.....",
    "...o1o......",
    "..o1o.......",
    ".o1o........",
    ".oo.........",
    "............",
  ],
  dagger: [
    "............",
    "........oo..",
    ".......o1wo.",
    "......o1wo..",
    ".....o1wo...",
    "...o.o1o....",
    "...o2oo.....",
    "....o22o....",
    "...obo.o....",
    "..obo.......",
    "..oo........",
    "............",
  ],
  bow: [
    "....oo......",
    "...o1o.o....",
    "..o1o..w....",
    "..o1o..w....",
    ".o1o...w....",
    ".o2o...w....",
    ".o2o...w....",
    ".o1o...w....",
    "..o1o..w....",
    "..o1o..w....",
    "...o1o.o....",
    "....oo......",
  ],
  spear: [
    ".....oo.....",
    "....o1wo....",
    "...o11wwo...",
    "...o111wo...",
    "....o11o....",
    ".....oo.....",
    ".....o2o....",
    ".....obo....",
    ".....obo....",
    ".....obo....",
    ".....obo....",
    ".....ooo....",
  ],
  axe: [
    "............",
    ".oo..oo..oo.",
    "o11oo22oo11o",
    "o1w1o22o1w1o",
    "o111o22o111o",
    ".o11o22o11o.",
    "..ooobbooo..",
    "....obbo....",
    "....obbo....",
    "....obbo....",
    "....obbo....",
    "....oooo....",
  ],
  bell: [
    ".....oo.....",
    "....o11o....",
    "...o1w11o...",
    "...o1111o...",
    "..o111111o..",
    "..oooooooo..",
    ".....o2o....",
    ".....o2o....",
    ".....o2o....",
    ".....o2o....",
    ".....o2o....",
    ".....ooo....",
  ],
  shield: [
    "..oooooooo..",
    ".o11111111o.",
    ".o1w122111o.",
    ".o11122111o.",
    ".o12222221o.",
    ".o12222221o.",
    ".o11122111o.",
    "..o112211o..",
    "..o111111o..",
    "...o1111o...",
    "....o11o....",
    ".....oo.....",
  ],
  armor: [
    "..oo....oo..",
    ".o11o..o11o.",
    "o1111oo1111o",
    "o1w11111111o",
    "o1111221111o",
    ".oo122221oo.",
    "..o112211o..",
    "..o111111o..",
    "..o222222o..",
    "..o111111o..",
    "..o11oo11o..",
    "..ooo..ooo..",
  ],
  robe: [
    "...oo..oo...",
    "..o11oo11o..",
    ".o11112111o.",
    "o1w11121111o",
    "o1111121111o",
    ".oo111211oo.",
    "..o1112111o.",
    "..o1112111o.",
    ".o111121111o",
    ".o222222222o",
    "o1111111111o",
    "oooooooooooo",
  ],
  cape: [
    "..oooooooo..",
    ".o22222222o.",
    ".o11111111o.",
    "o1w11111111o",
    "o1111111111o",
    "o1111111111o",
    "o1111111111o",
    "o1111111111o",
    "o1111111111o",
    "o11o1111o11o",
    "o1o.o11o.o1o",
    "oo...oo...oo",
  ],
  helmet: [
    "o..........o",
    "2o........o2",
    "o2o.oooo.o2o",
    ".o2o1111o2o.",
    "..oo1w111oo.",
    "..o111111o..",
    ".o11111111o.",
    ".o1oooooo1o.",
    ".o11oooo11o.",
    ".o11111111o.",
    "..o111111o..",
    "...oooooo...",
  ],
  cloak: [
    "....oooo....",
    "...o1111o...",
    "..o11oo11o..",
    "..o1o..o1o..",
    ".o11o..o11o.",
    ".o111oo111o.",
    "o1w11221111o",
    "o1111221111o",
    "o1111111111o",
    "o1111111111o",
    "o11o1111o11o",
    "ooo.oooo.ooo",
  ],
};

export function GearIcon({
  gearId,
  className,
}: {
  gearId: GearId;
  className?: string;
}) {
  const gear = GEAR_CATALOG[gearId];
  const palette: Record<string, string> = {
    o: "#0f172a",
    "1": gear.colors[0],
    "2": gear.colors[1],
    w: "#f8fafc",
    b: "#92400e",
  };

  return (
    <svg
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {GEAR_SHAPES[gear.shape].flatMap((row, y) =>
        [...row].map((char, x) =>
          char === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={palette[char]}
            />
          ),
        ),
      )}
      {/* 伝説の装備は，まわりがきらめく */}
      {gear.isLegendary && (
        <g className="boss-glow">
          <rect x={0} y={0} width={1} height={1} fill="#fde047" />
          <rect x={11} y={5} width={1} height={1} fill="#fde047" />
          <rect x={1} y={10} width={1} height={1} fill="#fde047" />
        </g>
      )}
    </svg>
  );
}
