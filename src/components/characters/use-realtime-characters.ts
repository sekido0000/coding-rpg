"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { toItemId } from "@/lib/items/catalog";
import { createClient } from "@/lib/supabase/client";
import type {
  Character,
  CharacterPersonality,
} from "@/types/character";

/*
 * push でキャラクターが更新されてから，画面のデータを読み直すまでの時間（ミリ秒）．
 * クエストの報酬は経験値のあとに書き込まれるので，少し待ってから読み直す．
 */
const REFRESH_DELAY = 3000;

type CharacterRealtimeRecord = {
  id: string;
  repository_id: string;
  name: string;
  personality: CharacterPersonality;
  character_type: Character["characterType"];
  level: number;
  current_xp: number;
  required_xp: number;
  latest_activity: string;
  companion_item: string | null;
  aura_item: string | null;
};

/*
 * キャラクターの一覧を，Realtime で最新に保つ．
 *
 * push で経験値が入ると，DB のキャラクターの行が更新され，その内容が届く．
 * 届いたらすぐ画面のキャラクターを書き換え，少し待ってから
 * ページのデータ（クエストやゴールドなど）も読み直す．
 */
export function useRealtimeCharacters(initialCharacters: Character[]) {
  const router = useRouter();
  const [characters, setCharacters] =
    useState<Character[]>(initialCharacters);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    // 準備の途中で画面を離れた時に，チャンネルを作らないようにする
    let isClosed = false;

    // 続けて更新が届いた時は，最後の更新から待って1回だけ読み直す
    let refreshTimer: number | undefined;

    async function setupRealtime() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isClosed) {
        return;
      }

      // 本人のキャラクターだけが届くよう，RLSにログイン情報を渡す
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel("character-updates")
        .on<CharacterRealtimeRecord>(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "characters",
          },
          (payload) => {
            const updated = payload.new;

            setCharacters((current) =>
              current.map((character) =>
                character.id === updated.id
                  ? {
                      ...character,
                      name: updated.name,
                      personality: updated.personality,
                      characterType: updated.character_type,
                      level: updated.level,
                      currentXp: updated.current_xp,
                      requiredXp: updated.required_xp,
                      latestActivity: updated.latest_activity,
                      companionItem: toItemId(
                        updated.companion_item,
                        "companion",
                      ),
                      auraItem: toItemId(updated.aura_item, "aura"),
                    }
                  : character,
              ),
            );

            // クエストの進み具合とゴールドを読み直す
            window.clearTimeout(refreshTimer);
            refreshTimer = window.setTimeout(
              () => router.refresh(),
              REFRESH_DELAY,
            );
          },
        )
        // subscribeを呼んで，はじめて変更が届くようになる
        .subscribe();
    }

    setupRealtime();

    return () => {
      isClosed = true;
      window.clearTimeout(refreshTimer);

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  return characters;
}
