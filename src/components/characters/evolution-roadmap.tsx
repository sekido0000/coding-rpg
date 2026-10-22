import Image from "next/image";

import {
  CHARACTER_CATALOG,
  getCharacterEvolution,
} from "@/lib/characters/catalog";
import type { CharacterType } from "@/types/character";

type EvolutionRoadmapProps = {
  characterType: CharacterType;
  level: number;
};

export function EvolutionRoadmap({
  characterType,
  level,
}: EvolutionRoadmapProps) {
  const definition =
    CHARACTER_CATALOG[characterType];

  const currentEvolution =
    getCharacterEvolution(
      characterType,
      level,
    );

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Evolution
      </p>

      <div className="grid grid-cols-5 gap-2">
        {definition.evolutions.map(
          (evolution) => {
            const isCurrent =
              evolution.level ===
              currentEvolution.level;

            const isUnlocked =
              level >= evolution.level;

            return (
              <div
                key={evolution.level}
                className={[
                  "rounded-xl border p-2 text-center",
                  isCurrent
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-slate-700 bg-slate-800",
                  !isUnlocked
                    ? "opacity-35 grayscale"
                    : "",
                ].join(" ")}
              >
                <Image
                  src={evolution.imagePath}
                  alt={evolution.name}
                  width={56}
                  height={56}
                  className="mx-auto h-12 w-12"
                />

                <p className="mt-1 text-xs text-slate-300">
                  Lv.{evolution.level}
                </p>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}