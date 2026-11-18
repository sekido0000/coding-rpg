"use server";

import {
  FEEDBACK_DAILY_LIMIT,
  FEEDBACK_MAX_LENGTH,
  isFeedbackKind,
} from "@/lib/feedback/kinds";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type FeedbackState = {
  status: "idle" | "success" | "error";
  message: string;
};

/*
 * ご意見を送る．ログインしている人だけが送れる．
 * 1日に送れる回数を決めて，いたずらで大量に送られないようにする．
 */
export async function sendFeedbackAction(
  _previous: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const kind = formData.get("kind");
  const message = String(formData.get("message") ?? "").trim();
  const page = String(formData.get("page") ?? "").slice(0, 200) || null;

  if (!isFeedbackKind(kind)) {
    return { status: "error", message: "種類を選んでください" };
  }

  if (message.length === 0) {
    return { status: "error", message: "内容を書いてください" };
  }

  if (message.length > FEEDBACK_MAX_LENGTH) {
    return {
      status: "error",
      message: `${FEEDBACK_MAX_LENGTH}文字以内で書いてください`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "ログインが必要です" };
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if (countError) {
    console.error("Failed to count feedback:", countError);
    return { status: "error", message: "送れませんでした．時間をおいて試してください" };
  }

  if ((count ?? 0) >= FEEDBACK_DAILY_LIMIT) {
    return {
      status: "error",
      message: "今日はたくさん送っていただいたので，また明日お願いします",
    };
  }

  const { error } = await admin.from("feedback").insert({
    user_id: user.id,
    kind,
    message,
    page,
  });

  if (error) {
    console.error("Failed to save feedback:", error);
    return { status: "error", message: "送れませんでした．時間をおいて試してください" };
  }

  return { status: "success", message: "送りました．ありがとうございます！" };
}
