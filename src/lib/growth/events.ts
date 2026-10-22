import { createAdminClient } from "@/lib/supabase/admin";

export async function getGrowthEvents(
  characterId: string,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("growth_events")
    .select("*")
    .eq("character_id", characterId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Failed to fetch growth events:",
      error,
    );
    return [];
  }

  return data ?? [];
}