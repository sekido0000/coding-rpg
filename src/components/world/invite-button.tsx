"use client";

import { useRef } from "react";

import { RedirectLink } from "@/components/ui/redirect-link";

/*
 * 新しい仲間（キャラクター）を迎えるボタン．
 * キャラクターはリポジトリごとに生まれるので，GitHub でリポジトリを選んでもらう．
 * 押し間違えて GitHub へ移ってしまわないよう，先に確認を出す．
 */
export function InviteButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-xl bg-emerald-400 px-3 py-1.5 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-emerald-300"
      >
        ＋ 仲間を増やす
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="invite-title"
        // 背景（dialog の外側）を押した時に閉じる
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        className="m-auto w-[min(92vw,440px)] rounded-2xl border border-slate-700 bg-slate-900 p-6 text-left text-slate-200 backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm"
      >
        <h2 id="invite-title" className="text-lg font-black text-white">
          新しい仲間を迎える
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          キャラクターは，リポジトリごとに1体生まれます．
          GitHub の画面へ移動するので，育てたいリポジトリを選んでください．
        </p>
        <p className="mt-2 text-xs leading-6 text-slate-400">
          コードは読み取るだけで，書き換えることはありません．
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            やめる
          </button>
          <RedirectLink
            href="/github/install"
            pendingText="GitHubへ移動中..."
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          >
            GitHub へ進む
          </RedirectLink>
        </div>
      </dialog>
    </>
  );
}
