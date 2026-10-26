import Image from "next/image";
import Link from "next/link";

export function AppLogo() {
  return (
    <Link
      href="/"
      aria-label="Coding RPG（ホームへ戻る）"
      className="flex h- shrink-0 items-center sm:h-20"
    >
      <Image
        src="/images/logo.png"
        alt="Coding RPG"
        width={1774}
        height={887}
        className="h-20 w-auto object-contain sm:h-28"
        priority
      />
    </Link>
  );
}
