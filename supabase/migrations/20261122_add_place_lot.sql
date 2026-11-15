/*
 * 家・掲示板・雑貨店の場所を保存する．
 *
 * 建てた建物と同じ表（user_buildings）に，building_id を
 * quest_board・general_store・house:キャラクターのID として保存する．
 * これらは買うものではないので，ゴールドは使わず，取り壊しもできない．
 */

/*
 * 家・掲示板・雑貨店を，その区画に置く（まだ保存していなければ作り，あれば移す）．
 * 建てた建物の名前は受け付けない（買わずに建てられないようにするため）．
 * - ok：置いた
 * - invalid：家・掲示板・雑貨店ではない
 * - taken：その区画にほかの建物がある
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
    p_key in ('quest_board', 'general_store')
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

/*
 * サーバー（service_role）からだけ呼べるようにする．
 * 関数は作成時に誰でも実行できる状態になるため，先に取り消す．
 */
revoke all
  on function public.place_lot(uuid, text, integer, integer)
  from public, anon, authenticated;

grant execute
  on function public.place_lot(uuid, text, integer, integer)
  to service_role;
