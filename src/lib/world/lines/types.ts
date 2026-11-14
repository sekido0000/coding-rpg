import type { SituationId } from "../situations";

/*
 * 1つの性格の独り言．場面ごとにセリフを並べる．
 * {name}（自分の名前）・{repo}（リポジトリ名）・{level} はどの場面でも使え，
 * 場面によっては {count}・{days}・{next} も使える（situations.ts の SITUATION_SLOTS）．
 */
export type SoloLines = Record<SituationId, string[]>;
