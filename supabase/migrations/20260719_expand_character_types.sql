alter table public.characters
  drop constraint if exists characters_character_type_check;

alter table public.characters
  add constraint characters_character_type_check
  check (
    character_type in (
      'sprout',
      'slime',
      'robot',
      'hero',
      'warrior',
      'knight',
      'mage',
      'cleric',
      'thief',
      'archer',
      'monk',
      'merchant',
      'bard',
      'bandit',
      'enemy_soldier',
      'assassin',
      'dark_mage',
      'berserker',
      'fallen_knight',
      'heretic_priest',
      'bounty_hunter',
      'cultist',
      'rival_hero',
      'homunculus',
      'controlled_soldier',
      'swordmaster',
      'corrupt_merchant',
      'general'
    )
  );
