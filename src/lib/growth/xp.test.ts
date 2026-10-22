import { describe, expect, it } from "vitest";

import {
  calculateCommitXp,
  getCommitCategoryFromEventType,
  toCommitEventType,
  type ChangedFile,
} from "./xp";

// 差分付きの変更ファイルを作る
function file(
  filename: string,
  patchLines: string[],
  status = "modified",
): ChangedFile {
  const added = patchLines.filter((line) =>
    line.startsWith("+"),
  ).length;

  return {
    filename,
    status,
    additions: added,
    deletions: patchLines.length - added,
    patch: patchLines.join("\n"),
  };
}

// 中身の異なる追加行をn行作る
function addedLines(n: number) {
  return Array.from(
    { length: n },
    (_, index) => `+const value${index} = ${index};`,
  );
}

describe("calculateCommitXp", () => {
  it("Conventional Commitsの種類と変更量から経験値を計算する", () => {
    const result = calculateCommitXp({
      message: "feat: ログイン機能を追加",
      files: [
        file("src/login.ts", addedLines(10), "added"),
      ],
    });

    expect(result).toMatchObject({
      category: "feat",
      categoryXp: 20,
      sizeXp: 2,
      bodyXp: 0,
      xp: 22,
      changedLines: 10,
      isVague: false,
    });
  });

  it("形式のない日本語のメッセージからも種類を判定する", () => {
    const result = calculateCommitXp({
      message: "ログイン画面のバグを修正",
      files: [
        file("src/login.ts", [
          "-return token;",
          "+return refresh(token);",
        ]),
      ],
    });

    expect(result.category).toBe("fix");
    expect(result.xp).toBe(12 + 2);
  });

  it("変更の理由を本文に書くとボーナスが付く", () => {
    const result = calculateCommitXp({
      message:
        "fix: ログイン時のエラーを直す\n\nトークンの期限切れを考慮していなかったため．",
      files: [
        file("src/login.ts", [
          "-return token;",
          "+return refresh(token);",
        ]),
      ],
    });

    expect(result.bodyXp).toBe(5);
    expect(result.xp).toBe(12 + 2 + 5);
  });

  it("Co-Authored-Byだけの本文にはボーナスを付けない", () => {
    const result = calculateCommitXp({
      message:
        "feat: 新しい画面\n\nCo-Authored-By: someone <someone@example.com>",
      files: [
        file("src/page.ts", addedLines(1), "added"),
      ],
    });

    expect(result.bodyXp).toBe(0);
  });

  it("変更がドキュメントだけの時はドキュメントとして扱う", () => {
    const result = calculateCommitXp({
      message: "Add README",
      files: [
        file("README.md", ["+# App", "+概要", "+使い方"], "added"),
      ],
    });

    expect(result.category).toBe("docs");
    expect(result.xp).toBe(8 + 2);
  });

  it("何をしたか分からないメッセージは種類の経験値が半分になり，ボーナスも付かない", () => {
    const result = calculateCommitXp({
      message: "update",
      files: [file("src/app.ts", addedLines(60))],
    });

    expect(result).toMatchObject({
      category: "other",
      isVague: true,
      categoryXp: 2,
      sizeXp: 0,
      xp: 2,
    });
  });

  it("マージコミットには経験値を付けない", () => {
    const result = calculateCommitXp({
      message: "Merge pull request #1 from user/feature",
      files: [file("src/app.ts", addedLines(10))],
    });

    expect(result.isMerge).toBe(true);
    expect(result.xp).toBe(0);
  });

  it("インデントだけの変更には経験値を付けない", () => {
    const result = calculateCommitXp({
      message: "style: インデントを整える",
      files: [
        file("src/app.ts", [
          "-  const a = 1;",
          "+    const a = 1;",
        ]),
      ],
    });

    expect(result.changedLines).toBe(0);
    expect(result.xp).toBe(0);
  });

  it("自動生成ファイルだけの変更には経験値を付けない", () => {
    const result = calculateCommitXp({
      message: "chore: 依存関係を更新",
      files: [
        file("package-lock.json", addedLines(500)),
      ],
    });

    expect(result.xp).toBe(0);
  });

  it("変更行数が取得できない時は変更量ボーナスなしで計算する", () => {
    const result = calculateCommitXp({
      message: "feat: 新しい画面",
      files: [
        {
          filename: "src/page.ts",
          status: "modified",
          additions: null,
          deletions: null,
        },
      ],
    });

    expect(result.changedLines).toBeNull();
    expect(result.sizeXp).toBe(0);
    expect(result.xp).toBe(20);
  });
});

describe("event_type との変換", () => {
  it("コミットの種類と相互に変換できる", () => {
    expect(toCommitEventType("feat")).toBe("commit_feat");
    expect(
      getCommitCategoryFromEventType("commit_feat"),
    ).toBe("feat");
  });

  it("コミット以外や不明な種類はnullになる", () => {
    expect(
      getCommitCategoryFromEventType("level_up"),
    ).toBeNull();
    expect(
      getCommitCategoryFromEventType("commit_unknown"),
    ).toBeNull();
  });
});
