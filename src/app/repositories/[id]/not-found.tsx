import { PendingLink } from "@/components/ui/pending-link";

export default function RepositoryNotFound() {
  return (
    <main className="repo-world grid min-h-screen place-items-center px-6">
      <div className="repo-panel max-w-lg p-10 text-center">
        <p className="repo-kicker">
          Repository not found
        </p>
        <h1 className="mt-3 text-3xl font-black text-white">
          このリポジトリは見つかりません
        </h1>
        <p className="mt-4 leading-7 text-slate-400">
          連携が解除されたか、アクセスする権限がない可能性があります。
        </p>
        <PendingLink
          href="/"
          className="mt-7 inline-flex rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-300"
        >
          一覧へ戻る
        </PendingLink>
      </div>
    </main>
  );
}
