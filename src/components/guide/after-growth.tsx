import Image from "next/image";

const items = [
  {
    title: "ワールド",
    description:
      "キャラクターごとに家が建ち，みんなで歩き回ったり，おしゃべりしたりします．",
  },
  {
    title: "クエスト",
    description:
      "毎週のクエストを達成するとゴールドがもらえます．装備を買ったり，カフェや図書館を建てたりできます．",
  },
  {
    title: "ボス戦",
    description: "育てたキャラクターでパーティーを組んで，毎週ボスに挑みます．",
  },
  {
    title: "工房",
    description: "ボスの素材で武器や防具を作れます．",
  },
];

/*
 * 育てたキャラクターでできること（ワールド・クエスト・ボス戦・工房）．
 */
export function AfterGrowth() {
  return (
    <div className="space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <p className="font-black text-white">{item.title}</p>
            <p className="mt-1 text-sm leading-7 text-slate-400">
              {item.description}
            </p>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-2">
        <Image
          src="/readme/world.png"
          alt="キャラクターたちが暮らすワールド"
          width={1200}
          height={470}
          className="w-full rounded-2xl border border-white/10"
        />
        <Image
          src="/readme/battle.png"
          alt="ボス戦の様子"
          width={1200}
          height={600}
          className="w-full rounded-2xl border border-white/10"
        />
      </div>
    </div>
  );
}
