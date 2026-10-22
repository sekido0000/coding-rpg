import Image from "next/image";

import {
  CHARACTER_CATALOG,
} from "@/lib/characters/catalog";
import {
  CHARACTER_TYPES,
} from "@/types/character";

export function CharacterCatalog() {
  return (
    <section className="mb-12">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Character Catalog
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          キャラクターと進化形
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          キャラクターはレベルが上がるたびに
          新しい姿へ進化します．
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {CHARACTER_TYPES.map(
          (characterType) => {
            const definition =
              CHARACTER_CATALOG[
                characterType
              ];

            return (
              <article
                key={characterType}
                className="rounded-3xl border border-slate-700 bg-slate-900 p-5"
              >
                <h3 className="font-bold text-white">
                  {definition.name}
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  {definition.description}
                </p>

                <div className="mt-5 grid grid-cols-5 gap-1">
                  {definition.evolutions.map(
                    (evolution) => (
                      <div
                        key={evolution.level}
                        className="rounded-xl bg-slate-800 p-1 text-center"
                      >
                        <Image
                          src={
                            evolution.imagePath
                          }
                          alt={
                            evolution.name
                          }
                          width={64}
                          height={64}
                          className="mx-auto"
                        />

                        <p className="text-[10px] text-slate-400">
                          Lv.
                          {evolution.level}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </article>
            );
          },
        )}
      </div>
    </section>
  );
}