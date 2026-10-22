import {
  CHARACTER_TYPES,
  type CharacterType,
} from "@/lib/characters/generated-types";

export { CHARACTER_TYPES };
export type { CharacterType };

export type CharacterPersonality =
  | "cheerful"
  | "calm"
  | "serious";

export type Character = {
  id: string;
  repositoryId: string;
  name: string;
  repositoryOwner: string;
  repositoryName: string;
  repositoryUrl: string;
  defaultBranch: string;
  personality: CharacterPersonality;
  characterType: CharacterType;
  level: number;
  currentXp: number;
  requiredXp: number;
  latestActivity: string;
  githubInstallationId: number;
};
