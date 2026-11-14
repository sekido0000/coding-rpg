"use client";

import { useId, useRef } from "react";

type UnlinkRepositoryButtonProps = {
  repositoryName: string;
  githubInstallationId: number;
  compact?: boolean;
};

/*
 * リポジトリの連携を解除するボタン．
 *
 * 連携の解除はGitHubの設定画面で，そのリポジトリの選択を外して行う
 * （アプリの中だけで解除すると，GitHub App の読み取り権限が残るため）．
 * 押すと手順をダイアログで示し，そのインストールの設定画面へ移れるようにする．
 *
 * カードには，はみ出た部分を隠す指定（overflow-hidden）があるため，
 * 説明はカードの中ではなく，画面の一番手前に出る dialog 要素で表示する．
 */
export function UnlinkRepositoryButton({
  repositoryName,
  githubInstallationId,
  compact = false,
}: UnlinkRepositoryButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const settingsUrl =
    `https://github.com/settings/installations/${githubInstallationId}`;

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={
          compact
            ? "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10"
            : "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10"
        }
      >
        このリポジトリの連携を解除
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // ダイアログの外側（背景）を押した時も閉じる
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDialog();
          }
        }}
        className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-2xl border border-rose-500/30 bg-slate-900 p-0 text-left text-sm text-slate-300 shadow-2xl backdrop:bg-slate-950/70"
      >
        <div className="space-y-4 p-5">
          <h2
            id={titleId}
            className="text-base font-bold text-white"
          >
            連携を解除する
          </h2>

          <p className="leading-6">
            GitHubの設定画面で「
            <span className="break-all font-semibold text-white">
              {repositoryName}
            </span>
            」のチェックを外し，「Save」を押してください．
          </p>

          <p className="text-xs leading-5 text-slate-400">
            「All repositories」を選んでいる時は，「Only select
            repositories」に切り替えてから外してください．
            キャラクターと成長履歴は残り，もう一度選ぶと戻ってきます．
          </p>

          <div className="flex gap-2">
            <a
              href={settingsUrl}
              className="flex-1 rounded-xl bg-rose-500/90 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              GitHubの設定画面へ
            </a>

            <button
              type="button"
              onClick={closeDialog}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              やめる
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
