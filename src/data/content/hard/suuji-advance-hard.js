// ============================================================
// むずかしいモード（Phase 2 / WP10 低学年拡張）— さんすう 先取りチャレンジ
//
// 対象は小1〜3。パズル（suuji-puzzle-hard.js）とは別に、今の学年より
// 1つ先の学年で新しく出てくる考え方を、4択形式でやさしく先取りする。
//   小1: 九九の考え方（同じ数をくり返したす・小2で本格化） /
//        偶数・奇数（小2 evenOdd の先取り）
//   小2: 3けたのたし算（小3 add3digit の先取り） /
//        わり算の考え方（同じ数ずつ分ける・小3 div の先取り）
//   小3: 小数のたし算（小4 decimalAdd の先取り） /
//        3けた×1けたのかけ算（小4 mul3x1 の先取り）
//
// 通常モードとの分離（計画書§4.2(d)、suuji-puzzle-hard.jsと同じ設計）:
//   - itemKeyは同じ `hard:n:${kind}` 名前空間を使う（domain:'suuji'なので
//     unitIdFor()が自動で 'hard:math:${kind}' を割りあてる）。
//   - kind名はsuuji-puzzle-hard.js/numbers-hard.jsと重ならない。
//   - 対象は「その学年ではまだ習わない、1つ先の学年の単元」だけに限定する
//     （例: 小1のaddCarry/subBorrowは既に通常小1で習うため先取り対象外）。
// ============================================================

function rng(min, max) { return Math.floor(min + Math.random() * (max - min + 1)) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function choiceQ(kind, { visual, instruction, speak, answer, choices, explain }) {
  return {
    domain: 'suuji',
    type: 'choice',
    itemKey: `hard:n:${kind}`,
    visual,
    instruction,
    speak,
    choices,
    answerId: answer,
    answerWord: { text: answer },
    explain
  }
}

// 数値の答えに対して、近い値を候補にした4択を作る（0以下・重複は除く）。
function numberChoices(answer, deltas) {
  const wrongs = []
  for (const d of shuffle(deltas)) {
    const w = answer + d
    if (w > 0 && w !== answer && !wrongs.includes(w)) wrongs.push(w)
    if (wrongs.length === 3) break
  }
  return shuffle([answer, ...wrongs])
}

const ADVANCE_BUILDERS = {
  // ---- 小1: 九九の考え方（同じ数をくり返したす） ----
  jrKukuPreview() {
    const base = pick([2, 5, 10])
    const times = rng(2, 5)
    const answer = base * times
    const options = numberChoices(answer, [-base, base, -1, 1, -2, 2])
    return choiceQ('jrKukuPreview', {
      visual: { kind: 'sentence', text: `${base}を ${times}かい たすと いくつ？` },
      instruction: 'こたえは？',
      speak: `${base}を ${times}かい たすと いくつでしょう？`,
      answer: String(answer),
      choices: options.map((n) => ({ id: String(n), label: String(n) })),
      explain: `${Array(times).fill(base).join('＋')}＝${answer}だよ。これが「かけ算」の考え方だよ`
    })
  },

  // ---- 小1: 偶数・奇数 ----
  jrGuukisuuPreview() {
    const n = rng(1, 20)
    const even = n % 2 === 0
    const answer = even ? 'ぐうすう（2でわりきれる）' : 'きすう（2でわると1あまる）'
    const other = even ? 'きすう（2でわると1あまる）' : 'ぐうすう（2でわりきれる）'
    return choiceQ('jrGuukisuuPreview', {
      visual: { kind: 'bigtext', text: String(n) },
      instruction: `${n}は どっち？`,
      speak: `${n}は、ぐうすうと きすうの どちらでしょう？`,
      answer,
      choices: shuffle([answer, other]).map((label) => ({ id: label, label })),
      explain: `${n}を 2こずつ組にすると、${even ? 'ぴったり分けられる（あまりが出ない）ので ぐうすう' : '1こあまるので きすう'}だよ`
    })
  },

  // ---- 小2: 3けたのたし算 ----
  jr3DigitAddPreview() {
    const a = rng(100, 499)
    const b = rng(100, 499)
    const answer = a + b
    const options = numberChoices(answer, [-100, 100, -10, 10, -1, 1])
    return choiceQ('jr3DigitAddPreview', {
      visual: { kind: 'sentence', text: `${a} ＋ ${b} ＝ ？` },
      instruction: 'こたえは？',
      speak: `${a}足す${b}は いくつでしょう？`,
      answer: String(answer),
      choices: options.map((n) => ({ id: String(n), label: String(n) })),
      explain: `一のくらい・十のくらい・百のくらいの じゅんに たすと、${a}＋${b}＝${answer}だよ`
    })
  },

  // ---- 小2: わり算の考え方（同じ数ずつ分ける） ----
  jrWarizanPreview() {
    const divisor = pick([2, 3, 4, 5])
    const quotient = rng(2, 9)
    const dividend = divisor * quotient
    const options = numberChoices(quotient, [-2, 2, -1, 1, -3, 3])
    return choiceQ('jrWarizanPreview', {
      visual: { kind: 'sentence', text: `${dividend}こを ${divisor}人で 同じ数ずつ分けます。1人分は 何こ？` },
      instruction: '1人分は 何こ？',
      speak: `${dividend}こを ${divisor}人で 同じ数ずつ分けると、1人分は 何こでしょう？`,
      answer: String(quotient),
      choices: options.map((n) => ({ id: String(n), label: String(n) })),
      explain: `${dividend}を ${divisor}人で 同じ数ずつ分けるので、${dividend}÷${divisor}＝${quotient}こだよ。これが「わり算」の考え方だよ`
    })
  },

  // ---- 小3: 小数のたし算 ----
  jrDecimalAddPreview() {
    const aTenths = rng(10, 45)
    const bTenths = rng(10, 45)
    const sumTenths = aTenths + bTenths
    const fmt = (t) => `${Math.floor(t / 10)}.${t % 10}`
    const answer = fmt(sumTenths)
    const deltaOptions = [-10, 10, -1, 1, -2, 2].map((d) => sumTenths + d).filter((t) => t > 0 && t !== sumTenths)
    const options = shuffle([sumTenths, ...[...new Set(deltaOptions)].slice(0, 3)]).map(fmt)
    return choiceQ('jrDecimalAddPreview', {
      visual: { kind: 'sentence', text: `${fmt(aTenths)} ＋ ${fmt(bTenths)} ＝ ？` },
      instruction: 'こたえは？',
      speak: `${fmt(aTenths)}足す${fmt(bTenths)}は いくつでしょう？`,
      answer,
      choices: options.map((label) => ({ id: label, label })),
      explain: `小数点の位置を そろえて たすと、${fmt(aTenths)}＋${fmt(bTenths)}＝${answer}だよ`
    })
  },

  // ---- 小3: 3けた×1けたのかけ算 ----
  jrMul3x1Preview() {
    const a = rng(110, 299)
    const b = rng(2, 4)
    const answer = a * b
    const options = numberChoices(answer, [-a, a, -10, 10, -1, 1])
    return choiceQ('jrMul3x1Preview', {
      visual: { kind: 'sentence', text: `${a} × ${b} ＝ ？` },
      instruction: 'こたえは？',
      speak: `${a}かける${b}は いくつでしょう？`,
      answer: String(answer),
      choices: options.map((n) => ({ id: String(n), label: String(n) })),
      explain: `一のくらい・十のくらい・百のくらいの じゅんに ${b}を かけると、${a}×${b}＝${answer}だよ`
    })
  }
}

export const HARD_ADVANCE_KINDS = Object.keys(ADVANCE_BUILDERS)

export const HARD_ADVANCE_KINDS_BY_GRADE = {
  1: ['jrKukuPreview', 'jrGuukisuuPreview'],
  2: ['jr3DigitAddPreview', 'jrWarizanPreview'],
  3: ['jrDecimalAddPreview', 'jrMul3x1Preview']
}

export function generateHardAdvanceQuestion(params, reviewKey = null) {
  const grade = params.grade || 1
  if (reviewKey && reviewKey.startsWith('hard:n:')) {
    const kind = reviewKey.slice(7).split('#')[0]
    if (ADVANCE_BUILDERS[kind]) return ADVANCE_BUILDERS[kind]()
  }
  const kinds = HARD_ADVANCE_KINDS_BY_GRADE[grade] || HARD_ADVANCE_KINDS_BY_GRADE[1]
  const kind = pick(kinds)
  return ADVANCE_BUILDERS[kind]()
}

export const HARD_ADVANCE_LABELS = {
  jrKukuPreview: '九九の さきどり', jrGuukisuuPreview: '偶数・奇数',
  jr3DigitAddPreview: '3けたのたし算', jrWarizanPreview: 'わり算の さきどり',
  jrDecimalAddPreview: '小数のたし算', jrMul3x1Preview: '3けた×1けたの かけ算'
}
