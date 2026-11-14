/*
 * テスト用の偽のSupabaseクライアント．
 *
 * 表をメモリ上の配列で持ち，Webhookの処理で使う書き方
 * （select・insert・upsert・update・delete と eq・lt・not・maybeSingle・single，
 * それに DB の関数 apply_commit_growth）だけを再現する．
 * 本物のDBにはつながない．
 */

export type Row = Record<string, unknown>;

type DbError = {
  code?: string;
  message: string;
};

type Result = {
  data: unknown;
  error: DbError | null;
};

type Operation =
  | "select"
  | "insert"
  | "upsert"
  | "rpc"
  | "update"
  | "delete";

/*
 * 更新する直前に呼ばれる処理．
 * 別の通知が先に書き換えた状況（競合）を作るのに使う．
 */
type BeforeUpdate = (
  table: string,
  rows: Row[],
) => void;

// 主キーの重複を確かめる表と列
const PRIMARY_KEYS: Record<string, string> = {
  webhook_deliveries: "delivery_id",
};

class QueryBuilder
  implements PromiseLike<Result>
{
  private operation: Operation = "select";
  private filters: ((row: Row) => boolean)[] = [];
  private conflictColumns: string[] = [];
  private values: Row | Row[] = {};
  private returnsRows = false;

  constructor(
    private db: FakeSupabase,
    private table: string,
  ) {}

  select() {
    // insert・update の後の select は，変更した行を返す指定
    if (this.operation !== "select") {
      this.returnsRows = true;
    }

    return this;
  }

  insert(values: Row | Row[]) {
    this.operation = "insert";
    this.values = values;
    return this;
  }

  upsert(
    values: Row | Row[],
    { onConflict }: { onConflict: string },
  ) {
    this.operation = "upsert";
    this.values = values;
    this.conflictColumns = onConflict.split(",");
    return this;
  }

  update(values: Row) {
    this.operation = "update";
    this.values = values;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  // 日時の列を，指定した日時より前かで絞り込む
  lt(column: string, value: string) {
    this.filters.push(
      (row) =>
        typeof row[column] === "string" &&
        new Date(row[column] as string) < new Date(value),
    );
    return this;
  }

  // not(列, "in", "(1,2,3)") の形だけを扱う
  not(column: string, operator: string, list: string) {
    if (operator !== "in") {
      throw new Error("not は in だけを扱う");
    }

    const values = list
      .slice(1, -1)
      .split(",")
      .map((value) =>
        Number.isNaN(Number(value)) ? value : Number(value),
      );

    this.filters.push(
      (row) => !values.includes(row[column] as never),
    );
    return this;
  }

  async maybeSingle(): Promise<Result> {
    const { data, error } = this.run();

    if (error) {
      return { data: null, error };
    }

    const rows = data as Row[];

    return { data: rows[0] ?? null, error: null };
  }

  async single(): Promise<Result> {
    const { data, error } = await this.maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: "No rows found" },
      };
    }

    return { data, error: null };
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?:
      | ((value: Result) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ) {
    return Promise.resolve(this.run()).then(
      onfulfilled,
      onrejected,
    );
  }

  private matches(row: Row) {
    return this.filters.every((filter) => filter(row));
  }

  private run(): Result {
    const failure = this.db.takeFailure(
      this.table,
      this.operation,
    );

    if (failure) {
      return { data: null, error: failure };
    }

    const rows = this.db.rows(this.table);

    switch (this.operation) {
      case "select":
        return {
          data: rows.filter((row) => this.matches(row)),
          error: null,
        };

      case "insert": {
        const newRows = Array.isArray(this.values)
          ? this.values
          : [this.values];
        const key = PRIMARY_KEYS[this.table];

        for (const newRow of newRows) {
          if (
            key &&
            rows.some((row) => row[key] === newRow[key])
          ) {
            return {
              data: null,
              error: {
                code: "23505",
                message: "duplicate key value",
              },
            };
          }
        }

        rows.push(...newRows.map((row) => ({ ...row })));

        return {
          data: this.returnsRows ? newRows : null,
          error: null,
        };
      }

      case "upsert": {
        const newRows = Array.isArray(this.values)
          ? this.values
          : [this.values];

        for (const newRow of newRows) {
          const existing = rows.find((row) =>
            this.conflictColumns.every(
              (column) => row[column] === newRow[column],
            ),
          );

          if (existing) {
            Object.assign(existing, newRow);
          } else {
            rows.push({ ...newRow });
          }
        }

        return { data: null, error: null };
      }

      case "update": {
        this.db.beforeUpdate?.(this.table, rows);

        const targets = rows.filter((row) =>
          this.matches(row),
        );

        for (const row of targets) {
          Object.assign(row, this.values);
        }

        return {
          data: this.returnsRows ? targets : null,
          error: null,
        };
      }

      case "delete": {
        const remaining = rows.filter(
          (row) => !this.matches(row),
        );

        rows.splice(0, rows.length, ...remaining);

        return { data: null, error: null };
      }

      // DBの関数は from ではなく rpc で呼ぶ
      case "rpc":
        throw new Error("rpc は FakeSupabase.rpc で呼ぶ");
    }
  }
}

export class FakeSupabase {
  beforeUpdate: BeforeUpdate | null = null;

  private tables = new Map<string, Row[]>();
  private failures: {
    table: string;
    operation: Operation;
    error: DbError;
  }[] = [];

  constructor(initial: Record<string, Row[]> = {}) {
    for (const [table, rows] of Object.entries(initial)) {
      this.tables.set(
        table,
        rows.map((row) => ({ ...row })),
      );
    }
  }

  from(table: string) {
    return new QueryBuilder(this, table);
  }

  /*
   * DBの関数を呼ぶ．Webhookの処理で使う関数だけを再現する．
   */
  async rpc(name: string, args: Row): Promise<Result> {
    const failure = this.takeFailure(name, "rpc");

    if (failure) {
      return { data: null, error: failure };
    }

    if (name !== "apply_commit_growth") {
      return {
        data: null,
        error: { message: `unknown function: ${name}` },
      };
    }

    return {
      data: this.applyCommitGrowth(args),
      error: null,
    };
  }

  // supabase/migrations/20261115_add_apply_commit_growth.sql と同じ動きをする
  private applyCommitGrowth(args: Row) {
    const characters = this.rows("characters");

    this.beforeUpdate?.("characters", characters);

    const character = characters.find(
      (row) =>
        row.id === args.p_character_id &&
        row.level === args.p_expected_level &&
        row.current_xp === args.p_expected_current_xp,
    );

    if (!character) {
      return false;
    }

    Object.assign(character, {
      level: args.p_level,
      current_xp: args.p_current_xp,
      required_xp: args.p_required_xp,
      image_path: args.p_image_path,
      latest_activity: args.p_latest_activity,
    });

    this.rows("growth_events").push(
      ...(args.p_events as Row[]).map((event) => ({
        ...event,
        character_id: args.p_character_id,
      })),
    );

    return true;
  }

  rows(table: string) {
    if (!this.tables.has(table)) {
      this.tables.set(table, []);
    }

    return this.tables.get(table)!;
  }

  /*
   * 次にその表へその操作をした時に，エラーを返すようにする．
   */
  failNext(
    table: string,
    operation: Operation,
    message = "database error",
  ) {
    this.failures.push({
      table,
      operation,
      error: { message },
    });
  }

  takeFailure(table: string, operation: Operation) {
    const index = this.failures.findIndex(
      (failure) =>
        failure.table === table &&
        failure.operation === operation,
    );

    if (index === -1) {
      return null;
    }

    const [failure] = this.failures.splice(index, 1);

    return failure.error;
  }
}
