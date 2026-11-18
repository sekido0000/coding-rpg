import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function updateSession(
  request: NextRequest,
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            },
          );

          supabaseResponse =
            NextResponse.next({
              request,
            });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options,
              );
            },
          );

          Object.entries(headers).forEach(
            ([name, value]) => {
              supabaseResponse.headers.set(
                name,
                value,
              );
            },
          );
        },
      },
    },
  );

  /*
   * createServerClientとgetClaimsの間には
   * 別の処理を入れない．
   */
  const { data } =
    await supabase.auth.getClaims();

  const claims = data?.claims;

  /*
   * トップページ・使い方・見本のワールド・利用規約・プライバシーポリシーはログイン前でも見られるようにする．
   * データを全部消した後の案内も，ログアウトした状態で見せる．
   * トップページはログイン状態に応じて表示を切り替える．
   */
  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/how-to-use" ||
    request.nextUrl.pathname === "/privacy" ||
    request.nextUrl.pathname === "/terms" ||
    request.nextUrl.pathname === "/demo" ||
    request.nextUrl.pathname === "/account/deleted" ||
    request.nextUrl.pathname.startsWith(
      "/login",
    ) ||
    request.nextUrl.pathname.startsWith(
      "/auth",
    );

  if (!claims && !isPublicRoute) {
    // 未ログインの時はトップページ（ログインボタンあり）へ
    const url = request.nextUrl.clone();
    url.pathname = "/";

    return NextResponse.redirect(url);
  }

  if (
    claims &&
    request.nextUrl.pathname === "/login"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}