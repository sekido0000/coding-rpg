import Image from "next/image";

const items = [
  {
    title: "成長履歴",
    description:
      "どのコミットで何XP入ったかが，内訳と一緒に残ります．次に点数を増やすヒントも出ます．",
    image: "/readme/history.png",
    width: 1280,
    height: 900,
    alt: "キャラクターの詳細と成長履歴",
  },
  {
    title: "ワールド",
    description:
      "キャラクターごとに家が建ち，みんなで歩き回ったり，おしゃべりしたりします．",
    image: "/readme/world.png",
    width: 1200,
    height: 470,
    alt: "キャラクターたちが暮らすワールド",
  },
  {
    title: "クエスト",
    description:
      "毎週のクエストを達成するとゴールドがもらえます．装備を買ったり，カフェや図書館を建てたりできます．",
    image: "/readme/quest.png",
    width: 760,
    height: 394,
    alt: "今週のクエスト",
  },
  {
    title: "ボス戦",
    description:
      "育てたキャラクターでパーティーを組んで，毎週ボスに挑みます．",
    image: "/readme/battle.png",
    width: 1200,
    height: 600,
    alt: "ボス戦の様子",
  },
];

/*
 * 育てたキャラクターでできること．1つずつ画像を付けて，左右交互に並べる．
 */
export function AfterGrowth() {
  return (
    <div className="space-y-12">
      {items.map((item, index) => (
        <div
          key={item.title}
          className="grid items-center gap-6 lg:grid-cols-5"
        >
          <div
            className={`lg:col-span-2 ${index % 2 === 1 ? "lg:order-2" : ""}`}
          >
            <h3 className="text-2xl font-black text-white">{item.title}</h3>
            <p className="mt-3 leading-7 text-slate-300">{item.description}</p>
          </div>

          <Image
            src={item.image}
            alt={item.alt}
            width={item.width}
            height={item.height}
            className="w-full rounded-2xl border border-white/10 lg:col-span-3"
          />
        </div>
      ))}
    </div>
  );
}
