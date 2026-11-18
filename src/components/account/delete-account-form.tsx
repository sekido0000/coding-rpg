"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  deleteAccountAction,
  type DeleteAccountState,
} from "@/app/actions/account-actions";
import { DELETE_CONFIRMATION } from "@/lib/account/delete";
import { Spinner } from "@/components/ui/spinner";

function DeleteButton({ isReady }: { isReady: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={!isReady || pending}
      className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
    >
      {pending && <Spinner />}
      {pending ? "消しています…" : "データを全部消す"}
    </button>
  );
}

/*
 * データを全部消すフォーム．「削除する」と入力するまでボタンを押せないようにする．
 */
export function DeleteAccountForm() {
  const [state, formAction] = useActionState<DeleteAccountState, FormData>(
    deleteAccountAction,
    { message: "" },
  );
  const [confirm, setConfirm] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="delete-confirm"
          className="text-sm font-medium text-slate-300"
        >
          確認のため「{DELETE_CONFIRMATION}」と入力してください
        </label>
        <input
          id="delete-confirm"
          name="confirm"
          type="text"
          autoComplete="off"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-2 w-full max-w-xs rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none transition focus:border-red-400"
        />
      </div>

      {state.message && (
        <p role="alert" className="text-sm font-semibold text-red-300">
          {state.message}
        </p>
      )}

      <DeleteButton isReady={confirm === DELETE_CONFIRMATION} />
    </form>
  );
}
