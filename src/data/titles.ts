import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { grantTitles } from "@/lib/titles/grant-titles";
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

  const stats = await grantTitles(createAdminClient(), user.id);

  const [titles, profile] = await Promise.all([
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

  const newSince = Date.now() - NEW_DAYS * 24 * 60 * 60 * 1000;

  return {
    stats,
    earnedAt: Object.fromEntries(
      (titles.data ?? []).map((row) => [row.title_id, row.earned_at]),
    ),
    newTitleIds: (titles.data ?? [])
      .filter((row) => Date.parse(row.earned_at) >= newSince)
      .map((row) => row.title_id),
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
