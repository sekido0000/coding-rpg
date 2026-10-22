/*
 * コミット1件ごとの経験値計算．
 *
 * 経験値 = 種類の経験値 + 変更量ボーナス + 本文ボーナス
 *
 * 種類の経験値は，その種類の作業の大変さを考えて決める．
 * 変更のないコミットや，空白・インデントだけの変更には経験値を付けない．
 *
 * 書き方（feat: などの形式や日本語の文章）は人やチームで異なるため，
 * どの書き方でも種類を判定し，書き方による点差は付けない．
 */

export type CommitCategory =
  | "feat"
  | "fix"
  | "docs"
  | "test"
  | "refactor"
  | "perf"
  | "style"
  | "build"
  | "chore"
  | "revert"
  | "other";

type CategoryInfo = {
  label: string;
  icon: string;
  /*
   * その種類のコミットで入る経験値．
   * 新しく作る・原因を探すといった，手間のかかる種類ほど大きくする．
   */
  xp: number;
};

export const COMMIT_CATEGORIES: Record<
  CommitCategory,
  CategoryInfo
> = {
  feat: { label: "新機能", icon: "⚡", xp: 20 },
  perf: { label: "性能改善", icon: "🚀", xp: 15 },
  fix: { label: "修正", icon: "🔧", xp: 12 },
  refactor: { label: "リファクタリング", icon: "♻️", xp: 10 },
  test: { label: "テスト", icon: "✅", xp: 10 },
  docs: { label: "ドキュメント", icon: "📘", xp: 8 },
  build: { label: "ビルド・設定", icon: "🛠️", xp: 5 },
  style: { label: "書式", icon: "🎨", xp: 3 },
  chore: { label: "雑務", icon: "🧹", xp: 3 },
  revert: { label: "取り消し", icon: "⏪", xp: 3 },
  other: { label: "その他", icon: "🌱", xp: 3 },
};

/*
 * 変更行数に応じたボーナス．
 * こまめなコミットを促したいので，大きな変更でも上限を設ける．
 */
export const SIZE_BONUSES = [
  { minLines: 200, xp: 8 },
  { minLines: 50, xp: 5 },
  { minLines: 1, xp: 2 },
] as const;

export const BODY_BONUS_XP = 5;
export const VAGUE_MESSAGE_RATE = 0.5;

export type ChangedFile = {
  filename: string;
  status: string;
  /*
   * GitHub APIから取得できなかった時はnull．
   */
  additions: number | null;
  deletions: number | null;
  /*
   * 変更内容（差分）．大きすぎるファイルなどでは取得できない．
   */
  patch?: string | null;
};

export type CommitXpInput = {
  message: string;
  files: ChangedFile[];
};

export type CommitXpResult = {
  category: CommitCategory;
  subject: string;
  xp: number;
  categoryXp: number;
  sizeXp: number;
  bodyXp: number;
  /*
   * 空白だけの変更や自動生成ファイルを除いた行数．
   * 行数が取れなかった時はnull．
   */
  changedLines: number | null;
  isVague: boolean;
  isMerge: boolean;
};

/* ---------- メッセージの判定 ---------- */

const CONVENTIONAL_TYPES: Record<string, CommitCategory> = {
  feat: "feat",
  feature: "feat",
  fix: "fix",
  bugfix: "fix",
  hotfix: "fix",
  docs: "docs",
  doc: "docs",
  test: "test",
  tests: "test",
  refactor: "refactor",
  perf: "perf",
  style: "style",
  build: "build",
  ci: "build",
  chore: "chore",
  revert: "revert",
};

// 例：feat: ... / fix(login): ... / feat!: ...
const CONVENTIONAL_PATTERN =
  /^([a-z]+)(?:\([^)]*\))?!?:\s*(.*)$/;

// 例：[Fix] ... / 【修正】...
const BRACKET_PATTERN =
  /^(?:\[([^\]]+)\]|【([^】]+)】)\s*(.*)$/;

const GITMOJI: [string, CommitCategory][] = [
  ["✨", "feat"],
  [":sparkles:", "feat"],
  ["🎉", "feat"],
  [":tada:", "feat"],
  ["🐛", "fix"],
  [":bug:", "fix"],
  ["🚑", "fix"],
  [":ambulance:", "fix"],
  ["📝", "docs"],
  [":memo:", "docs"],
  ["✅", "test"],
  [":white_check_mark:", "test"],
  ["♻", "refactor"],
  [":recycle:", "refactor"],
  ["⚡", "perf"],
  [":zap:", "perf"],
  ["🎨", "style"],
  [":art:", "style"],
  ["🔧", "build"],
  [":wrench:", "build"],
  ["⏪", "revert"],
  [":rewind:", "revert"],
  ["🔥", "chore"],
  [":fire:", "chore"],
];

type KeywordRule = {
  category: CommitCategory;
  // 英語は単語単位で比較する
  en: string[];
  // 日本語は部分一致で比較する
  ja: string[];
};

const KEYWORD_RULES: KeywordRule[] = [
  {
    category: "feat",
    en: ["add", "adds", "added", "adding", "implement", "implements", "implemented", "create", "creates", "created", "introduce", "introduced", "support", "supports", "new"],
    ja: ["追加", "実装", "新規", "作成", "新機能"],
  },
  {
    category: "fix",
    en: ["fix", "fixes", "fixed", "fixing", "bug", "bugs", "resolve", "resolves", "resolved", "correct", "corrected", "repair", "patch"],
    ja: ["修正", "バグ", "不具合", "直す", "直した", "解消", "エラー"],
  },
  {
    category: "docs",
    en: ["readme", "doc", "docs", "document", "documentation", "comment", "comments"],
    ja: ["ドキュメント", "説明", "コメント", "資料"],
  },
  {
    category: "test",
    en: ["test", "tests", "testing", "spec", "specs"],
    ja: ["テスト"],
  },
  {
    category: "refactor",
    en: ["refactor", "refactored", "refactoring", "cleanup", "clean", "rename", "renamed", "restructure", "simplify"],
    ja: ["リファクタ", "整理", "共通化", "名前変更", "分割"],
  },
  {
    category: "perf",
    en: ["perf", "performance", "optimize", "optimized", "speed"],
    ja: ["高速化", "最適化", "性能"],
  },
  {
    category: "chore",
    en: ["remove", "removed", "delete", "deleted", "bump", "upgrade"],
    ja: ["削除"],
  },
];

/*
 * 同点の時に優先する順番．
 */
const CATEGORY_PRIORITY: CommitCategory[] = [
  "feat",
  "fix",
  "perf",
  "refactor",
  "chore",
];

/*
 * これだけでは何をしたのか分からない言葉．
 */
const VAGUE_EN_WORDS = new Set([
  "update", "updates", "updated",
  "fix", "fixes", "fixed",
  "change", "changes", "changed",
  "add", "added", "edit", "modify", "modified",
  "wip", "tmp", "temp", "misc", "minor", "small",
  "code", "codes", "file", "files", "stuff", "some", "various",
  "commit", "test", "and", "the", "a",
]);

const VAGUE_JA_WORDS = [
  "しました", "します", "した", "する",
  "微修正", "修正", "更新", "変更", "追加", "作業", "対応",
  "とりあえず", "いろいろ", "色々", "途中", "コミット",
];

function normalize(text: string) {
  return text.normalize("NFKC").toLowerCase().trim();
}

function getSubject(message: string) {
  return (
    message
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? ""
  );
}

/*
 * 2行目以降に，変更の理由などの本文が書かれているか．
 * Co-Authored-Byなどの定型行は数えない．
 */
function hasBody(message: string) {
  const [, ...rest] = message.split("\n");

  const body = rest
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !/^(co-authored-by|signed-off-by):/i.test(line),
    )
    .join("");

  return body.length >= 10;
}

function classifyByKeywords(
  text: string,
): CommitCategory | null {
  const scores = new Map<CommitCategory, number>();

  const addScore = (
    category: CommitCategory,
    score: number,
  ) => {
    scores.set(
      category,
      (scores.get(category) ?? 0) + score,
    );
  };

  // 英語は先頭の動詞が主な動作なので重くする
  const words = text
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);

  words.forEach((word, index) => {
    for (const rule of KEYWORD_RULES) {
      if (rule.en.includes(word)) {
        addScore(rule.category, index === 0 ? 3 : 1);
      }
    }
  });

  // 日本語は末尾の動詞が主な動作なので，最後に出てくる語を重くする
  let lastCategory: CommitCategory | null = null;
  let lastEnd = -1;

  for (const rule of KEYWORD_RULES) {
    for (const keyword of rule.ja) {
      const position = text.lastIndexOf(keyword);

      if (position === -1) {
        continue;
      }

      addScore(rule.category, 1);

      const end = position + keyword.length;

      if (end > lastEnd) {
        lastCategory = rule.category;
        lastEnd = end;
      }
    }
  }

  if (lastCategory) {
    addScore(lastCategory, 2);
  }

  if (scores.size === 0) {
    return null;
  }

  /*
   * 「テストを追加」「Add README」のように，
   * 対象がテストやドキュメントの時はそちらを優先する．
   */
  const docsScore = scores.get("docs") ?? 0;
  const testScore = scores.get("test") ?? 0;

  if (docsScore > 0 || testScore > 0) {
    return testScore >= docsScore ? "test" : "docs";
  }

  let best: CommitCategory | null = null;
  let bestScore = 0;

  for (const category of CATEGORY_PRIORITY) {
    const score = scores.get(category) ?? 0;

    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }

  return best;
}

type MessageAnalysis = {
  category: CommitCategory | null;
  description: string;
};

function analyzeSubject(subject: string): MessageAnalysis {
  const text = normalize(subject);

  // 1. Conventional Commits
  const conventional = text.match(CONVENTIONAL_PATTERN);

  if (conventional && CONVENTIONAL_TYPES[conventional[1]]) {
    return {
      category: CONVENTIONAL_TYPES[conventional[1]],
      description: conventional[2],
    };
  }

  // 2. [Fix] や【修正】のような見出し
  const bracket = text.match(BRACKET_PATTERN);

  if (bracket) {
    const label = bracket[1] ?? bracket[2] ?? "";

    return {
      category:
        CONVENTIONAL_TYPES[label] ??
        classifyByKeywords(label),
      description: bracket[3],
    };
  }

  // 3. 絵文字（gitmoji）
  const gitmoji = GITMOJI.find(([prefix]) =>
    text.startsWith(prefix),
  );

  if (gitmoji) {
    return {
      category: gitmoji[1],
      description: text.slice(gitmoji[0].length).trim(),
    };
  }

  // 4. 形式がない時は単語から推測する
  return {
    category: classifyByKeywords(text),
    description: text,
  };
}

/*
 * 「add codes」「修正」「wip」のように，
 * 何のための変更か分からないメッセージか．
 */
function isVagueDescription(description: string) {
  let text = description;

  for (const word of VAGUE_JA_WORDS) {
    text = text.split(word).join(" ");
  }

  // 英数字・ひらがな・カタカナ・漢字以外で区切る
  const meaningful = text
    .split(/[^a-z0-9぀-ヿ㐀-鿿]+/)
    .filter(
      (word) =>
        word.length > 0 && !VAGUE_EN_WORDS.has(word),
    )
    .join("");

  return meaningful.length < 3;
}

/* ---------- 変更ファイルの判定 ---------- */

type FileKind =
  | "docs"
  | "test"
  | "generated"
  | "config"
  | "asset"
  | "code";

function getFileKind(filename: string): FileKind {
  const path = filename.toLowerCase();

  if (
    /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|cargo\.lock|composer\.lock|gemfile\.lock)$/.test(path) ||
    /(^|\/)(node_modules|dist|build|out|\.next|__pycache__)\//.test(path) ||
    /\.min\.(js|css)$/.test(path)
  ) {
    return "generated";
  }

  if (
    /(^|\/)(__tests__|tests?|spec)\//.test(path) ||
    /\.(test|spec)\.[a-z0-9]+$/.test(path) ||
    /(^|\/)test_[^/]+\.py$/.test(path) ||
    /_test\.(py|go)$/.test(path)
  ) {
    return "test";
  }

  if (
    /\.(md|mdx|rst|txt|adoc)$/.test(path) ||
    /(^|\/)docs?\//.test(path)
  ) {
    return "docs";
  }

  if (/\.(png|jpe?g|gif|svg|webp|ico|mp3|wav|mp4|woff2?|ttf)$/.test(path)) {
    return "asset";
  }

  if (
    /\.(json|ya?ml|toml|ini|cfg|lock)$/.test(path) ||
    /(^|\/)(dockerfile|makefile|\.gitignore|\.env\.example)$/.test(path) ||
    path.startsWith(".github/")
  ) {
    return "config";
  }

  return "code";
}

/*
 * 変更されたファイルから，変更の種類を推測する．
 * 推測できない時はnull．
 */
function classifyByFiles(
  files: ChangedFile[],
): CommitCategory | null {
  if (files.length === 0) {
    return null;
  }

  const kinds = files.map((file) =>
    getFileKind(file.filename),
  );

  if (kinds.every((kind) => kind === "docs")) {
    return "docs";
  }

  if (kinds.every((kind) => kind === "test")) {
    return "test";
  }

  if (
    kinds.every(
      (kind) => kind === "generated" || kind === "config",
    )
  ) {
    return "build";
  }

  const addsCode = files.some(
    (file, index) =>
      file.status === "added" && kinds[index] === "code",
  );

  return addsCode ? "feat" : null;
}

/*
 * 差分から，中身のある変更行を取り出す．
 * 空行は除き，行内の空白はそろえておく．
 */
function getPatchLines(patch: string) {
  const added: string[] = [];
  const removed: string[] = [];

  for (const line of patch.split("\n")) {
    const mark = line[0];

    if (mark !== "+" && mark !== "-") {
      continue;
    }

    const content = line.slice(1).trim().replace(/\s+/g, " ");

    if (content.length === 0) {
      continue;
    }

    (mark === "+" ? added : removed).push(content);
  }

  return { added, removed };
}

/*
 * 自動生成ファイルを除いた，中身のある変更行数．
 *
 * 差分が取れる時は，消した行と同じ内容の行を足しただけの変更
 * （インデントの付け直し，行の移動など）を数えない．
 * 差分が取れない時はGitHubの行数をそのまま使う．
 * 行数が分からない時はnull．
 */
function countChangedLines(files: ChangedFile[]) {
  const targets = files.filter(
    (file) => getFileKind(file.filename) !== "generated",
  );

  // 消した行の内容ごとの数（同じ内容を足した行と打ち消し合う）
  const removedCounts = new Map<string, number>();
  const addedLines: string[] = [];
  let unpatchedLines = 0;
  let hasUnknown = false;

  for (const file of targets) {
    if (file.patch) {
      const { added, removed } = getPatchLines(file.patch);

      for (const line of removed) {
        removedCounts.set(
          line,
          (removedCounts.get(line) ?? 0) + 1,
        );
      }

      addedLines.push(...added);
    } else if (
      file.additions !== null &&
      file.deletions !== null
    ) {
      unpatchedLines += file.additions + file.deletions;
    } else {
      hasUnknown = true;
    }
  }

  let remainingAdded = 0;

  for (const line of addedLines) {
    const count = removedCounts.get(line) ?? 0;

    if (count > 0) {
      removedCounts.set(line, count - 1);
    } else {
      remainingAdded += 1;
    }
  }

  let remainingRemoved = 0;

  for (const count of removedCounts.values()) {
    remainingRemoved += count;
  }

  const total =
    remainingAdded + remainingRemoved + unpatchedLines;

  // 一部でも行数が分からず，数えられた行もない時は「不明」
  if (hasUnknown && total === 0) {
    return null;
  }

  return total;
}

/*
 * 経験値の対象になる変更があるか．
 * GitHub APIから行数を取れなかった時は，
 * 自動生成以外のファイルが変わっていれば変更ありとみなす．
 */
function hasChanges(
  changedLines: number | null,
  files: ChangedFile[],
) {
  if (changedLines === null) {
    return files.some(
      (file) => getFileKind(file.filename) !== "generated",
    );
  }

  return changedLines > 0;
}

function getSizeXp(changedLines: number | null) {
  if (changedLines === null) {
    return 0;
  }

  return (
    SIZE_BONUSES.find(
      (bonus) => changedLines >= bonus.minLines,
    )?.xp ?? 0
  );
}

/* ---------- 経験値の計算 ---------- */

export function calculateCommitXp({
  message,
  files,
}: CommitXpInput): CommitXpResult {
  const subject = getSubject(message);
  const analysis = analyzeSubject(subject);
  const fileCategory = classifyByFiles(files);

  /*
   * メッセージを優先する．
   * ただし，変更がドキュメントやテストだけの時はそちらに合わせる
   * （例：「Add README」はドキュメント）．
   */
  let category: CommitCategory =
    analysis.category ?? fileCategory ?? "other";

  if (
    (fileCategory === "docs" || fileCategory === "test") &&
    category !== fileCategory
  ) {
    category = fileCategory;
  }

  const isVague = isVagueDescription(
    analysis.description,
  );

  /*
   * マージコミットの変更は，取り込んだコミットですでに数えているので，
   * 経験値を付けない．
   */
  const isMerge =
    /^merge (pull request|branch|remote-tracking)/.test(
      normalize(subject),
    );

  if (isMerge) {
    category = "other";
  }

  const changedLines = countChangedLines(files);

  /*
   * マージコミットと，中身のある変更がないコミット
   * （空コミット，空白・インデントだけの変更など）には経験値を付けない．
   */
  if (isMerge || !hasChanges(changedLines, files)) {
    return {
      category,
      subject: subject.slice(0, 200),
      xp: 0,
      categoryXp: 0,
      sizeXp: 0,
      bodyXp: 0,
      changedLines,
      isVague,
      isMerge,
    };
  }

  let categoryXp = COMMIT_CATEGORIES[category].xp;
  let sizeXp = 0;
  let bodyXp = 0;

  if (isVague) {
    // 何をしたか分からないメッセージは種類の経験値を半分にし，ボーナスも付けない
    categoryXp = Math.ceil(categoryXp * VAGUE_MESSAGE_RATE);
  } else {
    sizeXp = getSizeXp(changedLines);

    if (hasBody(message)) {
      bodyXp = BODY_BONUS_XP;
    }
  }

  return {
    category,
    subject: subject.slice(0, 200),
    xp: categoryXp + sizeXp + bodyXp,
    categoryXp,
    sizeXp,
    bodyXp,
    changedLines,
    isVague,
    isMerge,
  };
}

/*
 * growth_events.event_type に保存する値．
 */
export function toCommitEventType(
  category: CommitCategory,
) {
  return `commit_${category}`;
}

export function getCommitCategoryFromEventType(
  eventType: string,
): CommitCategory | null {
  if (!eventType.startsWith("commit_")) {
    return null;
  }

  const category = eventType.slice("commit_".length);

  return category in COMMIT_CATEGORIES
    ? (category as CommitCategory)
    : null;
}
