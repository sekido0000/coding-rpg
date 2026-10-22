import {
  CATEGORY_LABELS,
  GENERATED_CHARACTER_CATALOG,
  type GeneratedCharacterDefinition,
  type GeneratedEvolutionStage,
} from "@/lib/characters/generated-catalog";
import {
  CHARACTER_CATEGORIES,
  CHARACTER_TYPES,
  type CharacterCategory,
  type CharacterType,
} from "@/lib/characters/generated-types";

export {
  CATEGORY_LABELS,
  CHARACTER_CATEGORIES,
  CHARACTER_TYPES,
  GENERATED_CHARACTER_CATALOG as CHARACTER_CATALOG,
};

export type {
  CharacterCategory,
  CharacterType,
  GeneratedCharacterDefinition as CharacterDefinition,
  GeneratedEvolutionStage as EvolutionStage,
};

export function isCharacterType(
  value: unknown,
): value is CharacterType {
  return (
    typeof value === "string" &&
    (CHARACTER_TYPES as readonly string[]).includes(value)
  );
}

export function isCharacterCategory(
  value: unknown,
): value is CharacterCategory {
  return (
    typeof value === "string" &&
    (CHARACTER_CATEGORIES as readonly string[]).includes(value)
  );
}

export function getCharacterEvolution(
  characterType: CharacterType,
  level: number,
): GeneratedEvolutionStage {
  const evolutions =
    GENERATED_CHARACTER_CATALOG[characterType].evolutions;

  return (
    [...evolutions]
      .reverse()
      .find((evolution) => level >= evolution.level) ??
    evolutions[0]
  );
}

export function getNextCharacterEvolution(
  characterType: CharacterType,
  level: number,
): GeneratedEvolutionStage | null {
  return (
    GENERATED_CHARACTER_CATALOG[
      characterType
    ].evolutions.find(
      (evolution) => evolution.level > level,
    ) ?? null
  );
}

export function getCharactersByCategory(
  category: CharacterCategory,
): GeneratedCharacterDefinition[] {
  return CHARACTER_TYPES.map(
    (characterType) =>
      GENERATED_CHARACTER_CATALOG[characterType],
  ).filter(
    (definition) => definition.category === category,
  );
}
