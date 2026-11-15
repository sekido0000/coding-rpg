"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import {
  challengeBossAction,
  type BattleActionResult,
} from "@/app/actions/battle-actions";
import { BattleViewer } from "@/components/battle/battle-viewer";
import { BossSprite } from "@/components/battle/boss-sprite";
import { GearSelect } from "@/components/battle/gear-select";
import { useGearEquip } from "@/components/battle/use-gear-equip";
import { PendingLink } from "@/components/ui/pending-link";
import type { BattleStatus } from "@/data/battle";
import {
  BOSS_CATALOG,
  BOSS_IDS,
  BOSS_STARS,
  MATERIAL_CATALOG,
  MATERIAL_IDS,
  STAR_GUIDES,
  getBossReward,
  type BossId,
  type BossStar,
} from "@/lib/battle/bosses";
import {
  MAX_PARTY_SIZE,
  canUseHelpers,
  fillWithHelpers,
  recommendParty,
} from "@/lib/battle/party";
import { applyGearBonus } from "@/lib/battle/gear";
import { getEquippedGear, type OwnedGear } from "@/lib/battle/owned-gear";
import type { BattleMember } from "@/lib/battle/simulate";
import { describeSkill, getUnlockedSkills } from "@/lib/battle/skills";
import {
  ROLE_CATALOG,
  STAT_KEYS,
  STAT_LABELS,
  getCharacterStats,
  getRole,
} from "@/lib/battle/stats";
import { getCharacterEvolution } from "@/lib/characters/catalog";
import type { CharacterType } from "@/lib/characters/generated-types";

export type BattleCharacter = {
  id: string;
  name: string;
  characterType: CharacterType;
  level: number;
  imagePath: string;
};

function Stars({ count }: { count: number }) {
  return (
    <span aria-label={`★${count}`} className="tracking-tight text-amber-300">
      {"★".repeat(count)}
    </span>
  );
}

function RoleBadge({ characterType }: { characterType: CharacterType }) {
  const role = ROLE_CATALOG[getRole(characterType)];

  return (
    <span
      title={role.description}
      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-200"
    >
      {role.icon} {role.name}
    </span>
  );
}

/*
 * 出陣するパーティーの枠（大きめの四角）．
 * キャラクターが入っていれば押すと外せる．空いた枠には，助っ人が入るならその姿を薄く出す．
 */
function PartySlot({
  character,
  helper,
  onRemove,
  children,
}: {
  character?: BattleCharacter;
  helper?: BattleMember;
  onRemove: () => void;
  // 武器・防具を選ぶ欄
  children?: ReactNode;
}) {
  const box =
    "flex h-full min-h-52 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 text-center";

  if (character) {
    return (
      <div className={`${box} relative border-amber-300 bg-amber-300/10`}>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${character.name}をパーティーから外す`}
          className="group flex w-full flex-col items-center gap-1 rounded-xl p-1 transition hover:bg-amber-300/10"
        >
          <span className="absolute right-2 top-2 rounded-full bg-slate-950/70 px-1.5 text-xs text-slate-300 opacity-60 transition group-hover:opacity-100">
            ✕
          </span>
          <Image
            src={character.imagePath}
            alt=""
            width={112}
            height={112}
            className="h-20 w-20 sm:h-24 sm:w-24"
          />
          <span className="w-full truncate text-sm font-bold text-white">
            {character.name}
          </span>
          <span className="flex flex-wrap items-center justify-center gap-1 text-xs text-slate-300">
            Lv{character.level}
            <RoleBadge characterType={character.characterType} />
          </span>
        </button>
        <div className="mt-1 w-full space-y-1 text-left">{children}</div>
      </div>
    );
  }

  if (helper) {
    return (
      <div className={`${box} border-dashed border-slate-600 bg-slate-900/40`}>
        <Image
          src={getCharacterEvolution(helper.characterType, helper.level).imagePath}
          alt=""
          width={112}
          height={112}
          className="h-20 w-20 opacity-60 sm:h-24 sm:w-24"
        />
        <span className="w-full truncate text-sm font-bold text-slate-300">
          🤝 {helper.name}
        </span>
        <span className="text-xs text-slate-400">
          Lv{helper.level}（空いた枠に入ります）
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${box} border-dashed border-slate-700 bg-slate-900/40 text-sm text-slate-500`}
    >
      空き
      <span className="text-xs">下のキャラクターを押すと入ります</span>
    </div>
  );
}

/*
 * ボス戦の画面．ボス → ★ → パーティーの順に選んで挑む．
 * 挑むと，サーバーで計算した戦いの様子を BattleViewer で再生する．
 */
export function BattleArena({
  characters,
  status,
  gold,
  ownedGear,
}: {
  characters: BattleCharacter[];
  status: BattleStatus;
  gold: number;
  ownedGear: OwnedGear[];
}) {
  const router = useRouter();
  const [bossId, setBossId] = useState<BossId>(BOSS_IDS[0]);
  // まだ勝っていないいちばん低い★を最初に選んでおく
  const [star, setStar] = useState<BossStar>(
    BOSS_STARS.find((value) => !status.wins[value]) ?? 1,
  );
  const [partyIds, setPartyIds] = useState<string[]>(() =>
    recommendParty(characters, BOSS_IDS[0]),
  );
  const [battle, setBattle] = useState<
    Extract<BattleActionResult, { ok: true }> | null
  >(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const { shownGear, equip, message: equipMessage } = useGearEquip(ownedGear);
  const characterNames = Object.fromEntries(
    characters.map((character) => [character.id, character.name]),
  );

  const boss = BOSS_CATALOG[bossId];
  const isStarWon = Boolean(status.wins[star]);
  const party = partyIds
    .map((id) => characters.find((character) => character.id === id))
    .filter((character): character is BattleCharacter => Boolean(character));

  // 空いた枠に入る助っ人（★1〜★3 だけ）
  const helpers = fillWithHelpers(
    party.map((character) => ({
      id: character.id,
      name: character.name,
      characterType: character.characterType,
      level: character.level,
    })),
    star,
  ).filter((member) => member.isHelper);

  const togglePartyMember = (id: string) => {
    setMessage("");
    setPartyIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length >= MAX_PARTY_SIZE
          ? current
          : [...current, id],
    );
  };

  const challenge = () => {
    setMessage("");
    startTransition(async () => {
      const result = await challengeBossAction(bossId, star, partyIds);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setBattle(result);
    });
  };

  if (battle) {
    return (
      <BattleViewer
        battle={battle}
        characters={characters}
        onClose={() => {
          setBattle(null);
          // 勝った★や，もらったゴールド・素材を表示し直す
          router.refresh();
        }}
      />
    );
  }

  if (characters.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        まだキャラクターがいません．リポジトリを連携してキャラクターを作ると，ボスに挑めます．
      </p>
    );
  }

  const winCount = BOSS_STARS.filter((value) => status.wins[value]).length;

  return (
    <div className="space-y-8">
      {/* 今週の進み具合 */}
      <section
        aria-label="今週の進み具合"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
      >
        <p className="mr-2 text-sm font-bold text-white">
          今週の勝利 {winCount} / 5
        </p>
        {BOSS_STARS.map((value) => {
          const wonBoss = status.wins[value];

          return (
            <span
              key={value}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                wonBoss
                  ? "border-amber-300/50 bg-amber-300/15 text-amber-100"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              ★{value}
              {wonBoss ? (
                <>
                  <BossSprite bossId={wonBoss} className="h-5 w-5" />
                  勝利済み
                </>
              ) : (
                " 未挑戦"
              )}
            </span>
          );
        })}
      </section>

      {/* 1. ボスを選ぶ */}
      <section aria-labelledby="choose-boss">
        <h2 id="choose-boss" className="mb-3 text-lg font-black text-white">
          1. ボスを選ぶ
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BOSS_IDS.map((id) => {
            const isSelected = id === bossId;

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setBossId(id);
                  setMessage("");
                }}
                aria-pressed={isSelected}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${
                  isSelected
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                }`}
              >
                <BossSprite
                  bossId={id}
                  className={`h-20 w-20 ${isSelected ? "battle-idle" : ""}`}
                />
                <span className="text-sm font-bold text-white">
                  {BOSS_CATALOG[id].name}
                </span>
              </button>
            );
          })}
        </div>

        {/* 選んだボスの情報 */}
        <div className="mt-4 grid items-center gap-4 rounded-2xl border border-slate-800 bg-gradient-to-br from-violet-950/60 to-slate-900/60 p-4 sm:grid-cols-[auto_1fr]">
          <BossSprite
            bossId={bossId}
            className="battle-idle mx-auto h-36 w-36"
          />
          <div className="space-y-2">
            <p className="text-lg font-black text-white">{boss.name}</p>
            <p className="text-sm text-slate-300">{boss.description}</p>
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-white">おすすめの役割：</span>
              {boss.recommendedRoles
                .map((role) => `${ROLE_CATALOG[role].icon} ${ROLE_CATALOG[role].name}`)
                .join("・")}
            </p>
            <p className="text-sm text-amber-100/90">💡 {boss.hint}</p>
          </div>
        </div>
      </section>

      {/* 2. ★を選ぶ */}
      <section aria-labelledby="choose-star">
        <h2 id="choose-star" className="mb-3 text-lg font-black text-white">
          2. 強さ（★）を選ぶ
        </h2>
        <div className="grid gap-3 sm:grid-cols-5">
          {BOSS_STARS.map((value) => {
            const reward = getBossReward(bossId, value);
            const isWon = Boolean(status.wins[value]);
            const isSelected = value === star;

            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStar(value);
                  setMessage("");
                }}
                aria-pressed={isSelected}
                className={`relative flex flex-col gap-1.5 overflow-hidden rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                } ${isWon ? "opacity-70" : ""}`}
              >
                <Stars count={value} />
                <span className="text-xs leading-5 text-slate-300">
                  {STAR_GUIDES[value]}
                </span>
                <span className="text-xs font-semibold text-amber-200">
                  💰 {reward.gold} G
                </span>
                <span className="text-xs text-slate-300">
                  {reward.materials
                    .map(
                      ({ id, quantity }) =>
                        `${MATERIAL_CATALOG[id].icon}${MATERIAL_CATALOG[id].name}×${quantity}`,
                    )
                    .join(" ")}
                </span>
                <span className="text-[11px] text-slate-400">
                  {canUseHelpers(value) ? "🤝 助っ人あり" : "自分のキャラクターだけ"}
                </span>
                {isWon && (
                  <span className="battle-stamp absolute right-2 top-2 rounded-md border-2 border-red-500 px-1.5 py-0.5 text-xs font-black text-red-400">
                    勝利済み
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. パーティーを選ぶ */}
      <section aria-labelledby="choose-party">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="choose-party" className="text-lg font-black text-white">
            3. パーティーを選ぶ（{MAX_PARTY_SIZE}体まで）
          </h2>
          <button
            type="button"
            onClick={() => {
              setPartyIds(recommendParty(characters, bossId));
              setMessage("");
            }}
            className="rounded-xl border border-sky-300/40 bg-sky-300/10 px-3 py-1.5 text-sm font-semibold text-sky-100 transition hover:bg-sky-300/20"
          >
            🪄 おまかせ編成
          </button>
        </div>

        {/* 出陣するパーティー（3つの枠） */}
        <div className="mx-auto mb-5 grid max-w-2xl grid-cols-3 gap-3">
          {Array.from({ length: MAX_PARTY_SIZE }, (_, index) => {
            const character = party[index];
            const helper = character ? undefined : helpers[index - party.length];

            return (
              <PartySlot
                key={character?.id ?? `empty-${index}`}
                character={character}
                helper={helper}
                onRemove={() => character && togglePartyMember(character.id)}
              >
                {character &&
                  (["weapon", "armor"] as const).map((slot) => (
                    <GearSelect
                      key={slot}
                      owned={shownGear}
                      characterId={character.id}
                      slot={slot}
                      characterNames={characterNames}
                      onEquip={equip}
                      bossId={bossId}
                      compact
                    />
                  ))}
              </PartySlot>
            );
          })}
        </div>

        {/* 選べるキャラクター */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => {
            const isSelected = partyIds.includes(character.id);
            const isFull = !isSelected && partyIds.length >= MAX_PARTY_SIZE;
            // 付けている武器・防具の効果も足して表示する
            const stats = applyGearBonus(
              getCharacterStats(character.characterType, character.level),
              getEquippedGear(shownGear, character.id),
            );
            const skills = getUnlockedSkills(character.characterType, character.level);
            const role = getRole(character.characterType);

            return (
              <button
                key={character.id}
                type="button"
                onClick={() => togglePartyMember(character.id)}
                aria-pressed={isSelected}
                disabled={isFull}
                className={`flex gap-3 rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                }`}
              >
                <Image
                  src={character.imagePath}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0"
                />
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-white">
                      {character.name}
                    </span>
                    <span className="text-xs text-slate-400">Lv{character.level}</span>
                    <RoleBadge characterType={character.characterType} />
                    {boss.recommendedRoles.includes(role) && (
                      <span className="text-[11px] font-semibold text-emerald-300">
                        おすすめ
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[11px] font-semibold text-amber-300">
                        出陣中
                      </span>
                    )}
                  </span>
                  <span className="grid grid-cols-5 gap-1 text-center text-[10px] text-slate-400">
                    {STAT_KEYS.map((key) => (
                      <span key={key}>
                        <span className="block">{STAT_LABELS[key]}</span>
                        <span className="block text-xs font-bold text-slate-100">
                          {stats[key]}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span
                    className="block truncate text-[11px] text-slate-400"
                    title={skills
                      .map((skill) => `${skill.name}：${describeSkill(skill)}`)
                      .join("\n")}
                  >
                    技：{skills.map((skill) => skill.name).join("・")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 挑む（パーティー → ボス の絵で見せる） */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3">
          <p className="sr-only">
            {party.map((character) => character.name).join("・")}
            {helpers.length > 0 ? "と助っ人" : ""}で，{boss.name}の★{star}に挑む
          </p>
          <div className="flex -space-x-2">
            {party.map((character) => (
              <Image
                key={character.id}
                src={character.imagePath}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl border border-amber-300/60 bg-slate-800"
              />
            ))}
            {helpers.map((helper) => (
              <Image
                key={helper.id}
                src={getCharacterEvolution(helper.characterType, helper.level).imagePath}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl border border-dashed border-slate-500 bg-slate-800 opacity-60"
              />
            ))}
            {party.length === 0 && (
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-dashed border-slate-600 text-xs text-slate-500">
                ？
              </span>
            )}
          </div>
          <span aria-hidden="true" className="text-xl font-black text-red-400">
            ⚔️
          </span>
          <div className="flex items-center gap-2">
            <BossSprite bossId={bossId} className="h-12 w-12" />
            <Stars count={star} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(message || equipMessage) && (
            <p role="alert" className="text-sm font-semibold text-red-300">
              {message || equipMessage}
            </p>
          )}
          <button
            type="button"
            onClick={challenge}
            disabled={isPending || party.length === 0 || isStarWon}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {isPending
              ? "戦っています…"
              : isStarWon
                ? `今週の★${star}は勝利済み`
                : party.length === 0
                  ? "キャラクターを選んでください"
                  : "⚔️ 挑む"}
          </button>
        </div>
      </div>

      {/* 持ち物（所持金と素材） */}
      <section
        aria-labelledby="belongings"
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="belongings" className="text-lg font-black text-white">
            🎒 持ち物
          </h2>
          <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1 text-base font-bold text-amber-200">
            所持金 💰 {gold} G
          </p>
        </div>
        <p className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          素材はボスに勝つと手に入ります．工房で，武器や防具の材料になります．
          <PendingLink
            href="/workshop"
            className="rounded-lg border border-slate-600 px-2 py-1 font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
          >
            🔨 工房へ
          </PendingLink>
        </p>
        {MATERIAL_IDS.some((id) => status.materials[id]) ? (
          <ul className="flex flex-wrap gap-2">
            {MATERIAL_IDS.filter((id) => status.materials[id]).map((id) => (
              <li
                key={id}
                className={`rounded-xl border px-3 py-1.5 text-sm ${
                  MATERIAL_CATALOG[id].isRare
                    ? "border-violet-400/50 bg-violet-400/10 text-violet-100"
                    : "border-slate-700 bg-slate-900/60 text-slate-200"
                }`}
              >
                {MATERIAL_CATALOG[id].icon} {MATERIAL_CATALOG[id].name} ×
                {status.materials[id]}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">まだ素材を持っていません．</p>
        )}
      </section>
    </div>
  );
}
