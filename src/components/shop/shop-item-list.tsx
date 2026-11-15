import { AuraEffect } from "@/components/items/aura-effect";
import { CompanionSprite } from "@/components/items/companion-sprite";
import { PurchaseButton } from "@/components/shop/purchase-button";
import type { Inventory } from "@/data/inventory";
import {
  ITEM_CATALOG,
  ITEM_IDS,
  ITEM_SLOT_LABELS,
  type ItemSlot,
} from "@/lib/items/catalog";

const SLOT_DESCRIPTIONS: Record<ItemSlot, string> = {
  companion: "キャラクターの横をついて歩く仲間",
  aura: "キャラクターの足元に出る光",
};

const SLOTS: ItemSlot[] = ["companion", "aura"];

type ShopItemListProps = {
  inventory: Inventory;
  // compact：ワールドの雑貨店の中など，狭い場所に並べる時
  compact?: boolean;
};

/*
 * 雑貨店の品物の一覧と，買うボタン．
 * 雑貨店のページと，ワールドの雑貨店の中の両方で使う．
 */
export function ShopItemList({
  inventory,
  compact = false,
}: ShopItemListProps) {
  return (
    <div className={compact ? "space-y-6" : "space-y-10"}>
      {SLOTS.map((slot) => (
        <section key={slot} aria-labelledby={`shop-${slot}`}>
          <h2
            id={`shop-${slot}`}
            className={`font-bold text-white ${compact ? "text-base" : "text-xl"}`}
          >
            {ITEM_SLOT_LABELS[slot]}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {SLOT_DESCRIPTIONS[slot]}
          </p>

          <ul
            className={`mt-3 grid gap-3 ${
              compact
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            }`}
          >
            {ITEM_IDS.filter((id) => ITEM_CATALOG[id].slot === slot).map(
              (id) => {
                const item = ITEM_CATALOG[id];
                const owned = inventory.items[id];

                return (
                  <li
                    key={id}
                    className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-3"
                  >
                    {/* 見本 */}
                    <div
                      className={`grid place-items-center rounded-xl bg-gradient-to-b from-emerald-950/60 to-slate-950 ${
                        compact ? "h-20" : "h-28"
                      }`}
                    >
                      {slot === "companion" ? (
                        <CompanionSprite
                          itemId={id}
                          className={`drop-shadow-[0_6px_4px_rgba(0,0,0,0.45)] ${
                            compact ? "h-14 w-14" : "h-20 w-20"
                          }`}
                        />
                      ) : (
                        <span
                          className={`relative block ${
                            compact ? "h-16 w-16" : "h-24 w-24"
                          }`}
                        >
                          <AuraEffect itemId={id} />
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-bold text-white">{item.name}</h3>
                    <p className="mt-1 flex-1 text-xs leading-5 text-slate-400">
                      {item.description}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {owned
                        ? `持っている数 ${owned.quantity}（付けている数 ${owned.equippedCharacterIds.length}）`
                        : "まだ持っていません"}
                    </p>

                    <div className="mt-2">
                      <PurchaseButton
                        itemId={id}
                        price={item.price}
                        canAfford={inventory.gold >= item.price}
                      />
                    </div>
                  </li>
                );
              },
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
