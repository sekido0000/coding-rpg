/*
 * 週のクエストと，報酬のゴールドを保存する．
 *
 * クエストはユーザー単位で，全部のリポジトリのコミットを合わせて数える．
 * 進み具合は成長履歴（growth_events）から計算するので保存しない．
 * 保存するのは「達成して報酬を渡したこと」と「持っているゴールド」だけ．
 */

/* ---------- 持っているゴールド（全キャラクター共通） ---------- */

create table public.user_wallets (
  user_id uuid not null,
  gold integer default 0 not null,
  updated_at timestamp with time zone default now() not null,

  constraint user_wallets_pkey primary key (user_id),
  constraint user_wallets_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_wallets_gold_check check (gold >= 0)
);

/*
 * ---------- 達成したクエスト ----------
 * ユーザー・週・クエスト・段階の組み合わせは1回だけ記録できる．
 * 同じ段階の報酬を2回渡さないようにするため．
 */

create table public.quest_completions (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  -- その週の月曜日（日本時間）
  week_start date not null,
  quest_id text not null,
  -- ★の数（1〜3）
  stage integer not null,
  gold integer not null,
  created_at timestamp with time zone default now() not null,

  constraint quest_completions_pkey primary key (id),
  constraint quest_completions_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint quest_completions_unique
    unique (user_id, week_start, quest_id, stage),
  constraint quest_completions_quest_id_check
    check (quest_id in ('commits', 'days', 'xp', 'every_time')),
  constraint quest_completions_stage_check
    check (stage between 1 and 3),
  constraint quest_completions_gold_check
    check (gold > 0)
);

/*
 * ---------- 権限と RLS ----------
 * サーバー（service_role）が書き込み，ログイン中のユーザーは自分の行だけ読める．
 */

grant select, insert, update, delete
  on public.user_wallets,
     public.quest_completions
  to service_role;

grant select
  on public.user_wallets,
     public.quest_completions
  to authenticated;

alter table public.user_wallets enable row level security;
alter table public.quest_completions enable row level security;

create policy "Users can view own wallet"
  on public.user_wallets
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

create policy "Users can view own quest completions"
  on public.quest_completions
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

/*
 * ---------- 報酬を渡す関数 ----------
 * 達成した段階を記録し，まだ記録されていなかった分だけゴールドを足す．
 * 1つのトランザクションなので，記録だけ残ってゴールドが入らないことはない．
 * 同じ push の再送や，同時に届いた push で呼ばれても，二重には渡さない．
 * 新しく渡したゴールドの合計を返す．
 */
create or replace function public.grant_quest_rewards(
  p_user_id uuid,
  p_week_start date,
  p_rewards jsonb
)
returns integer
language plpgsql
set search_path to ''
as $function$
declare
  v_gold integer;
begin
  with inserted as (
    insert into public.quest_completions (
      user_id,
      week_start,
      quest_id,
      stage,
      gold
    )
    select
      p_user_id,
      p_week_start,
      reward ->> 'quest_id',
      (reward ->> 'stage')::integer,
      (reward ->> 'gold')::integer
    from jsonb_array_elements(p_rewards) as reward
    on conflict (user_id, week_start, quest_id, stage) do nothing
    returning gold
  )
  select coalesce(sum(gold), 0)
  into v_gold
  from inserted;

  if v_gold > 0 then
    insert into public.user_wallets (user_id, gold)
    values (p_user_id, v_gold)
    on conflict (user_id) do update
    set
      gold = public.user_wallets.gold + excluded.gold,
      updated_at = now();
  end if;

  return v_gold;
end;
$function$;

/*
 * サーバー（service_role）からだけ呼べるようにする．
 * 関数は作成時に誰でも実行できる状態になるため，先に取り消す．
 */
revoke all
  on function public.grant_quest_rewards(uuid, date, jsonb)
  from public, anon, authenticated;

grant execute
  on function public.grant_quest_rewards(uuid, date, jsonb)
  to service_role;
