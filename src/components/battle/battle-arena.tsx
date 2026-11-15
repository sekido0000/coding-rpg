"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  challengeBossAction,
  type BattleActionResult,
} from "@/app/actions/battle-actions";
import { BattleViewer } from "@/components/battle/battle-viewer";
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
import {
  getUnlockedSkills,
  describeSkill,
} from "@/lib/battle/skills";
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
 * ボス戦の画面．ボス → ★ → パーティーの順に選んで挑む．
 * 挑むと，サーバーで計算した戦いの様子を BattleViewer で再生する．
 */
export function BattleArena({
  characters,
  status,
}: {
  characters: BattleCharacter[];
  status: BattleStatus;
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

  const boss = BOSS_CATALOG[bossId];
  const isStarWon = Boolean(status.wins[star]);
  const party = partyIds
    .map((id) => characters.find((character) => character.id === id))
    .filter((character): character is BattleCharacter => Boolean(character));

  // 空いた枠に入る助っ人（表示用）
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
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                wonBoss
                  ? "border-amber-300/50 bg-amber-300/15 text-amber-100"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              ★{value}{" "}
              {wonBoss
                ? `勝利済み（${BOSS_CATALOG[wonBoss].icon} ${BOSS_CATALOG[wonBoss].name}）`
                : "未挑戦"}
            </span>
          );
        })}
      </section>

      {/* 1. ボスを選ぶ */}
      <section aria-labelledby="choose-boss">
        <h2 id="choose-boss" className="mb-3 text-lg font-black text-white">
          1. ボスを選ぶ
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BOSS_IDS.map((id) => {
            const definition = BOSS_CATALOG[id];
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
                className={`flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                }`}
              >
                <span className="text-3xl" aria-hidden="true">
                  {definition.icon}
                </span>
                <span className="text-sm font-bold text-white">
                  {definition.name}
                </span>
                <span className="flex flex-wrap gap-1">
                  {definition.traits.slice(0, 2).map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                    >
                      {trait}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {/* 選んだボスの情報 */}
        <div className="mt-4 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-[auto_1fr]">
          <span
            aria-hidden="true"
            className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-900 to-slate-950 text-5xl"
          >
            {boss.icon}
          </span>
          <div className="space-y-2">
            <p className="text-lg font-black text-white">{boss.name}</p>
            <p className="text-sm text-slate-300">{boss.description}</p>
            <ul className="flex flex-wrap gap-1.5">
              {boss.traits.map((trait) => (
                <li
                  key={trait}
                  className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-xs text-violet-100"
                >
                  {trait}
                </li>
              ))}
            </ul>
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

        {/* 選んだパーティー */}
        <div className="mb-4 flex flex-wrap gap-2">
          {party.map((character) => (
            <span
              key={character.id}
              className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-300/10 px-2 py-1 text-sm text-white"
            >
              <Image
                src={character.imagePath}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
              />
              {character.name} Lv{character.level}
            </span>
          ))}
          {helpers.map((helper) => (
            <span
              key={helper.id}
              className="flex items-center gap-2 rounded-xl border border-dashed border-slate-600 px-2 py-1 text-sm text-slate-300"
            >
              <Image
                src={getCharacterEvolution(helper.characterType, helper.level).imagePath}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 opacity-80"
              />
              🤝 {helper.name} Lv{helper.level}
            </span>
          ))}
          {party.length === 0 && (
            <span className="text-sm text-slate-400">
              下からキャラクターを選んでください
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => {
            const isSelected = partyIds.includes(character.id);
            const isFull = !isSelected && partyIds.length >= MAX_PARTY_SIZE;
            const stats = getCharacterStats(character.characterType, character.level);
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

      {/* 挑む */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur">
        <p className="text-sm text-slate-200">
          {boss.icon} {boss.name} <Stars count={star} /> に{" "}
          {party.length > 0
            ? `${party.map((character) => character.name).join("・")}${
                helpers.length > 0 ? "（＋助っ人）" : ""
              }`
            : "…"}
          で挑む
        </p>
        <div className="flex items-center gap-3">
          {message && (
            <p role="alert" className="text-sm font-semibold text-red-300">
              {message}
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
                : "⚔️ 挑む"}
          </button>
        </div>
      </div>

      {/* 持っている素材 */}
      <section aria-labelledby="materials">
        <h2 id="materials" className="mb-1 text-lg font-black text-white">
          🎒 持っている素材
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          ボスに勝つと手に入ります．これから作る工房で，武器や防具の材料になります．
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
