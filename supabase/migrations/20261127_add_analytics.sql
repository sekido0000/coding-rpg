/*
 * アプリの改善のための記録（分析用）．
 *
 * - 使い方の回数：画面や機能を使った回数を，1日ごと・種類ごとに数えるだけ（細かい操作の記録は取らない）
 * - 比べる元：キャラクターが生まれる前の90日間のコミットの集計値（メッセージそのものは保存しない）
 *
 * 利用者は設定で「分析に使わない」を選べる．選んだ時は，この2つの記録を消し，以後は記録しない．
 * どちらもサーバー（service_role）からだけ読み書きし，ブラウザからは読めない．
 */

/* ---------- 分析に使わない設定 ---------- */

alter table public.user_profiles
  add column analytics_opt_out boolean default false not null;

/*
 * ---------- 使い方の回数 ----------
 * target は，キャラクターごとに数える時のキャラクターの ID（それ以外は空の文字）．
 */
create table public.usage_counts (
  user_id uuid not null,
  -- 日本時間の日付
  day date not null,
  event text not null,
  target text default '' not null,
  count integer default 0 not null,

  constraint usage_counts_pkey primary key (user_id, day, event, target),
  constraint usage_counts_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint usage_counts_event_check check (char_length(event) <= 40),
  constraint usage_counts_target_check check (char_length(target) <= 64),
  constraint usage_counts_count_check check (count >= 0)
);

/*
 * ---------- 比べる元（使い始める前のコミットの姿） ----------
 * リポジトリ（キャラクター）ごとに1行．期間は，キャラクターが生まれる前の90日間．
 * commit_count が 0 の時は「比べる元なし」．
 */
create table public.commit_baselines (
  repository_id uuid not null,
  user_id uuid not null,
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  commit_count integer not null,
  -- コミットした日数（日本時間）
  active_days integer not null,
  -- 理由（本文）を書いたコミットの数
  body_count integer not null,
  -- 何をしたか分からないメッセージのコミットの数
  vague_count integer not null,
  computed_at timestamp with time zone default now() not null,

  constraint commit_baselines_pkey primary key (repository_id),
  constraint commit_baselines_repository_id_fkey
    foreign key (repository_id) references public.repositories(id) on delete cascade,
  constraint commit_baselines_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade
);

create index commit_baselines_user_id_idx on public.commit_baselines (user_id);

grant select, insert, update, delete
  on public.usage_counts,
     public.commit_baselines
  to service_role;

-- RLS を有効にし，ポリシーは作らない（ブラウザからは読み書きできない）
alter table public.usage_counts enable row level security;
alter table public.commit_baselines enable row level security;

/*
 * ---------- 回数を1つ足す ----------
 * 同じ日・同じ種類の行があれば足し，なければ作る．
 */
create or replace function public.increment_usage(
  p_user_id uuid,
  p_day date,
  p_event text,
  p_target text
)
returns void
language plpgsql
set search_path to ''
as $function$
begin
  insert into public.usage_counts (user_id, day, event, target, count)
  values (p_user_id, p_day, p_event, coalesce(p_target, ''), 1)
  on conflict (user_id, day, event, target) do update
  set count = public.usage_counts.count + 1;
end;
$function$;

revoke all
  on function public.increment_usage(uuid, date, text, text)
  from public, anon, authenticated;

grant execute
  on function public.increment_usage(uuid, date, text, text)
  to service_role;
