/*
 * 工房で作る武器・防具．
 *
 * ボスの素材とゴールドで作り，1個作ると1体に付けられる（武器1つ・防具1つまで）．
 * 装備はステータスを「何%」上げる．Lv15 の頭打ちの後は，装備で強くなる．
 * 同じボスの素材を足すと +1〜+3 まで強化でき，+3 にはレア素材が要る．
 *
 * あるボスの素材で作った装備は，別のボスに「有効」になる（武器は与えるダメージが増え，
 * 防具は受けるダメージが減る）．10体が1つの輪になるように割り当て，
 * どのボスにも有効な装備がちょうど武器1つ・防具1つあるようにする．
 *
 * レア素材だけで作る「伝説の装備」は，特定のボスに有効ではない代わりに，ステータスが大きく上がる．
 */

import {
  BOSS_CATALOG,
  type BossId,
  type MaterialId,
} from "@/lib/battle/bosses";
import type { StatKey, Stats } from "@/lib/battle/stats";

export type GearSlot = "weapon" | "armor";

export const GEAR_SLOT_LABELS: Record<GearSlot, string> = {
  weapon: "武器",
  armor: "防具",
};

// 絵の形（gear-icon.tsx）
export type GearShape =
  | "sword"
  | "hammer"
  | "staff"
  | "dagger"
  | "bow"
  | "spear"
  | "axe"
  | "wand"
  | "bell"
  | "shield"
  | "armor"
  | "robe"
  | "cape"
  | "helmet"
  | "cloak";

export type MaterialCost = { id: MaterialId; quantity: number };

export type GearDefinition = {
  id: GearId;
  slot: GearSlot;
  name: string;
  description: string;
  shape: GearShape;
  // 絵の色（主な色・飾りの色）
  colors: [string, string];
  // +0 の時に上がる割合（0.12 なら +12%）
  stats: Partial<Record<StatKey, number>>;
  // 素材を落とすボス（伝説の装備は null）
  sourceBoss: BossId | null;
  // 有効なボス（伝説の装備は null）
  effectiveAgainst: BossId | null;
  isLegendary: boolean;
  recipe: { gold: number; materials: MaterialCost[] };
};

/*
 * どのボスの素材で作った装備が，どのボスに有効か（1つの輪になっている）．
 * - 亡霊の古文書は，説明のない迷宮を読み解く
 * - 迷宮の羅針盤は，からまった麺の道筋を示す
 * - からまった麺は，ループの歯車を止める
 * - ループの歯車（定期的な更新）は，依存の大蛇を抑える
 * - ロックファイルの牙は，マージの衝突を防ぐ
 * - 衝突を解決した角は，負債を返していく
 * - 負債の返済で，マジックナンバーを定数に直す
 * - 黄金の定数は，例外を未然に防ぐ
 * - スタックトレースは，本番障害の原因を突き止める
 * - 本番の監視は，レガシーコードの亡霊をあぶり出す
 */
export const EFFECTIVE_AGAINST: Record<BossId, BossId> = {
  legacy_ghost: "undocumented_labyrinth",
  undocumented_labyrinth: "spaghetti_dragon",
  spaghetti_dragon: "infinite_loop_keeper",
  infinite_loop_keeper: "dependency_serpent",
  dependency_serpent: "merge_conflict_beast",
  merge_conflict_beast: "tech_debt_giant",
  tech_debt_giant: "magic_number_gang",
  magic_number_gang: "unhandled_exception",
  unhandled_exception: "production_outage_lord",
  production_outage_lord: "legacy_ghost",
};

// 有効なボスに対する，与えるダメージの倍率（武器）と受けるダメージの倍率（防具）
export const EFFECTIVE_DAMAGE_RATE = 1.15;
export const EFFECTIVE_GUARD_RATE = 0.88;

export const MAX_GEAR_LEVEL = 3;

// ボスの装備を作る時の素材（ふつう）とゴールド
const BOSS_GEAR_RECIPE = { common: 4, gold: 60 };

type BossGearRow = {
  name: string;
  description: string;
  shape: GearShape;
  colors: [string, string];
  stats: Partial<Record<StatKey, number>>;
};

// ボスごとの武器と防具
const BOSS_GEAR: Record<BossId, { weapon: BossGearRow; armor: BossGearRow }> = {
  tech_debt_giant: {
    weapon: {
      name: "返済のハンマー",
      description: "積み上がった負債を，一つずつたたいて返していく．",
      shape: "hammer",
      colors: ["#a8a29e", "#f97316"],
      stats: { attack: 0.12 },
    },
    armor: {
      name: "負債の岩よろい",
      description: "重いが，どんな攻撃も受け止める．",
      shape: "armor",
      colors: ["#78716c", "#fde047"],
      stats: { defense: 0.12, hp: 0.05 },
    },
  },
  spaghetti_dragon: {
    weapon: {
      name: "ミートボールの杖",
      description: "先に付いたミートボールから，熱い魔法が出る．",
      shape: "staff",
      colors: ["#fcd34d", "#b45309"],
      stats: { magic: 0.12 },
    },
    armor: {
      name: "麺のマント",
      description: "からまった麺を編んだマント．意外と丈夫．",
      shape: "cape",
      colors: ["#fcd34d", "#dc2626"],
      stats: { hp: 0.12 },
    },
  },
  magic_number_gang: {
    weapon: {
      name: "定数の短剣",
      description: "意味のある名前を刻んだ短剣．狙いが正確になる．",
      shape: "dagger",
      colors: ["#e2e8f0", "#22d3ee"],
      stats: { attack: 0.08, speed: 0.08 },
    },
    armor: {
      name: "盗賊の黒衣",
      description: "身軽になれる黒い服．",
      shape: "cloak",
      colors: ["#334155", "#7c3aed"],
      stats: { speed: 0.12 },
    },
  },
  legacy_ghost: {
    weapon: {
      name: "古文書の杖",
      description: "昔の知恵が詰まった杖．古い呪文を唱えられる．",
      shape: "wand",
      colors: ["#c7d2fe", "#22d3ee"],
      stats: { magic: 0.12 },
    },
    armor: {
      name: "古文書のローブ",
      description: "古い巻物の紙で仕立てたローブ．",
      shape: "robe",
      colors: ["#e0e7ff", "#a16207"],
      stats: { magic: 0.05, hp: 0.08 },
    },
  },
  infinite_loop_keeper: {
    weapon: {
      name: "歯車の弓",
      description: "歯車で弦を巻き上げる弓．何度でも素早く射てる．",
      shape: "bow",
      colors: ["#64748b", "#22d3ee"],
      stats: { attack: 0.08, speed: 0.06 },
    },
    armor: {
      name: "永久機関の鎧",
      description: "止まらない歯車が，いつも体を守っている．",
      shape: "armor",
      colors: ["#475569", "#eab308"],
      stats: { defense: 0.1, hp: 0.05 },
    },
  },
  unhandled_exception: {
    weapon: {
      name: "try-catch の剣",
      description: "どんなエラーも受け止めて，切り返す剣．",
      shape: "sword",
      colors: ["#f87171", "#facc15"],
      stats: { attack: 0.12 },
    },
    armor: {
      name: "catch の大盾",
      description: "飛んでくる例外を，すべて受け止める大きな盾．",
      shape: "shield",
      colors: ["#dc2626", "#fef08a"],
      stats: { defense: 0.15 },
    },
  },
  dependency_serpent: {
    weapon: {
      name: "大蛇の牙の槍",
      description: "大蛇の牙を穂先にした槍．",
      shape: "spear",
      colors: ["#4ade80", "#d97706"],
      stats: { attack: 0.1, speed: 0.04 },
    },
    armor: {
      name: "うろこの鎧",
      description: "パッケージのうろこを重ねた鎧．",
      shape: "armor",
      colors: ["#16a34a", "#fbbf24"],
      stats: { defense: 0.08, hp: 0.08 },
    },
  },
  merge_conflict_beast: {
    weapon: {
      name: "双頭の斧",
      description: "両側に刃がある斧．どちらの変更も断ち切る．",
      shape: "axe",
      colors: ["#9ca3af", "#ef4444"],
      stats: { attack: 0.12 },
    },
    armor: {
      name: "解決のかぶと",
      description: "衝突を解決した者だけがかぶれる，角のかぶと．",
      shape: "helmet",
      colors: ["#9ca3af", "#22c55e"],
      stats: { hp: 0.1, defense: 0.05 },
    },
  },
  undocumented_labyrinth: {
    weapon: {
      name: "羅針盤のワンド",
      description: "仕様の羅針盤をはめたワンド．道を示す光を放つ．",
      shape: "wand",
      colors: ["#a78bfa", "#fbbf24"],
      stats: { magic: 0.1, speed: 0.04 },
    },
    armor: {
      name: "迷宮石の盾",
      description: "迷宮の壁を切り出した，重く固い盾．",
      shape: "shield",
      colors: ["#a8a29e", "#a78bfa"],
      stats: { defense: 0.14 },
    },
  },
  production_outage_lord: {
    weapon: {
      name: "監視の鈴杖",
      description: "異変があると鳴る鈴の杖．",
      shape: "bell",
      colors: ["#eab308", "#ef4444"],
      stats: { magic: 0.12 },
    },
    armor: {
      name: "稼働率のマント",
      description: "どんな夜も落ちない，魔王のマント．",
      shape: "cape",
      colors: ["#7f1d1d", "#eab308"],
      stats: { hp: 0.08, defense: 0.06 },
    },
  },
};

type LegendaryGearId =
  | "legend_refactor_sword"
  | "legend_sage_staff"
  | "legend_sla_armor"
  | "legend_ci_cloak";

type LegendaryGearRow = BossGearRow & {
  slot: GearSlot;
  recipe: { gold: number; materials: MaterialCost[] };
};

// 伝説の装備（レア素材だけで作る）
const LEGENDARY_GEAR: Record<LegendaryGearId, LegendaryGearRow> = {
  legend_refactor_sword: {
    slot: "weapon",
    name: "伝説のリファクタリングソード",
    description: "どんなコードも美しく作り直すという，伝説の剣．",
    shape: "sword",
    colors: ["#fde047", "#a855f7"],
    stats: { attack: 0.2, magic: 0.1 },
    recipe: {
      gold: 500,
      materials: [
        { id: "interest_crystal", quantity: 2 },
        { id: "resolved_horn", quantity: 2 },
        { id: "golden_constant", quantity: 2 },
      ],
    },
  },
  legend_sage_staff: {
    slot: "weapon",
    name: "賢者のドキュメント杖",
    description: "すべての仕様が書かれているという，賢者の杖．",
    shape: "staff",
    colors: ["#e0e7ff", "#22d3ee"],
    stats: { magic: 0.22, speed: 0.05 },
    recipe: {
      gold: 500,
      materials: [
        { id: "ancient_core", quantity: 2 },
        { id: "spec_compass", quantity: 2 },
        { id: "stack_trace_gem", quantity: 2 },
      ],
    },
  },
  legend_sla_armor: {
    slot: "armor",
    name: "不落の SLA よろい",
    description: "一度も落ちたことがないという，伝説のよろい．",
    shape: "armor",
    colors: ["#fde047", "#0891b2"],
    stats: { hp: 0.15, defense: 0.15 },
    recipe: {
      gold: 500,
      materials: [
        { id: "uptime_crown", quantity: 2 },
        { id: "eternal_cog", quantity: 2 },
        { id: "lockfile_fang", quantity: 2 },
      ],
    },
  },
  legend_ci_cloak: {
    slot: "armor",
    name: "疾風の CI マント",
    description: "まとうと，自動テストのように素早く動ける．",
    shape: "cloak",
    colors: ["#38bdf8", "#f8fafc"],
    stats: { speed: 0.2, hp: 0.08 },
    recipe: {
      gold: 500,
      materials: [
        { id: "dragon_meatball", quantity: 2 },
        { id: "interest_crystal", quantity: 2 },
        { id: "eternal_cog", quantity: 2 },
      ],
    },
  },
};
type BossGearId = `${BossId}_${GearSlot}`;
export type GearId = BossGearId | LegendaryGearId;

function buildCatalog(): Record<GearId, GearDefinition> {
  const catalog = {} as Record<GearId, GearDefinition>;

  for (const [bossId, gear] of Object.entries(BOSS_GEAR) as [
    BossId,
    (typeof BOSS_GEAR)[BossId],
  ][]) {
    for (const slot of ["weapon", "armor"] as const) {
      const id: BossGearId = `${bossId}_${slot}`;

      catalog[id] = {
        id,
        slot,
        ...gear[slot],
        sourceBoss: bossId,
        effectiveAgainst: EFFECTIVE_AGAINST[bossId],
        isLegendary: false,
        recipe: {
          gold: BOSS_GEAR_RECIPE.gold,
          materials: [
            {
              id: BOSS_CATALOG[bossId].materials[0],
              quantity: BOSS_GEAR_RECIPE.common,
            },
          ],
        },
      };
    }
  }

  for (const [id, gear] of Object.entries(LEGENDARY_GEAR) as [
    LegendaryGearId,
    (typeof LEGENDARY_GEAR)[LegendaryGearId],
  ][]) {
    catalog[id] = {
      id,
      ...gear,
      sourceBoss: null,
      effectiveAgainst: null,
      isLegendary: true,
    };
  }

  return catalog;
}

export const GEAR_CATALOG = buildCatalog();

export const GEAR_IDS = Object.keys(GEAR_CATALOG) as GearId[];

export function isGearId(value: unknown): value is GearId {
  return typeof value === "string" && Object.hasOwn(GEAR_CATALOG, value);
}

export function isGearSlot(value: unknown): value is GearSlot {
  return value === "weapon" || value === "armor";
}

/* ---------- 強化 ---------- */

// 強化した時の，上がる割合の倍率（+0：1倍，+3：2倍）
export function getGearLevelMultiplier(level: number) {
  return 1 + (Math.min(Math.max(level, 0), MAX_GEAR_LEVEL) * 1) / 3;
}

/*
 * 次の強化（+1〜+3）に必要な素材とゴールド．もう強化できない時は null．
 * - ボスの装備：そのボスのふつうの素材．+3 にはレア素材も要る
 * - 伝説の装備：作る時に使ったレア素材を1つずつ
 */
export function getUpgradeCost(
  gearId: GearId,
  nextLevel: number,
): { gold: number; materials: MaterialCost[] } | null {
  if (nextLevel < 1 || nextLevel > MAX_GEAR_LEVEL) {
    return null;
  }

  const gear = GEAR_CATALOG[gearId];

  if (gear.isLegendary) {
    return {
      gold: 200 * nextLevel,
      materials: gear.recipe.materials.map(({ id }) => ({ id, quantity: 1 })),
    };
  }

  const [common, rare] = BOSS_CATALOG[gear.sourceBoss!].materials;

  return {
    gold: 40 * nextLevel,
    materials: [
      { id: common, quantity: 2 + nextLevel },
      ...(nextLevel === MAX_GEAR_LEVEL ? [{ id: rare, quantity: 1 }] : []),
    ],
  };
}

/* ---------- ステータスへの効果 ---------- */

export type EquippedGear = { gearId: GearId; level: number };

// 付けている装備で上がる割合（ステータスごとの合計）
export function getGearStatBonus(
  gear: EquippedGear[],
): Partial<Record<StatKey, number>> {
  const bonus: Partial<Record<StatKey, number>> = {};

  for (const { gearId, level } of gear) {
    const multiplier = getGearLevelMultiplier(level);

    for (const [stat, amount] of Object.entries(GEAR_CATALOG[gearId].stats) as [
      StatKey,
      number,
    ][]) {
      bonus[stat] = (bonus[stat] ?? 0) + amount * multiplier;
    }
  }

  return bonus;
}

// ステータスに装備の効果を足す
export function applyGearBonus(stats: Stats, gear: EquippedGear[]): Stats {
  const bonus = getGearStatBonus(gear);

  return Object.fromEntries(
    Object.entries(stats).map(([stat, value]) => [
      stat,
      Math.round(value * (1 + (bonus[stat as StatKey] ?? 0))),
    ]),
  ) as Stats;
}

// そのボスに有効な装備を付けている時の，与える・受けるダメージの倍率
export function getEffectiveRates(gear: EquippedGear[], bossId: BossId) {
  const isEffective = (slot: GearSlot) =>
    gear.some(
      ({ gearId }) =>
        GEAR_CATALOG[gearId].slot === slot &&
        GEAR_CATALOG[gearId].effectiveAgainst === bossId,
    );

  return {
    damageDealt: isEffective("weapon") ? EFFECTIVE_DAMAGE_RATE : 1,
    damageTaken: isEffective("armor") ? EFFECTIVE_GUARD_RATE : 1,
  };
}

// 上がる割合を「物理攻撃 +12%」のような文にする
export function describeGearStats(
  gearId: GearId,
  level: number,
  labels: Record<StatKey, string>,
) {
  const multiplier = getGearLevelMultiplier(level);

  return (Object.entries(GEAR_CATALOG[gearId].stats) as [StatKey, number][])
    .map(
      ([stat, amount]) =>
        `${labels[stat]} +${Math.round(amount * multiplier * 100)}%`,
    )
    .join("・");
}
