// ============================================================
// むずかしいモード（Phase 2 / WP10）— こくご 発展内容
//
// 対象は小4〜6。四字熟語・ことわざ(発展)/熟語の構成/同訓異字/
// 敬語(文への応用)/文法(品詞)/説明文・物語文の読解(長め)を扱う。
//
// 通常モードとの分離（計画書§4.2(d)、numbers-hard.jsと同じ設計）:
//   - itemKey は必ず `hard:yomu:...` の名前空間を使う。
//   - GameContext.jsx の ANSWER reducer が 'hard:' 接頭辞を見て
//     srs/skills/unitStats/domainAccuracy を 'hard:yomu' へ切り分ける。
//   - unitId も明示的に `hard:yomu:xxx` を持たせる。unitLedger() は
//     readingUnits() など固定リストからしか単元を集めないため、
//     ここで作る unitId は進級必須単元に一切混ざらない。
//   - ほしのしれん（trialQuestions.js）はこのモジュールを呼ばない。
//
// 回答形式: 語い・文法の知識問題なので、算数(hard)のような数値入力
// ではなく、通常モードと同じ4択（type:'choice'）のままにする。
// ============================================================

import { HARD_YOMU_ADVANCE_LABELS } from './yomu-advance-hard.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function eligible(pool, grade) {
  return pool.filter((item) => (item.minGrade ?? 4) <= grade)
}

function pickUnseenFirst(pool, everSeen, keyOf) {
  if (everSeen) {
    const unseen = pool.filter((item) => !everSeen.has(keyOf(item)))
    if (unseen.length) return shuffle(unseen)[0]
  }
  return shuffle(pool)[0]
}

// 意味文を選択肢にする形式（四字熟語・ことわざ）は、書き下ろした説明文の
// 字数がそのまま長さのヒントになりやすい。手作業で全項目の字数を
// そろえるのは壊れやすいので、「答えと字数が近いものを優先して」誤答に
// 選ぶことで、どの項目が正解でも長さでは当てられないようにする。
function lengthBalancedDistractors(pool, exclude, textOf, n) {
  const targetLen = textOf(exclude).length
  const ranked = pool
    .filter((it) => it !== exclude)
    .map((it) => ({ text: textOf(it), diff: Math.abs(textOf(it).length - targetLen) }))
    .sort((a, b) => a.diff - b.diff)
  const window = ranked.slice(0, Math.max(n + 3, n * 3))
  return shuffle(window).slice(0, n).map((r) => r.text)
}

// ------------------------------------------------------------
// 1. 四字熟語（発展）
// ------------------------------------------------------------
const YOJI_HARD = [
  { word: '起死回生', meaning: 'だめになりかけた物事を、立て直してよい方に向かわせること', note: '「死にかけた者を起こして生き返らせる」という意味からきているよ。', minGrade: 6 },
  { word: '千載一遇', meaning: 'めったにやってこない、とても良い機会のこと', note: '「千年に一度しかめぐり会えない」ほどまれ、という意味からきているよ。', minGrade: 6 },
  { word: '適材適所', meaning: 'その人の能力に合った、ふさわしい仕事や地位につけること', note: '「材」は人材、「所」は場所を表しているよ。', minGrade: 5 },
  { word: '我田引水', meaning: '自分に都合のよいように、物事を考えたり進めたりすること', note: '「自分の田んぼにだけ水を引く」という意味からきているよ。', minGrade: 6 },
  { word: '単刀直入', meaning: '前置きなしに、いきなり本題に入っていくこと', note: '「一本の刀を持って、ただ一人で敵に切りこむ」という意味からきているよ。', minGrade: 6 },
  { word: '言語道断', meaning: '言葉で言い表せないほど、ひどくてあきれること', note: '仏教の言葉で、あまりのことに言葉が出ないという意味だよ。', minGrade: 6 },
  { word: '用意周到', meaning: '準備がすみずみまで、よく行き届いていること', note: '「周到」は、すみずみまで気を配ることを表すよ。', minGrade: 5 },
  { word: '不言実行', meaning: 'あれこれ文句を言わずに、だまって実行すること', note: '「言わずに実行する」という意味をそのまま表した言葉だよ。', minGrade: 5 },
  { word: '意気投合', meaning: 'おたがいの気持ちや考えが、ぴったり合うこと', note: '「意気」は気持ち、「投合」はぴったり合うことを表すよ。', minGrade: 5 },
  { word: '危機一髪', meaning: '髪の毛一本ほどのわずかな差で、とても危険な状態にあること', note: '髪の毛一本のわずかなすき間、というたとえから生まれたよ。', minGrade: 5 }
]

function yojiHardQuestion(item, params) {
  const grade = params.grade || 4
  const distractors = lengthBalancedDistractors(YOJI_HARD, item, (y) => y.meaning, (params.choiceCount || 4) - 1)
  const options = shuffle([item.meaning, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: 'hard:yomu:yoji',
    itemKey: `hard:yomu:yoji2:${item.word}`,
    visual: { kind: 'word', text: item.word },
    instruction: '意味を えらぼう',
    speak: `「${item.word}」の 意味は どれかな？`,
    answerId: item.meaning,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: item.meaning },
    explain: `「${item.word}」は「${item.meaning}」という意味だよ。${item.note}`,
    grade
  }
}

// ------------------------------------------------------------
// 2. ことわざ（発展）
// ------------------------------------------------------------
const PROVERB_HARD = [
  { phrase: '蓼食う虫も好き好き', meaning: '人の好みはさまざまで、他人には理解しにくいこともある', note: '苦い「蓼」の葉を好んで食べる虫もいる、というたとえだよ。', minGrade: 6 },
  { phrase: '弘法にも筆の誤り', meaning: 'どんなにその道の名人でも、ときには失敗することがある', note: '字の名人だった弘法大師でも、書き間違えることがある、というたとえだよ。', minGrade: 5 },
  { phrase: '情けは人の為ならず', meaning: '人に親切にしておくと、めぐりめぐって自分のためになる', note: '「人のためにならない」という意味ではなく、「自分にも返ってくる」という意味だよ。', minGrade: 6 },
  { phrase: '千里の道も一歩から', meaning: 'どんなに大きな物事も、小さな第一歩の積み重ねから始まる', note: '千里という長い道のりも、最初の一歩から始まる、という意味だよ。', minGrade: 4 },
  { phrase: '三人寄れば文殊の知恵', meaning: '平凡な人でも、三人集まって相談すればよい知恵が出ること', note: '「文殊」は知恵をつかさどるとされる仏さまだよ。', minGrade: 5 },
  { phrase: '蒔かぬ種は生えぬ', meaning: '自分で何もしなければ、よい結果は得られないということ', note: '種をまかなければ芽が出ないのは当然、というたとえだよ。', minGrade: 5 },
  { phrase: '木を見て森を見ず', meaning: '小さな部分ばかりに気を取られて、全体を見わたせないこと', note: '一本一本の木に気を取られて、森全体を見失う、という意味だよ。', minGrade: 6 },
  { phrase: '良薬は口に苦し', meaning: '自分のためになる忠告は、聞いていて耳が痛いことが多い', note: 'よく効く薬ほど苦いことが多い、というたとえから生まれたよ。', minGrade: 6 }
]

function proverbHardQuestion(item, params) {
  const grade = params.grade || 4
  const distractors = lengthBalancedDistractors(PROVERB_HARD, item, (p) => p.meaning, (params.choiceCount || 4) - 1)
  const options = shuffle([item.meaning, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: 'hard:yomu:proverb',
    itemKey: `hard:yomu:proverb2:${item.phrase}`,
    visual: { kind: 'sentence', text: item.phrase },
    instruction: '意味を えらぼう',
    speak: `「${item.phrase}」の 意味は どれかな？`,
    answerId: item.meaning,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: item.meaning },
    explain: `「${item.phrase}」は「${item.meaning}」という意味だよ。${item.note}`,
    grade
  }
}

// ------------------------------------------------------------
// 3. 熟語の構成（似た意味／反対の意味／修飾／動作と対象）
// ------------------------------------------------------------
const KOUSEI_LABELS = {
  similar: '似た意味の漢字を重ねる',
  opposite: '反対の意味の漢字を組み合わせる',
  modify: '上の字が下の字をくわしくする',
  object: '下の字が上の字の動作を受ける'
}
const KOUSEI = [
  { word: '岩石', type: 'similar', detail: '「岩」も「石」も似た意味の字を重ねている' },
  { word: '森林', type: 'similar', detail: '「森」も「林」も似た意味の字を重ねている' },
  { word: '道路', type: 'similar', detail: '「道」も「路」も似た意味の字を重ねている' },
  { word: '高低', type: 'opposite', detail: '「高い」と「低い」で反対の意味の字を組み合わせている' },
  { word: '売買', type: 'opposite', detail: '「売る」と「買う」で反対の意味の字を組み合わせている' },
  { word: '増減', type: 'opposite', detail: '「増える」と「減る」で反対の意味の字を組み合わせている' },
  { word: '青空', type: 'modify', detail: '「青い」が「空」をくわしく説明している' },
  { word: '寒流', type: 'modify', detail: '「寒い」が「流れ」をくわしく説明している' },
  { word: '美人', type: 'modify', detail: '「美しい」が「人」をくわしく説明している' },
  { word: '読書', type: 'object', detail: '「書（本）」を「読む」という、動作とその対象の関係になっている' },
  { word: '登山', type: 'object', detail: '「山」に「登る」という、動作とその対象の関係になっている' },
  { word: '開会', type: 'object', detail: '「会」を「開く」という、動作とその対象の関係になっている' }
]

// 「構成の名前（例: 反対の意味の漢字を組み合わせる）」を選択肢に並べると、
// 名前そのものの字数（11〜15字）が正解のヒントになってしまう
// （HINSHIと同じ問題）。ここでは選択肢を熟語（すべて2字で字数がそろう）
// にし、「この構成にあてはまる熟語はどれ？」の形にする。
const KOUSEI_TYPES = ['similar', 'opposite', 'modify', 'object']
const KOUSEI_ROUNDS = [
  ['岩石', '高低', '青空', '読書'],
  ['森林', '売買', '寒流', '登山'],
  ['道路', '増減', '美人', '開会']
]
const KOUSEI_ITEMS = KOUSEI_ROUNDS.flatMap((words, roundIndex) => {
  const set = words.map((word) => KOUSEI.find((k) => k.word === word))
  return KOUSEI_TYPES.map((target, i) => ({ id: `kousei${roundIndex}-${i}`, target, set }))
})

function kouseiQuestion(item, params) {
  const grade = params.grade || 5
  const answer = item.set.find((k) => k.type === item.target)
  const options = item.set.map((k) => k.word)
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: 'hard:yomu:kousei',
    itemKey: `hard:yomu:kousei:${item.id}`,
    visual: { kind: 'word', text: KOUSEI_LABELS[item.target] },
    instruction: 'あてはまる 熟語を えらぼう',
    speak: `${KOUSEI_LABELS[item.target]}、熟語は どれかな？`,
    answerId: answer.word,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: answer.word },
    explain: `「${answer.word}」は${answer.detail}ので、「${KOUSEI_LABELS[item.target]}」熟語だよ。`,
    grade
  }
}

// ------------------------------------------------------------
// 4. 同訓異字（同じ訓読みで意味の違う漢字を、文の中で選ぶ）
// ------------------------------------------------------------
const DOUKUN = [
  { id: 'atsui1', sentence: '今日は とても＿＿い。', answer: '暑い', options: ['暑い', '熱い', '厚い'], note: '気温が高いときは「暑い」を使うよ。', minGrade: 5 },
  { id: 'atsui2', sentence: 'お茶が＿＿くて 飲めない。', answer: '熱い', options: ['暑い', '熱い', '厚い'], note: '物の温度が高いときは「熱い」を使うよ。', minGrade: 5 },
  { id: 'atsui3', sentence: '＿＿い本を 読み終えた。', answer: '厚い', options: ['暑い', '熱い', '厚い'], note: '物の厚みがあるときは「厚い」を使うよ。', minGrade: 5 },
  { id: 'noboru1', sentence: '山に＿＿る。', answer: '登る', options: ['上る', '登る', '昇る'], note: '高い所へよじ登るときは「登る」を使うよ。', minGrade: 5 },
  { id: 'noboru2', sentence: '日が 東の空から＿＿る。', answer: '昇る', options: ['上る', '登る', '昇る'], note: '太陽や月が空に上がるときは「昇る」を使うよ。', minGrade: 5 },
  { id: 'noboru3', sentence: '階段を＿＿る。', answer: '上る', options: ['上る', '登る', '昇る'], note: '位置が高くなる、一般的な動きには「上る」を使うよ。', minGrade: 5 },
  { id: 'toru1', sentence: 'カメラで 写真を＿＿る。', answer: '撮る', options: ['取る', '採る', '撮る', '捕る'], note: '写真や映像を記録するときは「撮る」を使うよ。', minGrade: 6 },
  { id: 'toru2', sentence: 'あみで 虫を＿＿る。', answer: '捕る', options: ['取る', '採る', '撮る', '捕る'], note: '生き物をつかまえるときは「捕る」を使うよ。', minGrade: 6 },
  { id: 'toru3', sentence: '新しい やり方を＿＿り入れる。', answer: '採る', options: ['取る', '採る', '撮る', '捕る'], note: '考えや方法をえらんで用いるときは「採る」を使うよ。', minGrade: 6 },
  { id: 'hakaru1', sentence: '体重を＿＿る。', answer: '量る', options: ['計る', '量る', '測る'], note: '重さをはかるときは「量る」を使うよ。', minGrade: 6 },
  { id: 'hakaru2', sentence: 'きょうりの 長さを＿＿る。', answer: '測る', options: ['計る', '量る', '測る'], note: '長さや広さをはかるときは「測る」を使うよ。', minGrade: 6 },
  { id: 'hakaru3', sentence: 'かかる時間を＿＿る。', answer: '計る', options: ['計る', '量る', '測る'], note: '時間や数をはかるときは「計る」を使うよ。', minGrade: 6 }
]

function doukunQuestion(item, params) {
  const grade = params.grade || 5
  const options = shuffle(item.options)
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: 'hard:yomu:doukun',
    itemKey: `hard:yomu:doukun:${item.id}`,
    visual: { kind: 'sentence', text: item.sentence },
    instruction: 'あてはまる 言葉を えらぼう',
    speak: `「${item.sentence.replace('＿＿', 'なになに')}」の　＿＿に あてはまる 言葉は どれかな？`,
    answerId: item.answer,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: item.answer },
    explain: `ここは「${item.answer}」が正しいよ。${item.note}`,
    grade
  }
}

// ------------------------------------------------------------
// 5. 敬語（応用: 文まるごとの言いかえ）
// ------------------------------------------------------------
// 文まるごとの言いかえは、尊敬語（いらっしゃる・おっしゃる等）が謙譲語
// （参る・申す等）より字数が長くなりやすいという言葉自体の性質があり、
// 同じ動詞の言いかえだけを選択肢にすると「長い方＝尊敬語＝正解」で
// 当たってしまう。ここでは全項目の動詞形をひとつのプールにまとめ、
// 他の動詞の尊敬語・謙譲語もまぜて誤答候補にすることで、字数と正誤の
// 対応をくずしている（同じ主語で使うと不自然な動詞が混ざるのは、
// 「その人にふさわしい言い方か」を問う点でむしろ自然な誤答になる）。
// extraDecoy: 同じ動詞の「〜ます」を足した形。自分の項目の誤答には使わない
// （それも間違いではないため）が、他の動詞の質問では「文脈に合わない、
// 字数の長い」誤答候補として使え、いらっしゃる（6字）のように孤立して
// 一番長くなりがちな動詞にも、他の項目からの長い候補がまざるようにする。
const KEIGO_HARD = [
  { id: 'k1', subject: 'お客様が', plain: '来る', form: '尊敬語', verb: 'いらっしゃる', extraDecoy: 'いらっしゃいます', note: '「来る」の尊敬語は「いらっしゃる」だよ。' },
  { id: 'k2', subject: '先生が', plain: '言う', form: '尊敬語', verb: 'おっしゃる', extraDecoy: 'おっしゃいます', note: '「言う」の尊敬語は「おっしゃる」だよ。' },
  { id: 'k3', subject: 'お客様が', plain: '食べる', form: '尊敬語', verb: '召し上がる', extraDecoy: '召し上がります', note: '「食べる」の尊敬語は「召し上がる」だよ。' },
  { id: 'k4', subject: '先生が', plain: '見る', form: '尊敬語', verb: 'ご覧になる', extraDecoy: 'ご覧になります', note: '「見る」の尊敬語は「ご覧になる」だよ。' },
  { id: 'k5', subject: '先生が', plain: 'する', form: '尊敬語', verb: 'なさる', extraDecoy: 'なさいます', note: '「する」の尊敬語は「なさる」だよ。' },
  { id: 'k6', subject: 'わたしが', plain: '行く', form: '謙譲語', verb: '参る', extraDecoy: '参ります', note: '「行く」をへりくだって言うときは「参る」を使うよ。' },
  { id: 'k7', subject: 'わたしが', plain: '言う', form: '謙譲語', verb: '申す', extraDecoy: '申します', note: '「言う」をへりくだって言うときは「申す」を使うよ。' },
  { id: 'k8', subject: 'わたしが', plain: '食べる', form: '謙譲語', verb: 'いただく', extraDecoy: 'いただきます', note: '「食べる」をへりくだって言うときは「いただく」を使うよ。' },
  { id: 'k9', subject: 'わたしが', plain: '見る', form: '謙譲語', verb: '拝見する', extraDecoy: '拝見します', note: '「見る」をへりくだって言うときは「拝見する」を使うよ。' },
  { id: 'k10', subject: 'わたしが', plain: '聞く', form: '謙譲語', verb: '伺う', extraDecoy: '伺います', note: '「聞く」をへりくだって言うときは「伺う」を使うよ。' }
]

function keigoHardQuestion(item, params) {
  const grade = params.grade || 6
  const cc = params.choiceCount || 4
  const answerText = `${item.subject} ${item.verb}。`
  const others = KEIGO_HARD.filter((k) => k !== item)
  const wrongVerbs = shuffle([...others.map((k) => k.verb), ...others.map((k) => k.extraDecoy)])
  const options = shuffle([answerText, ...wrongVerbs.slice(0, cc - 1).map((verb) => `${item.subject} ${verb}。`)])
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: 'hard:yomu:keigo',
    itemKey: `hard:yomu:keigo2:${item.id}`,
    visual: { kind: 'sentence', text: `${item.subject} ${item.plain}。` },
    instruction: `${item.form}に 言いかえよう`,
    speak: `「${item.subject} ${item.plain}。」を ${item.form}に 言いかえると どれかな？`,
    answerId: answerText,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: answerText },
    explain: item.note,
    grade
  }
}

// ------------------------------------------------------------
// 6. 文法（品詞の識別）
// ------------------------------------------------------------
// 「どの言葉が◯◯詞か」を、同じ品詞名を選択肢に並べる形にすると、
// 品詞名そのものの字数（名詞2字〜形容動詞4字）が正解のヒントになって
// しまう（例: 形容動詞はいつも一番長い選択肢）。ここでは選択肢を
// 「文中の言葉」自体にし、各セットの4語の字数をあらかじめそろえて
// 長さでは当てられないようにしている。
const HINSHI_RULE = {
  名詞: '人・もの・ことがらの名前を表す言葉',
  動詞: '動作や存在を表し、言い切りが「う段」の音になる言葉',
  形容詞: '「い」で終わり、ようすを表す言葉',
  形容動詞: '「だ」の形に直せて、ようすを表す言葉',
  副詞: '動作やようすの程度をくわしく説明する言葉'
}
const HINSHI = [
  { id: 'h1', words: [['犬', '名詞'], ['走る', '動詞'], ['赤い', '形容詞'], ['とても', '副詞']], target: '動詞' },
  { id: 'h2', words: [['元気な', '形容動詞'], ['犬', '名詞'], ['走る', '動詞'], ['とても', '副詞']], target: '形容動詞' },
  { id: 'h3', words: [['すぐに', '副詞'], ['静かな', '形容動詞'], ['花', '名詞'], ['さく', '動詞']], target: '副詞' },
  { id: 'h4', words: [['時計', '名詞'], ['読む', '動詞'], ['新しい', '形容詞'], ['とても', '副詞']], target: '名詞' },
  { id: 'h5', words: [['見る', '動詞'], ['本', '名詞'], ['新しい', '形容詞'], ['にぎやかな', '形容動詞']], target: '動詞' },
  { id: 'h6', words: [['美しい', '形容詞'], ['景色', '名詞'], ['見る', '動詞'], ['すぐに', '副詞']], target: '形容詞' },
  { id: 'h7', words: [['とても', '副詞'], ['おいしい', '形容詞'], ['ケーキ', '名詞'], ['ある', '動詞']], target: '副詞' },
  { id: 'h8', words: [['教室', '名詞'], ['静かな', '形容動詞'], ['読む', '動詞'], ['たくさん', '副詞']], target: '名詞' },
  { id: 'h9', words: [['すなおな', '形容動詞'], ['子ども', '名詞'], ['あげる', '動詞'], ['まったく', '副詞']], target: '形容動詞' },
  { id: 'h10', words: [['大きい', '形容詞'], ['自転車', '名詞'], ['買う', '動詞'], ['しっかり', '副詞']], target: '形容詞' },
  { id: 'h11', words: [['買った', '動詞'], ['自転車', '名詞'], ['新しい', '形容詞'], ['とても', '副詞']], target: '動詞' },
  { id: 'h12', words: [['しっかり', '副詞'], ['すなおな', '形容動詞'], ['準備', '名詞'], ['する', '動詞']], target: '副詞' }
]

function hinshiQuestion(item, params) {
  const grade = params.grade || 5
  const answer = item.words.find(([, pos]) => pos === item.target)[0]
  const options = item.words.map(([word]) => word)
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: 'hard:yomu:hinshi',
    itemKey: `hard:yomu:hinshi:${item.id}`,
    visual: { kind: 'sentence', text: item.words.map(([word]) => word).join('・') },
    instruction: `この中で「${item.target}」は どれ？`,
    speak: `この中で、${item.target}は どれかな？`,
    answerId: answer,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: answer },
    explain: `「${answer}」が${item.target}だよ。${item.target}は${HINSHI_RULE[item.target]}だよ。`,
    grade
  }
}

// ------------------------------------------------------------
// 7. 説明文・物語文の読解（200〜400字＋設問）
// ------------------------------------------------------------
const DOKKAI_HARD = [
  {
    id: 'd1',
    minGrade: 4,
    passage: 'ラクダは、暑く乾いた砂漠に住む動物です。背中にあるこぶには、実は水がたくわえられているわけではありません。こぶの中身は主に脂肪で、エネルギーを蓄えておくための倉庫のような役割をしています。長い間、食べ物が手に入らないときでも、このこぶの脂肪を少しずつ使うことで、ラクダは何日も歩き続けることができるのです。また、ラクダのまつげはとても長く、まぶたは二重になっています。これは、砂漠に吹きあれる砂ぼこりから目を守るための工夫だと考えられています。',
    question: 'ラクダのこぶの中に入っているものは、主に何ですか。',
    answer: '脂肪',
    choices: ['水', '脂肪', '砂', '空気'],
    explain: 'こぶの中身は水ではなく主に脂肪で、エネルギーをたくわえる倉庫のような役割をしている、と書かれている。'
  },
  {
    id: 'd2',
    minGrade: 5,
    passage: '日本には、地方によってちがう言葉づかいがあります。これを「方言」といいます。たとえば、標準語で「疲れた」ということを、関西の方言では「しんどい」ということがあります。方言は、その土地の気候や歴史、人々の暮らし方と深く結びついて生まれてきました。近年は、テレビやインターネットが発達したことで、標準語を耳にする機会が増え、方言を使う若い人が少なくなってきていると言われています。しかし、方言には、その地域ならではの温かみや、言葉では言い表せない細やかな気持ちを伝える力があります。方言を大切に残していこうという取り組みも、各地で行われています。',
    question: '方言を使う若い人が少なくなってきている理由として、文章にあげられているのは何ですか。',
    answer: 'テレビやインターネットが発達したこと',
    choices: ['テレビやインターネットが発達したこと', '方言を話せる人が少なくなったこと', '標準語のほうが正しいとされていること', '方言を使うことが禁止されていること'],
    explain: 'テレビやインターネットが発達したことで標準語を耳にする機会が増え、方言を使う若い人が少なくなってきている、と書かれている。'
  },
  {
    id: 'd3',
    minGrade: 6,
    passage: 'わたしたちが毎日出すごみの中には、まだ使える資源がたくさんふくまれています。たとえば、アルミ缶を新しく作るには多くの電力が必要ですが、使い終わったアルミ缶を溶かして再び缶にする「リサイクル」を行うと、新しく作るときに比べて必要な電力を大幅に減らすことができます。ペットボトルも同じように、細かくくだいて洗浄したあと、糸や別の容器の材料として生まれ変わります。限りある資源を大切に使うためには、ごみを正しく分別し、リサイクルできるものは積極的にリサイクルへ回すという、わたしたち一人一人の心がけが欠かせません。',
    question: 'アルミ缶をリサイクルすると、新しく作るときに比べて何が大幅に減りますか。',
    answer: '必要な電力',
    choices: ['必要な電力', 'ごみの量', '缶の数', '使う水の量'],
    explain: '使い終わったアルミ缶を溶かして再利用すると、新しく作るときより必要な電力を大幅に減らせる、と書かれている。'
  },
  {
    id: 'd4',
    minGrade: 4,
    passage: '運動会の朝、ゆうたは早くに目が覚めた。徒競走で一番になりたくて、この一か月、毎朝走る練習をしてきたのだ。教室に集まると、となりの席のみさきが「ゆうた君、今日がんばってね」と声をかけてくれた。いよいよ徒競走の番になり、ゆうたはスタートラインに立った。ドンという合図と同時に、力いっぱい地面をけった。ゴール直前、となりを走る友達に少しだけ抜かれてしまい、ゆうたは二位でゴールした。くやしくて下を向いていると、みさきが駆け寄ってきて「毎日がんばって走ってたの、ずっと見てたよ」と笑顔で言った。ゆうたは、その言葉に少しだけ救われたような気がした。',
    question: 'ゆうたが二位でゴールしたあと、くやしくて下を向いていたときに声をかけてくれたのはだれですか。',
    answer: 'みさき',
    choices: ['みさき', 'たかし', '先生', 'お母さん'],
    explain: '徒競走のあと、下を向くゆうたに駆け寄って声をかけたのはみさきである。'
  },
  {
    id: 'd5',
    minGrade: 5,
    passage: '祖母の家に泊まった夜、りょうは眠れずに縁側に出た。空には満天の星が広がっていた。「都会じゃ、こんなに星は見えないだろう」祖母がとなりに腰を下ろして言った。りょうはうなずきながらも、心の中では、来月から始まる中学受験の勉強のことを考えていた。友達と遊ぶ時間も減り、正直、少しつかれていた。「がんばりすぎなくていいんだよ」祖母の言葉に、りょうは驚いて顔を上げた。「星もね、いつも同じ強さで光っているわけじゃない。時々ゆっくり休んでも、ちゃんとまた輝くから」その言葉を聞いて、りょうの肩から、少しだけ力がぬけた気がした。',
    question: '祖母の言葉を聞いて、りょうの様子はどう変化しましたか。',
    answer: '肩から少しだけ力がぬけた',
    choices: ['肩から少しだけ力がぬけた', 'もっとがんばろうと決意した', '星に興味を持った', 'すぐに眠ってしまった'],
    explain: '祖母の「がんばりすぎなくていい」という言葉を聞いて、りょうの肩から少しだけ力がぬけたと書かれている。'
  },
  {
    id: 'd6',
    minGrade: 6,
    passage: '文化祭の劇で主役に選ばれたあおいは、うれしさよりも不安のほうが大きかった。人前で話すのが苦手で、セリフを覚えても本番になると声が出なくなってしまうのではないかと心配だったのだ。稽古を重ねるうちに、同じ劇のメンバーであるたくみが「あおいの声、実はよく通るんだよ。自信持っていいと思う」と言ってくれた。本番の日、舞台の袖でひざが震えていたあおいだったが、たくみの言葉を思い出し、大きく息を吸って舞台に一歩踏み出した。ライトに照らされながらセリフを言い始めると、不思議と声はふるえていなかった。',
    question: 'あおいが舞台に一歩踏み出すことができたきっかけは何ですか。',
    answer: 'たくみの言葉を思い出したこと',
    choices: ['たくみの言葉を思い出したこと', '稽古を毎日欠かさず続けたこと', '観客の数が少なくて安心したこと', '先生に大丈夫だと励まされたこと'],
    explain: '本番前、あおいはたくみの「自信持っていい」という言葉を思い出して、舞台に一歩踏み出した。'
  }
]

function dokkaiHardQuestion(item, params) {
  const grade = params.grade || item.minGrade
  const options = shuffle(item.choices)
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: 'hard:yomu:dokkai',
    itemKey: `hard:yomu:dokkai2:${item.id}`,
    visual: { kind: 'passage', text: item.passage },
    instruction: item.question,
    speak: `文章を よんで、しつもんに こたえよう。${item.question}`,
    answerId: item.answer,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: item.answer },
    explain: item.explain,
    grade
  }
}

// ------------------------------------------------------------
// レジストリと出題本体
// ------------------------------------------------------------
const HARD_FORMS = [
  { prefix: 'hard:yomu:yoji2:', pool: YOJI_HARD, build: yojiHardQuestion, keyOf: (it) => `hard:yomu:yoji2:${it.word}` },
  { prefix: 'hard:yomu:proverb2:', pool: PROVERB_HARD, build: proverbHardQuestion, keyOf: (it) => `hard:yomu:proverb2:${it.phrase}` },
  { prefix: 'hard:yomu:kousei:', pool: KOUSEI_ITEMS, build: kouseiQuestion, keyOf: (it) => `hard:yomu:kousei:${it.id}` },
  { prefix: 'hard:yomu:doukun:', pool: DOUKUN, build: doukunQuestion, keyOf: (it) => `hard:yomu:doukun:${it.id}` },
  { prefix: 'hard:yomu:keigo2:', pool: KEIGO_HARD, build: keigoHardQuestion, keyOf: (it) => `hard:yomu:keigo2:${it.id}` },
  { prefix: 'hard:yomu:hinshi:', pool: HINSHI, build: hinshiQuestion, keyOf: (it) => `hard:yomu:hinshi:${it.id}` },
  { prefix: 'hard:yomu:dokkai2:', pool: DOKKAI_HARD, build: dokkaiHardQuestion, keyOf: (it) => `hard:yomu:dokkai2:${it.id}` }
]

export const HARD_READING_POOLS = { YOJI_HARD, PROVERB_HARD, KOUSEI: KOUSEI_ITEMS, DOUKUN, KEIGO_HARD, HINSHI, DOKKAI_HARD }

// 検証スクリプト用: 各プールの項目からitemKeyを引く方法を公開する
// （プールをまたいで同名フィールド(word等)が再利用されているため、
// 呼び出し側でduck-typingせず、ここで一元管理する）。
export const HARD_READING_FORMS = HARD_FORMS.map(({ prefix, pool, keyOf }) => ({ prefix, pool, keyOf }))

export function generateHardReadingQuestion(params, reviewKey = null) {
  const grade = params.grade || 4
  if (reviewKey) {
    for (const form of HARD_FORMS) {
      if (!reviewKey.startsWith(form.prefix)) continue
      const item = form.pool.find((it) => form.keyOf(it) === reviewKey)
      if (item) return form.build(item, params)
    }
  }
  const everSeen = params.everSeenKnowledge
  const buckets = HARD_FORMS
    .map((form) => ({ form, items: eligible(form.pool, grade) }))
    .filter((bucket) => bucket.items.length)
  if (!buckets.length) return null
  const withUnseen = everSeen ? buckets.filter((b) => b.items.some((item) => !everSeen.has(b.form.keyOf(item)))) : []
  const pickFrom = withUnseen.length ? withUnseen : buckets
  const bucket = pickFrom[Math.floor(Math.random() * pickFrom.length)]
  const chosen = pickUnseenFirst(bucket.items, everSeen, bucket.form.keyOf)
  return bucket.form.build(chosen, params)
}

export const HARD_READING_LABELS = {
  yoji2: '四字熟語（発展）', proverb2: 'ことわざ（発展）', kousei: '熟語の構成',
  doukun: '同訓異字', keigo2: '敬語（応用）', hinshi: '品詞', dokkai2: '長文読解',
  // 小1〜3の先取り（yomu-advance-hard.js）も、ReviewScreenの
  // 'hard:yomu:' 分岐がそのまま拾えるよう合流させる。
  ...HARD_YOMU_ADVANCE_LABELS
}
