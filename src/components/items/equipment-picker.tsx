"use client";

import { equipItemAction } from "@/app/actions/shop-actions";
import { useEquipmentState } from "@/components/items/equipment-state";
import { AuraEffect } from "@/components/items/aura-effect";
import { CompanionSprite } from "@/components/items/companion-sprite";
import { PendingLink } from "@/components/ui/pending-link";
import type { Inventory } from "@/data/inventory";
import {
  ITEM_CATALOG,
  ITEM_IDS,
  ITEM_SLOT_LABELS,
  type ItemId,
  type ItemSlot,
} from "@/lib/items/catalog";
import type { Character } from "@/types/character";

type EquipmentPickerProps = {
  character: Character;
  inventory: Inventory;
};

// 装備の小さな見本
export function ItemPreview({ itemId }: { itemId: ItemId }) {
  return ITEM_CATALOG[itemId].slot === "companion" ? (
    <CompanionSprite itemId={itemId} className="h-8 w-8" />
  ) : (
    <span className="relative block h-8 w-8">
      <AuraEffect itemId={itemId} />
    </span>
  );
}

function ChoiceButton({
  isSelected,
  isDisabled,
  children,
}: {
  isSelected: boolean;
  isDisabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={isDisabled || isSelected}
      aria-pressed={isSelected}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition disabled:cursor-not-allowed ${
        isSelected
          ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/40 hover:bg-white/10 disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

/*
 * 装備を付け替えるフォーム．
 * 押した瞬間に表示を切り替え（楽観的更新），保存は裏で行う．
 * 保存に失敗した時は，処理が終わると自動で元の表示に戻る．
 */
function EquipForm({
  character,
  slot,
  itemId,
  children,
}: {
  character: Character;
  slot: ItemSlot;
  itemId: ItemId | null;
  children: React.ReactNode;
}) {
  const { setOptimisticEquipment } = useEquipmentState();

  async function equip(formData: FormData) {
    setOptimisticEquipment(slot, itemId);

    try {
      await equipItemAction(formData);
    } catch (error) {
      console.error("Failed to equip item:", error);
    }
  }

  return (
    <form action={equip}>
      <input type="hidden" name="characterId" value={character.id} />
      <input
        type="hidden"
        name="repositoryId"
        value={character.repositoryId}
      />
      <input type="hidden" name="slot" value={slot} />
      <input type="hidden" name="itemId" value={itemId ?? ""} />
      {children}
    </form>
  );
}

/*
 * キャラクターの詳細ページで，装備を付け替える．
 * 持っている装備だけを並べる．持っている個数だけ，
 * ほかのキャラクターが付けている時は選べない．
 */
export function EquipmentPicker({
  character,
  inventory,
}: EquipmentPickerProps) {
  const slots: ItemSlot[] = ["companion", "aura"];
  // 付け替えた瞬間の表示（楽観的更新）を使う
  const { equipment: current } = useEquipmentState();

  const hasItems = Object.keys(inventory.items).length > 0;

  return (
    <section
      aria-labelledby="equipment-heading"
      className="repo-panel mt-5 p-6"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="repo-kicker">Equipment</p>
          <h2
            id="equipment-heading"
            className="mt-1 text-lg font-bold text-white"
          >
            装備
          </h2>
        </div>

        <PendingLink
          href="/shop"
          className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-300/20"
        >
          🏪 お店へ（💰 {inventory.gold} G）
        </PendingLink>
      </div>

      {!hasItems ? (
        <p className="text-sm text-slate-400">
          クエストでゴールドを集めて，お店で装備を買うと，ここで付けられます．
        </p>
      ) : (
        <div className="space-y-5">
          {slots.map((slot) => {
            const ownedIds = ITEM_IDS.filter(
              (id) =>
                ITEM_CATALOG[id].slot === slot &&
                inventory.items[id],
            );

            return (
              <div key={slot}>
                <h3 className="mb-2 text-sm font-bold text-slate-300">
                  {ITEM_SLOT_LABELS[slot]}
                </h3>

                {ownedIds.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    まだ持っていません
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <EquipForm
                      character={character}
                      slot={slot}
                      itemId={null}
                    >
                      <ChoiceButton
                        isSelected={current[slot] === null}
                        isDisabled={false}
                      >
                        なし
                      </ChoiceButton>
                    </EquipForm>

                    {ownedIds.map((id) => {
                      const owned = inventory.items[id]!;
                      const usedByOthers =
                        owned.equippedCharacterIds.filter(
                          (characterId) =>
                            characterId !== character.id,
                        ).length;
                      const left = owned.quantity - usedByOthers;

                      return (
                        <EquipForm
                          key={id}
                          character={character}
                          slot={slot}
                          itemId={id}
                        >
                          <ChoiceButton
                            isSelected={current[slot] === id}
                            isDisabled={left <= 0}
                          >
                            <ItemPreview itemId={id} />
                            <span className="text-left">
                              <span className="block font-semibold">
                                {ITEM_CATALOG[id].name}
                              </span>
                              <span className="block text-xs text-slate-400">
                                {left > 0
                                  ? `付けられる数 ${left} / ${owned.quantity}`
                                  : "ほかのキャラが使用中"}
                              </span>
                            </span>
                          </ChoiceButton>
                        </EquipForm>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
