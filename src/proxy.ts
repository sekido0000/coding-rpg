import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // GitHub Webhook と，誰でも見られるバッジの画像は認証を通さない
  if (
    request.nextUrl.pathname === "/api/github/webhook" ||
    request.nextUrl.pathname.startsWith("/api/badge/")
  ) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};