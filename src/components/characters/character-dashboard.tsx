"use client";

import { useEffect, useState } from "react";
import { PendingLink } from "@/components/ui/pending-link";
import { CharacterCard } from "@/components/characters/character-card";
import { CharacterSetupForm } from "@/components/characters/character-setup-form";
import type { RepositoryAwaitingCharacter } from "@/data/repositories";
import type { Character } from "@/types/character";
import { createClient } from "@/lib/supabase/client";

type CharacterDashboardProps = {
  characters: Character[];
  pendingRepositories: RepositoryAwaitingCharacter[];
};

type CharacterRealtimeRecord = {
  id: string;
  repository_id: string;
  name: string;
  personality: "cheerful" | "calm" | "serious";
  character_type: Character["characterType"];
  level: number;
  current_xp: number;
  required_xp: number;
  latest_activity: string;
};

export function CharacterDashboard({
  characters: initialCharacters,
  pendingRepositories,
}: CharacterDashboardProps) {
  const [characters, setCharacters] =
    useState<Character[]>(initialCharacters);

  const repositoryCount =
    characters.length +
    pendingRepositories.length;

  useEffect(() => {
  const supabase = createClient();

  async function setupRealtime() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      supabase.realtime.setAuth(
        session.access_token
      );
    }

    const channel = supabase
      .channel("character-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "characters",
        },
        (payload) => {
  const updated =
    payload.new as CharacterRealtimeRecord;

  setCharacters((current) =>
    current.map((character) =>
      character.id === updated.id
        ? {
            ...character,
            name: updated.name,
            personality: updated.personality,
            characterType: updated.character_type,
            level: updated.level,
            currentXp: updated.current_xp,
            requiredXp: updated.required_xp,
            latestActivity: updated.latest_activity,
          }
        : character
    )
  );
}
    );

    return () => {
      supabase.removeChannel(channel);
    };
  }

    setupRealtime();
  }, []);

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">
          あなたのリポジトリ
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          連携リポジトリ：{repositoryCount}件
        </p>
      </div>

      {repositoryCount > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {pendingRepositories.map(
            (repository) => (
              <div
                key={repository.id}
                className="md:col-span-2"
              >
                <CharacterSetupForm
                  repositoryId={
                    repository.id
                  }
                  repositoryName={
                    `${repository.owner}/${repository.name}`
                  }
                  returnTo="/"
                />
              </div>
            ),
          )}

          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          <p>
            リポジトリがまだ登録されていません．
          </p>

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
