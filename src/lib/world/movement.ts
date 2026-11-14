/*
 * リポジトリワールドで，キャラクターが歩き回る動きの計算．
 *
 * 位置は世界の幅・高さに対する割合（%）で表す．
 * 画面の大きさが変わっても，同じ割合の場所に立つ．
 */

export type Position = {
  x: number;
  y: number;
};

/*
 * キャラクターが歩ける範囲（足元の位置）．
 * 世界の下から40%が地面なので，その中に収める．
 */
export const WALK_AREA = {
  minX: 8,
  maxX: 92,
  minY: 66,
  maxY: 94,
} as const;

// 1秒に歩く距離（%）
const WALK_SPEED = 6;

// 着いてから次に歩き出すまでの時間（ミリ秒）
export const IDLE_TIME = {
  min: 2000,
  max: 7000,
} as const;

/*
 * 最初に立つ場所．
 * サーバーとブラウザで同じ画面になるよう，乱数は使わず順番から決める．
 */
export function getInitialPosition(
  index: number,
  total: number,
): Position {
  const width = WALK_AREA.maxX - WALK_AREA.minX;
  const height = WALK_AREA.maxY - WALK_AREA.minY;

  return {
    x: WALK_AREA.minX + (width * (index + 0.5)) / total,
    // 前後に少しずらして，横一列に並ばないようにする
    y:
      WALK_AREA.minY +
      height * (index % 2 === 0 ? 0.35 : 0.75),
  };
}

/*
 * 次に歩いていく場所を選ぶ．
 * random には 0以上1未満の数を返す関数を渡す（テストで固定できるように）．
 */
export function pickTarget(
  random: () => number,
): Position {
  return {
    x:
      WALK_AREA.minX +
      (WALK_AREA.maxX - WALK_AREA.minX) * random(),
    y:
      WALK_AREA.minY +
      (WALK_AREA.maxY - WALK_AREA.minY) * random(),
  };
}

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
 * 画面の下にいるキャラクターほど手前に表示する．
 * 吹き出しなどより奥になるよう，100未満に収める．
 */
export function getDepth(position: Position) {
  return Math.round(position.y);
}
