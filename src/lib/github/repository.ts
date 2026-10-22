import { createGitHubApp } from "@/lib/github/app";

function parseRepositoryUrl(htmlUrl: string) {
  const url = new URL(htmlUrl);
  const [, owner, repo] = url.pathname.split("/");

  return { owner, repo };
}

export async function getRepositoryInfo(
  installationId: number,
  htmlUrl: string,
) {
  const { owner, repo } = parseRepositoryUrl(htmlUrl);

  const app = createGitHubApp();
  const octokit =
    await app.getInstallationOctokit(
      installationId,
    );

  const branches =
    await octokit.rest.repos.listBranches({
      owner,
      repo,
    });

  const commits =
    await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 100,
    });

  return {
    branches: branches.data,
    commits: commits.data,
  };
}