"use server";

import { refresh, revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ITEM_CATALOG,
  isItemId,
  isItemSlot,
} from "@/lib/items/catalog";
import { grantTitles } from "@/lib/titles/grant-titles";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PurchaseState = {
  status: "idle" | "success" | "error";
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
 * 装備を1個買う．
 * 値段はブラウザから受け取らず，サーバーの一覧（catalog.ts）から決める．
 */
export async function purchaseItemAction(
  _previous: PurchaseState,
  formData: FormData,
): Promise<PurchaseState> {
  const itemId = formData.get("itemId");

  if (!isItemId(itemId)) {
    return { status: "error", message: "装備が見つかりません" };
  }

  const item = ITEM_CATALOG[itemId];
  const userId = await getUserId();

  const { data: remainingGold, error } = await createAdminClient().rpc(
    "purchase_item",
    {
      p_user_id: userId,
      p_item_id: item.id,
      p_price: item.price,
    },
  );

  if (error) {
    console.error("Failed to purchase item:", error);
    return {
      status: "error",
      message: "買えませんでした．時間をおいて試してください",
    };
  }

  if (remainingGold === null) {
    return { status: "error", message: "ゴールドが足りません" };
  }

  // お店の称号を渡す．失敗しても，買った装備はそのまま
  try {
    await grantTitles(createAdminClient(), userId);
  } catch (titleError) {
    console.error("Failed to grant titles:", titleError);
  }

  revalidatePath("/shop");
  revalidatePath("/");
  // 今開いているページも，最新の状態で表示し直す（Next.js 16 では明示が必要）
  refresh();

  return {
    status: "success",
    message: `${item.name}を買いました！`,
  };
}

/*
 * キャラクターに装備を付ける．itemId が空の時は外す．
 * 持っている個数を超えて付けられないかなどは，DB の関数（equip_item）で確かめる．
 */
export async function equipItemAction(
  formData: FormData,
): Promise<void> {
  const characterId = formData.get("characterId");
  const repositoryId = formData.get("repositoryId");
  const slot = formData.get("slot");
  const itemIdValue = formData.get("itemId");

  if (
    typeof characterId !== "string" ||
    !UUID_PATTERN.test(characterId) ||
    typeof repositoryId !== "string" ||
    !UUID_PATTERN.test(repositoryId) ||
    !isItemSlot(slot)
  ) {
    throw new Error("装備の指定が不正です");
  }

  const itemId = itemIdValue === "" ? null : itemIdValue;

  if (
    itemId !== null &&
    (!isItemId(itemId) || ITEM_CATALOG[itemId].slot !== slot)
  ) {
    throw new Error("装備の指定が不正です");
  }

  const userId = await getUserId();

  const { error } = await createAdminClient().rpc("equip_item", {
    p_user_id: userId,
    p_character_id: characterId,
    p_slot: slot,
    p_item_id: itemId,
  });

  if (error) {
    throw new Error(`装備を付けられませんでした: ${error.message}`);
  }

  revalidatePath(`/repositories/${repositoryId}`);
  revalidatePath("/");
  // 今開いているページも，最新の状態で表示し直す（Next.js 16 では明示が必要）
  refresh();
}
