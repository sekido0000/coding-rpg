import { getCharacterBadgeMember } from "@/lib/badges/data";
import { parseBadgeFile } from "@/lib/badges/token";
import { renderCharacterBadge } from "@/lib/badges/render";
import { missingBadgeResponse, svgResponse } from "@/lib/badges/response";

/*
 * キャラクター1体の小さいバッジの画像（/api/badge/character/◯◯.svg）．
 * 本人が有効にした時だけ，誰でも見られる．名前やリポジトリ名は出さない．
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const token = parseBadgeFile((await params).file);

  if (!token) {
    return missingBadgeResponse();
  }

  const member = await getCharacterBadgeMember(token);

  return member
    ? svgResponse(renderCharacterBadge(member))
    : missingBadgeResponse();
}
