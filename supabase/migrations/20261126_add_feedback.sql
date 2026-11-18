/*
 * ご意見（アプリの中のフォームから送られたもの）．
 *
 * ログインしている人だけが送れる．書き込みはサーバー（service_role）からだけ行い，
 * 送った人を含め，ブラウザからは読めないようにする（運営者が Supabase の画面で読む）．
 */

create table public.feedback (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  -- 種類．bug：不具合，request：要望，impression：感想，other：その他
  kind text not null,
  message text not null,
  -- 送った時に開いていたページ（何の話か分かるように）
  page text,
  created_at timestamp with time zone default now() not null,

  constraint feedback_pkey primary key (id),
  constraint feedback_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint feedback_kind_check
    check (kind in ('bug', 'request', 'impression', 'other')),
  constraint feedback_message_check
    check (char_length(message) between 1 and 2000),
  constraint feedback_page_check
    check (page is null or char_length(page) <= 200)
);

create index feedback_user_id_created_at_idx
  on public.feedback (user_id, created_at);

grant select, insert, update, delete on public.feedback to service_role;

-- RLS を有効にし，ポリシーは作らない（ブラウザからは読み書きできない）
alter table public.feedback enable row level security;
