import type { WeeklyQuestBoard } from "@/data/quests";
import type { QuestProgress } from "@/lib/quests/weekly";

type QuestBoardProps = {
  board: WeeklyQuestBoard;
};

// 次の段階の目標（全部達成した時は最後の目標）
function getNextGoal({ quest, achievedStages }: QuestProgress) {
  return (
    quest.stages[achievedStages] ??
    quest.stages[quest.stages.length - 1]
  );
}

function QuestRow({ item }: { item: QuestProgress }) {
  const { quest, value, achievedStages, isFailed } = item;
  const isCompleted = achievedStages === quest.stages.length;
  const goal = getNextGoal(item);
  const rate = isFailed ? 0 : Math.min(value / goal, 1);

  return (
    <li
      className={`rounded-xl border p-3 ${
        isCompleted
          ? "border-amber-300/40 bg-amber-300/10"
          : "border-slate-700/80 bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
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

      <div className="mt-1.5 flex items-center justify-between text-xs">
        <p className={isFailed ? "text-slate-500" : "text-slate-300"}>
          {isFailed
            ? "今週は理由なしのコミットがあったので，来週また挑戦"
            : isCompleted
              ? "達成！"
              : `${value} / ${goal} ${quest.unit}`}
        </p>

        <p className="text-amber-200/80">
          ★1つ +{quest.goldPerStage} G
        </p>
      </div>
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

        <p className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-200">
          💰 {board.gold} G
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {board.progress.map((item) => (
          <QuestRow key={item.quest.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
