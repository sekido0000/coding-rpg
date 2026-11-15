"use server";

import { refresh, revalidatePath } from "next/cache";

import { getBuildings } from "@/data/buildings";
import { getCharacters } from "@/data/characters";
import {
  BUILDING_CATALOG,
  getDemolishRefund,
  isBuildingId,
} from "@/lib/buildings/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildWorldMap, isBuildableLot } from "@/lib/world/map";

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

/*
 * その場所が空いた区画か，サーバーでも地図を作って確かめる．
 * 家や掲示板の場所に建てられないようにするため．
 */
async function canBuildAt(row: number, offset: number) {
  if (
    (row !== 0 && row !== 1) ||
    !Number.isInteger(offset) ||
    Math.abs(offset) > 100
  ) {
    return false;
  }

  const [characters, buildings] = await Promise.all([
    getCharacters(),
    getBuildings(),
  ]);

  const map = buildWorldMap(
    characters.map((character) => character.id),
    buildings,
  );

  return isBuildableLot(map, row, offset);
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

  if (!(await canBuildAt(row, offset))) {
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

// 建てた建物を，空いた区画へ移す（無料）
export async function moveBuildingAction(
  buildingId: string,
  row: number,
  offset: number,
): Promise<BuildingActionResult> {
  if (!isBuildingId(buildingId)) {
    return { ok: false, message: "建物が見つかりません" };
  }

  const userId = await getUserId();

  if (!(await canBuildAt(row, offset))) {
    return { ok: false, message: "ここには移せません" };
  }

  const { data, error } = await createAdminClient().rpc("move_building", {
    p_user_id: userId,
    p_building_id: buildingId,
    p_row: row,
    p_offset: offset,
  });

  if (error || data !== "ok") {
    console.error("Failed to move building:", error ?? data);
    return { ok: false, message: "移せませんでした" };
  }

  return done(`${BUILDING_CATALOG[buildingId].name}を移しました`);
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
