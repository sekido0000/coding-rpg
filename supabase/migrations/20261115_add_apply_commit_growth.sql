/*
 * pushで得た経験値を，キャラクターと成長履歴にまとめて書き込む関数．
 *
 * これまではキャラクターの更新と成長履歴の書き込みを別々に行っていたため，
 * 間で失敗すると，経験値は入ったのに履歴が残らないことがあった．
 * 関数の中の処理は1つのトランザクションになるので，
 * 途中で失敗した時は両方とも取り消される．
 *
 * 経験値やレベルの計算はアプリ側（src/lib/growth/level.ts）で行い，
 * この関数は書き込みだけを担当する．
 * 読み込んだ時からレベルと経験値が変わっていない時だけ更新し（楽観的ロック），
 * 変わっていた時は何も書き込まずに false を返す．
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
    created_at
  )
  select
    p_character_id,
    event ->> 'event_type',
    (event ->> 'xp')::integer,
    event ->> 'description',
    (event ->> 'created_at')::timestamptz
  from jsonb_array_elements(p_events) as event;

  return true;
end;
$function$;

/*
 * サーバー（service_role）からだけ呼べるようにする．
 * 関数は作成時に誰でも実行できる状態になるため，先に取り消す．
 */
revoke all
  on function public.apply_commit_growth(
    uuid, integer, integer, integer, integer, integer, text, text, jsonb
  )
  from public, anon, authenticated;

grant execute
  on function public.apply_commit_growth(
    uuid, integer, integer, integer, integer, integer, text, text, jsonb
  )
  to service_role;
