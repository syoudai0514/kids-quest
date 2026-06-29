// ============================================================
// 「すうじ」分野（小学1年生レベルまで）
//  - かぞえる / 大小くらべ（絵）
//  - たしざん（合計10まで）→ くりあがり（合計20まで）
//  - ひきざん（10まで）→ くりさがり（20まで）
//  - 10をつくる / 数のならび / 100までの大小くらべ（数字）
//
// 出題は ActivityPlayer 共通の choice 形式（type:'choice'）。
// 難易度 params.level で扱う数の大きさ・課題の種類を解禁する。
// ============================================================

const COUNT_EMOJI = ['🦕', '⭐', '🦖', '🪐', '🚀', '🌙', '🥚', '☄️', '🍎', '🐟']

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
function numberChoices(answer, count, spread = 3) {
  const set = new Set([answer])
  let guard = 0
  while (set.size < count && guard++ < 80) {
    const delta = rng(1, spread) * (Math.random() < 0.5 ? -1 : 1)
    const cand = answer + delta
    if (cand >= 0) set.add(cand)
  }
  let n = 1
  while (set.size < count && guard++ < 120) set.add(answer + n++)
  return shuffle([...set]).map((v) => ({ id: String(v), label: String(v), emoji: null, speak: `${v}` }))
}

function emojiRow(emoji, n) {
  return emoji.repeat(n)
}

export function generateNumbersQuestion(params) {
  const { level, choiceCount } = params
  const cc = Math.max(3, choiceCount)

  // レベルで出題タイプを解禁（増えるほど種類が増える＝問題が多彩に）
  const kinds = ['count', 'compareDots']
  if (level >= 2) kinds.push('add')
  if (level >= 3) kinds.push('add', 'sub', 'make10')
  if (level >= 4) kinds.push('addCarry', 'compareNum', 'sequence')
  if (level >= 5) kinds.push('addCarry', 'subBorrow', 'compareNum')
  if (level >= 6) kinds.push('subBorrow', 'sequence', 'compareNum')
  const kind = pick(kinds)

  // --- かぞえる ---
  if (kind === 'count') {
    const emoji = pick(COUNT_EMOJI)
    const n = rng(3, Math.min(5 + level * 2, 12))
    return base({
      promptText: emojiRow(emoji, n), promptScale: 'count',
      instruction: 'いくつ あるかな？', speak: 'いくつ あるか かぞえて、すうじを えらんでね',
      answer: n, cc, spread: 2, say: `${n}こ`
    })
  }

  // --- 大小くらべ（絵）---
  if (kind === 'compareDots') {
    const e1 = pick(COUNT_EMOJI)
    let e2 = pick(COUNT_EMOJI); if (e2 === e1) e2 = COUNT_EMOJI[(COUNT_EMOJI.indexOf(e1) + 1) % COUNT_EMOJI.length]
    let a = rng(2, 12), b = rng(2, 12); if (a === b) b += 1
    return {
      domain: 'suuji', type: 'choice',
      promptText: `${emojiRow(e1, a)}\nと\n${emojiRow(e2, b)}`, promptScale: 'compare',
      instruction: 'おおいのは どっち？', speak: 'かずが おおいのは どっちかな？',
      answerId: a > b ? 'up' : 'down',
      choices: [
        { id: 'up', label: 'うえ', emoji: '⬆️', speak: 'うえ' },
        { id: 'down', label: 'した', emoji: '⬇️', speak: 'した' }
      ],
      answerWord: { text: `おおいほうは ${Math.max(a, b)}こ` }
    }
  }

  // --- 100までの大小くらべ（数字）---
  if (kind === 'compareNum') {
    let a = rng(1, 99), b = rng(1, 99); if (a === b) b = (b % 99) + 1
    const big = Math.max(a, b)
    return {
      domain: 'suuji', type: 'choice',
      promptText: `${a}  と  ${b}`, promptScale: 'addbig',
      instruction: 'おおきいのは どっち？', speak: `${a}と ${b}、おおきいのは どっち？`,
      answerId: String(big),
      choices: shuffle([a, b]).map((v) => ({ id: String(v), label: String(v), speak: `${v}` })),
      answerWord: { text: `おおきいのは ${big}` }
    }
  }

  // --- 数のならび ---
  if (kind === 'sequence') {
    const start = rng(1, 12)
    const seq = [start, start + 1, start + 2, start + 3]
    const hole = rng(1, 2) // 真ん中をかくす
    const ans = seq[hole]
    const shown = seq.map((v, i) => (i === hole ? '❓' : v)).join('  ')
    return base({
      promptText: shown, promptScale: 'addbig',
      instruction: '❓に はいる かずは？', speak: 'じゅんばんに ならべると、なにが はいるかな？',
      answer: ans, cc, spread: 2, say: `${ans}`
    })
  }

  // --- 10をつくる ---
  if (kind === 'make10') {
    const a = rng(1, 9), ans = 10 - a
    return base({
      promptText: `${a} ＋ ❓ ＝ 10`, promptScale: 'addbig',
      instruction: `${a} と いくつで 10？`, speak: `${a}と いくつで 10に なるかな？`,
      answer: ans, cc, spread: 2, say: `${ans}`
    })
  }

  // --- たしざん（合計10まで・絵つき）---
  if (kind === 'add') {
    const emoji = pick(COUNT_EMOJI)
    const a = rng(1, 5), b = rng(1, Math.min(5, 10 - a)), sum = a + b
    return base({
      promptText: `${emojiRow(emoji, a)} ＋ ${emojiRow(emoji, b)} ＝ ❓`, promptScale: 'add',
      instruction: `${a} ＋ ${b} ＝ ？`, speak: `${a} たす ${b} は いくつ？`,
      answer: sum, cc, spread: 2, say: `${a}たす${b}は${sum}`
    })
  }

  // --- くりあがりの たしざん（合計20まで）---
  if (kind === 'addCarry') {
    const a = rng(5, 9), b = rng(Math.max(2, 11 - a), 9), sum = a + b
    return base({
      promptText: `${a} ＋ ${b} ＝ ❓`, promptScale: 'addbig',
      instruction: `${a} ＋ ${b} ＝ ？`, speak: `${a} たす ${b} は いくつ？`,
      answer: sum, cc, spread: 3, say: `こたえは ${sum}`
    })
  }

  // --- ひきざん（10まで）---
  if (kind === 'sub') {
    const a = rng(4, 10), b = rng(1, a - 1), diff = a - b
    return base({
      promptText: `${a} − ${b} ＝ ❓`, promptScale: 'addbig',
      instruction: `${a} − ${b} ＝ ？`, speak: `${a} ひく ${b} は いくつ？`,
      answer: diff, cc, spread: 2, say: `こたえは ${diff}`
    })
  }

  // --- くりさがりの ひきざん（20まで）---
  const a = rng(11, 18), b = rng(a - 9, 9), diff = a - b
  return base({
    promptText: `${a} − ${b} ＝ ❓`, promptScale: 'addbig',
    instruction: `${a} − ${b} ＝ ？`, speak: `${a} ひく ${b} は いくつ？`,
    answer: diff, cc, spread: 3, say: `こたえは ${diff}`
  })
}

// 数字で答える問題の共通組み立て
function base({ promptText, promptScale, instruction, speak, answer, cc, spread, say }) {
  return {
    domain: 'suuji', type: 'choice',
    promptText, promptScale, instruction, speak,
    answerId: String(answer),
    choices: numberChoices(answer, cc, spread),
    answerWord: { text: say }
  }
}
