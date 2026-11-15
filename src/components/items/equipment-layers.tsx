import type { ReactNode } from "react";

import { AuraEffect } from "@/components/items/aura-effect";
import { CompanionSprite } from "@/components/items/companion-sprite";
import type { ItemId } from "@/lib/items/catalog";

type EquipmentLayersProps = {
  companionItem: ItemId | null;
  auraItem: ItemId | null;
  /*
   * おともを置く側．おともはキャラクターの方を向く
   * （左に置くと右を向き，右に置くと左を向く）．
   * リポジトリワールドでは，歩く向きの後ろについていくように切り替える．
   */
  companionSide?: "left" | "right";
  // キャラクターの絵
  children: ReactNode;
};

/*
 * キャラクターの絵に，装備（足元・おとも）を重ねる．
 * 足元は絵の後ろ，おともは絵の手前の足元あたりに置く．
 * 大きさは絵の幅に合わせて伸び縮みする．
 */
export function EquipmentLayers({
  companionItem,
  auraItem,
  companionSide = "right",
  children,
}: EquipmentLayersProps) {
  if (!companionItem && !auraItem) {
    return <>{children}</>;
  }

  const isLeft = companionSide === "left";

  return (
    <span className="relative inline-block align-bottom">
      {auraItem && <AuraEffect itemId={auraItem} />}

      <span className="relative z-10 block">{children}</span>

      {companionItem && (
        <span
          className={`pointer-events-none absolute bottom-[3%] z-20 w-[34%] ${
            isLeft ? "-left-[24%]" : "-right-[24%]"
          }`}
        >
          <span className="companion-bob block">
            <CompanionSprite
              itemId={companionItem}
              className={`w-full drop-shadow-[0_3px_2px_rgba(0,0,0,0.45)] ${
                isLeft ? "" : "-scale-x-100"
              }`}
            />
          </span>
        </span>
      )}
    </span>
  );
}
