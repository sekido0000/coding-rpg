"use client";

import { useState, useTransition } from "react";

import type { BuildingActionResult } from "@/app/actions/building-actions";
import { BUILDING_EXTERIORS } from "@/components/world/buildings";
import {
  BUILDING_CATALOG,
  BUILDING_IDS,
  getDemolishRefund,
  isBuildingId,
  type LotKey,
  type BuildingId,
} from "@/lib/buildings/catalog";

// 建物の外の絵を，枠に収まるように小さく見せる
function BuildingPreview({ buildingId }: { buildingId: BuildingId }) {
  const Exterior = BUILDING_EXTERIORS[buildingId];

  return (
    <div className="grid h-28 place-items-center overflow-hidden rounded-xl bg-gradient-to-b from-emerald-900/60 to-emerald-950">
      <div className="origin-center scale-[0.6]">
        <Exterior />
      </div>
    </div>
  );
}

type BuildMenuProps = {
  gold: number;
  // すでに建てた建物（同じ建物は1つだけ）
  builtIds: Set<BuildingId>;
  onBuild: (buildingId: BuildingId) => Promise<BuildingActionResult>;
};

/*
 * 空いた区画に建てる建物を選ぶ．
 * 建てている間は押せないようにして，続けて押しても1回だけ建てる．
 */
export function BuildMenu({ gold, builtIds, onBuild }: BuildMenuProps) {
  const [isPending, startTransition] = useTransition();
  const [buildingNow, setBuildingNow] = useState<BuildingId | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-300">
          同じ建物は1つずつ建てられます．建てた建物は，あとから移したり取り壊したりできます．
        </p>
        <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-200">
          所持金 💰 {gold} G
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-300">
          {error}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {BUILDING_IDS.map((id) => {
          const building = BUILDING_CATALOG[id];
          const isBuilt = builtIds.has(id);
          const canAfford = gold >= building.price;

          return (
            <li
              key={id}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-3"
            >
              <BuildingPreview buildingId={id} />
              <h3 className="mt-2 font-bold text-white">
                {building.icon} {building.name}
              </h3>
              <p className="mt-1 flex-1 text-xs leading-5 text-slate-400">
                {building.description}
              </p>

              <button
                type="button"
                disabled={isBuilt || !canAfford || isPending}
                onClick={() => {
                  setError(null);
                  setBuildingNow(id);
                  startTransition(async () => {
                    const result = await onBuild(id);

                    if (!result.ok) {
                      setError(result.message);
                    }

                    setBuildingNow(null);
                  });
                }}
                className="mt-2 w-full rounded-xl bg-amber-300 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {isBuilt
                  ? "建てました"
                  : buildingNow === id
                    ? "建てています..."
                    : canAfford
                      ? `💰 ${building.price} G で建てる`
                      : `ゴールドが足りません（${building.price} G）`}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type ManageLotProps = {
  lotKey: LotKey;
  onMove: () => void;
  // 取り壊せる建物（建てた建物）の時だけ渡す
  onDemolish?: () => Promise<BuildingActionResult>;
};

/*
 * 建物を移すか，取り壊すかを選ぶ．
 * 家・掲示板・雑貨店は移すだけ．建てた建物は取り壊すこともでき，
 * その時は戻ってくるゴールドを見せて確認してから行う．
 */
export function ManageLot({ lotKey, onMove, onDemolish }: ManageLotProps) {
  const buildingId = isBuildingId(lotKey) ? lotKey : null;
  const refund = buildingId ? getDemolishRefund(buildingId) : 0;
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className={
        buildingId ? "grid gap-4 sm:grid-cols-[200px_1fr]" : "space-y-3"
      }
    >
      {buildingId && <BuildingPreview buildingId={buildingId} />}

      <div className="space-y-3">
        <p className="text-sm text-slate-300">
          {buildingId
            ? BUILDING_CATALOG[buildingId].description
            : "空いている区画へ移せます．ドラッグして移すこともできます．"}
        </p>

        {error && (
          <p role="alert" className="text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        {isConfirming && buildingId && onDemolish ? (
          <div className="space-y-3 rounded-xl border border-red-400/40 bg-red-500/10 p-3">
            <p className="text-sm font-bold text-red-100">
              本当に{BUILDING_CATALOG[buildingId].name}を取り壊しますか？
            </p>
            <p className="text-xs text-red-100/80">
              建てた時の半分の {refund} G が戻ります．
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await onDemolish();

                    if (!result.ok) {
                      setError(result.message);
                    }
                  })
                }
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-60"
              >
                {isPending ? "取り壊しています..." : "取り壊す"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsConfirming(false)}
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
              >
                やめる
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onMove}
              className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
            >
              ↔ 移す（無料）
            </button>
            {onDemolish && (
              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                className="rounded-xl border border-red-400/50 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
              >
                取り壊す（{refund} G 戻る）
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
