/*
 * ログインしていない人に見せる，見本のワールドの中身．
 * 実在の利用者のデータは使わず，ここで決めた見本のキャラクターと建物だけを使う．
 */

import type { Placement } from "@/lib/buildings/catalog";
import type { ActivitySummary } from "@/lib/world/activity";
import type { Character } from "@/types/character";

type DemoCharacterRow = Pick<
  Character,
  | "name"
  | "personality"
  | "characterType"
  | "level"
  | "currentXp"
  | "requiredXp"
  | "companionItem"
  | "auraItem"
> & {
  repositoryName: string;
  // 直近7日のコミット数（会話の話題に使う）
  weeklyCommits: number;
};

const DEMO_ROWS: DemoCharacterRow[] = [
  { name: "ブレイブ", personality: "cheerful", characterType: "hero", level: 5, currentXp: 220, requiredXp: 500, companionItem: "chick", auraItem: "sparkle", repositoryName: "portfolio", weeklyCommits: 12 },
  { name: "ルーン", personality: "calm", characterType: "mage", level: 4, currentXp: 130, requiredXp: 400, companionItem: "cat", auraItem: null, repositoryName: "todo-app", weeklyCommits: 6 },
  { name: "ぷるる", personality: "jester", characterType: "slime", level: 2, currentXp: 60, requiredXp: 200, companionItem: null, auraItem: "grass_ring", repositoryName: "dotfiles", weeklyCommits: 3 },
  { name: "ガード", personality: "serious", characterType: "knight", level: 3, currentXp: 90, requiredXp: 300, companionItem: "rubber_duck", auraItem: null, repositoryName: "api-server", weeklyCommits: 8 },
  { name: "メブキ", personality: "timid", characterType: "sprout", level: 1, currentXp: 40, requiredXp: 100, companionItem: null, auraItem: null, repositoryName: "first-repo", weeklyCommits: 1 },
  { name: "シャドウ", personality: "cool", characterType: "thief", level: 3, currentXp: 210, requiredXp: 300, companionItem: "coffee", auraItem: "terminal_glow", repositoryName: "game-jam", weeklyCommits: 5 },
];

// 見本の建物（建てた建物の場所）
export const DEMO_PLACEMENTS: Placement[] = [
  { key: "cafe", row: 1, offset: 1 },
  { key: "ramen_stall", row: 1, offset: -2 },
  { key: "library", row: -1, offset: 0 },
  { key: "fountain", row: 2, offset: 1 },
];

// 見本のキャラクターの ID（ワールドの中で区別するためだけに使う）
const demoId = (index: number) =>
  `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;

export function getDemoCharacters(): Character[] {
  return DEMO_ROWS.map((row, index) => ({
    id: demoId(index),
    repositoryId: demoId(index),
    name: row.name,
    repositoryOwner: "demo",
    repositoryName: row.repositoryName,
    repositoryUrl: "",
    defaultBranch: "main",
    personality: row.personality,
    characterType: row.characterType,
    level: row.level,
    currentXp: row.currentXp,
    requiredXp: row.requiredXp,
    latestActivity: "",
    githubInstallationId: 0,
    companionItem: row.companionItem,
    auraItem: row.auraItem,
  }));
}

// 会話の話題に使う，見本の最近の様子（日時は今から数える）
export function getDemoActivity(now = new Date()): Record<string, ActivitySummary> {
  const hoursAgo = (hours: number) =>
    new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  return Object.fromEntries(
    DEMO_ROWS.map((row, index) => [
      demoId(index),
      {
        weeklyCommits: row.weeklyCommits,
        weeklyCategories: { feat: Math.ceil(row.weeklyCommits / 2), fix: Math.floor(row.weeklyCommits / 3) },
        latestCategoryAt: { feat: hoursAgo(3 + index * 5) },
        lastCommitAt: hoursAgo(1 + index * 4),
        lastLevelUpAt: index === 0 ? hoursAgo(20) : null,
        activeDaysInLast4: Math.min(4, Math.ceil(row.weeklyCommits / 3)),
      },
    ]),
  );
}
