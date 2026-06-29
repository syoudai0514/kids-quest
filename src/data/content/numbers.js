// ============================================================
// 「すうじ」分野のコンテンツ
//  - かぞえる（恐竜や星の数を数える）
//  - 大小くらべ（どっちが多い）
//  - たしざん（数の入口 → 少しずつ難しく）
//  - ひきざん（高レベルで登場）
//
// 出題は ActivityPlayer 共通の choice 形式で返す（type:'choice'）。
// 難易度 params.level で扱う数の大きさ・課題の種類を変える。
// ============================================================

const COUNT_EMOJI = ['🦕', '⭐', '🦖', '🪐', '🚀', '🌙', '🥚', '☄️']

function rng(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 正解の数値 + ダミーを混ぜて選択肢（数字）を作る
function numberChoices(answer, count, maxN) {
  const set = new Set([answer])
  let guard = 0
  while (set.size < count && guard++ < 50) {
    const delta = rng(1, 3) * (Math.random() < 0.5 ? -1 : 1)
    const cand = answer + delta
    if (cand >= 0 && cand <= maxN + 2) set.add(cand)
  }
  // 足りなければ適当に補う
  let n = 0
  while (set.size < count && guard++ < 100) {
    set.add(Math.max(0, answer + (n++ % 5) - 2 + 1))
  }
  return shuffle([...set]).map((v) => ({
    id: String(v),
    label: String(v),
    emoji: null,
    speak: `${v}`
  }))
}

function emojiRow(emoji, n) {
  return emoji.repeat(n)
}

// 数を絵で並べたプロンプト（折り返しできるよう文字列で）
function countPrompt(emoji, n) {
  return emojiRow(emoji, n)
}

export function generateNumbersQuestion(params) {
  const { level, choiceCount } = params
  // レベルで扱う最大の数を広げる
  const maxCount = Math.min(5 + level * 2, 20) // かぞえる対象の最大
  const cc = Math.max(3, choiceCount)

  // 出題タイプをレベルで解禁
  const kinds = ['count', 'compare']
  if (level >= 3) kinds.push('add', 'add')
  if (level >= 6) kinds.push('addhard', 'sub')
  const kind = pick(kinds)

  // --- かぞえる ---
  if (kind === 'count') {
    const emoji = pick(COUNT_EMOJI)
    const n = rng(3, Math.min(maxCount, 12))
    return {
      domain: 'suuji',
      type: 'choice',
      promptText: countPrompt(emoji, n),
      promptScale: 'count',
      instruction: 'いくつ あるかな？',
      speak: 'いくつ あるか かぞえて、すうじを えらんでね',
      answerId: String(n),
      choices: numberChoices(n, cc, maxCount),
      answerWord: { text: `${n}こ` }
    }
  }

  // --- 大小くらべ ---
  if (kind === 'compare') {
    const e1 = pick(COUNT_EMOJI)
    let e2 = pick(COUNT_EMOJI)
    if (e2 === e1) e2 = COUNT_EMOJI[(COUNT_EMOJI.indexOf(e1) + 1) % COUNT_EMOJI.length]
    let a = rng(2, Math.min(maxCount, 12))
    let b = rng(2, Math.min(maxCount, 12))
    if (a === b) b = a + 1
    const bigLeft = a > b
    return {
      domain: 'suuji',
      type: 'choice',
      promptText: `${emojiRow(e1, a)}\nと\n${emojiRow(e2, b)}`,
      promptScale: 'compare',
      instruction: 'おおいのは どっち？',
      speak: 'かずが おおいのは どっちかな？',
      answerId: bigLeft ? 'left' : 'right',
      choices: [
        { id: 'left', label: 'うえ', emoji: '⬆️', speak: 'うえ' },
        { id: 'right', label: 'した', emoji: '⬇️', speak: 'した' }
      ],
      answerWord: { text: `おおいほうは ${Math.max(a, b)}こ` }
    }
  }

  // --- たしざん（やさしめ：合計10まで）---
  if (kind === 'add') {
    const emoji = pick(COUNT_EMOJI)
    const a = rng(1, 5)
    const b = rng(1, Math.min(5, 10 - a))
    const sum = a + b
    return {
      domain: 'suuji',
      type: 'choice',
      promptText: `${emojiRow(emoji, a)} ＋ ${emojiRow(emoji, b)} ＝ ❓`,
      promptScale: 'add',
      instruction: `${a} ＋ ${b} ＝ ？`,
      speak: `${a} たす ${b} は いくつ？`,
      answerId: String(sum),
      choices: numberChoices(sum, cc, 12),
      answerWord: { text: `${a}たす${b}は${sum}` }
    }
  }

  // --- たしざん（むずかしめ：合計20まで、数字のみ）---
  if (kind === 'addhard') {
    const a = rng(3, 10)
    const b = rng(2, 10)
    const sum = a + b
    return {
      domain: 'suuji',
      type: 'choice',
      promptText: `${a} ＋ ${b} ＝ ❓`,
      promptScale: 'addbig',
      instruction: `${a} ＋ ${b} ＝ ？`,
      speak: `${a} たす ${b} は いくつ？`,
      answerId: String(sum),
      choices: numberChoices(sum, cc, sum + 3),
      answerWord: { text: `こたえは ${sum}` }
    }
  }

  // --- ひきざん ---
  const a = rng(4, 12)
  const b = rng(1, a - 1)
  const diff = a - b
  return {
    domain: 'suuji',
    type: 'choice',
    promptText: `${a} − ${b} ＝ ❓`,
    promptScale: 'addbig',
    instruction: `${a} − ${b} ＝ ？`,
    speak: `${a} ひく ${b} は いくつ？`,
    answerId: String(diff),
    choices: numberChoices(diff, cc, a),
    answerWord: { text: `こたえは ${diff}` }
  }
}
