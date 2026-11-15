import type { createAdminClient } from "@/lib/supabase/admin";
import {
  getEarnedTitleIds,
  type TitleStats,
} from "@/lib/titles/catalog";

type SupabaseAdminClient = ReturnType<
  typeof createAdminClient
>;

/*
 * そのユーザーの各種の合計を数え，届いた称号を渡す．
 * すでに持っている称号は飛ばすので，何回呼んでもよい．
 * 数えた合計を返す（称号の一覧ページで「あと何回」を出すのに使う）．
 */
export async function grantTitles(
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

  const stats = data as TitleStats;
  const titleIds = getEarnedTitleIds(stats);

  if (titleIds.length > 0) {
    const { error: insertError } = await supabase
      .from("user_titles")
      .upsert(
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

    if (insertError) {
      throw new Error(
        `Failed to grant titles: ${insertError.message}`,
      );
    }
  }

  return stats;
}
