"use client";

import {
  BODY_BONUS_XP,
  COMMIT_CATEGORIES,
  getCommitCategoryFromEventType,
} from "@/lib/growth/xp";

type GrowthEvent = {
  id: string;
  event_type: string;
  xp: number | null;
  description: string;
  created_at: string;
  // 点数の内訳．内訳を保存する前の履歴では null
  category_xp?: number | null;
  size_xp?: number | null;
  body_xp?: number | null;
  is_vague?: boolean | null;
};

/*
 * コミットの点数の内訳と，次に点数を増やすためのヒント．
 * 内訳を保存する前の履歴では何も表示しない．
 */
function XpBreakdown({
  event,
  categoryLabel,
}: {
  event: GrowthEvent;
  categoryLabel: string;
}) {
  if (event.category_xp == null) {
    return null;
  }

  const parts = [
    `${categoryLabel} ${event.category_xp}`,
    ...(event.size_xp ? [`変更量 ${event.size_xp}`] : []),
    ...(event.body_xp ? [`理由 ${event.body_xp}`] : []),
  ];

  const hint = event.is_vague
    ? "何をしたか分かるメッセージにすると，点数が倍になり，ボーナスも付きます"
    : !event.body_xp
      ? `2行目以降に変更の理由を書くと +${BODY_BONUS_XP} XP`
      : null;

  return (
    <div className="mt-1 space-y-1 text-xs">
      <p className="text-slate-400">
        内訳：{parts.join(" ＋ ")}
        {event.is_vague && "（メッセージがあいまいなので半分）"}
      </p>

      {hint && (
        <p className="text-amber-200/80">💡 {hint}</p>
      )}
    </div>
  );
}

type GrowthTimelineProps = {
  growthEvents: GrowthEvent[];
};

export function GrowthTimeline({
  growthEvents,
}: GrowthTimelineProps) {
  return (
    <div className="mt-7 h-full min-h-0 overflow-y-auto pr-3 scrollbar-subtle">
      <div className="relative ml-3 border-l border-emerald-400/30 pl-6">
        {[...growthEvents]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .map((event) => {

          const isBirth =
            event.event_type === "birth";

          const isLevelUp =
            event.event_type === "level_up";

          // コミットの種類（新機能・修正など）
          const commitCategory =
            getCommitCategoryFromEventType(
              event.event_type,
            );

          const categoryInfo = commitCategory
            ? COMMIT_CATEGORIES[commitCategory]
            : null;

          return (
            <article
              key={event.id}
              className="relative pb-8"
            >
              <span
                className={`
                  absolute -left-[34px] top-1
                  grid h-5 w-5 place-items-center
                  rounded-full border
                  bg-slate-950 text-xs
                  ${
                    isBirth
                      ? "border-emerald-300"
                      : isLevelUp
                        ? "border-purple-300"
                        : "border-cyan-300"
                  }
                `}
              >
                {isBirth
                  ? "🌱"
                  : isLevelUp
                    ? "✨"
                    : categoryInfo?.icon ?? "⚡"}
              </span>


              <div
                className={`
                  rounded-xl border
                  bg-white/5 p-3
                  ${
                    isBirth
                      ? "border-emerald-400/30"
                      : isLevelUp
                        ? "border-purple-400/30"
                        : "border-cyan-400/30"
                  }
                `}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`
                      text-base font-black
                      ${
                        isBirth
                          ? "text-emerald-200"
                          : isLevelUp
                            ? "text-purple-200"
                            : "text-cyan-200"
                      }
                    `}
                  >
                    {isBirth
                      ? "🌱 キャラクターが誕生しました"
                      : isLevelUp
                        ? "✨ 進化しました"
                        : "⚡ 成長しました"}
                  </p>

                  {categoryInfo && (
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-xs font-semibold text-cyan-200">
                      {categoryInfo.label}
                    </span>
                  )}
                </div>


                <p className="mt-1 break-words text-sm leading-6 text-slate-300">
                  {event.description}
                </p>


                {!isBirth &&
                  !isLevelUp &&
                  event.xp !== null && (
                    <div className="mt-3">
                      <p className="text-xs text-emerald-300">
                        +{event.xp} XP
                      </p>

                      {categoryInfo && (
                        <XpBreakdown
                          event={event}
                          categoryLabel={categoryInfo.label}
                        />
                      )}
                    </div>
                )}


                <p className="mt-2 text-xs text-slate-600">
                  {/*
                   * 言語とタイムゾーンを固定し，サーバー（Vercel）と
                   * ブラウザで同じ文字になるようにする．
                   */}
                  {new Date(
                    event.created_at,
                  ).toLocaleString("ja-JP", {
                    timeZone: "Asia/Tokyo",
                  })}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
