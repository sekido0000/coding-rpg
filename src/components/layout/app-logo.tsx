import Image from "next/image";
import Link from "next/link";

export function AppLogo() {
  return (
    <Link
      href="/"
      aria-label="Coding RPG（ホームへ戻る）"
      className="flex shrink-0 items-center"
    >
      <Image
        src="/images/logo.png"
        alt="Coding RPG"
        width={1518}
        height={347}
        className="h-9 w-auto sm:h-11"
        priority
      />
    </Link>
  );
}
