import Image from "next/image";
import Link from "next/link";

import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { HeaderMenu } from "@/components/layout/header-menu";
import { QuestBoard } from "@/components/quests/quest-board";
import { QuestPanel } from "@/components/quests/quest-panel";
import { TitleBadge } from "@/components/titles/title-badge";
import { PendingLink } from "@/components/ui/pending-link";
import type { WeeklyQuestBoard } from "@/data/quests";
import type { TitleInfo } from "@/lib/titles/catalog";

// 上の帯のボタン．幅が狭い時は文字を隠してアイコンだけにする（帯が2行にならないように）
function HudLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <PendingLink
      href={href}
      spinnerOnly
      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/10"
    >
      <span aria-hidden="true">{icon}</span>
      <span className="hidden xl:inline">{label}</span>
      <span className="sr-only xl:hidden">{label}</span>
    </PendingLink>
  );
}

/*
 * ホームの上の帯．称号・名前・所持金と，毎日使うページへの入口を1行に並べる．
 * それ以外（称号・使い方・ご意見・ログアウト）は「メニュー」にまとめる．
 */
export function HomeHeader({
  githubName,
  selectedTitle,
  questBoard,
}: {
  githubName: string;
  selectedTitle: TitleInfo | null;
  questBoard: WeeklyQuestBoard;
}) {
  return (
    <header className="relative z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 bg-slate-950/90 px-3 py-2 backdrop-blur sm:flex-nowrap sm:px-5">
      <Link
        href="/"
        aria-label="Coding RPG"
        className="shrink-0"
      >
        <Image
          src="/images/logo.png"
          alt="Coding RPG"
          width={1518}
          height={347}
          className="h-7 w-auto sm:h-8"
          priority
        />
      </Link>

      {/* 称号と名前 */}
      <div className="hidden min-w-0 items-center gap-2 sm:flex">
        {selectedTitle && (
          <TitleBadge
            name={selectedTitle.name}
            rank={selectedTitle.rank}
            size="sm"
          />
        )}
        <p className="hidden max-w-32 truncate text-sm font-semibold text-white lg:block">
          {githubName}
        </p>
      </div>

      <p className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-200">
        <span className="mr-1 text-xs font-semibold text-amber-200/80">所持金</span>
        💰 {questBoard.gold} G
      </p>

      <nav
        aria-label="メニュー"
        className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end"
      >
        <QuestPanel hasPendingRewards={questBoard.hasPendingRewards}>
          <QuestBoard board={questBoard} />
        </QuestPanel>
        <HudLink href="/battle" icon="⚔️" label="ボス戦" />
        <HudLink href="/characters" icon="👥" label="キャラクター" />
        <HudLink href="/shop" icon="🏪" label="雑貨店" />
        <HeaderMenu />
      </nav>

      {/* ご意見のフォーム（メニューから開く） */}
      <FeedbackDialog />
    </header>
  );
}
