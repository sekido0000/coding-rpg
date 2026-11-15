import crypto from "crypto";
import type { NextRequest } from "next/server";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { ChangedFile } from "@/lib/growth/xp";
import {
  FakeSupabase,
  type Row,
} from "@/test/fake-supabase";

/*
 * Webhookを受けてから経験値が入るまでを，まとめて確かめる．
 * DBは偽物（FakeSupabase）に，GitHub APIは決まった差分を返す偽物に差し替える．
 */

const mocks = vi.hoisted(() => ({
  db: null as unknown,
  commitFiles: new Map<string, unknown>(),
  // GitHub APIに差分を取りに行ったコミット
  fetchedShas: [] as string[],
  // GitHubで今選ばれているリポジトリ
  installationRepositories: [] as unknown[],
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.db,
}));

vi.mock("@/lib/github/commits", () => ({
  getCommitFiles: async ({ shas }: { shas: string[] }) => {
    mocks.fetchedShas.push(...shas);
    return mocks.commitFiles;
  },
}));

vi.mock("@/lib/github/installation-repositories", () => ({
  listInstallationRepositories: async () =>
    mocks.installationRepositories,
}));

const { POST } = await import("./route");

const SECRET = "test-webhook-secret";

// 1件で feat 20 XP + 変更量ボーナス 2 XP = 22 XP になるコミット
const FEAT_COMMIT = {
  id: "sha-feat",
  message: "feat: ログイン画面を追加",
  timestamp: "2026-11-14T03:00:00Z",
  distinct: true,
};

const FEAT_FILES: ChangedFile[] = [
  {
    filename: "src/login.ts",
    status: "added",
    additions: 1,
    deletions: 0,
    patch: "+export const login = () => {};",
  },
];

const FEAT_XP = 22;

let db: FakeSupabase;

function seed(character: Partial<Row> = {}) {
  db = new FakeSupabase({
    github_installations: [
      {
        id: "installation-1",
        github_installation_id: 1,
        user_id: "user-1",
      },
    ],
    repositories: [
      {
        id: "repository-1",
        user_id: "user-1",
        github_installation_id: "installation-1",
        github_repository_id: 100,
        name: "demo",
        is_active: true,
      },
    ],
    characters: [
      {
        id: "character-1",
        repository_id: "repository-1",
        character_type: "sprout",
        level: 1,
        current_xp: 0,
        required_xp: 100,
        // FEAT_COMMIT より前に誕生している
        created_at: "2026-11-01T00:00:00Z",
        ...character,
      },
    ],
  });

  mocks.db = db;
}

function pushPayload(overrides: Row = {}) {
  return {
    repository: {
      id: 100,
      name: "demo",
      owner: { login: "octocat" },
    },
    installation: { id: 1 },
    forced: false,
    commits: [FEAT_COMMIT],
    ...overrides,
  };
}

function sign(body: string) {
  return (
    "sha256=" +
    crypto
      .createHmac("sha256", SECRET)
      .update(body)
      .digest("hex")
  );
}

function webhookRequest(
  payload: unknown,
  {
    event = "push",
    deliveryId = "delivery-1",
    signature,
  }: {
    event?: string;
    deliveryId?: string;
    signature?: string | null;
  } = {},
) {
  const body = JSON.stringify(payload);
  const headers = new Headers({
    "x-github-event": event,
    "x-github-delivery": deliveryId,
  });

  const value =
    signature === undefined ? sign(body) : signature;

  if (value !== null) {
    headers.set("x-hub-signature-256", value);
  }

  return new Request(
    "http://localhost/api/github/webhook",
    { method: "POST", headers, body },
  ) as unknown as NextRequest;
}

function character() {
  return db.rows("characters")[0];
}

beforeEach(() => {
  process.env.GITHUB_WEBHOOK_SECRET = SECRET;
  mocks.commitFiles = new Map([
    [FEAT_COMMIT.id, FEAT_FILES],
  ]);
  mocks.installationRepositories = [];
  mocks.fetchedShas = [];
  seed();

  // 処理中のログでテストの出力が埋まらないようにする
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("署名の検証", () => {
  it("署名がない通知は401で，何も処理しない", async () => {
    const response = await POST(
      webhookRequest(pushPayload(), { signature: null }),
    );

    expect(response.status).toBe(401);
    expect(character().current_xp).toBe(0);
    expect(db.rows("webhook_deliveries")).toHaveLength(0);
  });

  it("署名が違う通知は401で，何も処理しない", async () => {
    const response = await POST(
      webhookRequest(pushPayload(), {
        signature: sign("別の内容"),
      }),
    );

    expect(response.status).toBe(401);
    expect(character().current_xp).toBe(0);
  });

  it("長さの違う署名でも500にならず401を返す", async () => {
    const response = await POST(
      webhookRequest(pushPayload(), {
        signature: "sha256=short",
      }),
    );

    expect(response.status).toBe(401);
  });
});

describe("経験値の加算", () => {
  it("pushで経験値が入り，成長履歴と受信記録が残る", async () => {
    const response = await POST(
      webhookRequest(pushPayload()),
    );

    expect(response.status).toBe(200);
    expect(character().current_xp).toBe(FEAT_XP);

    expect(db.rows("growth_events")).toEqual([
      expect.objectContaining({
        character_id: "character-1",
        event_type: "commit_feat",
        xp: FEAT_XP,
        created_at: FEAT_COMMIT.timestamp,
        // 点数の内訳も残る（新機能 20 ＋ 1行の変更 2）
        category_xp: 20,
        size_xp: 2,
        body_xp: 0,
        changed_lines: 1,
        is_vague: false,
      }),
    ]);

    expect(db.rows("webhook_deliveries")).toEqual([
      expect.objectContaining({
        delivery_id: "delivery-1",
      }),
    ]);
  });

  it("同じ通知が再送されても，経験値は二重に入らない", async () => {
    await POST(webhookRequest(pushPayload()));
    const response = await POST(
      webhookRequest(pushPayload()),
    );

    expect(response.status).toBe(200);
    expect(character().current_xp).toBe(FEAT_XP);
    expect(db.rows("growth_events")).toHaveLength(1);
  });

  it("必要な経験値に届くとレベルが上がり，レベルアップの履歴も残る", async () => {
    seed({ current_xp: 90 });

    await POST(webhookRequest(pushPayload()));

    expect(character()).toMatchObject({
      level: 2,
      current_xp: 90 + FEAT_XP - 100,
      required_xp: 200,
    });

    expect(
      db
        .rows("growth_events")
        .map((event) => event.event_type),
    ).toEqual(["commit_feat", "level_up"]);
  });
});

describe("経験値を付けない通知", () => {
  it("force pushでは経験値が入らない", async () => {
    const response = await POST(
      webhookRequest(pushPayload({ forced: true })),
    );

    expect(response.status).toBe(200);
    expect(character().current_xp).toBe(0);
  });

  it("別のpushですでに届いたコミット（distinct: false）は数えない", async () => {
    await POST(
      webhookRequest(
        pushPayload({
          commits: [{ ...FEAT_COMMIT, distinct: false }],
        }),
      ),
    );

    expect(character().current_xp).toBe(0);
  });

  it("連携を解除したリポジトリには経験値が入らない", async () => {
    db.rows("repositories")[0].is_active = false;

    await POST(webhookRequest(pushPayload()));

    expect(character().current_xp).toBe(0);
  });
});

describe("同時に届いた通知との競合", () => {
  it("先に別の通知が更新していたら，読み直して正しい値で更新する", async () => {
    let isFirstUpdate = true;

    // 1回目の更新の直前に，別の通知が10 XP加えたことにする
    db.beforeUpdate = (table, rows) => {
      if (table === "characters" && isFirstUpdate) {
        isFirstUpdate = false;
        rows[0].current_xp = 10;
      }
    };

    const response = await POST(
      webhookRequest(pushPayload()),
    );

    expect(response.status).toBe(200);
    expect(character().current_xp).toBe(10 + FEAT_XP);
  });

  it("何度やり直しても競合する時は失敗にし，再送でやり直せるよう受信記録を消す", async () => {
    // 更新の直前に毎回，別の通知が1 XP加えたことにする
    db.beforeUpdate = (table, rows) => {
      if (table === "characters") {
        rows[0].current_xp =
          (rows[0].current_xp as number) + 1;
      }
    };

    await expect(
      POST(webhookRequest(pushPayload())),
    ).rejects.toThrow("conflicted too many times");

    expect(db.rows("webhook_deliveries")).toHaveLength(0);
    expect(db.rows("growth_events")).toHaveLength(0);
  });
});

describe("処理の途中での失敗", () => {
  it("書き込みに失敗したら，キャラクターも履歴も変わらず，再送でやり直せる", async () => {
    // DBの関数の中で失敗すると，キャラクターの更新と履歴の書き込みが両方取り消される
    db.failNext("apply_commit_growth", "rpc");

    await expect(
      POST(webhookRequest(pushPayload())),
    ).rejects.toThrow("Failed to apply character growth");

    expect(character().current_xp).toBe(0);
    expect(db.rows("growth_events")).toHaveLength(0);
    expect(db.rows("webhook_deliveries")).toHaveLength(0);

    // 再送されると，今度は経験値と履歴が1回だけ入る
    const response = await POST(
      webhookRequest(pushPayload()),
    );

    expect(response.status).toBe(200);
    expect(character().current_xp).toBe(FEAT_XP);
    expect(db.rows("growth_events")).toHaveLength(1);
  });

  it("連携情報の取得に失敗したら，受信記録を消す", async () => {
    db.failNext("github_installations", "select");

    await expect(
      POST(webhookRequest(pushPayload())),
    ).rejects.toThrow("Failed to fetch GitHub installation");

    expect(db.rows("webhook_deliveries")).toHaveLength(0);
  });
});

describe("GitHubの設定画面でのリポジトリの追加・削除", () => {
  // GitHubから返ってくるリポジトリの情報
  function githubRepository(id: number, name: string) {
    return {
      id,
      owner: "octocat",
      name,
      defaultBranch: "main",
      htmlUrl: `https://github.com/octocat/${name}`,
      isPrivate: false,
      visibility: "public",
    };
  }

  function repositoriesEvent(action: "added" | "removed") {
    return webhookRequest(
      { action, installation: { id: 1 } },
      { event: "installation_repositories" },
    );
  }

  function repository(githubRepositoryId: number) {
    return db
      .rows("repositories")
      .find(
        (row) =>
          row.github_repository_id === githubRepositoryId,
      );
  }

  it("追加されたリポジトリが，本人のリポジトリとして有効になる", async () => {
    mocks.installationRepositories = [
      githubRepository(100, "demo"),
      githubRepository(200, "new-repo"),
    ];

    const response = await POST(repositoriesEvent("added"));

    expect(response.status).toBe(200);
    expect(repository(200)).toMatchObject({
      user_id: "user-1",
      github_installation_id: "installation-1",
      name: "new-repo",
      is_active: true,
    });
    expect(repository(100)?.is_active).toBe(true);
  });

  it("選択を外されたリポジトリは無効になるが，キャラクターは残る", async () => {
    mocks.installationRepositories = [];

    await POST(repositoriesEvent("removed"));

    expect(repository(100)?.is_active).toBe(false);
    expect(db.rows("characters")).toHaveLength(1);
  });

  it("選び直すと，同じリポジトリがキャラクターごと戻ってくる", async () => {
    db.rows("repositories")[0].is_active = false;
    mocks.installationRepositories = [
      githubRepository(100, "demo"),
    ];

    await POST(repositoriesEvent("added"));

    expect(db.rows("repositories")).toHaveLength(1);
    expect(repository(100)?.is_active).toBe(true);
    expect(character().repository_id).toBe("repository-1");
  });

  it("アプリで連携の設定が終わっていないインストールは無視する", async () => {
    mocks.installationRepositories = [
      githubRepository(300, "other"),
    ];

    const response = await POST(
      webhookRequest(
        { action: "added", installation: { id: 999 } },
        { event: "installation_repositories" },
      ),
    );

    expect(response.status).toBe(200);
    expect(repository(300)).toBeUndefined();
  });
});

describe("古い受信記録の削除", () => {
  it("通知を記録する時に，7日より古い受信記録を消す", async () => {
    const daysAgo = (days: number) =>
      new Date(
        Date.now() - days * 24 * 60 * 60 * 1000,
      ).toISOString();

    db.rows("webhook_deliveries").push(
      {
        delivery_id: "old",
        event: "push",
        received_at: daysAgo(8),
      },
      {
        delivery_id: "recent",
        event: "push",
        received_at: daysAgo(6),
      },
    );

    await POST(webhookRequest(pushPayload()));

    expect(
      db
        .rows("webhook_deliveries")
        .map((row) => row.delivery_id),
    ).toEqual(["recent", "delivery-1"]);
  });
});

describe("過去の履歴や大量のコミットのpush", () => {
  it("キャラクターが誕生する前のコミットには経験値を付けず，差分も取りに行かない", async () => {
    const response = await POST(
      webhookRequest(
        pushPayload({
          commits: [
            {
              ...FEAT_COMMIT,
              timestamp: "2026-10-01T00:00:00Z",
            },
          ],
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(character().current_xp).toBe(0);
    expect(mocks.fetchedShas).toEqual([]);
  });

  it("誕生の前と後のコミットが混ざっている時は，後のコミットだけを数える", async () => {
    await POST(
      webhookRequest(
        pushPayload({
          commits: [
            {
              ...FEAT_COMMIT,
              id: "sha-old",
              timestamp: "2026-10-01T00:00:00Z",
            },
            FEAT_COMMIT,
          ],
        }),
      ),
    );

    expect(character().current_xp).toBe(FEAT_XP);
    expect(mocks.fetchedShas).toEqual([FEAT_COMMIT.id]);
  });

  it("差分を取りに行くのは50件までで，残りは通知のファイル一覧で数える", async () => {
    const commits = Array.from(
      { length: 60 },
      (_, index) => ({
        id: `sha-${index}`,
        message: `feat: 画面${index}を追加`,
        timestamp: "2026-11-14T03:00:00Z",
        distinct: true,
        added: [`src/screen-${index}.ts`],
      }),
    );

    await POST(webhookRequest(pushPayload({ commits })));

    expect(mocks.fetchedShas).toHaveLength(50);
    expect(
      db
        .rows("growth_events")
        .filter((event) => event.event_type === "commit_feat"),
    ).toHaveLength(60);
  });
});

describe("週のクエスト", () => {
  // FEAT_COMMIT（2026-11-14）が含まれる週の月曜日（日本時間）
  const WEEK = "2026-11-09";

  it("pushで達成した段階の報酬が，ユーザーのゴールドに入る", async () => {
    const response = await POST(
      webhookRequest(pushPayload()),
    );

    expect(response.status).toBe(200);

    // 1回コミット（★1）と1日コミット（★1）．本文がないので毎回クエストは失敗
    expect(db.rows("quest_completions")).toEqual([
      expect.objectContaining({
        user_id: "user-1",
        week_start: WEEK,
        quest_id: "commits",
        stage: 1,
      }),
      expect.objectContaining({
        user_id: "user-1",
        week_start: WEEK,
        quest_id: "days",
        stage: 1,
      }),
    ]);
    expect(db.rows("user_wallets")).toEqual([
      { user_id: "user-1", gold: 20 },
    ]);
  });

  it("すでに渡した段階の報酬は，次のpushで二重に渡さない", async () => {
    await POST(webhookRequest(pushPayload()));
    await POST(
      webhookRequest(pushPayload(), {
        deliveryId: "delivery-2",
      }),
    );

    /*
     * 2回目のpushで新しく達成したのは，経験値30（★1）だけ．
     * 1回コミット・1日コミットの★1は，もう一度は渡さない．
     */
    expect(
      db
        .rows("quest_completions")
        .map((row) => `${row.quest_id}:${row.stage}`),
    ).toEqual(["commits:1", "days:1", "xp:1"]);
    expect(db.rows("user_wallets")).toEqual([
      { user_id: "user-1", gold: 30 },
    ]);
  });

  it("報酬を渡すのに失敗しても，経験値はそのまま入り，再送はしない", async () => {
    db.failNext("grant_quest_rewards", "rpc");

    const response = await POST(
      webhookRequest(pushPayload()),
    );

    // 再送されると経験値が二重に入るので，成功として返す
    expect(response.status).toBe(200);
    expect(character().current_xp).toBe(FEAT_XP);
    expect(db.rows("user_wallets")).toHaveLength(0);

    // 次のpushで，渡しそこねた報酬（★1 2つ）と，新しく達成した経験値30の★1をまとめて渡す
    await POST(
      webhookRequest(pushPayload(), {
        deliveryId: "delivery-2",
      }),
    );

    expect(db.rows("user_wallets")).toEqual([
      { user_id: "user-1", gold: 30 },
    ]);
  });
});
