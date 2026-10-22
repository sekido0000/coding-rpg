"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Spinner } from "@/components/ui/spinner";

type RedirectLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  pendingText: string;
};

/*
 * GitHubなど別の画面へ移動するリンク．
 * 移動先の表示まで時間がかかるため，押した後は回転アイコンを表示する．
 */
export function RedirectLink({
  href,
  className,
  children,
  pendingText,
}: RedirectLinkProps) {
  const [isPending, setIsPending] =
    useState(false);

  useEffect(() => {
    /*
     * ブラウザの「戻る」でこの画面に戻った時に，
     * 移動中の表示が残らないようにする．
     */
    const reset = () => setIsPending(false);

    window.addEventListener("pageshow", reset);

    return () => {
      window.removeEventListener("pageshow", reset);
    };
  }, []);

  return (
    <a
      href={href}
      onClick={() => setIsPending(true)}
      aria-busy={isPending}
      className={className}
    >
      {isPending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </a>
  );
}
