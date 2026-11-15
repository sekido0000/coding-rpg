"use client";

import { CharacterCard } from "@/components/characters/character-card";
import { CharacterSetupForm } from "@/components/characters/character-setup-form";
import { useRealtimeCharacters } from "@/components/characters/use-realtime-characters";
import { PendingLink } from "@/components/ui/pending-link";
import type { RepositoryAwaitingCharacter } from "@/data/repositories";
import type { Character } from "@/types/character";

type CharacterListProps = {
  characters: Character[];
  pendingRepositories: RepositoryAwaitingCharacter[];
};

/*
 * キャラクター一覧．キャラクターのカードと，
 * まだキャラクターを作っていないリポジトリの作成フォームを並べる．
 * push で経験値が入ると，Realtime でその場で更新される．
 */
export function CharacterList({
  characters: initialCharacters,
  pendingRepositories,
}: CharacterListProps) {
  const characters = useRealtimeCharacters(initialCharacters);
  const repositoryCount =
    characters.length + pendingRepositories.length;

  return (
    <section>
      <p className="mb-5 text-sm text-slate-400">
        連携リポジトリ：{repositoryCount}件
      </p>

      {repositoryCount > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {pendingRepositories.map((repository) => (
            <div key={repository.id} className="md:col-span-2">
              <CharacterSetupForm
                repositoryId={repository.id}
                repositoryName={`${repository.owner}/${repository.name}`}
                returnTo="/characters"
              />
            </div>
          ))}

          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          <p>リポジトリがまだ登録されていません．</p>

          <p className="mt-2 text-sm">
            右上の「リポジトリの追加・連携解除」から，
            育てたいリポジトリを選びましょう．
          </p>

          <PendingLink
            href="/how-to-use"
            className="mt-5 inline-flex rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-400/20"
          >
            使い方を見る
          </PendingLink>
        </div>
      )}
    </section>
  );
}
