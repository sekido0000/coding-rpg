"use client";

import { useState } from "react";

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
 * 押すと手順を示し，そのインストールの設定画面へ移れるようにする．
 */
export function UnlinkRepositoryButton({
  repositoryName,
  githubInstallationId,
  compact = false,
}: UnlinkRepositoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const settingsUrl =
    `https://github.com/settings/installations/${githubInstallationId}`;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={
          compact
            ? "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10"
            : "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10"
        }
      >
        このリポジトリの連携を解除
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 space-y-3 rounded-2xl border border-rose-500/30 bg-slate-900 p-4 text-left text-sm text-slate-300 shadow-xl">
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
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              やめる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
