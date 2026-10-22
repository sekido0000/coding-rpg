import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Character,
  CharacterPersonality,
} from "@/types/character";
import {
  isCharacterType,
} from "@/lib/characters/catalog";

function isCharacterPersonality(
  value: string,
): value is CharacterPersonality {
  return [
    "cheerful",
    "calm",
    "serious",
  ].includes(value);
}

type CharacterRecord = {
  id: string;
  name: string;
  personality: string;
  character_type: string;
  level: number;
  current_xp: number;
  required_xp: number;
  latest_activity: string;
};

type RepositoryRecord = {
  id: string;
  owner: string;
  name: string;
  html_url: string;
  default_branch: string;

  github_installations:
    | {
        github_installation_id: number;
      }[]
    | {
        github_installation_id: number;
      }
    | null;

  characters:
    | CharacterRecord[]
    | CharacterRecord
    | null;
};

export async function getCharacters(): Promise<
  Character[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repositories")
    .select(`
      id,
      owner,
      name,
      html_url,
      default_branch,
      github_installations (
        github_installation_id
      ),
      characters (
        id,
        name,
        personality,
        character_type,
        level,
        current_xp,
        required_xp,
        latest_activity
      )
    `)
    .eq("is_active", true)
    .not(
      "github_installation_id",
      "is",
      null,
    )
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `キャラクターの取得に失敗しました: ${error.message}`,
    );
  }

  const repositories =
    (data ?? []) as RepositoryRecord[];

  return repositories.flatMap((repository) => {
    const characters = Array.isArray(
      repository.characters,
    )
      ? repository.characters
      : repository.characters
        ? [repository.characters]
        : [];

    return characters.map((character) => {
      if (
        !isCharacterPersonality(
          character.personality,
        )
      ) {
        throw new Error(
          `不正な性格です: ${character.personality}`,
        );
      }
      
      if (
        !isCharacterType(
          character.character_type,
        )
      ) {
        throw new Error(
          `不正なキャラクター種類です: ${character.character_type}`,
        );
      }

      return {
        id: character.id,
        repositoryId: repository.id,
        name: character.name,
        repositoryOwner: repository.owner,
        repositoryName: repository.name,
        repositoryUrl: repository.html_url,
        defaultBranch: repository.default_branch,
        githubInstallationId:
          Array.isArray(repository.github_installations)
            ? repository.github_installations[0]
                ?.github_installation_id ?? 0
            : repository.github_installations
                ?.github_installation_id ?? 0,
        personality: character.personality,
        characterType:
          character.character_type,
        level: character.level,
        currentXp: character.current_xp,
        requiredXp: character.required_xp,
        latestActivity:
          character.latest_activity,
      };
    });
  });
}

export async function getCharacterByRepositoryId(
  repositoryId: string,
): Promise<Character | null> {
  const characters = await getCharacters();

  return (
    characters.find(
      (character) =>
        character.repositoryId === repositoryId,
    ) ?? null
  );
}
