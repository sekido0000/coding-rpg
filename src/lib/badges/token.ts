import { randomBytes } from "node:crypto";

// バッジの URL に使う，推測できない文字列
export function createBadgeToken() {
  return randomBytes(18).toString("base64url");
}

// URL の最後の「◯◯.svg」から文字列を取り出す．形がおかしい時は null
export function parseBadgeFile(file: string) {
  const match = /^([A-Za-z0-9_-]{16,64})\.svg$/.exec(file);

  return match ? match[1] : null;
}
