import { GitHubLoginButton } from "@/components/auth/github-login-button";
import { GuideSections } from "@/components/guide/guide-sections";
import { AppLogo } from "@/components/layout/app-logo";
import { PendingLink } from "@/components/ui/pending-link";

// ログインすると利用規約とプライバシーポリシーに同意したことになる，という表示
function ConsentNote({ className }: { className: string }) {
  return (
    <p className={`text-[11px] leading-4 text-slate-500 ${className}`}>
      ログインすると，
      <PendingLink
        href="/terms"
        className="text-slate-300 underline underline-offset-2 hover:text-white"
      >
        利用規約
      </PendingLink>
      と
      <PendingLink
        href="/privacy"
        className="text-slate-300 underline underline-offset-2 hover:text-white"
      >
        プライバシーポリシー
      </PendingLink>
      に同意したものとみなします
    </p>
  );
}

const features = [
  {
    icon: "⚡",
    title: "コミットで成長する",
    description:
      "コミット1件ごとに経験値が入り，pushした時にまとめて反映されます．経験値が貯まると，キャラクターがレベルアップ・進化します．",
  },
  {
    icon: "🔍",
    title: "変更の内容で経験値が変わる",
    description:
      "コミットメッセージと実際に変更したファイルから，新機能・修正・ドキュメントなどの種類を判定します．",
  },
  {
    icon: "📜",
    title: "成長履歴で振り返れる",
    description:
      "どのコミットで何XP得たかが時系列で残ります．後から見返しても，何のための変更か分かります．",
  },
];

/*
 * ログイン前に表示するトップページ．
 * ログインボタンは，スクロールしても付いてくるヘッダーの1か所だけに置く．
 */
export function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 py-3">
          <AppLogo />

          {/*
           * ログインの前に，利用規約とプライバシーポリシーに同意することを示す．
           * 広い画面ではボタンの下にまとめ，ロゴが帯の高さの真ん中に来るようにする．
           * スマホでは横に収まらないので，帯の下の段に出す．
           */}
          <div className="flex flex-col items-end gap-1">
            <GitHubLoginButton compact />
            <ConsentNote className="hidden text-right sm:block" />
          </div>

          <ConsentNote className="w-full text-right sm:hidden" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-8 pt-16">
        <section className="mb-16">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            コードを書くほど，
            <br />
            リポジトリのキャラが成長する．
          </h1>

          {/*
           * 日本語は文字の途中で折り返されるため，
           * 文節ごとにinline-blockにして区切りの良い位置で折り返す．
           */}
          <p className="mt-6 max-w-2xl leading-8 text-slate-300">
            <span className="inline-block">GitHubのリポジトリごとに</span>
            <span className="inline-block">キャラクターを育てる</span>
            <span className="inline-block">開発支援アプリです．</span>
            <br />
            <span className="inline-block">こまめに，</span>
            <span className="inline-block">何のための変更か伝わる</span>
            <span className="inline-block">コミットをするほど，</span>
            <span className="inline-block">キャラクターが大きく成長します．</span>
            <br />
            <span className="inline-block">育てたキャラクターで，</span>
            <span className="inline-block">ワールドを広げたり，</span>
            <span className="inline-block">ボスに挑んだりもできます．</span>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {/* ログインしなくても触れる，見本のワールド */}
            <PendingLink
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              🌍 ワールドをのぞいてみる
            </PendingLink>

            <a
              href="#how-to-use"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-400/20"
            >
              使い方を見る
              {/* 文字の「↓」はフォントによって下にずれるため，図形で描く */}
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
              </svg>
            </a>
          </div>
        </section>

        <section className="mb-20 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-3xl">{feature.icon}</p>

              <h2 className="mt-4 text-lg font-black text-white">
                {feature.title}
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        <GuideSections />

        <footer className="mt-auto border-t border-slate-800 pb-2 pt-10 text-center text-sm text-slate-600">
          <PendingLink
            href="/terms"
            className="text-slate-400 underline-offset-2 hover:text-white hover:underline"
          >
            利用規約
          </PendingLink>
          <span className="mx-3" aria-hidden="true">｜</span>
          <PendingLink
            href="/privacy"
            className="text-slate-400 underline-offset-2 hover:text-white hover:underline"
          >
            プライバシーポリシー
          </PendingLink>
          <p className="mt-2">© 2026 Coding RPG. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
