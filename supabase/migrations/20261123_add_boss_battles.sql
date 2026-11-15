/*
 * 週のボス戦．
 *
 * 毎週，★1〜★5 に1回ずつ勝つと報酬（ゴールドと素材）がもらえる．
 * 戦いの計算はサーバーで行い，ここには「勝ったこと」と「持っている素材」だけを保存する．
 * 負けても記録しない（何度でも挑み直せる）．
 */

/*
 * ---------- 勝ったボス戦 ----------
 * ユーザー・週・★の組み合わせは1回だけ記録できる．同じ★の報酬を2回渡さないようにするため．
 */

create table public.boss_wins (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  -- その週の月曜日（日本時間）
  week_start date not null,
  star integer not null,
  boss_id text not null,
  gold integer not null,
  created_at timestamp with time zone default now() not null,

  constraint boss_wins_pkey primary key (id),
  constraint boss_wins_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint boss_wins_unique unique (user_id, week_start, star),
  constraint boss_wins_star_check check (star between 1 and 5),
  constraint boss_wins_gold_check check (gold >= 0)
);

/* ---------- 持っている素材 ---------- */

create table public.user_materials (
  user_id uuid not null,
  material_id text not null,
  quantity integer default 0 not null,
  updated_at timestamp with time zone default now() not null,

  constraint user_materials_pkey primary key (user_id, material_id),
  constraint user_materials_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_materials_quantity_check check (quantity >= 0)
);

/*
 * ---------- 権限と RLS ----------
 * サーバー（service_role）が書き込み，ログイン中のユーザーは自分の行だけ読める．
 */

grant select, insert, update, delete
  on public.boss_wins,
     public.user_materials
  to service_role;

grant select
  on public.boss_wins,
     public.user_materials
  to authenticated;

alter table public.boss_wins enable row level security;
alter table public.user_materials enable row level security;

create policy "Users can view own boss wins"
  on public.boss_wins
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

create policy "Users can view own materials"
  on public.user_materials
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

/*
 * ---------- 報酬を渡す関数 ----------
 * 勝ったことを記録し，記録できた時だけゴールドと素材を足す．
 * 1つのトランザクションなので，記録だけ残って報酬が入らないことはない．
 * - ok：報酬を渡した
 * - already：今週のその★は，もう勝っている
 */
create or replace function public.grant_boss_rewards(
  p_user_id uuid,
  p_week_start date,
  p_star integer,
  p_boss_id text,
  p_gold integer,
  p_materials jsonb
)
returns text
language plpgsql
set search_path to ''
as $function$
declare
  v_inserted integer;
begin
  insert into public.boss_wins (user_id, week_start, star, boss_id, gold)
  values (p_user_id, p_week_start, p_star, p_boss_id, p_gold)
  on conflict (user_id, week_start, star) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return 'already';
  end if;

  if p_gold > 0 then
    insert into public.user_wallets (user_id, gold)
    values (p_user_id, p_gold)
    on conflict (user_id) do update
    set
      gold = public.user_wallets.gold + excluded.gold,
      updated_at = now();
  end if;

  insert into public.user_materials (user_id, material_id, quantity)
  select
    p_user_id,
    material ->> 'id',
    (material ->> 'quantity')::integer
  from jsonb_array_elements(p_materials) as material
  where (material ->> 'quantity')::integer > 0
  on conflict (user_id, material_id) do update
  set
    quantity = public.user_materials.quantity + excluded.quantity,
    updated_at = now();

  return 'ok';
end;
$function$;

revoke all
  on function public.grant_boss_rewards(uuid, date, integer, text, integer, jsonb)
  from public, anon, authenticated;

grant execute
  on function public.grant_boss_rewards(uuid, date, integer, text, integer, jsonb)
  to service_role;

/*
 * ---------- ダンジョンの入口の場所 ----------
 * 家・掲示板・雑貨店と同じく，ワールドで移せるようにする（dungeon_gate）．
 */
create or replace function public.place_lot(
  p_user_id uuid,
  p_key text,
  p_row integer,
  p_offset integer
)
returns text
language plpgsql
set search_path to ''
as $function$
begin
  if not (
    p_key in ('quest_board', 'general_store', 'dungeon_gate')
    or p_key like 'house:%'
  ) then
    return 'invalid';
  end if;

  insert into public.user_buildings (
    user_id,
    building_id,
    lot_row,
    lot_offset
  )
  values (p_user_id, p_key, p_row, p_offset)
  on conflict (user_id, building_id) do update
  set lot_row = excluded.lot_row, lot_offset = excluded.lot_offset;

  return 'ok';
exception
  when unique_violation then
    return 'taken';
end;
$function$;

revoke all
  on function public.place_lot(uuid, text, integer, integer)
  from public, anon, authenticated;

grant execute
  on function public.place_lot(uuid, text, integer, integer)
  to service_role;
