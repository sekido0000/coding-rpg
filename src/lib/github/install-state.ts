import "server-only";

import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

type InstallStatePayload = {
  userId: string;
  expiresAt: number;
  nonce: string;
};

function getStateSecret(): string {
  const secret =
    process.env
      .GITHUB_INSTALL_STATE_SECRET;

  if (!secret) {
    throw new Error(
      "GITHUB_INSTALL_STATE_SECRETが設定されていません",
    );
  }

  return secret;
}

export function createInstallState(
  userId: string,
): string {
  const payload: InstallStatePayload = {
    userId,
    expiresAt:
      Date.now() + 10 * 60 * 1000,
    nonce: randomUUID(),
  };

  const encodedPayload = Buffer.from(
    JSON.stringify(payload),
  ).toString("base64url");

  const signature = createHmac(
    "sha256",
    getStateSecret(),
  )
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyInstallState(
  state: string,
): InstallStatePayload | null {
  const [
    encodedPayload,
    receivedSignature,
  ] = state.split(".");

  if (
    !encodedPayload ||
    !receivedSignature
  ) {
    return null;
  }

  const expectedSignature = createHmac(
    "sha256",
    getStateSecret(),
  )
    .update(encodedPayload)
    .digest();

  const receivedSignatureBuffer =
    Buffer.from(
      receivedSignature,
      "base64url",
    );

  if (
    expectedSignature.length !==
    receivedSignatureBuffer.length
  ) {
    return null;
  }

  if (
    !timingSafeEqual(
      expectedSignature,
      receivedSignatureBuffer,
    )
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(
        encodedPayload,
        "base64url",
      ).toString("utf8"),
    ) as InstallStatePayload;

    if (
      typeof payload.userId !== "string" ||
      typeof payload.expiresAt !==
        "number" ||
      typeof payload.nonce !== "string"
    ) {
      return null;
    }

    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}