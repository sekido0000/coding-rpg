import "server-only";

import {
  isBossId,
  isBossStar,
  isMaterialId,
  type BossId,
  type BossStar,
  type MaterialId,
} from "@/lib/battle/bosses";
import { getWeekStart } from "@/lib/quests/weekly";
import { createClient } from "@/lib/supabase/server";

export type BattleStatus = {
  // 今週の月曜日（日本時間）
  weekStart: string;
  // 今週勝った★と，そのボス
  wins: Partial<Record<BossStar, BossId>>;
  // 持っている素材の数
  materials: Partial<Record<MaterialId, number>>;
};

/*
 * 今週のボス戦の勝ち具合と，持っている素材．
 * RLSで本人の行だけが返るので，ユーザーを指定せずに取る．
 */
export async function getBattleStatus(): Promise<BattleStatus> {
  const supabase = await createClient();
  const weekStart = getWeekStart(new Date());

  const [wins, materials] = await Promise.all([
    supabase
      .from("boss_wins")
      .select("star, boss_id")
      .eq("week_start", weekStart),
    supabase.from("user_materials").select("material_id, quantity"),
  ]);

  for (const result of [wins, materials]) {
    if (result.error) {
      throw new Error(
        `ボス戦の記録の取得に失敗しました: ${result.error.message}`,
      );
    }
  }

  const status: BattleStatus = { weekStart, wins: {}, materials: {} };

  for (const row of wins.data ?? []) {
    if (isBossStar(row.star) && isBossId(row.boss_id)) {
      status.wins[row.star] = row.boss_id;
    }
  }

  for (const row of materials.data ?? []) {
    if (isMaterialId(row.material_id) && row.quantity > 0) {
      status.materials[row.material_id] = row.quantity;
    }
  }

  return status;
}
