import type { ItemId } from "@/lib/items/catalog";

/*
 * 足元の装備の見た目．
 * キャラクターの絵を包む要素（position: relative）の中に置き，
 * 絵より後ろ（z-0）に表示する．大きさは絵の幅に合わせて伸び縮みする．
 */
type AuraEffectProps = {
  itemId: ItemId;
};

// 足元の楕円（すべての足元の装備で使う土台）
function GroundRing({ className }: { className: string }) {
  return (
    <span
      className={`absolute bottom-[2%] left-[10%] h-[16%] w-[80%] rounded-[50%] ${className}`}
    />
  );
}

export function AuraEffect({ itemId }: AuraEffectProps) {
  switch (itemId) {
    case "grass_ring":
      return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <GroundRing className="border-2 border-emerald-400/70 bg-emerald-500/15" />
          {/* 小さな芽 */}
          {[18, 38, 62, 80].map((left, index) => (
            <span
              key={left}
              className="absolute h-[7%] w-[3%] rounded-t-full bg-emerald-400"
              style={{
                left: `${left}%`,
                bottom: index % 2 === 0 ? "7%" : "4%",
              }}
            />
          ))}
        </span>
      );

    case "terminal_glow":
      return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <GroundRing className="bg-emerald-400/30 shadow-[0_0_18px_6px_rgba(52,211,153,0.35)]" />
          {/* 足元から立ちのぼる文字 */}
          {["0", "1", "{}", "$", "1"].map((text, index) => (
            <span
              key={index}
              className="aura-rise absolute bottom-[8%] font-mono text-[10px] font-bold text-emerald-300 sm:text-xs"
              style={{
                left: `${16 + index * 16}%`,
                animationDelay: `${index * 0.5}s`,
              }}
            >
              {text}
            </span>
          ))}
        </span>
      );

    case "sparkle":
      return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <GroundRing className="bg-sky-300/20 shadow-[0_0_14px_4px_rgba(125,211,252,0.3)]" />
          {[
            { left: "6%", top: "30%" },
            { left: "84%", top: "20%" },
            { left: "14%", top: "70%" },
            { left: "80%", top: "62%" },
            { left: "48%", top: "4%" },
          ].map((position, index) => (
            <span
              key={index}
              className="aura-twinkle absolute text-xs text-sky-100 sm:text-sm"
              style={{ ...position, animationDelay: `${index * 0.35}s` }}
            >
              ✦
            </span>
          ))}
        </span>
      );

    case "flame_aura":
      return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <span className="aura-flicker absolute bottom-[4%] left-[12%] h-[45%] w-[76%] rounded-[50%_50%_40%_40%] bg-[radial-gradient(ellipse_at_bottom,rgba(251,146,60,0.75),rgba(239,68,68,0.35)_45%,transparent_70%)] blur-[3px]" />
          <GroundRing className="bg-orange-500/40 shadow-[0_0_20px_6px_rgba(249,115,22,0.45)]" />
        </span>
      );

    case "rainbow_aura":
      return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <span className="aura-spin absolute inset-[6%] rounded-full bg-[conic-gradient(#f87171,#fbbf24,#4ade80,#38bdf8,#a78bfa,#f472b6,#f87171)] opacity-35 blur-md" />
          <GroundRing className="bg-[linear-gradient(90deg,#f87171,#fbbf24,#4ade80,#38bdf8,#a78bfa)] opacity-60" />
        </span>
      );

    default:
      return null;
  }
}
