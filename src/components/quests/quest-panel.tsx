"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { TAB_CLASS } from "@/components/layout/tab-class";

// ワールドの掲示板などから，クエストのパネルを開く時に送る合図
export const OPEN_QUEST_PANEL_EVENT = "coding-rpg:open-quests";

export function openQuestPanel() {
  window.dispatchEvent(new Event(OPEN_QUEST_PANEL_EVENT));
}

type QuestPanelProps = {
  // 受け取り待ちの報酬がある時は，ボタンに「！」を付ける
  hasPendingRewards: boolean;
  // パネルの中身（サーバーで作った今週のクエスト）
  children: ReactNode;
};

/*
 * 今週のクエストを，ワールドの上に重ねて開くパネル．
 * dialog を使うので，Esc キーや背景のクリックで閉じられ，
 * 開いている間は後ろのワールドを操作できない．
 */
export function QuestPanel({
  hasPendingRewards,
  children,
}: QuestPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // ワールドの掲示板を押した時にも開く
  useEffect(() => {
    const open = () => dialogRef.current?.showModal();

    window.addEventListener(OPEN_QUEST_PANEL_EVENT, open);

    return () => {
      window.removeEventListener(OPEN_QUEST_PANEL_EVENT, open);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        // 上の帯のタブと同じ見た目にする
        className={TAB_CLASS}
      >
        <span aria-hidden="true">📜</span>
        クエスト

        {/* 受け取り待ちの報酬がある時の印（タブは横にスクロールするので，はみ出さないよう文字の横に置く） */}
        {hasPendingRewards && (
          <span
            className="grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-black text-white"
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
