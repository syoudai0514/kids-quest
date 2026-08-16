// えいご — 絵・音・意味を結び付ける、端末内完結の教材データ。
// カタカナの発音表記は置かず、音声は en-US で読む。

import { generateHardEnglishQuestion } from './hard/english-hard.js'

const rawWords = [
  ['greeting','hello','こんにちは','👋',0],['greeting','goodbye','さようなら','👋',0],['greeting','thank you','ありがとう','🙏',0],['greeting','please','おねがい','😊',0],['greeting','yes','はい','⭕',0],['greeting','no','いいえ','❌',0],
  ['animal','dog','いぬ','🐶',0],['animal','cat','ねこ','🐱',0],['animal','bird','とり','🐦',0],['animal','fish','さかな','🐟',0],['animal','rabbit','うさぎ','🐰',0],['animal','bear','くま','🐻',0],['animal','lion','ライオン','🦁',1],['animal','elephant','ぞう','🐘',1],['animal','giraffe','きりん','🦒',1],['animal','monkey','さる','🐵',1],['animal','tiger','とら','🐯',1],['animal','frog','かえる','🐸',1],['animal','penguin','ペンギン','🐧',2],['animal','dolphin','イルカ','🐬',2],
  ['food','apple','りんご','🍎',0],['food','banana','バナナ','🍌',0],['food','orange','みかん','🍊',0],['food','grape','ぶどう','🍇',0],['food','strawberry','いちご','🍓',0],['food','bread','パン','🍞',0],['food','rice','ごはん','🍚',1],['food','egg','たまご','🥚',1],['food','milk','ぎゅうにゅう','🥛',0],['food','water','みず','💧',0],['food','juice','ジュース','🧃',0],['food','cake','ケーキ','🍰',1],['food','pizza','ピザ','🍕',1],['food','carrot','にんじん','🥕',1],['food','tomato','トマト','🍅',1],['food','ice cream','アイスクリーム','🍦',1],
  ['color','red','あか','🔴',0],['color','blue','あお','🔵',0],['color','yellow','きいろ','🟡',0],['color','green','みどり','🟢',0],['color','pink','ピンク','🩷',0],['color','black','くろ','⚫',1],['color','white','しろ','⚪',1],['color','purple','むらさき','🟣',1],['color','brown','ちゃいろ','🟤',1],['color','orange','オレンジ色','🟠',1],
  ['number','one','1','1️⃣',0],['number','two','2','2️⃣',0],['number','three','3','3️⃣',0],['number','four','4','4️⃣',0],['number','five','5','5️⃣',0],['number','six','6','6️⃣',1],['number','seven','7','7️⃣',1],['number','eight','8','8️⃣',1],['number','nine','9','9️⃣',1],['number','ten','10','🔟',1],
  ['body','eye','め','👁️',0],['body','ear','みみ','👂',0],['body','nose','はな（かお）','👃',0],['body','mouth','くち','👄',0],['body','hand','て','✋',0],['body','foot','足（足首から先）','🦶',0],['body','head','あたま','🙂',1],['body','tooth','は','🦷',1],['body','arm','うで','💪',1],['body','leg','脚（ももから足首）','🦵',1],
  ['family','mother','おかあさん','👩',0],['family','father','おとうさん','👨',0],['family','sister','おねえさん／いもうと','👧',1],['family','brother','おにいさん／おとうと','👦',1],['family','baby','あかちゃん','👶',0],['family','family','かぞく','👨‍👩‍👧‍👦',1],['family','grandmother','おばあちゃん','👵',2],['family','grandfather','おじいちゃん','👴',2],
  ['school','book','ほん','📘',0],['school','pen','ペン','🖊️',0],['school','pencil','えんぴつ','✏️',0],['school','bag','かばん','🎒',0],['school','desk','つくえ','🪑',1],['school','school','がっこう','🏫',0],['school','teacher','せんせい','🧑‍🏫',1],['school','eraser','けしごむ','🧽',1],['school','ruler','ものさし','📏',1],['school','notebook','ノート','📓',1],
  ['home','house','いえ','🏠',0],['home','door','ドア','🚪',0],['home','window','まど','🪟',0],['home','bed','ベッド','🛏️',0],['home','table','テーブル','🪑',1],['home','chair','いす','🪑',0],['home','clock','とけい','🕐',1],['home','key','かぎ','🔑',1],['home','phone','でんわ','📱',1],['home','ball','ボール','⚽',0],
  ['action','run','はしる','🏃',0],['action','walk','あるく','🚶',0],['action','jump','ジャンプする','🦘',0],['action','swim','およぐ','🏊',1],['action','eat','たべる','😋',0],['action','drink','のむ','🥤',0],['action','sleep','ねる','😴',0],['action','read','よむ','📖',1],['action','write','かく','✍️',1],['action','play','あそぶ','🧸',0],['action','open','あける','🔓',1],['action','close','しめる','🔒',1],
  ['feeling','happy','うれしい','😊',0],['feeling','sad','かなしい','😢',0],['feeling','angry','おこっている','😠',1],['feeling','tired','つかれた','😴',1],['feeling','hungry','おなかがすいた','🍽️',1],['feeling','scared','こわい','😨',1],['feeling','good','げんき／よい','👍',0],['feeling','fine','げんきだよ','😄',1],
  ['weather','sunny','はれ','☀️',0],['weather','rainy','あめ','🌧️',0],['weather','cloudy','くもり','☁️',0],['weather','snowy','ゆき','❄️',1],['weather','hot','あつい','🥵',1],['weather','cold','さむい','🥶',1],['weather','spring','はる','🌸',1],['weather','summer','なつ','🌻',1],['weather','autumn','あき','🍁',1],['weather','winter','ふゆ','⛄',1],
  // 曜日を月・火・水などの絵で表すと、moon / fire 等の英単語と誤結合する。
  // 曜日は共通のカレンダー表示にし、文字と発音で学ぶ（絵問題の対象外）。
  ['time','Monday','げつようび','📅',2],['time','Tuesday','かようび','📅',2],['time','Wednesday','すいようび','📅',2],['time','Thursday','もくようび','📅',2],['time','Friday','きんようび','📅',2],['time','Saturday','どようび','📅',2],['time','Sunday','にちようび','📅',2],['time','morning','あさ','🌅',1],['time','night','よる','🌙',1],['time','today','きょう','📅',1],
  ['nature','sun','たいよう','☀️',0],['nature','moon','つき','🌙',0],['nature','star','ほし','⭐',0],['nature','tree','き','🌳',0],['nature','flower','はな（お花）','🌸',0],['nature','mountain','やま','⛰️',1],['nature','sea','うみ','🌊',1],['nature','sky','そら','🌤️',1],['nature','rainbow','にじ','🌈',1],['nature','fire','ひ','🔥',1],
  ['place','park','こうえん','🏞️',1],['place','station','えき','🚉',2],['place','shop','おみせ','🏪',1],['place','hospital','びょういん','🏥',2],['place','zoo','どうぶつえん','🦁',1],['place','library','としょかん','📚',2],['place','bathroom','おてあらい','🚻',1],['place','kitchen','だいどころ','🍳',1],
  ['vehicle','car','くるま','🚗',0],['vehicle','bus','バス','🚌',0],['vehicle','train','でんしゃ','🚃',1],['vehicle','airplane','ひこうき','✈️',1],['vehicle','boat','ふね','🚢',1],['vehicle','bicycle','じてんしゃ','🚲',1],['vehicle','ambulance','きゅうきゅうしゃ','🚑',3],['vehicle','fire truck','しょうぼうしゃ','🚒',3],
  ['clothes','shirt','シャツ','👕',1],['clothes','pants','ズボン','👖',1],['clothes','shoes','くつ','👟',1],['clothes','hat','ぼうし','🧢',1],['clothes','dress','ドレス','👗',2],['clothes','sock','くつした','🧦',2],['clothes','coat','コート','🧥',2],['clothes','umbrella','かさ','☂️',1],
  ['shape','circle','まる','⭕',1],['shape','square','しかく','🟦',1],['shape','triangle','さんかく','🔺',1],['shape','heart','ハート','❤️',1],['shape','diamond','ひし形','🔶',1],['shape','line','せん','➖',2],
  ['computer','computer','コンピューター','💻',2],['computer','keyboard','キーボード','⌨️',2],['computer','mouse','マウス','🖱️',2],['computer','camera','カメラ','📷',2],['computer','game','ゲーム','🎮',1],['computer','music','おんがく','🎵',1],['computer','picture','え','🖼️',1],['computer','toy','おもちゃ','🧸',0],
  ['extra','day','日・昼間','🌞',1],['extra','week','しゅう','📆',2],['extra','year','とし','🎆',2],['extra','birthday','たんじょうび','🎂',1],['extra','party','パーティー','🎉',2],['extra','gift','プレゼント','🎁',1],['extra','question','しつもん','❓',2],['extra','answer','こたえ','💡',2],['extra','again','もういちど','🔁',1],['extra','stop','とまる','🛑',1],
  ['extra','big','おおきい','🐘',1],['extra','small','ちいさい','🐜',1],['extra','new','あたらしい','✨',2],['extra','old','ふるい','🏚️',2],['extra','fast','はやい','💨',2],['extra','slow','ゆっくり','🐢',2],['extra','friend','ともだち','🧑‍🤝‍🧑',1],['extra','love','だいすき','❤️',2],['extra','robot','ロボット','🤖',1],['extra','rocket','ロケット','🚀',1],
  // 小4: 教科・学校行事・学校の場所・持ち物（1カテゴリの語数はテーマ表示上限12に収める）
  ['subject','Japanese','こくご','📕',4],['subject','math','さんすう','🔢',4],['subject','science','りか','🧪',4],['subject','social studies','しゃかい','🌏',4],['subject','art','ずこう','🎨',4],['subject','P.E.','たいいく','🤸',4],['subject','English','えいご','🔤',4],['subject','moral education','どうとく','💛',4],['subject','home economics','かていか','🧵',4],['subject','calligraphy','しょどう','🖌️',4],
  ['schoolevent','homework','しゅくだい','📝',4],['schoolevent','test','テスト','📄',4],['schoolevent','textbook','きょうかしょ','📗',4],['schoolevent','timetable','じかんわり','🗓️',4],['schoolevent','period','じかんめ','⏰',4],['schoolevent','lunch time','きゅうしょくの じかん','🍱',4],['schoolevent','recess','きゅうけいじかん','🔔',4],['schoolevent','sports day','うんどうかい','🏅',4],['schoolevent','field trip','えんそく','🧭',4],['schoolevent','graduation','そつぎょうしき','🎓',4],['schoolevent','entrance ceremony','にゅうがくしき','🎌',4],['schoolevent','club activity','クラブかつどう','🏸',4],
  ['schoolplace','gym','たいいくかん','🏟️',4],['schoolplace','announcement','ほうそう','📢',4],['schoolplace','locker','ロッカー','🗄️',4],['schoolplace','principal','こうちょう先生','🧑‍💼',4],['schoolplace','nurse\'s office','ほけんしつ','🩹',4],['schoolplace','playground','うんどうじょう','🛝',4],['schoolplace','staff room','しょくいんしつ','🗃️',4],['schoolplace','auditorium','こうどう','🎭',4],
  ['supply','scissors','はさみ','✂️',4],['supply','calculator','けいさんき','🧮',4],['supply','paper clip','クリップ','📎',4],['supply','crayon','クレヨン','🖍️',4],['supply','tissue','ティッシュ','🧻',4],['supply','vacation','きゅうか','🏖️',4],['supply','glue','のり','🧴',4],['supply','pencil case','ふでばこ','🧳',4],
  ['supply','compass','コンパス','🧭',4],['supply','folder','ファイル','📁',4],
  // 小5: 職業・日課・道案内
  ['job','doctor','いしゃ','🩺',5],['job','nurse','かんごし','💉',5],['job','police officer','けいかん','👮',5],['job','firefighter','しょうぼうし','🧑‍🚒',5],['job','farmer','のうか','🚜',5],['job','cook','りょうりにん','👨‍🍳',5],['job','baker','パンや','🥖',5],['job','astronaut','うちゅうひこうし','👨‍🚀',5],['job','pilot','パイロット','🧑‍✈️',5],['job','singer','かしゅ','🎤',5],['job','artist','がか','👩‍🎨',5],['job','scientist','かがくしゃ','🧑‍🔬',5],
  ['job2','vet','じゅういし','🐾',5],['job2','driver','うんてんしゅ','🚕',5],['job2','carpenter','だいく','🔨',5],['job2','fisherman','りょうし','🎣',5],['job2','designer','デザイナー','✒️',5],['job2','programmer','プログラマー','🧑‍💻',5],
  ['job2','dentist','はいしゃ','🦷',5],['job2','mechanic','せいびし','🔧',5],['job2','photographer','しゃしんか','📷',5],['job2','translator','ほんやくか','🗣️',5],
  ['routine','wake up','おきる','🌄',5],['routine','brush teeth','はを みがく','🪥',5],['routine','wash face','かおを あらう','🧼',5],['routine','get dressed','ふくを きる','👚',5],['routine','go to bed','ねる じかん','🌜',5],['routine','take a bath','おふろに はいる','🛁',5],['routine','clean','そうじする','🧹',5],['routine','help','てつだう','🤝',5],['routine','water plants','みずやりする','🪴',5],
  ['direction','straight','まっすぐ','⬆️',5],['direction','turn left','ひだりに まがる','⬅️',5],['direction','turn right','みぎに まがる','➡️',5],['direction','corner','かど','📍',5],['direction','bridge','はし','🌉',5],['direction','crosswalk','おうだんほどう','🚸',5],['direction','traffic light','しんごう','🚦',5],['direction','map','ちず','🗺️',5],['direction','sign','かんばん','🪧',5],
  // 小6: 国・文化・将来の夢
  ['country','Japan','にほん','🇯🇵',6],['country','America','アメリカ','🇺🇸',6],['country','China','ちゅうごく','🇨🇳',6],['country','Korea','かんこく','🇰🇷',6],['country','England','イギリス','🇬🇧',6],['country','France','フランス','🇫🇷',6],['country','Australia','オーストラリア','🇦🇺',6],['country','India','インド','🇮🇳',6],['country','Brazil','ブラジル','🇧🇷',6],['country','Egypt','エジプト','🇪🇬',6],
  ['culture','world','せかい','🌍',6],['culture','language','げんご','🗣️',6],['culture','tradition','でんとう','⛩️',6],['culture','festival','おまつり','🎏',6],['culture','kimono','きもの','👘',6],['culture','flag','こっき','🏳️',6],['culture','history','れきし','📜',6],
  ['culture','culture','ぶんか','🏛️',6],['culture','continent','たいりく','🗺️',6],['culture','peace','へいわ','🕊️',6],['culture','environment','かんきょう','🌱',6],['culture','international','こくさいてきな','🌐',6],
  ['dream','future','みらい','🔮',6],['dream','dream','ゆめ','💭',6],['dream','hope','きぼう','🌠',6],['dream','engineer','ぎじゅつしゃ','⚙️',6],['dream','athlete','うんどう せんしゅ','🏆',6],['dream','musician','おんがくか','🎻',6],['dream','goal','もくひょう','🥅',6],['dream','effort','どりょく','💯',6],['dream','challenge','ちょうせん','🧗',6],
  ['schoolstep','junior high school','ちゅうがっこう','🏢',6],['schoolstep','study abroad','りゅうがく','🛫',6],['schoolstep','graduate','そつぎょうする','🎊',6],['schoolstep','exam','じゅけん','🖋️',6],['schoolstep','target','もくてき','🎯',6],
  ['schoolstep','volunteer','ボランティア','🤝',6],['schoolstep','university','だいがく','🎓',6],['schoolstep','career','しょうらいの しごと','🧭',6],['schoolstep','communicate','つたえあう','💬',6]
]

// 絵を使えるかは「重複していないか」ではなく教材として明示する。連想絵は false。
// 抽象語・行為・制度名は、絵を見ても答えを一つに決められない（💛から
// moral education は当てられない）。これらは絵問題に使わず、英単語を見て
// 意味を選ぶ形式で学ぶ。generateEnglishQuestion が自動で切り替える。
const PICTURE_INELIGIBLE = new Set([
  'jump', 'eraser', 'summer', 'small', 'slow',
  // 小4: 教科名・行事・制度は絵で表せない
  'Japanese', 'math', 'science', 'social studies', 'art', 'P.E.', 'English', 'moral education', 'home economics', 'calligraphy',
  'homework', 'test', 'textbook', 'timetable', 'period', 'lunch time', 'recess', 'sports day', 'field trip', 'graduation', 'entrance ceremony', 'club activity',
  'gym', 'announcement', 'locker', 'principal', "nurse's office", 'staff room', 'auditorium',
  'calculator', 'tissue', 'vacation', 'glue', 'pencil case', 'compass', 'folder',
  // 小5: 道具の絵から職業名は決まらない。日課は行為なので絵にできない
  'doctor', 'nurse', 'farmer', 'baker', 'singer',
  'vet', 'driver', 'carpenter', 'fisherman', 'designer', 'programmer', 'dentist', 'mechanic', 'photographer', 'translator',
  'wake up', 'brush teeth', 'wash face', 'get dressed', 'go to bed', 'take a bath', 'clean', 'help', 'water plants',
  'straight', 'turn left', 'turn right', 'corner',
  // 小6: 文化・将来の夢はどれも抽象語
  'language', 'tradition', 'history', 'culture', 'continent', 'peace', 'environment', 'international',
  'future', 'dream', 'hope', 'engineer', 'athlete', 'musician', 'goal', 'effort', 'challenge',
  'junior high school', 'study abroad', 'graduate', 'exam', 'target', 'volunteer', 'university', 'career', 'communicate'
])
export const ENGLISH_WORDS = rawWords.map(([category, english, japanese, emoji, minGrade], i) => ({
  id: `ew${String(i + 1).padStart(3, '0')}`, category, english, japanese, emoji, minGrade, speak: english,
  pictureEligible: category !== 'time' && !PICTURE_INELIGIBLE.has(english)
}))

const phraseRows = [
 ['Hello.','こんにちは。','あいさつ','Hi!'],['Good morning.','おはよう。','あいさつ','Good morning!'],['Good night.','おやすみ。','あいさつ','Good night!'],['How are you?','げんき？','あいさつ','I am fine.'],['I am fine.','げんきだよ。','あいさつ','That is good!'],['Thank you.','ありがとう。','あいさつ','You are welcome.'],['You are welcome.','どういたしまして。','あいさつ','Thank you.'],['Nice to meet you.','はじめまして。','あいさつ','Nice to meet you, too.'],['What is your name?','なまえは なに？','自己紹介','My name is Kai.'],['My name is Kai.','わたしの なまえは カイです。','自己紹介','Nice to meet you.'],
 ['I like apples.','わたしは りんごが すき。','好きなもの','Me too!'],['I like dogs.','わたしは いぬが すき。','好きなもの','Me too!'],['Do you like cats?','ねこは すき？','好きなもの','Yes, I do.'],['Yes, I do.','うん、すき。','返事','Great!'],['No, I do not.','いいえ、すきじゃない。','返事','Okay.'],['This is a cat.','これは ねこです。','もの紹介','It is cute.'],['It is cute.','それは かわいいね。','もの紹介','Thank you.'],['I have a dog.','わたしは いぬを かっている。','家族・ペット','Nice!'],["Let's play.",'あそぼう。','あそび','Okay!'],["Let's go.",'いこう。','移動','Okay!'],
 ['What color is it?','それは なにいろ？','色','It is red.'],['It is red.','それは あかです。','色','Red is nice.'],['How many?','いくつ？','数','Three.'],['Three.','3つです。','数','Great!'],['What time is it?','なんじ？','時刻',"It's seven o'clock."],["It's seven o'clock.",'7じです。','時刻','Thank you.'],['Today is Monday.','きょうは げつようび。','曜日','Yes.'],['It is sunny.','はれです。','天気',"Let's play outside."],['It is rainy.','あめです。','天気','Take an umbrella.'],['I am happy.','わたしは うれしい。','気持ち','Me too!'],
 ['I am hungry.','おなかがすいた。','気持ち','Let us eat.'],['I am thirsty.','のどがかわいた。','気持ち','Here is water.'],['Please help me.','たすけてください。','お願い','Okay.'],['Can I have water?','みずを もらえますか？','お願い','Here you are.'],['Here you are.','どうぞ。','やりとり','Thank you.'],['Excuse me.','すみません。','やりとり','Yes?'],['I am sorry.','ごめんなさい。','やりとり','That is okay.'],['See you tomorrow.','また あした。','別れ','See you!'],['See you later.','また あとでね。','別れ','See you!'],['Have a nice day.','よい いちにちを。','あいさつ','Thank you!'],
 ['Where is the ball?','ボールは どこ？','場所','It is here.'],['It is here.','ここに あるよ。','場所','Thank you.'],['I can run.','わたしは はしれる。','できること','Great!'],['I can swim.','わたしは およげる。','できること','Great!'],['Open the door.','ドアを あけて。','指示','Okay.'],['Close the door.','ドアを しめて。','指示','Okay.'],['Please sit down.','すわってください。','教室','Okay.'],['Please stand up.','たってください。','教室','Okay.'],['What is this?','これは なに？','質問','It is a book.'],['It is a book.','これは ほんです。','もの紹介','Nice!']
]
// 文脈によって自然に成立する返事を「まちがい」にしない。会話ごとの専用候補は、
// 意味が明確にずれる文だけに限定する（全項目で固定3択を使わない）。
const PHRASE_DISTRACTORS = [
  ['I am sorry.', 'It is blue.', 'I have two cats.'], ['It is rainy.', 'I am hungry.', 'It is seven.'], ['I am thirsty.', 'It is red.', 'I can swim.'], ['It is three.', 'It is sunny.', 'I have a dog.'], ['It is here.', 'I am happy.', 'It is Monday.']
]
export const ENGLISH_PHRASES = phraseRows.map(([english, japanese, scene, response], i) => ({
  id: `ep${String(i + 1).padStart(3, '0')}`, english, japanese, scene, response,
  distractors: PHRASE_DISTRACTORS[i % PHRASE_DISTRACTORS.length].filter((x) => x !== response),
  minGrade: i < 20 ? 0 : i < 38 ? 2 : 4, speak: english
}))

// 小4〜6の「読むこと・書くこと」へつなぐ文法問題。会話とは別形式だが、
// 進捗は既存の englishPhraseStats に eg*** IDで保存し、セーブ形式を増やさない。
const grammarRows = [
  ['wh',4,'___ is your birthday?','When',['Where','Who','How'],'日や時をたずねるときは When を使うよ。'],
  ['wh',4,'___ is your favorite sport?','What',['Where','When','Who'],'何かをたずねるときは What を使うよ。'],
  ['plural',4,'I have two ___.','books',['book','bookes','bookses'],'two の後ろは、bookを複数形の books にするよ。'],
  ['plural',4,'There are three ___.','boxes',['box','boxs','boxies'],'boxのようにxで終わる語は es をつけて boxes にするよ。'],
  ['third-person',5,'He ___ soccer after school.','plays',['play','played','playing'],'主語が he の現在の習慣では、動詞に s をつけて plays にするよ。'],
  ['third-person',5,'My sister ___ English.','studies',['study','studied','studying'],'主語が my sister の現在の習慣では、studyを studies にするよ。'],
  ['past',5,'I ___ to the park yesterday.','went',['go','goes','will go'],'yesterdayは過去なので、goの過去形 went を使うよ。'],
  ['past',5,'We ___ dinner at seven yesterday.','ate',['eat','eats','will eat'],'昨日のことなので、eatの過去形 ate を使うよ。'],
  ['wh',5,'___ do you live?','Where',['What','When','Who'],'場所をたずねるときは Where を使うよ。'],
  ['wh',5,'___ did you go with?','Who',['What','Where','When'],'だれと行ったかをたずねるときは Who を使うよ。'],
  ['comparison',6,'A train is ___ than a bicycle.','faster',['fast','fastest','more fast'],'二つをくらべ、thanがあるので fastの比較級 faster を使うよ。'],
  ['comparison',6,'This bag is ___ than that one.','heavier',['heavy','heaviest','more heavy'],'二つをくらべるとき、heavyは yをiにかえて er をつけるよ。'],
  ['past',6,'She ___ a letter last night.','wrote',['write','writes','writing'],'last nightは過去なので、writeの過去形 wrote を使うよ。'],
  ['third-person',6,'Ken ___ breakfast every morning.','eats',['eat','ate','eating'],'Ken一人の毎朝の習慣なので、eatに s をつけるよ。'],
  ['plural',6,'We saw five ___.','children',['child','childs','childrens'],'childの複数形は特別な形の children だよ。']
]
export const ENGLISH_GRAMMAR = grammarRows.map(([kind, minGrade, sentence, answer, distractors, explain], i) => ({
  id: `eg${String(i + 1).padStart(3, '0')}`, kind, minGrade, sentence, english: sentence,
  japanese: '文法', answer, distractors, explain
}))

// へんじ（response）は英語しか持たないため、解説で意味が伝わらなかった。
// 「Can I have water? には Here you are. とこたえられるよ」だけでは、
// 訳が無いと子ども・保護者に伝わらない。返答の日本語訳をここで補う。
const RESPONSE_JAPANESE = {
  'Hi!': 'やあ！',
  'Good morning!': 'おはよう！',
  'Good night!': 'おやすみ！',
  'I am fine.': 'げんきだよ。',
  'That is good!': 'それは よかったね！',
  'You are welcome.': 'どういたしまして。',
  'Thank you.': 'ありがとう。',
  'Nice to meet you, too.': 'こちらこそ、はじめまして。',
  'My name is Kai.': 'わたしの なまえは カイです。',
  'Nice to meet you.': 'はじめまして。',
  'Me too!': 'わたしも！',
  'Yes, I do.': 'うん、すき。',
  'Great!': 'すごい！',
  'Okay.': 'わかった。',
  'It is cute.': 'それは かわいいね。',
  'Nice!': 'いいね！',
  'Okay!': 'オーケー！',
  'It is red.': 'それは あかです。',
  'Red is nice.': 'あかは いいね。',
  'Three.': '3つです。',
  "It's seven o'clock.": '7じです。',
  'Yes.': 'うん。',
  "Let's play outside.": 'そとで あそぼう。',
  'Take an umbrella.': 'かさを もってね。',
  'Let us eat.': 'たべよう。',
  'Here is water.': 'みず、どうぞ。',
  'Here you are.': 'どうぞ。',
  'Yes?': 'なに？',
  'That is okay.': 'だいじょうぶだよ。',
  'See you!': 'またね！',
  'Thank you!': 'ありがとう！',
  'It is here.': 'ここに あるよ。',
  'It is a book.': 'これは ほんです。'
}

export const ENGLISH_CATEGORIES = {
  greeting: 'あいさつ', animal: 'どうぶつ', food: 'たべもの・のみもの', color: 'いろ', number: 'かず', body: 'からだ', family: 'かぞく', school: '学校・もちもの', home: '家・身のまわり', action: 'うごき', feeling: '気持ち', weather: '天気・季節', time: '曜日・時間', nature: 'しぜん', place: 'ばしょ', vehicle: 'のりもの', clothes: 'ふく・もちもの', shape: 'かたち', computer: 'コンピューター', extra: 'そのほか',
  subject: '教科', schoolevent: '学校行事', schoolplace: '学校のばしょ', supply: 'がっこうの もちもの',
  job: 'しごと', job2: 'しごと２', routine: '毎日の生活', direction: '道あんない',
  country: '国', culture: '文化・世界', dream: 'ゆめ・目標', schoolstep: '中学校・進学'
}

function shuffle(values) { const a = [...values]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const clean = (value) => String(value || '').trim().toLocaleLowerCase()
export function normalizeEnglishKey(key) {
  const raw = String(key || '').split('#')[0]
  if (/^en:ew\d+$/i.test(raw)) return `enw:${raw.slice(3)}`
  if (/^en:ep\d+$/i.test(raw)) return `enp:${raw.slice(3)}`
  if (/^en:[A-Z]-[A-Z]$/i.test(raw)) return `ena:${raw.slice(3).toUpperCase()}`
  if (/^ena:[A-Z]-[A-Z]$/i.test(raw)) return `ena:${raw.slice(4).toUpperCase()}`
  return raw
}
const baseKey = (key) => normalizeEnglishKey(key).replace(/^(?:en[wap]|eng):/, '')
const localDayNumber = (date = new Date()) => Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000)
function eligibleWords(params) { const items = ENGLISH_WORDS.filter((w) => w.minGrade <= (params.grade ?? 0)); return items.length >= 4 ? items : ENGLISH_WORDS.slice(0, 8) }
function eligiblePhrases(params) { return ENGLISH_PHRASES.filter((p) => p.minGrade <= (params.grade ?? 0)) }
function eligibleGrammar(params) { return ENGLISH_GRAMMAR.filter((item) => item.minGrade <= (params.grade ?? 0)) }
function itemFromKey(key) {
  const id = baseKey(key)
  return ENGLISH_WORDS.find((w) => w.id === id) || ENGLISH_PHRASES.find((p) => p.id === id) || ENGLISH_GRAMMAR.find((item) => item.id === id) || null
}

// 初日に学年分の全単語へ飛ばず、8〜12語程度のテーマを順番に開く。
const THEME_ORDER = ['greeting', 'color', 'number', 'animal', 'food', 'body', 'family', 'school', 'home', 'action', 'feeling', 'weather', 'nature', 'place', 'vehicle', 'clothes', 'shape', 'computer', 'time', 'extra', 'subject', 'schoolevent', 'schoolplace', 'supply', 'job', 'job2', 'routine', 'direction', 'country', 'culture', 'dream', 'schoolstep']
function currentThemeWords(params) {
  const all = eligibleWords(params)
  const stats = params.englishWordStats || {}
  for (const category of THEME_ORDER) {
    const theme = all.filter((word) => word.category === category).slice(0, 12)
    if (theme.length && theme.some((word) => (stats[word.id]?.stage || 0) < 1)) return theme
  }
  return all
}

// 同じ表示を選ばせる問題は、子どもが意味を思い出さずに当てられる。
// 正解も誤答も、表示する文字・絵文字が必ず一意になるようここで保証する。
function makeChoices(answer, pool, { label = 'english', emoji = false, count = 4 } = {}) {
  const used = new Set([clean(answer[label])])
  if (emoji) used.add(`emoji:${answer.emoji}`)
  const candidates = shuffle(pool.filter((item) => item.id !== answer.id)).filter((item) => {
    const text = clean(item[label])
    const emojiKey = `emoji:${item.emoji}`
    if (!text || used.has(text) || (emoji && used.has(emojiKey))) return false
    used.add(text)
    if (emoji) used.add(emojiKey)
    return true
  }).slice(0, count - 1)
  return shuffle([answer, ...candidates]).map((item) => ({ id: item.id, label: emoji ? '' : item[label], emoji: emoji ? item.emoji : undefined }))
}

function selectByStudyOrder(items, stats, seen, today) {
  const usable = items.filter((item) => !seen.has(item.id))
  const pool = usable.length ? usable : items
  const stat = (item) => stats?.[item.id] || {}
  const due = pool.filter((item) => (stat(item).stage || 0) > 0 && (stat(item).nextDue ?? Infinity) <= today)
  const unseen = pool.filter((item) => !due.includes(item) && !(stat(item).correct || 0) && !(stat(item).wrong || 0))
  const wrong = pool.filter((item) => !due.includes(item) && !unseen.includes(item) && (stat(item).wrong || 0) > 0)
  const learned = pool.filter((item) => !due.includes(item) && !unseen.includes(item) && !wrong.includes(item))
  const first = due.length ? due : unseen.length ? unseen : wrong.length ? wrong : learned
  return shuffle(first)[0] || items[0]
}

export function chooseEnglishStudyItem(params = {}) {
  const grade = params.grade ?? 0
  const seen = new Set((params.seenItemKeys || []).map(baseKey))
  const forced = itemFromKey(params.reviewKey || params.focusWordId)
  if (forced && forced.minGrade <= grade) return forced
  const words = currentThemeWords(params)
  const phrases = eligiblePhrases(params)
  const grammar = eligibleGrammar(params)
  const canUsePhrases = grade >= 3 && phrases.length > 0 && params.englishAudioAvailable !== false
  const roll = Math.random()
  const all = grammar.length && grade >= 4 && roll < 0.22
    ? grammar
    : canUsePhrases && roll < (grade >= 5 ? 0.52 : 0.36) ? phrases : words
  const stats = all === words ? params.englishWordStats : params.englishPhraseStats
  return selectByStudyOrder(all, stats, seen, params.today ?? localDayNumber())
}

function wordBase(word) {
  return { domain: 'english', itemKey: `enw:${word.id}`, answerWord: { text: word.english }, practiceEnglish: word.speak, explain: `${word.english} は「${word.japanese}」だよ` }
}

// 絵文字は便利な反面、🌙=moon / Monday のように別の単語を誤って結び付ける。
// 「聞く」「絵から英語」を出すのは、教材全体でその絵が一つの意味だけを表す語に
// 限定する。曜日は記号ではなく文字の問題で学ぶ。
function hasUnambiguousPicture(word) {
  return !!word.pictureEligible && ENGLISH_WORDS.filter((entry) => entry.emoji === word.emoji).length === 1
}

function pictureSafeWords(params) {
  return eligibleWords(params).filter(hasUnambiguousPicture)
}

// P.E. のように英字が2文字以下の語は、1文字隠すと手掛かりが残らない
// （「P. _ .」）。スペル問題の対象は3文字以上の語に限る。
function spellableWords(params) {
  return eligibleWords(params).filter((word) => [...word.english].filter((letter) => /[a-z]/i.test(letter)).length >= 3)
}

function displayEnglish(word) {
  const same = ENGLISH_WORDS.filter((entry) => entry.english === word.english)
  return same.length > 1 ? `${word.english}（${ENGLISH_CATEGORIES[word.category]}）` : word.english
}

function listeningQuestion(word, pool, params) {
  return { ...wordBase(word), type: 'choice', form: 'listen-picture', visual: { kind: 'bigtext', text: '🔊 Listen!' }, instruction: 'きいて、ただしい えを えらぼう', speak: 'えいごを きいて、ただしい えを えらぼう。', promptEnglishAudio: word.speak, autoPlayPrompt: true, choices: makeChoices(word, pool, { emoji: true, count: params.choiceCount || 4 }), answerId: word.id }
}
function pictureQuestion(word, pool, params) {
  return { ...wordBase(word), type: 'choice', form: 'picture-word', visual: { kind: 'emoji', emoji: word.emoji }, instruction: 'えに あう えいごを えらぼう', speak: 'この えは、えいごで なんて いう？', choices: makeChoices(word, pool, { label: 'english', count: params.choiceCount || 4 }), answerId: word.id }
}
function meaningQuestion(word, pool, params) {
  // 英単語そのものが問題文なので、音は正解を余計に教えるヒントにはならない。
  return { ...wordBase(word), type: 'choice', form: 'word-meaning', visual: { kind: 'word', text: displayEnglish(word) }, instruction: 'いみを えらぼう', speak: 'えいごの いみを えらぼう。', promptEnglishAudio: word.speak, autoPlayPrompt: true, choices: makeChoices(word, pool, { label: 'japanese', count: params.choiceCount || 4 }), answerId: word.id }
}
function japaneseQuestion(word, pool, params) {
  return { ...wordBase(word), type: 'choice', form: 'japanese-word', visual: { kind: 'bigtext', text: word.japanese }, instruction: 'えいごを えらぼう', speak: `${word.japanese} は どの えいご？`, choices: makeChoices(word, pool, { label: 'english', count: params.choiceCount || 4 }), answerId: word.id }
}
function spellingQuestion(word) {
  const letterIndexes = [...word.english].map((letter, index) => /[a-z]/i.test(letter) ? index : -1).filter((index) => index >= 0)
  const index = letterIndexes[Math.floor(letterIndexes.length / 2)]
  const answer = word.english[index].toLowerCase()
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const options = shuffle([answer, ...shuffle(alphabet.filter((letter) => letter !== answer)).slice(0, 3)])
  // ここで単語を音で読んでしまうと、空欄の答えまで先に教えてしまう。
  // スペル問題は、見えている文字だけを手がかりに考えさせる。
  return { ...wordBase(word), type: 'choice', form: 'spelling', visual: { kind: 'bigtext', text: `${word.english.slice(0, index)} _ ${word.english.slice(index + 1)}` }, instruction: 'ぬけた アルファベットを えらぼう', speak: 'ぬけた アルファベットを えらぼう。', choices: options.map((letter) => ({ id: `letter:${letter}`, label: letter.toUpperCase() })), answerId: `letter:${answer}`, explain: `${word.english} の まんなかの もじは ${answer.toUpperCase()} だよ` }
}
function alphabetQuestion(params = {}, reviewKey = null) {
  const order = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const pairs = order.slice(0, 22).map((letter, index) => `${letter}-${order[index + 1]}`)
  const forced = normalizeEnglishKey(reviewKey || params.reviewKey)
  const requested = forced.match(/^ena:([A-Z])-([A-Z])$/)
  let pair = requested && order[order.indexOf(requested[1]) + 1] === requested[2] ? `${requested[1]}-${requested[2]}` : null
  if (!pair) {
    const stats = params.englishAlphabetStats || {}
    const groups = []
    for (let i = 0; i < pairs.length; i += 4) groups.push(pairs.slice(i, i + 4))
    const group = groups.find((items) => items.some((id) => (stats[id]?.stage || 0) < 1)) || groups.find((items) => items.some((id) => (stats[id]?.nextDue ?? Infinity) <= (params.today ?? localDayNumber()))) || groups.at(-1)
    const seen = new Set((params.seenItemKeys || []).map((key) => baseKey(key).replace(/^ena:/, '')))
    const usable = group.filter((id) => !seen.has(id))
    pair = (usable.length ? usable : group)[Math.floor(Math.random() * (usable.length || group.length))]
  }
  const [base, next] = pair.split('-')
  // 同じ項目を進めるたびに「次の大文字→小文字→文字名」と形式を回す。
  const variant = (params.englishAlphabetStats?.[pair]?.stage || 0) % 3
  const itemKey = `ena:${pair}`
  if (variant === 1) {
    const answer = base.toLowerCase()
    const lower = order.map((letter) => letter.toLowerCase())
    const options = shuffle([answer, ...shuffle(lower.filter((letter) => letter !== answer)).slice(0, 3)])
    return { domain: 'english', itemKey, type: 'choice', form: 'alphabet-lowercase', visual: { kind: 'bigtext', text: base }, instruction: 'おなじ もじの こもじを えらぼう', speak: 'おなじ もじの こもじを えらぼう。', choices: options.map((letter) => ({ id: `letter:${letter}`, label: letter })), answerId: `letter:${answer}`, answerWord: { text: `${base}, ${answer}` }, explain: `${base} の こもじは ${answer} だよ` }
  }
  if (variant === 2) {
    const options = shuffle([base, ...shuffle(order.filter((letter) => letter !== base)).slice(0, 3)])
    return { domain: 'english', itemKey, type: 'choice', form: 'alphabet-name', visual: { kind: 'bigtext', text: '🔊 Listen!' }, instruction: 'きこえた もじを えらぼう', speak: 'えいごの もじの なまえを きこう。', promptEnglishAudio: base, autoPlayPrompt: true, practiceEnglish: base, choices: options.map((letter) => ({ id: `letter:${letter}`, label: letter })), answerId: `letter:${base}`, answerWord: { text: base }, explain: `きこえた もじは ${base} だよ` }
  }
  const options = shuffle([next, ...shuffle(order.filter((letter) => letter !== next)).slice(0, 3)])
  return { domain: 'english', itemKey, type: 'choice', form: 'alphabet', visual: { kind: 'bigtext', text: `${base} → ?` }, instruction: 'つぎの アルファベットを えらぼう', speak: 'つぎの アルファベットを えらぼう。', choices: options.map((letter) => ({ id: `letter:${letter}`, label: letter })), answerId: `letter:${next}`, answerWord: { text: next }, explain: `${base} の つぎは ${next} だよ` }
}
function phraseQuestion(phrase, params) {
  const response = { id: phrase.id, response: phrase.response }
  // 会話の誤答は、ほかの会話の「たまたま自然な返答」を混ぜない。全表現で
  // 正解は一つだけに固定し、表示用IDも会話項目のIDと分離する。
  const distractors = phrase.distractors
    .filter((text) => text !== phrase.response)
    .map((response, index) => ({ id: `wrong:${phrase.id}:${index}`, response }))
  const choices = shuffle([response, ...distractors]).map((item) => ({ id: item.id, label: item.response }))
  // 回答前に練習するのは問い掛けだけ。正解の返事を先に読ませない。
  const responseJp = RESPONSE_JAPANESE[phrase.response]
  return { domain: 'english', type: 'choice', form: 'conversation', itemKey: `enp:${phrase.id}`, visual: { kind: 'word', text: phrase.english }, instruction: 'ぴったりの へんじを えらぼう', speak: 'ぴったりの へんじを えらぼう。', promptEnglishAudio: phrase.english, autoPlayPrompt: true, practiceEnglish: phrase.english, choices, answerId: phrase.id, answerWord: { text: phrase.response }, explain: `${phrase.english}（${phrase.japanese}）には「${phrase.response}」${responseJp ? `（${responseJp}）` : ''}と こたえられるよ` }
}
function orderQuestion(phrase) {
  const tokens = phrase.english.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null
  const items = shuffle(tokens.map((label, index) => ({ id: `w${index}`, label })))
  const correctOrder = tokens.map((_, index) => `w${index}`)
  return { domain: 'english', type: 'order', form: 'word-order', itemKey: `enp:${phrase.id}`, visual: { kind: 'bigtext', text: phrase.japanese }, instruction: 'えいごの じゅんばんに ならべよう', orderInstruction: 'ひだりから じゅんに タッチしてね', speak: 'えいごの じゅんばんに ならべよう。', items, correctOrder, answerId: correctOrder.join('|'), answerWord: { text: phrase.english }, practiceEnglish: phrase.english, explain: `${phrase.japanese} は「${phrase.english}」だよ` }
}

function grammarQuestion(item) {
  const options = shuffle([item.answer, ...item.distractors])
  return {
    domain: 'english', type: 'choice', form: 'grammar', itemKey: `eng:${item.id}`,
    visual: { kind: 'sentence', text: item.sentence },
    instruction: '文に あう ことばを えらぼう',
    speak: '文に あう ことばを えらぼう。',
    choices: options.map((text) => ({ id: `grammar:${text}`, label: text })),
    answerId: `grammar:${item.answer}`,
    answerWord: { text: item.answer },
    explain: item.explain
  }
}

export function englishTaskForms(grade = 0, englishAudioAvailable = false) {
  if (englishAudioAvailable) {
    if (grade <= 0) return ['listen-picture', 'picture-word', 'word-meaning', 'alphabet']
    if (grade <= 2) return ['listen-picture', 'picture-word', 'word-meaning', 'spelling']
    if (grade <= 3) return ['listen-picture', 'picture-word', 'conversation', 'word-order']
    if (grade === 4) return ['listen-picture', 'word-meaning', 'grammar', 'word-order']
    return ['listen-picture', 'conversation', 'grammar', 'word-order']
  }
  if (grade <= 0) return ['picture-word', 'word-meaning', 'picture-word', 'alphabet']
  if (grade <= 2) return ['picture-word', 'word-meaning', 'japanese-word', 'spelling']
  if (grade <= 3) return ['picture-word', 'word-meaning', 'japanese-word', 'spelling']
  if (grade === 4) return ['word-meaning', 'grammar', 'word-order', 'spelling']
  return ['word-meaning', 'grammar', 'word-order', 'spelling']
}

// 通常タスクでは、正答済みの同一語を繰り返さない。各設問を別枠にする。
// 誤答だけはActivityPlayerが2問後に同じ設問を補強として差し込む。
export function englishTaskItemSlot(forms, questionIndex) {
  return Math.min(questionIndex, Math.max(0, forms.length - 1))
}

export function generateEnglishQuestion(params = {}, reviewKey) {
  const grade = params.grade ?? 0
  // むずかしいモード（保護者設定, 対象は小4〜6）。単語・会話のスケジューリング
  // （chooseEnglishStudyItem等）は複雑なため、hard内容はそこに混ぜず、
  // 通常のreviewKey判定より前で分岐する（rika.js/shakai.jsのhard分岐と同じ設計）。
  // hard専用の itemKey（hard:eng:xxx）は通常の単語・会話・文法の進捗と
  // 名前空間を共有しない（計画書§4.2(d)）。
  if (params.mode === 'hard' && grade >= 4) {
    const hard = generateHardEnglishQuestion(params, reviewKey || params.reviewKey)
    if (hard) return hard
  }
  let requestedForm = params.forceForm || params.taskForm
  // 図鑑・期限復習・誤答補強は形式より項目を優先する。対象が絵に不向きなら
  // 同じ項目の文字問題へ切り替える（別単語にはしない）。
  const normalizedReview = normalizeEnglishKey(reviewKey || params.reviewKey || params.focusWordId)
  if (/^ena:/.test(normalizedReview)) return alphabetQuestion(params, normalizedReview)
  const requestedItem = itemFromKey(normalizedReview)
  // テスト・復習から形式を明示しても、再生できない音声を必要とする問題は作らない。
  if (params.englishAudioAvailable === false && ['listen-picture', 'conversation'].includes(requestedForm)) {
    requestedForm = grade >= 5 ? 'word-order' : 'picture-word'
  }
  const forcedItemPool = !requestedItem && requestedForm
    ? (requestedForm === 'listen-picture' || requestedForm === 'picture-word'
      ? pictureSafeWords(params)
      : requestedForm === 'word-order'
      ? eligiblePhrases(params).filter((phrase) => phrase.english.replace(/[.!?]/g, '').trim().split(/\s+/).length >= 2)
      : requestedForm === 'conversation'
      ? eligiblePhrases(params)
      : requestedForm === 'grammar'
      ? eligibleGrammar(params)
      : requestedForm === 'spelling' ? spellableWords(params) : eligibleWords(params))
    : null
  const forcedStats = ['conversation', 'word-order', 'grammar'].includes(requestedForm) ? params.englishPhraseStats : params.englishWordStats
  const item = requestedItem || (forcedItemPool
    ? selectByStudyOrder(forcedItemPool, forcedStats, new Set((params.seenItemKeys || []).map(baseKey)), params.today ?? localDayNumber())
    : chooseEnglishStudyItem({ ...params, reviewKey: normalizedReview }))
  const grammar = ENGLISH_GRAMMAR.find((entry) => entry.id === item.id)
  if (grammar) return grammarQuestion(grammar)
  const word = ENGLISH_WORDS.find((entry) => entry.id === item.id)
  if (!word) {
    const phrase = item
    if (requestedForm === 'word-order' || (!requestedForm && grade >= 5 && Math.random() < 0.45)) return orderQuestion(phrase) || phraseQuestion(phrase, params)
    return phraseQuestion(phrase, params)
  }
  const modes = params.englishAudioAvailable === false
    ? grade <= 0 ? ['picture', 'alphabet'] : grade <= 2 ? ['picture', 'meaning', 'spelling'] : ['picture', 'meaning', 'japanese', 'spelling']
    : grade <= 0 ? ['listen', 'picture', 'alphabet'] : grade <= 2 ? ['listen', 'picture', 'meaning', 'spelling'] : grade <= 4 ? ['listen', 'picture', 'meaning', 'japanese'] : ['listen', 'meaning', 'japanese', 'spelling']
  const forceMode = { 'listen-picture': 'listen', 'picture-word': 'picture', 'word-meaning': 'meaning', 'japanese-word': 'japanese', spelling: 'spelling', alphabet: 'alphabet' }[requestedForm]
  let mode = forceMode || modes[Math.floor(Math.random() * modes.length)]
  const stage = params.englishWordStats?.[word.id]?.stage || 0
  if (!params.forceForm && stage < 2 && ['spelling', 'japanese'].includes(mode)) mode = hasUnambiguousPicture(word) ? 'picture' : 'meaning'
  // とっくん・試練のように形式計画を持たない出題経路でも、あいまいな絵を
  // 使わせない。英単語を見て意味を選ぶ形式へ安全に切り替える。
  if ((mode === 'listen' || mode === 'picture') && !hasUnambiguousPicture(word)) mode = 'meaning'
  // P.E. のように英字が2文字以下の語は、1文字隠すと「P. _ .」となり
  // 手掛かりが残らない。穴埋めが成立する語だけスペル問題にする。
  if (mode === 'spelling' && [...word.english].filter((letter) => /[a-z]/i.test(letter)).length < 3) mode = 'meaning'
  const pool = mode === 'listen' || mode === 'picture' ? pictureSafeWords(params) : eligibleWords(params)
  if (mode === 'listen') return listeningQuestion(word, pool, params)
  if (mode === 'picture') return pictureQuestion(word, pool, params)
  if (mode === 'meaning') return meaningQuestion(word, pool, params)
  if (mode === 'japanese') return japaneseQuestion(word, pool, params)
  if (mode === 'alphabet') return alphabetQuestion(params, normalizedReview)
  return spellingQuestion(word)
}

export function englishStatus(stat) { const stage = stat?.stage || 0; return stage >= 5 ? 'おぼえた！' : stage >= 4 ? 'もうすぐ おぼえる' : stage >= 1 ? 'れんしゅう中' : 'はじめて' }
