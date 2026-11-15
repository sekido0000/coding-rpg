"use client";

import Image from "next/image";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/ui/spinner";

import { createCharacterAction } from "@/app/actions/character-actions";
import {
  CHARACTER_CATALOG,
} from "@/lib/characters/catalog";
import { CHARACTER_NAME_MAX_LENGTH } from "@/lib/characters/name";
import {
  CHARACTER_PERSONALITIES,
  PERSONALITY_INFO,
  type CharacterPersonality,
} from "@/lib/characters/personality";
import {
  CHARACTER_TYPES,
  type CharacterType,
} from "@/types/character";

type CharacterSetupFormProps = {
  repositoryId: string;
  repositoryName: string;
  returnTo?: "/" | "/characters" | "/characters/setup";
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:bg-emerald-800 disabled:text-emerald-200"
    >
      {pending && <Spinner />}
      {pending
        ? "作成しています..."
        : "このキャラクターに決定"}
    </button>
  );
}

export function CharacterSetupForm({
  repositoryId,
  repositoryName,
  returnTo = "/characters/setup",
}: CharacterSetupFormProps) {
  const [
    characterType,
    setCharacterType,
  ] = useState<CharacterType>(
    CHARACTER_TYPES[0],
  );

  const [
    personality,
    setPersonality,
  ] = useState<CharacterPersonality>(
    CHARACTER_PERSONALITIES[0],
  );

  const definition =
    CHARACTER_CATALOG[characterType];

  const firstEvolution =
    definition.evolutions[0];

  return (
    <form
      action={createCharacterAction}
      className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-xl"
    >
      <input
        type="hidden"
        name="repositoryId"
        value={repositoryId}
      />
      <input
        type="hidden"
        name="returnTo"
        value={returnTo}
      />

      <div className="grid sm:grid-cols-[220px_1fr]">
        <div className="flex items-center justify-center bg-gradient-to-b from-emerald-950 to-slate-900 p-6">
          <Image
            src={firstEvolution.imagePath}
            alt={definition.name}
            width={180}
            height={180}
            className="repo-pixel-image h-44 w-44"
          />
        </div>

        <div className="space-y-5 p-6">
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              {repositoryName}
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              キャラクターを選択
            </h2>
          </div>

          <div>
            <label
              htmlFor={`character-${repositoryId}`}
              className="text-sm font-medium text-slate-300"
            >
              キャラクター
            </label>
            <select
              id={`character-${repositoryId}`}
              name="characterType"
              value={characterType}
              onChange={(event) => {
                setCharacterType(
                  event.target
                    .value as CharacterType,
                );
              }}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            >
              {CHARACTER_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {
                      CHARACTER_CATALOG[
                        type
                      ].name
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="rounded-xl bg-slate-950/70 p-4">
            <p className="font-bold text-white">
              {definition.name}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {definition.description}
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-300">
              性格
            </legend>

            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CHARACTER_PERSONALITIES.map((value) => {
                const isSelected = value === personality;

                return (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-300 ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-400/10 text-white"
                        : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="personality"
                      value={value}
                      checked={isSelected}
                      onChange={() => setPersonality(value)}
                      className="sr-only"
                    />
                    {PERSONALITY_INFO[value].label}
                  </label>
                );
              })}
            </div>

            <div className="mt-2 rounded-xl bg-slate-950/70 px-4 py-3">
              <p className="text-sm text-white">
                「{PERSONALITY_INFO[personality].sample}」
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {PERSONALITY_INFO[personality].description}．
                あとから変えることはできません．
              </p>
            </div>
          </fieldset>

          <div>
            <label
              htmlFor={`character-name-${repositoryId}`}
              className="text-sm font-medium text-slate-300"
            >
              名前
            </label>
            <input
              id={`character-name-${repositoryId}`}
              name="name"
              type="text"
              required
              maxLength={CHARACTER_NAME_MAX_LENGTH}
              autoComplete="off"
              placeholder="例：ポチ"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {CHARACTER_NAME_MAX_LENGTH}文字まで．あとから変えることはできません．
            </p>
          </div>

          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
