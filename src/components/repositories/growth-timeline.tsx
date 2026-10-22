"use client";

import {
  COMMIT_CATEGORIES,
  getCommitCategoryFromEventType,
} from "@/lib/growth/xp";

type GrowthEvent = {
  id: string;
  event_type: string;
  xp: number | null;
  description: string;
  created_at: string;
};

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
                    <p className="mt-3 text-xs text-emerald-300">
                      +{event.xp} XP
                    </p>
                )}


                <p className="mt-2 text-xs text-slate-600">
                  {new Date(
                    event.created_at,
                  ).toLocaleString()}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
