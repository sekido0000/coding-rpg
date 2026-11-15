"use client";

import { useLinkStatus } from "next/link";

/*
 * キャラクターを押した後，詳細画面が開くまでのあいだに出す吹き出し．
 * 押せたことが分かるようにする．
 * useLinkStatus は Link の中で使う必要があるため，部品を分ける．
 */
export function CharacterLinkStatus() {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return (
    <span
      role="status"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg sm:text-sm"
    >
      ステータスを開いています…
      <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-emerald-400" />
    </span>
  );
}
