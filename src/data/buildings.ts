import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  isBuildingId,
  type PlacedBuilding,
} from "@/lib/buildings/catalog";

/*
 * 自分がワールドに建てた建物と，その場所．
 * RLSで本人の行だけが返るので，ユーザーを指定せずに取る．
 */
export async function getBuildings(): Promise<PlacedBuilding[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_buildings")
    .select("building_id, lot_row, lot_offset");

  // 建物が出せなくても，ワールドは表示する
  if (error) {
    console.error("Failed to fetch buildings:", error);
    return [];
  }

  return (data ?? []).flatMap((row) =>
    isBuildingId(row.building_id) &&
    (row.lot_row === 0 || row.lot_row === 1)
      ? [
          {
            buildingId: row.building_id,
            row: row.lot_row,
            offset: row.lot_offset,
          },
        ]
      : [],
  );
}
