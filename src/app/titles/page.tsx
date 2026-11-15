import { selectTitleAction } from "@/app/actions/title-actions";
import { AppLogo } from "@/components/layout/app-logo";
import { TitleBadge } from "@/components/titles/title-badge";
import { PendingLink } from "@/components/ui/pending-link";
import { getTitleBoard } from "@/data/titles";
import {
  getTitleId,
  getTitleRank,
  TITLE_AXES,
} from "@/lib/titles/catalog";

export const dynamic = "force-dynamic";

/*
 * 称号の一覧．もらった称号から，表示する称号を1つ選べる．
 * もらっていない称号も条件を出して，次の目標にできるようにする．
 */
export default async function TitlesPage() {
  const board = await getTitleBoard();
  const earnedCount = Object.keys(board.earnedAt).length;
  const totalCount = TITLE_AXES.reduce(
    (total, axis) => total + axis.stages.length,
    0,
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />

          <PendingLink
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            ホームへ戻る
          </PendingLink>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">🏅 称号</h1>
          <p className="mt-2 text-sm text-slate-400">
            集めた称号から1つ選ぶと，ホームに表示されます．もらった称号は消えません．
            （{earnedCount} / {totalCount} 個）
          </p>

          {board.selectedTitleId && (
            <form action={selectTitleAction} className="mt-3">
              <input type="hidden" name="titleId" value="" />
              <button
                type="submit"
                className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
              >
                称号を表示しない
              </button>
            </form>
          )}
        </div>

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
                    const earnedAt = board.earnedAt[titleId];
                    const isSelected = board.selectedTitleId === titleId;
                    const isNew = board.newTitleIds.includes(titleId);

                    return (
                      <li key={titleId}>
                        {earnedAt ? (
                          <form action={selectTitleAction}>
                            <input
                              type="hidden"
                              name="titleId"
                              value={titleId}
                            />
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
                              <span className="text-[11px] text-slate-500">
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
      </div>
    </main>
  );
}
