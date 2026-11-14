import "server-only";

import { createGitHubApp } from "@/lib/github/app";

export type InstallationRepository = {
  id: number;
  owner: string;
  name: string;
  defaultBranch: string | undefined;
  htmlUrl: string;
  isPrivate: boolean;
  visibility: string;
};

/*
 * GitHub Appのインストールで，今選ばれているリポジトリの一覧を取得する．
 */
export async function listInstallationRepositories(
  githubInstallationId: number,
): Promise<InstallationRepository[]> {
  const app = createGitHubApp();
  const octokit =
    await app.getInstallationOctokit(
      githubInstallationId,
    );

  const repositories = await octokit.paginate(
    "GET /installation/repositories",
    {
      per_page: 100,
    },
  );

  const hasInvalidRepository =
    repositories.some(
      (repository) =>
        !repository ||
        typeof repository.id !== "number" ||
        typeof repository.name !== "string" ||
        typeof repository.full_name !== "string",
    );

  if (hasInvalidRepository) {
    console.error(
      "Invalid GitHub repository response:",
      repositories,
    );

    throw new Error(
      "GitHubから不正なリポジトリ情報が返されました",
    );
  }

  return repositories.map((repository) => ({
    id: repository.id,
    owner:
      repository.owner?.login ??
      repository.full_name.split("/")[0],
    name: repository.name,
    defaultBranch: repository.default_branch,
    htmlUrl: repository.html_url,
    isPrivate: repository.private,
    visibility:
      repository.visibility ??
      (repository.private ? "private" : "public"),
  }));
}
