"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();

  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw new Error(
      `ログアウトに失敗しました: ${error.message}`,
    );
  }

  // ログアウト後はトップページ（紹介ページ）へ戻る
  redirect("/");
}