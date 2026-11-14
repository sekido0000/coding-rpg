import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createGitHubApp } from "@/lib/github/app";
import { verifyInstallState } from "@/lib/github/install-state";
import { syncInstallationRepositories } from "@/lib/github/sync-repositories";
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

    if (!installationIdValue) {
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

    /*
     * アプリのボタンから始めた時は，署名付きのstateが付く．
     * GitHubの設定画面で直接リポジトリの選択を変えた時は，stateが付かない．
     */
    if (state) {
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

    const adminClient =
      createAdminClient();

    /*
     * GitHubの設定画面から戻ってきた時（stateなし）は，
     * すでに保存してある本人のインストールのリポジトリだけを同期する．
     */
    if (!state) {
      const {
        data: savedInstallation,
        error: installationError,
      } = await adminClient
        .from("github_installations")
        .select("id")
        .eq(
          "github_installation_id",
          installationId,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (installationError) {
        throw new Error(
          `インストールの取得に失敗しました: ${installationError.message}`,
        );
      }

      if (savedInstallation) {
        await syncInstallationRepositories({
          githubInstallationId:
            installationId,
          installationId:
            savedInstallation.id,
          userId: user.id,
        });
      }

      return NextResponse.redirect(
        new URL("/", request.url),
      );
    }

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

    await syncInstallationRepositories({
      githubInstallationId:
        installationId,
      installationId:
        savedInstallation.id,
      userId: user.id,
    });

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
