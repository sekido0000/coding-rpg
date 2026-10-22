import { CharacterDashboard } from "@/components/characters/character-dashboard";
import { LandingPage } from "@/components/landing/landing-page";
import { AppLogo } from "@/components/layout/app-logo";
import { getCharacters } from "@/data/characters";
import { getRepositoriesAwaitingCharacter } from "@/data/repositories";
import { signOutAction } from "@/app/actions/auth-actions";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PendingLink } from "@/components/ui/pending-link";
import { RedirectLink } from "@/components/ui/redirect-link";

export const dynamic = "force-dynamic";

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
  ] = await Promise.all([
    getCharacters(),
    getRepositoriesAwaitingCharacter(),
  ]);

  const githubName =
    user.user_metadata.user_name ??
    user.user_metadata.name ??
    user.email ??
    "GitHubユーザー";

  /*
   * 保留中リポジトリがキャラクター作成済みに変わった時は、
   * Realtime用のクライアントstateも最新データで作り直す。
   */
  const dashboardKey = [
    ...characters.map(
      (character) =>
        `character:${character.id}`,
    ),
    ...pendingRepositories.map(
      (repository) =>
        `pending:${repository.id}`,
    ),
  ]
    .sort()
    .join("|");

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col py-8">
        <div className="mb-12 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <PendingLink
              href="/how-to-use"
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-400/20"
            >
              使い方
            </PendingLink>

            <RedirectLink
              href="/github/install"
              pendingText="GitHubへ移動中..."
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              リポジトリの追加・連携解除
            </RedirectLink>

            <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 py-1.5 pl-3 pr-1.5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  ログイン中
                </p>
                <p className="max-w-36 truncate text-sm font-semibold text-white">
                  {githubName}
                </p>
              </div>

              <form action={signOutAction}>
                <SignOutButton />
              </form>
            </div>
          </div>
        </div>
        <header className="mb-10">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            コードを書くほど，
            <br />
            リポジトリのキャラが成長する．
          </h1>
        </header>

        <CharacterDashboard
          key={dashboardKey}
          characters={characters}
          pendingRepositories={
            pendingRepositories
          }
        />

        <footer className="mt-auto border-t border-slate-800 pb-2 pt-10 text-center text-sm text-slate-600">
          © 2026 Coding RPG. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
