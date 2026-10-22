import { UsageSteps } from "@/components/guide/usage-steps";
import { XpRules } from "@/components/guide/xp-rules";

/*
 * 「使い方」と「経験値のルール」．
 * トップページと使い方ページで同じ内容を表示するため，1つにまとめる．
 */
export function GuideSections() {
  return (
    <>
      {/* 固定ヘッダーに見出しが隠れないよう，scroll-mtで余白を取る */}
      <section
        id="how-to-use"
        className="mb-20 scroll-mt-28"
      >
        <h2 className="text-3xl font-black text-white">
          使い方
        </h2>

        <p className="mb-8 mt-3 text-slate-400">
          画像の番号の場所を順に操作してください．
        </p>

        <UsageSteps />
      </section>

      <section className="mb-16">
        <h2 className="mb-8 text-3xl font-black text-white">
          経験値のルール
        </h2>

        <XpRules />
      </section>
    </>
  );
}
