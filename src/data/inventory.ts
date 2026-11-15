import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  isItemId,
  toItemId,
  type ItemId,
} from "@/lib/items/catalog";

export type InventoryItem = {
  quantity: number;
  // この装備を付けているキャラクター
  equippedCharacterIds: string[];
};

export type Inventory = {
  gold: number;
  items: Partial<Record<ItemId, InventoryItem>>;
};

/*
 * 持っているゴールドと装備，それぞれの装備を付けているキャラクター．
 * RLSで本人の行だけが返るので，ユーザーを指定せずに取る．
 */
export async function getInventory(): Promise<Inventory> {
  const supabase = await createClient();

  const [wallet, userItems, characters] = await Promise.all([
    supabase.from("user_wallets").select("gold").maybeSingle(),
    supabase.from("user_items").select("item_id, quantity"),
    // 連携を解除したリポジトリのキャラクターは数えない（付けたままでも，ほかのキャラクターに付けられる）
    supabase
      .from("characters")
      .select(
        "id, companion_item, aura_item, repositories!inner(is_active)",
      )
      .eq("repositories.is_active", true),
  ]);

  for (const result of [wallet, userItems, characters]) {
    if (result.error) {
      throw new Error(
        `持ち物の取得に失敗しました: ${result.error.message}`,
      );
    }
  }

  const items: Inventory["items"] = {};

  for (const row of userItems.data ?? []) {
    if (isItemId(row.item_id)) {
      items[row.item_id] = {
        quantity: row.quantity,
        equippedCharacterIds: [],
      };
    }
  }

  for (const character of characters.data ?? []) {
    for (const itemId of [
      toItemId(character.companion_item, "companion"),
      toItemId(character.aura_item, "aura"),
    ]) {
      if (itemId && items[itemId]) {
        items[itemId].equippedCharacterIds.push(character.id);
      }
    }
  }

  return {
    gold: wallet.data?.gold ?? 0,
    items,
  };
}
