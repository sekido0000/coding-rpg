/*
 * ボスの一覧．
 *
 * ボスは開発でよく出会う困りごとがモチーフ．毎週，★1〜★5 に1回ずつ勝つと報酬がもらえる．
 * ★はボスの強さで，どのボスでも選べる．ボスごとに弱点と行動のくせが違い，
 * ★4・★5 はレベルだけでなく，弱点に合わせた役割の組み合わせを考えるほど勝ちやすくなる．
 */

import type { Role, Stats } from "@/lib/battle/stats";

export const BOSS_IDS = [
  "tech_debt_giant",
  "spaghetti_dragon",
  "magic_number_gang",
  "legacy_ghost",
  "infinite_loop_keeper",
  "unhandled_exception",
  "dependency_serpent",
  "merge_conflict_beast",
  "undocumented_labyrinth",
  "production_outage_lord",
] as const;

export type BossId = (typeof BOSS_IDS)[number];

export const BOSS_STARS = [1, 2, 3, 4, 5] as const;

export type BossStar = (typeof BOSS_STARS)[number];

/*
 * ボスの行動．順番に繰り返す．
 * - attack：1体に攻撃
 * - double：2体に攻撃
 * - aoe：全員に攻撃
 * - charge：力をためる（次の burst が強くなる合図）
 * - burst：1体に強烈な攻撃
 * - guard：防御力を上げる
 * - heal：HPを回復
 * - poison：全員に毒（毎ターン少しずつHPが減る）
 */
export type BossAction =
  | { kind: "attack"; name: string; power: number }
  | { kind: "double"; name: string; power: number }
  | { kind: "aoe"; name: string; power: number }
  | { kind: "charge"; name: string }
  | { kind: "burst"; name: string; power: number }
  | { kind: "guard"; name: string; amount: number; turns: number }
  | { kind: "heal"; name: string; rate: number }
  | { kind: "poison"; name: string; power: number };

export type BossDefinition = {
  id: BossId;
  name: string;
  icon: string;
  // どんな困りごとか
  description: string;
  // 戦い方のヒント（初心者向けに，負けた時にも出す）
  hint: string;
  // 弱点などの短い説明
  traits: string[];
  recommendedRoles: Role[];
  // ★1 を 1 とした時の，ステータスの比率
  profile: Omit<Stats, "magic">;
  // 物理・魔法で受けるダメージの倍率（1.5 なら弱点，0.6 なら効きにくい）
  physicalRate: number;
  magicRate: number;
  // 毎ターンの終わりに回復する割合（最大HPに対して）
  regenRate?: number;
  // 毎ターン攻撃力が上がる割合（技術的負債の「利息」）
  growthRate?: number;
  // HPが半分を切ると，攻撃力が上がる割合
  enrage?: number;
  // 会心の確率
  critRate?: number;
  actions: BossAction[];
  // 落とす素材（ふつう・レア）
  materials: [MaterialId, MaterialId];
};

/* ---------- 素材 ---------- */

export const MATERIAL_IDS = [
  "debt_shard",
  "interest_crystal",
  "tangled_noodle",
  "dragon_meatball",
  "mystery_digit",
  "golden_constant",
  "dusty_scroll",
  "ancient_core",
  "loop_gear",
  "eternal_cog",
  "error_fragment",
  "stack_trace_gem",
  "package_scale",
  "lockfile_fang",
  "conflict_marker",
  "resolved_horn",
  "blank_page",
  "spec_compass",
  "alert_bell",
  "uptime_crown",
] as const;

export type MaterialId = (typeof MATERIAL_IDS)[number];

export type MaterialDefinition = {
  id: MaterialId;
  name: string;
  icon: string;
  isRare: boolean;
};

const material = (
  id: MaterialId,
  name: string,
  icon: string,
  isRare = false,
): [MaterialId, MaterialDefinition] => [id, { id, name, icon, isRare }];

export const MATERIAL_CATALOG = Object.fromEntries([
  material("debt_shard", "負債のかけら", "🪨"),
  material("interest_crystal", "利息の結晶", "💎", true),
  material("tangled_noodle", "からまった麺", "🍝"),
  material("dragon_meatball", "竜のミートボール", "🧆", true),
  material("mystery_digit", "謎の数字", "🔢"),
  material("golden_constant", "黄金の定数", "🏅", true),
  material("dusty_scroll", "ほこりまみれの巻物", "📜"),
  material("ancient_core", "古代のコア", "🔮", true),
  material("loop_gear", "ループの歯車", "⚙️"),
  material("eternal_cog", "永久機関の歯車", "♾️", true),
  material("error_fragment", "エラーの破片", "💥"),
  material("stack_trace_gem", "スタックトレースの宝石", "💠", true),
  material("package_scale", "パッケージのうろこ", "📦"),
  material("lockfile_fang", "ロックファイルの牙", "🦷", true),
  material("conflict_marker", "衝突マーカー", "⚡"),
  material("resolved_horn", "解決の角", "🦄", true),
  material("blank_page", "白紙のページ", "📄"),
  material("spec_compass", "仕様の羅針盤", "🧭", true),
  material("alert_bell", "アラートの鈴", "🔔"),
  material("uptime_crown", "稼働率の王冠", "👑", true),
]) as Record<MaterialId, MaterialDefinition>;

export function isMaterialId(value: unknown): value is MaterialId {
  return (
    typeof value === "string" &&
    (MATERIAL_IDS as readonly string[]).includes(value)
  );
}

/* ---------- ボス ---------- */

export const BOSS_CATALOG: Record<BossId, BossDefinition> = {
  tech_debt_giant: {
    id: "tech_debt_giant",
    name: "技術的負債の巨人",
    icon: "🗿",
    description: "あと回しにした修正が積み重なって生まれた巨人．放っておくほど強くなる．",
    hint: "毎ターン攻撃力が上がっていく（利息）．魔法が効きやすいので，マジックで早めに倒そう．",
    traits: ["魔法が効きやすい", "物理は効きにくい", "毎ターン攻撃力が上がる"],
    recommendedRoles: ["magic", "support", "tank"],
    profile: { hp: 1.1, attack: 0.8, defense: 1.2, speed: 0.6 },
    physicalRate: 0.8,
    magicRate: 1.4,
    growthRate: 0.05,
    actions: [
      { kind: "attack", name: "のしかかり", power: 1.0 },
      { kind: "attack", name: "のしかかり", power: 1.0 },
      { kind: "aoe", name: "負債の雪崩", power: 0.7 },
    ],
    materials: ["debt_shard", "interest_crystal"],
  },
  spaghetti_dragon: {
    id: "spaghetti_dragon",
    name: "スパゲッティコード竜",
    icon: "🐉",
    description: "処理がからまり合って，どこから読めばいいか分からなくなった竜．",
    hint: "からまった麺で全員をまとめて攻撃してくる．サポートの回復で持ちこたえよう．物理がよく効く．",
    traits: ["物理が効きやすい", "全員への攻撃が多い"],
    recommendedRoles: ["support", "attacker", "tank"],
    profile: { hp: 1.1, attack: 1.0, defense: 0.9, speed: 1.0 },
    physicalRate: 1.3,
    magicRate: 0.9,
    actions: [
      { kind: "aoe", name: "からまる麺", power: 0.7 },
      { kind: "attack", name: "かみつき", power: 1.1 },
      { kind: "aoe", name: "ソースのブレス", power: 0.8 },
    ],
    materials: ["tangled_noodle", "dragon_meatball"],
  },
  magic_number_gang: {
    id: "magic_number_gang",
    name: "マジックナンバー団",
    icon: "🎲",
    description: "意味の分からない数字を書き散らす盗賊団．素早く，急所を狙ってくる．",
    hint: "素早く，会心の一撃が多い．タンクに引きつけてもらい，物理で攻めよう．",
    traits: ["物理が効きやすい", "素早い", "会心が多い"],
    recommendedRoles: ["tank", "attacker", "support"],
    profile: { hp: 0.95, attack: 1.1, defense: 0.8, speed: 1.6 },
    physicalRate: 1.3,
    magicRate: 1.0,
    critRate: 0.25,
    actions: [
      { kind: "attack", name: "42の短剣", power: 1.0 },
      { kind: "double", name: "3.14の投げナイフ", power: 0.8 },
      { kind: "attack", name: "0xFFの一撃", power: 1.2 },
    ],
    materials: ["mystery_digit", "golden_constant"],
  },
  legacy_ghost: {
    id: "legacy_ghost",
    name: "レガシーコードの亡霊",
    icon: "👻",
    description: "誰も触れなくなった古いコードにとりついた亡霊．物理攻撃はすり抜ける．",
    hint: "物理が効きにくい．マジックの魔法攻撃が頼りになる．",
    traits: ["魔法が効きやすい", "物理は効きにくい"],
    recommendedRoles: ["magic", "support", "tank"],
    profile: { hp: 1.0, attack: 1.05, defense: 0.9, speed: 1.0 },
    physicalRate: 0.65,
    magicRate: 1.5,
    actions: [
      { kind: "attack", name: "古いAPIの呪い", power: 1.0 },
      { kind: "poison", name: "非推奨の警告", power: 0.4 },
      { kind: "attack", name: "古いAPIの呪い", power: 1.0 },
    ],
    materials: ["dusty_scroll", "ancient_core"],
  },
  infinite_loop_keeper: {
    id: "infinite_loop_keeper",
    name: "無限ループの番人",
    icon: "🌀",
    description: "終わらない処理をぐるぐる回し続ける番人．少しずつ傷が治っていく．",
    hint: "毎ターンHPが回復する．回復に負けないよう，アタッカーやハンターで一気に削ろう．",
    traits: ["毎ターンHPが回復する", "ときどき大きく回復する"],
    recommendedRoles: ["attacker", "hunter", "support"],
    profile: { hp: 1.0, attack: 0.85, defense: 1.0, speed: 0.9 },
    physicalRate: 1.0,
    magicRate: 1.0,
    regenRate: 0.01,
    actions: [
      { kind: "attack", name: "ぐるぐるパンチ", power: 1.0 },
      { kind: "attack", name: "ぐるぐるパンチ", power: 1.0 },
      { kind: "heal", name: "while (true) 再生", rate: 0.05 },
    ],
    materials: ["loop_gear", "eternal_cog"],
  },
  unhandled_exception: {
    id: "unhandled_exception",
    name: "未処理の例外",
    icon: "💥",
    description: "誰も受け止めなかったエラーのかたまり．力をためて，突然爆発する．",
    hint: "「力をためている」の次に強烈な一撃が来る．タンクやサポートのバリアで受け止めよう．",
    traits: ["力をためた次の攻撃が強烈", "防御は低め"],
    recommendedRoles: ["tank", "support", "magic"],
    profile: { hp: 0.9, attack: 1.0, defense: 0.7, speed: 1.1 },
    physicalRate: 1.1,
    magicRate: 1.1,
    actions: [
      { kind: "attack", name: "スロー", power: 0.9 },
      { kind: "charge", name: "力をためている…" },
      { kind: "burst", name: "クラッシュ", power: 2.3 },
    ],
    materials: ["error_fragment", "stack_trace_gem"],
  },
  dependency_serpent: {
    id: "dependency_serpent",
    name: "依存地獄の大蛇",
    icon: "🐍",
    description: "パッケージが絡み合って生まれた大蛇．毒でじわじわ体力を奪う．",
    hint: "全員に毒をまく．サポートの回復で毒に負けないようにしよう．",
    traits: ["全員に毒をまく", "体力が多い"],
    recommendedRoles: ["support", "magic", "tank"],
    profile: { hp: 1.1, attack: 0.9, defense: 1.0, speed: 0.9 },
    physicalRate: 1.0,
    magicRate: 1.15,
    actions: [
      { kind: "poison", name: "依存の毒", power: 0.5 },
      { kind: "attack", name: "しめつけ", power: 1.0 },
      { kind: "attack", name: "かみつき", power: 1.0 },
    ],
    materials: ["package_scale", "lockfile_fang"],
  },
  merge_conflict_beast: {
    id: "merge_conflict_beast",
    name: "マージコンフリクトの双頭獣",
    icon: "🐺",
    description: "2つの変更がぶつかり合って生まれた，頭が2つある獣．2体同時にかみついてくる．",
    hint: "2体同時に攻撃してくる．魔法が効きにくいので，アタッカーやハンターの物理で攻めよう．",
    traits: ["物理が効きやすい", "魔法は効きにくい", "2体同時に攻撃"],
    recommendedRoles: ["attacker", "tank", "support"],
    profile: { hp: 1.0, attack: 0.9, defense: 1.0, speed: 1.1 },
    physicalRate: 1.35,
    magicRate: 0.7,
    actions: [
      { kind: "double", name: "<<<<<<< HEAD", power: 0.85 },
      { kind: "double", name: ">>>>>>> main", power: 0.85 },
      { kind: "attack", name: "=======", power: 1.2 },
    ],
    materials: ["conflict_marker", "resolved_horn"],
  },
  undocumented_labyrinth: {
    id: "undocumented_labyrinth",
    name: "ドキュメントなき迷宮の主",
    icon: "🧱",
    description: "説明が一つもない迷宮の主．ときどき守りを固めて，攻撃が通らなくなる．",
    hint: "ときどき防御力を大きく上げる．ボスの防御力を下げる技（弱体）を持つ仲間を入れよう．",
    traits: ["ときどき守りを固める", "防御が高い"],
    recommendedRoles: ["hunter", "magic", "support"],
    profile: { hp: 1.15, attack: 0.9, defense: 1.45, speed: 0.8 },
    physicalRate: 1.0,
    magicRate: 1.0,
    actions: [
      { kind: "guard", name: "迷宮の壁を築く", amount: 0.5, turns: 2 },
      { kind: "attack", name: "行き止まり", power: 1.1 },
      { kind: "aoe", name: "迷い込ませる", power: 0.7 },
    ],
    materials: ["blank_page", "spec_compass"],
  },
  production_outage_lord: {
    id: "production_outage_lord",
    name: "本番障害の魔王",
    icon: "😈",
    description: "深夜に現れる，最も恐ろしい魔王．HPが半分を切ると本気を出す．",
    hint: "HPが半分を切ると攻撃力が上がる．回復・守り・攻撃のバランスがよいパーティーで挑もう．",
    traits: ["HPが半分を切ると本気を出す", "弱点がない"],
    recommendedRoles: ["tank", "support", "attacker"],
    profile: { hp: 0.95, attack: 1.05, defense: 1.0, speed: 1.0 },
    physicalRate: 1.0,
    magicRate: 1.0,
    enrage: 0.4,
    actions: [
      { kind: "attack", name: "500 Internal Server Error", power: 1.0 },
      { kind: "aoe", name: "全サービス停止", power: 0.75 },
      { kind: "charge", name: "アラートを鳴らしている…" },
      { kind: "burst", name: "データベース消失", power: 2.2 },
    ],
    materials: ["alert_bell", "uptime_crown"],
  },
};

export function isBossId(value: unknown): value is BossId {
  return (
    typeof value === "string" &&
    (BOSS_IDS as readonly string[]).includes(value)
  );
}

export function isBossStar(value: unknown): value is BossStar {
  return (
    typeof value === "number" &&
    (BOSS_STARS as readonly number[]).includes(value)
  );
}

/* ---------- ★ごとの強さと報酬 ---------- */

/*
 * ★ごとのボスの基本の強さ．ボスごとの比率（profile）を掛けて使う．
 * - ★1：Lv1 の1体（と助っ人）でも勝てる
 * - ★2：Lv2〜3 なら勝てる
 * - ★3：Lv5 前後か，2〜3体のパーティー
 * - ★4：弱点に合わせた役割の組み合わせが必要
 * - ★5：Lv15 のパーティーを，役割と技までよく考えてやっと勝てる
 */
export const STAR_BASE_STATS: Record<
  BossStar,
  Omit<Stats, "magic">
> = {
  1: { hp: 380, attack: 26, defense: 8, speed: 10 },
  2: { hp: 650, attack: 40, defense: 12, speed: 14 },
  3: { hp: 1000, attack: 62, defense: 18, speed: 18 },
  4: { hp: 1900, attack: 185, defense: 26, speed: 24 },
  5: { hp: 2600, attack: 260, defense: 34, speed: 30 },
};

// ★ごとの強さの目安（画面に出す）
export const STAR_GUIDES: Record<BossStar, string> = {
  1: "始めたばかりでも勝てる（Lv1 の1体でもOK）",
  2: "Lv2〜3 なら勝てる",
  3: "Lv5 前後か，2〜3体のパーティーで",
  4: "弱点に合わせた役割の組み合わせが必要",
  5: "Lv15 のパーティーで，役割と技をよく考えてやっと勝てる",
};

// 助っ人が入れる★（★4・★5 は自分のキャラクターだけで挑む）
export const HELPER_MAX_STAR: BossStar = 3;

export type BossReward = {
  gold: number;
  materials: { id: MaterialId; quantity: number }[];
};

// ★ごとのゴールドと，素材の数（ふつう・レア）
const STAR_REWARDS: Record<
  BossStar,
  { gold: number; common: number; rare: number }
> = {
  1: { gold: 10, common: 1, rare: 0 },
  2: { gold: 20, common: 2, rare: 0 },
  3: { gold: 30, common: 3, rare: 0 },
  4: { gold: 60, common: 3, rare: 1 },
  5: { gold: 80, common: 4, rare: 2 },
};

export function getBossReward(bossId: BossId, star: BossStar): BossReward {
  const { gold, common, rare } = STAR_REWARDS[star];
  const [commonId, rareId] = BOSS_CATALOG[bossId].materials;

  return {
    gold,
    materials: [
      { id: commonId, quantity: common },
      ...(rare > 0 ? [{ id: rareId, quantity: rare }] : []),
    ],
  };
}
