/*
 * ワールドに建てた建物．
 *
 * 建物の種類と値段はアプリ側（src/lib/buildings/catalog.ts）で決める．
 * 場所は「何列目か（lot_row）」と「掲示板の区画から何区画ずれているか（lot_offset）」で保存し，
 * キャラクターが増えてワールドが広がっても，同じ場所に建っているようにする．
 * 家や掲示板の場所でないか（空いた区画か）は，アプリ側で地図を作って確かめる．
 */

create table public.user_buildings (
  user_id uuid not null,
  building_id text not null,
  lot_row integer not null,
  lot_offset integer not null,
  built_at timestamp with time zone default now() not null,

  -- 同じ建物は1つだけ
  constraint user_buildings_pkey primary key (user_id, building_id),
  -- 同じ区画には1つだけ
  constraint user_buildings_lot_key unique (user_id, lot_row, lot_offset),
  constraint user_buildings_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_buildings_lot_row_check check (lot_row in (0, 1))
);

/* ---------- 権限と RLS ---------- */

grant select, insert, update, delete
  on public.user_buildings
  to service_role;

grant select
  on public.user_buildings
  to authenticated;

alter table public.user_buildings enable row level security;

create policy "Users can view own buildings"
  on public.user_buildings
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

/*
 * ---------- 建物を建てる ----------
 * ゴールドが足りて，その建物をまだ建てておらず，その区画が空いている時だけ建てる．
 * 結果を文字で返す．
 * - ok：建てた
 * - insufficient：ゴールドが足りない
 * - taken：同じ建物がある，またはその区画にほかの建物がある
 */
create or replace function public.purchase_building(
  p_user_id uuid,
  p_building_id text,
  p_price integer,
  p_row integer,
  p_offset integer
)
returns text
language plpgsql
set search_path to ''
as $function$
begin
  if p_price <= 0 then
    raise exception 'price must be positive';
  end if;

  if exists (
    select 1
    from public.user_buildings
    where user_id = p_user_id
      and (
        building_id = p_building_id
        or (lot_row = p_row and lot_offset = p_offset)
      )
  ) then
    return 'taken';
  end if;

  update public.user_wallets
  set
    gold = gold - p_price,
    updated_at = now()
  where user_id = p_user_id
    and gold >= p_price;

  if not found then
    return 'insufficient';
  end if;

  insert into public.user_buildings (
    user_id,
    building_id,
    lot_row,
    lot_offset
  )
  values (p_user_id, p_building_id, p_row, p_offset);

  return 'ok';
exception
  -- 同時に建てようとして，一意の制約に当たった（ゴールドを引いた分も取り消される）
  when unique_violation then
    return 'taken';
end;
$function$;

/*
 * ---------- 建物を移す ----------
 * - ok：移した
 * - missing：その建物を建てていない
 * - taken：移す先の区画にほかの建物がある
 */
create or replace function public.move_building(
  p_user_id uuid,
  p_building_id text,
  p_row integer,
  p_offset integer
)
returns text
language plpgsql
set search_path to ''
as $function$
begin
  update public.user_buildings
  set lot_row = p_row, lot_offset = p_offset
  where user_id = p_user_id
    and building_id = p_building_id;

  if not found then
    return 'missing';
  end if;

  return 'ok';
exception
  when unique_violation then
    return 'taken';
end;
$function$;

/*
 * ---------- 建物を取り壊す ----------
 * 取り壊して，p_refund のゴールドを返す（返す額はアプリ側で値段の半分にする）．
 * 取り壊しと返金は1つのトランザクションなので，片方だけになることはない．
 * - ok：取り壊した
 * - missing：その建物を建てていない
 */
create or replace function public.demolish_building(
  p_user_id uuid,
  p_building_id text,
  p_refund integer
)
returns text
language plpgsql
set search_path to ''
as $function$
begin
  delete from public.user_buildings
  where user_id = p_user_id
    and building_id = p_building_id;

  if not found then
    return 'missing';
  end if;

  if p_refund > 0 then
    insert into public.user_wallets (user_id, gold)
    values (p_user_id, p_refund)
    on conflict (user_id) do update
    set
      gold = public.user_wallets.gold + excluded.gold,
      updated_at = now();
  end if;

  return 'ok';
end;
$function$;

/*
 * サーバー（service_role）からだけ呼べるようにする．
 * 関数は作成時に誰でも実行できる状態になるため，先に取り消す．
 */
revoke all
  on function public.purchase_building(uuid, text, integer, integer, integer)
  from public, anon, authenticated;

grant execute
  on function public.purchase_building(uuid, text, integer, integer, integer)
  to service_role;

revoke all
  on function public.move_building(uuid, text, integer, integer)
  from public, anon, authenticated;

grant execute
  on function public.move_building(uuid, text, integer, integer)
  to service_role;

revoke all
  on function public.demolish_building(uuid, text, integer)
  from public, anon, authenticated;

grant execute
  on function public.demolish_building(uuid, text, integer)
  to service_role;
