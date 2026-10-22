/*
 * 使われなくなったデータベースの定義を削除する．
 */

-- 削除した仮コミット機能で使っていた関数
drop function if exists public.apply_character_growth(uuid, integer, text);

/*
 * 「Users can view characters in own repositories」と同じ内容の閲覧ポリシー．
 * こちらは未ログインのユーザー（public）にも評価されるため，
 * authenticated に限った方を残す．
 */
drop policy if exists "本人のリポジトリのキャラクターのみ閲覧"
  on public.characters;
