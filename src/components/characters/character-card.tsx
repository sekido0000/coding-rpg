import Image from "next/image";
import { PendingLink } from "@/components/ui/pending-link";

import { EvolutionRoadmap } from "@/components/characters/evolution-roadmap";
import { DeleteRepositoryButton } from "@/components/repositories/delete-repository-button";
import {
  CHARACTER_CATALOG,
  getCharacterEvolution,
  getNextCharacterEvolution,
} from "@/lib/characters/catalog";
import type { Character } from "@/types/character";

type CharacterCardProps = {
  character: Character;
};

const personalityLabels: Record<
  Character["personality"],
  string
> = {
  cheerful: "元気",
  calm: "冷静",
  serious: "まじめ",
};

export function CharacterCard({
  character,
}: CharacterCardProps) {
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
      ? Math.round(
          (
            character.currentXp /
            character.requiredXp
          ) * 100,
        )
      : 0;

  const normalizedXpPercentage =
    Math.min(
      100,
      Math.max(0, xpPercentage),
    );

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-xl">
      <div className="relative flex justify-center bg-gradient-to-b from-emerald-950 to-slate-900 px-6 py-8">
        <div className="absolute left-5 top-5 rounded-full border border-emerald-400/30 bg-slate-950/70 px-3 py-1 text-xs text-emerald-300 backdrop-blur">
          {definition.name}
        </div>

        <Image
          src={evolution.imagePath}
          alt={`${character.name}の${evolution.name}`}
          width={220}
          height={220}
          priority
          className="h-52 w-52"
        />
      </div>

      <div className="space-y-5 p-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-emerald-400">
                {character.repositoryOwner}/
                {character.repositoryName}
              </p>

              <h2 className="mt-1 text-2xl font-bold text-white">
                {character.name}
              </h2>

              <p className="mt-1 text-sm font-medium text-emerald-300">
                {evolution.name}
              </p>
            </div>

            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
              Lv. {character.level}
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            {evolution.description}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            性格：
            {personalityLabels[
              character.personality
            ]}
          </p>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-slate-300">
              経験値
            </span>

            <span className="text-slate-400">
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
            className="h-3 overflow-hidden rounded-full bg-slate-700"
          >
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{
                width:
                  `${normalizedXpPercentage}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {nextEvolution
              ? `次の進化：Lv.${nextEvolution.level} ${nextEvolution.name}`
              : "現在の最終進化形です"}
          </p>
        </div>

        <EvolutionRoadmap
          characterType={
            character.characterType
          }
          level={character.level}
        />

        <div className="rounded-2xl bg-slate-800 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recent activity
          </p>

          <p className="mt-2 text-sm text-slate-200">
            {character.latestActivity}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <PendingLink
            href={`/repositories/${character.repositoryId}`}
            className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-100"
          >
            詳細情報
          </PendingLink>

          <DeleteRepositoryButton
            repositoryId={
              character.repositoryId
            }
            repositoryName={
              `${character.repositoryOwner}/${character.repositoryName}`
            }
          />
        </div>
      </div>
    </article>
  );
}
