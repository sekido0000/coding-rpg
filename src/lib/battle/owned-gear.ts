/*
 * 持っている武器・防具（DB の1行が1個）．画面とサーバーの両方で使う．
 */

import {
  GEAR_CATALOG,
  type EquippedGear,
  type GearId,
  type GearSlot,
} from "@/lib/battle/gear";

export type OwnedGear = {
  // DB の行の ID（同じ装備を2個持っていても区別できる）
  rowId: string;
  gearId: GearId;
  level: number;
  // 付けているキャラクター（付けていない時は null）
  characterId: string | null;
};

// そのキャラクターが付けている装備（戦いの計算に渡す形）
export function getEquippedGear(
  owned: OwnedGear[],
  characterId: string,
): EquippedGear[] {
  return owned
    .filter((gear) => gear.characterId === characterId)
    .map(({ gearId, level }) => ({ gearId, level }));
}

// そのキャラクターが，その場所（武器・防具）に付けている装備
export function findEquipped(
  owned: OwnedGear[],
  characterId: string,
  slot: GearSlot,
): OwnedGear | null {
  return (
    owned.find(
      (gear) =>
        gear.characterId === characterId &&
        GEAR_CATALOG[gear.gearId].slot === slot,
    ) ?? null
  );
}

/*
 * 付け替えた後の一覧（画面ですぐ切り替えるために使う）．
 * DB の equip_gear と同じく，同じ場所に付けていた装備は外し，
 * 別のキャラクターが付けていた装備はそのキャラクターから移す．
 */
export function equipLocally(
  owned: OwnedGear[],
  characterId: string,
  slot: GearSlot,
  rowId: string | null,
): OwnedGear[] {
  return owned.map((gear) => {
    if (gear.rowId === rowId) {
      return { ...gear, characterId };
    }

    if (
      gear.characterId === characterId &&
      GEAR_CATALOG[gear.gearId].slot === slot
    ) {
      return { ...gear, characterId: null };
    }

    return gear;
  });
}
