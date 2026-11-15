import { describe, expect, it } from "vitest";

import {
  findTitle,
  getEarnedTitleIds,
  getTitleRank,
  TITLE_AXES,
} from "@/lib/titles/catalog";

const ZERO = {
  quest_stars: 0,
  quest_gold: 0,
  characters: 0,
  commits: 0,
  evolutions: 0,
  purchases: 0,
};

describe("称号", () => {
  it("称号の名前とIDは重ならず，段階は小さい順に並んでいる", () => {
    const names = TITLE_AXES.flatMap((axis) =>
      axis.stages.map((stage) => stage.name),
    );

    expect(new Set(names).size).toBe(names.length);

    for (const axis of TITLE_AXES) {
      const thresholds = axis.stages.map((stage) => stage.threshold);

      expect(thresholds).toEqual(
        [...thresholds].sort((a, b) => a - b),
      );
    }
  });

  it("数が届いた称号だけをもらえる", () => {
    expect(
      getEarnedTitleIds({ ...ZERO, commits: 50, characters: 1 }),
    ).toEqual([
      "characters_1",
      "commits_1",
      "commits_10",
      "commits_50",
    ]);
    expect(getEarnedTitleIds(ZERO)).toEqual([]);
  });

  it("最後の段階は虹，その前は金，下は銀と銅", () => {
    // 6段階：銅・銅・銀・銀・金・虹
    expect(
      [0, 1, 2, 3, 4, 5].map((index) => getTitleRank(index, 6)),
    ).toEqual(["bronze", "bronze", "silver", "silver", "gold", "rainbow"]);
  });

  it("IDから称号を探せる", () => {
    expect(findTitle("quest_gold_5000")).toMatchObject({
      name: "財宝の守護竜",
      rank: "rainbow",
    });
    expect(findTitle("unknown")).toBeNull();
    expect(findTitle(null)).toBeNull();
  });
});
