"use client";

import { useEffect, useRef, useState } from "react";

import { signOutAction } from "@/app/actions/auth-actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { openFeedback } from "@/components/feedback/feedback-dialog";
import { PendingLink } from "@/components/ui/pending-link";

const itemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/10";

/*
 * 上の帯の「メニュー」．ゲームで毎日使うもの以外（称号・使い方・ご意見・ログアウト）をまとめる．
 * 帯が2行にならないよう，ここに入れる．外側を押すか Esc で閉じる．
 */
export function HeaderMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/10"
      >
        <span aria-hidden="true">☰</span>
        <span className="hidden xl:inline">メニュー</span>
        <span className="sr-only xl:hidden">メニュー</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl"
        >
          <PendingLink href="/titles" className={itemClass}>
            <span aria-hidden="true">🏅</span>
            称号
          </PendingLink>
          <PendingLink href="/how-to-use" className={itemClass}>
            <span aria-hidden="true">❔</span>
            使い方
          </PendingLink>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              openFeedback();
            }}
            className={itemClass}
          >
            <span aria-hidden="true">💬</span>
            ご意見を送る
          </button>
          <div className="my-1 border-t border-slate-800" />
          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </div>
      )}
    </div>
  );
}
