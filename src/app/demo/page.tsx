import type { Metadata } from "next";

import { GitHubLoginButton } from "@/components/auth/github-login-button";
import { AppLogo } from "@/components/layout/app-logo";
import { PendingLink } from "@/components/ui/pending-link";
import { RepositoryWorld } from "@/components/world/repository-world";
import {
  DEMO_PLACEMENTS,
  getDemoActivity,
  getDemoCharacters,
} from "@/lib/world/demo";

export const metadata: Metadata = {
  title: "見本のワールド | Coding RPG",
};

// 会話の話題の日時を，見るたびに今から数えるため
export const dynamic = "force-dynamic";

/*
 * ログインしていなくても触れる，見本のワールド．
 * 見本のキャラクターが歩いたり話したりし，建物の中ものぞける．
 * 建てる・買う・ほかのページへ移ることはせず，ログインの案内を出す．
 */
export default function DemoPage() {
  return (
    <main className="flex h-dvh flex-col bg-slate-950">
      <h1 className="sr-only">Coding RPG 見本のワールド</h1>

      <header className="relative z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-5">
          <AppLogo />

          <p className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
            見本のワールド
          </p>

          <div className="ml-auto flex items-center gap-3">
            <PendingLink
              href="/"
              className="text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              トップページへ
            </PendingLink>
            <GitHubLoginButton compact />
          </div>

          <p className="w-full text-xs leading-5 text-slate-400">
            見本のキャラクターたちです．ログインすると，あなたのリポジトリのキャラクターがここで暮らし始めます．
            <span className="ml-1 text-slate-500">
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
              に同意したものとみなします．
            </span>
          </p>
        </div>
      </header>

      {/* ワールド（残りの高さいっぱい）．重なりをワールドの中に閉じ込める */}
      <div className="relative isolate min-h-0 flex-1">
        <RepositoryWorld
          characters={getDemoCharacters()}
          activity={getDemoActivity()}
          hasPendingRewards={false}
          inventory={{ gold: 0, items: {} }}
          placements={DEMO_PLACEMENTS}
          isDemo
        />
      </div>
    </main>
  );
}
