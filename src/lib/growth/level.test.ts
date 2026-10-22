import { describe, expect, it } from "vitest";

import { addXp } from "./level";

describe("addXp", () => {
  it("必要経験値に届かない時はレベルが上がらない", () => {
    expect(
      addXp(
        { level: 1, currentXp: 0, requiredXp: 100 },
        30,
      ),
    ).toEqual({
      level: 1,
      currentXp: 30,
      requiredXp: 100,
      reachedLevels: [],
    });
  });

  it("ちょうど必要経験値に届いた時にレベルが上がり，必要経験値が増える", () => {
    expect(
      addXp(
        { level: 1, currentXp: 90, requiredXp: 100 },
        10,
      ),
    ).toEqual({
      level: 2,
      currentXp: 0,
      requiredXp: 200,
      reachedLevels: [2],
    });
  });

  it("一度に複数レベル上がり，余った経験値は繰り越す", () => {
    expect(
      addXp(
        { level: 1, currentXp: 50, requiredXp: 100 },
        400,
      ),
    ).toEqual({
      level: 3,
      currentXp: 150,
      requiredXp: 300,
      reachedLevels: [2, 3],
    });
  });
});
