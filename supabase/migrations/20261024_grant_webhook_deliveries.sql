/*
 * webhook_deliveries の権限を設定する．
 *
 * 新しく作ったテーブルには，サーバー（service_role）の読み書きの権限が
 * 自動では付かない場合がある．権限がないと通知IDの記録に失敗し，
 * 再送された通知で経験値が二重に加算されてしまう．
 */
grant select, insert, delete
  on public.webhook_deliveries
  to service_role;

-- ブラウザ（anon・authenticated）からは使わない
revoke all
  on public.webhook_deliveries
  from anon, authenticated;
