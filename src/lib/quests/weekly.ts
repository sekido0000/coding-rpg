/*
 * 週のクエスト．
 *
 * 毎週月曜0時（日本時間）に入れ替わる．ユーザー単位で，
 * 全部のリポジトリのコミットを合わせて数える．
 * 開発の内容（新機能か修正かなど）に左右されないよう，
 * 回数・日数・経験値と「毎回良いコミットを書いたか」だけで判定する．
 */

export type QuestId = "commits" | "days" | "xp" | "every_time";

export type WeeklyQuest = {
  id: QuestId;
  title: string;
  description: string;
  unit: string;
  // 段階（★）ごとの目標．毎回クエストは1段階だけ
  stages: readonly number[];
  // 段階（★）ごとの報酬．★が増えるほど多くする
  rewards: readonly number[];
};

export const WEEKLY_QUESTS: readonly WeeklyQuest[] = [
  {
    id: "commits",
    title: "コミットする",
    description: "経験値が入ったコミットの回数",
    unit: "回",
    stages: [1, 3, 5],
    rewards: [10, 20, 30],
  },
  {
    id: "days",
    title: "コミットした日数",
    description: "コミットした日の数（日本時間）",
    unit: "日",
    stages: [1, 2, 3],
    rewards: [10, 20, 30],
  },
  {
    id: "xp",
    title: "経験値を集める",
    description: "コミットで得た経験値の合計",
    unit: "XP",
    stages: [30, 60, 100],
    rewards: [10, 20, 30],
  },
  {
    id: "every_time",
    title: "毎回クエスト",
    description:
      "今週のコミットを全部「理由つき・分かるメッセージ」にする",
    unit: "回",
    stages: [3],
    rewards: [30],
  },
];

// 成長履歴のうち，クエストの判定に使う列
export type QuestEvent = {
  event_type: string;
  xp: number | null;
  created_at: string;
  // 内訳を保存する前の履歴では null
  body_xp?: number | null;
  is_vague?: boolean | null;
};

export type QuestProgress = {
  quest: WeeklyQuest;
  value: number;
  // 達成した段階の数
  achievedStages: number;
  // 毎回クエストで，理由なし・あいまいなコミットがあった
  isFailed: boolean;
};

export type QuestReward = {
  quest_id: QuestId;
  stage: number;
  gold: number;
};

/* ---------- 週の計算（日本時間） ---------- */

const JST_OFFSET = 9 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

// 日本時間の日付（YYYY-MM-DD）
function toJstDate(time: number) {
  return new Date(time + JST_OFFSET).toISOString().slice(0, 10);
}

// その日時が含まれる週の月曜日（日本時間，YYYY-MM-DD）
export function getWeekStart(date: Date) {
  const jst = new Date(date.getTime() + JST_OFFSET);
  // 月曜日を0にする
  const daysFromMonday = (jst.getUTCDay() + 6) % 7;

  return new Date(
    Date.UTC(
      jst.getUTCFullYear(),
      jst.getUTCMonth(),
      jst.getUTCDate() - daysFromMonday,
    ),
  )
    .toISOString()
    .slice(0, 10);
}

// 週の始まりと終わり（終わりは次の週の始まりで，含まない）
export function getWeekRange(weekStart: string) {
  const start = Date.parse(`${weekStart}T00:00:00+09:00`);

  return {
    from: new Date(start).toISOString(),
    to: new Date(start + 7 * DAY).toISOString(),
  };
}

/* ---------- 進み具合と報酬 ---------- */

/*
 * その週の成長履歴から，クエストの進み具合を計算する．
 * 経験値が入ったコミットだけを数える（空コミット・マージ・進化の記録は数えない）．
 */
export function evaluateWeeklyQuests(
  events: QuestEvent[],
  weekStart: string,
): QuestProgress[] {
  const { from, to } = getWeekRange(weekStart);
  const fromTime = Date.parse(from);
  const toTime = Date.parse(to);

  const commits = events.filter((event) => {
    const time = Date.parse(event.created_at);

    return (
      event.event_type.startsWith("commit_") &&
      (event.xp ?? 0) > 0 &&
      time >= fromTime &&
      time < toTime
    );
  });

  const days = new Set(
    commits.map((event) =>
      toJstDate(Date.parse(event.created_at)),
    ),
  ).size;

  const totalXp = commits.reduce(
    (total, event) => total + (event.xp ?? 0),
    0,
  );

  /*
   * 毎回クエスト．本文の点があれば「理由つき」で，
   * あいまいなメッセージには本文の点が付かないので，これだけで判定できる．
   * 内訳を保存する前の履歴は，判定できないので数えない．
   */
  const judged = commits.filter(
    (event) => event.body_xp != null,
  );
  const goodCommits = judged.filter(
    (event) => (event.body_xp ?? 0) > 0,
  ).length;
  const isEveryTimeFailed = goodCommits < judged.length;

  const values: Record<QuestId, number> = {
    commits: commits.length,
    days,
    xp: totalXp,
    every_time: goodCommits,
  };

  return WEEKLY_QUESTS.map((quest) => {
    const value = values[quest.id];
    const isFailed =
      quest.id === "every_time" && isEveryTimeFailed;

    return {
      quest,
      value,
      achievedStages: isFailed
        ? 0
        : quest.stages.filter((goal) => value >= goal).length,
      isFailed,
    };
  });
}

// 達成した段階の報酬の一覧（すでに渡した分も含む）
export function getQuestRewards(
  progress: QuestProgress[],
): QuestReward[] {
  return progress.flatMap(({ quest, achievedStages }) =>
    Array.from({ length: achievedStages }, (_, index) => ({
      quest_id: quest.id,
      stage: index + 1,
      gold: quest.rewards[index],
    })),
  );
}

// 1週間前の週の月曜日
function getPreviousWeekStart(weekStart: string) {
  return new Date(Date.parse(`${weekStart}T00:00:00Z`) - 7 * DAY)
    .toISOString()
    .slice(0, 10);
}

/*
 * 毎回クエストを何週続けて達成しているか．
 *
 * 今週を達成していれば今週から，まだ達成していなければ先週から数える
 * （今週の途中で連続が切れて見えないようにするため）．
 * 1週でも抜けたら，そこで止める．
 */
export function getEveryTimeStreak(
  completedWeekStarts: string[],
  currentWeekStart: string,
) {
  const completed = new Set(completedWeekStarts);

  let week = completed.has(currentWeekStart)
    ? currentWeekStart
    : getPreviousWeekStart(currentWeekStart);
  let streak = 0;

  while (completed.has(week)) {
    streak += 1;
    week = getPreviousWeekStart(week);
  }

  return streak;
}
