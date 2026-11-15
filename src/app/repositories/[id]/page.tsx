import { notFound } from "next/navigation";

import { CharacterDetail } from "@/components/repositories/character-detail";
import { getCharacterByRepositoryId } from "@/data/characters";
import { getGrowthEvents } from "@/lib/growth/events";
import { getInventory } from "@/data/inventory";

export default async function RepositoryPage({
  params,
}: PageProps<"/repositories/[id]">) {
  const { id } = await params;
  const character = await getCharacterByRepositoryId(id);
  if (!character) {
    notFound();
  }

  const [growthEvents, inventory] = await Promise.all([
    getGrowthEvents(character.id),
    getInventory(),
  ]);

  return (
    <CharacterDetail
      character={character}
      growthEvents={growthEvents}
      inventory={inventory}
    />
  );
}
