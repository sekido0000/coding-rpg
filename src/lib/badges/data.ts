import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { extractSpriteBody, type BadgeMember } from "@/lib/badges/render";
import {
  getCharacterEvolution,
  isCharacterType,
} from "@/lib/characters/catalog";
import { createAdminClient } from "@/lib/supabase/admin";

// 一覧（catalog）にあるキャラクターの絵の場所の形
const SPRITE_PATH = /^\/characters\/[a-z_]+\/level-[1-5]\.svg$/;

// 埋め込んでよい SVG か（SVG で始まり，スクリプトや HTML を含まない）
function isSafeSprite(file: string) {
  return (
    file.trimStart().startsWith("<svg") &&
    !/<script|<html|<foreignObject|javascript:/i.test(file)
  );
}

/*
 * キャラクターのドット絵を，public/characters の SVG ファイルから読む．
 *
 * 自分のサイトに HTTP で取りに行くと，プレビュー環境ではログイン画面が返ってきて絵が壊れるため，ファイルから読む．
 * ファイルは next.config.ts の outputFileTracingIncludes で，サーバーの関数に含めている．
 * 一度読んだものは覚えておく（絵はデプロイし直すまで変わらない）．
 */
const spriteCache = new Map<string, string>();

async function loadSprite(imagePath: string) {
  const cached = spriteCache.get(imagePath);

  if (cached !== undefined) {
    return cached;
  }

  if (!SPRITE_PATH.test(imagePath)) {
    return "";
  }

  try {
    const file = await readFile(
      path.join(process.cwd(), "public", imagePath),
      "utf8",
    );
    const body = isSafeSprite(file) ? extractSpriteBody(file) : "";

    if (body) {
      spriteCache.set(imagePath, body);
    }

    return body;
  } catch (error) {
    console.error("Failed to load character sprite for badge:", error);
    return "";
  }
}

type CharacterRow = {
  character_type: string;
  level: number;
};

async function toMember(row: CharacterRow): Promise<BadgeMember | null> {
  if (!isCharacterType(row.character_type)) {
    return null;
  }

  const evolution = getCharacterEvolution(row.character_type, row.level);

  return {
    level: row.level,
    evolutionName: evolution.name,
    sprite: await loadSprite(evolution.imagePath),
  };
}

/*
 * パーティーのカードに出すキャラクター（連携中のリポジトリのキャラクター全員）．
 * 文字列が見つからない（止めた・作り直した）時は null．
 */
export async function getPartyBadgeMembers(token: string) {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("user_profiles")
    .select("user_id")
    .eq("party_badge_token", token)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  const { data: characters, error: charactersError } = await admin
    .from("characters")
    .select("character_type, level, repositories!inner(user_id, is_active)")
    .eq("repositories.user_id", profile.user_id)
    .eq("repositories.is_active", true);

  if (charactersError) {
    console.error("Failed to load characters for badge:", charactersError);
    return null;
  }

  const members = await Promise.all(
    (characters ?? []).map((row) => toMember(row as CharacterRow)),
  );

  return members.filter((member): member is BadgeMember => member !== null);
}

// キャラクター1体のバッジに出すキャラクター．見つからない・連携を外した時は null
export async function getCharacterBadgeMember(token: string) {
  const { data, error } = await createAdminClient()
    .from("characters")
    .select("character_type, level, repositories!inner(is_active)")
    .eq("badge_token", token)
    .eq("repositories.is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toMember(data as CharacterRow);
}
