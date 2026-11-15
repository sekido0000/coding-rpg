"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { findTitle } from "@/lib/titles/catalog";

/*
 * 表示する称号を選ぶ．titleId が空の時は表示しない．
 * 持っていない称号は選べない．
 */
export async function selectTitleAction(
  formData: FormData,
): Promise<void> {
  const titleIdValue = formData.get("titleId");
  const titleId =
    titleIdValue === "" ? null : findTitle(String(titleIdValue))?.id;

  if (titleId === undefined) {
    throw new Error("称号の指定が不正です");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("ログインが必要です");
  }

  const admin = createAdminClient();

  if (titleId) {
    const { data: owned, error } = await admin
      .from("user_titles")
      .select("title_id")
      .eq("user_id", user.id)
      .eq("title_id", titleId)
      .maybeSingle();

    if (error) {
      throw new Error(`称号の確認に失敗しました: ${error.message}`);
    }

    if (!owned) {
      throw new Error("まだ持っていない称号です");
    }
  }

  const { error } = await admin.from("user_profiles").upsert(
    {
      user_id: user.id,
      selected_title: titleId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`称号を選べませんでした: ${error.message}`);
  }

  revalidatePath("/titles");
  revalidatePath("/");
}
