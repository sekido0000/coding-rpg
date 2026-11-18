/*
 * ワールドを横長の2列から，縦にも広がる形（最初は4列）に変える．
 *
 * 列の番号は，掲示板の列を 0 として，上の列はマイナス，下の列はプラスで数える．
 * これまでの 0（奥）と 1（手前）は，そのまま真ん中の2列になる．
 */

alter table public.user_buildings
  drop constraint user_buildings_lot_row_check;

alter table public.user_buildings
  add constraint user_buildings_lot_row_check
  check (lot_row between -20 and 20);

/*
 * 家・掲示板・雑貨店・ボス戦の入口・工房の場所を消し，新しい形で並べ直す．
 * これらは建築モードを使った時に，横長だった頃の並びのまま保存されている．
 * 残っていると，その場所に合わせてワールドが横長のままになるため．
 * 建てた建物（カフェなど）の場所は残す．
 */
delete from public.user_buildings
where building_id in ('quest_board', 'general_store', 'dungeon_gate', 'workshop')
  or building_id like 'house:%';
