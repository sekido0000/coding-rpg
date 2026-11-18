import "server-only";

import { renderMissingBadge } from "@/lib/badges/render";

/*
 * バッジの画像の返し方．
 * GitHub などは画像を中継して覚えておくので，育った時に絵が変わるよう，覚えておく時間を短めにする．
 * 画像の中でスクリプトなどが動かないよう，SVG の中で使えるものを絞る．
 */
const HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": "public, max-age=1800, s-maxage=1800",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
  "X-Content-Type-Options": "nosniff",
};

export function svgResponse(svg: string) {
  return new Response(svg, { headers: HEADERS });
}

// 止めた・作り直した・形がおかしいバッジ
export function missingBadgeResponse() {
  return new Response(renderMissingBadge(), {
    status: 404,
    headers: { ...HEADERS, "Cache-Control": "public, max-age=300" },
  });
}
