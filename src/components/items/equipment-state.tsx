"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  type ReactNode,
} from "react";

import { EquipmentLayers } from "@/components/items/equipment-layers";
import type { ItemId, ItemSlot } from "@/lib/items/catalog";

type Equipment = Record<ItemSlot, ItemId | null>;

type EquipmentState = {
  equipment: Equipment;
  // 付け替えた瞬間に表示を切り替える（フォームの処理の中で呼ぶ）
  setOptimisticEquipment: (slot: ItemSlot, itemId: ItemId | null) => void;
};

const EquipmentContext = createContext<EquipmentState | null>(null);

/*
 * キャラクターの詳細ページで，付けている装備を共有する．
 *
 * 付け替えを押した瞬間に，上のキャラクターの絵と下の装備の欄を
 * 両方とも切り替える（楽観的更新）．保存は裏で行い，
 * 失敗した時は元の表示に戻る．
 */
export function EquipmentStateProvider({
  companionItem,
  auraItem,
  children,
}: {
  companionItem: ItemId | null;
  auraItem: ItemId | null;
  children: ReactNode;
}) {
  const [equipment, setEquipment] = useOptimistic<
    Equipment,
    { slot: ItemSlot; itemId: ItemId | null }
  >(
    { companion: companionItem, aura: auraItem },
    (current, { slot, itemId }) => ({ ...current, [slot]: itemId }),
  );

  return (
    <EquipmentContext.Provider
      value={{
        equipment,
        setOptimisticEquipment: (slot, itemId) =>
          setEquipment({ slot, itemId }),
      }}
    >
      {children}
    </EquipmentContext.Provider>
  );
}

export function useEquipmentState() {
  const state = useContext(EquipmentContext);

  if (!state) {
    throw new Error(
      "EquipmentStateProvider の中で使ってください",
    );
  }

  return state;
}

// 共有している装備をキャラクターの絵に重ねる
export function OptimisticEquipmentLayers({
  children,
}: {
  children: ReactNode;
}) {
  const { equipment } = useEquipmentState();

  return (
    <EquipmentLayers
      companionItem={equipment.companion}
      auraItem={equipment.aura}
    >
      {children}
    </EquipmentLayers>
  );
}
