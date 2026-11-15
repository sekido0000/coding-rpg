import "server-only";

import { isGearId } from "@/lib/battle/gear";
import type { OwnedGear } from "@/lib/battle/owned-gear";
import { createClient } from "@/lib/supabase/server";

/*
 * 作った武器・防具の一覧．
 * RLSで本人の行だけが返るので，ユーザーを指定せずに取る．
 * activeCharacterIds を渡すと，それ以外のキャラクター（連携を解除したリポジトリなど）に
 * 付いている装備は，付けていない扱いにする（ほかのキャラクターに付け替えられる）．
 */
export async function getOwnedGear(
  activeCharacterIds?: string[],
): Promise<OwnedGear[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_gear")
    .select("id, gear_id, level, character_id")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`装備の取得に失敗しました: ${error.message}`);
  }

  const active = activeCharacterIds ? new Set(activeCharacterIds) : null;

  return (data ?? []).flatMap((row) =>
    isGearId(row.gear_id)
      ? [
          {
            rowId: row.id as string,
            gearId: row.gear_id,
            level: row.level as number,
            characterId:
              row.character_id && (!active || active.has(row.character_id))
                ? (row.character_id as string)
                : null,
          },
        ]
      : [],
  );
}
