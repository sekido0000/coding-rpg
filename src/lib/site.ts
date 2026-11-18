import "server-only";

import { headers } from "next/headers";

/*
 * 今開いているサイトの URL の始まり（例：https://example.com）．
 * バッジを貼る文に，このサイトの URL を入れるために使う．
 */
export async function getRequestOrigin() {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}
