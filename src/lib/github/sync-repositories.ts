import { listInstallationRepositories } from "@/lib/github/installation-repositories";
import { createAdminClient } from "@/lib/supabase/admin";

type SyncInstallationRepositoriesParams = {
  // GitHub上のインストールID
  githubInstallationId: number;
  // github_installations テーブルの行のID
  installationId: string;
  userId: string;
};

/*
 * アプリのリポジトリを，GitHubで今選ばれているリポジトリに合わせる．
 *
 * 選ばれているリポジトリは有効に，選択を外されたリポジトリは無効にする．
 * 無効にしてもキャラクターと成長履歴は消さないので，
 * GitHubで選び直すとそのまま戻ってくる．
 */
export async function syncInstallationRepositories({
  githubInstallationId,
  installationId,
  userId,
}: SyncInstallationRepositoriesParams) {
  const repositories =
    await listInstallationRepositories(
      githubInstallationId,
    );

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  /*
   * 先に選ばれているリポジトリを有効にしてから，残りを無効にする．
   * 逆の順番だと，途中で失敗した時に全部のリポジトリが無効になってしまう．
   */
  if (repositories.length > 0) {
    const { error: upsertError } = await supabase
      .from("repositories")
      .upsert(
        repositories.map((repository) => ({
          user_id: userId,
          github_installation_id: installationId,
          github_repository_id: repository.id,
          owner: repository.owner,
          name: repository.name,
          default_branch: repository.defaultBranch,
          html_url: repository.htmlUrl,
          is_private: repository.isPrivate,
          visibility: repository.visibility,
          is_active: true,
          updated_at: now,
        })),
        {
          onConflict: "user_id,github_repository_id",
        },
      );

    if (upsertError) {
      throw new Error(
        `Failed to save repositories: ${upsertError.message}`,
      );
    }
  }

  let deactivateQuery = supabase
    .from("repositories")
    .update({
      is_active: false,
      updated_at: now,
    })
    .eq("github_installation_id", installationId)
    .eq("is_active", true);

  if (repositories.length > 0) {
    deactivateQuery = deactivateQuery.not(
      "github_repository_id",
      "in",
      `(${repositories
        .map((repository) => repository.id)
        .join(",")})`,
    );
  }

  const { error: deactivateError } =
    await deactivateQuery;

  if (deactivateError) {
    throw new Error(
      `Failed to deactivate repositories: ${deactivateError.message}`,
    );
  }
}

/*
 * GitHubからリポジトリの追加・削除の通知が届いた時に同期する．
 * アプリでまだ連携の設定が終わっていないインストールは無視する．
 */
export async function syncInstallationRepositoriesFromWebhook(
  githubInstallationId: number,
) {
  const supabase = createAdminClient();

  const { data: installation, error } =
    await supabase
      .from("github_installations")
      .select("id, user_id")
      .eq(
        "github_installation_id",
        githubInstallationId,
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch GitHub installation: ${error.message}`,
    );
  }

  if (!installation) {
    return;
  }

  await syncInstallationRepositories({
    githubInstallationId,
    installationId: installation.id,
    userId: installation.user_id,
  });
}
