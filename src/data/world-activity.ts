import "server-only";

import {
  summarizeActivity,
  type ActivitySummary,
} from "@/lib/world/activity";
import { createClient } from "@/lib/supabase/server";

// 最近の様子として見る期間
const ACTIVITY_DAYS = 14;

/*
 * 自分のキャラクターの，最近の成長履歴をまとめる．
 * リポジトリワールドのセリフ選びに使う．
 *
 * RLSで本人の履歴だけが返るので，キャラクターを指定せず
 * 1回の問い合わせで全員分を取る（キャラクターごとに取ると N+1 になる）．
 */
export async function getWorldActivity(): Promise<
  Record<string, ActivitySummary>
> {
  const supabase = await createClient();

  const since = new Date(
    Date.now() - ACTIVITY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("growth_events")
    .select("character_id, event_type, created_at")
    .gte("created_at", since);

  // セリフ選びに使うだけなので，取れなくても画面は表示する
  if (error) {
    console.error(
      "Failed to fetch world activity:",
      error,
    );
    return {};
  }

  return summarizeActivity(data ?? [], new Date());
}
