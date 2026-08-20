// ほしぞら図鑑 — 全系列マスタ（現行正本）
//
// 方針:
//  - 通常／レアモンスターは原則すべて進化可能。進化なしは「設定上の完成個体」のみ
//  - 総数は200体に固定しない（進化系列の成立を優先）
//  - 命名: 第1形=かわいい / 第2形=血統が音で分かる / 最終形=かっこいい
//  - 各系列に concept（一言）と arc（性格の成長）を持たせる
//
// evo:  'lv:16' レベル / 'stone:fire' いし / 'hold:coal' もちもの＋レベルアップ
// rank: 'common' | 'rare' | 'epic' | 'legend'
// role: 'attacker' | 'guard' | 'healer' | 'support' | 'speed' | 'balanced'

export const FAMILIES = [

// ══════════ エリア1: ひかりの のはら ══════════

{ area: 1, type: 'grass', starter: true, motif: '葉と若木',
  concept: 'ひとりが苦手で誰かの足元に隠れる。でも大事なもののためなら根を張って動かない',
  arc: { 初期: 'こわがりで、いつも葉っぱを傘にして隠れている', 未熟: '一人になると動けなくなる',
         中間: '隠れるのをやめ、葉を武器として振れるようになる', 最終: '動かないことで仲間を守る、森の壁' },
  members: [
    { name: 'モコハ', rank: 'rare', role: 'balanced', desc: 'はっぱを かさに して かくれる。だれかの あしもとに ついてくる。', evo: 'lv:17' },
    { name: 'ワカバネ', rank: 'rare', role: 'balanced', desc: 'かくれるのを やめた。はっぱを ふりまわして たたかえる。', evo: 'lv:33' },
    { name: 'ジュランガ', rank: 'rare', role: 'guard', desc: 'せなかに たいじゅを せおう。まもると きめたら いっぽも うごかない。' }
  ]},

{ area: 1, type: 'fire', starter: true, motif: '子獣と炎のたてがみ',
  concept: 'こわいとしっぽの火が小さくなる。でも仲間が危ないときだけ誰より熱くなる',
  arc: { 初期: '元気で負けずぎらい。でも こわいと しっぽの火が ちいさくなる', 未熟: 'すぐ かっとなって 火を出しすぎる',
         中間: '火を つよくするだけでなく、ちょうせつして 仲間を あたためられる', 最終: 'ふだんは しずか。仲間を まもるときだけ 巨大な炎のたてがみを まとう' },
  members: [
    { name: 'ヒノポ', rank: 'rare', role: 'attacker', desc: 'しっぽの さきが ぽっと ともる。こわいと ひが ちいさくなる。', evo: 'lv:17' },
    { name: 'メラガミ', rank: 'rare', role: 'attacker', desc: 'ひの つよさを じぶんで きめられる。さむい なかまを あたためる。', evo: 'lv:33' },
    { name: 'グレンドウ', rank: 'rare', role: 'attacker', desc: 'ふだんは しずか。なかまが あぶないと たてがみが もえあがる。' }
  ]},

{ area: 1, type: 'water', starter: true, motif: '雫と深海',
  concept: 'あたまの雫を落とすと泣きそうになる。やがて雫は海になる',
  arc: { 初期: 'あたまの しずくを たいせつに かかえている', 未熟: 'しずくを おとすと ないてしまう',
         中間: 'しずくを じぶんで つくれると きづく', 最終: 'からだの なかに うみを もつ。しずかで、ふかい' },
  members: [
    { name: 'シズク', rank: 'rare', role: 'guard', desc: 'あたまの しずくを りょうてで かかえている。おとすと ないてしまう。', evo: 'lv:17' },
    { name: 'ミナモリ', rank: 'rare', role: 'guard', desc: 'しずくを じぶんで つくれると きづいた。かわの ながれを よむ。', evo: 'lv:33' },
    { name: 'ワダツラ', rank: 'rare', role: 'guard', desc: 'からだの なかに うみが ある。ねむると なぎ、おきると なみが たつ。' }
  ]},

{ area: 1, type: 'normal', motif: 'うさぎと疾走',
  concept: 'とにかく走りたい。負けると少しふてくされるが、次はもっと速い',
  arc: { 初期: 'じっと していられない', 未熟: 'はやいだけで まがれない',
         中間: 'まがりかたを おぼえる', 最終: 'かぜより はやい。すがたが みえない' },
  members: [
    { name: 'ポフィ', rank: 'common', role: 'speed', desc: 'ふわふわの しっぽで バランスを とる。じっと していられない。', evo: 'lv:19' },
    { name: 'ハネウサ', rank: 'common', role: 'speed', desc: 'まがりかたを おぼえた。のはらを いちばん はやく はしる。', evo: 'lv:38' },
    { name: 'シッソウガ', rank: 'rare', role: 'speed', desc: 'とおりすぎた あと、かぜの おとだけが のこる。' }
  ]},

{ area: 1, type: 'normal', motif: '猫と獅子',
  concept: '寝てばかりの甘えんぼが、群れを呼べる声を手に入れる',
  arc: { 初期: 'いつも まるくなって ねている', 未熟: 'ひとりでは なにも きめられない',
         中間: 'たかい ところから みんなを みまもるように なる', 最終: 'ひとこえで なかまを あつめる。ぐんれの まとめやく' },
  members: [
    { name: 'ニャミィ', rank: 'common', role: 'balanced', desc: 'まるくなって ねている。おなかを みせたら ごきげん。', evo: 'lv:19' },
    { name: 'シマニャン', rank: 'common', role: 'attacker', desc: 'たかい ところから みんなを みまもる。つめが するどい。', evo: 'lv:38' },
    { name: 'ゴウガレン', rank: 'rare', role: 'attacker', desc: 'ひとこえで なかまを よぶ。たてがみが かぜに なびく。' }
  ]},

{ area: 1, type: 'flying', motif: '小鳥と天空',
  concept: '飛べないことがくやしい鳥。空の高さを知ったとき、風になる',
  arc: { 初期: 'まだ うまく とべない', 未熟: 'はねが よわく、すぐ おちる',
         中間: 'かぜに のることを おぼえる', 最終: 'くもの うえを とぶ。かぜを じぶんで つくる' },
  members: [
    { name: 'ピヨリ', rank: 'common', role: 'speed', desc: 'まだ うまく とべない。はねを パタパタ れんしゅうしている。', evo: 'lv:19' },
    { name: 'カゼツバサ', rank: 'common', role: 'speed', desc: 'かぜに のることを おぼえた。あさ いちばんに なく。', evo: 'lv:38' },
    { name: 'ソラガイル', rank: 'common', role: 'attacker', desc: 'くもの うえを とぶ。はねを ひろげると かぜが うまれる。' }
  ]},

{ area: 1, type: 'bug', motif: '幼虫と蝶',
  concept: 'まるまって隠れる子が、いちばん美しい羽を持つ',
  arc: { 初期: 'はっぱの したで まるまっている', 未熟: 'おどろくと ころがるしか できない',
         中間: 'まゆの なかで じっと まつことを おぼえる', 最終: 'にじいろの はねで、はなを さかせて まわる' },
  members: [
    { name: 'コロムシ', rank: 'common', role: 'balanced', desc: 'はっぱの したで まるまっている。おどろくと ころんと ころがる。', evo: 'lv:19' },
    { name: 'マユゴモリ', rank: 'common', role: 'guard', desc: 'かたい まゆの なか。つぎの すがたを しずかに つくっている。', evo: 'lv:38' },
    { name: 'ニジアゲハ', rank: 'common', role: 'support', desc: 'にじいろの はねで こなを まく。とおった みちに はなが さく。' }
  ]},

{ area: 1, type: 'bug', motif: '針と女王蜂',
  concept: '小さな針しかない子が、巣ぜんぶを背負う',
  arc: { 初期: 'ちいさな はりを じまんしている', 未熟: 'ひとりでは なにも まもれない',
         中間: 'むれで とぶことを おぼえる', 最終: 'すの ぜんいんを まもる。よぶと そらが くろくなる' },
  members: [
    { name: 'チクリン', rank: 'common', role: 'attacker', desc: 'ちいさな はりを もつ。おこると はりが ぴんと たつ。', evo: 'lv:19' },
    { name: 'ハリバチ', rank: 'common', role: 'attacker', desc: 'むれで とぶ。すを まもるためなら なんども むかっていく。', evo: 'lv:38' },
    { name: 'クイーンザ', rank: 'rare', role: 'attacker', desc: 'すの ぜんいんが したがう。よぶと そらが くろくなる。' }
  ]},

{ area: 1, type: 'electric', motif: '小動物と雷',
  concept: 'ほっぺの静電気が、いつか本物の雷になる',
  arc: { 初期: 'さわると ぱちっと する', 未熟: 'でんきを ためすぎて じぶんが しびれる',
         中間: 'しっぽを アンテナに して でんきを あつめる', 最終: 'はしると そらが ひかる' },
  members: [
    { name: 'パチネ', rank: 'common', role: 'speed', desc: 'ほっぺに でんきを ためる。さわると ぱちっと する。', evo: 'lv:19' },
    { name: 'ビリスケ', rank: 'common', role: 'speed', desc: 'しっぽを たてて でんきを あつめる。かみなりの ひは そわそわ。', evo: 'stone:thunder' },
    { name: 'ライガミ', rank: 'rare', role: 'attacker', desc: 'からだから いなずまが はしる。かけると そらが ひかる。' }
  ]},

{ area: 1, type: 'electric', motif: '光の玉と稲妻',
  concept: '暗いところが怖い子が、自分が光になる',
  arc: { 初期: 'くらいのが こわくて ぴかぴか ひかる', 未熟: 'ひかりすぎて じぶんが みえない',
         中間: 'ひかりを おさえられるように なる', 最終: 'よぞらに いなずまで えを かく' },
  members: [
    { name: 'ピカタマ', rank: 'common', role: 'support', desc: 'くらいのが こわくて、ずっと ぴかぴか している。', evo: 'lv:19' },
    { name: 'イナホタル', rank: 'common', role: 'support', desc: 'ひかりを おさえられるように なった。よるみちを てらす。', evo: 'lv:38' },
    { name: 'ライメイガ', rank: 'rare', role: 'attacker', desc: 'よぞらに いなずまで えを かく。かきおわると あめが ふる。' }
  ]},

{ area: 1, type: 'ground', motif: 'もぐらとドリル',
  concept: '目が見えないぶん、地面のすべてを聞いている',
  arc: { 初期: 'つちの なかを ほるのが だいすき', 未熟: 'めが よわく、そとでは まよう',
         中間: 'つめが ドリルの ように なる', 最終: 'あたらしい どうくつを ほって みんなの みちを つくる' },
  members: [
    { name: 'モグポン', rank: 'common', role: 'guard', desc: 'つちの なかを ほるのが だいすき。めが よわいので みみで きく。', evo: 'lv:19' },
    { name: 'ホリドリル', rank: 'common', role: 'attacker', desc: 'つめが ドリルに なった。つちの なかを およぐように すすむ。', evo: 'lv:38' },
    { name: 'ダイクツガ', rank: 'rare', role: 'attacker', desc: 'あたらしい どうくつを ほる。みんなの みちを つくる しごとびと。' }
  ]},

{ area: 1, type: 'rock', motif: '石と巨岩',
  concept: 'ただの石だと思われている子が、山になる',
  arc: { 初期: 'ころころ ころがって いどうする', 未熟: 'じぶんで とまれない',
         中間: 'あしが はえて、がけを のぼれるように なる', 最終: 'やまと まちがえられる。ねむると ほんとうに やまになる' },
  members: [
    { name: 'コロビシ', rank: 'common', role: 'guard', desc: 'ころころ ころがって いどうする。じぶんでは とまれない。', evo: 'lv:19' },
    { name: 'イワノシ', rank: 'common', role: 'guard', desc: 'あしが はえた。がけを のぼるのが とくい。', evo: 'lv:38' },
    { name: 'ガンリュウド', rank: 'rare', role: 'guard', desc: 'やまと まちがえられる おおきさ。ねむると ほんとうに やまになる。' }
  ]},

{ area: 1, type: 'water', motif: 'おたまじゃくしと池の主',
  concept: '足が生えるのを待ちわびている子が、雨を呼べるようになる',
  arc: { 初期: 'あしが はえるのを たのしみに している', 未熟: 'およぐことしか できない',
         中間: 'おおきく ジャンプ できるように なる', 最終: 'ひとこえで あめを よぶ。いけの ぬし' },
  members: [
    { name: 'プクタマ', rank: 'common', role: 'balanced', desc: 'いけの なかを くるくる およぐ。あしが はえるのを まっている。', evo: 'lv:19' },
    { name: 'ケロジャン', rank: 'common', role: 'attacker', desc: 'おおきく ジャンプして みずを とばす。あめの ひは ごきげん。', evo: 'stone:water' },
    { name: 'ガマドロス', rank: 'rare', role: 'guard', desc: 'ひとこえ なくと あめが ふりはじめる。いけの ぬし。' }
  ]},

{ area: 1, type: 'grass', motif: '根と花畑',
  concept: '夜は土にもぐる小心者が、春を連れてくる',
  arc: { 初期: 'ちいさな ねっこで あるく', 未熟: 'よるは こわくて つちに もぐる',
         中間: 'あたまに はなが さく。においで なかまを げんきに する', 最終: 'あるいた みちに はなが さく。はるを つれてくる' },
  members: [
    { name: 'ネッコロ', rank: 'common', role: 'support', desc: 'ちいさな ねっこで あるく。よるは つちに もぐって ねる。', evo: 'lv:19' },
    { name: 'ハナコロ', rank: 'common', role: 'healer', desc: 'あたまの はなから いい においが する。かいだ なかまは げんきに。', evo: 'stone:leaf' },
    { name: 'ハルミドリ', rank: 'rare', role: 'healer', desc: 'あるいた みちに はなが さく。はるを つれてくると いわれる。' }
  ]},

{ area: 1, type: 'poison', motif: 'スライムと浄化',
  concept: '汚れていると嫌われる子が、汚れを消す仕事を見つける',
  arc: { 初期: 'ぷよぷよの からだ。さわると すこし しびれる', 未熟: 'じぶんの どくを おさえられない',
         中間: 'どくを ためて はきだす ばしょを えらべる', 最終: 'ゴミばを きれいに する。まちの えんの したの ちからもち' },
  members: [
    { name: 'プヨドロ', rank: 'common', role: 'guard', desc: 'ぷよぷよの からだ。さわると すこし しびれる。', evo: 'lv:19' },
    { name: 'ベトネル', rank: 'common', role: 'guard', desc: 'どくを はきだす ばしょを えらべる。ゴミばで はたらく。', evo: 'lv:38' },
    { name: 'ドロヴァルド', rank: 'rare', role: 'guard', desc: 'なんでも とかして きれいに する。まちを かげで ささえている。' }
  ]},

{ area: 1, type: 'fight', motif: '拳と武人',
  concept: 'あいさつがパンチの子が、弱い者には手を上げないと決める',
  arc: { 初期: 'まいにち こぶしを きたえている', 未熟: 'かげんを しらない',
         中間: 'つよい あいてを さがして たびに でる', 最終: 'よわい ものには ぜったいに てを あげない' },
  members: [
    { name: 'コブシコ', rank: 'common', role: 'attacker', desc: 'まいにち こぶしを きたえている。あいさつは パンチ。', evo: 'lv:19' },
    { name: 'ケンドウガ', rank: 'common', role: 'attacker', desc: 'つよい あいてを さがして たびを している。れいぎ ただしい。', evo: 'lv:38' },
    { name: 'ブジンザ', rank: 'rare', role: 'attacker', desc: 'まけを しらない。よわい ものには ぜったいに てを あげない。' }
  ]},

{ area: 1, type: 'fairy', motif: 'わたあめと羽',
  concept: '泣いている子を見つけるのがうまい。やがて誰かを眠らせるほど暖かくなる',
  arc: { 初期: 'ないている こを みつけると そばに くる', 未熟: 'じぶんが かなしいと ちいさく なってしまう',
         中間: 'ゆびさきから きらきらを だせる', 最終: 'はねを ひろげると、まわりの みんなが あんしんして ねむくなる' },
  members: [
    { name: 'ホワミィ', rank: 'rare', role: 'healer', desc: 'わたあめの ような からだ。ないている こを みつけると そばに くる。', evo: 'lv:21' },
    { name: 'メルフィ', rank: 'rare', role: 'healer', desc: 'ゆびさきから きらきらを だす。あたると きずが なおる。', evo: 'stone:moon' },
    { name: 'マシュランテ', rank: 'epic', role: 'healer', desc: 'はねを ひろげると、まわりの みんなが あんしんして ねむくなる。' }
  ]},

{ area: 1, type: 'psychic', motif: 'ぬいぐるみと念',
  concept: '触らずに物を動かせるのに、自分がいちばんびっくりしている',
  arc: { 初期: 'みないで ものを うごかせる', 未熟: 'じぶんの ちからに びっくりして ものを おとす',
         中間: 'ちからを コントロールできるように なる', 最終: 'かんがえるだけで まわりの ものが しずかに うかぶ' },
  members: [
    { name: 'ネンリィ', rank: 'rare', role: 'support', desc: 'さわらずに ものを うごかせる。じぶんが いちばん びっくりする。', evo: 'lv:21' },
    { name: 'サイキル', rank: 'rare', role: 'attacker', desc: 'ちからを コントロールできるように なった。あいての きもちが すこし わかる。', evo: 'lv:41' },
    { name: 'メンタリオン', rank: 'epic', role: 'attacker', desc: 'かんがえるだけで まわりの ものが うかぶ。しずかに めを とじている。' }
  ]},

// ══════════ エリア2: ほのおの かざん・すなの たに ══════════

{ area: 2, type: 'fire', motif: 'マグマと火山',
  concept: 'ぽこぽこ鳴るあわが、山ひとつを背負うまで',
  arc: { 初期: 'マグマの あわから うまれた', 未熟: 'すぐ かたまって うごけなくなる',
         中間: 'せなかが もえつづける', 最終: 'せなかの やまから ほのおを ふきあげる' },
  members: [
    { name: 'マグポコ', rank: 'common', role: 'attacker', desc: 'マグマの あわから うまれた。ぽこぽこ おとを たてる。', evo: 'lv:23' },
    { name: 'ヨウガン', rank: 'common', role: 'attacker', desc: 'せなかが あかく もえている。あつい ばしょほど げんきに なる。', evo: 'stone:fire' },
    { name: 'カザングド', rank: 'rare', role: 'attacker', desc: 'せなかの やまから ほのおを ふきあげる。おこると じめんが ゆれる。' }
  ]},

{ area: 2, type: 'fire', motif: 'ろうそくと灯台',
  concept: '自分の火が消えるのが怖い子が、他人の道を照らす',
  arc: { 初期: 'あたまの ひが きえないよう ずっと きを つけている', 未熟: 'かぜが ふくと ないてしまう',
         中間: 'ひを おおきく できるように なる', 最終: 'どうくつ ぜんたいを てらす。まよった ひとの みかた' },
  members: [
    { name: 'ロウソッコ', rank: 'common', role: 'support', desc: 'あたまの ひが きえないよう いつも きを つけている。', evo: 'hold:emberwick' },
    { name: 'トモシビ', rank: 'common', role: 'support', desc: 'ひを おおきく できるように なった。よるみちで たよりに される。', evo: 'lv:40' },
    { name: 'アカリガルド', rank: 'rare', role: 'support', desc: 'どうくつ ぜんたいを てらす。まよった ものを かならず いえへ かえす。' }
  ]},

{ area: 2, type: 'ground', motif: '砂とオアシス',
  concept: '砂に隠れてばかりの子が、旅人の水になる',
  arc: { 初期: 'すなの なかを およぐように すすむ', 未熟: 'ひかりが まぶしくて ひるは でられない',
         中間: 'よるに かつどう できるように なる', 最終: 'せなかに オアシスを もつ。たびびとの みかた' },
  members: [
    { name: 'スナチロ', rank: 'common', role: 'speed', desc: 'すなの なかを およぐように すすむ。すなあらしの ひに あらわれる。', evo: 'lv:23' },
    { name: 'サバクトカ', rank: 'common', role: 'attacker', desc: 'よるに かつどう する。ほしを みて みちを おぼえる。', evo: 'hold:sunscale' },
    { name: 'オアシドン', rank: 'rare', role: 'guard', desc: 'せなかに オアシスが ある。たびびとに みずを わけてくれる。' }
  ]},

{ area: 2, type: 'rock', motif: '化石と古文字',
  concept: 'とても古い記憶を、こうらに書きためている',
  arc: { 初期: 'こうらに もようが ほられている', 未熟: 'うごくのが とても おそい',
         中間: 'もようが もじだと わかる', 最終: 'こうらを よむと むかしの はなしが ぜんぶ わかる' },
  members: [
    { name: 'カセキーノ', rank: 'common', role: 'guard', desc: 'とても むかしから いきている。こうらに もようが ほられている。', evo: 'stone:ancient' },
    { name: 'コダイガメ', rank: 'rare', role: 'guard', desc: 'こうらの もようが もじだと わかった。ゆっくり ゆっくり あるく。', evo: 'lv:40' },
    { name: 'ゲンコツヅラ', rank: 'epic', role: 'guard', desc: 'こうらを よむと むかしの はなしが ぜんぶ わかる。いきた ずかん。' }
  ]},

{ area: 2, type: 'steel', motif: 'ねじと機構',
  concept: 'ひとりでに回るねじが、街を守る鎧になる',
  arc: { 初期: 'ねじが たくさん ついている', 未熟: 'かってに まわって とまらない',
         中間: 'からだが はがねに なる', 最終: 'どんな こうげきも はねかえす' },
  members: [
    { name: 'ネジコロ', rank: 'common', role: 'guard', desc: 'ねじが たくさん ついている。ひとりでに くるくる まわる。', evo: 'lv:23' },
    { name: 'ハガネット', rank: 'common', role: 'guard', desc: 'からだが つよい はがね。たたくと きれいな おとが なる。', evo: 'hold:steelplate' },
    { name: 'テツガイア', rank: 'rare', role: 'guard', desc: 'どんな こうげきも はねかえす。うごくと ずしんと ひびく。' }
  ]},

{ area: 2, type: 'electric', motif: '雷雲と馬',
  concept: 'そわそわが止まらない子が、嵐そのものになる',
  arc: { 初期: 'かみなりぐもから おちてきた', 未熟: 'じっと していられず よく ころぶ',
         中間: 'かみなりの はやさで はしれる', 最終: 'つのから かみなりを よぶ。あらしの ひの ぬし' },
  members: [
    { name: 'カミナリコ', rank: 'rare', role: 'speed', desc: 'かみなりぐもから おちてきた こ。いつも そわそわ している。', evo: 'lv:25' },
    { name: 'イナヅマウマ', rank: 'rare', role: 'speed', desc: 'かみなりの はやさで はしる。とおったあと ひかりが のこる。', evo: 'lv:43' },
    { name: 'ライテイガ', rank: 'epic', role: 'attacker', desc: 'つのから かみなりを よぶ。あらしの ひの ぬし。' }
  ]},

{ area: 2, type: 'water', motif: '小魚と群れ',
  concept: 'ひとりだと不安な子が、群れを率いる速さを得る',
  arc: { 初期: 'むれで およぐ', 未熟: 'ひとりに なると うごけない',
         中間: 'せんとうを およげるように なる', 最終: 'みずを きって すすむ。むれの やじるし' },
  members: [
    { name: 'ウロッコ', rank: 'common', role: 'speed', desc: 'むれで およぐ。ひとりに なると ふあんに なる。', evo: 'lv:23' },
    { name: 'ハヤビレ', rank: 'common', role: 'attacker', desc: 'むれの せんとうを およぐ。ものすごい はやさ。', evo: 'lv:40' },
    { name: 'シオカゼル', rank: 'rare', role: 'speed', desc: 'みずを きって すすむ。とおった あとに しおかぜが ふく。' }
  ]},

{ area: 2, type: 'water', motif: 'くらげと夜光',
  concept: 'ふわふわ漂うだけの子が、夜の海の灯になる',
  arc: { 初期: 'ふわふわ ういている', 未熟: 'ながされる ままに いどうする',
         中間: 'かさの もようが ひかりだす', 最終: 'よるの うみを ひかりで うめる' },
  members: [
    { name: 'クラフワ', rank: 'common', role: 'support', desc: 'ふわふわ ういている。さわると すこし ぴりっと する。', evo: 'lv:23' },
    { name: 'ヒカリガサ', rank: 'common', role: 'support', desc: 'かさの もようが ひかりだす。よるの うみで きれい。', evo: 'lv:40' },
    { name: 'ルミクラゲン', rank: 'rare', role: 'support', desc: 'よるの うみを ひかりで うめる。ふねの みちしるべに なる。' }
  ]},

{ area: 2, type: 'poison', motif: 'きのこと菌糸',
  concept: '湿った場所でひとり育つ子が、森ぜんぶとつながる',
  arc: { 初期: 'あたまの かさから こなを だす', 未熟: 'ひなたに でると しおれる',
         中間: 'かさを ふりまわして たたかえる', 最終: 'もりじゅうの キノコと つながり、もりの ようすが ぜんぶ わかる' },
  members: [
    { name: 'キノポイ', rank: 'common', role: 'support', desc: 'あたまの かさから こなを だす。じめじめした ばしょが すき。', evo: 'lv:23' },
    { name: 'キノタケン', rank: 'common', role: 'attacker', desc: 'かさを ふりまわして たたかう。もりの おくに すむ。', evo: 'stone:leaf' },
    { name: 'キノガルダ', rank: 'rare', role: 'guard', desc: 'もりじゅうの キノコと つながる。もりの ようすが ぜんぶ わかる。' }
  ]},

{ area: 2, type: 'grass', motif: 'つると密林',
  concept: '高いところが好きな子が、森の道そのものになる',
  arc: { 初期: 'つるを のばして きに ぶらさがる', 未熟: 'じめんに おりられない',
         中間: 'つるを むちの ように つかえる', 最終: 'つるで もりに みちを つくる' },
  members: [
    { name: 'ツルリン', rank: 'common', role: 'support', desc: 'つるを のばして きに ぶらさがる。たかい ところが すき。', evo: 'lv:23' },
    { name: 'ジャングリ', rank: 'common', role: 'attacker', desc: 'つるを むちの ように つかう。もりを すばやく いどうする。', evo: 'lv:40' },
    { name: 'ミドリヴァイン', rank: 'rare', role: 'attacker', desc: 'つるで もりに みちを つくる。まいごの どうぶつを あんないする。' }
  ]},

{ area: 2, type: 'grass', motif: 'サボテンと花',
  concept: 'とげだらけで近寄れない子が、いちばん綺麗な花を咲かせる',
  arc: { 初期: 'とげが たくさん', 未熟: 'ちかづく ものを ぜんぶ さしてしまう',
         中間: 'みずを ためて とげを やわらげる', 最終: 'はれた ひに おおきな はなを さかせる' },
  members: [
    { name: 'サボテニョ', rank: 'common', role: 'guard', desc: 'とげが たくさん。みずを からだに ためている。', evo: 'lv:23' },
    { name: 'ハナトゲ', rank: 'common', role: 'attacker', desc: 'とげを やわらげ、はなの つぼみを つけた。', evo: 'lv:40' },
    { name: 'カクタリア', rank: 'rare', role: 'attacker', desc: 'はれた ひに おおきな はなを さかせる。さばくの おひめさま。' }
  ]},

{ area: 2, type: 'fight', motif: '猿と山の修行',
  concept: '岩を持ち上げるだけの子が、山の頂で静けさを知る',
  arc: { 初期: 'いわを もちあげて きたえている', 未熟: 'ちからまかせで すぐ つかれる',
         中間: 'いわを かたてで くだけるように なる', 最終: 'やまの てっぺんで しずかに かまえる' },
  members: [
    { name: 'イワザル', rank: 'common', role: 'attacker', desc: 'いわを もちあげて きたえている。まけずぎらい。', evo: 'lv:23' },
    { name: 'ガンザル', rank: 'common', role: 'attacker', desc: 'いわを かたてで くだく。やまの なかふくで しゅぎょうする。', evo: 'lv:40' },
    { name: 'センガンジ', rank: 'rare', role: 'attacker', desc: 'やまの てっぺんで しずかに かまえる。うごかずに かつ。' }
  ]},

{ area: 2, type: 'fight', motif: '蹴りと速度',
  concept: '蹴ることしか知らない子が、見えない速さを手に入れる',
  arc: { 初期: 'けりの れんしゅうを かかさない', 未熟: 'あしが はやいだけで とまれない',
         中間: 'くうちゅうで ほうこうを かえられる', 最終: 'めに みえない はやさで ける' },
  members: [
    { name: 'ケリッコ', rank: 'common', role: 'speed', desc: 'けりの れんしゅうを かかさない。あしが とても はやい。', evo: 'lv:23' },
    { name: 'トビゲリ', rank: 'common', role: 'speed', desc: 'とびげりが とくい。くうちゅうで ほうこうを かえられる。', evo: 'hold:windband' },
    { name: 'シッコクレン', rank: 'rare', role: 'speed', desc: 'めに みえない はやさで ける。かぜの おとだけ のこる。' }
  ]},

{ area: 2, type: 'flying', motif: 'こうもりと夜の空',
  concept: '真っ暗が平気な子が、夜の空を支配する',
  arc: { 初期: 'てんじょうで さかさに ねる', 未熟: 'あかるい ところが にがて',
         中間: 'おとだけで まっすぐ とべる', 最終: 'よるの そらの おうじゃ' },
  members: [
    { name: 'コウモリン', rank: 'common', role: 'speed', desc: 'どうくつの てんじょうで さかさに ねる。おとで まわりを みる。', evo: 'lv:23' },
    { name: 'オトバサ', rank: 'common', role: 'attacker', desc: 'まっくらでも まっすぐ とべる。おとの ちずを もっている。', evo: 'lv:40' },
    { name: 'ヤミツバサ', rank: 'rare', role: 'attacker', desc: 'よるの そらを ひとりで まわる。あさが くる まえに かえる。' }
  ]},

{ area: 2, type: 'psychic', motif: '眠りと夢',
  concept: 'いつも寝ている子が、みんなの夢の中で働いている',
  arc: { 初期: 'いつも ねむっている', 未熟: 'おきていられない',
         中間: 'ゆめの なかで なかまと はなせる', 最終: 'いい ゆめを みせて、ねている あいだに きずを なおす' },
  members: [
    { name: 'ネムリン', rank: 'rare', role: 'support', desc: 'いつも ねむっている。ゆめの なかで なかまと はなす。', evo: 'lv:25' },
    { name: 'ユメミィ', rank: 'rare', role: 'healer', desc: 'いい ゆめを みせてくれる。ねている あいだに きずが なおる。', evo: 'lv:43' },
    { name: 'ムゲンリオ', rank: 'epic', role: 'healer', desc: 'ゆめと うつつの あいだに すむ。おこすと しずかに きえる。' }
  ]},

{ area: 2, type: 'normal', motif: '羊と毛',
  concept: 'もこもこの毛が、電気も温もりもためこむ',
  arc: { 初期: 'もこもこの けが あたたかい', 未熟: 'けが おもくて はしれない',
         中間: 'けに でんきを ためられる', 最終: 'ふゆの あいだ、むら ぜんぶを あたためる' },
  members: [
    { name: 'モコメェ', rank: 'common', role: 'guard', desc: 'もこもこの けが あたたかい。さむい ひは なかまと くっつく。', evo: 'lv:23' },
    { name: 'フワメェ', rank: 'common', role: 'guard', desc: 'けに でんきを ためられる。さわると ぱちっと する。', evo: 'lv:40' },
    { name: 'ラムガルド', rank: 'rare', role: 'guard', desc: 'ふゆの あいだ、むら ぜんぶを あたためる。だれも こごえさせない。' }
  ]},

{ area: 2, type: 'ice', motif: '子狼と吹雪',
  concept: '寒さしか知らない子が、群れを呼ぶ遠吠えを覚える',
  arc: { 初期: 'いきが しろい', 未熟: 'あついのが とても にがて',
         中間: 'ゆきやまを むれで はしる', 最終: 'とおぼえで ふぶきを よぶ' },
  members: [
    { name: 'コオリンコ', rank: 'common', role: 'balanced', desc: 'いきが しろい。あついのが とても にがて。', evo: 'lv:23' },
    { name: 'ユキヴォル', rank: 'rare', role: 'attacker', desc: 'ゆきやまを むれで はしる。あしあとが すぐ きえる。', evo: 'lv:40' },
    { name: 'フブキヴォルグ', rank: 'epic', role: 'attacker', desc: 'とおぼえで ふぶきを よぶ。ゆきやまの ぬし。' }
  ]},

{ area: 2, type: 'dark', motif: '影とかくれんぼ',
  concept: 'かくれんぼが世界一うまい子が、夜そのものを味方にする',
  arc: { 初期: 'かげの なかに かくれる', 未熟: 'ひなたに でると ちからが でない',
         中間: 'かげから かげへ うつれる', 最終: 'よるに なると だれにも みつからない' },
  members: [
    { name: 'カゲコロ', rank: 'common', role: 'speed', desc: 'かげの なかに かくれる。かくれんぼが せかいいち つよい。', evo: 'lv:23' },
    { name: 'ヤミバルグ', rank: 'rare', role: 'attacker', desc: 'かげから かげへ うつる。めだけが ひかる。', evo: 'lv:40' },
    { name: 'ヨイヤミガ', rank: 'epic', role: 'attacker', desc: 'よるに なると だれにも みつからない。あさが くると ねむる。' }
  ]},

{ area: 2, type: 'ghost', motif: 'おばけといたずら',
  concept: 'いたずらばかりの子が、ほんとうは寂しがりだと知られる',
  arc: { 初期: 'いたずらが だいすき', 未熟: 'ひとりに なるのが こわい',
         中間: 'かべを すりぬけられる', 最終: 'よなかに ひとりの ひとの そばに そっと いる' },
  members: [
    { name: 'オバケポ', rank: 'common', role: 'support', desc: 'いたずらが だいすき。おどろかせて わらっている。', evo: 'lv:23' },
    { name: 'スリヌケル', rank: 'rare', role: 'attacker', desc: 'かべを すりぬける。ほんとうは さみしがりや。', evo: 'lv:40' },
    { name: 'ユウゲンド', rank: 'epic', role: 'attacker', desc: 'よなかに ひとりの ひとの そばに そっと いる。なにも しない。' }
  ]},

{ area: 2, type: 'ghost', motif: 'かぼちゃと祭り',
  concept: '年に一度だけ本気を出す、お祭りのぬし',
  arc: { 初期: 'あたまが かぼちゃ。なかに ひが ともる', 未熟: 'ひが きえると うごけない',
         中間: 'ひを ふきながら とびまわる', 最終: 'いちねんに いちどだけ、まちじゅうを おまつりに する' },
  members: [
    { name: 'カボチャッコ', rank: 'common', role: 'support', desc: 'あたまが かぼちゃ。なかに ひが ともっている。', evo: 'lv:23' },
    { name: 'ジャックビ', rank: 'rare', role: 'attacker', desc: 'ひを ふきながら とびまわる。おまつりの よるに あらわれる。', evo: 'stone:dusk' },
    { name: 'マツリガルド', rank: 'epic', role: 'attacker', desc: 'いちねんに いちど、まちじゅうを おまつりに する。おかしを あげると おとなしい。' }
  ]},

{ area: 2, type: 'fairy', motif: '流れ星と願い',
  concept: '願いごとを聞くのが好きな子が、願いを届ける役目を負う',
  arc: { 初期: 'ながれぼしから おちてきた', 未熟: 'ねがいを おぼえきれない',
         中間: 'ねがいを ひとつ あずかれる', 最終: 'あずかった ねがいを ほしまで とどける' },
  members: [
    { name: 'ホシノコ', rank: 'rare', role: 'healer', desc: 'ながれぼしから おちてきた。ねがいごとを きくのが すき。', evo: 'lv:34' },
    { name: 'ネガイリア', rank: 'epic', role: 'healer', desc: 'あずかった ねがいを ほしまで とどける。よぞらを ゆっくり のぼる。' }
  ]},

{ area: 2, type: 'normal', motif: 'たぬきと化け',
  concept: '何にでも化けられるのに、しっぽを隠すのを毎回忘れる',
  arc: { 初期: 'なんにでも ばけられる', 未熟: 'しっぽを かくすのを わすれる',
         中間: 'しっぽも かくせるように なる', 最終: 'ばけたまま だれにも きづかれない' },
  members: [
    { name: 'タヌポン', rank: 'common', role: 'balanced', desc: 'なんにでも ばけられる。でも しっぽを かくすのを わすれる。', evo: 'lv:31' },
    { name: 'マボロヌキ', rank: 'rare', role: 'support', desc: 'しっぽも かくせるように なった。となりに いても きづかれない。' }
  ]},

// ══════════ エリア3: こおりの うみ・ふかい もり ══════════

{ area: 3, type: 'ice', motif: '雪玉と氷河',
  concept: '転がるだけの雪玉が、氷河を動かす',
  arc: { 初期: 'ころがると おおきくなる', 未熟: 'はるが くると しょんぼりする',
         中間: 'あつい こおりの けがわを まとう', 最終: 'あるいた あとが こおりの みちに なる' },
  members: [
    { name: 'ユキダマル', rank: 'common', role: 'guard', desc: 'ころがると おおきくなる。はるが くると すこし しょんぼり。', evo: 'lv:30' },
    { name: 'コオリグマ', rank: 'common', role: 'guard', desc: 'あつい こおりの けがわ。ふぶきの なかでも へっちゃら。', evo: 'stone:ice' },
    { name: 'ヒョウガルド', rank: 'epic', role: 'guard', desc: 'あるいた あとが こおりの みちに なる。ひょうがを うごかす。' }
  ]},

{ area: 3, type: 'ice', motif: 'つららと結晶',
  concept: '投げて遊ぶだけの子が、世界でいちばん硬い氷になる',
  arc: { 初期: 'つららを なげて あそぶ', 未熟: 'なげると じぶんも くずれる',
         中間: 'からだが すきとおった こおりに なる', 最終: 'なんねんも とけない こおり' },
  members: [
    { name: 'ツララン', rank: 'common', role: 'attacker', desc: 'つららを なげて あそぶ。あたると つめたい。', evo: 'stone:ice' },
    { name: 'クリスタリン', rank: 'rare', role: 'attacker', desc: 'からだが すきとおった こおり。ひかりを あびると にじいろ。', evo: 'hold:frostgem' },
    { name: 'ダイヤグレス', rank: 'epic', role: 'guard', desc: 'せかいで いちばん かたい こおり。なんねんも とけない。' }
  ]},

{ area: 3, type: 'ice', motif: 'ペンギンと氷海',
  concept: 'よちよち歩きの子が、氷の海の王になる',
  arc: { 初期: 'よちよち あるく', 未熟: 'あるくより すべるほうが はやい',
         中間: 'こおりの うえを ものすごい はやさで すべる', 最終: 'むねを はって みんなを まもる' },
  members: [
    { name: 'ペンペンコ', rank: 'common', role: 'balanced', desc: 'よちよち あるく。すべって いどうする ほうが はやい。', evo: 'lv:30' },
    { name: 'アイスペン', rank: 'common', role: 'speed', desc: 'こおりの うえを ものすごい はやさで すべる。およぐのも とくい。', evo: 'stone:ice' },
    { name: 'ヒョウテイン', rank: 'epic', role: 'guard', desc: 'こおりの うみの おうさま。むねを はって みんなを まもる。' }
  ]},

{ area: 3, type: 'water', motif: 'あざらしと氷上',
  concept: 'ひなたぼっこが好きな子が、氷を割る牙を持つ',
  arc: { 初期: 'こおりの うえで ひなたぼっこ', 未熟: 'おなかが おもくて うごけない',
         中間: 'きばで こおりを われるように なる', 最終: 'こおりの うみに みちを つくる' },
  members: [
    { name: 'アザラっコ', rank: 'common', role: 'guard', desc: 'こおりの うえで ひなたぼっこ。おなかが まんまる。', evo: 'lv:30' },
    { name: 'セイウチドン', rank: 'common', role: 'guard', desc: 'きばで こおりを わって みちを つくる。ちからもち。', evo: 'lv:45' },
    { name: 'ヒョウガバ', rank: 'rare', role: 'guard', desc: 'こおりの うみに みちを つくる。ふねを とおしてくれる。' }
  ]},

{ area: 3, type: 'water', motif: 'タツノオトシゴと深海',
  concept: '歌うことしかできない子が、海の底の王になる',
  arc: { 初期: 'うみの なかで うたを うたう', 未熟: 'およぐのが とても おそい',
         中間: 'うずしおを おこせるように なる', 最終: 'よぶと なみが みちを あける' },
  members: [
    { name: 'ウタノオト', rank: 'rare', role: 'support', desc: 'うみの なかで うたを うたう。きくと こころが おちつく。', evo: 'lv:32' },
    { name: 'タツネイロ', rank: 'rare', role: 'attacker', desc: 'うずしおを おこす。ふかい うみの みはりばん。', evo: 'stone:water' },
    { name: 'カイテイリオ', rank: 'epic', role: 'attacker', desc: 'よぶと なみが みちを あける。うみの そこの ぬし。' }
  ]},

{ area: 3, type: 'grass', motif: 'どんぐりと大樹',
  concept: 'ほっぺにためこむ癖が、千年の森をつくる',
  arc: { 初期: 'きのみを ほっぺに ためる', 未熟: 'ためすぎて うごけなくなる',
         中間: 'からだが きの みきの ように かたくなる', 最終: 'せんねん いきる おおきな き。とりたちの すみか' },
  members: [
    { name: 'モリノコ', rank: 'common', role: 'balanced', desc: 'ふかい もりで うまれた。きのみを ほっぺに ためる。', evo: 'lv:30' },
    { name: 'ジュモクン', rank: 'common', role: 'guard', desc: 'からだが きの みきの ように かたい。うごかないと きに みえる。', evo: 'stone:leaf' },
    { name: 'センジュガ', rank: 'epic', role: 'guard', desc: 'せんねん いきている おおきな き。とりたちの すみか。' }
  ]},

{ area: 3, type: 'bug', motif: 'クワガタと力比べ',
  concept: '力比べが好きなだけの子が、森いちばんのあごを持つ',
  arc: { 初期: 'ちいさな あごで はさむ', 未熟: 'はさむと はなせなくなる',
         中間: 'あごの ちからが ぴかいちに なる', 最終: 'きの みつを めぐる あらそいの しんぱん' },
  members: [
    { name: 'クワガチ', rank: 'common', role: 'attacker', desc: 'ちいさな あごで はさむ。ちからくらべが すき。', evo: 'lv:30' },
    { name: 'オオクワガ', rank: 'rare', role: 'attacker', desc: 'あごの ちからは ぴかいち。きの みつを めぐって あらそう。', evo: 'lv:45' },
    { name: 'ハサミガルダ', rank: 'epic', role: 'attacker', desc: 'あらそいの しんぱん。はさんだ ものは ぜったいに はなさない。' }
  ]},

{ area: 3, type: 'bug', motif: 'カブトと角',
  concept: '角を自慢するだけの子が、何でも持ち上げられるようになる',
  arc: { 初期: 'つのを じまんしている', 未熟: 'まだ ちいさくて もちあげられない',
         中間: 'つのに ぶらさがっても へいき', 最終: 'もちあげられない ものは ない' },
  members: [
    { name: 'カブトチ', rank: 'common', role: 'guard', desc: 'つのを じまんしている。まだ ちいさい。', evo: 'lv:30' },
    { name: 'カブトガル', rank: 'rare', role: 'guard', desc: 'つのに ぶらさがっても へいき。もりの ちからもち。', evo: 'hold:barkarmor' },
    { name: 'カブトレクス', rank: 'epic', role: 'attacker', desc: 'つのに いなずまの もようが ある。もちあげられない ものは ない。' }
  ]},

{ area: 3, type: 'psychic', motif: '星読みと星座',
  concept: 'よく外れる天気予報が、いつか星座の地図になる',
  arc: { 初期: 'ほしを みて あしたの てんきを あてる', 未熟: 'よく はずれる',
         中間: 'せなかに せいざが うかぶ', 最終: 'よぞらの あんないやく。まよう ものが いなくなる' },
  members: [
    { name: 'ホシヨミ', rank: 'rare', role: 'support', desc: 'ほしを みて あしたの てんきを あてる。よく はずれる。', evo: 'stone:moon' },
    { name: 'セイザール', rank: 'epic', role: 'support', desc: 'せなかに ほんものの せいざが うかぶ。よぞらの あんないやく。' }
  ]},

{ area: 3, type: 'ghost', motif: '人魂と提灯',
  concept: '夜道についてくる怖い火が、じつはいちばん優しい',
  arc: { 初期: 'ふわふわ とぶ あおい ひ', 未熟: 'ついていくだけで なにも できない',
         中間: 'あかりを ともして みちを おしえる', 最終: 'まよった ものを いえまで おくる。すがたは みえない' },
  members: [
    { name: 'ユラビコ', rank: 'common', role: 'speed', desc: 'ふわふわ とぶ あおい ひ。よるみちを ついてくる。', evo: 'lv:30' },
    { name: 'ランタンゴ', rank: 'rare', role: 'support', desc: 'あかりを ともして みちを おしえる。じつは やさしい。', evo: 'stone:dusk' },
    { name: 'ミチシルベ', rank: 'epic', role: 'attacker', desc: 'まよった ものを いえまで おくる。すがたは だれにも みえない。' }
  ]},

{ area: 3, type: 'dark', motif: 'カラスと見張り',
  concept: '光る物を集める癖が、夜の森の見張り役になる',
  arc: { 初期: 'ひかる ものを あつめる', 未熟: 'とられると おこって なにも できなくなる',
         中間: 'なきごえで なかまを よべる', 最終: 'みっつの あしで、みちに まよった ものを みちびく' },
  members: [
    { name: 'カラスケ', rank: 'common', role: 'speed', desc: 'ひかる ものを あつめる。とられると おこる。', evo: 'lv:30' },
    { name: 'カゲラス', rank: 'rare', role: 'attacker', desc: 'よるの もりの みはり。なきごえで なかまを よぶ。', evo: 'hold:nightfeather' },
    { name: 'ミツアシガ', rank: 'epic', role: 'attacker', desc: 'みっつの あしを もつ。みちに まよった ものを みちびく。' }
  ]},

{ area: 3, type: 'dark', motif: '狐と九尾',
  concept: 'だましっこで負けたことがない子が、尾の数だけ魔法を覚える',
  arc: { 初期: 'とても かしこい', 未熟: 'だましてばかりで ともだちが いない',
         中間: 'しっぽが ふえるたび まほうを ひとつ おぼえる', 最終: 'しっぽ きゅうほん。まもると きめた ものは ぜったいに まもる' },
  members: [
    { name: 'コギツネ', rank: 'rare', role: 'speed', desc: 'とても かしこい。だましっこで まけた ことが ない。', evo: 'lv:32' },
    { name: 'バケギツネ', rank: 'rare', role: 'attacker', desc: 'しっぽが ふえるたび まほうを ひとつ おぼえる。', evo: 'lv:48' },
    { name: 'キュウビガミ', rank: 'epic', role: 'attacker', desc: 'しっぽが きゅうほん。まもると きめた ものは ぜったいに まもる。' }
  ]},

{ area: 3, type: 'steel', motif: '針金と鎧',
  concept: '磁石にくっつくだけの子が、守ることを仕事にする',
  arc: { 初期: 'ほそい からだで すきまを とおる', 未熟: 'じしゃくに くっついて はなれない',
         中間: 'よろいの ような からだに なる', 最終: 'まもるのが しごとだと しんじている' },
  members: [
    { name: 'ハリガネン', rank: 'common', role: 'speed', desc: 'ほそい からだで すきまを とおる。じしゃくに くっつく。', evo: 'lv:30' },
    { name: 'コウテツガ', rank: 'rare', role: 'guard', desc: 'よろいのような からだ。まもるのが しごとだと おもっている。', evo: 'hold:steelplate' },
    { name: 'ガードヴァルツ', rank: 'epic', role: 'guard', desc: 'まもると きめたら いっぽも ひかない。きずだらけでも たっている。' }
  ]},

{ area: 3, type: 'rock', motif: '崖と守り神',
  concept: 'ただの石だと思われていた子が、山の神と呼ばれる',
  arc: { 初期: 'ただの いしに みえる', 未熟: 'うごくと みんな おどろいて にげる',
         中間: 'おちてくる いわを うけとめられる', 最終: 'むかしの ひとが かみさまと よんだ' },
  members: [
    { name: 'イシコロン', rank: 'common', role: 'guard', desc: 'ただの いしに みえる。うごくと みんな おどろく。', evo: 'lv:30' },
    { name: 'ガケマモル', rank: 'common', role: 'guard', desc: 'がけに はりついて くらす。おちてくる いわを うけとめる。', evo: 'stone:ancient' },
    { name: 'イワガミラ', rank: 'epic', role: 'guard', desc: 'やまの ような おおきさ。むかしの ひとが かみさまと よんだ。' }
  ]},

{ area: 3, type: 'ground', motif: '泥と沼の主',
  concept: '泥遊びが好きなだけの子が、沼のぬしになる',
  arc: { 初期: 'どろあそびが だいすき', 未熟: 'よごれると おうちに かえれない',
         中間: 'どろの なかで いきを とめられる', 最終: 'しずかに もぐって まつ。ぬまの ぬし' },
  members: [
    { name: 'ドロネズ', rank: 'common', role: 'balanced', desc: 'どろあそびが だいすき。よごれるほど げんきに なる。', evo: 'lv:30' },
    { name: 'ヌマクジラ', rank: 'rare', role: 'guard', desc: 'どろの なかで ながい あいだ いきを とめられる。', evo: 'lv:45' },
    { name: 'ヌマドロス', rank: 'epic', role: 'guard', desc: 'しずかに もぐって まつ。ぬまの ぬしと よばれる。' }
  ]},

{ area: 3, type: 'ground', motif: '地震と大地',
  concept: '眠っているだけの子が、島をひとつ作ってしまう',
  arc: { 初期: 'つちの なかで ずっと ねむっている', 未熟: 'おきるのに なんにちも かかる',
         中間: 'あるくと じめんが ゆれる', 最終: 'せなかに もりを のせて ねむる' },
  members: [
    { name: 'ツチノコン', rank: 'common', role: 'guard', desc: 'つちの なかで ずっと ねむっている。みつけると ラッキー。', evo: 'lv:30' },
    { name: 'ジシンドン', rank: 'rare', role: 'guard', desc: 'あるくと じめんが ゆれる。おこらせない ほうが いい。', evo: 'lv:45' },
    { name: 'テラガイア', rank: 'epic', role: 'guard', desc: 'せなかに もりを のせている。ねむると おかに まちがえられる。' }
  ]},

{ area: 3, type: 'poison', motif: '蛇と毒牙',
  concept: '匂いだけで世界を知る子が、鎌首をもたげる',
  arc: { 初期: 'したで においを かぐ', 未熟: 'めが よく みえない',
         中間: 'きばに どくを もつ', 最終: 'かまくびを たてるだけで あいてが うごけなくなる' },
  members: [
    { name: 'ヘビニョロ', rank: 'common', role: 'speed', desc: 'くさむらを するすると すすむ。したで においを かぐ。', evo: 'lv:30' },
    { name: 'ドクヘビン', rank: 'rare', role: 'attacker', desc: 'きばに どくを もつ。おどかす ときは かまくびを たてる。', evo: 'lv:45' },
    { name: 'ジャドクラ', rank: 'epic', role: 'attacker', desc: 'かまくびを たてるだけで あいてが うごけなくなる。' }
  ]},

{ area: 3, type: 'fight', motif: '相撲と不動',
  concept: 'しこを踏むだけの子が、一歩も引かない壁になる',
  arc: { 初期: 'しこを ふむのが にっか', 未熟: 'おされると すぐ ころぶ',
         中間: 'おしずもうで まけなく なる', 最終: 'どっしり かまえて いっぽも ひかない' },
  members: [
    { name: 'スモウコ', rank: 'common', role: 'guard', desc: 'しこを ふむのが にっか。おしずもうで まけない。', evo: 'lv:30' },
    { name: 'ドスコイン', rank: 'rare', role: 'guard', desc: 'おされても いっぽも ひかない。どっしり かまえる。', evo: 'lv:45' },
    { name: 'フドウザン', rank: 'epic', role: 'guard', desc: 'やまが うごいても この こは うごかない。' }
  ]},

{ area: 3, type: 'flying', motif: '鷲と高空',
  concept: '目のいい子が、雲の上まで舞い上がる',
  arc: { 初期: 'たかい きの うえに すを つくる', 未熟: 'まだ たかく とべない',
         中間: 'かぜを よむ めいじんに なる', 最終: 'はねを ひろげると たいようが かくれる' },
  members: [
    { name: 'ワシチ', rank: 'common', role: 'attacker', desc: 'たかい きの うえに すを つくる。めが とても いい。', evo: 'lv:30' },
    { name: 'オオワシガ', rank: 'rare', role: 'attacker', desc: 'そらの たかい ところから さがす。かぜを よむ めいじん。', evo: 'hold:skyplume' },
    { name: 'テンショウガ', rank: 'epic', role: 'attacker', desc: 'くもの うえまで まいあがる。はねを ひろげると たいようが かくれる。' }
  ]},

{ area: 3, type: 'fairy', motif: '妖精と花畑',
  concept: '花とおしゃべりする子が、通った道に花を咲かせる',
  arc: { 初期: 'はなばたけに すむ ちいさな こ', 未熟: 'はなが かれると げんきが なくなる',
         中間: 'はなを さかせながら あるける', 最終: 'とおった あとに はなみちが できる' },
  members: [
    { name: 'ハナヨウ', rank: 'rare', role: 'healer', desc: 'はなばたけに すむ ちいさな こ。はなと おしゃべりする。', evo: 'lv:32' },
    { name: 'フラワリア', rank: 'rare', role: 'healer', desc: 'はなを さかせながら あるく。とおったあとに はなみちが できる。', evo: 'lv:48' },
    { name: 'ブルーメルナ', rank: 'epic', role: 'healer', desc: 'かれた のはらを ひとばんで はなばたけに かえる。' }
  ]},

{ area: 3, type: 'electric', motif: '電柱とプラズマ',
  concept: '電気を配るだけの子が、街ぜんぶを光らせる',
  arc: { 初期: 'でんきを ためて くばる', 未熟: 'ためすぎて ばちばち する',
         中間: 'からだが でんきの かたまりに なる', 最終: 'ふれると まちじゅうが ひかる' },
  members: [
    { name: 'デンチュン', rank: 'common', role: 'support', desc: 'でんきを ためて くばる。まちの あかりを てつだう。', evo: 'lv:30' },
    { name: 'スパークル', rank: 'rare', role: 'attacker', desc: 'からだが でんきの かたまり。ちかづくと かみのけが たつ。', evo: 'lv:45' },
    { name: 'エレキオーラ', rank: 'epic', role: 'attacker', desc: 'ふれると まちじゅうが ひかる。ていでんの よるの ヒーロー。' }
  ]},

{ area: 3, type: 'normal', motif: 'ものまねと learning',
  concept: '相手の技をすぐ覚える子が、自分の技を見つける',
  arc: { 初期: 'ものまねが とくい', 未熟: 'じぶんの わざが ひとつも ない',
         中間: 'おぼえた わざを つなげられる', 最終: 'だれの ものでもない じぶんの わざを つくる' },
  members: [
    { name: 'マネッコ', rank: 'rare', role: 'support', desc: 'あいての わざを すぐ おぼえる。じぶんの わざは まだ ない。', evo: 'lv:32' },
    { name: 'ウツシミ', rank: 'rare', role: 'support', desc: 'おぼえた わざを つなげられる。れんぞくで くりだす。', evo: 'lv:48' },
    { name: 'オリジナ', rank: 'epic', role: 'balanced', desc: 'だれの ものでもない じぶんの わざを つくった。' }
  ]},

// ══════════ エリア4: ぎんがの みやこ・そらの はて ══════════

{ area: 4, type: 'dragon', motif: '子竜と虹',
  concept: 'まだ飛べない子竜が、空の果てまで届く',
  arc: { 初期: 'まだ とべない', 未熟: 'はねの つかいかたが わからない',
         中間: 'ようやく とべる。うれしくて ずっと とんでいる', 最終: 'とおった あとに にじが のこる' },
  members: [
    { name: 'ドラミィ', rank: 'rare', role: 'balanced', desc: 'まだ とべない こりゅう。はねを ひろげる れんしゅうちゅう。', evo: 'lv:42' },
    { name: 'ソラドラゴ', rank: 'epic', role: 'attacker', desc: 'ようやく そらを とべるように なった。うれしくて ずっと とんでいる。', evo: 'hold:dragonfang' },
    { name: 'ニジリュウガ', rank: 'epic', role: 'attacker', desc: 'そらの はてまで とぶ。とおった あとに にじが のこる。' }
  ]},

{ area: 4, type: 'dragon', motif: '岩竜と大地',
  concept: '岩間で眠る子竜が、山ひとつを守る',
  arc: { 初期: 'いわの すきまで ねむっている', 未熟: 'おきると おなかが すいている',
         中間: 'いわの ような うろこを まとう', 最終: 'ねむると じめんが みどりに なる' },
  members: [
    { name: 'リュウノコ', rank: 'rare', role: 'guard', desc: 'いわの すきまで ねむっている こりゅう。おきると おなかが すいている。', evo: 'lv:42' },
    { name: 'ガンリュウガ', rank: 'epic', role: 'guard', desc: 'いわの ような うろこ。やまを ひとつ まもっている。', evo: 'stone:ancient' },
    { name: 'ダイチヴァルグ', rank: 'epic', role: 'guard', desc: 'だいちの ちからを あつめる。ねむると じめんが みどりに なる。' }
  ]},

{ area: 4, type: 'dragon', motif: '星竜と銀河',
  concept: '流れ星と飛ぶ子が、星をひとつ作れるようになる',
  arc: { 初期: 'ながれぼしと いっしょに とぶ', 未熟: 'ひとりでは そらに とどまれない',
         中間: 'からだに ぎんがが ながれる', 最終: 'うちゅうの はてから きた りゅう' },
  members: [
    { name: 'ホシリュウ', rank: 'epic', role: 'speed', desc: 'ながれぼしと いっしょに とぶ。ねがいごとを はこぶと いわれる。', evo: 'lv:46' },
    { name: 'ギンガリュウ', rank: 'epic', role: 'attacker', desc: 'からだに ぎんがが ながれている。よるの そらに とけこむ。', evo: 'stone:moon' },
    { name: 'コスモドラグ', rank: 'legend', role: 'attacker', desc: 'うちゅうの はてから きた りゅう。ほしを ひとつ つくれると いわれる。' }
  ]},

{ area: 4, type: 'psychic', motif: '訪問者と星の地図',
  concept: '言葉は通じないが、星の地図を持ってきた',
  arc: { 初期: 'そらから おりてきた ふしぎな こ', 未熟: 'ことばが つうじない',
         中間: 'こころで きかいを うごかせる', 最終: 'ほしの ちずを ひらいて みちを おしえる' },
  members: [
    { name: 'ホシビト', rank: 'rare', role: 'support', desc: 'そらから おりてきた ふしぎな こ。ことばは つうじないが やさしい。', evo: 'lv:42' },
    { name: 'セイカイジン', rank: 'epic', role: 'attacker', desc: 'きかいを こころで うごかす。ほしの ちずを もっている。', evo: 'lv:55' },
    { name: 'アストラーゼ', rank: 'legend', role: 'attacker', desc: 'ほしの ちずを ひらき、まだ だれも しらない みちを おしえる。' }
  ]},

{ area: 4, type: 'steel', motif: '古代機械と守護',
  concept: '持ち主を探し続ける小さな機械が、街ひとつを守るまで',
  arc: { 初期: 'だれかが つくった ちいさな きかい', 未熟: 'もちぬしが だれか わからない',
         中間: 'めいれいが なくても まちを まもりはじめる', 最終: 'まちを まるごと まもれる。ねむると こうじょうに みえる' },
  members: [
    { name: 'ネジロボ', rank: 'rare', role: 'guard', desc: 'だれかが つくった ちいさな きかい。もちぬしを さがしている。', evo: 'lv:42' },
    { name: 'メカガルド', rank: 'epic', role: 'guard', desc: 'まちを まもるために つくられた。めいれいが なくても はたらく。', evo: 'hold:corepart' },
    { name: 'イグナヴェル', rank: 'legend', role: 'guard', desc: 'まちを まるごと まもれる。ねむると こうじょうに みえる。' }
  ]},

{ area: 4, type: 'steel', motif: '鏡と銀',
  concept: '自分の姿しか映せない子が、相手の心まで映す',
  arc: { 初期: 'ぎんいろの からだが かがみの ように ひかる', 未熟: 'じぶんの すがたしか うつせない',
         中間: 'ちかづいた ものを うつせるように なる', 最終: 'うつした あいての ちからを かえす' },
  members: [
    { name: 'カガミィ', rank: 'rare', role: 'support', desc: 'ぎんいろの からだが かがみの ように ひかる。じぶんが うつる。', evo: 'lv:42' },
    { name: 'ミラーガネ', rank: 'epic', role: 'guard', desc: 'ちかづいた ものを うつす。うつされると すこし ドキッとする。', evo: 'lv:55' },
    { name: 'アルジェント', rank: 'epic', role: 'attacker', desc: 'うつした あいての ちからを そのまま かえす。' }
  ]},

{ area: 4, type: 'ghost', motif: '古い鎧と約束',
  concept: '持ち主を待ち続けた鎧が、約束を守る騎士になる',
  arc: { 初期: 'ふるい よろいに たましいが やどった', 未熟: 'もちぬしを ずっと まっている',
         中間: 'つるぎを かまえて まもりはじめる', 最終: 'やくそくを ぜったいに やぶらない' },
  members: [
    { name: 'ヨロイダマ', rank: 'rare', role: 'guard', desc: 'ふるい よろいに たましいが やどった。もちぬしを まちつづけている。', evo: 'lv:42' },
    { name: 'タマシナイト', rank: 'epic', role: 'attacker', desc: 'つるぎを かまえて まもる。やくそくを ぜったいに やぶらない。', evo: 'lv:55' },
    { name: 'エターナード', rank: 'epic', role: 'attacker', desc: 'まちつづけた ひとに、いつか あえると しんじている。' }
  ]},

{ area: 4, type: 'dark', motif: '夜と静寂',
  concept: '光が苦手な子が、夜そのものになる',
  arc: { 初期: 'かげから かげへ うつる', 未熟: 'ひかりが にがて',
         中間: 'よるを あやつれるように なる', 最終: 'あさが くると しずかに すがたを けす' },
  members: [
    { name: 'ヤミノコ', rank: 'rare', role: 'speed', desc: 'かげから かげへ うつる。ひかりが にがて。', evo: 'lv:42' },
    { name: 'クロマトウ', rank: 'epic', role: 'attacker', desc: 'よるを あやつる。しずかに ちかづいて さっと きえる。', evo: 'stone:dusk' },
    { name: 'ヨルシジマ', rank: 'legend', role: 'attacker', desc: 'よるそのものと よばれる。あさが くると すがたを けす。' }
  ]},

{ area: 4, type: 'fairy', motif: '光と癒し',
  concept: 'ぼんやり光るだけの子が、願いをひとつ叶える',
  arc: { 初期: 'からだが やわらかく ひかる', 未熟: 'ひかりが よわく すぐ きえそうに なる',
         中間: 'しろい はねで つつんで きずを なおす', 最終: 'ほしの ひかりを あつめて いのちを もどす' },
  members: [
    { name: 'ヒカリノコ', rank: 'rare', role: 'healer', desc: 'からだが やわらかく ひかる。くらい ところで みんなを あんしんさせる。', evo: 'lv:42' },
    { name: 'ルミナリア', rank: 'epic', role: 'healer', desc: 'しろい はねで つつんで きずを なおす。うたごえが きれい。', evo: 'stone:moon' },
    { name: 'ステラリーゼ', rank: 'legend', role: 'healer', desc: 'ほしの ひかりを あつめて いのちを もどす。ねがいを ひとつ かなえる。' }
  ]},

{ area: 4, type: 'fire', motif: '不死鳥と再生',
  concept: '何度でも生まれ変わる。だから何度でも挑める',
  arc: { 初期: 'もえる はねを もつ とり', 未熟: 'とぶと はねが もえつきる',
         中間: 'はいから よみがえれると きづく', 最終: 'そらを もやして とぶ。なんども うまれかわる' },
  members: [
    { name: 'ヒノトリコ', rank: 'rare', role: 'attacker', desc: 'もえる はねを もつ とり。とぶと はねが もえつきる。', evo: 'lv:42' },
    { name: 'レンカドリ', rank: 'epic', role: 'attacker', desc: 'はいから よみがえれると きづいた。なんども たちあがる。', evo: 'lv:55' },
    { name: 'フェニクロス', rank: 'legend', role: 'attacker', desc: 'たおれても はいから よみがえる。そらを もやして とぶ。' }
  ]},

{ area: 4, type: 'water', motif: '渦と大洋',
  concept: '渦を作って遊ぶ子が、海ぜんぶと繋がる',
  arc: { 初期: 'うずを つくって およぐ', 未熟: 'じぶんの うずに まきこまれる',
         中間: 'ふねを まもれるように なる', 最終: 'しずかに うみを ととのえる' },
  members: [
    { name: 'ウズマキィ', rank: 'rare', role: 'speed', desc: 'うずを つくって およぐ。じぶんも まきこまれる。', evo: 'lv:42' },
    { name: 'ウズシオン', rank: 'epic', role: 'attacker', desc: 'うずで ふねを まもってくれる。うみの みまわりやく。', evo: 'lv:55' },
    { name: 'オケアノス', rank: 'legend', role: 'guard', desc: 'うみ ぜんぶと つながっている。しずかに うみを ととのえる。' }
  ]},

{ area: 4, type: 'electric', motif: '雷神と太鼓',
  concept: '太鼓を叩くのが好きな子が、嵐の王になる',
  arc: { 初期: 'かみなりぐもに すむ', 未熟: 'たいこを たたきすぎて つかれる',
         中間: 'たたくと かみなりが なると きづく', 最終: 'ならすと そらが ひかりつづける' },
  members: [
    { name: 'ライジンコ', rank: 'rare', role: 'attacker', desc: 'かみなりぐもに すむ。たいこを たたくのが すき。', evo: 'stone:thunder' },
    { name: 'ゴロナルカ', rank: 'epic', role: 'attacker', desc: 'たいこを たたくと かみなりが なると きづいた。', evo: 'lv:55' },
    { name: 'テンライガ', rank: 'legend', role: 'attacker', desc: 'あらしの おうさま。ならすと そらが ひかりつづける。' }
  ]},

{ area: 4, type: 'fight', motif: '二刀と武者',
  concept: 'ひとりで修行する子が、強い相手ほど嬉しくなる',
  arc: { 初期: 'まいにち ひとりで しゅぎょう している', 未熟: 'あいてが いないと はりあいが ない',
         中間: 'ふたつの つるぎを あやつれる', 最終: 'つよい あいてほど うれしそうに わらう' },
  members: [
    { name: 'ブシドウジ', rank: 'rare', role: 'attacker', desc: 'まいにち ひとりで しゅぎょうしている。あいさつを たいせつにする。', evo: 'lv:42' },
    { name: 'ニトウジ', rank: 'epic', role: 'attacker', desc: 'ふたつの つるぎを あやつる。かまえが きれい。', evo: 'lv:55' },
    { name: 'ゲキリンサイ', rank: 'epic', role: 'attacker', desc: 'つよい あいてほど うれしそうに わらう。まけても また くる。' }
  ]},

{ area: 4, type: 'flying', motif: '空鯨と雲',
  concept: '背中に雲をのせて泳ぐ、空の大きな旅人',
  arc: { 初期: 'そらを およぐ ちいさな くじら', 未熟: 'くもに ぶつかって よく とまる',
         中間: 'せなかに くもを のせられる', 最終: 'とおると そらが はれる' },
  members: [
    { name: 'クモクジラ', rank: 'rare', role: 'guard', desc: 'そらを およぐ ちいさな くじら。くもに ぶつかって よく とまる。', evo: 'lv:42' },
    { name: 'ソラクジラ', rank: 'epic', role: 'guard', desc: 'せなかに くもを のせて およぐ。かげが まちを とおる。', evo: 'lv:55' },
    { name: 'アマツクジラ', rank: 'legend', role: 'guard', desc: 'せなかに しまが できるほど おおきい。とおると そらが はれる。' }
  ]},

{ area: 4, type: 'bug', motif: '蛍と夏の夜',
  concept: '光でおしゃべりする子が、夏の夜を星空に変える',
  arc: { 初期: 'おしりが やさしく ひかる', 未熟: 'ひかりが よわくて つたわらない',
         中間: 'なかまと ひかりで はなせる', 最終: 'むれで とぶと ほしぞらに みえる' },
  members: [
    { name: 'ホタルコ', rank: 'rare', role: 'support', desc: 'おしりが やさしく ひかる。なかまと ひかりで はなす。', evo: 'lv:42' },
    { name: 'ホタルーナ', rank: 'epic', role: 'support', desc: 'むれで とぶと ほしぞらの ように みえる。なつの よるの しゅやく。', evo: 'lv:55' },
    { name: 'ルシオラント', rank: 'epic', role: 'support', desc: 'いちばん くらい よるに いちばん あかるく ひかる。' }
  ]},

{ area: 4, type: 'poison', motif: '霧と洞窟',
  concept: '匂いで相手を迷わせる子が、洞窟のぬしになる',
  arc: { 初期: 'むらさきの きりを だす', 未熟: 'じぶんの きりで まいごに なる',
         中間: 'きりの こさを かえられる', 最終: 'ちかづく ものを きりで つつんで かえす' },
  members: [
    { name: 'ムラサキリ', rank: 'rare', role: 'attacker', desc: 'むらさきの きりを だす。じぶんの きりで まいごに なる。', evo: 'lv:42' },
    { name: 'ドクガイオ', rank: 'epic', role: 'attacker', desc: 'きりの こさを かえられる。ふかい どうくつの ぬし。', evo: 'lv:55' },
    { name: 'ミアズマ', rank: 'epic', role: 'attacker', desc: 'ちかづく ものを きりで つつみ、そっと いりぐちへ かえす。' }
  ]},

{ area: 4, type: 'normal', motif: '星のマスコットと願い',
  concept: 'みんなの願いを覚えている、ほしぞらの相棒',
  arc: { 初期: 'ほしの かけらから うまれた', 未熟: 'ねがいを ひとつしか おぼえられない',
         中間: 'せなかの ほしが よるに ひかる', 最終: 'みんなの ねがいを ぜんぶ おぼえている' },
  members: [
    { name: 'ホシュ', rank: 'rare', role: 'balanced', desc: 'ほしの かけらから うまれた あいぼう。ずっと そばに いてくれる。', evo: 'lv:42' },
    { name: 'ホシラン', rank: 'rare', role: 'balanced', desc: 'せなかの ほしが よるに ひかる。ねがいを おぼえはじめた。', evo: 'lv:55' },
    { name: 'セイランドス', rank: 'epic', role: 'balanced', desc: 'みんなの ねがいを ぜんぶ おぼえている。よぞらを せおって たつ。' }
  ]},

{ area: 4, type: 'grass', motif: '世界樹',
  concept: '世界の真ん中に立つ、進化しない完成された存在',
  legendReason: '創造神格。設定上「最初から完成された存在」であることに意味がある',
  arc: { 初期: '—', 未熟: '—', 中間: '—', 最終: 'はっぱ いちまいで もりが よみがえる' },
  members: [
    { name: 'ユグドラシア', rank: 'legend', role: 'healer', desc: 'せかいの まんなかに たつ き。はっぱ いちまいで もりが よみがえる。' }
  ]},

{ area: 4, type: 'psychic', motif: '創造神',
  concept: 'ほしぞらぜんぶを見ている、この世界を作った存在',
  legendReason: 'ラスボス／創造神格。進化前を持たない',
  arc: { 初期: '—', 未熟: '—', 中間: '—', 最終: 'この せかいを つくったと いわれる' },
  members: [
    { name: 'ホシラディア', rank: 'legend', role: 'attacker', desc: 'ほしぞら ぜんぶを みている。この せかいを つくったと いわれる。' }
  ]},

{ area: 4, type: 'ground', motif: '大地の主',
  concept: '大地の奥で眠る、島をひとつ作れる守護神',
  legendReason: 'エリア4の守護神格。動くこと自体が世界の出来事',
  arc: { 初期: '—', 未熟: '—', 中間: '—', 最終: 'うごくと しまが ひとつ できる' },
  members: [
    { name: 'ガイオドール', rank: 'legend', role: 'guard', desc: 'だいちの おくで ねむる ぬし。うごくと しまが ひとつ できる。' }
  ]},

{ area: 4, type: 'rock', motif: '隕石',
  concept: '空から落ちてきた、まだ温かい岩',
  legendReason: '特殊イベント個体。そらから来たものなので進化の前後がない',
  arc: { 初期: '—', 未熟: '—', 中間: '—', 最終: 'まだ すこし あたたかい' },
  members: [
    { name: 'メテオルド', rank: 'epic', role: 'attacker', desc: 'そらから おちてきた いわ。まだ すこし あたたかい。' }
  ]},

{ area: 4, type: 'ice', motif: '吹雪の姫',
  concept: '吹雪の中にだけ現れる、歌声の主',
  legendReason: '特殊イベント個体。ふぶきそのものが姿を借りている',
  arc: { 初期: '—', 未熟: '—', 中間: '—', 最終: 'うたごえが きこえたら ちかい' },
  members: [
    { name: 'シラユキヒメ', rank: 'legend', role: 'attacker', desc: 'ふぶきの なかにだけ あらわれる。うたごえが きこえたら ちかい。' }
  ]}

]
