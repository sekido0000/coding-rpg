"use server";

import { refresh, revalidatePath } from "next/cache";
import { after } from "next/server";

import {
  GEAR_CATALOG,
  getUpgradeCost,
  isGearId,
  isGearSlot,
} from "@/lib/battle/gear";
import { recordUsage } from "@/lib/analytics/record";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type GearActionResult = {
  ok: boolean;
  message: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function done(message: string): GearActionResult {
  revalidatePath("/workshop");
  revalidatePath("/battle");
  // 今開いているページも，最新の状態で表示し直す（Next.js 16 では明示が必要）
  refresh();

  return { ok: true, message };
}

const SPEND_ERRORS: Record<string, string> = {
  insufficient_gold: "ゴールドが足りません",
  insufficient_materials: "素材が足りません",
};

/*
 * 装備を作る．素材とゴールドはブラウザから受け取らず，サーバーの一覧（gear.ts）で決める．
 */
export async function craftGearAction(
  gearId: string,
): Promise<GearActionResult> {
  if (!isGearId(gearId)) {
    return { ok: false, message: "装備が見つかりません" };
  }

  const userId = await getUserId();
  const gear = GEAR_CATALOG[gearId];
  const { data, error } = await createAdminClient().rpc("craft_gear", {
    p_user_id: userId,
    p_gear_id: gearId,
    p_slot: gear.slot,
    p_gold: gear.recipe.gold,
    p_materials: gear.recipe.materials,
  });

  if (error) {
    console.error("Failed to craft gear:", error);
    return { ok: false, message: "作れませんでした．時間をおいて試してください" };
  }

  if (data !== "ok") {
    return { ok: false, message: SPEND_ERRORS[data] ?? "作れませんでした" };
  }

  return done(`${gear.name}を作りました！`);
}

// 装備を1段階強化する
export async function upgradeGearAction(
  rowId: string,
): Promise<GearActionResult> {
  if (typeof rowId !== "string" || !UUID_PATTERN.test(rowId)) {
    return { ok: false, message: "装備が見つかりません" };
  }

  const userId = await getUserId();

  // 今の段階と装備の種類は，DB から読む（RLS で自分の装備だけが返る）
  const supabase = await createClient();
  const { data: row, error: rowError } = await supabase
    .from("user_gear")
    .select("gear_id, level")
    .eq("id", rowId)
    .maybeSingle();

  if (rowError || !row || !isGearId(row.gear_id)) {
    return { ok: false, message: "装備が見つかりません" };
  }

  const nextLevel = (row.level as number) + 1;
  const cost = getUpgradeCost(row.gear_id, nextLevel);

  if (!cost) {
    return { ok: false, message: "これ以上は強化できません" };
  }

  const { data, error } = await createAdminClient().rpc("upgrade_gear", {
    p_user_id: userId,
    p_gear_row_id: rowId,
    p_next_level: nextLevel,
    p_gold: cost.gold,
    p_materials: cost.materials,
  });

  if (error) {
    console.error("Failed to upgrade gear:", error);
    return { ok: false, message: "強化できませんでした．時間をおいて試してください" };
  }

  if (data !== "ok") {
    return { ok: false, message: SPEND_ERRORS[data] ?? "強化できませんでした" };
  }

  return done(`${GEAR_CATALOG[row.gear_id].name}を +${nextLevel} に強化しました！`);
}

// 装備を付ける（rowId が null なら外す）
export async function equipGearAction(
  characterId: string,
  slot: string,
  rowId: string | null,
): Promise<GearActionResult> {
  if (
    typeof characterId !== "string" ||
    !UUID_PATTERN.test(characterId) ||
    !isGearSlot(slot) ||
    (rowId !== null && (typeof rowId !== "string" || !UUID_PATTERN.test(rowId)))
  ) {
    return { ok: false, message: "付けられませんでした" };
  }

  const userId = await getUserId();
  const { data, error } = await createAdminClient().rpc("equip_gear", {
    p_user_id: userId,
    p_character_id: characterId,
    p_slot: slot,
    p_gear_row_id: rowId,
  });

  if (error || data !== true) {
    console.error("Failed to equip gear:", error ?? data);
    return { ok: false, message: "付けられませんでした" };
  }

  // アプリの改善のための記録（付け替えた回数）
  after(() => recordUsage(userId, "decoration_change"));

  revalidatePath("/repositories", "layout");

  return done(rowId ? "装備を付けました" : "装備を外しました");
}
