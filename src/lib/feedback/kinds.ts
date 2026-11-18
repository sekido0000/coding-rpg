/*
 * ご意見の種類と，送れる文字数．画面とサーバーの両方で使う．
 */

export const FEEDBACK_KINDS = [
  "bug",
  "request",
  "impression",
  "other",
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  bug: "不具合",
  request: "要望",
  impression: "感想",
  other: "その他",
};

export const FEEDBACK_MAX_LENGTH = 2000;

// 1日に送れる回数（いたずらで大量に送られないように）
export const FEEDBACK_DAILY_LIMIT = 10;

export function isFeedbackKind(value: unknown): value is FeedbackKind {
  return (
    typeof value === "string" &&
    (FEEDBACK_KINDS as readonly string[]).includes(value)
  );
}
