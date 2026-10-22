import Link from "next/link";

export function AppLogo() {
  return (
    <Link
      href="/"
      aria-label="Coding RPG（ホームへ戻る）"
      className="flex h-16 shrink-0 items-center"
    >
      <span className="font-mono text-3xl font-black tracking-tight">
        <span className="text-lime-400 drop-shadow-[0_0_10px_rgba(163,230,53,0.55)]">
          Coding
        </span>{" "}
        <span className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.55)]">
          RPG
        </span>
      </span>
    </Link>
  );
}
