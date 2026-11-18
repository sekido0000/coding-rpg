import { redirect } from "next/navigation";

import { AnalyticsSetting } from "@/components/account/analytics-setting";
import { AppLogo } from "@/components/layout/app-logo";
import { PendingLink } from "@/components/ui/pending-link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/*
 * 設定．今は「アプリの改善のための分析に使う」だけ．
 */
export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // RLS で本人の行だけが返る．行がない時は「使う」（初めの設定）
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("analytics_opt_out")
    .maybeSingle();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />

          <PendingLink
            href="/"
            className="self-start rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white sm:self-auto"
          >
            ワールドへ戻る
          </PendingLink>
        </div>

        <h1 className="text-3xl font-black text-white">設定</h1>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <AnalyticsSetting optOut={profile?.analytics_opt_out ?? false} />

          <div className="mt-4 space-y-2 text-sm leading-7 text-slate-400">
            <p>
              コミットの習慣がどう変わったかを確かめ，アプリを良くするために，次の数字を記録しています．
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                画面や機能を使った回数（1日ごとに，キャラクターの詳細を開いた・建物の中をのぞいた・装飾や装備を付け替えた・建物を建てた・クエストを開いた・ボス戦に挑んだ など）
              </li>
              <li>
                キャラクターが生まれる前の90日間のコミットの集計（件数・日数・理由を書いた数・何をしたか分からないメッセージの数）．メッセージそのものは保存しません．
              </li>
            </ul>
            <p>
              オフにすると，これまでの記録を消し，以後は記録しません．詳しくは
              <PendingLink
                href="/privacy"
                className="mx-1 text-sky-300 underline-offset-2 hover:underline"
              >
                プライバシーポリシー
              </PendingLink>
              をご覧ください．
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
