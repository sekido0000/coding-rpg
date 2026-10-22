/* このファイルは scripts/generate-character-svgs.mjs により自動生成されます． */

export const CHARACTER_TYPES = [
  "sprout",
  "slime",
  "robot",
  "hero",
  "warrior",
  "knight",
  "mage",
  "cleric",
  "thief",
  "archer",
  "monk",
  "merchant",
  "bard",
  "bandit",
  "enemy_soldier",
  "assassin",
  "dark_mage",
  "berserker",
  "fallen_knight",
  "heretic_priest",
  "bounty_hunter",
  "cultist",
  "rival_hero",
  "homunculus",
  "controlled_soldier",
  "swordmaster",
  "corrupt_merchant",
  "general"
] as const;

export type CharacterType =
  (typeof CHARACTER_TYPES)[number];

export const CHARACTER_CATEGORIES = [
  "creature",
  "ally",
  "enemy"
] as const;

export type CharacterCategory =
  (typeof CHARACTER_CATEGORIES)[number];
