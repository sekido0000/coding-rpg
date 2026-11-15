import { AppLogo } from "@/components/layout/app-logo";
import { TitleSelector } from "@/components/titles/title-selector";
import { PendingLink } from "@/components/ui/pending-link";
import { getTitleBoard } from "@/data/titles";
import { TITLE_AXES } from "@/lib/titles/catalog";

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
            村へ戻る
          </PendingLink>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">🏅 称号</h1>
          <p className="mt-2 text-sm text-slate-400">
            集めた称号から1つ選ぶと，村の画面の上に表示されます．もらった称号は消えません．
            （{earnedCount} / {totalCount} 個）
          </p>
        </div>

        <TitleSelector board={board} />
      </div>
    </main>
  );
}
