import type { CharacterPersonality } from "@/lib/characters/personality";
import type { ItemId } from "@/lib/items/catalog";
import {
  CHARACTER_TYPES,
  type CharacterType,
} from "@/lib/characters/generated-types";

export { CHARACTER_TYPES };
export type { CharacterType };

export type { CharacterPersonality };

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
  // 付けている装飾（おとも・足元）．付けていない時は null
  companionItem: ItemId | null;
  auraItem: ItemId | null;
};
