// ============================================================
// 「すうじ」分野（小学1年生レベルまで）
//
// 「頭が良くなる」見せ方にこだわる:
//  - かぞえる/たしざんの絵は「5個ずつの列」で並べる（5のかたまり感覚）
//  - 10づくりは「10のフレーム」（2×5マス）で見せる（合成・分解の教具）
//  - くらべっこは2枚のカードを直接タップ（上下ボタンより直感的）
//
// 出題タイプはレベルで解禁され、種類が増えていく。
//   count / compareCards / add / make10 / addCarry / sub / subBorrow /
//   sequence / compareNum
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

// 正解の数値 + 近い数のダミー
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
  return shuffle([...set]).map((v) => ({ id: String(v), label: String(v), speak: `${v}` }))
}

function numQ({ visual, instruction, speak, answer, cc, spread, say, explain }) {
  return {
    domain: 'suuji',
    type: 'choice',
    itemKey: null,
    visual,
    instruction,
    speak,
    answerId: String(answer),
    choices: numberChoices(answer, cc, spread),
    answerWord: { text: say },
    explain: explain || `こたえは ${answer}`
  }
}

export function generateNumbersQuestion(params) {
  const { level, choiceCount } = params
  const cc = Math.max(3, choiceCount)

  const kinds = ['count', 'compareCards']
  if (level >= 2) kinds.push('add')
  if (level >= 3) kinds.push('add', 'sub', 'make10')
  if (level >= 4) kinds.push('addCarry', 'compareNum', 'sequence')
  if (level >= 5) kinds.push('addCarry', 'subBorrow', 'compareNum')
  if (level >= 6) kinds.push('subBorrow', 'sequence', 'make10')
  const kind = pick(kinds)

  // --- かぞえる（5個ずつの列で表示）---
  if (kind === 'count') {
    const emoji = pick(COUNT_EMOJI)
    const n = rng(3, Math.min(5 + level * 2, 12))
    return numQ({
      visual: { kind: 'groups', groups: [{ emoji, n }] },
      instruction: 'いくつ あるかな？',
      speak: 'いくつ あるか かぞえて、すうじを えらんでね',
      answer: n, cc, spread: 2, say: `${n}こ`,
      explain: `5こずつ かぞえると はやいよ。ぜんぶで ${n}こ`
    })
  }

  // --- くらべっこ（2枚のカードをタップ）---
  if (kind === 'compareCards') {
    const e1 = pick(COUNT_EMOJI)
    let e2 = pick(COUNT_EMOJI)
    if (e2 === e1) e2 = COUNT_EMOJI[(COUNT_EMOJI.indexOf(e1) + 1) % COUNT_EMOJI.length]
    let a = rng(2, Math.min(4 + level * 2, 12))
    let b = rng(2, Math.min(4 + level * 2, 12))
    if (a === b) b = b >= 12 ? b - 1 : b + 1
    return {
      domain: 'suuji',
      type: 'choice',
      itemKey: null,
      visual: null,
      instruction: 'おおい ほうを タッチ！',
      speak: 'かずが おおいのは どっちかな？ おおいほうを タッチしてね',
      answerId: a > b ? 'a' : 'b',
      choices: [
        { id: 'a', grid: { emoji: e1, n: a } },
        { id: 'b', grid: { emoji: e2, n: b } }
      ],
      answerWord: { text: `おおいほうは ${Math.max(a, b)}こ` },
      explain: `${Math.max(a, b)}こ の ほうが おおいね`
    }
  }

  // --- 100までの大小くらべ（数字）---
  if (kind === 'compareNum') {
    let a = rng(1, 99)
    let b = rng(1, 99)
    if (a === b) b = (b % 99) + 1
    const big = Math.max(a, b)
    return {
      domain: 'suuji',
      type: 'choice',
      itemKey: null,
      visual: null,
      instruction: 'おおきい かずを タッチ！',
      speak: `${a}と ${b}、おおきいのは どっち？`,
      answerId: String(big),
      choices: shuffle([a, b]).map((v) => ({ id: String(v), label: String(v), speak: `${v}` })),
      answerWord: { text: `おおきいのは ${big}` },
      explain: `${big}のほうが おおきいよ`
    }
  }

  // --- 数のならび ---
  if (kind === 'sequence') {
    const start = rng(1, Math.min(6 + level * 2, 17))
    const seq = [start, start + 1, start + 2, start + 3]
    const hole = rng(1, 2)
    const ans = seq[hole]
    const shown = seq.map((v, i) => (i === hole ? '❓' : v)).join('   ')
    return numQ({
      visual: { kind: 'bigtext', text: shown },
      instruction: '❓に はいる かずは？',
      speak: 'かずが じゅんばんに ならんでいるよ。はてなに はいるのは なにかな？',
      answer: ans, cc, spread: 2, say: `${ans}`,
      explain: `${seq[hole - 1]}の つぎは ${ans}だね`
    })
  }

  // --- 10をつくる（10のフレームで見せる）---
  if (kind === 'make10') {
    const a = rng(1, 9)
    const ans = 10 - a
    return numQ({
      visual: { kind: 'tenframe', filled: a },
      instruction: `${a} と いくつで 10？`,
      speak: `ほしが ${a}こ。あと いくつで 10に なるかな？`,
      answer: ans, cc, spread: 2, say: `${ans}`,
      explain: `あいている マスを かぞえよう。${a}と ${ans}で 10だよ`
    })
  }

  // --- たしざん（合計10まで・絵つき）---
  if (kind === 'add') {
    const emoji = pick(COUNT_EMOJI)
    const a = rng(1, 5)
    const b = rng(1, Math.min(5, 10 - a))
    const sum = a + b
    return numQ({
      visual: { kind: 'groups', groups: [{ emoji, n: a }, { emoji, n: b }], op: '＋' },
      instruction: `${a} ＋ ${b} ＝ ？`,
      speak: `${a} たす ${b} は いくつ？`,
      answer: sum, cc, spread: 2, say: `${a}たす${b}は${sum}`,
      explain: `ぜんぶ あわせて かぞえよう。${a}たす${b}は ${sum}`
    })
  }

  // --- くりあがりの たしざん（〜20）---
  if (kind === 'addCarry') {
    const a = rng(5, 9)
    const b = rng(Math.max(2, 11 - a), 9)
    const sum = a + b
    return numQ({
      visual: { kind: 'bigtext', text: `${a} ＋ ${b} ＝ ❓` },
      instruction: `${a} ＋ ${b} ＝ ？`,
      speak: `${a} たす ${b} は いくつ？`,
      answer: sum, cc, spread: 3, say: `こたえは ${sum}`,
      explain: `${a}に ${10 - a}を たして 10。のこりは ${b - (10 - a)}。だから ${sum}だよ`
    })
  }

  // --- ひきざん（10まで）---
  if (kind === 'sub') {
    const a = rng(4, 10)
    const b = rng(1, a - 1)
    const diff = a - b
    return numQ({
      visual: { kind: 'bigtext', text: `${a} − ${b} ＝ ❓` },
      instruction: `${a} − ${b} ＝ ？`,
      speak: `${a} ひく ${b} は いくつ？`,
      answer: diff, cc, spread: 2, say: `こたえは ${diff}`,
      explain: `${a}から ${b}を とると ${diff}だよ`
    })
  }

  // --- くりさがりの ひきざん（〜20）---
  const a = rng(11, 18)
  const b = rng(a - 9, 9)
  const diff = a - b
  return numQ({
    visual: { kind: 'bigtext', text: `${a} − ${b} ＝ ❓` },
    instruction: `${a} − ${b} ＝ ？`,
    speak: `${a} ひく ${b} は いくつ？`,
    answer: diff, cc, spread: 3, say: `こたえは ${diff}`,
    explain: `10から ${b}を ひいて、のこりと あわせると ${diff}だよ`
  })
}
