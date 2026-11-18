"use client";

import { useOptimistic, useState, useTransition } from "react";

import { setAnalyticsOptOutAction } from "@/app/actions/analytics-actions";

/*
 * 「アプリの改善のための分析に使う」のスイッチ．押した瞬間に表示を切り替え，保存は裏で行う．
 */
export function AnalyticsSetting({ optOut }: { optOut: boolean }) {
  const [shownOptOut, setShownOptOut] = useOptimistic(optOut);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const isEnabled = !shownOptOut;

  const toggle = () => {
    const next = !shownOptOut;

    // 使わないにする時は，これまでの記録も消えることを確かめる
    if (
      next &&
      !window.confirm(
        "分析に使わないようにすると，これまでの記録（使い方の回数・使い始める前のコミットの集計）も消えます．よろしいですか？",
      )
    ) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      setShownOptOut(next);
      const result = await setAnalyticsOptOutAction(next);
      setMessage({ ok: result.ok, text: result.message });
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p id="analytics-label" className="font-semibold text-white">
          アプリの改善のための分析に使う
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          aria-labelledby="analytics-label"
          onClick={toggle}
          disabled={isPending}
          className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${
            isEnabled ? "bg-emerald-400" : "bg-slate-600"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
              isEnabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`text-sm font-semibold ${
            message.ok ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
