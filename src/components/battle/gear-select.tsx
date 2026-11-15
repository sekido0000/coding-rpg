"use client";

import { GearIcon } from "@/components/battle/gear-icon";
import {
  GEAR_CATALOG,
  GEAR_SLOT_LABELS,
  type GearSlot,
} from "@/lib/battle/gear";
import { findEquipped, type OwnedGear } from "@/lib/battle/owned-gear";
import type { BossId } from "@/lib/battle/bosses";

/*
 * キャラクターの武器か防具を選ぶ欄．
 * ほかのキャラクターが付けている装備も選べ，選ぶとこのキャラクターへ移る．
 */
export function GearSelect({
  owned,
  characterId,
  slot,
  characterNames,
  onEquip,
  bossId,
  compact = false,
}: {
  owned: OwnedGear[];
  characterId: string;
  slot: GearSlot;
  characterNames: Record<string, string>;
  onEquip: (characterId: string, slot: GearSlot, rowId: string | null) => void;
  // 戦うボス（有効な装備に印を付ける）
  bossId?: BossId;
  compact?: boolean;
}) {
  const equipped = findEquipped(owned, characterId, slot);
  const choices = owned.filter((gear) => GEAR_CATALOG[gear.gearId].slot === slot);
  const isEffective =
    Boolean(bossId) &&
    equipped !== null &&
    GEAR_CATALOG[equipped.gearId].effectiveAgainst === bossId;

  return (
    <label className={`flex items-center gap-1.5 ${compact ? "text-[11px]" : "text-sm"}`}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-800">
        {equipped ? (
          <GearIcon gearId={equipped.gearId} className="h-6 w-6" />
        ) : (
          <span className="text-[10px] text-slate-500">
            {GEAR_SLOT_LABELS[slot]}
          </span>
        )}
      </span>
      <span className="sr-only">{GEAR_SLOT_LABELS[slot]}</span>
      <select
        value={equipped?.rowId ?? ""}
        onChange={(event) =>
          onEquip(characterId, slot, event.target.value || null)
        }
        disabled={choices.length === 0}
        className="min-w-0 flex-1 truncate rounded-md border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100 disabled:text-slate-500"
      >
        <option value="">
          {choices.length === 0
            ? `${GEAR_SLOT_LABELS[slot]}なし（工房で作れます）`
            : `${GEAR_SLOT_LABELS[slot]}を付けない`}
        </option>
        {choices.map((gear) => {
          const owner =
            gear.characterId && gear.characterId !== characterId
              ? characterNames[gear.characterId]
              : null;

          return (
            <option key={gear.rowId} value={gear.rowId}>
              {GEAR_CATALOG[gear.gearId].name}
              {gear.level > 0 ? ` +${gear.level}` : ""}
              {bossId && GEAR_CATALOG[gear.gearId].effectiveAgainst === bossId
                ? " ★有効"
                : ""}
              {owner ? `（${owner}が装備中）` : ""}
            </option>
          );
        })}
      </select>
      {isEffective && (
        <span className="shrink-0 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
          有効！
        </span>
      )}
    </label>
  );
}
