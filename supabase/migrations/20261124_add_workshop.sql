/*
 * 工房（ボスの素材とゴールドで武器・防具を作る）．
 *
 * 作った装備は1個ずつ行として保存する（同じ装備を2個作れば2行）．
 * 1個の装備は1体にだけ付けられ，1体には武器1つ・防具1つまで付けられる．
 * 値段（素材とゴールド）はサーバーの一覧（src/lib/battle/gear.ts）で決めて渡す．
 */

/* ---------- 作った装備 ---------- */

create table public.user_gear (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  gear_id text not null,
  slot text not null,
  -- 強化の段階（+0〜+3）
  level integer default 0 not null,
  -- 付けているキャラクター（付けていない時は null）
  character_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,

  constraint user_gear_pkey primary key (id),
  constraint user_gear_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_gear_character_id_fkey
    foreign key (character_id) references public.characters(id) on delete set null,
  constraint user_gear_slot_check check (slot in ('weapon', 'armor')),
  constraint user_gear_level_check check (level between 0 and 3)
);

-- 1体には，武器1つ・防具1つまで
create unique index user_gear_character_slot_key
  on public.user_gear (character_id, slot)
  where character_id is not null;

create index user_gear_user_id_idx on public.user_gear (user_id);

grant select, insert, update, delete on public.user_gear to service_role;
grant select on public.user_gear to authenticated;

alter table public.user_gear enable row level security;

create policy "Users can view own gear"
  on public.user_gear
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

/*
 * ---------- ゴールドと素材を使う（内部用） ----------
 * 足りていれば減らして ok を返す．足りなければ何も変えずに理由を返す．
 * - insufficient_gold：ゴールドが足りない
 * - insufficient_materials：素材が足りない
 * 呼び出し元の関数と同じトランザクションで動く．
 */
create or replace function public.spend_resources(
  p_user_id uuid,
  p_gold integer,
  p_materials jsonb
)
returns text
language plpgsql
set search_path to ''
as $function$
declare
  v_gold integer;
  v_missing integer;
begin
  select gold
  into v_gold
  from public.user_wallets
  where user_id = p_user_id
  for update;

  if coalesce(v_gold, 0) < p_gold then
    return 'insufficient_gold';
  end if;

  -- 同時に作った時に二重に使わないよう，使う素材の行を先にロックする
  perform 1
  from public.user_materials
  where user_id = p_user_id
    and material_id in (
      select material ->> 'id'
      from jsonb_array_elements(p_materials) as material
    )
  for update;

  select count(*)
  into v_missing
  from jsonb_array_elements(p_materials) as material
  left join public.user_materials owned
    on owned.user_id = p_user_id
    and owned.material_id = material ->> 'id'
  where coalesce(owned.quantity, 0) < (material ->> 'quantity')::integer;

  if v_missing > 0 then
    return 'insufficient_materials';
  end if;

  update public.user_materials owned
  set
    quantity = owned.quantity - (material ->> 'quantity')::integer,
    updated_at = now()
  from jsonb_array_elements(p_materials) as material
  where owned.user_id = p_user_id
    and owned.material_id = material ->> 'id';

  if p_gold > 0 then
    update public.user_wallets
    set gold = gold - p_gold, updated_at = now()
    where user_id = p_user_id;
  end if;

  return 'ok';
end;
$function$;

/*
 * ---------- 装備を作る ----------
 * ok・insufficient_gold・insufficient_materials・invalid を返す．
 */
create or replace function public.craft_gear(
  p_user_id uuid,
  p_gear_id text,
  p_slot text,
  p_gold integer,
  p_materials jsonb
)
returns text
language plpgsql
set search_path to ''
as $function$
declare
  v_result text;
begin
  if p_slot not in ('weapon', 'armor') then
    return 'invalid';
  end if;

  v_result := public.spend_resources(p_user_id, p_gold, p_materials);

  if v_result <> 'ok' then
    return v_result;
  end if;

  insert into public.user_gear (user_id, gear_id, slot)
  values (p_user_id, p_gear_id, p_slot);

  return 'ok';
end;
$function$;

/*
 * ---------- 装備を強化する ----------
 * 今の段階が p_next_level - 1 の時だけ強化する（二重に強化しないため）．
 * ok・insufficient_gold・insufficient_materials・invalid を返す．
 */
create or replace function public.upgrade_gear(
  p_user_id uuid,
  p_gear_row_id uuid,
  p_next_level integer,
  p_gold integer,
  p_materials jsonb
)
returns text
language plpgsql
set search_path to ''
as $function$
declare
  v_level integer;
  v_result text;
begin
  select level
  into v_level
  from public.user_gear
  where id = p_gear_row_id
    and user_id = p_user_id
  for update;

  if v_level is null or v_level <> p_next_level - 1 or p_next_level > 3 then
    return 'invalid';
  end if;

  v_result := public.spend_resources(p_user_id, p_gold, p_materials);

  if v_result <> 'ok' then
    return v_result;
  end if;

  update public.user_gear
  set level = p_next_level, updated_at = now()
  where id = p_gear_row_id;

  return 'ok';
end;
$function$;

/*
 * ---------- 装備を付ける・外す ----------
 * そのキャラクターの同じ場所（武器・防具）に付けていた装備は外す．
 * p_gear_row_id が null なら外すだけ．別のキャラクターが付けていた装備は，そのキャラクターから移る．
 */
create or replace function public.equip_gear(
  p_user_id uuid,
  p_character_id uuid,
  p_slot text,
  p_gear_row_id uuid
)
returns boolean
language plpgsql
set search_path to ''
as $function$
begin
  if p_slot not in ('weapon', 'armor') then
    return false;
  end if;

  perform 1
  from public.characters "character"
  join public.repositories repository
    on repository.id = "character".repository_id
  where "character".id = p_character_id
    and repository.user_id = p_user_id;

  if not found then
    return false;
  end if;

  if p_gear_row_id is not null then
    perform 1
    from public.user_gear
    where id = p_gear_row_id
      and user_id = p_user_id
      and slot = p_slot
    for update;

    if not found then
      return false;
    end if;
  end if;

  update public.user_gear
  set character_id = null, updated_at = now()
  where user_id = p_user_id
    and character_id = p_character_id
    and slot = p_slot;

  if p_gear_row_id is not null then
    update public.user_gear
    set character_id = p_character_id, updated_at = now()
    where id = p_gear_row_id;
  end if;

  return true;
end;
$function$;

/*
 * サーバー（service_role）からだけ呼べるようにする．
 * 関数は作成時に誰でも実行できる状態になるため，先に取り消す．
 */
revoke all
  on function public.spend_resources(uuid, integer, jsonb)
  from public, anon, authenticated;
revoke all
  on function public.craft_gear(uuid, text, text, integer, jsonb)
  from public, anon, authenticated;
revoke all
  on function public.upgrade_gear(uuid, uuid, integer, integer, jsonb)
  from public, anon, authenticated;
revoke all
  on function public.equip_gear(uuid, uuid, text, uuid)
  from public, anon, authenticated;

grant execute
  on function public.spend_resources(uuid, integer, jsonb)
  to service_role;
grant execute
  on function public.craft_gear(uuid, text, text, integer, jsonb)
  to service_role;
grant execute
  on function public.upgrade_gear(uuid, uuid, integer, integer, jsonb)
  to service_role;
grant execute
  on function public.equip_gear(uuid, uuid, text, uuid)
  to service_role;

/*
 * ---------- 工房の場所 ----------
 * 家・掲示板・雑貨店・ボス戦の入口と同じく，ワールドで移せるようにする（workshop）．
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
    p_key in ('quest_board', 'general_store', 'dungeon_gate', 'workshop')
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
