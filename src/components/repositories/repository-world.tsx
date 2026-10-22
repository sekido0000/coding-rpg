import Image from "next/image";
import { PendingLink } from "@/components/ui/pending-link";

import { DeleteRepositoryButton } from "@/components/repositories/delete-repository-button";
import {
  CHARACTER_CATALOG,
  getCharacterEvolution,
  getNextCharacterEvolution,
} from "@/lib/characters/catalog";
import type { Character } from "@/types/character";
import { GrowthTimeline } from "@/components/repositories/growth-timeline";
import { getGrowthEvents } from "@/lib/growth/events";

type RepositoryWorldProps = {
  character: Character;
  growthEvents: Awaited<
    ReturnType<typeof getGrowthEvents>
  >;
};

export function RepositoryWorld({
  character,
  growthEvents,
}: RepositoryWorldProps) {
  const definition =
    CHARACTER_CATALOG[
      character.characterType
    ];

  const evolution =
    getCharacterEvolution(
      character.characterType,
      character.level,
    );

  const nextEvolution =
    getNextCharacterEvolution(
      character.characterType,
      character.level,
    );

  const xpPercentage =
    character.requiredXp > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (
                character.currentXp /
                character.requiredXp
              ) * 100,
            ),
          ),
        )
      : 0;

  return (
    <main className="repo-world min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1560px]">
        <header className="repo-panel mb-5 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <PendingLink
              href="/"
              aria-label="キャラクター一覧へ戻る"
              spinnerOnly
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-lg text-slate-300 transition hover:border-emerald-400/40 hover:text-white"
            >
              ←
            </PendingLink>

            <div className="min-w-0">
              <p className="repo-kicker">
                Repository world
              </p>
              <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                {character.repositoryOwner}/
                {character.repositoryName}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={character.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/25 hover:bg-white/5"
            >
              GitHubで開く ↗
            </a>
            <DeleteRepositoryButton
              repositoryId={
                character.repositoryId
              }
              repositoryName={
                `${character.repositoryOwner}/${character.repositoryName}`
              }
              compact
            />
          </div>
        </header>

        <div className="grid min-h-[700px] items-stretch auto-rows-fr gap-5 lg:grid-cols-[minmax(420px,1fr)_320px]">
          <section className="repo-stage flex h-[760px] flex-col overflow-hidden rounded-[2rem] border border-emerald-400/15">
            <div className="flex items-start justify-between gap-4 p-6 sm:p-8">
              <div>
                <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                  {definition.name}
                </span>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {character.name}
                </h2>
                <p className="mt-1 text-sm text-emerald-200/70">
                  {evolution.name} ·{" "}
                  {evolution.description}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-300/20 bg-slate-950/50 px-4 py-3 text-center backdrop-blur">
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Level
                </p>
                <p className="text-3xl font-black text-emerald-300">
                  {character.level}
                </p>
              </div>
            </div>

            <div className="relative flex flex-1 items-end justify-center overflow-hidden px-5 pb-7">
              <div className="repo-moon" />
              <div className="repo-stars" />

              <div className="repo-character-walk relative z-10">
                <div className="repo-character-float">
                  <Image
                    src={evolution.imagePath}
                    alt={`${character.name}の${evolution.name}`}
                    width={520}
                    height={520}
                    priority
                    className="repo-pixel-image h-auto w-[min(72vw,430px)] drop-shadow-[0_28px_20px_rgba(0,0,0,0.55)]"
                  />
                </div>
                <div className="repo-character-shadow" />
              </div>

              <div className="repo-ground" />
            </div>

            <div className="relative z-20 border-t border-white/5 bg-slate-950/70 p-5 backdrop-blur sm:p-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-200">
                  次のレベルまで
                </span>
                <span className="font-mono text-emerald-200">
                  {character.currentXp} /{" "}
                  {character.requiredXp} XP
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${character.name}の経験値`}
                aria-valuemin={0}
                aria-valuemax={
                  character.requiredXp
                }
                aria-valuenow={
                  character.currentXp
                }
                className="h-3 overflow-hidden rounded-full bg-slate-800"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 shadow-[0_0_18px_rgba(52,211,153,0.65)] transition-all duration-500"
                  style={{
                    width: `${xpPercentage}%`,
                  }}
                />
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  {nextEvolution
                    ? `Lv.${nextEvolution.level}で「${nextEvolution.name}」に進化`
                    : "最終進化に到達しています"}
                </p>
              </div>
            </div>
          </section>

          <aside className="repo-panel flex h-[760px] flex-col overflow-hidden p-6">
            <div className="shrink-0 flex items-center justify-between">
              <div>
                <p className="repo-kicker">
                  Growth History
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  成長履歴
                </h2>
              </div>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
            </div>

            <div className="min-h-0 flex-1">
              <GrowthTimeline
                growthEvents={growthEvents}
              />
            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}
