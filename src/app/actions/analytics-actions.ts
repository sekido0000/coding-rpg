"use server";

import { refresh } from "next/cache";
import { after } from "next/server";

import { isClientUsageEvent } from "@/lib/analytics/events";
import { recordUsage } from "@/lib/analytics/record";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

/*
 * 画面の中だけで起きる操作（建物の中をのぞいた・クエストを開いた）を数える．
 * 数えるのは決まった種類だけで，画面の動きを待たせないよう，返事の後に記録する．
 */
export async function recordClientUsageAction(event: string) {
  if (!isClientUsageEvent(event)) {
    return;
  }

  const userId = await getUserId();

  if (userId) {
    after(() => recordUsage(userId, event));
  }
}

export type AnalyticsSettingResult = {
  ok: boolean;
  message: string;
};

/*
 * 「分析に使わない」の設定を変える．
 * 使わないにした時は，それまでの記録（使い方の回数・比べる元）を消す．
 */
export async function setAnalyticsOptOutAction(
  optOut: boolean,
): Promise<AnalyticsSettingResult> {
  if (typeof optOut !== "boolean") {
    return { ok: false, message: "設定を変えられませんでした" };
  }

  const userId = await getUserId();

  if (!userId) {
    return { ok: false, message: "ログインが必要です" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("user_profiles").upsert(
    {
      user_id: userId,
      analytics_opt_out: optOut,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Failed to update analytics setting:", error);
    return { ok: false, message: "設定を変えられませんでした" };
  }

  if (optOut) {
    const results = await Promise.all([
      admin.from("usage_counts").delete().eq("user_id", userId),
      admin.from("commit_baselines").delete().eq("user_id", userId),
    ]);

    for (const result of results) {
      if (result.error) {
        console.error("Failed to delete analytics records:", result.error);
        return {
          ok: false,
          message: "記録を消せませんでした．時間をおいてもう一度試してください",
        };
      }
    }
  }

  refresh();

  return {
    ok: true,
    message: optOut
      ? "分析に使わないようにし，これまでの記録を消しました"
      : "分析に使うようにしました",
  };
}
