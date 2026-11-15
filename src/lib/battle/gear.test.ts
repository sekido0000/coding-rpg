import { describe, expect, it } from "vitest";

import { GEAR_SHAPES } from "@/components/battle/gear-icon";
import {
  BOSS_IDS,
  MATERIAL_CATALOG,
  type BossId,
} from "@/lib/battle/bosses";
import {
  EFFECTIVE_AGAINST,
  EFFECTIVE_DAMAGE_RATE,
  EFFECTIVE_GUARD_RATE,
  GEAR_CATALOG,
  GEAR_IDS,
  applyGearBonus,
  getEffectiveRates,
  getGearStatBonus,
  getUpgradeCost,
} from "@/lib/battle/gear";
import { simulateBattle, type BattleMember } from "@/lib/battle/simulate";
import { getCharacterStats } from "@/lib/battle/stats";

describe("装備の一覧", () => {
  it("あるボスの装備は別のボスに有効で，どのボスにも有効な武器と防具が1つずつある", () => {
    for (const bossId of BOSS_IDS) {
      expect(EFFECTIVE_AGAINST[bossId]).not.toBe(bossId);

      const counters = GEAR_IDS.filter(
        (id) => GEAR_CATALOG[id].effectiveAgainst === bossId,
      ).map((id) => GEAR_CATALOG[id].slot);

      expect(counters.sort()).toEqual(["armor", "weapon"]);
    }

    // 1つの輪になっている（どのボスから始めても，10体を回って戻る）
    const visited = new Set<string>();
    let current: BossId = BOSS_IDS[0];

    for (let step = 0; step < BOSS_IDS.length; step += 1) {
      visited.add(current);
      current = EFFECTIVE_AGAINST[current];
    }

    expect(visited.size).toBe(BOSS_IDS.length);
    expect(current).toBe(BOSS_IDS[0]);
  });

  it("伝説の装備は，レア素材だけで作る", () => {
    const legendary = GEAR_IDS.filter((id) => GEAR_CATALOG[id].isLegendary);

    expect(legendary.length).toBeGreaterThan(0);

    for (const id of legendary) {
      for (const { id: materialId } of GEAR_CATALOG[id].recipe.materials) {
        expect(MATERIAL_CATALOG[materialId].isRare).toBe(true);
      }
    }
  });

  it("どの装備の絵の形も 12×12 マス", () => {
    for (const rows of Object.values(GEAR_SHAPES)) {
      expect(rows).toHaveLength(12);

      for (const row of rows) {
        expect(row).toHaveLength(12);
      }
    }
  });
});

describe("強化", () => {
  it("+3 で上がる割合が2倍になり，+3 にはレア素材が要る", () => {
    const base = getGearStatBonus([
      { gearId: "unhandled_exception_weapon", level: 0 },
    ]);
    const max = getGearStatBonus([
      { gearId: "unhandled_exception_weapon", level: 3 },
    ]);

    expect(max.attack).toBeCloseTo(base.attack! * 2);

    const cost = getUpgradeCost("unhandled_exception_weapon", 3)!;

    expect(
      cost.materials.some(({ id }) => MATERIAL_CATALOG[id].isRare),
    ).toBe(true);
    expect(getUpgradeCost("unhandled_exception_weapon", 4)).toBeNull();
  });

  it("装備でステータスが何%か上がる", () => {
    const stats = getCharacterStats("warrior", 15);
    const geared = applyGearBonus(stats, [
      { gearId: "unhandled_exception_weapon", level: 0 },
    ]);

    expect(geared.attack).toBe(Math.round(stats.attack * 1.12));
    expect(geared.hp).toBe(stats.hp);
  });
});

describe("有効な装備", () => {
  it("有効なボスにだけ，与えるダメージが増え，受けるダメージが減る", () => {
    const gear = [
      { gearId: "tech_debt_giant_weapon" as const, level: 0 },
      { gearId: "tech_debt_giant_armor" as const, level: 0 },
    ];

    expect(getEffectiveRates(gear, "magic_number_gang")).toEqual({
      damageDealt: EFFECTIVE_DAMAGE_RATE,
      damageTaken: EFFECTIVE_GUARD_RATE,
    });
    expect(getEffectiveRates(gear, "tech_debt_giant")).toEqual({
      damageDealt: 1,
      damageTaken: 1,
    });
  });

  it("有効な武器を付けると，戦いで与えるダメージが増える", () => {
    const member: BattleMember = {
      id: "a",
      name: "a",
      characterType: "warrior",
      level: 10,
    };
    const totalDamage = (members: BattleMember[]) =>
      simulateBattle({ bossId: "magic_number_gang", star: 3, members, seed: 11 })
        .steps.filter((step) => step.actorId === "p0")
        .slice(0, 3)
        .flatMap((step) => step.hits)
        .filter((hit) => hit.kind === "damage")
        .reduce((sum, hit) => sum + hit.amount, 0);

    const plain = totalDamage([member]);
    const geared = totalDamage([
      { ...member, gear: [{ gearId: "tech_debt_giant_weapon", level: 0 }] },
    ]);

    // 物理攻撃 +12% と，有効な武器のダメージの倍率の両方が効く（ばらつきがあるので少し低めに見る）
    expect(geared).toBeGreaterThan(plain * 1.12 * EFFECTIVE_DAMAGE_RATE * 0.9);
  });
});
