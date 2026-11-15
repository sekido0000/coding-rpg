import type { createAdminClient } from "@/lib/supabase/admin";
import {
  evaluateWeeklyQuests,
  getQuestRewards,
  getWeekRange,
} from "@/lib/quests/weekly";

type SupabaseAdminClient = ReturnType<
  typeof createAdminClient
>;

/*
 * そのユーザーの週のクエストを判定し，新しく達成した段階の報酬を渡す．
 *
 * 進み具合は，全部のリポジトリの成長履歴から毎回計算し直す．
 * すでに渡した報酬は DB の関数（grant_quest_rewards）が飛ばすので，
 * 何回呼んでも二重には渡さない．前回の push で渡しそこねた報酬も，ここで渡せる．
 */
export async function grantQuestRewards(
  supabase: SupabaseAdminClient,
  userId: string,
  weekStart: string,
) {
  // そのユーザーのキャラクター（連携を解除したリポジトリの分も含めて数える）
  const { data: repositories, error: repositoryError } =
    await supabase
      .from("repositories")
      .select("id")
      .eq("user_id", userId);

  if (repositoryError) {
    throw new Error(
      `Failed to fetch repositories: ${repositoryError.message}`,
    );
  }

  const { data: characters, error: characterError } =
    await supabase
      .from("characters")
      .select("id")
      .in(
        "repository_id",
        (repositories ?? []).map((repository) => repository.id),
      );

  if (characterError) {
    throw new Error(
      `Failed to fetch characters: ${characterError.message}`,
    );
  }

  const { from, to } = getWeekRange(weekStart);

  const { data: events, error: eventError } = await supabase
    .from("growth_events")
    .select("event_type, xp, created_at, body_xp, is_vague")
    .in(
      "character_id",
      (characters ?? []).map((character) => character.id),
    )
    .gte("created_at", from)
    .lt("created_at", to);

  if (eventError) {
    throw new Error(
      `Failed to fetch growth events: ${eventError.message}`,
    );
  }

  const rewards = getQuestRewards(
    evaluateWeeklyQuests(events ?? [], weekStart),
  );

  if (rewards.length === 0) {
    return 0;
  }

  const { data: gold, error: grantError } = await supabase.rpc(
    "grant_quest_rewards",
    {
      p_user_id: userId,
      p_week_start: weekStart,
      p_rewards: rewards,
    },
  );

  if (grantError) {
    throw new Error(
      `Failed to grant quest rewards: ${grantError.message}`,
    );
  }

  return (gold as number | null) ?? 0;
}
