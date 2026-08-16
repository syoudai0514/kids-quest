// ============================================================
// むずかしいモード（Phase 2 / WP10）— えいご 発展内容
//
// 対象は小4〜6。中学校でならう文法の入り口を8分野で扱う:
//   未来形（will / be going to） / 命令文 / There is/are /
//   前置詞（時・場所の決まり） / 一般動詞の疑問文（Do/Does） /
//   最上級 / 所有代名詞 / 助動詞（must/may/can）
//
// english.js（通常モード）のgrammarQuestion()と同じ形（4択、
// visual.kind:'sentence'）で出題する。会話・単語のスケジューリング
// （chooseEnglishStudyItem等）は複雑なため、hard内容はそこに混ぜず、
// rika-hard.js/shakai-hard.jsと同じ「固定バンク + 明示的な分岐」に
// とどめる。
//
// 通常モードとの分離（計画書§4.2(d)、numbers-hard.js/rika-hard.jsと同じ設計）:
//   - itemKey は必ず `hard:eng:...` の名前空間を使う。
//   - unitId も明示的に `hard:english:...` を持たせる。english.jsの
//     通常文法（ENGLISH_GRAMMAR）や単語・会話の進捗とは名前空間を共有しない。
// ============================================================

// { sentence: 問題文, answer: 正解, distractors: [まちがい選択肢], explain: かいせつ, unit: 単元キー }
const BANK = [
  // ---- 未来形（will / be going to） ----
  { sentence: 'I ___ visit Kyoto next month.', answer: 'will', distractors: ['am', 'was', 'do'], explain: 'next month（来月）は未来のことなので、動詞の前に will を置くよ。', unit: 'future' },
  { sentence: 'She ___ going to make a cake tomorrow.', answer: 'is', distractors: ['are', 'am', 'was'], explain: '主語が she の be going to の文なので、be動詞は is を使うよ。tomorrow（あす）は未来のことだよ。', unit: 'future' },
  { sentence: 'They ___ arrive at the airport tomorrow.', answer: 'will', distractors: ['was', 'did', 'does'], explain: 'tomorrow（あす）の予定を言うときは、動詞の前に will を置くよ。', unit: 'future' },

  // ---- 命令文 ----
  { sentence: '___ the door, please.', answer: 'Close', distractors: ['Closes', 'Closing', 'Closed'], explain: '命令文は主語を言わず、動詞の原形からはじめるよ。', unit: 'imperative' },
  { sentence: '___ quiet in the library.', answer: 'Be', distractors: ['Is', 'Are', 'Being'], explain: 'be動詞の命令文は、原形の Be からはじめるよ。', unit: 'imperative' },
  { sentence: "___ run in the hallway.", answer: "Don't", distractors: ['Not', 'No', "Isn't"], explain: "「〜してはいけない」は、動詞の前に Don't をつけるよ。", unit: 'imperative' },

  // ---- There is/are ----
  { sentence: '___ a cat under the table.', answer: 'There is', distractors: ['There are', 'It is', 'This is'], explain: 'a cat のように1つのものには There is を使うよ。', unit: 'there-is' },
  { sentence: '___ many books on the shelf.', answer: 'There are', distractors: ['There is', 'They are', 'These are'], explain: 'many books のように2つ以上のものには There are を使うよ。', unit: 'there-is' },
  { sentence: 'Is ___ any milk in the fridge?', answer: 'there', distractors: ['it', 'this', 'that'], explain: '「〜はありますか」とたずねるときも there を使うよ。', unit: 'there-is' },

  // ---- 前置詞（時・場所の決まり） ----
  { sentence: 'See you ___ Monday.', answer: 'on', distractors: ['in', 'at', 'for'], explain: '曜日の前には on を使うよ。', unit: 'preposition' },
  { sentence: 'We arrived ___ Tokyo yesterday.', answer: 'in', distractors: ['at', 'on', 'to'], explain: '都市や国の名前の前には in を使うよ（arrive in + 都市）。', unit: 'preposition' },
  { sentence: 'The meeting starts ___ 9 o’clock.', answer: 'at', distractors: ['in', 'on', 'by'], explain: '時こく（〜時）の前には at を使うよ。', unit: 'preposition' },

  // ---- 一般動詞の疑問文（Do/Does） ----
  { sentence: '___ you like tea?', answer: 'Do', distractors: ['Does', 'Are', 'Is'], explain: 'you が主語の一般動詞の疑問文は Do からはじめるよ。', unit: 'do-question' },
  { sentence: '___ your brother play soccer?', answer: 'Does', distractors: ['Do', 'Is', 'Are'], explain: 'your brother（1人）が主語の一般動詞の疑問文は Does を使うよ。', unit: 'do-question' },
  { sentence: 'What time ___ the train leave?', answer: 'does', distractors: ['do', 'is', 'are'], explain: 'the train（1つ）が主語なので does を使うよ。', unit: 'do-question' },

  // ---- 最上級 ----
  { sentence: 'Mt. Fuji is the ___ mountain in Japan.', answer: 'highest', distractors: ['high', 'higher', 'more high'], explain: '3つ以上をくらべて「いちばん」と言うときは、highの最上級 highest を使うよ。', unit: 'superlative' },
  { sentence: 'This is the ___ book of all.', answer: 'most interesting', distractors: ['interesting', 'more interesting', 'interestingest'], explain: 'interesting のような長い語の最上級は、前に most をつけるよ。', unit: 'superlative' },
  { sentence: 'He is the ___ student in the class.', answer: 'youngest', distractors: ['young', 'younger', 'more young'], explain: 'クラスの中でいちばん、とくらべるので youngの最上級 youngest を使うよ。', unit: 'superlative' },

  // ---- 所有代名詞 ----
  { sentence: 'This is not my bag. It belongs to Mika. It is ___.', answer: 'hers', distractors: ['her', 'its', 'theirs'], explain: 'Mika（女の子）のものなので、所有代名詞の hers を使うよ。', unit: 'possessive' },
  { sentence: 'Ken forgot his pencil. Is that pencil ___?', answer: 'his', distractors: ['him', 'he', "he's"], explain: 'Ken（男の子）のものなので、所有代名詞の his を使うよ。', unit: 'possessive' },
  { sentence: 'That house is ___. We live there.', answer: 'ours', distractors: ['our', 'us', "we're"], explain: '「わたしたちのもの」と言うときは、所有代名詞の ours を使うよ。', unit: 'possessive' },

  // ---- 助動詞（must/may/can） ----
  { sentence: 'You ___ finish your homework before dinner.', answer: 'must', distractors: ['can', 'may', 'will'], explain: '「〜しなければならない」という強い義務は must を使うよ。', unit: 'modal' },
  { sentence: '___ I open the window?', answer: 'May', distractors: ['Must', 'Will', 'Do'], explain: 'ていねいに「〜してもいいですか」とたずねるときは May を使うよ。', unit: 'modal' },
  { sentence: 'She ___ speak three languages.', answer: 'can', distractors: ['must', 'should', 'will'], explain: '「〜できる」という能力を表すときは can を使うよ。', unit: 'modal' }
]

const UNIT_LABELS = {
  future: '未来形（will／be going to）', imperative: '命令文', 'there-is': 'There is/are',
  preposition: '前置詞', 'do-question': '一般動詞の疑問文', superlative: '最上級',
  possessive: '所有代名詞', modal: '助動詞'
}
for (const item of BANK) item.unitId = `hard:english:${item.unit}`

export const HARD_ENGLISH_UNIT_IDS = [...new Set(BANK.map((item) => item.unitId))]
export const HARD_ENGLISH_LABELS = Object.fromEntries(Object.entries(UNIT_LABELS).map(([k, v]) => [`hard:english:${k}`, v]))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const BY_SENTENCE = Object.fromEntries(BANK.map((x) => [x.sentence, x]))

let recentSentences = []
const RECENT_MAX = 3
function pickFresh(pool, everSeen) {
  const unseen = everSeen ? pool.filter((it) => !everSeen.has(`hard:eng:${it.sentence}`)) : []
  const source = unseen.length ? unseen : pool.filter((it) => !new Set(recentSentences).has(it.sentence))
  const chosen = pick(source.length ? source : pool)
  recentSentences = [chosen.sentence, ...recentSentences].slice(0, RECENT_MAX)
  return chosen
}

// rika-hard.js と同じ「最長の誤答を必ず含める」対策（正解が単独最長になる
// 見た目のヒントを消すため）。
function build(item, cc) {
  const longestWrong = [...item.distractors].sort((a, b) => b.length - a.length)[0]
  const otherWrong = shuffle(item.distractors.filter((value) => value !== longestWrong)).slice(0, Math.max(1, cc - 2))
  const opts = shuffle([item.answer, longestWrong, ...otherWrong])
  return {
    domain: 'english',
    unitId: item.unitId,
    skillId: item.unitId,
    type: 'choice',
    form: 'grammar',
    itemKey: `hard:eng:${item.sentence}`,
    visual: { kind: 'sentence', text: item.sentence },
    instruction: '文に あう ことばを えらぼう',
    speak: '文に あう ことばを えらぼう。',
    choices: opts.map((v) => ({ id: v, label: v })),
    answerId: item.answer,
    answerWord: { text: item.answer },
    explain: item.explain
  }
}

export function generateHardEnglishQuestion(params, reviewKey = null) {
  const cc = Math.max(3, params.choiceCount || 3)
  if (reviewKey && reviewKey.startsWith('hard:eng:')) {
    const it = BY_SENTENCE[reviewKey.slice('hard:eng:'.length)]
    if (it) return build(it, cc)
  }
  return build(pickFresh(BANK, params.everSeenKnowledge), cc)
}

export const HARD_ENGLISH_QUESTIONS = BANK.map((item) => item.sentence)
