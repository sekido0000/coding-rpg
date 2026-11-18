import Image from "next/image";
import Link from "next/link";

import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { HeaderMenu } from "@/components/layout/header-menu";
import { TAB_CLASS } from "@/components/layout/tab-class";
import { QuestBoard } from "@/components/quests/quest-board";
import { QuestPanel } from "@/components/quests/quest-panel";
import { TitleBadge } from "@/components/titles/title-badge";
import { PendingLink } from "@/components/ui/pending-link";
import type { WeeklyQuestBoard } from "@/data/quests";
import type { TitleInfo } from "@/lib/titles/catalog";

function TabLink({
  href,
  icon,
  label,
  shortLabel,
}: {
  href: string;
  icon: string;
  label: string;
  // スマホで4つのタブが収まるよう，狭い時に使う短い名前
  shortLabel?: string;
}) {
  return (
    <PendingLink href={href} spinnerOnly className={TAB_CLASS}>
      <span aria-hidden="true">{icon}</span>
      {shortLabel ? (
        <>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </PendingLink>
  );
}

/*
 * ホームの上の帯．2段にする．
 * - 上の段：ロゴ・称号・名前・所持金と，「その他」（称号・使い方・ご意見・ログアウト）
 * - 下の段：毎日使うページへのタブ（クエスト・ボス戦・キャラクター・雑貨店）
 * スマホで下の段が収まらない時は，横にスクロールできる．
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
    <header className="relative z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      {/* 上の段 */}
      <div className="flex items-center gap-3 px-3 pt-2 sm:px-5">
        <Link href="/" aria-label="Coding RPG" className="shrink-0">
          <Image
            src="/images/logo.png"
            alt="Coding RPG"
            width={1518}
            height={347}
            className="h-7 w-auto sm:h-8"
            priority
          />
        </Link>

        {/* 称号と名前（狭い画面では隠す） */}
        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          {selectedTitle && (
            <TitleBadge
              name={selectedTitle.name}
              rank={selectedTitle.rank}
              size="sm"
            />
          )}
          <p className="hidden max-w-32 truncate text-sm font-semibold text-white md:block">
            {githubName}
          </p>
        </div>

        <p className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-200">
          <span className="mr-1 text-xs font-semibold text-amber-200/80">所持金</span>
          💰 {questBoard.gold} G
        </p>

        <div className="ml-auto">
          <HeaderMenu />
        </div>
      </div>

      {/* 下の段：タブ */}
      <nav
        aria-label="メニュー"
        className="flex gap-1 overflow-x-auto px-2 pb-1.5 pt-1.5 sm:gap-1.5 sm:px-4"
      >
        <QuestPanel hasPendingRewards={questBoard.hasPendingRewards}>
          <QuestBoard board={questBoard} />
        </QuestPanel>
        <TabLink href="/battle" icon="⚔️" label="ボス戦" />
        <TabLink
          href="/characters"
          icon="👥"
          label="キャラクター"
          shortLabel="キャラ"
        />
        <TabLink href="/shop" icon="🏪" label="雑貨店" />
      </nav>

      {/* ご意見のフォーム（メニューから開く） */}
      <FeedbackDialog />
    </header>
  );
}
