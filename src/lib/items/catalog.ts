/*
 * 雑貨店で買える装飾（見た目だけで，強さは変わらない）の一覧．
 *
 * 1週間のクエストの報酬は最大 210 G なので，
 * 安いものは1週間，高いものは1か月ほどで買える値段にする．
 * 装飾を増やす時はここに足すだけでよい（DB の変更はいらない）．
 */

// 装飾を付ける場所．companion：おとも，aura：足元
export type ItemSlot = "companion" | "aura";

export const ITEM_SLOT_LABELS: Record<ItemSlot, string> = {
  companion: "おとも",
  aura: "足元",
};

export const ITEM_IDS = [
  "chick",
  "rubber_duck",
  "coffee",
  "cat",
  "baby_dragon",
  "grass_ring",
  "terminal_glow",
  "sparkle",
  "flame_aura",
  "rainbow_aura",
] as const;

export type ItemId = (typeof ITEM_IDS)[number];

export type ItemDefinition = {
  id: ItemId;
  slot: ItemSlot;
  name: string;
  description: string;
  price: number;
};

export const ITEM_CATALOG: Record<ItemId, ItemDefinition> = {
  chick: {
    id: "chick",
    slot: "companion",
    name: "ひよこ",
    description: "最初の仲間．とことこついてくる．",
    price: 40,
  },
  rubber_duck: {
    id: "rubber_duck",
    slot: "companion",
    name: "ラバーダック",
    description: "話しかけると，なぜかバグが見つかる．",
    price: 80,
  },
  coffee: {
    id: "coffee",
    slot: "companion",
    name: "コーヒーカップ",
    description: "開発のおとも．湯気が立っている．",
    price: 120,
  },
  cat: {
    id: "cat",
    slot: "companion",
    name: "ネコ",
    description: "目を離すとキーボードに乗ってくる．",
    price: 150,
  },
  baby_dragon: {
    id: "baby_dragon",
    slot: "companion",
    name: "ちびドラゴン",
    description: "あこがれの一匹．いつか大きくなる？",
    price: 300,
  },
  grass_ring: {
    id: "grass_ring",
    slot: "aura",
    name: "草の輪",
    description: "足元に小さな芽が出る．",
    price: 30,
  },
  terminal_glow: {
    id: "terminal_glow",
    slot: "aura",
    name: "ターミナルの光",
    description: "緑の文字が足元から立ちのぼる．",
    price: 100,
  },
  sparkle: {
    id: "sparkle",
    slot: "aura",
    name: "星のきらめき",
    description: "まわりで星がキラキラ光る．",
    price: 150,
  },
  flame_aura: {
    id: "flame_aura",
    slot: "aura",
    name: "炎のオーラ",
    description: "足元から炎が燃え上がる．",
    price: 250,
  },
  rainbow_aura: {
    id: "rainbow_aura",
    slot: "aura",
    name: "虹のオーラ",
    description: "いちばんの品．虹色の光をまとう．",
    price: 400,
  },
};

export function isItemId(value: unknown): value is ItemId {
  return (
    typeof value === "string" &&
    (ITEM_IDS as readonly string[]).includes(value)
  );
}

export function isItemSlot(value: unknown): value is ItemSlot {
  return value === "companion" || value === "aura";
}

// DB の値を装飾に直す．一覧にない値（消した装飾など）は付けていない扱いにする
export function toItemId(
  value: string | null | undefined,
  slot: ItemSlot,
): ItemId | null {
  return isItemId(value) && ITEM_CATALOG[value].slot === slot
    ? value
    : null;
}
