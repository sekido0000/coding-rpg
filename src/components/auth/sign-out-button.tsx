"use client";

import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/ui/spinner";

/*
 * ログアウトのフォームの中で使う送信ボタン．
 */
export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-wait"
    >
      {pending && <Spinner />}
      {pending ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
