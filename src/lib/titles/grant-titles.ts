import type { createAdminClient } from "@/lib/supabase/admin";
import {
  getEarnedTitleIds,
  type TitleStats,
} from "@/lib/titles/catalog";

type SupabaseAdminClient = ReturnType<
  typeof createAdminClient
>;

// 称号の判定に使う，そのユーザーの各種の合計
export async function getTitleStats(
  supabase: SupabaseAdminClient,
  userId: string,
): Promise<TitleStats> {
  const { data, error } = await supabase.rpc(
    "get_title_stats",
    { p_user_id: userId },
  );

  if (error) {
    throw new Error(
      `Failed to fetch title stats: ${error.message}`,
    );
  }

  return data as TitleStats;
}

/*
 * 数が届いた称号のうち，まだ持っていないものを渡す．
 * 持っている称号が分かっている時は ownedTitleIds に渡すと，
 * 新しい称号がない時に書き込みを省ける．
 * 新しく渡した称号のIDを返す．
 */
export async function saveEarnedTitles(
  supabase: SupabaseAdminClient,
  userId: string,
  stats: TitleStats,
  ownedTitleIds?: ReadonlySet<string>,
) {
  const titleIds = getEarnedTitleIds(stats).filter(
    (titleId) => !ownedTitleIds?.has(titleId),
  );

  if (titleIds.length === 0) {
    return [];
  }

  const { error } = await supabase.from("user_titles").upsert(
    titleIds.map((titleId) => ({
      user_id: userId,
      title_id: titleId,
    })),
    {
      onConflict: "user_id,title_id",
      // もらった日時を書き換えないよう，持っている称号は何もしない
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw new Error(`Failed to grant titles: ${error.message}`);
  }

  return titleIds;
}

/*
 * そのユーザーの各種の合計を数え，届いた称号を渡す．
 * すでに持っている称号は飛ばすので，何回呼んでもよい．
 */
export async function grantTitles(
  supabase: SupabaseAdminClient,
  userId: string,
): Promise<TitleStats> {
  const stats = await getTitleStats(supabase, userId);

  await saveEarnedTitles(supabase, userId, stats);

  return stats;
}
