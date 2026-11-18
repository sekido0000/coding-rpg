import { redirect } from "next/navigation";
import { after } from "next/server";

import { AppLogo } from "@/components/layout/app-logo";
import { PendingLink } from "@/components/ui/pending-link";
import { WorkshopView } from "@/components/workshop/workshop-view";
import { getBattleStatus } from "@/data/battle";
import { getCharacters } from "@/data/characters";
import { getOwnedGear } from "@/data/gear";
import { getInventory } from "@/data/inventory";
import { recordUsage } from "@/lib/analytics/record";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/*
 * 工房．ボス戦で集めた素材とゴールドで，武器・防具を作って強化する．
 */
export default async function WorkshopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // アプリの改善のための記録（工房を開いた回数）
  const userId = user.id;
  after(() => recordUsage(userId, "workshop_open"));

  const characters = await getCharacters();
  const [owned, status, inventory] = await Promise.all([
    getOwnedGear(characters.map((character) => character.id)),
    getBattleStatus(),
    getInventory(),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />

          <div className="flex flex-wrap gap-3">
            <PendingLink
              href="/battle"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              ⚔️ ボス戦へ
            </PendingLink>
            <PendingLink
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              ワールドへ戻る
            </PendingLink>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-black text-white">🔨 工房</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            ボス戦で集めた素材とゴールドで，武器と防具を作れます．1個作ると1体に付けられます（武器1つ・防具1つまで）．
            同じボスの素材を足すと +3 まで強化できます．
          </p>
        </div>

        <WorkshopView
          characters={characters.map((character) => ({
            id: character.id,
            name: character.name,
          }))}
          owned={owned}
          materials={status.materials}
          gold={inventory.gold}
        />
      </div>
    </main>
  );
}
