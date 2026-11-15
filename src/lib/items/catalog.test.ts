import { describe, expect, it } from "vitest";

import { COMPANION_ART } from "@/components/items/companion-sprite";
import {
  ITEM_CATALOG,
  ITEM_IDS,
  toItemId,
} from "@/lib/items/catalog";

describe("装備の一覧", () => {
  it("どの装備にも正しい値段と場所がある", () => {
    for (const id of ITEM_IDS) {
      const item = ITEM_CATALOG[id];

      expect(item.id).toBe(id);
      expect(item.price).toBeGreaterThan(0);
      expect(["companion", "aura"]).toContain(item.slot);
    }
  });

  it("おともには，12×12マスのドット絵があり，色が決まっている", () => {
    for (const id of ITEM_IDS) {
      if (ITEM_CATALOG[id].slot !== "companion") {
        continue;
      }

      const art = COMPANION_ART[id];

      expect(art, id).toBeDefined();
      expect(art!.rows).toHaveLength(12);

      for (const row of art!.rows) {
        expect(row, `${id}: ${row}`).toHaveLength(12);

        for (const cell of row) {
          if (cell !== ".") {
            expect(art!.palette[cell], `${id}: ${cell}`).toBeDefined();
          }
        }
      }
    }
  });

  it("DB の値は，場所が合っている装備だけを付けている扱いにする", () => {
    expect(toItemId("chick", "companion")).toBe("chick");
    expect(toItemId("chick", "aura")).toBeNull();
    expect(toItemId("deleted_item", "companion")).toBeNull();
    expect(toItemId(null, "aura")).toBeNull();
  });
});
