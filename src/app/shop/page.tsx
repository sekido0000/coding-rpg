import { AppLogo } from "@/components/layout/app-logo";
import { PendingLink } from "@/components/ui/pending-link";
import { AuraEffect } from "@/components/items/aura-effect";
import { CompanionSprite } from "@/components/items/companion-sprite";
import { PurchaseButton } from "@/components/shop/purchase-button";
import { getInventory } from "@/data/inventory";
import {
  ITEM_CATALOG,
  ITEM_IDS,
  ITEM_SLOT_LABELS,
  type ItemSlot,
} from "@/lib/items/catalog";

export const dynamic = "force-dynamic";

const SLOT_DESCRIPTIONS: Record<ItemSlot, string> = {
  companion: "キャラクターの横をついて歩く仲間",
  aura: "キャラクターの足元に出る光",
};

/*
 * お店．クエストで集めたゴールドで装備を買う．
 * 1個買うと1体に付けられる．付けるのはキャラクターの詳細ページで行う．
 */
export default async function ShopPage() {
  const inventory = await getInventory();
  const slots: ItemSlot[] = ["companion", "aura"];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />

          <PendingLink
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            ワールドへ戻る
          </PendingLink>
        </div>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">
              🏪 お店
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              クエストで集めたゴールドで装備を買えます．1個買うと1体に付けられます．
              付けるのは，キャラクターの詳細ページの「装備」からです．
            </p>
          </div>

          <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 text-lg font-bold text-amber-200">
            💰 {inventory.gold} G
          </p>
        </div>

        <div className="space-y-10">
          {slots.map((slot) => (
            <section key={slot} aria-labelledby={`shop-${slot}`}>
              <h2
                id={`shop-${slot}`}
                className="text-xl font-bold text-white"
              >
                {ITEM_SLOT_LABELS[slot]}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {SLOT_DESCRIPTIONS[slot]}
              </p>

              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {ITEM_IDS.filter(
                  (id) => ITEM_CATALOG[id].slot === slot,
                ).map((id) => {
                  const item = ITEM_CATALOG[id];
                  const owned = inventory.items[id];

                  return (
                    <li
                      key={id}
                      className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                    >
                      {/* 見本 */}
                      <div className="grid h-28 place-items-center rounded-xl bg-gradient-to-b from-emerald-950/60 to-slate-950">
                        {slot === "companion" ? (
                          <CompanionSprite
                            itemId={id}
                            className="h-20 w-20 drop-shadow-[0_6px_4px_rgba(0,0,0,0.45)]"
                          />
                        ) : (
                          <span className="relative block h-24 w-24">
                            <AuraEffect itemId={id} />
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 font-bold text-white">
                        {item.name}
                      </h3>
                      <p className="mt-1 flex-1 text-xs leading-5 text-slate-400">
                        {item.description}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        {owned
                          ? `持っている数 ${owned.quantity}（付けている数 ${owned.equippedCharacterIds.length}）`
                          : "まだ持っていません"}
                      </p>

                      <div className="mt-3">
                        <PurchaseButton
                          itemId={id}
                          price={item.price}
                          canAfford={inventory.gold >= item.price}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
