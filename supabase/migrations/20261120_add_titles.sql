/*
 * 称号．
 *
 * クエストの達成回数やコミットの回数などが一定の数に届くともらえる．
 * 一度もらった称号は，あとで条件を外れても消えない．
 * 称号の種類と条件はアプリ側（src/lib/titles/catalog.ts）で決める．
 */

/* ---------- もらった称号 ---------- */

create table public.user_titles (
  user_id uuid not null,
  title_id text not null,
  earned_at timestamp with time zone default now() not null,

  constraint user_titles_pkey primary key (user_id, title_id),
  constraint user_titles_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade
);

/*
 * ---------- ユーザーの設定 ----------
 * 表示する称号を選んで保存する．
 */

create table public.user_profiles (
  user_id uuid not null,
  selected_title text,
  updated_at timestamp with time zone default now() not null,

  constraint user_profiles_pkey primary key (user_id),
  constraint user_profiles_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade
);

/* ---------- 権限と RLS ---------- */

grant select, insert, update, delete
  on public.user_titles,
     public.user_profiles
  to service_role;

grant select
  on public.user_titles,
     public.user_profiles
  to authenticated;

alter table public.user_titles enable row level security;
alter table public.user_profiles enable row level security;

create policy "Users can view own titles"
  on public.user_titles
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

create policy "Users can view own profile"
  on public.user_profiles
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

/*
 * ---------- 称号の判定に使う数 ----------
 * 1回の問い合わせで，そのユーザーの各種の合計を返す．
 * - quest_stars：クエストの達成回数（★1つで1回）
 * - quest_gold：クエストで得たゴールドの合計（使っても減らない）
 * - characters：これまでに作ったキャラクターの数
 * - commits：経験値が入ったコミットの回数（全リポジトリの合計）
 * - evolutions：レベルが上がった回数（全キャラクターの合計）
 * - purchases：お店で買った回数
 */
create or replace function public.get_title_stats(p_user_id uuid)
returns jsonb
language sql
stable
set search_path to ''
as $function$
  with user_characters as (
    select "character".id
    from public.characters "character"
    join public.repositories repository
      on repository.id = "character".repository_id
    where repository.user_id = p_user_id
  )
  select jsonb_build_object(
    'quest_stars',
      (select count(*)
       from public.quest_completions
       where user_id = p_user_id),
    'quest_gold',
      (select coalesce(sum(gold), 0)
       from public.quest_completions
       where user_id = p_user_id),
    'characters',
      (select count(*) from user_characters),
    'commits',
      (select count(*)
       from public.growth_events event
       where event.character_id in (select id from user_characters)
         and event.event_type like 'commit\_%'
         and event.xp > 0),
    'evolutions',
      (select count(*)
       from public.growth_events event
       where event.character_id in (select id from user_characters)
         and event.event_type = 'level_up'),
    'purchases',
      (select coalesce(sum(quantity), 0)
       from public.user_items
       where user_id = p_user_id)
  );
$function$;

/*
 * サーバー（service_role）からだけ呼べるようにする．
 * 関数は作成時に誰でも実行できる状態になるため，先に取り消す．
 */
revoke all
  on function public.get_title_stats(uuid)
  from public, anon, authenticated;

grant execute
  on function public.get_title_stats(uuid)
  to service_role;
