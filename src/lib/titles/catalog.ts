/*
 * 称号の一覧．
 *
 * 6つの軸（クエスト・キャラクター・コミット・進化・雑貨店・ゴールド）ごとに，
 * 数が一定に届くと段階的にもらえる．
 * 名前の雰囲気は軸ごとにそろえる（クエストは冒険者，コミットは記録など）．
 */

export type TitleStats = {
  quest_stars: number;
  quest_gold: number;
  characters: number;
  commits: number;
  evolutions: number;
  purchases: number;
};

export type TitleAxisId = keyof TitleStats;

// 称号の格．段階が上がるほど豪華に表示する
export type TitleRank = "bronze" | "silver" | "gold" | "rainbow";

export type TitleStage = {
  threshold: number;
  name: string;
};

export type TitleAxis = {
  id: TitleAxisId;
  label: string;
  // 「あと 3 回」などに使う単位
  unit: string;
  description: string;
  stages: readonly TitleStage[];
};

export const TITLE_AXES: readonly TitleAxis[] = [
  {
    id: "quest_stars",
    label: "クエスト",
    unit: "回",
    description: "クエストの達成回数（★1つで1回）",
    stages: [
      { threshold: 1, name: "駆け出し冒険者" },
      { threshold: 5, name: "見習い冒険者" },
      { threshold: 10, name: "一人前の冒険者" },
      { threshold: 25, name: "熟練の冒険者" },
      { threshold: 50, name: "歴戦の冒険者" },
      { threshold: 100, name: "英雄" },
      { threshold: 200, name: "大英雄" },
      { threshold: 300, name: "生ける伝説" },
      { threshold: 500, name: "神話の冒険者" },
    ],
  },
  {
    id: "characters",
    label: "キャラクター",
    unit: "体",
    description: "これまでに作ったキャラクターの数",
    stages: [
      { threshold: 1, name: "村のはじまり" },
      { threshold: 2, name: "にぎやかな家" },
      { threshold: 3, name: "小さな集落" },
      { threshold: 5, name: "村の長" },
      { threshold: 10, name: "町の長" },
      { threshold: 20, name: "王国の主" },
    ],
  },
  {
    id: "commits",
    label: "コミット",
    unit: "回",
    description: "経験値が入ったコミットの回数（全リポジトリの合計）",
    stages: [
      { threshold: 1, name: "はじめての記録" },
      { threshold: 10, name: "記録係" },
      { threshold: 50, name: "記録職人" },
      { threshold: 100, name: "記録の名手" },
      { threshold: 300, name: "歴史の編纂者" },
      { threshold: 500, name: "年代記の著者" },
      { threshold: 1000, name: "歴史の守り人" },
    ],
  },
  {
    id: "evolutions",
    label: "進化",
    unit: "回",
    description: "レベルが上がった回数（全キャラクターの合計）",
    stages: [
      { threshold: 1, name: "進化の目撃者" },
      { threshold: 5, name: "育ての親" },
      { threshold: 10, name: "進化の研究者" },
      { threshold: 20, name: "進化の匠" },
      { threshold: 50, name: "進化の賢者" },
    ],
  },
  {
    id: "purchases",
    label: "雑貨店",
    unit: "回",
    description: "雑貨店で買った回数",
    stages: [
      { threshold: 1, name: "はじめてのお買い物" },
      { threshold: 3, name: "常連さん" },
      { threshold: 5, name: "お得意さま" },
      { threshold: 10, name: "コレクター" },
      { threshold: 20, name: "鑑定士" },
    ],
  },
  {
    id: "quest_gold",
    label: "ゴールド",
    unit: "G",
    description: "これまでにクエストで得たゴールドの合計（使っても減らない）",
    stages: [
      { threshold: 100, name: "小金持ち" },
      { threshold: 300, name: "お金持ち" },
      { threshold: 500, name: "豪商" },
      { threshold: 1000, name: "大富豪" },
      { threshold: 3000, name: "黄金王" },
      { threshold: 5000, name: "財宝の守護竜" },
    ],
  },
];

export type TitleInfo = {
  id: string;
  name: string;
  axis: TitleAxis;
  stageIndex: number;
  rank: TitleRank;
};

// 称号のID（例：commits_100）．DB にはこの文字列を保存する
export function getTitleId(axis: TitleAxis, stage: TitleStage) {
  return `${axis.id}_${stage.threshold}`;
}

/*
 * 段階から格を決める．
 * 最後の段階は虹，その1つ前は金．それより下は，上半分を銀・下半分を銅にする．
 */
export function getTitleRank(
  stageIndex: number,
  stageCount: number,
): TitleRank {
  if (stageIndex === stageCount - 1) {
    return "rainbow";
  }

  if (stageIndex === stageCount - 2) {
    return "gold";
  }

  return stageIndex >= (stageCount - 2) / 2 ? "silver" : "bronze";
}

const TITLES = new Map<string, TitleInfo>(
  TITLE_AXES.flatMap((axis) =>
    axis.stages.map((stage, stageIndex) => {
      const id = getTitleId(axis, stage);

      return [
        id,
        {
          id,
          name: stage.name,
          axis,
          stageIndex,
          rank: getTitleRank(stageIndex, axis.stages.length),
        },
      ] as const;
    }),
  ),
);

export function findTitle(id: string | null | undefined) {
  return id ? (TITLES.get(id) ?? null) : null;
}

// 数が届いている称号のID
export function getEarnedTitleIds(stats: TitleStats) {
  return TITLE_AXES.flatMap((axis) =>
    axis.stages
      .filter((stage) => stats[axis.id] >= stage.threshold)
      .map((stage) => getTitleId(axis, stage)),
  );
}
