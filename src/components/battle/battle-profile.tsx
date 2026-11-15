import type { ReactNode } from "react";

import {
  SKILL_CATALOG,
  describeSkill,
} from "@/lib/battle/skills";
import {
  CHARACTER_BATTLE_TYPES,
  ROLE_CATALOG,
  STAT_KEYS,
  STAT_LABELS,
  STAT_LEVEL_CAP,
  getCharacterStats,
} from "@/lib/battle/stats";
import { applyGearBonus, type EquippedGear } from "@/lib/battle/gear";
import type { CharacterType } from "@/lib/characters/generated-types";

/*
 * キャラクターの詳細ページに出す，ボス戦での役割・ステータス・技．
 * まだ使えない技も，使えるようになるレベルと一緒に見せる（次の目標になるように）．
 */
export function BattleProfile({
  characterType,
  level,
  gear = [],
  children,
}: {
  characterType: CharacterType;
  level: number;
  // 付けている武器・防具（ステータスに効果を足して表示する）
  gear?: EquippedGear[];
  // 武器・防具を選ぶ欄
  children?: ReactNode;
}) {
  const { role: roleId, bonus } = CHARACTER_BATTLE_TYPES[characterType];
  const role = ROLE_CATALOG[roleId];
  const baseStats = getCharacterStats(characterType, level);
  const stats = applyGearBonus(baseStats, gear);
  // 頭打ちのレベルでの値（ゲージの長さに使う）
  const maxStats = applyGearBonus(
    getCharacterStats(characterType, STAT_LEVEL_CAP),
    gear,
  );
  const scale = Math.max(...STAT_KEYS.filter((key) => key !== "hp").map((key) => maxStats[key]));

  return (
    <section aria-labelledby="battle-profile" className="repo-panel mt-5 p-6">
      <p className="repo-kicker">Battle</p>
      <h2 id="battle-profile" className="mt-1 text-lg font-bold text-white">
        ボス戦のステータスと技
      </h2>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-sm text-slate-200">
            役割：
            <span className="font-bold text-white">
              {role.icon} {role.name}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-400">{role.description}</p>

          {children && <div className="mt-4 space-y-2">{children}</div>}

          <dl className="mt-4 space-y-2">
            {STAT_KEYS.map((key) => {
              const width =
                key === "hp"
                  ? (stats.hp / maxStats.hp) * 100
                  : (stats[key] / scale) * 100;

              return (
                <div key={key} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2 text-sm">
                  <dt className="text-slate-300">
                    {STAT_LABELS[key]}
                    {key === bonus && (
                      <span className="ml-1 text-[10px] text-emerald-300" title="この種類が少し得意なステータス">
                        得意
                      </span>
                    )}
                  </dt>
                  <span className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <span
                      className="block h-full rounded-full bg-emerald-400"
                      style={{ width: `${Math.min(100, width)}%` }}
                    />
                  </span>
                  <dd className="text-right font-bold text-white">
                    {stats[key]}
                    {stats[key] > baseStats[key] && (
                      <span className="block text-[10px] font-semibold text-emerald-300">
                        +{stats[key] - baseStats[key]}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            ステータスはレベルで伸び，Lv{STAT_LEVEL_CAP} で頭打ちになります．
            {level >= STAT_LEVEL_CAP && "ここから先は，工房で作る武器・防具で強くなれます．"}
          </p>
        </div>

        <ul className="space-y-2">
          {SKILL_CATALOG[characterType].map((skill) => {
            const isUnlocked = level >= skill.level;

            return (
              <li
                key={skill.name}
                className={`rounded-xl border p-3 ${
                  isUnlocked
                    ? "border-emerald-400/30 bg-emerald-400/5"
                    : "border-slate-800 bg-slate-900/40 opacity-60"
                }`}
              >
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-bold text-white">{skill.name}</span>
                  <span className="text-xs text-slate-400">
                    {isUnlocked ? `Lv${skill.level}で習得` : `🔒 Lv${skill.level}で使えるようになる`}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {describeSkill(skill)}（{skill.cooldown}ターンに1回）
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
