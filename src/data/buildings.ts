import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isLotKey, type Placement } from "@/lib/buildings/catalog";

/*
 * 自分のワールドの建物の場所（建てた建物と，移した家・掲示板・雑貨店）．
 * RLSで本人の行だけが返るので，ユーザーを指定せずに取る．
 */
export async function getPlacements(): Promise<Placement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_buildings")
    .select("building_id, lot_row, lot_offset");

  // 場所が取れなくても，ワールドは（最初の並びで）表示する
  if (error) {
    console.error("Failed to fetch building placements:", error);
    return [];
  }

  return (data ?? []).flatMap((row) =>
    isLotKey(row.building_id) &&
    (row.lot_row === 0 || row.lot_row === 1)
      ? [
          {
            key: row.building_id,
            row: row.lot_row,
            offset: row.lot_offset,
          },
        ]
      : [],
  );
}
