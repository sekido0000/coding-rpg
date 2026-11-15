import { notFound } from "next/navigation";

import { CharacterDetail } from "@/components/repositories/character-detail";
import { getCharacters } from "@/data/characters";
import { getOwnedGear } from "@/data/gear";
import { getGrowthEvents } from "@/lib/growth/events";
import { getInventory } from "@/data/inventory";

export default async function RepositoryPage({
  params,
}: PageProps<"/repositories/[id]">) {
  const { id } = await params;
  const characters = await getCharacters();
  const character = characters.find(
    (candidate) => candidate.repositoryId === id,
  );

  if (!character) {
    notFound();
  }

  const [growthEvents, inventory, ownedGear] = await Promise.all([
    getGrowthEvents(character.id),
    getInventory(),
    getOwnedGear(characters.map((candidate) => candidate.id)),
  ]);

  return (
    <CharacterDetail
      character={character}
      growthEvents={growthEvents}
      inventory={inventory}
      ownedGear={ownedGear}
      characterNames={Object.fromEntries(
        characters.map((candidate) => [candidate.id, candidate.name]),
      )}
    />
  );
}
