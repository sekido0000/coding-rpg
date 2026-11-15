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
                "description": "土の中で目覚めを待つ，小さな森の種"
          },
          {
                "level": 2,
                "name": "モリノメ",
                "imagePath": "/characters/sprout/level-2.svg",
                "description": "双葉を広げ，初めて森の光を浴びた姿"
          },
          {
                "level": 3,
                "name": "ワカバネ",
                "imagePath": "/characters/sprout/level-3.svg",
                "description": "若葉の羽で風に乗り，森を見回る姿"
          },
          {
                "level": 4,
                "name": "ハナモリ",
                "imagePath": "/characters/sprout/level-4.svg",
                "description": "花をまとい，森の命を癒やす守り手"
          },
          {
                "level": 5,
                "name": "セカイジュ",
                "imagePath": "/characters/sprout/level-5.svg",
                "description": "大地に根を張り，世界を見守る大樹の精霊"
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
                "description": "生まれたばかりで，ぷるぷる震える小さな粘体"
          },
          {
                "level": 2,
                "name": "スライム",
                "imagePath": "/characters/slime/level-2.svg",
                "description": "魔力を取り込み，元気に跳ね回る姿"
          },
          {
                "level": 3,
                "name": "ビッグスライム",
                "imagePath": "/characters/slime/level-3.svg",
                "description": "仲間を取り込んで大きく育った，弾む巨体"
          },
          {
                "level": 4,
                "name": "キングスライム",
                "imagePath": "/characters/slime/level-4.svg",
                "description": "王冠を戴き，スライムたちを従える王"
          },
          {
                "level": 5,
                "name": "スタースライム",
                "imagePath": "/characters/slime/level-5.svg",
                "description": "星の魔力を宿し，夜空のように輝く姿"
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
                "name": "ペブルゴーレム",
                "imagePath": "/characters/robot/level-1.svg",
                "description": "小石が寄り集まって動き出した，小さな古代機械"
          },
          {
                "level": 2,
                "name": "ストーンゴーレム",
                "imagePath": "/characters/robot/level-2.svg",
                "description": "岩の体を得て，命令どおりに働く番人"
          },
          {
                "level": 3,
                "name": "ルーンゴーレム",
                "imagePath": "/characters/robot/level-3.svg",
                "description": "体に刻まれたルーンが光り，力を増した姿"
          },
          {
                "level": 4,
                "name": "ガイアゴーレム",
                "imagePath": "/characters/robot/level-4.svg",
                "description": "大地の力を引き出し，山のように立つ姿"
          },
          {
                "level": 5,
                "name": "タイタンゴーレム",
                "imagePath": "/characters/robot/level-5.svg",
                "description": "失われた文明の全力を宿す，巨神の機械"
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
                "description": "故郷を出て，使命の旅を始めたばかりの姿"
          },
          {
                "level": 2,
                "name": "青き勇者",
                "imagePath": "/characters/hero/level-2.svg",
                "description": "青いマントをなびかせ，仲間を率い始めた姿"
          },
          {
                "level": 3,
                "name": "聖剣の勇者",
                "imagePath": "/characters/hero/level-3.svg",
                "description": "聖剣に選ばれ，光の力を振るう勇者"
          },
          {
                "level": 4,
                "name": "王国の勇者",
                "imagePath": "/characters/hero/level-4.svg",
                "description": "王国中に名が知られ，人々の希望となった姿"
          },
          {
                "level": 5,
                "name": "暁の英雄",
                "imagePath": "/characters/hero/level-5.svg",
                "description": "夜明けの光をまとい，世界を救う英雄"
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
                "description": "使い慣れた斧で，前線に立ち始めた戦士"
          },
          {
                "level": 2,
                "name": "重剣戦士",
                "imagePath": "/characters/warrior/level-2.svg",
                "description": "重い武器を軽々と振るう，力自慢の戦士"
          },
          {
                "level": 3,
                "name": "炎刃戦士",
                "imagePath": "/characters/warrior/level-3.svg",
                "description": "刃に炎を宿し，敵陣を焼き払う戦士"
          },
          {
                "level": 4,
                "name": "百戦の戦士",
                "imagePath": "/characters/warrior/level-4.svg",
                "description": "百の戦いを生き抜いた，歴戦の強者"
          },
          {
                "level": 5,
                "name": "業火の覇者",
                "imagePath": "/characters/warrior/level-5.svg",
                "description": "業火をまとい，戦場を支配する覇者"
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
                "description": "騎士に仕えながら，守る心を学ぶ見習い"
          },
          {
                "level": 2,
                "name": "鉄壁の騎士",
                "imagePath": "/characters/knight/level-2.svg",
                "description": "どんな攻撃も通さない盾を持つ騎士"
          },
          {
                "level": 3,
                "name": "白銀騎士",
                "imagePath": "/characters/knight/level-3.svg",
                "description": "白銀の鎧に身を包んだ，誇り高き騎士"
          },
          {
                "level": 4,
                "name": "王国守護騎士",
                "imagePath": "/characters/knight/level-4.svg",
                "description": "王国の盾として，城と民を守る騎士"
          },
          {
                "level": 5,
                "name": "聖盾の騎士王",
                "imagePath": "/characters/knight/level-5.svg",
                "description": "聖なる盾で仲間すべてを守り抜く，騎士の王"
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
                "description": "魔導書を抱え，初めての呪文を練習する術師"
          },
          {
                "level": 2,
                "name": "紫晶の術師",
                "imagePath": "/characters/mage/level-2.svg",
                "description": "紫の水晶で魔力を操れるようになった術師"
          },
          {
                "level": 3,
                "name": "魔導研究者",
                "imagePath": "/characters/mage/level-3.svg",
                "description": "魔法の仕組みを解き明かす，研究熱心な術師"
          },
          {
                "level": 4,
                "name": "大魔導師",
                "imagePath": "/characters/mage/level-4.svg",
                "description": "数々の大魔法を使いこなす，魔導の達人"
          },
          {
                "level": 5,
                "name": "星界の賢者",
                "imagePath": "/characters/mage/level-5.svg",
                "description": "星々の魔力を操り，世界の理を知る賢者"
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
                "description": "祈りを学び，小さな傷を癒やす見習い"
          },
          {
                "level": 2,
                "name": "癒やし手",
                "imagePath": "/characters/cleric/level-2.svg",
                "description": "仲間の傷を癒やす，頼れる治療の担い手"
          },
          {
                "level": 3,
                "name": "聖印の司祭",
                "imagePath": "/characters/cleric/level-3.svg",
                "description": "聖印の力で，邪悪を退ける司祭"
          },
          {
                "level": 4,
                "name": "大司教",
                "imagePath": "/characters/cleric/level-4.svg",
                "description": "多くの信徒を導く，教会の大司教"
          },
          {
                "level": 5,
                "name": "奇跡の聖者",
                "imagePath": "/characters/cleric/level-5.svg",
                "description": "祈りで奇跡を起こすと語られる聖者"
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
                "description": "身軽さを武器に，罠を外し始めた盗賊"
          },
          {
                "level": 2,
                "name": "影歩き",
                "imagePath": "/characters/thief/level-2.svg",
                "description": "物音を立てず，影から影へ渡る盗賊"
          },
          {
                "level": 3,
                "name": "双刃の盗賊",
                "imagePath": "/characters/thief/level-3.svg",
                "description": "二本の短剣を自在に操る，腕利きの盗賊"
          },
          {
                "level": 4,
                "name": "怪盗",
                "imagePath": "/characters/thief/level-4.svg",
                "description": "予告状を出し，狙った獲物は逃さない怪盗"
          },
          {
                "level": 5,
                "name": "幻影の支配者",
                "imagePath": "/characters/thief/level-5.svg",
                "description": "残像で敵を惑わす，影の世界の支配者"
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
                "description": "森で狩りを覚えた，若い射手"
          },
          {
                "level": 2,
                "name": "狩人",
                "imagePath": "/characters/archer/level-2.svg",
                "description": "獲物の足跡を読み，一矢で仕留める狩人"
          },
          {
                "level": 3,
                "name": "長弓の名手",
                "imagePath": "/characters/archer/level-3.svg",
                "description": "長弓で遠くの的を射抜く名手"
          },
          {
                "level": 4,
                "name": "鷹眼の射手",
                "imagePath": "/characters/archer/level-4.svg",
                "description": "鷹の目で戦場を見渡し，急所を射る射手"
          },
          {
                "level": 5,
                "name": "風神の弓聖",
                "imagePath": "/characters/archer/level-5.svg",
                "description": "風を味方につけ，矢の嵐を放つ弓の聖者"
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
                "description": "山で修行を積み，拳を鍛え始めた僧"
          },
          {
                "level": 2,
                "name": "鉄拳闘士",
                "imagePath": "/characters/monk/level-2.svg",
                "description": "鉄のような拳で，岩をも砕く闘士"
          },
          {
                "level": 3,
                "name": "気功拳士",
                "imagePath": "/characters/monk/level-3.svg",
                "description": "気を練り上げ，拳に込めて放つ拳士"
          },
          {
                "level": 4,
                "name": "武神の弟子",
                "imagePath": "/characters/monk/level-4.svg",
                "description": "武神に認められ，奥義を授かった弟子"
          },
          {
                "level": 5,
                "name": "天地無双",
                "imagePath": "/characters/monk/level-5.svg",
                "description": "天地に並ぶ者なしとうたわれる，拳の極み"
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
                "description": "荷物を背負い，町から町へ渡り歩く商人"
          },
          {
                "level": 2,
                "name": "目利き商人",
                "imagePath": "/characters/merchant/level-2.svg",
                "description": "品物の良し悪しを見抜く，確かな目を持つ商人"
          },
          {
                "level": 3,
                "name": "大店の主人",
                "imagePath": "/characters/merchant/level-3.svg",
                "description": "大きな店を構え，町の商いを支える主人"
          },
          {
                "level": 4,
                "name": "交易王",
                "imagePath": "/characters/merchant/level-4.svg",
                "description": "国を越えて品を運ぶ，交易の王"
          },
          {
                "level": 5,
                "name": "黄金の商神",
                "imagePath": "/characters/merchant/level-5.svg",
                "description": "触れたものを黄金に変えると噂される，商いの神"
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
                "description": "リュートを抱えて旅をする，若い楽師"
          },
          {
                "level": 2,
                "name": "祝祭の奏者",
                "imagePath": "/characters/bard/level-2.svg",
                "description": "祭りを盛り上げ，人々を笑顔にする奏者"
          },
          {
                "level": 3,
                "name": "宮廷詩人",
                "imagePath": "/characters/bard/level-3.svg",
                "description": "王の前で歌うことを許された詩人"
          },
          {
                "level": 4,
                "name": "英雄譚の歌い手",
                "imagePath": "/characters/bard/level-4.svg",
                "description": "英雄たちの物語を歌い継ぐ語り部"
          },
          {
                "level": 5,
                "name": "伝説の吟遊詩人",
                "imagePath": "/characters/bard/level-5.svg",
                "description": "その歌声で仲間に力を与える，伝説の詩人"
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
                "description": "こん棒片手に町外れをうろつく荒くれ者"
          },
          {
                "level": 2,
                "name": "山賊",
                "imagePath": "/characters/bandit/level-2.svg",
                "description": "山道で旅人を待ち伏せる，荒っぽい山賊"
          },
          {
                "level": 3,
                "name": "山賊頭",
                "imagePath": "/characters/bandit/level-3.svg",
                "description": "手下を束ね，砦を構える山賊の頭"
          },
          {
                "level": 4,
                "name": "略奪王",
                "imagePath": "/characters/bandit/level-4.svg",
                "description": "いくつもの村を襲い，財宝を奪った略奪の王"
          },
          {
                "level": 5,
                "name": "荒野の暴君",
                "imagePath": "/characters/bandit/level-5.svg",
                "description": "荒野一帯を力で支配する暴君"
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
                "description": "集められたばかりで，槍の扱いもぎこちない兵士"
          },
          {
                "level": 2,
                "name": "槍兵",
                "imagePath": "/characters/enemy_soldier/level-2.svg",
                "description": "隊列を組み，槍で前線を守る兵士"
          },
          {
                "level": 3,
                "name": "近衛兵",
                "imagePath": "/characters/enemy_soldier/level-3.svg",
                "description": "選び抜かれ，城を守る近衛の兵"
          },
          {
                "level": 4,
                "name": "精鋭隊長",
                "imagePath": "/characters/enemy_soldier/level-4.svg",
                "description": "精鋭部隊を率いる，冷静な隊長"
          },
          {
                "level": 5,
                "name": "帝国の戦鬼",
                "imagePath": "/characters/enemy_soldier/level-5.svg",
                "description": "戦場で恐れられる，帝国最強の兵"
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
                "description": "敵地に潜り込み，情報を集める密偵"
          },
          {
                "level": 2,
                "name": "毒刃",
                "imagePath": "/characters/assassin/level-2.svg",
                "description": "刃に毒を塗り，静かに標的を狙う刺客"
          },
          {
                "level": 3,
                "name": "夜陰の暗殺者",
                "imagePath": "/characters/assassin/level-3.svg",
                "description": "夜の闇に溶け込み，音もなく近づく暗殺者"
          },
          {
                "level": 4,
                "name": "死影",
                "imagePath": "/characters/assassin/level-4.svg",
                "description": "姿を見た者はいないと言われる，死の影"
          },
          {
                "level": 5,
                "name": "無音の死神",
                "imagePath": "/characters/assassin/level-5.svg",
                "description": "足音ひとつ立てずに命を刈り取る死神"
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
                "description": "小さな呪いを操る，闇の道に入った術師"
          },
          {
                "level": 2,
                "name": "闇術師",
                "imagePath": "/characters/dark_mage/level-2.svg",
                "description": "闇の魔力で敵を苦しめる術師"
          },
          {
                "level": 3,
                "name": "死霊魔導師",
                "imagePath": "/characters/dark_mage/level-3.svg",
                "description": "死霊を呼び出し，従わせる魔導師"
          },
          {
                "level": 4,
                "name": "奈落の賢者",
                "imagePath": "/characters/dark_mage/level-4.svg",
                "description": "奈落の底の知識を得た，闇の賢者"
          },
          {
                "level": 5,
                "name": "虚無の大魔王",
                "imagePath": "/characters/dark_mage/level-5.svg",
                "description": "すべてを無に帰す力を持つ，闇の大魔王"
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
                "description": "力任せに斧を振り回す荒くれ者"
          },
          {
                "level": 2,
                "name": "血塗れの戦士",
                "imagePath": "/characters/berserker/level-2.svg",
                "description": "傷を負うほど強くなる，血塗れの戦士"
          },
          {
                "level": 3,
                "name": "狂乱の斧兵",
                "imagePath": "/characters/berserker/level-3.svg",
                "description": "怒りに我を忘れ，斧を振るい続ける兵"
          },
          {
                "level": 4,
                "name": "破城の狂戦士",
                "imagePath": "/characters/berserker/level-4.svg",
                "description": "城門すら打ち砕く，破壊の狂戦士"
          },
          {
                "level": 5,
                "name": "終末の破壊者",
                "imagePath": "/characters/berserker/level-5.svg",
                "description": "すべてを壊し尽くす，終末の化身"
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
                "description": "主を失い，誇りを見失った騎士"
          },
          {
                "level": 2,
                "name": "黒鉄騎士",
                "imagePath": "/characters/fallen_knight/level-2.svg",
                "description": "黒く染まった鉄の鎧をまとう騎士"
          },
          {
                "level": 3,
                "name": "呪盾の騎士",
                "imagePath": "/characters/fallen_knight/level-3.svg",
                "description": "呪われた盾で敵の力を奪う騎士"
          },
          {
                "level": 4,
                "name": "堕英雄",
                "imagePath": "/characters/fallen_knight/level-4.svg",
                "description": "かつて英雄と呼ばれ，闇に落ちた騎士"
          },
          {
                "level": 5,
                "name": "黒炎の騎士王",
                "imagePath": "/characters/fallen_knight/level-5.svg",
                "description": "黒い炎をまとい，闇の軍勢を率いる騎士の王"
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
                "description": "教えに背き，教会を去った元聖職者"
          },
          {
                "level": 2,
                "name": "異端司祭",
                "imagePath": "/characters/heretic_priest/level-2.svg",
                "description": "禁じられた教えを広める司祭"
          },
          {
                "level": 3,
                "name": "死者の導師",
                "imagePath": "/characters/heretic_priest/level-3.svg",
                "description": "死者を呼び起こし，導く邪悪な導師"
          },
          {
                "level": 4,
                "name": "邪教大司教",
                "imagePath": "/characters/heretic_priest/level-4.svg",
                "description": "邪教の頂点に立ち，信徒を操る大司教"
          },
          {
                "level": 5,
                "name": "反魂の教皇",
                "imagePath": "/characters/heretic_priest/level-5.svg",
                "description": "死者をよみがえらせる禁術を極めた教皇"
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
                "description": "わずかな手がかりから標的を追う者"
          },
          {
                "level": 2,
                "name": "罠師",
                "imagePath": "/characters/bounty_hunter/level-2.svg",
                "description": "罠を仕掛け，標的を待ち構える狩人"
          },
          {
                "level": 3,
                "name": "賞金稼ぎ",
                "imagePath": "/characters/bounty_hunter/level-3.svg",
                "description": "懸賞金のためなら地の果てまで追う者"
          },
          {
                "level": 4,
                "name": "首狩りの狩人",
                "imagePath": "/characters/bounty_hunter/level-4.svg",
                "description": "大物ばかりを狙う，名の知れた狩人"
          },
          {
                "level": 5,
                "name": "逃れられぬ執行者",
                "imagePath": "/characters/bounty_hunter/level-5.svg",
                "description": "狙われたら最後，誰も逃げられない執行者"
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
                "description": "怪しい教えに惹かれ，儀式に加わった信徒"
          },
          {
                "level": 2,
                "name": "血盟の信徒",
                "imagePath": "/characters/cultist/level-2.svg",
                "description": "血の契りを結び，教団に身を捧げた信徒"
          },
          {
                "level": 3,
                "name": "儀式司祭",
                "imagePath": "/characters/cultist/level-3.svg",
                "description": "儀式を取り仕切り，怪しい魔法を操る司祭"
          },
          {
                "level": 4,
                "name": "深淵の召喚士",
                "imagePath": "/characters/cultist/level-4.svg",
                "description": "深淵から怪物を呼び出す召喚士"
          },
          {
                "level": 5,
                "name": "邪神の代行者",
                "imagePath": "/characters/cultist/level-5.svg",
                "description": "邪神の声を聞き，その力を振るう代行者"
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
                "description": "もう一つの正義を信じて旅立った勇者"
          },
          {
                "level": 2,
                "name": "紅き勇者",
                "imagePath": "/characters/rival_hero/level-2.svg",
                "description": "紅いマントをまとい，主人公と剣を交える勇者"
          },
          {
                "level": 3,
                "name": "断罪の剣士",
                "imagePath": "/characters/rival_hero/level-3.svg",
                "description": "悪を許さず，自らの手で裁く剣士"
          },
          {
                "level": 4,
                "name": "孤高の英雄",
                "imagePath": "/characters/rival_hero/level-4.svg",
                "description": "誰とも組まず，一人で戦い抜く英雄"
          },
          {
                "level": 5,
                "name": "終焉を選ぶ勇者",
                "imagePath": "/characters/rival_hero/level-5.svg",
                "description": "世界の終わりこそ救いと信じる，最後の勇者"
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
                "description": "研究所で生み出されたばかりの試作品"
          },
          {
                "level": 2,
                "name": "戦闘人形",
                "imagePath": "/characters/homunculus/level-2.svg",
                "description": "戦うためだけに調整された人形"
          },
          {
                "level": 3,
                "name": "制圧型人造人間",
                "imagePath": "/characters/homunculus/level-3.svg",
                "description": "敵を制圧するための装備を積んだ人造人間"
          },
          {
                "level": 4,
                "name": "完全戦闘体",
                "imagePath": "/characters/homunculus/level-4.svg",
                "description": "すべての戦闘機能を備えた完成体"
          },
          {
                "level": 5,
                "name": "零式殲滅機関",
                "imagePath": "/characters/homunculus/level-5.svg",
                "description": "最終兵器として造られた，殲滅の機械"
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
                "description": "魔力の糸に絡め取られた，ふつうの村人"
          },
          {
                "level": 2,
                "name": "操られた兵士",
                "imagePath": "/characters/controlled_soldier/level-2.svg",
                "description": "意思を奪われ，命令どおりに戦う兵士"
          },
          {
                "level": 3,
                "name": "魔糸の衛兵",
                "imagePath": "/characters/controlled_soldier/level-3.svg",
                "description": "太い魔糸に操られ，門を守る衛兵"
          },
          {
                "level": 4,
                "name": "傀儡隊長",
                "imagePath": "/characters/controlled_soldier/level-4.svg",
                "description": "操られた兵を束ねる，傀儡の隊長"
          },
          {
                "level": 5,
                "name": "完全支配の将",
                "imagePath": "/characters/controlled_soldier/level-5.svg",
                "description": "心まで支配され，軍勢を率いる将"
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
                "description": "強い相手を求めて旅を続ける剣士"
          },
          {
                "level": 2,
                "name": "居合の達人",
                "imagePath": "/characters/swordmaster/level-2.svg",
                "description": "鞘から抜く一瞬で勝負を決める達人"
          },
          {
                "level": 3,
                "name": "無双剣士",
                "imagePath": "/characters/swordmaster/level-3.svg",
                "description": "並み居る剣士を打ち破った，無双の腕前"
          },
          {
                "level": 4,
                "name": "剣聖",
                "imagePath": "/characters/swordmaster/level-4.svg",
                "description": "剣の道を極め，聖と呼ばれる剣士"
          },
          {
                "level": 5,
                "name": "一閃の修羅",
                "imagePath": "/characters/swordmaster/level-5.svg",
                "description": "ただ一閃ですべてを断つ，剣の修羅"
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
                "description": "法の目をかいくぐり，荒稼ぎする商人"
          },
          {
                "level": 2,
                "name": "闇商会の主",
                "imagePath": "/characters/corrupt_merchant/level-2.svg",
                "description": "裏の取引を取り仕切る，闇商会の主"
          },
          {
                "level": 3,
                "name": "武器商人",
                "imagePath": "/characters/corrupt_merchant/level-3.svg",
                "description": "戦を起こして武器を売りさばく商人"
          },
          {
                "level": 4,
                "name": "財界の支配者",
                "imagePath": "/characters/corrupt_merchant/level-4.svg",
                "description": "金の力で国さえ動かす支配者"
          },
          {
                "level": 5,
                "name": "黄金都市の暴君",
                "imagePath": "/characters/corrupt_merchant/level-5.svg",
                "description": "黄金の都を築き，金で人を従える暴君"
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
                "description": "数人の兵を率いて戦う，若い隊長"
          },
          {
                "level": 2,
                "name": "百人隊長",
                "imagePath": "/characters/general/level-2.svg",
                "description": "百人の兵を指揮する，頼れる隊長"
          },
          {
                "level": 3,
                "name": "近衛将校",
                "imagePath": "/characters/general/level-3.svg",
                "description": "王の側に仕え，近衛を率いる将校"
          },
          {
                "level": 4,
                "name": "帝国将軍",
                "imagePath": "/characters/general/level-4.svg",
                "description": "帝国の大軍を動かす将軍"
          },
          {
                "level": 5,
                "name": "覇道の大元帥",
                "imagePath": "/characters/general/level-5.svg",
                "description": "覇道を突き進み，全軍を従える大元帥"
          }
    ],
  }
};
