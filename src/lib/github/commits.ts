import "server-only";

import { createGitHubApp } from "@/lib/github/app";
import type { ChangedFile } from "@/lib/growth/xp";

type GetCommitFilesParams = {
  installationId: number;
  owner: string;
  repo: string;
  shas: string[];
};

/*
 * GitHub APIから，コミットごとの変更ファイルと行数を取得する．
 * 取得に失敗したコミットは結果に含めない．
 */
export async function getCommitFiles({
  installationId,
  owner,
  repo,
  shas,
}: GetCommitFilesParams) {
  const filesBySha = new Map<string, ChangedFile[]>();

  const app = createGitHubApp();
  const octokit =
    await app.getInstallationOctokit(
      installationId,
    );

  const results = await Promise.allSettled(
    shas.map((sha) =>
      octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      }),
    ),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        "Failed to fetch commit:",
        shas[index],
        result.reason,
      );
      return;
    }

    filesBySha.set(
      shas[index],
      (result.value.data.files ?? []).map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch ?? null,
      })),
    );
  });

  return filesBySha;
}
