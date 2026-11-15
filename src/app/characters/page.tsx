import { CharacterList } from "@/components/characters/character-list";
import { AppLogo } from "@/components/layout/app-logo";
import { PendingLink } from "@/components/ui/pending-link";
import { RedirectLink } from "@/components/ui/redirect-link";
import { getCharacters } from "@/data/characters";
import { getRepositoriesAwaitingCharacter } from "@/data/repositories";

export const dynamic = "force-dynamic";

/*
 * キャラクター一覧．経験値や進化の道のりをカードで確かめたり，
 * リポジトリの追加・連携解除をしたりする．
 */
export default async function CharactersPage() {
  const [characters, pendingRepositories] = await Promise.all([
    getCharacters(),
    getRepositoriesAwaitingCharacter(),
  ]);

  /*
   * 作成待ちのリポジトリがキャラクター作成済みに変わった時は，
   * Realtime 用の状態も最新のデータで作り直す．
   */
  const listKey = [
    ...characters.map((character) => `character:${character.id}`),
    ...pendingRepositories.map(
      (repository) => `pending:${repository.id}`,
    ),
  ]
    .sort()
    .join("|");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />

          <div className="flex flex-wrap items-center gap-3">
            <RedirectLink
              href="/github/install"
              pendingText="GitHubへ移動中..."
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              リポジトリの追加・連携解除
            </RedirectLink>

            <PendingLink
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              ワールドへ戻る
            </PendingLink>
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-black text-white">
          👥 キャラクター一覧
        </h1>

        <CharacterList
          key={listKey}
          characters={characters}
          pendingRepositories={pendingRepositories}
        />
      </div>
    </main>
  );
}
