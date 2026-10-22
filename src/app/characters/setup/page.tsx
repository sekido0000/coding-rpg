import { PendingLink } from "@/components/ui/pending-link";
import { RedirectLink } from "@/components/ui/redirect-link";
import { redirect } from "next/navigation";

import { CharacterSetupForm } from "@/components/characters/character-setup-form";
import { AppLogo } from "@/components/layout/app-logo";
import { getRepositoriesAwaitingCharacter } from "@/data/repositories";

export const dynamic = "force-dynamic";

export default async function CharacterSetupPage() {
  const repositories =
    await getRepositoriesAwaitingCharacter();

  if (repositories.length === 0) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />

          <nav className="flex flex-wrap items-center gap-3">
            <RedirectLink
              href="/github/install"
              pendingText="GitHubへ移動中..."
              className="rounded-xl border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10"
            >
              追加を取り消す
            </RedirectLink>

            <PendingLink
              href="/"
              className="px-2 py-2 text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              設定を保留してホームへ
            </PendingLink>
          </nav>
        </div>

        <header className="mb-9 mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
            New repository
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            相棒を選びましょう
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            新しく追加したリポジトリごとに、育てるキャラクターを選択してください。決定後は変更できません。
          </p>

          <div className="mt-5 max-w-2xl rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="text-sm font-semibold text-amber-200">
              キャラクターを選ばず追加を取り消す場合
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              「追加を取り消す」からGitHubの設定画面へ戻り、対象リポジトリのチェックを外して保存してください。「設定を保留してホームへ」を選ぶと、GitHubとの連携は維持されます。
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {repositories.map(
            (repository) => (
              <CharacterSetupForm
                key={repository.id}
                repositoryId={
                  repository.id
                }
                repositoryName={
                  `${repository.owner}/${repository.name}`
                }
              />
            ),
          )}
        </div>
      </div>
    </main>
  );
}
