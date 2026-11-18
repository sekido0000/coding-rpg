"use client";

import { useState, useTransition } from "react";

import {
  updateCharacterBadgeAction,
  updatePartyBadgeAction,
  type BadgeActionResult,
  type BadgeChange,
} from "@/app/actions/badge-actions";

type BadgePanelProps = {
  // party：パーティーのカード，character：キャラクター1体の小さいバッジ
  kind: "party" | "character";
  characterId?: string;
  // バッジの URL に使う文字列．出していない時は null
  token: string | null;
  // このサイトの URL の始まり（貼る文に入れる）
  origin: string;
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <div className="mt-1 flex gap-2">
        <input
          readOnly
          value={value}
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200"
        />
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setIsCopied(true);
            window.setTimeout(() => setIsCopied(false), 1500);
          }}
          className="shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-400"
        >
          {isCopied ? "コピーしました" : "コピー"}
        </button>
      </div>
    </div>
  );
}

/*
 * バッジを作る・貼る文をコピーする・URL を作り直す・止める．
 * バッジには名前やリポジトリ名は出さず，キャラクターの種類（進化した姿）とレベルだけを出す．
 */
export function BadgePanel({ kind, characterId, token, origin }: BadgePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<BadgeActionResult | null>(null);

  const change = (badgeChange: BadgeChange) => {
    if (
      badgeChange === "regenerate" &&
      !window.confirm("URL を作り直すと，今貼っているバッジは表示されなくなります．よろしいですか？")
    ) {
      return;
    }

    if (
      badgeChange === "disable" &&
      !window.confirm("バッジを止めると，今貼っているバッジは表示されなくなります．よろしいですか？")
    ) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result =
        kind === "party"
          ? await updatePartyBadgeAction(badgeChange)
          : await updateCharacterBadgeAction(characterId ?? "", badgeChange);
      setMessage(result);
    });
  };

  const imageUrl = token ? `${origin}/api/badge/${kind}/${token}.svg` : null;
  const alt = kind === "party" ? "Coding RPG のパーティー" : "Coding RPG のキャラクター";

  return (
    <div className="space-y-4">
      {imageUrl ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            {/* 外の README と同じ見え方を確かめるため，画像をそのまま表示する */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={alt} />
          </div>

          <CopyRow
            label="Markdown（GitHub の README など）"
            value={`[![${alt}](${imageUrl})](${origin})`}
          />
          <CopyRow
            label="HTML（個人のサイトなど）"
            value={`<a href="${origin}"><img src="${imageUrl}" alt="${alt}"></a>`}
          />
          <CopyRow label="画像の URL" value={imageUrl} />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => change("regenerate")}
              disabled={isPending}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-400 disabled:opacity-60"
            >
              URL を作り直す
            </button>
            <button
              type="button"
              onClick={() => change("disable")}
              disabled={isPending}
              className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:border-red-400 disabled:opacity-60"
            >
              バッジを止める
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => change("enable")}
          disabled={isPending}
          className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
        >
          {isPending ? "作っています…" : "バッジを作る"}
        </button>
      )}

      {message && (
        <p
          role="status"
          className={`text-sm font-semibold ${message.ok ? "text-emerald-300" : "text-red-300"}`}
        >
          {message.message}
        </p>
      )}

      <p className="text-xs leading-5 text-slate-500">
        バッジは誰でも見られる画像です．名前やリポジトリ名は出さず，キャラクターの種類とレベルだけを出します．
        育つと，絵も自動で変わります（反映まで30分ほどかかることがあります）．
      </p>
    </div>
  );
}
