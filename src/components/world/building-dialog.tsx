"use client";

import { useEffect, useRef, type ReactNode } from "react";

type BuildingDialogProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/*
 * 建物の中の様子を，ワールドの上に重ねて開く画面．
 * 表示された時に開き，Esc キー・✕・背景のクリックで閉じる．
 */
export function BuildingDialog({
  title,
  onClose,
  children,
}: BuildingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      // 背景（dialog の外側）を押した時に閉じる
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
      className="m-auto w-[min(94vw,960px)] rounded-2xl bg-transparent p-0 text-left backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl scrollbar-subtle sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="閉じる"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </dialog>
  );
}
