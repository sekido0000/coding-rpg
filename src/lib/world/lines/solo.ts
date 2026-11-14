import type { CharacterPersonality } from "../../characters/personality";
import { bossyLines } from "./solo-bossy";
import { calmLines } from "./solo-calm";
import { cheerfulLines } from "./solo-cheerful";
import { coolLines } from "./solo-cool";
import { jesterLines } from "./solo-jester";
import { seriousLines } from "./solo-serious";
import { timidLines } from "./solo-timid";
import { tsundereLines } from "./solo-tsundere";
import type { SoloLines } from "./types";

// 性格ごとの独り言
export const SOLO_LINES: Record<
  CharacterPersonality,
  SoloLines
> = {
  cheerful: cheerfulLines,
  calm: calmLines,
  serious: seriousLines,
  tsundere: tsundereLines,
  timid: timidLines,
  bossy: bossyLines,
  jester: jesterLines,
  cool: coolLines,
};
