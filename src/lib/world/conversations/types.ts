import type { CharacterPersonality } from "../../characters/personality";
import type { SpeakerContext } from "../situations";

/*
 * キャラクター同士の会話の台本．
 *
 * 会話は「話しかけ → 返事 → 締め」の3つで，話題ごとに台本を作る．
 * 言い回しを入れ替えるのは，同じ話題の同じ役割の中だけにする．
 * そのため，どの言い回しを組み合わせても，質問と答えがかみ合う．
 *
 * 返事は「はい」系（yes）と「いいえ」系（no）に分け，
 * 話しかけられた側の事実（実際にテストを書いたか など）で選ぶ．
 * 締めは，その返事に合うものを選ぶ．
 */

export type Answer = "yes" | "no";

// 性格ごとの言い回し
export type PersonalityLines = Record<
  CharacterPersonality,
  string[]
>;

export type ConversationTopic = {
  id: string;
  /*
   * 話しかけられた側の答え．
   * speaker は話しかけた側，listener は話しかけられた側．
   */
  answer: (
    speaker: SpeakerContext,
    listener: SpeakerContext,
    now: Date,
    random: () => number,
  ) => Answer;
  // 話しかけた側のセリフ．{partner} は話しかけられた側の名前
  opener: PersonalityLines;
  // 話しかけられた側のセリフ．{partner} は話しかけた側の名前
  reply: Record<Answer, PersonalityLines>;
  // 話しかけた側の締め．{partner} は話しかけられた側の名前
  closer: Record<Answer, PersonalityLines>;
  // 返事で使える，{partner} 以外の差し込み（{level} など）
  replySlots?: readonly string[];
};
