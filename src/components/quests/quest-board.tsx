import { PendingLink } from "@/components/ui/pending-link";
import type {
  QuestBoardItem,
  WeeklyQuestBoard,
} from "@/data/quests";

type QuestBoardProps = {
  board: WeeklyQuestBoard;
};

// 次の段階の目標（全部達成した時は最後の目標）
function getNextGoal({ quest, achievedStages }: QuestBoardItem) {
  return (
    quest.stages[achievedStages] ??
    quest.stages[quest.stages.length - 1]
  );
}

/*
 * 達成・失敗したクエストに，斜めに押すハンコ．
 * 押した瞬間のように，少し大きい状態から縮んで止まる．
 */
function Stamp({ kind }: { kind: "done" | "failed" }) {
  const isDone = kind === "done";

  return (
    <span
      aria-hidden="true"
      className={`
        quest-stamp pointer-events-none absolute right-4 top-1/2
        rounded-lg border-4 border-double px-3 py-0.5
        text-2xl font-black tracking-[0.2em]
        ${
          isDone
            ? "border-red-500/80 text-red-500/85"
            : "border-slate-400/70 text-slate-400/80"
        }
      `}
    >
      {isDone ? "達成" : "失敗"}
    </span>
  );
}

function QuestRow({ item }: { item: QuestBoardItem }) {
  const {
    quest,
    value,
    achievedStages,
    claimedStages,
    isFailed,
  } = item;

  const isCompleted = achievedStages === quest.stages.length;
  const goal = getNextGoal(item);
  const rate = isFailed ? 0 : Math.min(value / goal, 1);

  const sumRewards = (from: number, to: number) =>
    quest.rewards
      .slice(from, to)
      .reduce((total, gold) => total + gold, 0);

  // 達成したのに，まだ渡していない報酬
  const pendingGold = sumRewards(claimedStages, achievedStages);

  const rewardText =
    pendingGold > 0
      ? `🎁 +${pendingGold} G は次の push で受け取り`
      : isCompleted
        ? `報酬 計 ${sumRewards(0, quest.stages.length)} G`
        : `次の★ +${quest.rewards[achievedStages]} G`;

  const status = isFailed
    ? "理由なし・あいまいなコミットがあったので失敗"
    : isCompleted
      ? "全部達成！"
      : `${value} / ${goal} ${quest.unit}`;

  return (
    <li
      className={`relative overflow-hidden rounded-xl border p-3 ${
        isFailed
          ? "border-red-400/30 bg-slate-950/60"
          : isCompleted
            ? "border-amber-300/40 bg-amber-300/10"
            : "border-slate-700/80 bg-white/5"
      }`}
    >
      {/* 画面読み上げ向けに，達成・失敗を文字でも伝える */}
      <span className="sr-only">
        {isFailed ? "失敗" : isCompleted ? "達成" : ""}
      </span>

      <div
        className={`flex items-start justify-between gap-3 ${
          isFailed ? "opacity-50" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="font-bold text-white">{quest.title}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-400">
            {quest.description}
          </p>
        </div>

        {/* 段階（★）．達成した数だけ色を付ける */}
        <p
          className="shrink-0 text-sm tracking-wider"
          aria-label={`${quest.stages.length}段階中${achievedStages}段階達成`}
        >
          {quest.stages.map((stage, index) => (
            <span
              key={stage}
              className={
                index < achievedStages
                  ? "text-amber-300"
                  : "text-slate-600"
              }
            >
              ★
            </span>
          ))}
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${
            isCompleted ? "bg-amber-300" : "bg-emerald-400"
          }`}
          style={{ width: `${rate * 100}%` }}
        />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <p
          className={
            isFailed ? "font-semibold text-red-300" : "text-slate-300"
          }
        >
          {status}
        </p>

        <p className="text-amber-200/80">{rewardText}</p>
      </div>

      {isFailed && (
        <p className="mt-1 text-xs text-slate-500">
          来週また挑戦できます
        </p>
      )}

      {(isCompleted || isFailed) && (
        <Stamp kind={isFailed ? "failed" : "done"} />
      )}
    </li>
  );
}

/*
 * 今週のクエストと，持っているゴールド．
 * ホームのリポジトリワールドの下に表示する．
 */
export function QuestBoard({ board }: QuestBoardProps) {
  return (
    <section
      aria-labelledby="quest-board-heading"
      className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="quest-board-heading"
            className="text-xl font-bold text-white"
          >
            今週のクエスト
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            全部のリポジトリのコミットで進みます．月曜0時に入れ替わり（あと{board.daysLeft}日）
          </p>
        </div>

        <div className="flex items-center gap-2">
          <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-200">
            💰 {board.gold} G
          </p>

          <PendingLink
            href="/shop"
            className="rounded-full bg-amber-300 px-3 py-1 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
          >
            🏪 お店へ
          </PendingLink>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {board.progress.map((item) => (
          <QuestRow key={item.quest.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
