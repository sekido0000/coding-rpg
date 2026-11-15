"use client";

import { useRealtimeCharacters } from "@/components/characters/use-realtime-characters";
import { PendingLink } from "@/components/ui/pending-link";
import { RepositoryWorld } from "@/components/world/repository-world";
import type { ActivitySummary } from "@/lib/world/activity";
import type { Character } from "@/types/character";

type WorldHomeProps = {
  characters: Character[];
  worldActivity: Record<string, ActivitySummary>;
};

/*
 * ホームの村．画面いっぱいに表示する．
 * push で経験値が入ると，Realtime でその場でキャラクターが反応する．
 */
export function WorldHome({
  characters: initialCharacters,
  worldActivity,
}: WorldHomeProps) {
  const characters = useRealtimeCharacters(initialCharacters);

  if (characters.length === 0) {
    return (
      <div className="repo-stage grid h-full place-items-center px-6 text-center">
        <div>
          <p className="text-lg font-bold text-white">
            まだ村にキャラクターがいません
          </p>
          <p className="mt-2 text-sm text-slate-400">
            リポジトリを連携してキャラクターを作ると，ここで暮らし始めます．
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <PendingLink
              href="/characters"
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              キャラクター一覧へ
            </PendingLink>
            <PendingLink
              href="/how-to-use"
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-400/20"
            >
              使い方を見る
            </PendingLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RepositoryWorld characters={characters} activity={worldActivity} />
  );
}
