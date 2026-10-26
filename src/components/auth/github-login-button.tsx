"use client";

import Image from "next/image";
import { useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

type GitHubLoginButtonProps = {
  /*
   * ヘッダーなど狭い場所で使う時はcompactにする．
   */
  compact?: boolean;
};

export function GitHubLoginButton({
  compact = false,
}: GitHubLoginButtonProps) {
  const [isPending, setIsPending] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const handleLogin = async () => {
    setIsPending(true);
    setErrorMessage(null);

    const supabase = createClient();

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo:
            `${window.location.origin}/auth/callback`,
        },
      });

    if (error) {
      setErrorMessage(error.message);
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleLogin}
        disabled={isPending}
        // ログイン後の「リポジトリの追加・連携解除」と同じ緑にそろえる
        className={
          compact
            ? "inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-base font-bold text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:bg-emerald-300 disabled:cursor-wait disabled:bg-slate-600"
            : "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:bg-emerald-300 disabled:cursor-wait disabled:bg-slate-600"
        }
      >
        {isPending ? <Spinner /> : <GitHubMark />}
        {/*
         * compactの時，スマホではロゴと横に並べて収まるように
         * 「GitHubで」を省く（GitHubのマークで伝わる）．
         */}
        <span>
          <span
            className={
              compact ? "hidden sm:inline" : undefined
            }
          >
            {isPending ? "GitHubへ" : "GitHubで"}
          </span>
          {isPending ? "移動中..." : "ログイン"}
        </span>
      </button>

      {errorMessage && (
        <p
          role="alert"
          className="text-sm text-red-400"
        >
          ログインを開始できませんでした：
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/*
 * GitHubのロゴ（Invertocat）．
 * 公式サイト（brand.github.com）配布のSVGをそのまま使い，
 * ガイドラインに従って色や形は変えない（黒のみ）．
 */
function GitHubMark() {
  return (
    <Image
      src="/images/github-invertocat-black.svg"
      alt=""
      aria-hidden="true"
      width={98}
      height={96}
      unoptimized
      className="h-5 w-auto"
    />
  );
}
