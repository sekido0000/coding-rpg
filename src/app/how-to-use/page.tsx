import { PendingLink } from "@/components/ui/pending-link";

import { GuideSections } from "@/components/guide/guide-sections";

export default function HowToUsePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12">
          <PendingLink
            href="/"
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-emerald-400/40 hover:text-white"
          >
            ← ホームへ戻る
          </PendingLink>
        </header>

        {/* トップページの使い方と同じ内容を表示する */}
        <GuideSections />

        <footer className="mt-16 text-center text-sm text-slate-600">
          © 2026 Coding RPG. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
