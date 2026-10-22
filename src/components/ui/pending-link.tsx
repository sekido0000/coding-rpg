"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

import { Spinner } from "@/components/ui/spinner";

type PendingLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  /*
   * 移動中に表示する文字．省略時は元の文字のまま．
   */
  pendingText?: string;
  /*
   * アイコンだけのボタンでは，移動中は回転アイコンだけを表示する．
   */
  spinnerOnly?: boolean;
  "aria-label"?: string;
};

/*
 * 移動中に回転アイコンを表示するLink．
 */
export function PendingLink({
  href,
  className,
  children,
  pendingText,
  spinnerOnly = false,
  "aria-label": ariaLabel,
}: PendingLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
    >
      <PendingContent
        pendingText={pendingText}
        spinnerOnly={spinnerOnly}
      >
        {children}
      </PendingContent>
    </Link>
  );
}

/*
 * useLinkStatusはLinkの内側で使う必要があるため，部品を分ける．
 */
function PendingContent({
  children,
  pendingText,
  spinnerOnly,
}: {
  children: ReactNode;
  pendingText?: string;
  spinnerOnly: boolean;
}) {
  const { pending } = useLinkStatus();

  if (!pending) {
    return children;
  }

  if (spinnerOnly) {
    return <Spinner />;
  }

  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner />
      {pendingText ?? children}
    </span>
  );
}
