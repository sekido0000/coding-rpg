import {
  BOSS_SPRITES,
  type BossSpriteDefinition,
} from "@/components/battle/boss-sprites";
import type { BossId } from "@/lib/battle/bosses";

export const SPRITE_SIZE = 32;

/*
 * 左半分の絵から，32×32マスの絵（1行1文字列）を作る．
 * 右半分は左右反転し，mirrorSwap の文字を入れ替え，最後に overlay を重ねる．
 */
export function buildSpriteGrid(sprite: BossSpriteDefinition): string[] {
  const rows = Array.from({ length: SPRITE_SIZE }, (_, y) => {
    const left = (sprite.half[y] ?? "").padEnd(SPRITE_SIZE / 2, ".");
    const right = [...left]
      .reverse()
      .map((char) => sprite.mirrorSwap?.[char] ?? char)
      .join("");

    return [...(left + right)];
  });

  for (const [x, y, char] of sprite.overlay ?? []) {
    if (rows[y] && x >= 0 && x < SPRITE_SIZE) {
      rows[y][x] = char;
    }
  }

  return rows.map((row) => row.join(""));
}

type Run = { x: number; y: number; width: number; char: string };

// 同じ文字が横に続く部分を1つの四角にまとめる（SVG の要素を減らすため）
function toRuns(grid: string[]): Run[] {
  const runs: Run[] = [];

  grid.forEach((row, y) => {
    let x = 0;

    while (x < row.length) {
      const char = row[x];
      let width = 1;

      while (row[x + width] === char) {
        width += 1;
      }

      if (char !== ".") {
        runs.push({ x, y, width, char });
      }

      x += width;
    }
  });

  return runs;
}

// ボスごとの四角の並びは変わらないので，一度作ったら使い回す
const runCache = new Map<BossId, Run[]>();

function getRuns(bossId: BossId) {
  let runs = runCache.get(bossId);

  if (!runs) {
    runs = toRuns(buildSpriteGrid(BOSS_SPRITES[bossId]));
    runCache.set(bossId, runs);
  }

  return runs;
}

/*
 * ボスのドット絵．目や炎など glow の文字は，ゆっくり明るさが変わる．
 */
export function BossSprite({
  bossId,
  className,
}: {
  bossId: BossId;
  className?: string;
}) {
  const sprite = BOSS_SPRITES[bossId];
  const runs = getRuns(bossId);
  const glow = sprite.glow ?? "";

  const rect = (run: Run) => (
    <rect
      key={`${run.x}-${run.y}`}
      x={run.x}
      y={run.y}
      width={run.width}
      height={1}
      fill={sprite.palette[run.char]}
    />
  );

  return (
    <svg
      viewBox={`0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {runs.filter((run) => !glow.includes(run.char)).map(rect)}
      <g className="boss-glow">
        {runs.filter((run) => glow.includes(run.char)).map(rect)}
      </g>
    </svg>
  );
}
