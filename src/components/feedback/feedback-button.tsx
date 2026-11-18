"use client";

import { usePathname } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  sendFeedbackAction,
  type FeedbackState,
} from "@/app/actions/feedback-actions";
import { Spinner } from "@/components/ui/spinner";
import {
  FEEDBACK_KINDS,
  FEEDBACK_KIND_LABELS,
  FEEDBACK_MAX_LENGTH,
} from "@/lib/feedback/kinds";

const ISSUES_URL = "https://github.com/sekido0000/coding-rpg/issues";

const INITIAL_STATE: FeedbackState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Spinner />}
      {pending ? "送っています…" : "送る"}
    </button>
  );
}

/*
 * ご意見を送るボタンとフォーム．
 * 送った時に開いていたページも一緒に送り，何の話か分かるようにする．
 */
export function FeedbackButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  // 送れたらフォームを空にする（key を変えて作り直す）
  const [formKey, setFormKey] = useState(0);
  const [length, setLength] = useState(0);
  const [state, formAction] = useActionState(
    async (previous: FeedbackState, formData: FormData) => {
      const result = await sendFeedbackAction(previous, formData);

      if (result.status === "success") {
        setFormKey((key) => key + 1);
        setLength(0);
      }

      return result;
    },
    INITIAL_STATE,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/10"
      >
        <span aria-hidden="true">💬</span>
        <span className="hidden sm:inline">ご意見</span>
        <span className="sr-only sm:hidden">ご意見</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="feedback-title"
        // 背景（dialog の外側）を押した時に閉じる
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        className="m-auto w-[min(92vw,520px)] rounded-2xl border border-slate-700 bg-slate-900 p-6 text-left text-slate-200 backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="feedback-title" className="text-lg font-black text-white">
            💬 ご意見
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="閉じる"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          不具合や「こうだったらいいのに」など，なんでも送ってください．
        </p>

        <form key={formKey} action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="page" value={pathname} />

          <fieldset>
            <legend className="text-sm font-medium text-slate-300">種類</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {FEEDBACK_KINDS.map((kind, index) => (
                <label
                  key={kind}
                  className="cursor-pointer rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-400/10 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-300"
                >
                  <input
                    type="radio"
                    name="kind"
                    value={kind}
                    defaultChecked={index === 0}
                    className="sr-only"
                  />
                  {FEEDBACK_KIND_LABELS[kind]}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="feedback-message"
              className="text-sm font-medium text-slate-300"
            >
              内容
            </label>
            <textarea
              id="feedback-message"
              name="message"
              required
              rows={5}
              maxLength={FEEDBACK_MAX_LENGTH}
              onChange={(event) => setLength(event.target.value.length)}
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white outline-none transition focus:border-emerald-400"
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {length} / {FEEDBACK_MAX_LENGTH}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              role="status"
              className={`text-sm font-semibold ${
                state.status === "error" ? "text-red-300" : "text-emerald-300"
              }`}
            >
              {state.message}
            </p>
            <SubmitButton />
          </div>
        </form>

        <p className="mt-5 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">
          GitHub の{" "}
          <a
            href={ISSUES_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sky-300 underline-offset-2 hover:underline"
          >
            Issues
          </a>{" "}
          でも受け付けています（誰でも見られる場所です）．
        </p>
      </dialog>
    </>
  );
}
