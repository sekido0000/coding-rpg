import { notFound } from "next/navigation";
import { after } from "next/server";

import { CharacterDetail } from "@/components/repositories/character-detail";
import { getCharacters } from "@/data/characters";
import { getOwnedGear } from "@/data/gear";
import { getGrowthEvents } from "@/lib/growth/events";
import { getInventory } from "@/data/inventory";
import { recordUsage } from "@/lib/analytics/record";
import { createClient } from "@/lib/supabase/server";

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

  // アプリの改善のための記録：キャラクターごとに，詳細を開いた回数を数える
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const userId = user.id;
    const characterId = character.id;
    after(() => recordUsage(userId, "character_detail", characterId));
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
