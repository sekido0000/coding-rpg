"use client";

import { BattleProfile } from "@/components/battle/battle-profile";
import { GearSelect } from "@/components/battle/gear-select";
import { useGearEquip } from "@/components/battle/use-gear-equip";
import { PendingLink } from "@/components/ui/pending-link";
import { getEquippedGear, type OwnedGear } from "@/lib/battle/owned-gear";
import type { CharacterType } from "@/lib/characters/generated-types";

/*
 * キャラクターの詳細ページの「ボス戦のステータスと技」．
 * 武器・防具を付け替えると，ステータスの表示もすぐに変わる．
 */
export function CharacterGearPanel({
  character,
  ownedGear,
  characterNames,
}: {
  character: { id: string; characterType: CharacterType; level: number };
  ownedGear: OwnedGear[];
  characterNames: Record<string, string>;
}) {
  const { shownGear, equip, message } = useGearEquip(ownedGear);

  return (
    <BattleProfile
      characterType={character.characterType}
      level={character.level}
      gear={getEquippedGear(shownGear, character.id)}
    >
      <p className="text-sm font-semibold text-white">武器・防具</p>
      {(["weapon", "armor"] as const).map((slot) => (
        <GearSelect
          key={slot}
          owned={shownGear}
          characterId={character.id}
          slot={slot}
          characterNames={characterNames}
          onEquip={equip}
        />
      ))}
      {message && (
        <p role="alert" className="text-xs font-semibold text-red-300">
          {message}
        </p>
      )}
      <PendingLink
        href="/workshop"
        className="inline-block text-xs font-semibold text-sky-300 hover:text-sky-200"
      >
        🔨 工房で武器・防具を作る
      </PendingLink>
    </BattleProfile>
  );
}
