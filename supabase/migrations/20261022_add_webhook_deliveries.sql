/*
 * 処理済みのGitHub Webhook通知を記録する．
 * GitHubは同じ通知を再送することがあるため，
 * 通知ごとのID（X-GitHub-Deliveryヘッダー）で二重処理を防ぐ．
 */
create table if not exists public.webhook_deliveries (
  delivery_id text primary key,
  event text not null,
  received_at timestamptz not null default now()
);

/*
 * サーバー（service role）からのみ読み書きする．
 * ポリシーを作らないことで，ブラウザからは一切アクセスできない．
 */
alter table public.webhook_deliveries
  enable row level security;
