import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  evaluateWeeklyQuests,
  getWeekRange,
  getWeekStart,
  type QuestProgress,
} from "@/lib/quests/weekly";

export type WeeklyQuestBoard = {
  weekStart: string;
  // 次にクエストが入れ替わるまでの日数（今日を含む）
  daysLeft: number;
  gold: number;
  progress: QuestProgress[];
};

/*
 * 今週のクエストの進み具合と，持っているゴールド．
 *
 * RLSで本人の行だけが返るので，ユーザーを指定せずに取る．
 * 報酬を渡した段階は，あとで条件を外れても達成のまま表示する
 * （例：毎回クエストを達成したあとに，理由なしのコミットをした時）．
 */
export async function getWeeklyQuestBoard(): Promise<WeeklyQuestBoard> {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = getWeekStart(now);
  const { from, to } = getWeekRange(weekStart);
  const daysLeft = Math.max(
    1,
    Math.ceil(
      (Date.parse(to) - now.getTime()) / (24 * 60 * 60 * 1000),
    ),
  );

  const [events, completions, wallet] = await Promise.all([
    supabase
      .from("growth_events")
      .select("event_type, xp, created_at, body_xp, is_vague")
      .gte("created_at", from)
      .lt("created_at", to),
    supabase
      .from("quest_completions")
      .select("quest_id, stage")
      .eq("week_start", weekStart),
    supabase.from("user_wallets").select("gold").maybeSingle(),
  ]);

  // クエストが表示できなくても，ホームは表示する
  for (const result of [events, completions, wallet]) {
    if (result.error) {
      console.error(
        "Failed to fetch weekly quests:",
        result.error,
      );
    }
  }

  const claimedStages = new Map<string, number>();

  for (const row of completions.data ?? []) {
    claimedStages.set(
      row.quest_id,
      Math.max(claimedStages.get(row.quest_id) ?? 0, row.stage),
    );
  }

  const progress = evaluateWeeklyQuests(
    events.data ?? [],
    weekStart,
  ).map((item) => {
    const claimed = claimedStages.get(item.quest.id) ?? 0;

    return claimed > item.achievedStages
      ? { ...item, achievedStages: claimed, isFailed: false }
      : item;
  });

  return {
    weekStart,
    daysLeft,
    gold: wallet.data?.gold ?? 0,
    progress,
  };
}
