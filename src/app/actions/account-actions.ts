"use server";

import { redirect } from "next/navigation";

import { DELETE_CONFIRMATION } from "@/lib/account/delete";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = {
  message: string;
};

/*
 * 自分のデータを全部消す（退会）．
 *
 * ログインのアカウントを消すと，キャラクター・成長履歴・ゴールド・建物・装備・ご意見など，
 * その人のデータは DB の決まり（on delete cascade）で連鎖してすべて消える．
 * GitHub 側のアプリ（GitHub App）はここからは外せないので，消した後の画面で案内する．
 */
export async function deleteAccountAction(
  _previous: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  if (formData.get("confirm") !== DELETE_CONFIRMATION) {
    return {
      message: `確認のため「${DELETE_CONFIRMATION}」と入力してください`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "ログインが必要です" };
  }

  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Failed to delete account:", error);
    return {
      message: "消せませんでした．時間をおいてもう一度試してください",
    };
  }

  // アカウントはもう無いので，このブラウザのログイン状態だけを消す
  await supabase.auth.signOut({ scope: "local" });

  redirect("/account/deleted");
}
