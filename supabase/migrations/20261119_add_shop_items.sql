/*
 * お店で買う装備．
 *
 * クエストで得たゴールドで装備を買い，キャラクターに付ける．
 * 買った装備はユーザーのもので，どのキャラクターにも付けられる．
 * 1個買うと1体に付けられる（同じ装備を2体に付けるには2個買う）．
 *
 * 装備の種類（名前・値段など）はアプリ側（src/lib/items/catalog.ts）で決める．
 * 装備を増やすたびに DB を変えなくて済むよう，DB では種類を制限しない．
 */

/* ---------- 持っている装備と個数 ---------- */

create table public.user_items (
  user_id uuid not null,
  item_id text not null,
  quantity integer not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,

  constraint user_items_pkey primary key (user_id, item_id),
  constraint user_items_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_items_quantity_check check (quantity > 0)
);

/* ---------- キャラクターが付けている装備 ---------- */

alter table public.characters
  -- おとも（横をついて歩く仲間）
  add column companion_item text,
  -- 足元（光の輪やオーラ）
  add column aura_item text;

/* ---------- 権限と RLS ---------- */

grant select, insert, update, delete
  on public.user_items
  to service_role;

grant select
  on public.user_items
  to authenticated;

alter table public.user_items enable row level security;

create policy "Users can view own items"
  on public.user_items
  as permissive for select to authenticated
  using (user_id = (select auth.uid() as uid));

/*
 * ---------- 装備を買う関数 ----------
 * ゴールドが足りる時だけ引いて，持ち物に1個足す．
 * 足りるかの確認と引く処理を1つの更新で行うので，同時に買っても
 * ゴールドがマイナスになることはない．
 * 買えた時は残りのゴールドを，足りなかった時は null を返す．
 */
create or replace function public.purchase_item(
  p_user_id uuid,
  p_item_id text,
  p_price integer
)
returns integer
language plpgsql
set search_path to ''
as $function$
declare
  v_gold integer;
begin
  if p_price <= 0 then
    raise exception 'price must be positive';
  end if;

  update public.user_wallets
  set
    gold = gold - p_price,
    updated_at = now()
  where user_id = p_user_id
    and gold >= p_price
  returning gold into v_gold;

  if not found then
    return null;
  end if;

  insert into public.user_items (user_id, item_id, quantity)
  values (p_user_id, p_item_id, 1)
  on conflict (user_id, item_id) do update
  set
    quantity = public.user_items.quantity + 1,
    updated_at = now();

  return v_gold;
end;
$function$;

/*
 * ---------- 装備を付ける・外す関数 ----------
 * p_slot は companion（おとも）か aura（足元）．p_item_id が null の時は外す．
 *
 * 次の時は何もせずに false を返す．
 * - キャラクターがそのユーザーのものではない
 * - その装備を持っていない
 * - 持っている個数だけ，ほかのキャラクターがすでに付けている
 *   （連携を解除したリポジトリのキャラクターは数えない）
 *
 * 持ち物の行をロックするので，同じ装備を同時に付けようとしても
 * 個数を超えて付くことはない．
 */
create or replace function public.equip_item(
  p_user_id uuid,
  p_character_id uuid,
  p_slot text,
  p_item_id text
)
returns boolean
language plpgsql
set search_path to ''
as $function$
declare
  v_owned integer;
  v_used integer;
begin
  if p_slot not in ('companion', 'aura') then
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

  if p_item_id is not null then
    select quantity
    into v_owned
    from public.user_items
    where user_id = p_user_id
      and item_id = p_item_id
    for update;

    if v_owned is null then
      return false;
    end if;

    select count(*)
    into v_used
    from public.characters "character"
    join public.repositories repository
      on repository.id = "character".repository_id
    where repository.user_id = p_user_id
      -- 連携を解除したリポジトリのキャラクターは数えない
      and repository.is_active
      and "character".id <> p_character_id
      and case p_slot
        when 'companion' then "character".companion_item
        else "character".aura_item
      end = p_item_id;

    if v_used >= v_owned then
      return false;
    end if;
  end if;

  if p_slot = 'companion' then
    update public.characters
    set companion_item = p_item_id, updated_at = now()
    where id = p_character_id;
  else
    update public.characters
    set aura_item = p_item_id, updated_at = now()
    where id = p_character_id;
  end if;

  return true;
end;
$function$;

/*
 * サーバー（service_role）からだけ呼べるようにする．
 * 関数は作成時に誰でも実行できる状態になるため，先に取り消す．
 */
revoke all
  on function public.purchase_item(uuid, text, integer)
  from public, anon, authenticated;

grant execute
  on function public.purchase_item(uuid, text, integer)
  to service_role;

revoke all
  on function public.equip_item(uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute
  on function public.equip_item(uuid, uuid, text, text)
  to service_role;
