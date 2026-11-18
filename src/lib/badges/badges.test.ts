import { describe, expect, it } from "vitest";

import {
  PARTY_CARD_MAX,
  escapeXml,
  extractSpriteBody,
  renderCharacterBadge,
  renderPartyCard,
} from "@/lib/badges/render";
import { createBadgeToken, parseBadgeFile } from "@/lib/badges/token";

const member = (level: number, evolutionName = "王国の勇者") => ({
  level,
  evolutionName,
  sprite: '<rect x="1" y="1" width="2" height="2" fill="#fff" />',
});

describe("バッジの画像", () => {
  it("キャラクターのバッジに，レベルと進化した姿を出す", () => {
    const svg = renderCharacterBadge(member(12));

    expect(svg).toContain("Lv.12 王国の勇者");
    expect(svg).toContain('viewBox="0 0 32 32"');
    expect(svg.startsWith("<svg")).toBe(true);
  });

  it("パーティーのカードは，レベルの高い順に最大6体まで並べ，合計レベルは全員分", () => {
    const members = Array.from({ length: 8 }, (_, index) => member(index + 1));
    const svg = renderPartyCard(members);

    // 1体ごとのレベル（見出しの「合計 Lv.」は数えない）
    expect(svg.match(/>Lv\.\d+<\/text>/g)).toHaveLength(PARTY_CARD_MAX);
    expect(svg).toContain("Lv.8</text>");
    expect(svg).not.toContain("Lv.1</text>");
    expect(svg).toContain("8体・合計 Lv.36");
  });

  it("文字は XML として安全な形にする", () => {
    expect(escapeXml('<a href="x">&\'')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&apos;",
    );
    expect(renderCharacterBadge(member(1, "<script>"))).not.toContain(
      "<script>",
    );
  });

  it("キャラクターの SVG から，描く要素だけを取り出す", () => {
    const body = extractSpriteBody(
      '<svg xmlns="x" viewBox="0 0 32 32"><title>勇者</title><metadata id="m"><![CDATA[{}]]></metadata><rect x="1" /></svg>',
    );

    expect(body).toBe('<rect x="1" />');
  });
});

describe("バッジの URL", () => {
  it("作った文字列は，URL の形に合う", () => {
    const token = createBadgeToken();

    expect(parseBadgeFile(`${token}.svg`)).toBe(token);
  });

  it("形がおかしいものは受け付けない", () => {
    expect(parseBadgeFile("short.svg")).toBeNull();
    expect(parseBadgeFile("abcdefghijklmnopqrstuvwx.png")).toBeNull();
    expect(parseBadgeFile("../../etc/passwd.svg")).toBeNull();
  });
});
