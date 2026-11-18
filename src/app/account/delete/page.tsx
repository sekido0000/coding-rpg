import { redirect } from "next/navigation";

import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { AppLogo } from "@/components/layout/app-logo";
import { PendingLink } from "@/components/ui/pending-link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/*
 * データを全部消すページ．消すものと，消した後のことを先に説明する．
 */
export default async function DeleteAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

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

        <h1 className="text-3xl font-black text-white">データを全部消す</h1>

        <div className="mt-6 space-y-6 text-sm leading-7 text-slate-300">
          <section>
            <h2 className="font-bold text-white">消えるもの</h2>
            <p className="mt-1">
              Coding RPG に保存されている，あなたのデータがすべて消えます．
              キャラクター，成長履歴，クエスト，ゴールド，装飾・装備，素材，称号，建物，ボス戦の記録，送ったご意見，ログインの情報です．
            </p>
            <p className="mt-1 font-semibold text-red-300">
              消したデータは元に戻せません．
            </p>
          </section>

          <section>
            <h2 className="font-bold text-white">GitHub のリポジトリについて</h2>
            <p className="mt-1">
              GitHub のリポジトリやコードは，何も変わりません．
              ただし，GitHub に入れた Coding RPG のアプリは，ここからは外せません．
              消した後に，GitHub の設定画面で外してください（消した後の画面でも案内します）．
            </p>
          </section>

          <section>
            <h2 className="font-bold text-white">連携を外すだけなら</h2>
            <p className="mt-1">
              一部のリポジトリをやめたいだけなら，キャラクター一覧の「リポジトリの追加・連携解除」から外せます．
              その場合，キャラクターと記録は残り，もう一度連携すると続きから育てられます．
            </p>
          </section>
        </div>

        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <DeleteAccountForm />
        </div>
      </div>
    </main>
  );
}
