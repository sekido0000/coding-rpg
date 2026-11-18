import { getPartyBadgeMembers } from "@/lib/badges/data";
import { parseBadgeFile } from "@/lib/badges/token";
import { renderPartyCard } from "@/lib/badges/render";
import { missingBadgeResponse, svgResponse } from "@/lib/badges/response";

/*
 * パーティーのカードの画像（/api/badge/party/◯◯.svg）．
 * 本人が有効にした時だけ，誰でも見られる．名前やリポジトリ名は出さない．
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const token = parseBadgeFile((await params).file);

  if (!token) {
    return missingBadgeResponse();
  }

  const members = await getPartyBadgeMembers(new URL(request.url).origin, token);

  return members ? svgResponse(renderPartyCard(members)) : missingBadgeResponse();
}
