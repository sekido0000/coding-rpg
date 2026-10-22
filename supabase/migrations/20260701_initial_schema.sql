/*
 * 初期スキーマ．
 * 本番のデータベースから書き出した定義を，適用できる順番に並べ直したもの．
 * webhook_deliveries は 20261022_add_webhook_deliveries.sql で作成する．
 */

/* ---------- テーブル ---------- */

create table public.github_installations (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  github_installation_id bigint not null,
  account_id bigint not null,
  account_login text not null,
  target_type text not null,
  repository_selection text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.repositories (
  id uuid default gen_random_uuid() not null,
  github_repository_id bigint not null,
  owner text not null,
  name text not null,
  default_branch text default 'main'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  user_id uuid not null,
  github_installation_id uuid,
  html_url text,
  is_private boolean default false not null,
  visibility text default 'public'::text not null,
  is_active boolean default true not null
);

create table public.characters (
  id uuid default gen_random_uuid() not null,
  repository_id uuid not null,
  name text not null,
  personality text not null,
  level integer default 1 not null,
  current_xp integer default 0 not null,
  required_xp integer default 100 not null,
  image_path text default '/characters/sprout.svg'::text not null,
  latest_activity text default 'キャラクターが誕生しました'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  character_type text default 'sprout'::text not null
);

create table public.growth_events (
  id uuid default gen_random_uuid() not null,
  character_id uuid not null,
  event_type text not null,
  xp integer not null,
  description text not null,
  created_at timestamp with time zone default now() not null
);

/* ---------- 主キー・一意制約 ---------- */

alter table public.github_installations
  add constraint github_installations_pkey primary key (id);

alter table public.github_installations
  add constraint github_installations_github_installation_id_key unique (github_installation_id);

alter table public.repositories
  add constraint repositories_pkey primary key (id);

alter table public.characters
  add constraint characters_pkey primary key (id);

-- 1つのリポジトリにキャラクターは1体
alter table public.characters
  add constraint characters_repository_id_key unique (repository_id);

alter table public.growth_events
  add constraint growth_events_pkey primary key (id);

/* ---------- チェック制約 ---------- */

alter table public.github_installations
  add constraint github_installations_target_type_check
  check (target_type = any (array['User'::text, 'Organization'::text]));

alter table public.characters
  add constraint characters_character_type_check
  check (character_type = any (array[
    'sprout'::text, 'slime'::text, 'robot'::text, 'hero'::text,
    'warrior'::text, 'knight'::text, 'mage'::text, 'cleric'::text,
    'thief'::text, 'archer'::text, 'monk'::text, 'merchant'::text,
    'bard'::text, 'bandit'::text, 'enemy_soldier'::text, 'assassin'::text,
    'dark_mage'::text, 'berserker'::text, 'fallen_knight'::text,
    'heretic_priest'::text, 'bounty_hunter'::text, 'cultist'::text,
    'rival_hero'::text, 'homunculus'::text, 'controlled_soldier'::text,
    'swordmaster'::text, 'corrupt_merchant'::text, 'general'::text
  ]));

alter table public.characters
  add constraint characters_personality_check
  check (personality = any (array['cheerful'::text, 'calm'::text, 'serious'::text]));

alter table public.characters
  add constraint characters_level_check check (level >= 1);

alter table public.characters
  add constraint characters_current_xp_check check (current_xp >= 0);

alter table public.characters
  add constraint characters_required_xp_check check (required_xp >= 1);

alter table public.growth_events
  add constraint growth_events_xp_check check (xp >= 0);

/* ---------- 外部キー ---------- */

alter table public.github_installations
  add constraint github_installations_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.repositories
  add constraint repositories_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.repositories
  add constraint repositories_github_installation_id_fkey
  foreign key (github_installation_id) references public.github_installations(id) on delete cascade;

alter table public.characters
  add constraint characters_repository_id_fkey
  foreign key (repository_id) references public.repositories(id) on delete cascade;

alter table public.growth_events
  add constraint growth_events_character_id_fkey
  foreign key (character_id) references public.characters(id) on delete cascade;

/* ---------- インデックス ---------- */

create index github_installations_user_id_index
  on public.github_installations using btree (user_id);

create index repositories_user_id_index
  on public.repositories using btree (user_id);

-- GitHub Appのセットアップ時の upsert（onConflict: user_id,github_repository_id）で使う
create unique index repositories_user_github_repository_unique
  on public.repositories using btree (user_id, github_repository_id);

create index growth_events_character_id_index
  on public.growth_events using btree (character_id);

create index growth_events_created_at_index
  on public.growth_events using btree (created_at desc);

/*
 * ---------- 権限 ----------
 * 新しいプロジェクトでは，テーブルに権限が自動で付かない場合があるため明示する．
 * サーバー（service_role）は読み書きし，ログイン中のユーザー（authenticated）は
 * 下のRLSポリシーで許可された行だけを読める．
 */

grant select, insert, update, delete
  on public.github_installations,
     public.repositories,
     public.characters,
     public.growth_events
  to service_role;

grant select
  on public.github_installations,
     public.repositories,
     public.characters,
     public.growth_events
  to authenticated;

/*
 * ---------- Row Level Security ----------
 * ブラウザ（publishable key）からは，本人のデータの閲覧だけを許可する．
 * 書き込みはサーバー（secret key）からのみ行うため，書き込みのポリシーは作らない．
 */

alter table public.github_installations enable row level security;
alter table public.repositories enable row level security;
alter table public.characters enable row level security;
alter table public.growth_events enable row level security;

create policy "Users can view own GitHub installations"
  on public.github_installations
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

create policy "Users can view own repositories"
  on public.repositories
  as permissive for select to authenticated
  using (
    (select auth.uid() as uid) is not null
    and (select auth.uid() as uid) = user_id
  );

create policy "Users can view characters in own repositories"
  on public.characters
  as permissive for select to authenticated
  using (
    exists (
      select 1
      from public.repositories repository
      where repository.id = characters.repository_id
        and repository.user_id = (select auth.uid() as uid)
    )
  );

create policy "本人のリポジトリのキャラクターのみ閲覧"
  on public.characters
  as permissive for select to public
  using (
    repository_id in (
      select repositories.id
      from public.repositories
      where repositories.user_id = auth.uid()
    )
  );

create policy "Users can view own growth events"
  on public.growth_events
  as permissive for select to authenticated
  using (
    exists (
      select 1
      from public.characters "character"
      join public.repositories repository
        on repository.id = "character".repository_id
      where "character".id = growth_events.character_id
        and repository.user_id = (select auth.uid() as uid)
    )
  );

/* ---------- 関数 ---------- */

create or replace function public.apply_character_growth(
  p_character_id uuid,
  p_gained_xp integer,
  p_event_type text default 'mock_commit'::text
)
returns void
language plpgsql
set search_path to ''
as $function$
declare
  v_level integer;
  v_current_xp integer;
  v_required_xp integer;
  v_levels_gained integer := 0;
  v_activity text;
begin
  if p_gained_xp <= 0 then
    raise exception
      'gained XP must be greater than zero';
  end if;

  select
    c.level,
    c.current_xp,
    c.required_xp
  into
    v_level,
    v_current_xp,
    v_required_xp
  from public.characters as c
  where c.id = p_character_id
  for update;

  if not found then
    raise exception
      'character not found: %',
      p_character_id;
  end if;

  v_current_xp := v_current_xp + p_gained_xp;

  while v_current_xp >= v_required_xp loop
    v_current_xp :=
      v_current_xp - v_required_xp;

    v_level := v_level + 1;
    v_levels_gained := v_levels_gained + 1;
  end loop;

  if v_levels_gained > 0 then
    v_activity := format(
      '仮コミットで%s XP獲得し，レベル%sになりました',
      p_gained_xp,
      v_level
    );
  else
    v_activity := format(
      '仮コミットで%s XP獲得しました',
      p_gained_xp
    );
  end if;

  update public.characters
  set
    level = v_level,
    current_xp = v_current_xp,
    latest_activity = v_activity,
    updated_at = now()
  where id = p_character_id;

  insert into public.growth_events (
    character_id,
    event_type,
    xp,
    description
  )
  values (
    p_character_id,
    p_event_type,
    p_gained_xp,
    v_activity
  );
end;
$function$;

/* ---------- Realtime ---------- */

-- ホーム画面でキャラクターの成長をリアルタイムに反映する
alter publication supabase_realtime add table public.characters;
