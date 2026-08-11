// えいご — 絵・音・意味を結び付ける、端末内完結の教材データ。
// カタカナの発音表記は置かず、音声は en-US で読む。

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
  ['time','Monday','げつようび','🌙',2],['time','Tuesday','かようび','🔥',2],['time','Wednesday','すいようび','💧',2],['time','Thursday','もくようび','🌳',2],['time','Friday','きんようび','✨',2],['time','Saturday','どようび','🪐',2],['time','Sunday','にちようび','☀️',2],['time','morning','あさ','🌅',1],['time','night','よる','🌙',1],['time','today','きょう','📅',1],
  ['nature','sun','たいよう','☀️',0],['nature','moon','つき','🌙',0],['nature','star','ほし','⭐',0],['nature','tree','き','🌳',0],['nature','flower','はな（お花）','🌸',0],['nature','mountain','やま','⛰️',1],['nature','sea','うみ','🌊',1],['nature','sky','そら','🌤️',1],['nature','rainbow','にじ','🌈',1],['nature','fire','ひ','🔥',1],
  ['place','park','こうえん','🏞️',1],['place','station','えき','🚉',2],['place','shop','おみせ','🏪',1],['place','hospital','びょういん','🏥',2],['place','zoo','どうぶつえん','🦁',1],['place','library','としょかん','📚',2],['place','bathroom','おてあらい','🚻',1],['place','kitchen','だいどころ','🍳',1],
  ['vehicle','car','くるま','🚗',0],['vehicle','bus','バス','🚌',0],['vehicle','train','でんしゃ','🚃',1],['vehicle','airplane','ひこうき','✈️',1],['vehicle','boat','ふね','🚢',1],['vehicle','bicycle','じてんしゃ','🚲',1],['vehicle','ambulance','きゅうきゅうしゃ','🚑',3],['vehicle','fire truck','しょうぼうしゃ','🚒',3],
  ['clothes','shirt','シャツ','👕',1],['clothes','pants','ズボン','👖',1],['clothes','shoes','くつ','👟',1],['clothes','hat','ぼうし','🧢',1],['clothes','dress','ドレス','👗',2],['clothes','sock','くつした','🧦',2],['clothes','coat','コート','🧥',2],['clothes','umbrella','かさ','☂️',1],
  ['shape','circle','まる','⭕',1],['shape','square','しかく','🟦',1],['shape','triangle','さんかく','🔺',1],['shape','heart','ハート','❤️',1],['shape','diamond','ひし形','🔶',1],['shape','line','せん','➖',2],
  ['computer','computer','コンピューター','💻',2],['computer','keyboard','キーボード','⌨️',2],['computer','mouse','マウス','🖱️',2],['computer','camera','カメラ','📷',2],['computer','game','ゲーム','🎮',1],['computer','music','おんがく','🎵',1],['computer','picture','え','🖼️',1],['computer','toy','おもちゃ','🧸',0],
  ['extra','day','日・昼間','🌞',1],['extra','week','しゅう','📆',2],['extra','year','とし','🎆',2],['extra','birthday','たんじょうび','🎂',1],['extra','party','パーティー','🎉',2],['extra','gift','プレゼント','🎁',1],['extra','question','しつもん','❓',2],['extra','answer','こたえ','💡',2],['extra','again','もういちど','🔁',1],['extra','stop','とまる','🛑',1],
  ['extra','big','おおきい','🐘',1],['extra','small','ちいさい','🐜',1],['extra','new','あたらしい','✨',2],['extra','old','ふるい','🏚️',2],['extra','fast','はやい','💨',2],['extra','slow','ゆっくり','🐢',2],['extra','friend','ともだち','🧑‍🤝‍🧑',1],['extra','love','だいすき','❤️',2],['extra','robot','ロボット','🤖',1],['extra','rocket','ロケット','🚀',1]
]

export const ENGLISH_WORDS = rawWords.map(([category, english, japanese, emoji, minGrade], i) => ({ id: `ew${String(i + 1).padStart(3, '0')}`, category, english, japanese, emoji, minGrade, speak: english }))

const phraseRows = [
 ['Hello.','こんにちは。','あいさつ','Hi!'],['Good morning.','おはよう。','あいさつ','Good morning!'],['Good night.','おやすみ。','あいさつ','Good night!'],['How are you?','げんき？','あいさつ','I am fine.'],['I am fine.','げんきだよ。','あいさつ','That is good!'],['Thank you.','ありがとう。','あいさつ','You are welcome.'],['You are welcome.','どういたしまして。','あいさつ','Thank you.'],['Nice to meet you.','はじめまして。','あいさつ','Nice to meet you, too.'],['What is your name?','なまえは なに？','自己紹介','My name is Kai.'],['My name is Kai.','わたしの なまえは カイです。','自己紹介','Nice to meet you.'],
 ['I like apples.','わたしは りんごが すき。','好きなもの','Me too!'],['I like dogs.','わたしは いぬが すき。','好きなもの','Me too!'],['Do you like cats?','ねこは すき？','好きなもの','Yes, I do.'],['Yes, I do.','うん、すき。','返事','Great!'],['No, I do not.','いいえ、すきじゃない。','返事','Okay.'],['This is a cat.','これは ねこです。','もの紹介','It is cute.'],['It is cute.','それは かわいいね。','もの紹介','Thank you.'],['I have a dog.','わたしは いぬを かっている。','家族・ペット','Nice!'],['Let us play.','あそぼう。','あそび','Okay!'],['Let us go.','いこう。','移動','Okay!'],
 ['What color is it?','それは なにいろ？','色','It is red.'],['It is red.','それは あかです。','色','Red is nice.'],['How many?','いくつ？','数','Three.'],['It is three.','3つです。','数','Great!'],['What time is it?','なんじ？','時刻','It is seven.'],['It is seven.','7じです。','時刻','Thank you.'],['Today is Monday.','きょうは げつようび。','曜日','Yes.'],['It is sunny.','はれです。','天気','Let us play outside.'],['It is rainy.','あめです。','天気','Take an umbrella.'],['I am happy.','わたしは うれしい。','気持ち','Me too!'],
 ['I am hungry.','おなかがすいた。','気持ち','Let us eat.'],['I am thirsty.','のどがかわいた。','気持ち','Here is water.'],['Please help me.','たすけてください。','お願い','Okay.'],['Can I have water?','みずを もらえますか？','お願い','Here you are.'],['Here you are.','どうぞ。','やりとり','Thank you.'],['Excuse me.','すみません。','やりとり','Yes?'],['I am sorry.','ごめんなさい。','やりとり','That is okay.'],['See you tomorrow.','また あした。','別れ','See you!'],['See you later.','また あとでね。','別れ','See you!'],['Have a nice day.','よい いちにちを。','あいさつ','Thank you!'],
 ['Where is the ball?','ボールは どこ？','場所','It is here.'],['It is here.','ここに あるよ。','場所','Thank you.'],['I can run.','わたしは はしれる。','できること','Great!'],['I can swim.','わたしは およげる。','できること','Great!'],['Open the door.','ドアを あけて。','指示','Okay.'],['Close the door.','ドアを しめて。','指示','Okay.'],['Please sit down.','すわってください。','教室','Okay.'],['Please stand up.','たってください。','教室','Okay.'],['What is this?','これは なに？','質問','It is a book.'],['It is a book.','これは ほんです。','もの紹介','Nice!']
]
export const ENGLISH_PHRASES = phraseRows.map(([english, japanese, scene, response], i) => ({ id: `ep${String(i + 1).padStart(3, '0')}`, english, japanese, scene, response, minGrade: i < 20 ? 0 : i < 38 ? 2 : 4, speak: english }))

export const ENGLISH_CATEGORIES = {
  greeting: 'あいさつ', animal: 'どうぶつ', food: 'たべもの・のみもの', color: 'いろ', number: 'かず', body: 'からだ', family: 'かぞく', school: '学校・もちもの', home: '家・身のまわり', action: 'うごき', feeling: '気持ち', weather: '天気・季節', time: '曜日・時間', nature: 'しぜん', place: 'ばしょ', vehicle: 'のりもの', clothes: 'ふく・もちもの', shape: 'かたち', computer: 'コンピューター', extra: 'そのほか'
}

function shuffle(values) { const a = [...values]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const clean = (value) => String(value || '').trim().toLocaleLowerCase()
const baseKey = (key) => String(key || '').split('#')[0].replace(/^en[wp]?:/, '')
const localDayNumber = (date = new Date()) => Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000)
function eligibleWords(params) { const items = ENGLISH_WORDS.filter((w) => w.minGrade <= (params.grade ?? 0)); return items.length >= 4 ? items : ENGLISH_WORDS.slice(0, 8) }
function eligiblePhrases(params) { return ENGLISH_PHRASES.filter((p) => p.minGrade <= (params.grade ?? 0)) }
function itemFromKey(key) {
  const id = baseKey(key)
  return ENGLISH_WORDS.find((w) => w.id === id) || ENGLISH_PHRASES.find((p) => p.id === id) || null
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
  const words = eligibleWords(params)
  const phrases = eligiblePhrases(params)
  const canUsePhrases = grade >= 3 && phrases.length > 0 && params.englishAudioAvailable !== false
  const all = canUsePhrases && Math.random() < (grade >= 5 ? 0.42 : 0.28) ? phrases : words
  const stats = all === phrases ? params.englishPhraseStats : params.englishWordStats
  return selectByStudyOrder(all, stats, seen, params.today ?? localDayNumber())
}

function wordBase(word) {
  return { domain: 'english', itemKey: `enw:${word.id}`, answerWord: { text: word.english }, practiceEnglish: word.speak, explain: `${word.english} は「${word.japanese}」だよ` }
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
  return { ...wordBase(word), type: 'choice', form: 'word-meaning', visual: { kind: 'word', text: displayEnglish(word) }, instruction: 'いみを えらぼう', speak: 'えいごの いみを えらぼう。', choices: makeChoices(word, pool, { label: 'japanese', count: params.choiceCount || 4 }), answerId: word.id }
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
  return { ...wordBase(word), type: 'choice', form: 'spelling', visual: { kind: 'bigtext', text: `${word.english.slice(0, index)} _ ${word.english.slice(index + 1)}` }, instruction: 'ぬけた アルファベットを えらぼう', speak: 'ぬけた アルファベットを えらぼう。', choices: options.map((letter) => ({ id: `letter:${letter}`, label: letter.toUpperCase() })), answerId: `letter:${answer}`, explain: `${word.english} の まんなかの もじは ${answer.toUpperCase()} だよ` }
}
function alphabetQuestion(params = {}) {
  const order = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const seen = new Set((params.seenItemKeys || []).map(baseKey))
  const bases = order.slice(0, 22).filter((letter) => !seen.has(`ena:${letter}-${order[order.indexOf(letter) + 1]}`))
  const base = (bases.length ? bases : order.slice(0, 22))[Math.floor(Math.random() * (bases.length || 22))]
  const index = order.indexOf(base)
  const answer = order[index + 1]
  const options = shuffle([answer, ...shuffle(order.filter((letter) => letter !== answer)).slice(0, 3)])
  return { domain: 'english', itemKey: `ena:${base}-${answer}`, type: 'choice', form: 'alphabet', visual: { kind: 'bigtext', text: `${base} → ?` }, instruction: 'つぎの アルファベットを えらぼう', speak: 'つぎの アルファベットを えらぼう。', choices: options.map((letter) => ({ id: `letter:${letter}`, label: letter })), answerId: `letter:${answer}`, answerWord: { text: answer }, explain: `${base} の つぎは ${answer} だよ` }
}
function phraseQuestion(phrase, params) {
  const response = { id: phrase.id, response: phrase.response }
  // 会話の誤答は、ほかの会話の「たまたま自然な返答」を混ぜない。全表現で
  // 正解は一つだけに固定し、表示用IDも会話項目のIDと分離する。
  const distractors = ['I am sorry.', 'Please wait.', 'I do not know.']
    .filter((text) => text !== phrase.response)
    .map((response, index) => ({ id: `wrong:${phrase.id}:${index}`, response }))
  const choices = shuffle([response, ...distractors]).map((item) => ({ id: item.id, label: item.response }))
  return { domain: 'english', type: 'choice', form: 'conversation', itemKey: `enp:${phrase.id}`, visual: { kind: 'word', text: phrase.english }, instruction: 'ぴったりの へんじを えらぼう', speak: 'ぴったりの へんじを えらぼう。', promptEnglishAudio: phrase.english, autoPlayPrompt: true, practiceEnglish: phrase.response, choices, answerId: phrase.id, answerWord: { text: phrase.response }, explain: `${phrase.english} には「${phrase.response}」と こたえられるよ` }
}
function orderQuestion(phrase) {
  const tokens = phrase.english.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null
  const items = shuffle(tokens.map((label, index) => ({ id: `w${index}`, label })))
  const correctOrder = tokens.map((_, index) => `w${index}`)
  return { domain: 'english', type: 'order', form: 'word-order', itemKey: `enp:${phrase.id}`, visual: { kind: 'bigtext', text: phrase.japanese }, instruction: 'えいごの じゅんばんに ならべよう', orderInstruction: 'ひだりから じゅんに タッチしてね', speak: 'えいごの じゅんばんに ならべよう。', items, correctOrder, answerId: correctOrder.join('|'), answerWord: { text: phrase.english }, practiceEnglish: phrase.english, explain: `${phrase.japanese} は「${phrase.english}」だよ` }
}

export function englishTaskForms(grade = 0, englishAudioAvailable = false) {
  if (englishAudioAvailable) {
    if (grade <= 0) return ['listen-picture', 'listen-picture', 'picture-word', 'alphabet']
    if (grade <= 2) return ['listen-picture', 'picture-word', 'word-meaning', 'spelling']
    if (grade <= 4) return ['listen-picture', 'picture-word', 'conversation', 'word-meaning']
    return ['listen-picture', 'word-meaning', 'word-order', 'spelling']
  }
  if (grade <= 0) return ['picture-word', 'alphabet', 'picture-word', 'alphabet']
  if (grade <= 2) return ['picture-word', 'word-meaning', 'japanese-word', 'spelling']
  if (grade <= 4) return ['picture-word', 'word-meaning', 'japanese-word', 'spelling']
  return ['picture-word', 'word-meaning', 'word-order', 'spelling']
}

export function generateEnglishQuestion(params = {}, reviewKey) {
  const grade = params.grade ?? 0
  let requestedForm = params.forceForm || params.taskForm
  // テスト・復習から形式を明示しても、再生できない音声を必要とする問題は作らない。
  if (params.englishAudioAvailable === false && ['listen-picture', 'conversation'].includes(requestedForm)) {
    requestedForm = grade >= 5 ? 'word-order' : 'picture-word'
  }
  const forcedItemPool = requestedForm
    ? (requestedForm === 'word-order'
      ? eligiblePhrases(params).filter((phrase) => phrase.english.replace(/[.!?]/g, '').trim().split(/\s+/).length >= 2)
      : requestedForm === 'conversation' ? eligiblePhrases(params) : eligibleWords(params))
    : null
  const forcedStats = requestedForm === 'conversation' || requestedForm === 'word-order' ? params.englishPhraseStats : params.englishWordStats
  const item = forcedItemPool
    ? selectByStudyOrder(forcedItemPool, forcedStats, new Set((params.seenItemKeys || []).map(baseKey)), params.today ?? localDayNumber())
    : chooseEnglishStudyItem({ ...params, reviewKey })
  const word = ENGLISH_WORDS.find((entry) => entry.id === item.id)
  if (!word) {
    const phrase = item
    if (requestedForm === 'word-order' || (!requestedForm && grade >= 5 && Math.random() < 0.45)) return orderQuestion(phrase) || phraseQuestion(phrase, params)
    return phraseQuestion(phrase, params)
  }
  const pool = eligibleWords(params)
  const modes = params.englishAudioAvailable === false
    ? grade <= 0 ? ['picture', 'alphabet'] : grade <= 2 ? ['picture', 'meaning', 'spelling'] : ['picture', 'meaning', 'japanese', 'spelling']
    : grade <= 0 ? ['listen', 'picture', 'alphabet'] : grade <= 2 ? ['listen', 'picture', 'meaning', 'spelling'] : grade <= 4 ? ['listen', 'picture', 'meaning', 'japanese'] : ['listen', 'meaning', 'japanese', 'spelling']
  const forceMode = { 'listen-picture': 'listen', 'picture-word': 'picture', 'word-meaning': 'meaning', 'japanese-word': 'japanese', spelling: 'spelling', alphabet: 'alphabet' }[requestedForm]
  const mode = forceMode || modes[Math.floor(Math.random() * modes.length)]
  if (mode === 'listen') return listeningQuestion(word, pool, params)
  if (mode === 'picture') return pictureQuestion(word, pool, params)
  if (mode === 'meaning') return meaningQuestion(word, pool, params)
  if (mode === 'japanese') return japaneseQuestion(word, pool, params)
  if (mode === 'alphabet') return alphabetQuestion(params)
  return spellingQuestion(word)
}

export function englishStatus(stat) { const stage = stat?.stage || 0; return stage >= 4 ? 'おぼえた！' : stage >= 3 ? 'もうすぐ おぼえる' : stage >= 1 ? 'れんしゅう中' : 'はじめて' }
