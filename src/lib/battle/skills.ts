/*
 * ボス戦の技．
 *
 * キャラクターの種類ごとに4つあり，Lv1・2・3・5（進化するたび）で1つずつ使えるようになる．
 * 技は「ダメージ・回復・強化・弱体・バリア・引きつけ」の組み合わせでできている．
 * 技を使うと，決まったターンのあいだ（待ち時間）同じ技は使えない．
 * 使える技がない時は，通常攻撃をする．
 */

import type { CharacterType } from "@/lib/characters/generated-types";
import type { StatKey } from "@/lib/battle/stats";

export type Element = "physical" | "magic";

export type BuffStat = Exclude<StatKey, "hp">;

export type SkillEffect =
  // ボスにダメージ．power は攻撃力の何倍か，hits は何回当てるか
  | { type: "damage"; element: Element; power: number; hits: number }
  // 回復．魔法攻撃の power 倍だけ回復する．lowest：いちばん減っている仲間，party：全員
  | { type: "heal"; power: number; target: "lowest" | "party" }
  // 強化．amount は上げる割合（0.3 なら +30%）
  | {
      type: "buff";
      stat: BuffStat;
      amount: number;
      turns: number;
      target: "self" | "party";
    }
  // ボスを弱くする．amount は下げる割合
  | { type: "debuff"; stat: BuffStat; amount: number; turns: number }
  // バリア．魔法攻撃か防御力の高いほうの power 倍だけ，ダメージを代わりに受ける
  | { type: "shield"; power: number; target: "self" | "party" }
  // ボスの攻撃を自分に引きつける
  | { type: "taunt"; turns: number };

export type SkillUnlockLevel = 1 | 2 | 3 | 5;

export type Skill = {
  name: string;
  // 使えるようになるレベル
  level: SkillUnlockLevel;
  // 使った後，また使えるまでのターン数
  cooldown: number;
  effects: SkillEffect[];
};

// 使えるようになるレベルごとの待ち時間（強い技ほど長い）
const COOLDOWNS: Record<SkillUnlockLevel, number> = {
  1: 2,
  2: 3,
  3: 3,
  5: 4,
};

/* ---------- 技を短く書くための関数 ---------- */

const phys = (power: number, hits = 1): SkillEffect => ({
  type: "damage",
  element: "physical",
  power,
  hits,
});
const mag = (power: number, hits = 1): SkillEffect => ({
  type: "damage",
  element: "magic",
  power,
  hits,
});
const heal = (
  power: number,
  target: "lowest" | "party" = "lowest",
): SkillEffect => ({ type: "heal", power, target });
const buff = (
  stat: BuffStat,
  amount: number,
  turns: number,
  target: "self" | "party" = "self",
): SkillEffect => ({ type: "buff", stat, amount, turns, target });
const debuff = (
  stat: BuffStat,
  amount: number,
  turns: number,
): SkillEffect => ({ type: "debuff", stat, amount, turns });
const shield = (
  power: number,
  target: "self" | "party" = "party",
): SkillEffect => ({ type: "shield", power, target });
const taunt = (turns: number): SkillEffect => ({ type: "taunt", turns });

type SkillRow = [name: string, effects: SkillEffect[]];

// Lv1・2・3・5 の順に並べた4つの技
function skills(
  lv1: SkillRow,
  lv2: SkillRow,
  lv3: SkillRow,
  lv5: SkillRow,
): Skill[] {
  return ([lv1, lv2, lv3, lv5] as const).map(([name, effects], index) => {
    const level = ([1, 2, 3, 5] as const)[index];

    return { name, level, cooldown: COOLDOWNS[level], effects };
  });
}

/* ---------- キャラクターごとの技 ---------- */

export const SKILL_CATALOG: Record<CharacterType, Skill[]> = {
  /* アタッカー */
  hero: skills(
    ["勇気の一太刀", [phys(1.7)]],
    ["仲間を鼓舞する", [buff("attack", 0.2, 3, "party")]],
    ["光の剣", [phys(1.2), mag(1.0)]],
    ["ブレイブスラッシュ", [phys(3.4), buff("defense", 0.2, 2, "party")]],
  ),
  warrior: skills(
    ["強打", [phys(1.7)]],
    ["雄たけび", [buff("attack", 0.35, 3)]],
    ["かぶと割り", [phys(1.3), debuff("defense", 0.2, 3)]],
    ["大地割り", [phys(3.6)]],
  ),
  berserker: skills(
    ["荒れ狂う斧", [phys(1.9)]],
    ["怒りの咆哮", [buff("attack", 0.5, 3), buff("defense", -0.2, 3)]],
    ["乱れ斬り", [phys(0.9, 3)]],
    ["ベルセルクラッシュ", [phys(1.1, 4)]],
  ),
  swordmaster: skills(
    ["居合い斬り", [phys(1.8)]],
    ["心眼", [buff("speed", 0.3, 3), buff("attack", 0.2, 3)]],
    ["燕返し", [phys(1.25, 2)]],
    ["奥義・一閃", [phys(4.0)]],
  ),
  general: skills(
    ["号令の一撃", [phys(1.6)]],
    ["全軍突撃", [buff("attack", 0.25, 3, "party")]],
    ["陣形を組む", [buff("defense", 0.25, 3, "party")]],
    ["覇王の進軍", [phys(3.0), buff("attack", 0.2, 2, "party")]],
  ),
  rival_hero: skills(
    ["闇をまとう剣", [phys(1.0), mag(0.8)]],
    ["もう一つの正義", [buff("attack", 0.3, 3), buff("magic", 0.3, 3)]],
    ["ダークブレイド", [mag(1.8)]],
    ["宿命の対決", [phys(2.0), mag(1.8)]],
  ),

  /* タンク */
  knight: skills(
    ["かばう構え", [taunt(2), buff("defense", 0.3, 2)]],
    ["シールドバッシュ", [phys(1.4), debuff("attack", 0.15, 3)]],
    ["守りの陣", [shield(1.2)]],
    ["聖騎士の誓い", [taunt(3), buff("defense", 0.3, 3, "party")]],
  ),
  fallen_knight: skills(
    ["呪いの挑発", [taunt(2), debuff("attack", 0.1, 2)]],
    ["黒き剣", [phys(1.6)]],
    ["呪鎧", [buff("defense", 0.4, 3), buff("attack", 0.2, 3)]],
    ["堕落の一撃", [phys(2.6), debuff("defense", 0.25, 3)]],
  ),
  robot: skills(
    ["起動・防衛モード", [taunt(2), buff("defense", 0.35, 2)]],
    ["岩の拳", [phys(1.4)]],
    ["障壁展開", [shield(1.3)]],
    ["古代兵器", [phys(2.4), shield(0.8)]],
  ),
  enemy_soldier: skills(
    ["盾を構える", [taunt(2), buff("defense", 0.25, 2)]],
    ["槍の突き", [phys(1.5)]],
    ["援護の盾", [shield(1.0)]],
    ["突撃の号令", [phys(2.2), buff("attack", 0.2, 3, "party")]],
  ),
  controlled_soldier: skills(
    ["糸に引かれる", [taunt(2), buff("defense", 0.2, 2)]],
    ["操られた剣", [phys(1.7)]],
    ["痛みを知らぬ体", [buff("defense", 0.45, 3)]],
    ["暴走", [phys(1.0, 3), taunt(2)]],
  ),

  /* ハンター */
  thief: skills(
    ["すばやい連撃", [phys(0.75, 3)]],
    ["かく乱", [debuff("speed", 0.25, 3), debuff("attack", 0.1, 3)]],
    ["急所突き", [phys(1.0, 3)]],
    ["影分身", [phys(0.9, 6)]],
  ),
  assassin: skills(
    ["毒の刃", [phys(0.8, 3)]],
    ["暗がりに潜む", [buff("speed", 0.3, 3), buff("attack", 0.2, 3)]],
    ["急所狙い", [phys(2.2)]],
    ["暗殺術", [phys(1.3, 4)]],
  ),
  archer: skills(
    ["二連射", [phys(0.95, 2)]],
    ["鷹の目", [buff("attack", 0.3, 3), debuff("defense", 0.15, 3)]],
    ["三連射", [phys(0.9, 3)]],
    ["流星の矢", [phys(0.8, 7)]],
  ),
  bounty_hunter: skills(
    ["しかけ網", [phys(1.0), debuff("speed", 0.2, 3)]],
    ["追跡", [debuff("defense", 0.2, 3), buff("speed", 0.2, 3)]],
    ["連射銃", [phys(0.85, 4)]],
    ["大物狩り", [phys(3.0), debuff("defense", 0.2, 2)]],
  ),
  monk: skills(
    ["正拳突き", [phys(0.8, 3)]],
    ["気をためる", [buff("attack", 0.35, 3), heal(0.6, "lowest")]],
    ["旋風脚", [phys(1.1, 3)]],
    ["百裂拳", [phys(0.55, 10)]],
  ),
  bandit: skills(
    ["あばれ斬り", [phys(0.8, 3)]],
    ["おどし", [debuff("attack", 0.2, 3)]],
    ["集団で襲う", [phys(0.95, 3)]],
    ["根こそぎ奪う", [phys(1.2, 4), debuff("defense", 0.15, 2)]],
  ),

  /* マジック */
  mage: skills(
    ["ファイア", [mag(1.8)]],
    ["魔力の集中", [buff("magic", 0.35, 3)]],
    ["サンダー", [mag(1.25, 2)]],
    ["メテオ", [mag(3.8)]],
  ),
  dark_mage: skills(
    ["闇の弾", [mag(1.7)]],
    ["呪い", [debuff("defense", 0.25, 3), debuff("attack", 0.1, 3)]],
    ["生気を吸う", [mag(1.5), heal(0.6, "lowest")]],
    ["深淵の門", [mag(3.6)]],
  ),
  homunculus: skills(
    ["魔力光線", [mag(1.7)]],
    ["自己修復", [heal(1.0, "lowest"), buff("defense", 0.25, 2)]],
    ["多重演算", [mag(0.75, 3)]],
    ["殲滅プログラム", [mag(1.0, 4)]],
  ),
  slime: skills(
    ["ぷるぷる魔弾", [mag(1.6)]],
    ["ねばねば", [debuff("speed", 0.3, 3), debuff("defense", 0.15, 3)]],
    ["分裂して撃つ", [mag(0.75, 3)]],
    ["キングスライム", [mag(3.2), shield(0.6)]],
  ),
  cultist: skills(
    ["怪しい儀式", [mag(1.6)]],
    ["集団詠唱", [buff("magic", 0.25, 3, "party")]],
    ["邪神の影", [mag(1.3), debuff("defense", 0.15, 3)]],
    ["召喚・大いなるもの", [mag(3.7)]],
  ),

  /* サポート */
  cleric: skills(
    ["ヒール", [heal(1.7)]],
    ["祝福", [buff("defense", 0.25, 3, "party")]],
    ["光の雨", [heal(1.1, "party")]],
    ["聖なる祈り", [heal(1.5, "party"), shield(0.8)]],
  ),
  bard: skills(
    ["癒やしの歌", [heal(1.5)]],
    ["勇気の歌", [buff("attack", 0.25, 3, "party"), buff("magic", 0.25, 3, "party")]],
    ["はやての歌", [buff("speed", 0.3, 3, "party")]],
    ["英雄の凱歌", [heal(1.2, "party"), buff("attack", 0.3, 3, "party")]],
  ),
  merchant: skills(
    ["薬を配る", [heal(1.6)]],
    ["上等な盾を貸す", [shield(1.1)]],
    ["そろばんで殴る", [phys(1.0), debuff("defense", 0.2, 3)]],
    ["大売り出し", [heal(1.3, "party"), buff("attack", 0.2, 3, "party")]],
  ),
  sprout: skills(
    ["森のしずく", [heal(1.7)]],
    ["若葉の守り", [shield(1.0)]],
    ["花粉の雲", [debuff("attack", 0.2, 3), heal(0.6, "party")]],
    ["大樹の恵み", [heal(1.6, "party"), buff("defense", 0.25, 3, "party")]],
  ),
  heretic_priest: skills(
    ["暗い癒やし", [heal(1.5)]],
    ["洗脳", [debuff("attack", 0.25, 3)]],
    ["生贄の儀", [mag(1.3), heal(0.8, "party")]],
    ["死者の行進", [mag(2.4), heal(1.0, "party")]],
  ),
  corrupt_merchant: skills(
    ["高い薬を売る", [heal(1.5)]],
    ["傭兵を雇う", [buff("attack", 0.3, 3, "party")]],
    ["金の盾", [shield(1.1)]],
    ["買収", [debuff("attack", 0.25, 3), debuff("defense", 0.25, 3)]],
  ),
};

// そのレベルで使える技
export function getUnlockedSkills(
  characterType: CharacterType,
  level: number,
): Skill[] {
  return SKILL_CATALOG[characterType].filter(
    (skill) => level >= skill.level,
  );
}

/* ---------- 技の説明 ---------- */

const BUFF_LABELS: Record<BuffStat, string> = {
  attack: "物理攻撃",
  magic: "魔法攻撃",
  defense: "防御力",
  speed: "スピード",
};

function describeEffect(effect: SkillEffect): string {
  switch (effect.type) {
    case "damage": {
      const element = effect.element === "physical" ? "物理" : "魔法";
      const total = effect.power * effect.hits;
      const size = total >= 3 ? "特大" : total >= 2 ? "大" : total >= 1.4 ? "中" : "小";
      const hits = effect.hits > 1 ? `（${effect.hits}回）` : "";

      return `${element}で${size}ダメージ${hits}`;
    }
    case "heal":
      return effect.target === "party"
        ? "仲間全員を回復"
        : "いちばん減っている仲間を回復";
    case "buff": {
      const who = effect.target === "party" ? "仲間全員の" : "自分の";
      const direction = effect.amount >= 0 ? "上げる" : "下げる";

      return `${who}${BUFF_LABELS[effect.stat]}を${effect.turns}ターン${direction}`;
    }
    case "debuff":
      return `ボスの${BUFF_LABELS[effect.stat]}を${effect.turns}ターン下げる`;
    case "shield":
      return effect.target === "party"
        ? "仲間全員にバリアを張る"
        : "自分にバリアを張る";
    case "taunt":
      return `ボスの攻撃を${effect.turns}ターン引きつける`;
  }
}

// 技の効果を，画面に出す短い文にする
export function describeSkill(skill: Skill) {
  return skill.effects.map(describeEffect).join("，");
}
