"use client";

import { useFormStatus } from "react-dom";

import { removeRepositoryAction } from "@/app/actions/character-actions";
import { Spinner } from "@/components/ui/spinner";

type DeleteRepositoryButtonProps = {
  repositoryId: string;
  repositoryName: string;
  compact?: boolean;
};

function SubmitButton({
  compact,
}: {
  compact: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        compact
          ? "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10 disabled:cursor-wait disabled:opacity-60"
          : "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10 disabled:cursor-wait disabled:opacity-60"
      }
    >
      {pending && <Spinner />}
      {pending
        ? "削除しています..."
        : "このリポジトリの連携を解除"}
    </button>
  );
}

export function DeleteRepositoryButton({
  repositoryId,
  repositoryName,
  compact = false,
}: DeleteRepositoryButtonProps) {
  return (
    <form
      action={removeRepositoryAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `${repositoryName} をRepo Petの一覧から削除しますか？\nキャラクターの成長データは保持されます。`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input
        type="hidden"
        name="repositoryId"
        value={repositoryId}
      />

      <SubmitButton compact={compact} />
    </form>
  );
}
