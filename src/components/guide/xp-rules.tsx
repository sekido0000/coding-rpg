import {
  BODY_BONUS_XP,
  COMMIT_CATEGORIES,
  SIZE_BONUSES,
  type CommitCategory,
} from "@/lib/growth/xp";

/*
 * それぞれの種類が何を表すか．
 * 「その他」以外のすべての種類に1行ずつ説明を付ける．
 */
const categoryDescriptions: Record<
  Exclude<CommitCategory, "other">,
  string
> = {
  feat: "新しい機能や画面を追加した",
  perf: "処理を速く・軽くした",
  fix: "不具合を直した",
  refactor: "動きは変えずにコードを整理した",
  test: "テストを追加した・直した",
  docs: "READMEや説明を書いた・直した",
  build: "ライブラリや設定ファイルを変更した",
  style: "空白や改行など見た目だけを整えた",
  chore: "名前の変更などの細かな作業をした",
  revert: "以前の変更を取り消した",
};

const categories = Object.keys(
  categoryDescriptions,
) as Exclude<CommitCategory, "other">[];

const bonuses = [
  {
    title: `変更量ボーナス：最大 +${SIZE_BONUSES[0].xp} XP`,
    description: "実際に変更した行数に応じて加算",
    detail: `${SIZE_BONUSES.map(
      (bonus) => `${bonus.minLines}行以上 +${bonus.xp}`,
    ).join("，")}．こまめなコミットを大切にするため上限があります．`,
    isPenalty: false,
  },
  {
    title: `本文ボーナス：+${BODY_BONUS_XP} XP`,
    description: "2行目以降に変更の理由などを書くと加算",
    detail:
      "後から見返した時に，何のための変更か分かります．",
    isPenalty: false,
  },
  {
    title: "あいまいなメッセージ：種類の経験値が半分",
    description: "何をしたか分からないメッセージは減点",
    detail:
      "「update」「add codes」「修正」など．この場合はボーナスも付きません．",
    isPenalty: true,
  },
];

const noXpCases = [
  "空コミット",
  "空白・改行・インデントの付け直しや，行の移動だけの変更",
  "lockファイルなどの自動生成ファイルだけの変更",
  "マージコミット",
  "force push",
];

export function XpRules() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-6">
        <h3 className="text-xl font-black text-white">
          経験値の計算方法
        </h3>

        <p className="mt-4 text-lg font-bold text-emerald-200">
          種類の経験値 ＋ 変更量ボーナス ＋ 本文ボーナス
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          メッセージの書き方は自由です（「feat: 〜」のような形式でも，日本語の文章でも種類を判定できます）．
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:row-span-2">
          <h3 className="text-xl font-black text-white">
            種類の経験値
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            コミットメッセージと変更したファイルから種類を判定します．
            判定できない時は「その他」（
            {COMMIT_CATEGORIES.other.xp} XP）になります．
          </p>

          <ul className="mt-5 divide-y divide-slate-800">
            {categories.map((category) => {
              const info = COMMIT_CATEGORIES[category];

              return (
                <li
                  key={category}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100">
                      {info.icon} {info.label}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {categoryDescriptions[category]}
                    </p>
                  </div>

                  <p className="shrink-0 font-bold text-emerald-300">
                    {info.xp} XP
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-black text-white">
            ボーナスと減点
          </h3>

          <ul className="mt-5 space-y-5 text-sm leading-6">
            {bonuses.map((bonus) => (
              <li key={bonus.title}>
                <p
                  className={
                    bonus.isPenalty
                      ? "font-semibold text-amber-300"
                      : "font-semibold text-emerald-300"
                  }
                >
                  {bonus.title}
                </p>

                <p className="text-slate-200">
                  {bonus.description}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {bonus.detail}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-black text-white">
            経験値が入らない変更
          </h3>

          <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
            {noXpCases.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
