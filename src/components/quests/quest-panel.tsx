"use client";

import { useRef, type ReactNode } from "react";

type QuestPanelProps = {
  // 受け取り待ちの報酬がある時は，ボタンに「！」を付ける
  hasPendingRewards: boolean;
  // パネルの中身（サーバーで作った今週のクエスト）
  children: ReactNode;
};

/*
 * 今週のクエストを，村の上に重ねて開くパネル．
 * dialog を使うので，Esc キーや背景のクリックで閉じられ，
 * 開いている間は後ろの村を操作できない．
 */
export function QuestPanel({
  hasPendingRewards,
  children,
}: QuestPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="relative flex items-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-sm font-semibold text-amber-200 transition hover:border-amber-200/60 hover:bg-amber-300/20"
      >
        <span aria-hidden="true">📜</span>
        <span className="hidden sm:inline">クエスト</span>
        <span className="sr-only sm:hidden">クエスト</span>

        {hasPendingRewards && (
          <span
            className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-black text-white"
            aria-label="受け取り待ちの報酬があります"
          >
            !
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        aria-label="今週のクエスト"
        // 背景（dialog の外側）を押した時に閉じる
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        className="m-auto w-[min(92vw,760px)] rounded-2xl bg-transparent p-0 text-left backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="閉じる"
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>

          {children}
        </div>
      </dialog>
    </>
  );
}
