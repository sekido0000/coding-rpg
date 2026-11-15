import Image from "next/image";

/*
 * スクリーンショット上の強調枠．
 * 位置と大きさは画像に対する割合（%）で指定する．
 */
type Highlight = {
  left: number;
  top: number;
  width: number;
  height: number;
  caption: string;
};

type UsageStep = {
  number: string;
  title: string;
  description: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  // 縦長の画像は，この幅（px）まで小さくして表示する
  displayWidth?: number;
  highlights: Highlight[];
};

const steps: UsageStep[] = [
  {
    number: "STEP 1",
    title: "リポジトリの連携を始める",
    description:
      "GitHubでログインすると，ワールドが表示されます．上の「キャラクター」からキャラクター一覧を開き，育てたいリポジトリの連携を始めます．",
    image: "/screenshots/step1.png",
    imageWidth: 1280,
    imageHeight: 418,
    highlights: [
      {
        left: 64.8,
        top: 6.5,
        width: 9.7,
        height: 11,
        caption: "上の「キャラクター」を押す",
      },
      {
        left: 71.3,
        top: 64.6,
        width: 15.7,
        height: 11.5,
        caption: "「リポジトリの追加・連携解除」を押す",
      },
    ],
  },
  {
    number: "STEP 2",
    title: "GitHubで育てるリポジトリを選ぶ",
    description:
      "GitHubの画面に移動します．「Only select repositories」を選び，育てたいリポジトリを指定してください．",
    image: "/screenshots/step2.png",
    imageWidth: 1201,
    imageHeight: 834,
    highlights: [
      {
        left: 8.7,
        top: 13.2,
        width: 38.7,
        height: 10.8,
        caption: "「Select repositories」からリポジトリを選ぶ",
      },
      {
        left: 4.2,
        top: 89.3,
        width: 18.3,
        height: 10.2,
        caption: "「Install」を押す（2回目以降は「Save」）",
      },
    ],
  },
  {
    number: "STEP 3",
    title: "キャラクターを選ぶ",
    description:
      "アプリに戻ると，キャラクターの選択画面が表示されます．キャラクター・性格・名前は後から変更できません．",
    image: "/screenshots/step3.png",
    imageWidth: 1000,
    imageHeight: 859,
    highlights: [
      {
        left: 27.1,
        top: 28.8,
        width: 67.8,
        height: 7.1,
        caption: "好きなキャラクターを選ぶ",
      },
      {
        left: 27.1,
        top: 48.9,
        width: 67.8,
        height: 22.8,
        caption: "性格を選ぶ",
      },
      {
        left: 27.1,
        top: 76.4,
        width: 67.8,
        height: 7.2,
        caption: "名前を付ける",
      },
      {
        left: 27.1,
        top: 87.1,
        width: 67.8,
        height: 7,
        caption: "「このキャラクターに決定」を押す",
      },
    ],
  },
  {
    number: "STEP 4",
    title: "コミットして育てる",
    description:
      "連携したリポジトリにpushすると，コミットの内容に応じて経験値が入り，キャラクターが成長します．",
    image: "/screenshots/step4.png",
    imageWidth: 560,
    imageHeight: 930,
    displayWidth: 380,
    highlights: [
      {
        left: 81.1,
        top: 33.9,
        width: 11.2,
        height: 4.3,
        caption: "経験値が貯まるとレベルが上がる",
      },
      {
        left: 7.7,
        top: 51.1,
        width: 84.6,
        height: 8.1,
        caption: "決まったレベルで進化する",
      },
      {
        left: 7.7,
        top: 84.9,
        width: 84.6,
        height: 5.8,
        caption: "「詳細情報」で，どのコミットで何XP得たか振り返れる",
      },
    ],
  },
];

export function UsageSteps() {
  return (
    <div className="space-y-10">
      {steps.map((step) => (
        <section
          key={step.number}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl"
        >
          <div className="grid gap-8 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-2">
              <p className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold tracking-widest text-emerald-300">
                {step.number}
              </p>

              <h3 className="mt-4 text-2xl font-black text-white">
                {step.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-300">
                {step.description}
              </p>

              <ol className="mt-5 space-y-2">
                {step.highlights.map(
                  (highlight, index) => (
                    <li
                      key={highlight.caption}
                      className="flex items-start gap-3 text-sm text-slate-200"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-300 text-xs font-black text-slate-950">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">
                        {highlight.caption}
                      </span>
                    </li>
                  ),
                )}
              </ol>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-3 lg:col-span-3">
              <div
                className="relative mx-auto"
                style={{ maxWidth: step.displayWidth }}
              >
                <Image
                  src={step.image}
                  alt={step.title}
                  width={step.imageWidth}
                  height={step.imageHeight}
                  className="h-auto w-full rounded-lg"
                />

                {step.highlights.map(
                  (highlight, index) => (
                    <div
                      key={highlight.caption}
                      aria-hidden="true"
                      className="pointer-events-none absolute rounded-lg border-2 border-amber-300 shadow-[0_0_0_4px_rgba(252,211,77,0.25)]"
                      style={{
                        left: `${highlight.left}%`,
                        top: `${highlight.top}%`,
                        width: `${highlight.width}%`,
                        height: `${highlight.height}%`,
                      }}
                    >
                      <span className="absolute -left-3 -top-3 grid h-6 w-6 place-items-center rounded-full bg-amber-300 text-xs font-black text-slate-950">
                        {index + 1}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
