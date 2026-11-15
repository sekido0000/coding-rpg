import { describe, expect, it } from "vitest";

import {
  BOSS_CATALOG,
  BOSS_IDS,
  getBossReward,
} from "@/lib/battle/bosses";
import {
  canUseHelpers,
  fillWithHelpers,
  recommendParty,
} from "@/lib/battle/party";
import { SKILL_CATALOG, describeSkill } from "@/lib/battle/skills";
import { simulateBattle, type BattleMember } from "@/lib/battle/simulate";
import {
  getCharacterStats,
  getLevelMultiplier,
  getRole,
} from "@/lib/battle/stats";
import {
  CHARACTER_TYPES,
  type CharacterType,
} from "@/lib/characters/generated-types";

function member(characterType: CharacterType, level: number): BattleMember {
  return { id: characterType, name: characterType, characterType, level };
}

describe("ステータス", () => {
  it("Lv5 で 1.6倍，Lv15 で 2.1倍になり，それより上は伸びない", () => {
    expect(getLevelMultiplier(1)).toBe(1);
    expect(getLevelMultiplier(5)).toBeCloseTo(1.6);
    expect(getLevelMultiplier(15)).toBeCloseTo(2.1);
    expect(getLevelMultiplier(99)).toBeCloseTo(2.1);
    expect(getCharacterStats("knight", 40)).toEqual(
      getCharacterStats("knight", 15),
    );
  });

  it("役割によって得意なステータスが違う", () => {
    expect(getCharacterStats("knight", 1).defense).toBeGreaterThan(
      getCharacterStats("mage", 1).defense,
    );
    expect(getCharacterStats("mage", 1).magic).toBeGreaterThan(
      getCharacterStats("warrior", 1).magic,
    );
    expect(getCharacterStats("thief", 1).speed).toBeGreaterThan(
      getCharacterStats("knight", 1).speed,
    );
  });
});

describe("技", () => {
  it("どの種類も，Lv1・2・3・5 で使える技が4つある", () => {
    for (const characterType of CHARACTER_TYPES) {
      const skills = SKILL_CATALOG[characterType];

      expect(skills.map((skill) => skill.level)).toEqual([1, 2, 3, 5]);

      for (const skill of skills) {
        expect(describeSkill(skill)).not.toBe("");
      }
    }
  });
});

describe("ボス戦", () => {
  it("同じ seed なら同じ結果になる", () => {
    const options = {
      bossId: "spaghetti_dragon" as const,
      star: 3 as const,
      members: [member("warrior", 4), member("cleric", 4)],
      seed: 42,
    };

    expect(simulateBattle(options)).toEqual(simulateBattle(options));
  });

  it("★1 は，どの種類の Lv1 の1体でも（助っ人と）どのボスにも勝てる", () => {
    for (const bossId of BOSS_IDS) {
      for (const characterType of CHARACTER_TYPES) {
        const result = simulateBattle({
          bossId,
          star: 1,
          members: fillWithHelpers([member(characterType, 1)], 1),
          seed: 7,
        });

        expect(result.isWin, `${bossId} / ${characterType}`).toBe(true);
      }
    }
  });

  it("★5 は，Lv1 のパーティーでは勝てない", () => {
    for (const bossId of BOSS_IDS) {
      const result = simulateBattle({
        bossId,
        star: 5,
        members: [member("warrior", 1), member("knight", 1), member("cleric", 1)],
        seed: 1,
      });

      expect(result.isWin).toBe(false);
    }
  });

  it("ログの最後のHPで勝ち負けが分かる", () => {
    const result = simulateBattle({
      bossId: "legacy_ghost",
      star: 1,
      members: fillWithHelpers([member("mage", 1)], 1),
      seed: 3,
    });
    const last = result.steps.at(-1)!;

    expect(result.isWin).toBe(true);
    expect(last.hp.boss).toBe(0);
    expect(result.units.map((unit) => unit.id)).toEqual([
      "p0",
      "p1",
      "p2",
      "boss",
    ]);
  });

  it("弱点の攻撃は弱点として記録される", () => {
    const result = simulateBattle({
      bossId: "legacy_ghost",
      star: 1,
      members: [member("mage", 1)],
      seed: 5,
    });
    const mageHits = result.steps
      .filter((step) => step.actorId === "p0")
      .flatMap((step) => step.hits)
      .filter((hit) => hit.kind === "damage");

    expect(mageHits.length).toBeGreaterThan(0);
    expect(mageHits.every((hit) => hit.isWeak)).toBe(true);
  });
});

describe("助っ人と編成", () => {
  it("★1〜★3 だけ，空いた枠に助っ人が入る", () => {
    expect(fillWithHelpers([member("mage", 1)], 3)).toHaveLength(3);
    expect(fillWithHelpers([member("mage", 1)], 4)).toHaveLength(1);
    expect(canUseHelpers(3)).toBe(true);
    expect(canUseHelpers(4)).toBe(false);
  });

  it("おまかせ編成は3体までで，攻撃役を必ず入れる", () => {
    const candidates = (
      ["knight", "robot", "cleric", "bard", "mage"] as CharacterType[]
    ).map((characterType) => ({
      id: characterType,
      name: characterType,
      characterType,
      level: 5,
    }));

    for (const bossId of BOSS_IDS) {
      const party = recommendParty(candidates, bossId);

      expect(party).toHaveLength(3);
      expect(party).toContain("mage");
    }
  });

  it("おすすめの役割のキャラクターを選びやすい", () => {
    const candidates = (["warrior", "mage", "cleric", "knight"] as CharacterType[]).map(
      (characterType) => ({
        id: characterType,
        name: characterType,
        characterType,
        level: 5,
      }),
    );
    const party = recommendParty(candidates, "legacy_ghost");

    for (const role of BOSS_CATALOG.legacy_ghost.recommendedRoles) {
      expect(party.map((id) => getRole(id as CharacterType))).toContain(role);
    }
  });
});

describe("報酬", () => {
  it("★が上がるほどゴールドが増え，★4 から レア素材が出る", () => {
    expect(getBossReward("tech_debt_giant", 1)).toEqual({
      gold: 10,
      materials: [{ id: "debt_shard", quantity: 1 }],
    });
    expect(getBossReward("tech_debt_giant", 5)).toEqual({
      gold: 80,
      materials: [
        { id: "debt_shard", quantity: 4 },
        { id: "interest_crystal", quantity: 2 },
      ],
    });
  });
});
