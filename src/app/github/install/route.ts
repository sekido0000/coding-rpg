import { NextResponse } from "next/server";

import { createGitHubApp } from "@/lib/github/app";
import { createInstallState } from "@/lib/github/install-state";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(
      new URL("/", request.url),
    );
  }

  const state = createInstallState(
    user.id,
  );

  const app = createGitHubApp();

  const installationUrl =
    await app.getInstallationUrl({
      state,
    });

  return NextResponse.redirect(
    installationUrl,
  );
}