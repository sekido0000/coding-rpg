/*
 * 成長履歴に，コミットの経験値の内訳を保存する．
 *
 * これまでは合計の経験値だけを保存していたため，
 * 「なぜこの点数になったのか」を表示できず，
 * 「理由を書いたコミット」などを数えるクエストも作れなかった．
 *
 * 列はすべて空（null）でもよくする．
 * これまでの履歴や，誕生・進化の記録は空のままになる．
 */
alter table public.growth_events
  add column category_xp integer,
  add column size_xp integer,
  add column body_xp integer,
  add column changed_lines integer,
  add column is_vague boolean;

/*
 * 経験値を書き込む関数で，内訳も書き込むようにする．
 * 引数は変えないので，作成時の権限（service_role だけが呼べる）はそのまま残る．
 * 内訳を渡さない古いコードから呼ばれても，内訳が空になるだけで動く．
 */
create or replace function public.apply_commit_growth(
  p_character_id uuid,
  p_expected_level integer,
  p_expected_current_xp integer,
  p_level integer,
  p_current_xp integer,
  p_required_xp integer,
  p_image_path text,
  p_latest_activity text,
  p_events jsonb
)
returns boolean
language plpgsql
set search_path to ''
as $function$
begin
  update public.characters
  set
    level = p_level,
    current_xp = p_current_xp,
    required_xp = p_required_xp,
    image_path = p_image_path,
    latest_activity = p_latest_activity,
    updated_at = now()
  where id = p_character_id
    and level = p_expected_level
    and current_xp = p_expected_current_xp;

  -- 他の通知が先に更新していた
  if not found then
    return false;
  end if;

  insert into public.growth_events (
    character_id,
    event_type,
    xp,
    description,
    created_at,
    category_xp,
    size_xp,
    body_xp,
    changed_lines,
    is_vague
  )
  select
    p_character_id,
    event ->> 'event_type',
    (event ->> 'xp')::integer,
    event ->> 'description',
    (event ->> 'created_at')::timestamptz,
    (event ->> 'category_xp')::integer,
    (event ->> 'size_xp')::integer,
    (event ->> 'body_xp')::integer,
    (event ->> 'changed_lines')::integer,
    (event ->> 'is_vague')::boolean
  from jsonb_array_elements(p_events) as event;

  return true;
end;
$function$;
