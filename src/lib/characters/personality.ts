/*
 * キャラクターの性格．
 * キャラクターを選ぶ時に1つ選び，あとから変えることはできない．
 * リポジトリワールドでのセリフの口調が性格で変わる．
 *
 * DB の characters_personality_check 制約と同じ値にそろえる．
 */

export const CHARACTER_PERSONALITIES = [
  "cheerful",
  "calm",
  "serious",
  "tsundere",
  "timid",
  "bossy",
  "jester",
  "cool",
] as const;

export type CharacterPersonality =
  (typeof CHARACTER_PERSONALITIES)[number];

type PersonalityInfo = {
  label: string;
  description: string;
  // 選ぶ画面に出す，口調が分かるひと言
  sample: string;
};

export const PERSONALITY_INFO: Record<
  CharacterPersonality,
  PersonalityInfo
> = {
  cheerful: {
    label: "熱血",
    description: "とにかく暑苦しい，全力のがんばり屋",
    sample: "うおおお！今日もコミットだぜ！！",
  },
  calm: {
    label: "のんびり",
    description: "マイペースで，ゆるい",
    sample: "ゆっくりいこうねぇ〜．ふぁ〜あ",
  },
  serious: {
    label: "まじめ",
    description: "堅くて丁寧な，委員長タイプ",
    sample: "本日の作業内容を確認しました．",
  },
  tsundere: {
    label: "ツンデレ",
    description: "素直になれない",
    sample: "べ，別に応援してるわけじゃないんだから！",
  },
  timid: {
    label: "こわがり",
    description: "臆病で心配性",
    sample: "バ，バグ出てないよね…？ね…？",
  },
  bossy: {
    label: "えらそう",
    description: "王様気取りで，上から目線",
    sample: "ふむ，今日も余のために励むがよい．",
  },
  jester: {
    label: "お調子者",
    description: "ノリが軽く，すぐ調子に乗る",
    sample: "オレたち，もしかして天才じゃね？",
  },
  cool: {
    label: "クール",
    description: "無口でそっけない",
    sample: "…悪くない．",
  },
};

export function isCharacterPersonality(
  value: unknown,
): value is CharacterPersonality {
  return (
    typeof value === "string" &&
    (CHARACTER_PERSONALITIES as readonly string[]).includes(
      value,
    )
  );
}
