import { describe, expect, it } from "vitest";

import {
  CHARACTER_NAME_MAX_LENGTH,
  normalizeCharacterName,
} from "./name";

describe("キャラクターの名前", () => {
  it("前後の空白を取り除いて返す", () => {
    expect(normalizeCharacterName("  ポチ  ")).toBe("ポチ");
  });

  it("空や空白だけの名前は使えない", () => {
    expect(normalizeCharacterName("")).toBeNull();
    expect(normalizeCharacterName("   ")).toBeNull();
  });

  it("上限の文字数までは使え，超えると使えない", () => {
    const longest = "あ".repeat(CHARACTER_NAME_MAX_LENGTH);

    expect(normalizeCharacterName(longest)).toBe(longest);
    expect(
      normalizeCharacterName(`${longest}い`),
    ).toBeNull();
  });

  it("絵文字は1文字として数える", () => {
    const emojis = "🐉".repeat(CHARACTER_NAME_MAX_LENGTH);

    expect(normalizeCharacterName(emojis)).toBe(emojis);
  });

  it("改行などの制御文字を含む名前は使えない", () => {
    expect(normalizeCharacterName("ポ\nチ")).toBeNull();
  });

  it("文字列でない値は使えない", () => {
    expect(normalizeCharacterName(null)).toBeNull();
    expect(normalizeCharacterName(123)).toBeNull();
  });
});
