/*
 * ボス戦で使う，キャラクターの役割とステータス．
 *
 * ステータスは5つ（HP・物理攻撃・魔法攻撃・防御力・スピード）．
 * キャラクターの種類ごとに役割（得意なこと）が決まっていて，役割で基本の値が変わる．
 * レベルが上がると強くなるが，Lv15 で頭打ちにする（レベルが無限に上がっても，強さは無限に上がらない）．
 * 頭打ちの後は，装備（あとで作る）で強くする．
 */

import type { CharacterType } from "@/lib/characters/generated-types";

export const STAT_KEYS = [
  "hp",
  "attack",
  "magic",
  "defense",
  "speed",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type Stats = Record<StatKey, number>;

export const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  attack: "物理攻撃",
  magic: "魔法攻撃",
  defense: "防御力",
  speed: "スピード",
};

/* ---------- 役割 ---------- */

export const ROLES = [
  "attacker",
  "tank",
  "hunter",
  "magic",
  "support",
] as const;

export type Role = (typeof ROLES)[number];

export type RoleDefinition = {
  id: Role;
  name: string;
  icon: string;
  // 得意なこと（画面に出す説明）
  description: string;
  // Lv1 のステータス
  base: Stats;
  // 会心（ダメージ1.5倍）が出る確率
  critRate: number;
};

export const ROLE_CATALOG: Record<Role, RoleDefinition> = {
  attacker: {
    id: "attacker",
    name: "アタッカー",
    icon: "⚔️",
    description: "物理攻撃が高く，強い一撃でボスを削る",
    base: { hp: 110, attack: 30, magic: 8, defense: 14, speed: 14 },
    critRate: 0.08,
  },
  tank: {
    id: "tank",
    name: "タンク",
    icon: "🛡️",
    description: "HPと防御力が高く，ボスの攻撃を引きつけて仲間を守る",
    base: { hp: 165, attack: 18, magic: 8, defense: 26, speed: 8 },
    critRate: 0.05,
  },
  hunter: {
    id: "hunter",
    name: "ハンター",
    icon: "🏹",
    description: "スピードが高く，先に何度も攻撃する．会心が出やすい",
    base: { hp: 92, attack: 24, magic: 10, defense: 11, speed: 26 },
    critRate: 0.2,
  },
  magic: {
    id: "magic",
    name: "マジック",
    icon: "🔮",
    description: "魔法攻撃が高く，魔法に弱いボスに大ダメージを与える",
    base: { hp: 86, attack: 8, magic: 32, defense: 10, speed: 15 },
    critRate: 0.08,
  },
  support: {
    id: "support",
    name: "サポート",
    icon: "✨",
    description: "回復や強化で仲間を支え，長い戦いに強い",
    base: { hp: 125, attack: 8, magic: 22, defense: 15, speed: 12 },
    critRate: 0.05,
  },
};

/*
 * キャラクターの種類ごとの役割と，少しだけ得意なステータス（+10%）．
 * 同じ役割でも，種類によって少し違いが出るようにする．
 */
export const CHARACTER_BATTLE_TYPES: Record<
  CharacterType,
  { role: Role; bonus: StatKey }
> = {
  hero: { role: "attacker", bonus: "hp" },
  warrior: { role: "attacker", bonus: "defense" },
  berserker: { role: "attacker", bonus: "attack" },
  swordmaster: { role: "attacker", bonus: "speed" },
  general: { role: "attacker", bonus: "hp" },
  rival_hero: { role: "attacker", bonus: "magic" },

  knight: { role: "tank", bonus: "defense" },
  fallen_knight: { role: "tank", bonus: "attack" },
  robot: { role: "tank", bonus: "hp" },
  enemy_soldier: { role: "tank", bonus: "speed" },
  controlled_soldier: { role: "tank", bonus: "attack" },

  thief: { role: "hunter", bonus: "speed" },
  assassin: { role: "hunter", bonus: "attack" },
  archer: { role: "hunter", bonus: "attack" },
  bounty_hunter: { role: "hunter", bonus: "defense" },
  monk: { role: "hunter", bonus: "hp" },
  bandit: { role: "hunter", bonus: "hp" },

  mage: { role: "magic", bonus: "magic" },
  dark_mage: { role: "magic", bonus: "magic" },
  homunculus: { role: "magic", bonus: "defense" },
  slime: { role: "magic", bonus: "hp" },
  cultist: { role: "magic", bonus: "speed" },

  cleric: { role: "support", bonus: "magic" },
  bard: { role: "support", bonus: "speed" },
  merchant: { role: "support", bonus: "defense" },
  sprout: { role: "support", bonus: "hp" },
  heretic_priest: { role: "support", bonus: "magic" },
  corrupt_merchant: { role: "support", bonus: "attack" },
};

export function getRole(characterType: CharacterType): Role {
  return CHARACTER_BATTLE_TYPES[characterType].role;
}

/* ---------- レベルによる伸び ---------- */

// ここから上のレベルでは，ステータスが伸びない
export const STAT_LEVEL_CAP = 15;

/*
 * レベルによるステータスの倍率．
 * - Lv1〜5（進化する間）：1レベルごとに +15%
 * - Lv6〜15：1レベルごとに +5%
 * - Lv16〜：伸びない
 * Lv5 で 1.6倍，Lv15 で 2.1倍．
 */
export function getLevelMultiplier(level: number) {
  const capped = Math.min(Math.max(Math.floor(level), 1), STAT_LEVEL_CAP);

  return (
    1 + 0.15 * Math.min(capped - 1, 4) + 0.05 * Math.max(capped - 5, 0)
  );
}

// キャラクターの種類とレベルから，ステータスを計算する
export function getCharacterStats(
  characterType: CharacterType,
  level: number,
): Stats {
  const { role, bonus } = CHARACTER_BATTLE_TYPES[characterType];
  const base = ROLE_CATALOG[role].base;
  const multiplier = getLevelMultiplier(level);

  return Object.fromEntries(
    STAT_KEYS.map((key) => [
      key,
      Math.round(base[key] * multiplier * (key === bonus ? 1.1 : 1)),
    ]),
  ) as Stats;
}
