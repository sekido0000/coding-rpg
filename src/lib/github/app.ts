import "server-only";

import { App } from "octokit";

let cachedApp: App | null = null;

export function createGitHubApp(): App {
  if (cachedApp) {
    return cachedApp;
  }

  const appIdValue =
    process.env.GITHUB_APP_ID;

  const privateKeyBase64 =
    process.env
      .GITHUB_APP_PRIVATE_KEY_BASE64;

  if (!appIdValue) {
    throw new Error(
      "GITHUB_APP_IDが設定されていません",
    );
  }

  if (!privateKeyBase64) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY_BASE64が設定されていません",
    );
  }

  const appId = Number(appIdValue);

  if (
    !Number.isSafeInteger(appId) ||
    appId <= 0
  ) {
    throw new Error(
      "GITHUB_APP_IDが不正です",
    );
  }

  const privateKey = Buffer.from(
    privateKeyBase64,
    "base64",
  ).toString("utf8");

  if (
    !privateKey.includes(
      "BEGIN RSA PRIVATE KEY",
    ) &&
    !privateKey.includes(
      "BEGIN PRIVATE KEY",
    )
  ) {
    throw new Error(
      "GitHub Appの秘密鍵を復元できません",
    );
  }

  cachedApp = new App({
    appId,
    privateKey,
  });

  return cachedApp;
}