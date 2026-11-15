import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getTitleStats,
  saveEarnedTitles,
} from "@/lib/titles/grant-titles";
import {
  findTitle,
  type TitleInfo,
  type TitleStats,
} from "@/lib/titles/catalog";

export type TitleBoard = {
  stats: TitleStats;
  // もらった称号と，もらった日時
  earnedAt: Record<string, string>;
  // 最近もらった称号（「NEW」を付ける）
  newTitleIds: string[];
  selectedTitleId: string | null;
};

// もらってからこの日数のあいだは「NEW」を付ける
const NEW_DAYS = 7;

/*
 * 称号の一覧ページのデータ．
 *
 * 開いた時にも称号を判定し直す．称号を作る前から条件を満たしていた人や，
 * push の時に判定に失敗した人にも，ここで称号が渡るようにするため．
 */
export async function getTitleBoard(): Promise<TitleBoard> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です");
  }

  /*
   * 合計・持っている称号・選んでいる称号を同時に取る（待ち時間を短くするため）．
   * 新しく届いた称号がある時だけ書き込む．
   */
  const admin = createAdminClient();
  const [stats, titles, profile] = await Promise.all([
    getTitleStats(admin, user.id),
    supabase.from("user_titles").select("title_id, earned_at"),
    supabase
      .from("user_profiles")
      .select("selected_title")
      .maybeSingle(),
  ]);

  for (const result of [titles, profile]) {
    if (result.error) {
      throw new Error(
        `称号の取得に失敗しました: ${result.error.message}`,
      );
    }
  }

  const earnedAt: Record<string, string> = Object.fromEntries(
    (titles.data ?? []).map((row) => [row.title_id, row.earned_at]),
  );

  const now = new Date();
  const savedIds = await saveEarnedTitles(
    admin,
    user.id,
    stats,
    new Set(Object.keys(earnedAt)),
  );

  for (const titleId of savedIds) {
    earnedAt[titleId] = now.toISOString();
  }

  const newSince = now.getTime() - NEW_DAYS * 24 * 60 * 60 * 1000;

  return {
    stats,
    earnedAt,
    newTitleIds: Object.entries(earnedAt)
      .filter(([, at]) => Date.parse(at) >= newSince)
      .map(([titleId]) => titleId),
    selectedTitleId: profile.data?.selected_title ?? null,
  };
}

// ホームなどに表示する，選んでいる称号．選んでいない時は null
export async function getSelectedTitle(): Promise<TitleInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("selected_title")
    .maybeSingle();

  // 称号が出せなくても，画面は表示する
  if (error) {
    console.error("Failed to fetch selected title:", error);
    return null;
  }

  return findTitle(data?.selected_title);
}
