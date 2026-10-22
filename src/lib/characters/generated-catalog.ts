/* このファイルは scripts/generate-character-svgs.mjs により自動生成されます． */

import type {
  CharacterCategory,
  CharacterType,
} from "@/lib/characters/generated-types";

export type GeneratedEvolutionStage = {
  level: number;
  name: string;
  imagePath: string;
  description: string;
};

export type GeneratedCharacterDefinition = {
  type: CharacterType;
  category: CharacterCategory;
  name: string;
  description: string;
  evolutions: GeneratedEvolutionStage[];
};

export const CATEGORY_LABELS: Record<
  CharacterCategory,
  string
> = {
  "creature": "モンスター・機械",
  "ally": "味方職業",
  "enemy": "人型敵キャラクター"
};

export const GENERATED_CHARACTER_CATALOG: Record<
  CharacterType,
  GeneratedCharacterDefinition
> = {
  "sprout": {
    type: "sprout",
    category: "creature",
    name: "モリノメ",
    description: "森の魔力から生まれ、季節とともに姿を変える小さな植物の精霊",
    evolutions: [
          {
                "level": 1,
                "name": "モリダネ",
                "imagePath": "/characters/sprout/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "モリノメ",
                "imagePath": "/characters/sprout/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "ワカバネ",
                "imagePath": "/characters/sprout/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "ハナモリ",
                "imagePath": "/characters/sprout/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "セカイジュ",
                "imagePath": "/characters/sprout/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "slime": {
    type: "slime",
    category: "creature",
    name: "スライム",
    description: "周囲の魔力や感情を取り込み、さまざまな姿に変化する不思議な粘体生物",
    evolutions: [
          {
                "level": 1,
                "name": "ベビースライム",
                "imagePath": "/characters/slime/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "スライム",
                "imagePath": "/characters/slime/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "ビッグスライム",
                "imagePath": "/characters/slime/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "キングスライム",
                "imagePath": "/characters/slime/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "スタースライム",
                "imagePath": "/characters/slime/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "robot": {
    type: "robot",
    category: "creature",
    name: "ゴーレム",
    description: "失われた文明によって造られ、今も未知の命令に従って動き続ける古代機械",
    evolutions: [
          {
                "level": 1,
                "name": "コア",
                "imagePath": "/characters/robot/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "ミニボット",
                "imagePath": "/characters/robot/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "ワークボット",
                "imagePath": "/characters/robot/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "ガードメカ",
                "imagePath": "/characters/robot/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "コードタイタン",
                "imagePath": "/characters/robot/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "hero": {
    type: "hero",
    category: "ally",
    name: "勇者",
    description: "使命を背負い，仲間を導く主人公型キャラクター",
    evolutions: [
          {
                "level": 1,
                "name": "旅立ちの勇者",
                "imagePath": "/characters/hero/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "青き勇者",
                "imagePath": "/characters/hero/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "聖剣の勇者",
                "imagePath": "/characters/hero/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "王国の勇者",
                "imagePath": "/characters/hero/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "暁の英雄",
                "imagePath": "/characters/hero/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "warrior": {
    type: "warrior",
    category: "ally",
    name: "戦士",
    description: "剣や斧で前線を切り開く近接戦闘の専門家",
    evolutions: [
          {
                "level": 1,
                "name": "駆け出し戦士",
                "imagePath": "/characters/warrior/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "重剣戦士",
                "imagePath": "/characters/warrior/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "炎刃戦士",
                "imagePath": "/characters/warrior/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "百戦の戦士",
                "imagePath": "/characters/warrior/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "業火の覇者",
                "imagePath": "/characters/warrior/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "knight": {
    type: "knight",
    category: "ally",
    name: "騎士",
    description: "重装備と盾で仲間を守る防御役",
    evolutions: [
          {
                "level": 1,
                "name": "従騎士",
                "imagePath": "/characters/knight/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "鉄壁の騎士",
                "imagePath": "/characters/knight/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "白銀騎士",
                "imagePath": "/characters/knight/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "王国守護騎士",
                "imagePath": "/characters/knight/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "聖盾の騎士王",
                "imagePath": "/characters/knight/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "mage": {
    type: "mage",
    category: "ally",
    name: "魔法使い",
    description: "攻撃魔法と補助魔法を操る術師",
    evolutions: [
          {
                "level": 1,
                "name": "見習い魔術師",
                "imagePath": "/characters/mage/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "紫晶の術師",
                "imagePath": "/characters/mage/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "魔導研究者",
                "imagePath": "/characters/mage/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "大魔導師",
                "imagePath": "/characters/mage/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "星界の賢者",
                "imagePath": "/characters/mage/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "cleric": {
    type: "cleric",
    category: "ally",
    name: "僧侶",
    description: "回復と浄化で仲間を支える聖職者",
    evolutions: [
          {
                "level": 1,
                "name": "見習い僧侶",
                "imagePath": "/characters/cleric/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "癒やし手",
                "imagePath": "/characters/cleric/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "聖印の司祭",
                "imagePath": "/characters/cleric/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "大司教",
                "imagePath": "/characters/cleric/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "奇跡の聖者",
                "imagePath": "/characters/cleric/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "thief": {
    type: "thief",
    category: "ally",
    name: "盗賊",
    description: "素早さと罠解除を得意とする技巧派",
    evolutions: [
          {
                "level": 1,
                "name": "駆け出し盗賊",
                "imagePath": "/characters/thief/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "影歩き",
                "imagePath": "/characters/thief/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "双刃の盗賊",
                "imagePath": "/characters/thief/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "怪盗",
                "imagePath": "/characters/thief/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "幻影の支配者",
                "imagePath": "/characters/thief/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "archer": {
    type: "archer",
    category: "ally",
    name: "弓使い",
    description: "弓による遠距離攻撃を得意とする射手",
    evolutions: [
          {
                "level": 1,
                "name": "森の射手",
                "imagePath": "/characters/archer/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "狩人",
                "imagePath": "/characters/archer/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "長弓の名手",
                "imagePath": "/characters/archer/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "鷹眼の射手",
                "imagePath": "/characters/archer/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "風神の弓聖",
                "imagePath": "/characters/archer/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "monk": {
    type: "monk",
    category: "ally",
    name: "武闘家",
    description: "拳と蹴りで戦う俊敏な肉体派",
    evolutions: [
          {
                "level": 1,
                "name": "修行僧",
                "imagePath": "/characters/monk/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "鉄拳闘士",
                "imagePath": "/characters/monk/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "気功拳士",
                "imagePath": "/characters/monk/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "武神の弟子",
                "imagePath": "/characters/monk/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "天地無双",
                "imagePath": "/characters/monk/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "merchant": {
    type: "merchant",
    category: "ally",
    name: "商人",
    description: "売買と交渉で資金と道具を集める支援役",
    evolutions: [
          {
                "level": 1,
                "name": "旅商人",
                "imagePath": "/characters/merchant/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "目利き商人",
                "imagePath": "/characters/merchant/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "大店の主人",
                "imagePath": "/characters/merchant/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "交易王",
                "imagePath": "/characters/merchant/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "黄金の商神",
                "imagePath": "/characters/merchant/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "bard": {
    type: "bard",
    category: "ally",
    name: "吟遊詩人",
    description: "歌と演奏で仲間を強化する支援役",
    evolutions: [
          {
                "level": 1,
                "name": "旅の楽師",
                "imagePath": "/characters/bard/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "祝祭の奏者",
                "imagePath": "/characters/bard/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "宮廷詩人",
                "imagePath": "/characters/bard/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "英雄譚の歌い手",
                "imagePath": "/characters/bard/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "伝説の吟遊詩人",
                "imagePath": "/characters/bard/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "bandit": {
    type: "bandit",
    category: "enemy",
    name: "盗賊・山賊",
    description: "集団で襲い，金品を奪う荒くれ者",
    evolutions: [
          {
                "level": 1,
                "name": "ならず者",
                "imagePath": "/characters/bandit/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "山賊",
                "imagePath": "/characters/bandit/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "山賊頭",
                "imagePath": "/characters/bandit/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "略奪王",
                "imagePath": "/characters/bandit/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "荒野の暴君",
                "imagePath": "/characters/bandit/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "enemy_soldier": {
    type: "enemy_soldier",
    category: "enemy",
    name: "敵国の兵士",
    description: "統率された装備で戦う敵軍の兵士",
    evolutions: [
          {
                "level": 1,
                "name": "徴募兵",
                "imagePath": "/characters/enemy_soldier/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "槍兵",
                "imagePath": "/characters/enemy_soldier/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "近衛兵",
                "imagePath": "/characters/enemy_soldier/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "精鋭隊長",
                "imagePath": "/characters/enemy_soldier/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "帝国の戦鬼",
                "imagePath": "/characters/enemy_soldier/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "assassin": {
    type: "assassin",
    category: "enemy",
    name: "暗殺者",
    description: "毒と奇襲で標的を仕留める素早い敵",
    evolutions: [
          {
                "level": 1,
                "name": "密偵",
                "imagePath": "/characters/assassin/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "毒刃",
                "imagePath": "/characters/assassin/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "夜陰の暗殺者",
                "imagePath": "/characters/assassin/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "死影",
                "imagePath": "/characters/assassin/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "無音の死神",
                "imagePath": "/characters/assassin/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "dark_mage": {
    type: "dark_mage",
    category: "enemy",
    name: "闇の魔法使い",
    description: "呪いと召喚魔法で後方から攻撃する術師",
    evolutions: [
          {
                "level": 1,
                "name": "呪術師",
                "imagePath": "/characters/dark_mage/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "闇術師",
                "imagePath": "/characters/dark_mage/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "死霊魔導師",
                "imagePath": "/characters/dark_mage/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "奈落の賢者",
                "imagePath": "/characters/dark_mage/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "虚無の大魔王",
                "imagePath": "/characters/dark_mage/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "berserker": {
    type: "berserker",
    category: "enemy",
    name: "狂戦士",
    description: "防御を捨て，猛烈な連続攻撃を仕掛ける敵",
    evolutions: [
          {
                "level": 1,
                "name": "荒くれ戦士",
                "imagePath": "/characters/berserker/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "血塗れの戦士",
                "imagePath": "/characters/berserker/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "狂乱の斧兵",
                "imagePath": "/characters/berserker/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "破城の狂戦士",
                "imagePath": "/characters/berserker/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "終末の破壊者",
                "imagePath": "/characters/berserker/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "fallen_knight": {
    type: "fallen_knight",
    category: "enemy",
    name: "堕落した騎士",
    description: "かつての誇りを失い，呪われた鎧をまとう強敵",
    evolutions: [
          {
                "level": 1,
                "name": "失意の騎士",
                "imagePath": "/characters/fallen_knight/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "黒鉄騎士",
                "imagePath": "/characters/fallen_knight/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "呪盾の騎士",
                "imagePath": "/characters/fallen_knight/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "堕英雄",
                "imagePath": "/characters/fallen_knight/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "黒炎の騎士王",
                "imagePath": "/characters/fallen_knight/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "heretic_priest": {
    type: "heretic_priest",
    category: "enemy",
    name: "異端の司祭",
    description: "洗脳と死者の蘇生を行う邪悪な聖職者",
    evolutions: [
          {
                "level": 1,
                "name": "背教者",
                "imagePath": "/characters/heretic_priest/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "異端司祭",
                "imagePath": "/characters/heretic_priest/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "死者の導師",
                "imagePath": "/characters/heretic_priest/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "邪教大司教",
                "imagePath": "/characters/heretic_priest/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "反魂の教皇",
                "imagePath": "/characters/heretic_priest/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "bounty_hunter": {
    type: "bounty_hunter",
    category: "enemy",
    name: "賞金稼ぎ",
    description: "罠と特殊武器を使い，標的を追い詰める敵",
    evolutions: [
          {
                "level": 1,
                "name": "追跡者",
                "imagePath": "/characters/bounty_hunter/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "罠師",
                "imagePath": "/characters/bounty_hunter/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "賞金稼ぎ",
                "imagePath": "/characters/bounty_hunter/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "首狩りの狩人",
                "imagePath": "/characters/bounty_hunter/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "逃れられぬ執行者",
                "imagePath": "/characters/bounty_hunter/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "cultist": {
    type: "cultist",
    category: "enemy",
    name: "邪教徒",
    description: "儀式と集団魔法で怪物を呼び出す信奉者",
    evolutions: [
          {
                "level": 1,
                "name": "信徒",
                "imagePath": "/characters/cultist/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "血盟の信徒",
                "imagePath": "/characters/cultist/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "儀式司祭",
                "imagePath": "/characters/cultist/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "深淵の召喚士",
                "imagePath": "/characters/cultist/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "邪神の代行者",
                "imagePath": "/characters/cultist/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "rival_hero": {
    type: "rival_hero",
    category: "enemy",
    name: "敵対する勇者",
    description: "異なる正義を掲げ，主人公の前に立ちはだかるライバル",
    evolutions: [
          {
                "level": 1,
                "name": "異端の勇者",
                "imagePath": "/characters/rival_hero/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "紅き勇者",
                "imagePath": "/characters/rival_hero/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "断罪の剣士",
                "imagePath": "/characters/rival_hero/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "孤高の英雄",
                "imagePath": "/characters/rival_hero/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "終焉を選ぶ勇者",
                "imagePath": "/characters/rival_hero/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "homunculus": {
    type: "homunculus",
    category: "enemy",
    name: "人造人間",
    description: "感情を持たず，命令どおりに戦う人工兵器",
    evolutions: [
          {
                "level": 1,
                "name": "試作体",
                "imagePath": "/characters/homunculus/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "戦闘人形",
                "imagePath": "/characters/homunculus/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "制圧型人造人間",
                "imagePath": "/characters/homunculus/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "完全戦闘体",
                "imagePath": "/characters/homunculus/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "零式殲滅機関",
                "imagePath": "/characters/homunculus/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "controlled_soldier": {
    type: "controlled_soldier",
    category: "enemy",
    name: "操られた兵士",
    description: "魔力の糸に操られ，意思に反して戦う兵士",
    evolutions: [
          {
                "level": 1,
                "name": "操られた村人",
                "imagePath": "/characters/controlled_soldier/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "操られた兵士",
                "imagePath": "/characters/controlled_soldier/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "魔糸の衛兵",
                "imagePath": "/characters/controlled_soldier/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "傀儡隊長",
                "imagePath": "/characters/controlled_soldier/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "完全支配の将",
                "imagePath": "/characters/controlled_soldier/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "swordmaster": {
    type: "swordmaster",
    category: "enemy",
    name: "剣豪",
    description: "一対一の勝負を好む高技量の剣士",
    evolutions: [
          {
                "level": 1,
                "name": "流浪の剣士",
                "imagePath": "/characters/swordmaster/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "居合の達人",
                "imagePath": "/characters/swordmaster/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "無双剣士",
                "imagePath": "/characters/swordmaster/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "剣聖",
                "imagePath": "/characters/swordmaster/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "一閃の修羅",
                "imagePath": "/characters/swordmaster/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "corrupt_merchant": {
    type: "corrupt_merchant",
    category: "enemy",
    name: "悪徳商人",
    description: "金と権力で傭兵を動かす策略家",
    evolutions: [
          {
                "level": 1,
                "name": "悪徳商人",
                "imagePath": "/characters/corrupt_merchant/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "闇商会の主",
                "imagePath": "/characters/corrupt_merchant/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "武器商人",
                "imagePath": "/characters/corrupt_merchant/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "財界の支配者",
                "imagePath": "/characters/corrupt_merchant/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "黄金都市の暴君",
                "imagePath": "/characters/corrupt_merchant/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  },
  "general": {
    type: "general",
    category: "enemy",
    name: "宮廷将軍",
    description: "部下を指揮しながら戦う軍勢のボス",
    evolutions: [
          {
                "level": 1,
                "name": "小隊長",
                "imagePath": "/characters/general/level-1.svg",
                "description": "基本装備で冒険を始めた姿"
          },
          {
                "level": 2,
                "name": "百人隊長",
                "imagePath": "/characters/general/level-2.svg",
                "description": "新しい装備や装飾を身につけた姿"
          },
          {
                "level": 3,
                "name": "近衛将校",
                "imagePath": "/characters/general/level-3.svg",
                "description": "主武器が強化され，役割が明確になった姿"
          },
          {
                "level": 4,
                "name": "帝国将軍",
                "imagePath": "/characters/general/level-4.svg",
                "description": "上位装備と専用エフェクトを獲得した姿"
          },
          {
                "level": 5,
                "name": "覇道の大元帥",
                "imagePath": "/characters/general/level-5.svg",
                "description": "最強装備と大規模なエフェクトをまとった最終形態"
          }
    ],
  }
};
