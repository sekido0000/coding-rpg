import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { syncInstallationRepositoriesFromWebhook } from "@/lib/github/sync-repositories";
import { updateCharacter } from "@/lib/github/updateCharacter";
import { createAdminClient } from "@/lib/supabase/admin";

function verifySignature(
  payload: string,
  signature: string,
) {
  const secret =
    process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "GITHUB_WEBHOOK_SECRET is not set",
    );
  }

  const hmac = crypto.createHmac(
    "sha256",
    secret,
  );

  const digest =
    "sha256=" +
    hmac
      .update(payload)
      .digest("hex");

  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature);

  // 長さが違うとtimingSafeEqualが例外を投げるため，先に比べる
  if (
    digestBuffer.length !==
    signatureBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    digestBuffer,
    signatureBuffer,
  );
}

/*
 * 受信記録を残す日数．
 * GitHubの画面から再送できるのは過去数日分の通知だけなので，
 * それより古い記録は二重処理の防止に使われない．余裕を見て7日にする．
 */
const DELIVERY_RETENTION_DAYS = 7;

/*
 * 古い受信記録を消す．
 * 失敗しても通知の処理には影響しないので，ログだけ残す．
 */
async function deleteOldDeliveries() {
  const supabase = createAdminClient();

  const threshold = new Date(
    Date.now() -
      DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase
    .from("webhook_deliveries")
    .delete()
    .lt("received_at", threshold);

  if (error) {
    console.error(
      "Failed to delete old webhook deliveries",
      error,
    );
  }
}

/*
 * 通知のIDを記録する．
 * すでに記録済み（GitHubからの再送）の時はfalseを返す．
 */
async function recordDelivery(
  deliveryId: string,
  event: string,
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("webhook_deliveries")
    .insert({
      delivery_id: deliveryId,
      event,
    });

  if (!error) {
    await deleteOldDeliveries();
    return true;
  }

  // 主キーの重複＝処理済みの通知
  if (error.code === "23505") {
    return false;
  }

  /*
   * テーブルがないなど記録自体に失敗した時は，
   * 通知を取りこぼさないよう処理を続ける．
   */
  console.error(
    "Failed to record webhook delivery",
    error,
  );

  return true;
}

/*
 * 処理に失敗した時は記録を消し，
 * GitHubから再送された時にもう一度処理できるようにする．
 */
async function forgetDelivery(
  deliveryId: string,
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("webhook_deliveries")
    .delete()
    .eq("delivery_id", deliveryId);

  if (error) {
    console.error(
      "Failed to delete webhook delivery",
      error,
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  const rawBody = await request.text();

  const signature =
    request.headers.get(
      "x-hub-signature-256",
    );

  if (!signature) {
    console.error(
      "Missing GitHub signature",
    );

    return NextResponse.json(
      { error: "Missing signature" },
      { status: 401 },
    );
  }

  const isValid =
    verifySignature(
      rawBody,
      signature,
    );

  if (!isValid) {
    console.error(
      "Invalid GitHub signature",
    );

    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 },
    );
  }

  const event =
    request.headers.get(
      "x-github-event",
    );

  const payload =
    JSON.parse(rawBody);

  console.log("=== GitHub Webhook ===");
  console.log("Event:", event);


  if (event === "installation") {
    const action = payload.action;

    if (action === "deleted") {
      const githubInstallationId =
        payload.installation.id;

      const supabase =
        createAdminClient();

      const {
        data: installation,
        error,
      } = await supabase
        .from("github_installations")
        .select("id")
        .eq(
          "github_installation_id",
          githubInstallationId,
        )
        .single();

      if (error || !installation) {
        console.error(
          "GitHub installation not found",
          error,
        );

        return NextResponse.json({
          received: true,
        });
      }

      const {
        error: updateError,
      } = await supabase
        .from("repositories")
        .update({
          is_active: false,
        })
        .eq(
          "github_installation_id",
          installation.id,
        );

      if (updateError) {
        console.error(
          "Failed to deactivate repository",
          updateError,
        );
      } else {
        console.log(
          "Repository deactivated",
        );
      }
    }
  }


  /*
   * GitHubの設定画面でリポジトリの選択が変わった時に，アプリを合わせる．
   * 何度処理しても結果は同じなので，再送の除外はしない．
   */
  if (event === "installation_repositories") {
    await syncInstallationRepositoriesFromWebhook(
      payload.installation.id,
    );
  }

  if (event === "push") {
    const deliveryId =
      request.headers.get(
        "x-github-delivery",
      );

    // 再送された通知で経験値を二重に加算しない
    if (
      deliveryId &&
      !(await recordDelivery(
        deliveryId,
        event,
      ))
    ) {
      console.log(
        "Duplicate delivery skipped:",
        deliveryId,
      );

      return NextResponse.json({
        ok: true,
      });
    }

    try {
      await updateCharacter(payload);
    } catch (error) {
      if (deliveryId) {
        await forgetDelivery(deliveryId);
      }

      throw error;
    }
  }

  return NextResponse.json({
    ok: true,
  });
}