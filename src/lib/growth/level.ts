// レベルが上がるごとに増える必要経験値
export const REQUIRED_XP_INCREMENT = 100;

export type LevelState = {
  level: number;
  currentXp: number;
  requiredXp: number;
};

export type LevelUpResult = LevelState & {
  // 今回の加算で到達したレベル（上がらなかった時は空）
  reachedLevels: number[];
};

/*
 * 経験値を加えた後のレベルと経験値を求める．
 * 一度に複数レベル上がる場合もある．
 */
export function addXp(
  state: LevelState,
  gainedXp: number,
): LevelUpResult {
  let level = state.level;
  let currentXp = state.currentXp + gainedXp;
  let requiredXp = state.requiredXp;
  const reachedLevels: number[] = [];

  while (currentXp >= requiredXp) {
    // 余ったXPを次のレベルへ繰り越し
    currentXp -= requiredXp;
    level += 1;
    requiredXp += REQUIRED_XP_INCREMENT;
    reachedLevels.push(level);
  }

  return {
    level,
    currentXp,
    requiredXp,
    reachedLevels,
  };
}

/*
 * レベル1から数えた，これまでに得た経験値の合計．
 * 必要経験値はレベル1で100，そこから1つ上がるごとに100ずつ増える．
 */
export function getTotalXp(level: number, currentXp: number) {
  const completedLevels = level - 1;

  return (
    (REQUIRED_XP_INCREMENT * completedLevels * (completedLevels + 1)) /
      2 +
    currentXp
  );
}
