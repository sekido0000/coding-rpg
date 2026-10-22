import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createGitHubApp } from "@/lib/github/app";
import { verifyInstallState } from "@/lib/github/install-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type InstallationAccount = {
  id: number;
  login: string;
};

function getInstallationAccount(
  value: unknown,
): InstallationAccount | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const account =
    value as Record<string, unknown>;

  if (
    typeof account.id !== "number" ||
    typeof account.login !== "string"
  ) {
    return null;
  }

  return {
    id: account.id,
    login: account.login,
  };
}

function getGitHubUserId(
  user: User,
): number | null {
  const githubIdentity =
    user.identities?.find(
      (identity) =>
        identity.provider === "github",
    );

  const identityData =
    githubIdentity?.identity_data;

  const providerId =
    identityData?.provider_id ??
    user.user_metadata.provider_id ??
    user.user_metadata.sub;

  const githubUserId =
    Number(providerId);

  if (
    !Number.isSafeInteger(githubUserId) ||
    githubUserId <= 0
  ) {
    return null;
  }

  return githubUserId;
}

export async function GET(
  request: Request,
) {
  try {
    const requestUrl =
      new URL(request.url);

    const installationIdValue =
      requestUrl.searchParams.get(
        "installation_id",
      );

    const state =
      requestUrl.searchParams.get(
        "state",
      );

    if (
      !installationIdValue ||
      !state
    ) {
      throw new Error(
        "インストール情報が不足しています",
      );
    }

    const installationId =
      Number(installationIdValue);

    if (
      !Number.isSafeInteger(
        installationId,
      ) ||
      installationId <= 0
    ) {
      throw new Error(
        "installation_idが不正です",
      );
    }

    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL("/", request.url),
      );
    }

    const statePayload =
      verifyInstallState(state);

    if (
      !statePayload ||
      statePayload.userId !== user.id
    ) {
      throw new Error(
        "インストール状態を検証できません",
      );
    }

    const githubUserId =
      getGitHubUserId(user);

    if (!githubUserId) {
      throw new Error(
        "GitHubユーザーIDを取得できません",
      );
    }

    const app = createGitHubApp();

    /*
     * installation_idが本当にこのGitHub Appの
     * インストールか確認する．
     */
    const {
      data: installation,
    } = await app.octokit.request(
      "GET /app/installations/{installation_id}",
      {
        installation_id:
          installationId,
      },
    );

    /*
     * MVPでは個人アカウントだけを対象とする．
     */
    if (
      installation.target_type !==
      "User"
    ) {
      throw new Error(
        "現在は個人アカウントのリポジトリだけ連携できます",
      );
    }

    const installationAccount =
      getInstallationAccount(
        installation.account,
      );

    if (!installationAccount) {
      throw new Error(
        "インストール先アカウントを確認できません",
      );
    }

    if (
      installationAccount.id !==
      githubUserId
    ) {
      throw new Error(
        "ログイン中のGitHubアカウントとインストール先が一致しません",
      );
    }

    const installationOctokit =
      await app.getInstallationOctokit(
        installationId,
      );

    const repositories =
      await installationOctokit.paginate(
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

    const adminClient =
      createAdminClient();

    const {
      data: savedInstallation,
      error:
        saveInstallationError,
    } = await adminClient
      .from("github_installations")
      .upsert(
        {
          user_id: user.id,
          github_installation_id:
            installationId,
          account_id:
            installationAccount.id,
          account_login:
            installationAccount.login,
          target_type:
            installation.target_type,
          repository_selection:
            installation.repository_selection,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "github_installation_id",
        },
      )
      .select("id")
      .single();

    if (
      saveInstallationError ||
      !savedInstallation
    ) {
      throw new Error(
        `インストールの保存に失敗しました: ${
          saveInstallationError?.message ??
          "unknown error"
        }`,
      );
    }

    /*
     * GitHub側で選択解除されたリポジトリを
     * 一旦非アクティブにする．
     */
    const {
      error: deactivateError,
    } = await adminClient
      .from("repositories")
      .update({
        is_active: false,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "github_installation_id",
        savedInstallation.id,
      );

    if (deactivateError) {
      throw new Error(
        `既存リポジトリの更新に失敗しました: ${deactivateError.message}`,
      );
    }

    const repositoryRows =
      repositories.map((repository) => ({
        user_id: user.id,

        github_installation_id:
          savedInstallation.id,

        github_repository_id:
          repository.id,

        owner:
          repository.owner?.login ??
          repository.full_name.split(
            "/",
          )[0],

        name: repository.name,

        default_branch:
          repository.default_branch,

        html_url:
          repository.html_url,

        is_private:
          repository.private,

        visibility:
          repository.visibility ??
          (repository.private
            ? "private"
            : "public"),

        is_active: true,

        updated_at:
          new Date().toISOString(),
      }));

    if (repositoryRows.length > 0) {
      const {
        error: repositoryError,
      } = await adminClient
        .from("repositories")
        .upsert(repositoryRows, {
          onConflict:
            "user_id,github_repository_id",
        });

      if (repositoryError) {
        throw new Error(
          `リポジトリの保存に失敗しました: ${repositoryError.message}`,
        );
      }

    }

    return NextResponse.redirect(
      new URL(
        "/characters/setup",
        request.url,
      ),
    );
  } catch (error) {
    console.error(
      "GitHub App setup failed:",
      error,
    );

    return NextResponse.redirect(
      new URL(
        "/?github=error",
        request.url,
      ),
    );
  }
}
