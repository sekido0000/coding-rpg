"use client";

import { useOptimistic, useState, useTransition } from "react";

import { equipGearAction } from "@/app/actions/gear-actions";
import type { GearSlot } from "@/lib/battle/gear";
import { equipLocally, type OwnedGear } from "@/lib/battle/owned-gear";

type EquipChange = {
  characterId: string;
  slot: GearSlot;
  rowId: string | null;
};

/*
 * 武器・防具の付け替え．押した瞬間に表示を切り替え（楽観的更新），保存は裏で行う．
 * 保存に失敗した時は，元に戻ってお知らせを出す．
 */
export function useGearEquip(owned: OwnedGear[]) {
  const [shownGear, applyChange] = useOptimistic(
    owned,
    (current, change: EquipChange) =>
      equipLocally(current, change.characterId, change.slot, change.rowId),
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const equip = (characterId: string, slot: GearSlot, rowId: string | null) => {
    setMessage("");
    startTransition(async () => {
      applyChange({ characterId, slot, rowId });
      const result = await equipGearAction(characterId, slot, rowId);

      if (!result.ok) {
        setMessage(result.message);
      }
    });
  };

  return { shownGear, equip, isPending, message };
}
