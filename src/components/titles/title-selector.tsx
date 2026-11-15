"use client";

import { useOptimistic } from "react";

import { selectTitleAction } from "@/app/actions/title-actions";
import { TitleBadge } from "@/components/titles/title-badge";
import type { TitleBoard } from "@/data/titles";
import {
  getTitleId,
  getTitleRank,
  TITLE_AXES,
} from "@/lib/titles/catalog";

type TitleSelectorProps = {
  board: TitleBoard;
};

/*
 * 称号の一覧と，表示する称号の選択．
 *
 * 押した瞬間に「表示中」を切り替え（楽観的更新），保存は裏で行う．
 * 保存に失敗した時は，元の表示に戻る．
 */
export function TitleSelector({ board }: TitleSelectorProps) {
  const [selectedTitleId, setOptimisticTitleId] = useOptimistic(
    board.selectedTitleId,
  );

  // フォームから呼ばれる．フォームの処理の中なので，楽観的な表示を使える
  async function select(titleId: string | null) {
    setOptimisticTitleId(titleId);

    const formData = new FormData();
    formData.set("titleId", titleId ?? "");

    try {
      await selectTitleAction(formData);
    } catch (error) {
      // 失敗した時は，処理が終わると自動で元の表示に戻る
      console.error("Failed to select title:", error);
    }
  }

  return (
    <>
      {selectedTitleId && (
        <form action={() => select(null)} className="-mt-5 mb-8">
          <button
            type="submit"
            className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
          >
            称号を表示しない
          </button>
        </form>
      )}

      <div className="space-y-6">
        {TITLE_AXES.map((axis) => {
          const value = board.stats[axis.id];
          const next = axis.stages.find(
            (stage) => value < stage.threshold,
          );

          return (
            <section
              key={axis.id}
              aria-labelledby={`title-axis-${axis.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2
                    id={`title-axis-${axis.id}`}
                    className="text-lg font-bold text-white"
                  >
                    {axis.label}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {axis.description}：いま {value} {axis.unit}
                  </p>
                </div>

                <p className="text-xs text-emerald-300">
                  {next
                    ? `次の称号まで あと ${next.threshold - value} ${axis.unit}`
                    : "すべて集めました！"}
                </p>
              </div>

              <ul className="flex flex-wrap gap-3">
                {axis.stages.map((stage, index) => {
                  const titleId = getTitleId(axis, stage);
                  const isEarned = titleId in board.earnedAt;
                  const isSelected = selectedTitleId === titleId;
                  const isNew = board.newTitleIds.includes(titleId);

                  return (
                    <li key={titleId}>
                      {isEarned ? (
                        <form action={() => select(titleId)}>
                          <button
                            type="submit"
                            disabled={isSelected}
                            aria-pressed={isSelected}
                            className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition ${
                              isSelected
                                ? "border-emerald-300/60 bg-emerald-400/10"
                                : "border-transparent hover:border-white/15 hover:bg-white/5"
                            }`}
                          >
                            {isNew && (
                              <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                NEW
                              </span>
                            )}
                            <TitleBadge
                              name={stage.name}
                              rank={getTitleRank(
                                index,
                                axis.stages.length,
                              )}
                            />
                            <span
                              className={`text-[11px] ${
                                isSelected
                                  ? "font-bold text-emerald-300"
                                  : "text-slate-500"
                              }`}
                            >
                              {isSelected
                                ? "表示中"
                                : `${stage.threshold} ${axis.unit}`}
                            </span>
                          </button>
                        </form>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 px-3 py-2.5">
                          <span className="inline-flex items-center rounded-full border border-dashed border-slate-700 px-3.5 py-1 text-sm text-slate-600">
                            ？？？
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {stage.threshold} {axis.unit}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
