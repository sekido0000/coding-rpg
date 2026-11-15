import { LandingPage } from "@/components/landing/landing-page";
import { getCharacters } from "@/data/characters";
import { getRepositoriesAwaitingCharacter } from "@/data/repositories";
import { getWorldActivity } from "@/data/world-activity";
import { getWeeklyQuestBoard } from "@/data/quests";
import { QuestBoard } from "@/components/quests/quest-board";
import { QuestPanel } from "@/components/quests/quest-panel";
import { TitleBadge } from "@/components/titles/title-badge";
import { WorldHome } from "@/components/world/world-home";
import { getSelectedTitle } from "@/data/titles";
import { getInventory } from "@/data/inventory";
import { signOutAction } from "@/app/actions/auth-actions";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PendingLink } from "@/components/ui/pending-link";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

// 上の帯のボタン．スマホでは文字を隠してアイコンだけにする
function HudLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <PendingLink
      href={href}
      spinnerOnly
      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/10"
    >
      <span aria-hidden="true">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </PendingLink>
  );
}

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
  ] = await Promise.all([
    getCharacters(),
    getRepositoriesAwaitingCharacter(),
    getWorldActivity(),
    getWeeklyQuestBoard(),
    getSelectedTitle(),
    getInventory(),
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
      <header className="relative z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 bg-slate-950/90 px-3 py-2 backdrop-blur sm:px-5">
        <Link
          href="/"
          aria-label="Coding RPG"
          className="shrink-0"
        >
          <Image
            src="/images/logo.png"
            alt="Coding RPG"
            width={1518}
            height={347}
            className="h-7 w-auto sm:h-8"
            priority
          />
        </Link>

        {/* 称号と名前 */}
        <div className="flex min-w-0 items-center gap-2">
          {selectedTitle && (
            <TitleBadge
              name={selectedTitle.name}
              rank={selectedTitle.rank}
              size="sm"
            />
          )}
          <p className="max-w-32 truncate text-sm font-semibold text-white">
            {githubName}
          </p>
        </div>

        <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-200">
          <span className="mr-1 text-xs font-semibold text-amber-200/80">所持金</span>
          💰 {questBoard.gold} G
        </p>

        <nav
          aria-label="メニュー"
          className="ml-auto flex flex-wrap items-center gap-2"
        >
          <QuestPanel hasPendingRewards={questBoard.hasPendingRewards}>
            <QuestBoard board={questBoard} />
          </QuestPanel>
          <HudLink href="/characters" icon="👥" label="キャラクター" />
          <HudLink href="/shop" icon="🏪" label="雑貨店" />
          <HudLink href="/titles" icon="🏅" label="称号" />
          <HudLink href="/how-to-use" icon="❔" label="使い方" />

          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </nav>
      </header>

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
        />
      </div>
    </main>
  );
}
