"use server";

import { refresh } from "next/cache";
import { after } from "next/server";

import { getCharacters } from "@/data/characters";
import { recordUsage } from "@/lib/analytics/record";
import { createBadgeToken } from "@/lib/badges/token";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/*
 * バッジの出し方を変える．
 * - enable：出す（URL を作る）
 * - regenerate：URL を作り直す（前の URL は使えなくなる）
 * - disable：止める（URL を消す）
 */
export type BadgeChange = "enable" | "regenerate" | "disable";

export type BadgeActionResult = {
  ok: boolean;
  message: string;
};

const MESSAGES: Record<BadgeChange, string> = {
  enable: "バッジを作りました",
  regenerate: "URL を作り直しました．前の URL は使えなくなりました",
  disable: "バッジを止めました",
};

function isBadgeChange(value: unknown): value is BadgeChange {
  return value === "enable" || value === "regenerate" || value === "disable";
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

function done(userId: string, change: BadgeChange): BadgeActionResult {
  if (change === "enable") {
    // アプリの改善のための記録（バッジを作った回数）
    after(() => recordUsage(userId, "badge_enable"));
  }

  refresh();

  return { ok: true, message: MESSAGES[change] };
}

// パーティーのカード（キャラクター全員）
export async function updatePartyBadgeAction(
  change: BadgeChange,
): Promise<BadgeActionResult> {
  if (!isBadgeChange(change)) {
    return { ok: false, message: "変えられませんでした" };
  }

  const userId = await getUserId();

  if (!userId) {
    return { ok: false, message: "ログインが必要です" };
  }

  const { error } = await createAdminClient()
    .from("user_profiles")
    .upsert(
      {
        user_id: userId,
        party_badge_token: change === "disable" ? null : createBadgeToken(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("Failed to update party badge:", error);
    return { ok: false, message: "変えられませんでした．時間をおいて試してください" };
  }

  return done(userId, change);
}

// キャラクター1体の小さいバッジ
export async function updateCharacterBadgeAction(
  characterId: string,
  change: BadgeChange,
): Promise<BadgeActionResult> {
  if (typeof characterId !== "string" || !isBadgeChange(change)) {
    return { ok: false, message: "変えられませんでした" };
  }

  const userId = await getUserId();

  if (!userId) {
    return { ok: false, message: "ログインが必要です" };
  }

  // 自分の（連携中のリポジトリの）キャラクターだけ
  const characters = await getCharacters();

  if (!characters.some((character) => character.id === characterId)) {
    return { ok: false, message: "キャラクターが見つかりません" };
  }

  const { error } = await createAdminClient()
    .from("characters")
    .update({ badge_token: change === "disable" ? null : createBadgeToken() })
    .eq("id", characterId);

  if (error) {
    console.error("Failed to update character badge:", error);
    return { ok: false, message: "変えられませんでした．時間をおいて試してください" };
  }

  return done(userId, change);
}
