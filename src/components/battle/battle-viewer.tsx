"use client";

import { DotGothic16 } from "next/font/google";
import Image from "next/image";
import { useEffect, useState } from "react";

import type { BattleActionResult } from "@/app/actions/battle-actions";
import type { BattleCharacter } from "@/components/battle/battle-arena";
import { BossSprite } from "@/components/battle/boss-sprite";
import { BOSS_CATALOG, MATERIAL_CATALOG } from "@/lib/battle/bosses";
import type { BattleHit, BattleUnit } from "@/lib/battle/simulate";
import { ROLE_CATALOG } from "@/lib/battle/stats";
import { getCharacterEvolution } from "@/lib/characters/catalog";

const pixelFont = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// 1つの行動を見せる時間（ミリ秒）
const STEP_MS = 1000;
const FAST_STEP_MS = 350;

function HpBar({
  hp,
  maxHp,
  shield,
  isBoss = false,
}: {
  hp: number;
  maxHp: number;
  shield: number;
  isBoss?: boolean;
}) {
  const rate = Math.max(0, hp / maxHp);
  const color =
    rate > 0.5 ? "bg-emerald-400" : rate > 0.25 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="w-full">
      <div
        className={`relative overflow-hidden rounded-full bg-slate-800 ${
          isBoss ? "h-3" : "h-2"
        }`}
        role="meter"
        aria-label="HP"
        aria-valuemin={0}
        aria-valuemax={maxHp}
        aria-valuenow={hp}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            isBoss ? "bg-red-500" : color
          }`}
          style={{ width: `${rate * 100}%` }}
        />
      </div>
      <p className="mt-0.5 text-[11px] text-slate-300">
        HP {hp} / {maxHp}
        {shield > 0 && <span className="ml-1 text-sky-300">🛡️{shield}</span>}
      </p>
    </div>
  );
}

// 受けたダメージや回復を，数字で浮かび上がらせる
function HitNumbers({ hits }: { hits: BattleHit[] }) {
  return (
    <span className="pointer-events-none absolute inset-x-0 -top-2 flex flex-wrap justify-center gap-1">
      {hits.map((hit, index) => {
        if (hit.kind === "damage") {
          return (
            <span
              key={index}
              className={`battle-float font-black drop-shadow ${
                hit.isCrit ? "text-xl text-amber-300" : "text-lg text-white"
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {hit.amount}
              {hit.isWeak && <span className="ml-0.5 text-xs text-amber-300">弱点</span>}
            </span>
          );
        }

        if (hit.kind === "heal" && hit.amount > 0) {
          return (
            <span key={index} className="battle-float text-lg font-black text-emerald-300 drop-shadow">
              +{hit.amount}
            </span>
          );
        }

        if (hit.kind === "shield" && hit.amount > 0) {
          return (
            <span key={index} className="battle-float text-sm font-black text-sky-300 drop-shadow">
              🛡️+{hit.amount}
            </span>
          );
        }

        if (hit.kind === "buff") {
          return (
            <span key={index} className="battle-float text-sm font-black text-amber-200 drop-shadow">
              ▲
            </span>
          );
        }

        if (hit.kind === "debuff") {
          return (
            <span key={index} className="battle-float text-sm font-black text-violet-300 drop-shadow">
              ▼
            </span>
          );
        }

        return null;
      })}
    </span>
  );
}

/*
 * 戦いの様子を，ログに沿って1行動ずつ再生する．
 * 結果はサーバーで決まっているので，ここでは見せるだけ．早送りや，結果まで飛ばすこともできる．
 */
export function BattleViewer({
  battle,
  characters,
  onClose,
}: {
  battle: Extract<BattleActionResult, { ok: true }>;
  characters: BattleCharacter[];
  onClose: () => void;
}) {
  const { result, reward, star } = battle;
  const boss = BOSS_CATALOG[battle.bossId];
  const [stepIndex, setStepIndex] = useState(-1);
  const [isFast, setIsFast] = useState(false);
  const lastIndex = result.steps.length - 1;
  const isFinished = stepIndex >= lastIndex;

  useEffect(() => {
    if (isFinished) {
      return;
    }

    const timer = setTimeout(
      () => setStepIndex((index) => index + 1),
      stepIndex < 0 ? 600 : isFast ? FAST_STEP_MS : STEP_MS,
    );

    return () => clearTimeout(timer);
  }, [stepIndex, isFinished, isFast]);

  const step = stepIndex >= 0 ? result.steps[stepIndex] : null;
  const hpOf = (unit: BattleUnit) => step?.hp[unit.id] ?? unit.maxHp;
  const shieldOf = (unit: BattleUnit) => step?.shields[unit.id] ?? 0;
  const hitsOn = (unit: BattleUnit) =>
    step?.hits.filter((hit) => hit.targetId === unit.id) ?? [];

  const bossUnit = result.units.find((unit) => unit.side === "boss")!;
  const partyUnits = result.units.filter((unit) => unit.side === "party");

  const imageOf = (unit: BattleUnit) =>
    characters.find((character) => character.id === unit.characterId)
      ?.imagePath ??
    getCharacterEvolution(unit.characterType!, unit.level ?? 1).imagePath;

  // 最近の行動（新しいものが下）
  const recentSteps = result.steps.slice(Math.max(0, stepIndex - 3), stepIndex + 1);

  const bossHits = hitsOn(bossUnit);
  const isBossHit = bossHits.some((hit) => hit.kind === "damage");

  return (
    <section
      aria-label="ボス戦"
      className={`${pixelFont.className} overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-violet-950 via-slate-950 to-slate-900`}
    >
      {/* 上の帯 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2 text-sm text-slate-200">
        <span className="flex items-center gap-2">
          <BossSprite bossId={battle.bossId} className="h-6 w-6" />
          {boss.name}{" "}
          <span className="text-amber-300">{"★".repeat(star)}</span>
        </span>
        <span>
          ターン {step?.round ?? 1}
        </span>
        {!isFinished && (
          <span className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsFast((value) => !value)}
              className="rounded-lg border border-white/20 px-2 py-0.5 text-xs hover:bg-white/10"
            >
              {isFast ? "ふつうの速さ" : "⏩ 早送り"}
            </button>
            <button
              type="button"
              onClick={() => setStepIndex(lastIndex)}
              className="rounded-lg border border-white/20 px-2 py-0.5 text-xs hover:bg-white/10"
            >
              結果まで飛ばす
            </button>
          </span>
        )}
      </div>

      {/* ボス．戦いが終わったら，勝ち負けと報酬をボスの場所に出す */}
      <div className="relative flex min-h-80 flex-col items-center gap-3 px-4 pb-4 pt-8">
        <div className="relative">
          <span
            key={isBossHit ? `hit-${stepIndex}` : "idle"}
            aria-hidden="true"
            className={`block ${
              hpOf(bossUnit) <= 0
                ? "battle-defeated"
                : isBossHit
                  ? "battle-shake"
                  : step?.actorId === "boss"
                    ? "battle-lunge-down"
                    : "battle-idle"
            }`}
          >
            <BossSprite
              bossId={battle.bossId}
              className="h-44 w-44 drop-shadow-[0_0_24px_rgba(139,92,246,0.45)]"
            />
          </span>
          <HitNumbers key={`boss-${stepIndex}`} hits={bossHits} />
        </div>
        <div className="w-full max-w-md">
          <HpBar
            hp={hpOf(bossUnit)}
            maxHp={bossUnit.maxHp}
            shield={0}
            isBoss
          />
        </div>

        {isFinished && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 p-4 text-center backdrop-blur-[2px]">
            {result.isWin ? (
              <>
                <p className="battle-result text-4xl font-black text-amber-300 drop-shadow">
                  勝利！
                </p>
                {reward ? (
                  <div className="mt-3 space-y-1 text-sm text-slate-100">
                    <p>{boss.name}を倒して，報酬を手に入れた！</p>
                    <p className="text-lg text-amber-200">💰 {reward.gold} G</p>
                    <p>
                      {reward.materials
                        .map(
                          ({ id, quantity }) =>
                            `${MATERIAL_CATALOG[id].icon} ${MATERIAL_CATALOG[id].name} ×${quantity}`,
                        )
                        .join("　")}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-300">
                    今週の★{star}の報酬は，もう受け取っています．
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="battle-result text-4xl font-black text-slate-200 drop-shadow">
                  {result.isTimeout ? "時間切れ…" : "敗北…"}
                </p>
                <p className="mt-3 text-sm text-slate-200">
                  {result.isTimeout
                    ? `${result.rounds}ターンで倒しきれませんでした．`
                    : "パーティーが全員倒れてしまいました．"}
                  負けても何度でも挑み直せます．
                </p>
                <p className="mt-2 max-w-xl text-sm text-amber-100/90">
                  💡 {boss.hint}
                </p>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-200"
            >
              ボス選びに戻る
            </button>
          </div>
        )}
      </div>

      {/* 行動の文 */}
      <div
        aria-live="polite"
        className="mx-4 min-h-28 rounded-2xl border-2 border-white/80 bg-slate-950/90 p-3 text-sm leading-6 text-white"
      >
        {recentSteps.length === 0 ? (
          <p>{boss.name}が現れた！</p>
        ) : (
          recentSteps.map((recent, index) => (
            <p
              key={stepIndex - recentSteps.length + 1 + index}
              className={index === recentSteps.length - 1 ? "" : "text-slate-400"}
            >
              {recent.text}
            </p>
          ))
        )}
      </div>

      {/* パーティー */}
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {partyUnits.map((unit) => {
          const hp = hpOf(unit);
          const hits = hitsOn(unit);
          const isActor = step?.actorId === unit.id;
          const isHit = hits.some((hit) => hit.kind === "damage");
          const role = unit.role ? ROLE_CATALOG[unit.role] : null;

          return (
            <div
              key={unit.id}
              className={`relative flex items-center gap-3 rounded-2xl border p-3 transition ${
                isActor
                  ? "border-amber-300 bg-amber-300/10"
                  : "border-white/10 bg-white/5"
              } ${hp <= 0 ? "opacity-40 grayscale" : ""}`}
            >
              <div className="relative shrink-0">
                <Image
                  key={isHit ? `hit-${stepIndex}` : isActor ? `act-${stepIndex}` : "idle"}
                  src={imageOf(unit)}
                  alt=""
                  width={56}
                  height={56}
                  className={`h-14 w-14 ${
                    isHit ? "battle-shake" : isActor ? "battle-lunge-up" : ""
                  }`}
                />
                <HitNumbers key={`${unit.id}-${stepIndex}`} hits={hits} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">
                  {unit.isHelper && "🤝 "}
                  {unit.name}
                  <span className="ml-1 text-xs text-slate-400">Lv{unit.level}</span>
                </p>
                {role && (
                  <p className="text-[11px] text-slate-400">
                    {role.icon} {role.name}
                  </p>
                )}
                <HpBar hp={hp} maxHp={unit.maxHp} shield={shieldOf(unit)} />
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
