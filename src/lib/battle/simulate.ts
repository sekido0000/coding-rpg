/*
 * ボス戦の計算．
 *
 * 戦いは自動で進み，結果と経過（ログ）をまとめて返す．
 * ずるができないよう，サーバーで計算し，画面ではログを順に再生するだけにする．
 * 乱数は seed から作るので，同じ seed なら同じ結果になる（テストで固定できる）．
 *
 * 流れ：
 * - 1ターンに，生きている全員がスピードの高い順に1回ずつ行動する
 * - キャラクターは，使える技があれば技を，なければ通常攻撃をする
 * - ボスは決まった行動を順に繰り返す
 * - ボスのHPを0にすれば勝ち．全員倒れるか，20ターンたつと負け
 */

import {
  BOSS_CATALOG,
  STAR_BASE_STATS,
  type BossAction,
  type BossId,
  type BossStar,
} from "@/lib/battle/bosses";
import {
  applyGearBonus,
  getEffectiveRates,
  type EquippedGear,
} from "@/lib/battle/gear";
import {
  getUnlockedSkills,
  type BuffStat,
  type Element,
  type Skill,
  type SkillEffect,
} from "@/lib/battle/skills";
import {
  CHARACTER_BATTLE_TYPES,
  ROLE_CATALOG,
  getCharacterStats,
  type Role,
  type Stats,
} from "@/lib/battle/stats";
import type { CharacterType } from "@/lib/characters/generated-types";

export const MAX_ROUNDS = 25;

// 防御力の効き方．防御力がこの値と同じなら，ダメージが半分になる
const DEFENSE_SCALE = 50;

// バリアは，最大HPのこの割合までしか重ねられない
const SHIELD_CAP_RATE = 0.5;

// 毒で毎ターン減るHP（最大HPに対して）と，続くターン数
const POISON_RATE = 0.06;
const POISON_TURNS = 3;

// ボスの会心の確率（決めていないボス）
const BOSS_CRIT_RATE = 0.05;

export type BattleMember = {
  // キャラクターのID（助っ人は helper:◯◯）
  id: string;
  name: string;
  characterType: CharacterType;
  level: number;
  isHelper?: boolean;
  // 付けている武器・防具
  gear?: EquippedGear[];
};

export type BattleUnit = {
  // p0〜p2：パーティー，boss：ボス
  id: string;
  side: "party" | "boss";
  name: string;
  maxHp: number;
  characterId?: string;
  characterType?: CharacterType;
  level?: number;
  role?: Role;
  isHelper?: boolean;
  // 戦うボスに有効な武器・防具を付けている
  hasEffectiveWeapon?: boolean;
  hasEffectiveArmor?: boolean;
};

export type BattleHit = {
  targetId: string;
  kind: "damage" | "heal" | "shield" | "buff" | "debuff";
  amount: number;
  isCrit?: boolean;
  // 弱点（1.2倍以上）・効きにくい（0.8倍以下）
  isWeak?: boolean;
  isResisted?: boolean;
};

export type BattleStep = {
  round: number;
  // 行動したもの．ターンの終わりの毒や回復は system
  actorId: string;
  actionName: string;
  // 画面に出す文
  text: string;
  hits: BattleHit[];
  // 行動の後の，全員のHPとバリア
  hp: Record<string, number>;
  shields: Record<string, number>;
};

export type BattleResult = {
  isWin: boolean;
  // 時間切れで負けた
  isTimeout: boolean;
  rounds: number;
  units: BattleUnit[];
  steps: BattleStep[];
};

/* ---------- 乱数 ---------- */

// seed から 0以上1未満の数を順に作る（mulberry32）
export function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- 戦っている間の状態 ---------- */

type Modifier = { stat: BuffStat; amount: number; turns: number };

type Fighter = {
  unit: BattleUnit;
  stats: Stats;
  hp: number;
  shield: number;
  modifiers: Modifier[];
  taunt: number;
  poison: { damage: number; turns: number } | null;
  skills: Skill[];
  cooldowns: number[];
  critRate: number;
  // 通常攻撃の種類（物理攻撃と魔法攻撃の高いほう）
  basicElement: Element;
  // 有効な装備による，与える・受けるダメージの倍率
  damageDealtRate: number;
  damageTakenRate: number;
};

function getStat(fighter: Fighter, stat: BuffStat) {
  const total = fighter.modifiers
    .filter((modifier) => modifier.stat === stat)
    .reduce((sum, modifier) => sum + modifier.amount, 0);

  return fighter.stats[stat] * Math.max(0.3, 1 + total);
}

function isAlive(fighter: Fighter) {
  return fighter.hp > 0;
}

/*
 * ダメージを計算する．
 * 攻撃力 × 威力 を，防御力で減らし，少しだけばらつかせる．
 */
function calculateDamage(
  attack: number,
  power: number,
  defense: number,
  random: () => number,
) {
  return (
    power *
    attack *
    (DEFENSE_SCALE / (DEFENSE_SCALE + defense)) *
    (0.9 + random() * 0.2)
  );
}

// ダメージを受ける．バリアがあれば先にバリアが減る
function takeDamage(target: Fighter, amount: number) {
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  target.hp = Math.max(0, target.hp - (amount - absorbed));
}

// 同じ種類の強化・弱体は重ねず，強いほうで上書きする
function addModifier(target: Fighter, modifier: Modifier) {
  const sameSign = (amount: number) =>
    Math.sign(amount) === Math.sign(modifier.amount);
  const existing = target.modifiers.find(
    (current) =>
      current.stat === modifier.stat && sameSign(current.amount),
  );

  if (existing) {
    existing.amount =
      Math.abs(modifier.amount) > Math.abs(existing.amount)
        ? modifier.amount
        : existing.amount;
    existing.turns = Math.max(existing.turns, modifier.turns);
  } else {
    target.modifiers.push({ ...modifier });
  }
}

function hasModifier(target: Fighter, stat: BuffStat, sign: number) {
  return target.modifiers.some(
    (modifier) =>
      modifier.stat === stat && Math.sign(modifier.amount) === sign,
  );
}

/* ---------- 戦いの準備 ---------- */

function createPartyFighter(
  member: BattleMember,
  index: number,
  bossId: BossId,
): Fighter {
  const gear = member.gear ?? [];
  const stats = applyGearBonus(
    getCharacterStats(member.characterType, member.level),
    gear,
  );
  const rates = getEffectiveRates(gear, bossId);
  const role = CHARACTER_BATTLE_TYPES[member.characterType].role;
  const skills = getUnlockedSkills(member.characterType, member.level);

  return {
    unit: {
      id: `p${index}`,
      side: "party",
      name: member.name,
      maxHp: stats.hp,
      characterId: member.id,
      characterType: member.characterType,
      level: member.level,
      role,
      isHelper: member.isHelper,
      hasEffectiveWeapon: rates.damageDealt > 1 || undefined,
      hasEffectiveArmor: rates.damageTaken < 1 || undefined,
    },
    stats,
    hp: stats.hp,
    shield: 0,
    modifiers: [],
    taunt: 0,
    poison: null,
    skills,
    cooldowns: skills.map(() => 0),
    critRate: ROLE_CATALOG[role].critRate,
    basicElement: stats.magic > stats.attack ? "magic" : "physical",
    damageDealtRate: rates.damageDealt,
    damageTakenRate: rates.damageTaken,
  };
}

export function getBossStats(bossId: BossId, star: BossStar): Stats {
  const base = STAR_BASE_STATS[star];
  const { profile } = BOSS_CATALOG[bossId];
  const attack = Math.round(base.attack * profile.attack);

  return {
    hp: Math.round(base.hp * profile.hp),
    attack,
    magic: attack,
    defense: Math.round(base.defense * profile.defense),
    speed: Math.round(base.speed * profile.speed),
  };
}

function createBossFighter(bossId: BossId, star: BossStar): Fighter {
  const boss = BOSS_CATALOG[bossId];
  const stats = getBossStats(bossId, star);

  return {
    unit: {
      id: "boss",
      side: "boss",
      name: boss.name,
      maxHp: stats.hp,
    },
    stats,
    hp: stats.hp,
    shield: 0,
    modifiers: [],
    taunt: 0,
    poison: null,
    skills: [],
    cooldowns: [],
    critRate: boss.critRate ?? BOSS_CRIT_RATE,
    basicElement: "physical",
    damageDealtRate: 1,
    damageTakenRate: 1,
  };
}

/* ---------- 戦い ---------- */

export function simulateBattle({
  bossId,
  star,
  members,
  seed,
}: {
  bossId: BossId;
  star: BossStar;
  members: BattleMember[];
  seed: number;
}): BattleResult {
  const random = createRandom(seed);
  const boss = BOSS_CATALOG[bossId];
  const party = members
    .slice(0, 3)
    .map((member, index) => createPartyFighter(member, index, bossId));
  const bossFighter = createBossFighter(bossId, star);
  const everyone = [...party, bossFighter];
  const steps: BattleStep[] = [];

  let round = 0;
  let bossTurn = 0;
  let isEnraged = false;

  const snapshot = () => ({
    hp: Object.fromEntries(
      everyone.map((fighter) => [fighter.unit.id, Math.round(fighter.hp)]),
    ),
    shields: Object.fromEntries(
      everyone.map((fighter) => [
        fighter.unit.id,
        Math.round(fighter.shield),
      ]),
    ),
  });

  const record = (
    actorId: string,
    actionName: string,
    text: string,
    hits: BattleHit[],
  ) => {
    steps.push({ round, actorId, actionName, text, hits, ...snapshot() });
  };

  const aliveParty = () => party.filter(isAlive);

  const isOver = () => !isAlive(bossFighter) || aliveParty().length === 0;

  /* ----- キャラクターの行動 ----- */

  const isUseful = (actor: Fighter, effect: SkillEffect) => {
    const allies = aliveParty();

    switch (effect.type) {
      case "damage":
        return true;
      case "heal":
        return effect.target === "party"
          ? allies.reduce((sum, ally) => sum + ally.hp / ally.unit.maxHp, 0) /
              allies.length <
              0.8
          : allies.some((ally) => ally.hp / ally.unit.maxHp < 0.7);
      case "buff":
        // 自分を弱くするだけの効果（狂戦士の防御ダウン）では使わない
        if (effect.amount < 0) {
          return false;
        }

        return effect.target === "party"
          ? allies.some((ally) => !hasModifier(ally, effect.stat, 1))
          : !hasModifier(actor, effect.stat, 1);
      case "debuff":
        return !hasModifier(bossFighter, effect.stat, -1);
      case "shield":
        return effect.target === "party"
          ? allies.some((ally) => ally.shield === 0)
          : actor.shield === 0;
      case "taunt":
        return !allies.some((ally) => ally.taunt > 0);
    }
  };

  // 使う技を選ぶ．使える技がなければ null（通常攻撃）
  const chooseSkill = (actor: Fighter): number | null => {
    const ready = actor.skills
      .map((skill, index) => ({ skill, index }))
      .filter(({ index }) => actor.cooldowns[index] === 0);

    // 倒れそうな仲間がいれば，回復を先に使う
    const isDanger = aliveParty().some(
      (ally) => ally.hp / ally.unit.maxHp < 0.5,
    );

    if (isDanger) {
      const healing = ready.find(({ skill }) =>
        skill.effects.some((effect) => effect.type === "heal"),
      );

      if (healing) {
        return healing.index;
      }
    }

    // 強い技（使えるようになるレベルが高い技）から順に，役に立つものを使う
    const useful = [...ready]
      .sort((a, b) => b.skill.level - a.skill.level)
      .find(({ skill }) =>
        skill.effects.some((effect) => isUseful(actor, effect)),
      );

    return useful ? useful.index : null;
  };

  const elementRate = (element: Element) =>
    element === "physical" ? boss.physicalRate : boss.magicRate;

  const dealToBoss = (
    actor: Fighter,
    element: Element,
    power: number,
    hits: BattleHit[],
  ) => {
    if (!isAlive(bossFighter)) {
      return;
    }

    const attack = getStat(actor, element === "physical" ? "attack" : "magic");
    const rate = elementRate(element);
    const isCrit = random() < actor.critRate;
    const amount = Math.max(
      1,
      Math.round(
        calculateDamage(
          attack,
          power,
          getStat(bossFighter, "defense"),
          random,
        ) *
          rate *
          actor.damageDealtRate *
          (isCrit ? 1.5 : 1),
      ),
    );

    takeDamage(bossFighter, amount);
    hits.push({
      targetId: "boss",
      kind: "damage",
      amount,
      isCrit: isCrit || undefined,
      isWeak: rate >= 1.2 || undefined,
      isResisted: rate <= 0.8 || undefined,
    });
  };

  const applyEffect = (
    actor: Fighter,
    effect: SkillEffect,
    hits: BattleHit[],
  ) => {
    switch (effect.type) {
      case "damage":
        for (let hit = 0; hit < effect.hits; hit += 1) {
          dealToBoss(actor, effect.element, effect.power, hits);
        }
        return;
      case "heal": {
        const allies = aliveParty();
        const targets =
          effect.target === "party"
            ? allies
            : [
                allies.reduce((lowest, ally) =>
                  ally.hp / ally.unit.maxHp < lowest.hp / lowest.unit.maxHp
                    ? ally
                    : lowest,
                ),
              ];
        const power = Math.round(effect.power * getStat(actor, "magic"));

        for (const target of targets) {
          const amount = Math.min(power, target.unit.maxHp - target.hp);
          target.hp += amount;
          hits.push({ targetId: target.unit.id, kind: "heal", amount });
        }
        return;
      }
      case "buff": {
        const targets = effect.target === "party" ? aliveParty() : [actor];

        for (const target of targets) {
          addModifier(target, {
            stat: effect.stat,
            amount: effect.amount,
            turns: effect.turns,
          });
          hits.push({
            targetId: target.unit.id,
            kind: effect.amount >= 0 ? "buff" : "debuff",
            amount: Math.round(effect.amount * 100),
          });
        }
        return;
      }
      case "debuff":
        addModifier(bossFighter, {
          stat: effect.stat,
          amount: -effect.amount,
          turns: effect.turns,
        });
        hits.push({
          targetId: "boss",
          kind: "debuff",
          amount: Math.round(effect.amount * 100),
        });
        return;
      case "shield": {
        const targets = effect.target === "party" ? aliveParty() : [actor];
        const power = Math.round(
          effect.power *
            Math.max(getStat(actor, "magic"), getStat(actor, "defense")),
        );

        for (const target of targets) {
          const cap = target.unit.maxHp * SHIELD_CAP_RATE;
          const amount = Math.max(
            0,
            Math.min(power, cap - target.shield),
          );
          target.shield += amount;
          hits.push({ targetId: target.unit.id, kind: "shield", amount });
        }
        return;
      }
      case "taunt":
        actor.taunt = effect.turns;
        return;
    }
  };

  const describeHits = (hits: BattleHit[]) => {
    const damage = hits
      .filter((hit) => hit.kind === "damage")
      .reduce((sum, hit) => sum + hit.amount, 0);
    const heal = hits
      .filter((hit) => hit.kind === "heal")
      .reduce((sum, hit) => sum + hit.amount, 0);
    const parts: string[] = [];

    if (damage > 0) {
      const extra = hits.some((hit) => hit.isWeak)
        ? "（弱点！）"
        : hits.some((hit) => hit.isResisted)
          ? "（効きにくい…）"
          : "";
      parts.push(`${damage} のダメージ${extra}`);
    }

    if (heal > 0) {
      parts.push(`HPを ${heal} 回復`);
    }

    if (hits.some((hit) => hit.kind === "shield")) {
      parts.push("バリアを張った");
    }

    if (hits.some((hit) => hit.kind === "buff")) {
      parts.push("強くなった");
    }

    if (hits.some((hit) => hit.kind === "debuff" && hit.targetId === "boss")) {
      parts.push(`${boss.name}が弱くなった`);
    }

    return parts.join("・");
  };

  const actAsCharacter = (actor: Fighter) => {
    actor.cooldowns = actor.cooldowns.map((cooldown) =>
      Math.max(0, cooldown - 1),
    );

    const skillIndex = chooseSkill(actor);
    const hits: BattleHit[] = [];

    if (skillIndex === null) {
      dealToBoss(actor, actor.basicElement, 1, hits);
      record(
        actor.unit.id,
        "通常攻撃",
        `${actor.unit.name}の攻撃！ ${describeHits(hits)}`,
        hits,
      );
      return;
    }

    const skill = actor.skills[skillIndex];
    actor.cooldowns[skillIndex] = skill.cooldown;

    for (const effect of skill.effects) {
      applyEffect(actor, effect, hits);
    }

    const isTaunt = skill.effects.some((effect) => effect.type === "taunt");
    const detail = [
      isTaunt ? `${boss.name}の攻撃を引きつけた` : "",
      describeHits(hits),
    ]
      .filter(Boolean)
      .join("・");

    record(
      actor.unit.id,
      skill.name,
      `${actor.unit.name}の「${skill.name}」！ ${detail}`,
      hits,
    );
  };

  /* ----- ボスの行動 ----- */

  // 攻撃する相手を選ぶ．引きつけている仲間がいればその仲間，いなければ（タンクを少し狙いやすく）ランダム
  const pickTargets = (count: number) => {
    const allies = aliveParty();
    const targets: Fighter[] = [];
    const taunting = allies.find((ally) => ally.taunt > 0);

    if (taunting) {
      targets.push(taunting);
    }

    while (targets.length < Math.min(count, allies.length)) {
      const candidates = allies.filter((ally) => !targets.includes(ally));
      const weights = candidates.map((ally) =>
        ally.unit.role === "tank" ? 1.5 : 1,
      );
      let roll = random() * weights.reduce((sum, weight) => sum + weight, 0);
      const picked =
        candidates.find((_, index) => {
          roll -= weights[index];
          return roll < 0;
        }) ?? candidates[candidates.length - 1];

      targets.push(picked);
    }

    return targets;
  };

  const bossAttack = () => {
    const growth = 1 + (boss.growthRate ?? 0) * (round - 1);
    const enraged = isEnraged ? 1 + (boss.enrage ?? 0) : 1;

    return getStat(bossFighter, "attack") * growth * enraged;
  };

  const hitParty = (
    targets: Fighter[],
    power: number,
    hits: BattleHit[],
    canCrit = true,
  ) => {
    for (const target of targets) {
      const isCrit = canCrit && random() < bossFighter.critRate;
      const amount = Math.max(
        1,
        Math.round(
          calculateDamage(
            bossAttack(),
            power,
            getStat(target, "defense"),
            random,
          ) *
            target.damageTakenRate *
            (isCrit ? 1.5 : 1),
        ),
      );

      takeDamage(target, amount);
      hits.push({
        targetId: target.unit.id,
        kind: "damage",
        amount,
        isCrit: isCrit || undefined,
      });
    }
  };

  const describeBossHits = (hits: BattleHit[]) =>
    hits
      .filter((hit) => hit.kind === "damage")
      .map((hit) => {
        const target = everyone.find(
          (fighter) => fighter.unit.id === hit.targetId,
        )!;
        const crit = hit.isCrit ? "会心！ " : "";

        return `${crit}${target.unit.name}に ${hit.amount}`;
      })
      .join("，");

  const runBossAction = (action: BossAction) => {
    const hits: BattleHit[] = [];
    let text = "";

    switch (action.kind) {
      case "attack":
        hitParty(pickTargets(1), action.power, hits);
        text = describeBossHits(hits);
        break;
      case "double":
        hitParty(pickTargets(2), action.power, hits);
        text = describeBossHits(hits);
        break;
      case "aoe":
        hitParty(aliveParty(), action.power, hits);
        text = `全員に攻撃！ ${describeBossHits(hits)}`;
        break;
      case "charge":
        text = "次の攻撃に気をつけて！";
        break;
      case "burst":
        hitParty(pickTargets(1), action.power, hits, false);
        text = `強烈な一撃！ ${describeBossHits(hits)}`;
        break;
      case "guard":
        addModifier(bossFighter, {
          stat: "defense",
          amount: action.amount,
          turns: action.turns,
        });
        hits.push({
          targetId: "boss",
          kind: "buff",
          amount: Math.round(action.amount * 100),
        });
        text = "防御力が大きく上がった！";
        break;
      case "heal": {
        const amount = Math.min(
          Math.round(bossFighter.unit.maxHp * action.rate),
          bossFighter.unit.maxHp - bossFighter.hp,
        );
        bossFighter.hp += amount;
        hits.push({ targetId: "boss", kind: "heal", amount });
        text = `HPを ${amount} 回復した`;
        break;
      }
      case "poison": {
        const targets = aliveParty();
        hitParty(targets, action.power, hits);

        for (const target of targets) {
          target.poison = {
            damage: Math.max(1, Math.round(target.unit.maxHp * POISON_RATE)),
            turns: POISON_TURNS,
          };
        }

        text = `全員が毒を受けた！ ${describeBossHits(hits)}`;
        break;
      }
    }

    // 力をためる時は「◯◯は力をためている…」のように，技の名前ではなく様子として書く
    const lead =
      action.kind === "charge"
        ? `${boss.name}は${action.name}`
        : `${boss.name}の「${action.name}」！`;

    record("boss", action.name, `${lead} ${text}`, hits);
  };

  const actAsBoss = () => {
    const action = boss.actions[bossTurn % boss.actions.length];
    bossTurn += 1;
    runBossAction(action);
  };

  /* ----- ターンの終わり ----- */

  const endRound = () => {
    const hits: BattleHit[] = [];

    for (const fighter of aliveParty()) {
      if (fighter.poison) {
        const amount = Math.min(fighter.poison.damage, fighter.hp - 1);

        if (amount > 0) {
          fighter.hp -= amount;
          hits.push({ targetId: fighter.unit.id, kind: "damage", amount });
        }

        fighter.poison.turns -= 1;

        if (fighter.poison.turns <= 0) {
          fighter.poison = null;
        }
      }
    }

    if (hits.length > 0) {
      record("system", "毒", `毒でHPが減った`, hits);
    }

    if (boss.regenRate && isAlive(bossFighter)) {
      const amount = Math.min(
        Math.round(bossFighter.unit.maxHp * boss.regenRate),
        bossFighter.unit.maxHp - bossFighter.hp,
      );

      if (amount > 0) {
        bossFighter.hp += amount;
        record("system", "再生", `${boss.name}のHPが ${amount} 回復した`, [
          { targetId: "boss", kind: "heal", amount },
        ]);
      }
    }

    for (const fighter of everyone) {
      fighter.modifiers = fighter.modifiers
        .map((modifier) => ({ ...modifier, turns: modifier.turns - 1 }))
        .filter((modifier) => modifier.turns > 0);
      fighter.taunt = Math.max(0, fighter.taunt - 1);
    }
  };

  while (!isOver() && round < MAX_ROUNDS) {
    round += 1;

    // スピードの高い順．同じならパーティーが先
    const order = everyone
      .filter(isAlive)
      .sort(
        (a, b) =>
          getStat(b, "speed") - getStat(a, "speed") ||
          (a.unit.side === "party" ? -1 : 1),
      );

    for (const fighter of order) {
      if (isOver()) {
        break;
      }

      if (!isAlive(fighter)) {
        continue;
      }

      if (fighter === bossFighter) {
        actAsBoss();
      } else {
        actAsCharacter(fighter);
      }

      // HPが半分を切ったら本気を出す
      if (
        boss.enrage &&
        !isEnraged &&
        isAlive(bossFighter) &&
        bossFighter.hp < bossFighter.unit.maxHp / 2
      ) {
        isEnraged = true;
        record("system", "本気", `${boss.name}が本気を出した！ 攻撃力が上がった`, []);
      }
    }

    if (!isOver()) {
      endRound();
    }
  }

  const isWin = !isAlive(bossFighter);

  return {
    isWin,
    isTimeout: !isWin && aliveParty().length > 0,
    rounds: round,
    units: everyone.map((fighter) => fighter.unit),
    steps,
  };
}
