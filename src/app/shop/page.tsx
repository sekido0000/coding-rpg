import { AppLogo } from "@/components/layout/app-logo";
import { ShopItemList } from "@/components/shop/shop-item-list";
import { PendingLink } from "@/components/ui/pending-link";
import { getInventory } from "@/data/inventory";

export const dynamic = "force-dynamic";

/*
 * 雑貨店．クエストで集めたゴールドで装備を買う．
 * 1個買うと1体に付けられる．付けるのはキャラクターの詳細ページで行う．
 * ワールドの雑貨店の建物の中でも，同じ品物を買える．
 */
export default async function ShopPage() {
  const inventory = await getInventory();

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
            <h1 className="text-3xl font-black text-white">🏪 雑貨店</h1>
            <p className="mt-2 text-sm text-slate-400">
              クエストで集めたゴールドで装備を買えます．1個買うと1体に付けられます．
              付けるのは，キャラクターの詳細ページの「装備」からです．
            </p>
          </div>

          <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 text-lg font-bold text-amber-200">
            💰 {inventory.gold} G
          </p>
        </div>

        <ShopItemList inventory={inventory} />
      </div>
    </main>
  );
}
