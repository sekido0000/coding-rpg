import "server-only";

import { extractSpriteBody, type BadgeMember } from "@/lib/badges/render";
import {
  getCharacterEvolution,
  isCharacterType,
} from "@/lib/characters/catalog";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * キャラクターのドット絵を，配信している SVG から読む．
 * 一度読んだものは覚えておく（絵はデプロイし直すまで変わらない）．
 */
const spriteCache = new Map<string, string>();

async function loadSprite(origin: string, imagePath: string) {
  const cached = spriteCache.get(imagePath);

  if (cached !== undefined) {
    return cached;
  }

  try {
    const response = await fetch(new URL(imagePath, origin));
    const body = response.ok ? extractSpriteBody(await response.text()) : "";

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

async function toMember(
  origin: string,
  row: CharacterRow,
): Promise<BadgeMember | null> {
  if (!isCharacterType(row.character_type)) {
    return null;
  }

  const evolution = getCharacterEvolution(row.character_type, row.level);

  return {
    level: row.level,
    evolutionName: evolution.name,
    sprite: await loadSprite(origin, evolution.imagePath),
  };
}

/*
 * パーティーのカードに出すキャラクター（連携中のリポジトリのキャラクター全員）．
 * token が見つからない（止めた・作り直した）時は null．
 */
export async function getPartyBadgeMembers(origin: string, token: string) {
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
    (characters ?? []).map((row) => toMember(origin, row as CharacterRow)),
  );

  return members.filter((member): member is BadgeMember => member !== null);
}

// キャラクター1体のバッジに出すキャラクター．見つからない・連携を外した時は null
export async function getCharacterBadgeMember(origin: string, token: string) {
  const { data, error } = await createAdminClient()
    .from("characters")
    .select("character_type, level, repositories!inner(is_active)")
    .eq("badge_token", token)
    .eq("repositories.is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toMember(origin, data as CharacterRow);
}
