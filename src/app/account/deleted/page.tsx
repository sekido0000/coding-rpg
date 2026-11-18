import { AppLogo } from "@/components/layout/app-logo";
import { PendingLink } from "@/components/ui/pending-link";

// GitHub に入れたアプリ（GitHub App）を外す設定画面
const GITHUB_INSTALLATIONS_URL = "https://github.com/settings/installations";

/*
 * データを全部消した後のページ．GitHub 側のアプリを外す方法を案内する．
 */
export default function AccountDeletedPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <AppLogo />
        </div>

        <h1 className="text-3xl font-black text-white">データを消しました</h1>

        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
          <p>今まで使っていただき，ありがとうございました．</p>
          <p>
            最後に，GitHub に入れた Coding RPG のアプリを外してください．
            <a
              href={GITHUB_INSTALLATIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="mx-1 font-semibold text-sky-300 underline-offset-2 hover:underline"
            >
              GitHub の設定画面
            </a>
            を開き，Coding RPG の「Configure」から「Uninstall」を押すと外れます．
          </p>
          <p>
            外さないままでも，GitHub から届く通知は使わずに捨てるので，あなたのデータが Coding RPG に保存されることはありません．
          </p>
        </div>

        <PendingLink
          href="/"
          className="mt-8 inline-block rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          トップページへ
        </PendingLink>
      </div>
    </main>
  );
}
