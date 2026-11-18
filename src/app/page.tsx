import { LandingPage } from "@/components/landing/landing-page";
import { getCharacters } from "@/data/characters";
import { getRepositoriesAwaitingCharacter } from "@/data/repositories";
import { getWorldActivity } from "@/data/world-activity";
import { getWeeklyQuestBoard } from "@/data/quests";
import { HomeHeader } from "@/components/layout/home-header";
import { WorldHome } from "@/components/world/world-home";
import { getSelectedTitle } from "@/data/titles";
import { getInventory } from "@/data/inventory";
import { getPlacements } from "@/data/buildings";
import { createClient } from "@/lib/supabase/server";
import { PendingLink } from "@/components/ui/pending-link";

export const dynamic = "force-dynamic";

/*
 * ホーム．ログイン後は，リポジトリワールドを画面いっぱいに表示する．
 * 上の帯に，称号・ゴールドと，各ページやクエストへの入口を置く．
 */
export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // ログイン前はアプリの紹介と使い方を表示する
    return <LandingPage />;
  }

  const [
    characters,
    pendingRepositories,
    worldActivity,
    questBoard,
    selectedTitle,
    inventory,
    placements,
  ] = await Promise.all([
    getCharacters(),
    getRepositoriesAwaitingCharacter(),
    getWorldActivity(),
    getWeeklyQuestBoard(),
    getSelectedTitle(),
    getInventory(),
    getPlacements(),
  ]);

  const githubName =
    user.user_metadata.user_name ??
    user.user_metadata.name ??
    "GitHubユーザー";

  // キャラクターが増えた・減った時は，Realtime 用の状態も作り直す
  const worldKey = characters
    .map((character) => character.id)
    .sort()
    .join("|");

  return (
    <main className="flex h-dvh flex-col bg-slate-950">
      <h1 className="sr-only">Coding RPG リポジトリワールド</h1>

      {/* 上の帯 */}
      <HomeHeader
        githubName={githubName}
        selectedTitle={selectedTitle}
        questBoard={questBoard}
      />

      {/* キャラクターをまだ作っていないリポジトリのお知らせ */}
      {pendingRepositories.length > 0 && (
        <div className="relative z-20 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100">
          <p>
            キャラクターを作っていないリポジトリが {pendingRepositories.length} 件あります
          </p>
          <PendingLink
            href="/characters"
            className="font-bold text-emerald-300 underline-offset-2 hover:underline"
          >
            キャラクターを作る →
          </PendingLink>
        </div>
      )}

      {/* ワールド（残りの高さいっぱい） */}
      <div className="relative min-h-0 flex-1">
        <WorldHome
          key={worldKey}
          characters={characters}
          worldActivity={worldActivity}
          hasPendingRewards={questBoard.hasPendingRewards}
          inventory={inventory}
          placements={placements}
        />
      </div>
    </main>
  );
}
