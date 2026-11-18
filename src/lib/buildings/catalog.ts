/*
 * ワールドに建てられる建物の一覧．
 *
 * 1週間のクエストの報酬は最大 210 G なので，
 * 安いものは1週間，高いものは3〜4週間ためると建てられる値段にする．
 * 建物は見た目とキャラクターの動きだけを変え，経験値やゴールドは増やさない．
 * 建物を増やす時はここに足し，絵（buildings.tsx・interiors.tsx）を用意する．
 */

export const BUILDING_IDS = [
  "ramen_stall",
  "fountain",
  "cafe",
  "library",
  "arcade",
  "restaurant",
  "lab",
] as const;

export type BuildingId = (typeof BUILDING_IDS)[number];

export type BuildingDefinition = {
  id: BuildingId;
  name: string;
  icon: string;
  description: string;
  price: number;
  /*
   * 立ち寄ったキャラクターが中に入るか．
   * 噴水のような外の広場では，中に入らずにそばでひと休みする．
   */
  isIndoor: boolean;
};

export const BUILDING_CATALOG: Record<BuildingId, BuildingDefinition> = {
  ramen_stall: {
    id: "ramen_stall",
    name: "ラーメン屋",
    icon: "🍜",
    description: "カウンターで湯気の立つラーメンを食べる．壁にはお品書きが並ぶ．",
    price: 150,
    isIndoor: true,
  },
  fountain: {
    id: "fountain",
    name: "公園の噴水",
    icon: "⛲",
    description: "噴水のそばでひと休みする．",
    price: 250,
    isIndoor: false,
  },
  cafe: {
    id: "cafe",
    name: "カフェ",
    icon: "☕",
    description: "コーヒーを飲みながら，おしゃべりする．",
    price: 300,
    isIndoor: true,
  },
  library: {
    id: "library",
    name: "図書館",
    icon: "📚",
    description: "机で本を読んだり，本棚を見て回ったりする．",
    price: 400,
    isIndoor: true,
  },
  arcade: {
    id: "arcade",
    name: "ゲームセンター",
    icon: "🕹️",
    description: "光るゲーム機で遊ぶ．",
    price: 500,
    isIndoor: true,
  },
  restaurant: {
    id: "restaurant",
    name: "レストラン",
    icon: "🍽️",
    description: "テーブルでごちそうを食べる．",
    price: 600,
    isIndoor: true,
  },
  lab: {
    id: "lab",
    name: "研究所",
    icon: "🧪",
    description: "実験をする．ときどき煙がぽんと出る．",
    price: 700,
    isIndoor: true,
  },
};

// 取り壊した時に返すゴールドの割合
export const DEMOLISH_REFUND_RATE = 0.5;

export function getDemolishRefund(buildingId: BuildingId) {
  return Math.floor(
    BUILDING_CATALOG[buildingId].price * DEMOLISH_REFUND_RATE,
  );
}

export function isBuildingId(value: unknown): value is BuildingId {
  return (
    typeof value === "string" &&
    (BUILDING_IDS as readonly string[]).includes(value)
  );
}

/*
 * 場所を保存する建物の名前．
 * - 建てた建物：建物の種類（cafe など）
 * - 掲示板・雑貨店・ボス戦の入口・工房：quest_board・general_store・dungeon_gate・workshop
 * - 家：house:キャラクターのID
 */
export type FixedLotKey =
  | "quest_board"
  | "general_store"
  | "dungeon_gate"
  | "workshop";

export const FIXED_LOT_KEYS: readonly FixedLotKey[] = [
  "quest_board",
  "general_store",
  "dungeon_gate",
  "workshop",
];

export type HouseLotKey = `house:${string}`;
export type LotKey = BuildingId | FixedLotKey | HouseLotKey;

export function houseLotKey(characterId: string): HouseLotKey {
  return `house:${characterId}`;
}

// 移せる建物（家・掲示板・雑貨店・ダンジョンの入口・建てた建物）の名前か
export function isFixedLotKey(value: unknown): value is FixedLotKey {
  return (FIXED_LOT_KEYS as readonly unknown[]).includes(value);
}

export function isLotKey(value: unknown): value is LotKey {
  return (
    isBuildingId(value) ||
    isFixedLotKey(value) ||
    (typeof value === "string" &&
      /^house:[0-9a-f-]{36}$/i.test(value))
  );
}

// 建物の場所
export type Placement = {
  key: LotKey;
  // 何列目か（掲示板の列が 0．上はマイナス，下はプラス）
  row: number;
  // 真ん中（掲示板）の区画から何区画ずれているか．ワールドが広がっても場所が変わらないようにする
  offset: number;
};
