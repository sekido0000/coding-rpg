/*
 * キャラクターの性格を3つから8つに増やす．
 *
 * これまでの cheerful・calm・serious は，それぞれ
 * 熱血・のんびり・まじめ として引き継ぐので，今あるデータは書き換えない．
 */
alter table public.characters
  drop constraint if exists characters_personality_check;

alter table public.characters
  add constraint characters_personality_check
  check (
    personality in (
      'cheerful',
      'calm',
      'serious',
      'tsundere',
      'timid',
      'bossy',
      'jester',
      'cool'
    )
  );
