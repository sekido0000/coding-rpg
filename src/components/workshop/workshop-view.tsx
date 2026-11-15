"use client";

import { useState, useTransition } from "react";

import {
  craftGearAction,
  upgradeGearAction,
} from "@/app/actions/gear-actions";
import { BossSprite } from "@/components/battle/boss-sprite";
import { GearIcon } from "@/components/battle/gear-icon";
import { useGearEquip } from "@/components/battle/use-gear-equip";
import {
  BOSS_CATALOG,
  MATERIAL_CATALOG,
  MATERIAL_IDS,
  type MaterialId,
} from "@/lib/battle/bosses";
import {
  GEAR_CATALOG,
  GEAR_IDS,
  GEAR_SLOT_LABELS,
  MAX_GEAR_LEVEL,
  describeGearStats,
  getUpgradeCost,
  type GearId,
  type MaterialCost,
} from "@/lib/battle/gear";
import type { OwnedGear } from "@/lib/battle/owned-gear";
import { STAT_LABELS } from "@/lib/battle/stats";

export type WorkshopCharacter = { id: string; name: string };

type Tab = "weapon" | "armor" | "legendary";

const TABS: { id: Tab; label: string }[] = [
  { id: "weapon", label: "⚔️ 武器" },
  { id: "armor", label: "🛡️ 防具" },
  { id: "legendary", label: "🌟 伝説の装備" },
];

// 必要な素材とゴールドを，持っている数と並べて表示する
function Cost({
  gold,
  materials,
  ownedGold,
  ownedMaterials,
}: {
  gold: number;
  materials: MaterialCost[];
  ownedGold: number;
  ownedMaterials: Partial<Record<MaterialId, number>>;
}) {
  return (
    <ul className="flex flex-wrap gap-1.5 text-xs">
      {materials.map(({ id, quantity }) => {
        const have = ownedMaterials[id] ?? 0;

        return (
          <li
            key={id}
            className={`rounded-lg border px-2 py-0.5 ${
              have >= quantity
                ? "border-slate-700 text-slate-200"
                : "border-red-500/50 text-red-300"
            } ${MATERIAL_CATALOG[id].isRare ? "bg-violet-400/10" : ""}`}
          >
            {MATERIAL_CATALOG[id].icon} {MATERIAL_CATALOG[id].name} {have}/{quantity}
          </li>
        );
      })}
      <li
        className={`rounded-lg border px-2 py-0.5 ${
          ownedGold >= gold
            ? "border-amber-300/40 text-amber-200"
            : "border-red-500/50 text-red-300"
        }`}
      >
        💰 {gold} G
      </li>
    </ul>
  );
}

function canAfford(
  cost: { gold: number; materials: MaterialCost[] },
  gold: number,
  materials: Partial<Record<MaterialId, number>>,
) {
  return (
    gold >= cost.gold &&
    cost.materials.every(({ id, quantity }) => (materials[id] ?? 0) >= quantity)
  );
}

// 有効なボスの表示
function EffectiveAgainst({ gearId }: { gearId: GearId }) {
  const target = GEAR_CATALOG[gearId].effectiveAgainst;

  if (!target) {
    return null;
  }

  return (
    <p className="flex items-center gap-1 text-xs text-emerald-300">
      <BossSprite bossId={target} className="h-6 w-6" />
      {BOSS_CATALOG[target].name}に有効
    </p>
  );
}

/*
 * 工房．ボスの素材とゴールドで武器・防具を作り，強化し，キャラクターに付ける．
 */
export function WorkshopView({
  characters,
  owned,
  materials,
  gold,
}: {
  characters: WorkshopCharacter[];
  owned: OwnedGear[];
  materials: Partial<Record<MaterialId, number>>;
  gold: number;
}) {
  const [tab, setTab] = useState<Tab>("weapon");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { shownGear, equip, message: equipMessage } = useGearEquip(owned);

  const run = (key: string, action: () => Promise<{ ok: boolean; message: string }>) => {
    setMessage(null);
    setPendingKey(key);
    startTransition(async () => {
      const result = await action();
      setMessage({ ok: result.ok, text: result.message });
      setPendingKey(null);
    });
  };

  const recipes = GEAR_IDS.filter((id) => {
    const gear = GEAR_CATALOG[id];

    return tab === "legendary" ? gear.isLegendary : !gear.isLegendary && gear.slot === tab;
  });

  const notice = message ?? (equipMessage ? { ok: false, text: equipMessage } : null);

  return (
    <div className="space-y-8">
      {notice && (
        <p
          role="status"
          className={`sticky top-4 z-20 rounded-xl border px-4 py-2 text-sm font-semibold shadow-lg ${
            notice.ok
              ? "border-emerald-400/40 bg-emerald-950/90 text-emerald-200"
              : "border-red-400/40 bg-red-950/90 text-red-200"
          }`}
        >
          {notice.text}
        </p>
      )}

      {/* 持っている装備 */}
      <section aria-labelledby="owned-gear">
        <h2 id="owned-gear" className="mb-3 text-lg font-black text-white">
          持っている装備
        </h2>
        {shownGear.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            まだ装備を持っていません．
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {shownGear.map((item) => {
              const gear = GEAR_CATALOG[item.gearId];
              const nextLevel = item.level + 1;
              const cost = getUpgradeCost(item.gearId, nextLevel);
              const key = `upgrade-${item.rowId}`;

              return (
                <li
                  key={item.rowId}
                  className={`flex gap-3 rounded-2xl border p-3 ${
                    gear.isLegendary
                      ? "border-amber-300/50 bg-amber-300/5"
                      : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <GearIcon gearId={item.gearId} className="h-14 w-14 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-bold text-white">
                      {gear.name}
                      {item.level > 0 && (
                        <span className="ml-1 text-amber-300">+{item.level}</span>
                      )}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {GEAR_SLOT_LABELS[gear.slot]}
                      </span>
                    </p>
                    <p className="text-xs text-slate-300">
                      {describeGearStats(item.gearId, item.level, STAT_LABELS)}
                    </p>
                    <EffectiveAgainst gearId={item.gearId} />

                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      付けるキャラクター
                      <select
                        value={item.characterId ?? ""}
                        onChange={(event) => {
                          const characterId = event.target.value;

                          if (characterId) {
                            equip(characterId, gear.slot, item.rowId);
                          } else if (item.characterId) {
                            equip(item.characterId, gear.slot, null);
                          }
                        }}
                        className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100"
                      >
                        <option value="">だれも付けていない</option>
                        {characters.map((character) => (
                          <option key={character.id} value={character.id}>
                            {character.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    {cost ? (
                      <div className="space-y-1.5 rounded-xl bg-slate-950/50 p-2">
                        <p className="text-xs text-slate-400">
                          +{nextLevel} に強化すると：
                          {describeGearStats(item.gearId, nextLevel, STAT_LABELS)}
                        </p>
                        <Cost
                          gold={cost.gold}
                          materials={cost.materials}
                          ownedGold={gold}
                          ownedMaterials={materials}
                        />
                        <button
                          type="button"
                          disabled={pendingKey !== null || !canAfford(cost, gold, materials)}
                          onClick={() => run(key, () => upgradeGearAction(item.rowId))}
                          className="rounded-lg bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                          {pendingKey === key ? "強化しています…" : `+${nextLevel} に強化する`}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-200">
                        最大まで強化済み（+{MAX_GEAR_LEVEL}）
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 作る */}
      <section aria-labelledby="craft-gear">
        <h2 id="craft-gear" className="mb-3 text-lg font-black text-white">
          装備を作る
        </h2>

        <div role="tablist" className="mb-4 flex flex-wrap gap-2">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
                tab === id
                  ? "border-amber-300 bg-amber-300/10 text-amber-100"
                  : "border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((id) => {
            const gear = GEAR_CATALOG[id];
            const affordable = canAfford(gear.recipe, gold, materials);
            const key = `craft-${id}`;
            const count = shownGear.filter((item) => item.gearId === id).length;

            return (
              <li
                key={id}
                className={`flex flex-col gap-2 rounded-2xl border p-3 ${
                  gear.isLegendary
                    ? "border-amber-300/40 bg-gradient-to-br from-amber-300/10 to-violet-500/10"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <div className="flex gap-3">
                  <GearIcon gearId={id} className="h-14 w-14 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{gear.name}</p>
                    <p className="text-xs text-slate-300">
                      {describeGearStats(id, 0, STAT_LABELS)}
                    </p>
                    {count > 0 && (
                      <p className="text-[11px] text-slate-400">{count}個持っています</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400">{gear.description}</p>
                <EffectiveAgainst gearId={id} />
                {gear.sourceBoss && (
                  <p className="flex items-center gap-1 text-[11px] text-slate-400">
                    素材：
                    <BossSprite bossId={gear.sourceBoss} className="h-5 w-5" />
                    {BOSS_CATALOG[gear.sourceBoss].name}
                  </p>
                )}
                <Cost
                  gold={gear.recipe.gold}
                  materials={gear.recipe.materials}
                  ownedGold={gold}
                  ownedMaterials={materials}
                />
                <button
                  type="button"
                  disabled={pendingKey !== null || !affordable}
                  onClick={() => run(key, () => craftGearAction(id))}
                  className="mt-auto rounded-xl bg-amber-300 px-3 py-1.5 text-sm font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {pendingKey === key ? "作っています…" : affordable ? "🔨 作る" : "素材が足りません"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 持ち物（所持金と素材） */}
      <section
        aria-labelledby="workshop-belongings"
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="workshop-belongings" className="text-lg font-black text-white">
            🎒 持ち物
          </h2>
          <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1 text-base font-bold text-amber-200">
            所持金 💰 {gold} G
          </p>
        </div>
        {MATERIAL_IDS.some((id) => materials[id]) ? (
          <ul className="flex flex-wrap gap-2">
            {MATERIAL_IDS.filter((id) => materials[id]).map((id) => (
              <li
                key={id}
                className={`rounded-xl border px-3 py-1.5 text-sm ${
                  MATERIAL_CATALOG[id].isRare
                    ? "border-violet-400/50 bg-violet-400/10 text-violet-100"
                    : "border-slate-700 bg-slate-900/60 text-slate-200"
                }`}
              >
                {MATERIAL_CATALOG[id].icon} {MATERIAL_CATALOG[id].name} ×{materials[id]}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            まだ素材を持っていません．ボス戦で勝つと手に入ります．
          </p>
        )}
      </section>
    </div>
  );
}
