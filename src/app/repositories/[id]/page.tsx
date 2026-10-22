import { notFound } from "next/navigation";

import { RepositoryWorld } from "@/components/repositories/repository-world";
import { getCharacterByRepositoryId } from "@/data/characters";
import { getGrowthEvents } from "@/lib/growth/events";

export default async function RepositoryPage({
  params,
}: PageProps<"/repositories/[id]">) {
  const { id } = await params;
  const character = await getCharacterByRepositoryId(id);
  if (!character) {
    notFound();
  }

  const growthEvents = await getGrowthEvents(
    character.id,
  );

  return (
    <RepositoryWorld
      character={character}
      growthEvents={growthEvents}
    />
  );
}
