/*
 * バッジの画像（SVG）を作る．
 *
 * GitHub の README などに画像として貼られるので，画像の中から別のファイルは読めない．
 * キャラクターのドット絵は，SVG の中身をそのまま埋め込む．
 * 名前やリポジトリ名は出さず，キャラクターの種類（進化した姿）とレベルだけを出す．
 */

export type BadgeMember = {
  level: number;
  evolutionName: string;
  // キャラクターの SVG の中身（32×32 の viewBox の中に描く要素）
  sprite: string;
};

// パーティーのカードに並べる最大の数
export const PARTY_CARD_MAX = 6;

const FONT =
  "'Hiragino Sans','Yu Gothic UI','Meiryo','Noto Sans JP',system-ui,sans-serif";

export function escapeXml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/*
 * キャラクターの SVG ファイルから，描く要素だけを取り出す．
 * タイトルや，作る時に使った情報（metadata）は除く．
 */
export function extractSpriteBody(svg: string) {
  const start = svg.indexOf(">", svg.indexOf("<svg"));
  const end = svg.lastIndexOf("</svg>");

  if (start < 0 || end < 0) {
    return "";
  }

  return svg
    .slice(start + 1, end)
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/g, "")
    .trim();
}

// 文字の幅のおおよそ（全角は字の大きさと同じ，半角はその6割）
export function estimateTextWidth(text: string, fontSize: number) {
  return [...text].reduce(
    (width, char) => width + (char.charCodeAt(0) > 0x2e80 ? fontSize : fontSize * 0.6),
    0,
  );
}

const sprite = (body: string, x: number, y: number, size: number) =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 32 32" shape-rendering="crispEdges">${body}</svg>`;

/*
 * キャラクター1体の小さいバッジ（README 向け．目立ちすぎない大きさ）．
 * ［Coding RPG｜(絵) Lv.12 王国の勇者］
 */
export function renderCharacterBadge(member: BadgeMember) {
  const height = 22;
  const label = "Coding RPG";
  const value = `Lv.${member.level} ${member.evolutionName}`;
  const labelWidth = Math.ceil(estimateTextWidth(label, 11)) + 14;
  const valueWidth = Math.ceil(estimateTextWidth(value, 11)) + 14 + 18;
  const width = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(`${label}: ${value}`)}">
<title>${escapeXml(`${label}: ${value}`)}</title>
<clipPath id="r"><rect width="${width}" height="${height}" rx="4"/></clipPath>
<g clip-path="url(#r)">
<rect width="${labelWidth}" height="${height}" fill="#0f172a"/>
<rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="#047857"/>
</g>
<g font-family="${FONT}" font-size="11" font-weight="700" fill="#ffffff">
<text x="7" y="15">${escapeXml(label)}</text>
<text x="${labelWidth + 25}" y="15">${escapeXml(value)}</text>
</g>
${sprite(member.sprite, labelWidth + 4, 2, 18)}
</svg>`;
}

/*
 * キャラクター全員を並べたパーティーのカード（GitHub のプロフィールや個人のサイト向け）．
 * レベルの高い順に，最大6体まで並べる．
 */
export function renderPartyCard(members: BadgeMember[]) {
  const shown = [...members]
    .sort((a, b) => b.level - a.level)
    .slice(0, PARTY_CARD_MAX);
  const columns = Math.max(shown.length, 1);
  const cellWidth = 104;
  const padding = 20;
  const width = Math.max(padding * 2 + columns * cellWidth, 360);
  const height = 196;
  const totalLevel = members.reduce((sum, member) => sum + member.level, 0);
  const offsetX = (width - columns * cellWidth) / 2;

  const cells = shown
    .map((member, index) => {
      const x = offsetX + index * cellWidth;
      const center = x + cellWidth / 2;

      return `${sprite(member.sprite, center - 36, 52, 72)}
<text x="${center}" y="146" text-anchor="middle" font-size="13" font-weight="700" fill="#fde68a">Lv.${member.level}</text>
<text x="${center}" y="165" text-anchor="middle" font-size="11" fill="#cbd5e1">${escapeXml(member.evolutionName)}</text>`;
    })
    .join("\n");

  const empty =
    shown.length === 0
      ? `<text x="${width / 2}" y="110" text-anchor="middle" font-size="13" fill="#94a3b8">まだキャラクターがいません</text>`
      : "";

  const title = `Coding RPG パーティー（${members.length}体・合計 Lv.${totalLevel}）`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
<title>${escapeXml(title)}</title>
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2a1f"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>
<rect width="${width}" height="${height}" rx="14" fill="url(#bg)" stroke="#1e3a2f"/>
<g font-family="${FONT}">
<text x="${padding}" y="32" font-size="15" font-weight="800" fill="#4ade80">Coding RPG</text>
<text x="${width - padding}" y="32" text-anchor="end" font-size="12" fill="#94a3b8">${members.length}体・合計 Lv.${totalLevel}</text>
${cells}
${empty}
</g>
</svg>`;
}

// バッジが見つからない時（止めた・作り直した）の画像
export function renderMissingBadge() {
  const text = "Coding RPG｜このバッジは止められています";
  const width = Math.ceil(estimateTextWidth(text, 11)) + 16;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="22" viewBox="0 0 ${width} 22" role="img" aria-label="${escapeXml(text)}">
<rect width="${width}" height="22" rx="4" fill="#334155"/>
<text x="8" y="15" font-family="${FONT}" font-size="11" fill="#e2e8f0">${escapeXml(text)}</text>
</svg>`;
}
