"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { getCharacters } from "@/data/characters";
import { getOwnedGear } from "@/data/gear";
import {
  getBossReward,
  isBossId,
  isBossStar,
  type BossId,
  type BossReward,
  type BossStar,
} from "@/lib/battle/bosses";
import { MAX_PARTY_SIZE, fillWithHelpers } from "@/lib/battle/party";
import { getEquippedGear } from "@/lib/battle/owned-gear";
import { simulateBattle, type BattleResult } from "@/lib/battle/simulate";
import { getWeekStart } from "@/lib/quests/weekly";
import { recordUsage } from "@/lib/analytics/record";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type BattleActionResult =
  | { ok: false; message: string }
  | {
      ok: true;
      bossId: BossId;
      star: BossStar;
      result: BattleResult;
      // 勝って報酬を受け取った時だけ入る
      reward: BossReward | null;
    };

/*
 * ボスに挑む．
 *
 * 戦いはサーバーで計算する（ブラウザから結果を送れないようにするため）．
 * パーティーは自分のキャラクターだけで，★1〜★3 では空いた枠に助っ人が入る．
 * 今週すでに勝った★には挑めない．負けても記録しないので，何度でも挑み直せる．
 *
 * 画面が戦いの様子を再生し終えてから表示を更新するので，ここでは refresh() を呼ばない．
 */
export async function challengeBossAction(
  bossId: string,
  star: number,
  characterIds: string[],
): Promise<BattleActionResult> {
  if (!isBossId(bossId) || !isBossStar(star)) {
    return { ok: false, message: "ボスが見つかりません" };
  }

  if (
    !Array.isArray(characterIds) ||
    characterIds.length === 0 ||
    characterIds.length > MAX_PARTY_SIZE ||
    new Set(characterIds).size !== characterIds.length
  ) {
    return {
      ok: false,
      message: `キャラクターを1〜${MAX_PARTY_SIZE}体選んでください`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "ログインが必要です" };
  }

  // 自分の（連携中のリポジトリの）キャラクターだけを使える
  const characters = await getCharacters();
  const party = characterIds.map((id) =>
    characters.find((character) => character.id === id),
  );

  if (party.some((character) => !character)) {
    return { ok: false, message: "キャラクターが見つかりません" };
  }

  const weekStart = getWeekStart(new Date());
  const { data: existing, error: winError } = await supabase
    .from("boss_wins")
    .select("id")
    .eq("week_start", weekStart)
    .eq("star", star)
    .maybeSingle();

  if (winError) {
    console.error("Failed to fetch boss wins:", winError);
    return {
      ok: false,
      message: "挑めませんでした．時間をおいて試してください",
    };
  }

  if (existing) {
    return {
      ok: false,
      message: `今週の★${star}はもう勝っています．来週の月曜日にまた挑めます`,
    };
  }

  // 付けている武器・防具も，DB から読む（ブラウザから受け取らない）
  const ownedGear = await getOwnedGear(
    characters.map((character) => character.id),
  );

  const members = fillWithHelpers(
    party.map((character) => ({
      id: character!.id,
      name: character!.name,
      characterType: character!.characterType,
      level: character!.level,
      gear: getEquippedGear(ownedGear, character!.id),
    })),
    star,
  );

  const result = simulateBattle({
    bossId,
    star,
    members,
    seed: crypto.getRandomValues(new Uint32Array(1))[0],
  });

  // アプリの改善のための記録（挑んだ回数）
  after(() => recordUsage(user.id, "battle_challenge"));

  if (!result.isWin) {
    return { ok: true, bossId, star, result, reward: null };
  }

  const reward = getBossReward(bossId, star);
  const { data: granted, error: grantError } = await createAdminClient().rpc(
    "grant_boss_rewards",
    {
      p_user_id: user.id,
      p_week_start: weekStart,
      p_star: star,
      p_boss_id: bossId,
      p_gold: reward.gold,
      p_materials: reward.materials,
    },
  );

  if (grantError || granted !== "ok") {
    // 同時に挑んで，先に別の戦いで勝っていた時など
    console.error("Failed to grant boss rewards:", grantError ?? granted);
    return { ok: true, bossId, star, result, reward: null };
  }

  revalidatePath("/");
  revalidatePath("/battle");

  return { ok: true, bossId, star, result, reward };
}
