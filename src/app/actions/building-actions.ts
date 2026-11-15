"use server";

import { refresh, revalidatePath } from "next/cache";

import { getPlacements } from "@/data/buildings";
import { getCharacters } from "@/data/characters";
import {
  BUILDING_CATALOG,
  getDemolishRefund,
  houseLotKey,
  isLotKey,
  type LotKey,
  type Placement,
  isBuildingId,
} from "@/lib/buildings/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildWorldMap,
  isBuildableLot,
  type WorldMap,
} from "@/lib/world/map";

export type BuildingActionResult = {
  ok: boolean;
  message: string;
};

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("ログインが必要です");
  }

  return user.id;
}

// 今のワールドの地図を，サーバーでも作る
async function loadMap() {
  const [characters, placements] = await Promise.all([
    getCharacters(),
    getPlacements(),
  ]);

  const map = buildWorldMap(
    characters.map((character) => character.id),
    placements,
  );

  return { map, placements };
}

/*
 * まだ場所を保存していない家・掲示板・雑貨店を，今の場所のまま保存する．
 *
 * これらは空いた区画に自動で並ぶため，建物を移したり取り壊したりして区画が空くと，
 * そこへ別の家が詰めてきてしまう．何かを変える前に今の並びを保存して，勝手に動かないようにする．
 */
async function freezeLayout(
  userId: string,
  map: WorldMap,
  placements: Placement[],
) {
  const saved = new Set(placements.map((placement) => placement.key));
  const rows = map.lots.flatMap((lot) =>
    lot.key && !isBuildingId(lot.key) && !saved.has(lot.key)
      ? [
          {
            user_id: userId,
            building_id: lot.key,
            lot_row: lot.row,
            lot_offset: lot.offset,
          },
        ]
      : [],
  );

  if (rows.length === 0) {
    return;
  }

  const { error } = await createAdminClient()
    .from("user_buildings")
    .upsert(rows, {
      onConflict: "user_id,building_id",
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(`今の並びを保存できませんでした: ${error.message}`);
  }
}

/*
 * その場所が空いた区画か，サーバーでも地図を作って確かめる．
 * 家や掲示板の場所に建てられないようにするため．
 * 建てられる時は，変える前に今の並びを保存しておく．
 */
async function canBuildAt(userId: string, row: number, offset: number) {
  if (
    (row !== 0 && row !== 1) ||
    !Number.isInteger(offset) ||
    Math.abs(offset) > 100
  ) {
    return false;
  }

  const { map, placements } = await loadMap();

  if (!isBuildableLot(map, row, offset)) {
    return false;
  }

  await freezeLayout(userId, map, placements);
  return true;
}

function done(message: string): BuildingActionResult {
  revalidatePath("/");
  // 今開いているワールドも，最新の状態で表示し直す（Next.js 16 では明示が必要）
  refresh();

  return { ok: true, message };
}

/*
 * 建物を建てる．値段はブラウザから受け取らず，サーバーの一覧で決める．
 */
export async function purchaseBuildingAction(
  buildingId: string,
  row: number,
  offset: number,
): Promise<BuildingActionResult> {
  if (!isBuildingId(buildingId)) {
    return { ok: false, message: "建物が見つかりません" };
  }

  const userId = await getUserId();

  if (!(await canBuildAt(userId, row, offset))) {
    return { ok: false, message: "ここには建てられません" };
  }

  const building = BUILDING_CATALOG[buildingId];
  const { data, error } = await createAdminClient().rpc(
    "purchase_building",
    {
      p_user_id: userId,
      p_building_id: buildingId,
      p_price: building.price,
      p_row: row,
      p_offset: offset,
    },
  );

  if (error) {
    console.error("Failed to purchase building:", error);
    return {
      ok: false,
      message: "建てられませんでした．時間をおいて試してください",
    };
  }

  if (data === "insufficient") {
    return { ok: false, message: "ゴールドが足りません" };
  }

  if (data !== "ok") {
    return { ok: false, message: "ここには建てられません" };
  }

  return done(`${building.name}を建てました！`);
}

/*
 * 建物（家・掲示板・雑貨店・建てた建物）を，空いた区画へ移す（無料）．
 * 建てた建物は move_building，家・掲示板・雑貨店は place_lot で場所を保存する．
 */
export async function moveBuildingAction(
  key: string,
  row: number,
  offset: number,
): Promise<BuildingActionResult> {
  if (!isLotKey(key)) {
    return { ok: false, message: "建物が見つかりません" };
  }

  const userId = await getUserId();
  const characters = await getCharacters();

  // 家は，自分のキャラクターの家だけを移せる
  if (
    key.startsWith("house:") &&
    !characters.some((character) => houseLotKey(character.id) === key)
  ) {
    return { ok: false, message: "建物が見つかりません" };
  }

  if (!(await canBuildAt(userId, row, offset))) {
    return { ok: false, message: "ここには移せません" };
  }

  const { data, error } = isBuildingId(key)
    ? await createAdminClient().rpc("move_building", {
        p_user_id: userId,
        p_building_id: key,
        p_row: row,
        p_offset: offset,
      })
    : await createAdminClient().rpc("place_lot", {
        p_user_id: userId,
        p_key: key,
        p_row: row,
        p_offset: offset,
      });

  if (error || data !== "ok") {
    console.error("Failed to move building:", error ?? data);
    return { ok: false, message: "移せませんでした" };
  }

  return done(`${getLotName(key, characters)}を移しました`);
}

// 建物の名前（お知らせに使う）
function getLotName(
  key: LotKey,
  characters: { id: string; name: string }[],
) {
  if (key === "quest_board") {
    return "クエスト掲示板";
  }

  if (key === "general_store") {
    return "雑貨店";
  }

  if (key === "dungeon_gate") {
    return "ダンジョンの入口";
  }

  if (isBuildingId(key)) {
    return BUILDING_CATALOG[key].name;
  }

  const owner = characters.find(
    (character) => houseLotKey(character.id) === key,
  );

  return owner ? `${owner.name}の家` : "家";
}

// 建てた建物を取り壊し，値段の半分のゴールドを返す
export async function demolishBuildingAction(
  buildingId: string,
): Promise<BuildingActionResult> {
  if (!isBuildingId(buildingId)) {
    return { ok: false, message: "建物が見つかりません" };
  }

  const userId = await getUserId();
  const refund = getDemolishRefund(buildingId);

  // 取り壊して空いた区画へ，別の家が詰めてこないよう，今の並びを保存しておく
  const { map, placements } = await loadMap();
  await freezeLayout(userId, map, placements);

  const { data, error } = await createAdminClient().rpc(
    "demolish_building",
    {
      p_user_id: userId,
      p_building_id: buildingId,
      p_refund: refund,
    },
  );

  if (error || data !== "ok") {
    console.error("Failed to demolish building:", error ?? data);
    return { ok: false, message: "取り壊せませんでした" };
  }

  return done(
    `${BUILDING_CATALOG[buildingId].name}を取り壊し，${refund} G が戻りました`,
  );
}
