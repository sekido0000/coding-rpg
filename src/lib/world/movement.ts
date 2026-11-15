/*
 * リポジトリワールドで，キャラクターが歩き回る動きの計算．
 *
 * 位置は地図の上のピクセルで表す（地図は src/lib/world/map.ts）．
 */

export type Position = {
  x: number;
  y: number;
};

// 1秒に歩く距離（ピクセル）
const WALK_SPEED = 70;

// 着いてから次に歩き出すまでの時間（ミリ秒）
export const IDLE_TIME = {
  min: 2000,
  max: 7000,
} as const;

// from から to まで歩くのにかかる時間（ミリ秒）
export function getWalkDuration(
  from: Position,
  to: Position,
) {
  const distance = Math.hypot(
    to.x - from.x,
    to.y - from.y,
  );

  return Math.round((distance / WALK_SPEED) * 1000);
}

// 着いてから次に歩き出すまでの時間（ミリ秒）
export function pickIdleTime(random: () => number) {
  return Math.round(
    IDLE_TIME.min +
      (IDLE_TIME.max - IDLE_TIME.min) * random(),
  );
}

/*
 * 地図の下にいるものほど手前に表示する（キャラクターも建物も同じ基準）．
 * 足元の縦の位置をそのまま重なり順にする．
 */
export function getDepth(position: Position) {
  return Math.round(position.y);
}
