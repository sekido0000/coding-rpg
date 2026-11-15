"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { PendingLink } from "@/components/ui/pending-link";
import { CharacterCard } from "@/components/characters/character-card";
import { CharacterSetupForm } from "@/components/characters/character-setup-form";
import { RepositoryWorld } from "@/components/world/repository-world";
import type { RepositoryAwaitingCharacter } from "@/data/repositories";
import type { ActivitySummary } from "@/lib/world/activity";
import type {
  Character,
  CharacterPersonality,
} from "@/types/character";
import { createClient } from "@/lib/supabase/client";
import { toItemId } from "@/lib/items/catalog";

type CharacterDashboardProps = {
  characters: Character[];
  pendingRepositories: RepositoryAwaitingCharacter[];
  worldActivity: Record<string, ActivitySummary>;
  // 今週のクエスト（サーバーで作った表示を受け取る）
  questBoard: ReactNode;
};

/*
 * push でキャラクターが更新されてから，画面のデータを読み直すまでの時間（ミリ秒）．
 * クエストの報酬は経験値のあとに書き込まれるので，少し待ってから読み直す．
 */
const REFRESH_DELAY = 3000;

type CharacterRealtimeRecord = {
  id: string;
  repository_id: string;
  name: string;
  personality: CharacterPersonality;
  character_type: Character["characterType"];
  level: number;
  current_xp: number;
  required_xp: number;
  latest_activity: string;
  companion_item: string | null;
  aura_item: string | null;
};

export function CharacterDashboard({
  characters: initialCharacters,
  pendingRepositories,
  worldActivity,
  questBoard,
}: CharacterDashboardProps) {
  const router = useRouter();
  const [characters, setCharacters] =
    useState<Character[]>(initialCharacters);

  const repositoryCount =
    characters.length +
    pendingRepositories.length;

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    // 準備の途中で画面を離れた時に，チャンネルを作らないようにする
    let isClosed = false;

    // 続けて更新が届いた時は，最後の更新から待って1回だけ読み直す
    let refreshTimer: number | undefined;

    async function setupRealtime() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isClosed) {
        return;
      }

      // 本人のキャラクターだけが届くよう，RLSにログイン情報を渡す
      if (session) {
        supabase.realtime.setAuth(
          session.access_token,
        );
      }

      channel = supabase
        .channel("character-updates")
        .on<CharacterRealtimeRecord>(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "characters",
          },
          (payload) => {
            const updated = payload.new;

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
                      companionItem: toItemId(
                        updated.companion_item,
                        "companion",
                      ),
                      auraItem: toItemId(updated.aura_item, "aura"),
                    }
                  : character,
              ),
            );

            // クエストの進み具合とゴールドを読み直す
            window.clearTimeout(refreshTimer);
            refreshTimer = window.setTimeout(
              () => router.refresh(),
              REFRESH_DELAY,
            );
          },
        )
        // subscribeを呼んで，はじめて変更が届くようになる
        .subscribe();
    }

    setupRealtime();

    return () => {
      isClosed = true;
      window.clearTimeout(refreshTimer);

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  return (
    <section>
      {characters.length > 0 && (
        <>
          <RepositoryWorld
            characters={characters}
            activity={worldActivity}
          />

          {questBoard}
        </>
      )}

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
