/*
 * バッジと，ボス戦の結果の記録．
 */

/*
 * ---------- バッジ ----------
 * バッジは，本人が有効にした時だけ，推測できない文字列（token）の URL で誰でも見られる画像として出す．
 * token が null の時は出さない．作り直すと，前の URL は使えなくなる．
 * - user_profiles.party_badge_token：キャラクター全員を並べた「パーティーのカード」
 * - characters.badge_token：キャラクター1体の小さいバッジ
 */
alter table public.user_profiles
  add column party_badge_token text;

alter table public.user_profiles
  add constraint user_profiles_party_badge_token_key unique (party_badge_token);

alter table public.characters
  add column badge_token text;

alter table public.characters
  add constraint characters_badge_token_key unique (badge_token);

/*
 * ---------- ボス戦の結果（アプリの改善のための記録） ----------
 * 勝ち負けを含めて，挑んだたびに1行残す．ボスや★ごとの勝率を見て，難しさを調整するために使う．
 * 「分析に使わない」を選んだ人のものは残さず，選んだ時に消す．
 * パーティーは，キャラクターの種類・レベル・役割・助っ人かどうか・付けている装備の数だけを残す．
 */
create table public.battle_results (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  boss_id text not null,
  star integer not null,
  is_win boolean not null,
  -- 時間切れで負けた
  is_timeout boolean not null,
  rounds integer not null,
  party jsonb not null,
  created_at timestamp with time zone default now() not null,

  constraint battle_results_pkey primary key (id),
  constraint battle_results_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade,
  constraint battle_results_star_check check (star between 1 and 5)
);

create index battle_results_boss_star_idx
  on public.battle_results (boss_id, star);

create index battle_results_user_id_idx on public.battle_results (user_id);

grant select, insert, update, delete on public.battle_results to service_role;

-- RLS を有効にし，ポリシーは作らない（ブラウザからは読み書きできない）
alter table public.battle_results enable row level security;
