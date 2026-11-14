import "server-only";

import { createGitHubApp } from "@/lib/github/app";
import type { ChangedFile } from "@/lib/growth/xp";

// 同時に送るリクエストの数（GitHubの上限は100）
const MAX_CONCURRENT_REQUESTS = 10;

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

  /*
   * GitHubの「同時に大量のリクエストを送ると断られる」制限に
   * かからないよう，決まった数ずつ取得する．
   */
  for (
    let start = 0;
    start < shas.length;
    start += MAX_CONCURRENT_REQUESTS
  ) {
    const chunk = shas.slice(
      start,
      start + MAX_CONCURRENT_REQUESTS,
    );

    const results = await Promise.allSettled(
      chunk.map((sha) =>
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
          chunk[index],
          result.reason,
        );
        return;
      }

      filesBySha.set(
        chunk[index],
        (result.value.data.files ?? []).map((file) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch ?? null,
        })),
      );
    });
  }

  return filesBySha;
}
