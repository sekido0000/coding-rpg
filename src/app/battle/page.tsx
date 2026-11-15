import { redirect } from "next/navigation";

import { AppLogo } from "@/components/layout/app-logo";
import { BattleArena } from "@/components/battle/battle-arena";
import { PendingLink } from "@/components/ui/pending-link";
import { getBattleStatus } from "@/data/battle";
import { getCharacters } from "@/data/characters";
import { getOwnedGear } from "@/data/gear";
import { getInventory } from "@/data/inventory";
import { getCharacterEvolution } from "@/lib/characters/catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/*
 * ボス戦．毎週，★1〜★5 に1回ずつ勝つと，ゴールドと素材がもらえる．
 * ボス・★・パーティーを選んで挑むと，サーバーで戦いを計算し，その様子を再生する．
 */
export default async function BattlePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const characters = await getCharacters();
  const [status, inventory, ownedGear] = await Promise.all([
    getBattleStatus(),
    getInventory(),
    getOwnedGear(characters.map((character) => character.id)),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />

          <PendingLink
            href="/"
            className="self-start rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white sm:self-auto"
          >
            ワールドへ戻る
          </PendingLink>
        </div>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">⚔️ ボス戦</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              毎週，★1〜★5 にそれぞれ1回ずつ挑戦できます．勝つと，ゴールドと素材がもらえます．
              好きなボスに挑めて，負けても何度でも挑み直せます．毎週月曜日（日本時間）に新しくなります．
            </p>
          </div>
        </div>

        <BattleArena
          characters={characters.map((character) => ({
            id: character.id,
            name: character.name,
            characterType: character.characterType,
            level: character.level,
            imagePath: getCharacterEvolution(
              character.characterType,
              character.level,
            ).imagePath,
          }))}
          status={status}
          gold={inventory.gold}
          ownedGear={ownedGear}
        />
      </div>
    </main>
  );
}
