/*
 * アプリの改善のために数える，使い方の種類．画面とサーバーの両方で使う．
 * 数えるのは1日ごと・種類ごとの回数だけ（いつ何を押したかの細かい記録は取らない）．
 */

export const USAGE_EVENTS = [
  // キャラクターの詳細を開いた（キャラクターごとに数える）
  "character_detail",
  // 建物（家・雑貨店・建てた建物）の中をのぞいた
  "building_peek",
  // 装飾・装備を付け替えた
  "decoration_change",
  // 建物を建てた・移した
  "building_edit",
  // クエストを開いた
  "quest_open",
  // ボス戦に挑んだ
  "battle_challenge",
  // 工房を開いた
  "workshop_open",
  // 雑貨店（のページ）を開いた
  "shop_open",
  // バッジを作った
  "badge_enable",
] as const;

export type UsageEvent = (typeof USAGE_EVENTS)[number];

// ブラウザから送ってよい種類（画面の中だけで起きる操作）
export const CLIENT_USAGE_EVENTS = ["building_peek", "quest_open"] as const;

export type ClientUsageEvent = (typeof CLIENT_USAGE_EVENTS)[number];

export function isClientUsageEvent(value: unknown): value is ClientUsageEvent {
  return (
    typeof value === "string" &&
    (CLIENT_USAGE_EVENTS as readonly string[]).includes(value)
  );
}

// 日本時間の日付（YYYY-MM-DD）
export function toJstDay(date: Date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
