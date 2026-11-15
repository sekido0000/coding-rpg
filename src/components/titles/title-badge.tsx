import type { TitleRank } from "@/lib/titles/catalog";

type TitleBadgeProps = {
  name: string;
  rank: TitleRank;
  size?: "sm" | "md";
};

const RANK_LABELS: Record<TitleRank, string> = {
  bronze: "銅",
  silver: "銀",
  gold: "金",
  rainbow: "虹",
};

/*
 * 称号の札．格が上がるほど豪華にする．
 * 銅：銅色の枠
 * 銀：銀色のグラデーションと ✦ の飾り
 * 金：金色のグラデーション，ふんわり光り，ときどき光の筋が横切る
 * 虹：虹色の枠が流れ，まわりで星がまたたき，強めに光る
 */
export function TitleBadge({
  name,
  rank,
  size = "md",
}: TitleBadgeProps) {
  const sizeClass =
    size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3.5 py-1 text-sm";

  const label = (
    <span className="sr-only">（{RANK_LABELS[rank]}の称号）</span>
  );

  switch (rank) {
    case "bronze":
      return (
        <span
          className={`inline-flex items-center rounded-full border border-orange-700/80 bg-orange-950/60 font-bold text-orange-200 ${sizeClass}`}
        >
          {name}
          {label}
        </span>
      );

    case "silver":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-slate-300/70 bg-[linear-gradient(135deg,#475569,#94a3b8_50%,#475569)] font-bold text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.5)] ${sizeClass}`}
        >
          <span aria-hidden="true">✦</span>
          {name}
          {label}
        </span>
      );

    case "gold":
      return (
        <span
          className={`title-shine relative inline-flex items-center gap-1 overflow-hidden rounded-full border border-amber-200 bg-[linear-gradient(135deg,#b45309,#fbbf24_45%,#fde68a_55%,#b45309)] font-black text-amber-950 shadow-[0_0_12px_rgba(251,191,36,0.55)] ${sizeClass}`}
        >
          <span aria-hidden="true">✦</span>
          {name}
          <span aria-hidden="true">✦</span>
          {label}
        </span>
      );

    case "rainbow":
      return (
        <span className="relative inline-flex">
          {/* まわりでまたたく星 */}
          <span
            aria-hidden="true"
            className="aura-twinkle absolute -left-1.5 -top-1.5 text-xs text-yellow-100"
          >
            ✦
          </span>
          <span
            aria-hidden="true"
            className="aura-twinkle absolute -bottom-1.5 -right-1 text-[10px] text-pink-100 [animation-delay:0.6s]"
          >
            ✦
          </span>

          {/* 流れる虹色の枠 */}
          <span className="title-rainbow rounded-full p-[2px] shadow-[0_0_16px_rgba(167,139,250,0.7)]">
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-slate-950 font-black text-white ${sizeClass}`}
            >
              <span aria-hidden="true">🌈</span>
              {name}
              {label}
            </span>
          </span>
        </span>
      );
  }
}
