import { describe, expect, it } from "vitest";

import { SPRITE_SIZE, buildSpriteGrid } from "@/components/battle/boss-sprite";
import { BOSS_SPRITES } from "@/components/battle/boss-sprites";
import { BOSS_IDS } from "@/lib/battle/bosses";

describe("ボスのドット絵", () => {
  it.each(BOSS_IDS)("%s は 32×32 マスで，どの文字にも色がある", (bossId) => {
    const sprite = BOSS_SPRITES[bossId];

    expect(sprite.half).toHaveLength(SPRITE_SIZE);

    sprite.half.forEach((row, y) => {
      expect(row.length, `${y}行目`).toBe(SPRITE_SIZE / 2);
    });

    const grid = buildSpriteGrid(sprite);

    for (const row of grid) {
      expect(row).toHaveLength(SPRITE_SIZE);

      for (const char of row) {
        if (char !== ".") {
          expect(sprite.palette[char], `「${char}」の色`).toBeDefined();
        }
      }
    }
  });
});
