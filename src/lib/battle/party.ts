/*
 * パーティーの編成．助っ人と，おまかせ編成．
 */

import {
  BOSS_CATALOG,
  HELPER_MAX_STAR,
  type BossId,
  type BossStar,
} from "@/lib/battle/bosses";
import type { BattleMember } from "@/lib/battle/simulate";
import { getRole, getLevelMultiplier, type Role } from "@/lib/battle/stats";
import type { CharacterType } from "@/lib/characters/generated-types";

export const MAX_PARTY_SIZE = 3;

// ボスに大きなダメージを与える役割
const DAMAGE_ROLES: Role[] = ["attacker", "hunter", "magic"];

export type PartyCandidate = {
  id: string;
  name: string;
  characterType: CharacterType;
  level: number;
};

/*
 * 助っ人．★1〜★3 で，パーティーの空いた枠に入る．
 * キャラクターが1体の人でも挑めるようにするため．★が上がると助っ人も少し強くなる．
 */
const HELPERS: { id: string; name: string; characterType: CharacterType }[] = [
  { id: "helper:cleric", name: "助っ人の僧侶", characterType: "cleric" },
  { id: "helper:warrior", name: "助っ人の戦士", characterType: "warrior" },
];

export function getHelperLevel(star: BossStar) {
  return star;
}

export function canUseHelpers(star: BossStar) {
  return star <= HELPER_MAX_STAR;
}

// パーティーの空いた枠に助っ人を入れる（★4・★5 は入れない）
export function fillWithHelpers(
  members: BattleMember[],
  star: BossStar,
): BattleMember[] {
  if (!canUseHelpers(star)) {
    return members;
  }

  const helpers = HELPERS.slice(
    0,
    Math.max(0, MAX_PARTY_SIZE - members.length),
  ).map((helper) => ({
    ...helper,
    level: getHelperLevel(star),
    isHelper: true,
  }));

  return [...members, ...helpers];
}

/*
 * おまかせ編成．ボスに合いそうなキャラクターを3体まで選ぶ．
 * 強さ（レベル）に，おすすめの役割なら上乗せし，同じ役割ばかりにならないようにする．
 */
export function recommendParty(
  candidates: PartyCandidate[],
  bossId: BossId,
): string[] {
  const recommended = BOSS_CATALOG[bossId].recommendedRoles;
  const chosen: PartyCandidate[] = [];
  const remaining = [...candidates];

  const score = (candidate: PartyCandidate) => {
    const role = getRole(candidate.characterType);
    const fit = recommended.includes(role) ? 1.3 : 1;
    const usedRoles = chosen.map((member) => getRole(member.characterType));
    // すでに同じ役割がいる時は少し下げる
    const variety = usedRoles.includes(role) ? 0.8 : 1;
    // 回復役がいないパーティーには，サポートを入れやすくする
    const needsHealer =
      role === "support" && !usedRoles.includes("support") ? 1.1 : 1;
    // 攻撃役がいないと倒しきれないので，攻撃役がまだいなければ入れやすくする
    const needsDamage =
      DAMAGE_ROLES.includes(role) &&
      !usedRoles.some((used) => DAMAGE_ROLES.includes(used))
        ? 1.25
        : 1;

    return (
      getLevelMultiplier(candidate.level) *
      fit *
      variety *
      needsHealer *
      needsDamage
    );
  };

  while (chosen.length < MAX_PARTY_SIZE && remaining.length > 0) {
    remaining.sort((a, b) => score(b) - score(a) || b.level - a.level);
    chosen.push(remaining.shift()!);
  }

  return chosen.map((candidate) => candidate.id);
}
