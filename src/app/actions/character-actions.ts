"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { ensureCommitBaselines } from "@/lib/analytics/record";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  CHARACTER_CATALOG,
  isCharacterType,
} from "@/lib/characters/catalog";
import { normalizeCharacterName } from "@/lib/characters/name";
import { isCharacterPersonality } from "@/lib/characters/personality";
import { grantTitles } from "@/lib/titles/grant-titles";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createCharacterAction(
  formData: FormData,
): Promise<void> {
  const repositoryId =
    formData.get("repositoryId");

  const characterType =
    formData.get("characterType");

  // 作成後に戻るページ．決まったページだけを許す
  const returnToValue = formData.get("returnTo");
  const returnTo =
    returnToValue === "/" || returnToValue === "/characters"
      ? returnToValue
      : "/characters/setup";

  if (
    typeof repositoryId !== "string" ||
    !UUID_PATTERN.test(repositoryId)
  ) {
    throw new Error(
      "リポジトリIDが不正です",
    );
  }

  if (!isCharacterType(characterType)) {
    throw new Error(
      "キャラクターの種類が不正です",
    );
  }

  const name = normalizeCharacterName(
    formData.get("name"),
  );

  if (!name) {
    throw new Error(
      "キャラクターの名前が不正です",
    );
  }

  const personality =
    formData.get("personality");

  if (!isCharacterPersonality(personality)) {
    throw new Error(
      "キャラクターの性格が不正です",
    );
  }

  const authClient =
    await createClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error(
      "ログインが必要です",
    );
  }

  const adminClient =
    createAdminClient();

  const {
    data: repository,
    error: ownershipError,
  } = await adminClient
    .from("repositories")
    .select(`
      id,
      characters (
        id
      )
    `)
    .eq("id", repositoryId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (ownershipError) {
    throw new Error(
      `リポジトリの確認に失敗しました: ${ownershipError.message}`,
    );
  }

  if (!repository) {
    throw new Error(
      "このリポジトリにキャラクターを作成する権限がありません",
    );
  }

  const existingCharacters =
    Array.isArray(repository.characters)
      ? repository.characters
      : repository.characters
        ? [repository.characters]
        : [];

  if (existingCharacters.length > 0) {
    throw new Error(
      "このリポジトリのキャラクターは既に設定されています",
    );
  }

  const definition =
    CHARACTER_CATALOG[characterType];

  const {
    data: character,
    error: insertError,
  } = await adminClient
    .from("characters")
    .insert({
      repository_id: repositoryId,
      name,
      character_type: characterType,
      personality,
      level: 1,
      current_xp: 0,
      required_xp: 100,
      image_path:
        definition.evolutions[0].imagePath,
      latest_activity:
        `${definition.name}を選びました`,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(
      `キャラクターの作成に失敗しました: ${insertError.message}`,
    );
  }

  const { error: eventError } =
    await adminClient
      .from("growth_events")
      .insert({
        character_id: character.id,
        event_type: "birth",
        xp: 0,
        description: "キャラクターが誕生しました",
      });

  if (eventError) {
    throw new Error(
      `成長履歴の作成に失敗しました: ${eventError.message}`,
    );
  }

  // キャラクターの数の称号を渡す．失敗しても，キャラクターはそのまま
  try {
    await grantTitles(adminClient, user.id);
  } catch (titleError) {
    console.error("Failed to grant titles:", titleError);
  }

  // アプリの改善のための記録：使い始める前のコミットの姿（比べる元）を，返事の後に計算する
  const userId = user.id;
  after(() => ensureCommitBaselines(userId));

  revalidatePath("/");
  revalidatePath("/characters");
  revalidatePath("/characters/setup");
  redirect(returnTo);
}
