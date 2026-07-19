// ============================================================
// 「すうじ／さんすう」分野（年長〜小6）
//
// 学年 (params.grade) ごとに出題タイプが増えていく:
//   年長: かぞえる / くらべっこ / たしざん(〜10) / 10づくり / 数のならび
//   小1: + くり上がり・くり下がり / 100までのくらべ / 3つの数
//   小2: + 2けたの筆算 / かけ算九九 / 1000までの数
//   小3: + わり算 / あまりのあるわり算 / 3けた± / 2けた×1けた / 同分母分数
//   小4: + 3けた÷1けた / 小数のたし引き / 大きな数
//   小5: + 小数×整数 / 異分母分数のたし算 / 百分率(%)
//   小6: + 分数×整数 / 比 / 速さ
//
// 各問題は itemKey = 出題タイプ名 を持ち、間違えると復習キューに入る。
// generateNumbersQuestion(params, reviewKind) で同タイプを再出題できる。
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
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

// 数値の選択肢（近い数のダミー）
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

// 文字列答え用の選択肢（分数・比など。dummies から重複なしで選ぶ）
function stringChoices(answer, dummies, count) {
  const opts = [answer]
  for (const d of shuffle(dummies)) {
    if (opts.length >= count) break
    if (!opts.includes(d)) opts.push(d)
  }
  return shuffle(opts).map((v) => ({ id: v, label: v }))
}

function numQ(kind, { visual, instruction, speak, answer, cc, spread, say, explain, choices }) {
  return {
    domain: 'suuji',
    type: 'choice',
    itemKey: `n:${kind}`,
    visual,
    instruction,
    speak,
    answerId: String(answer),
    choices: choices || numberChoices(answer, cc, spread),
    answerWord: { text: say },
    explain: explain || `こたえは ${answer}`
  }
}

function emojiRow(emoji, n) {
  return emoji.repeat(n)
}

// ---- 出題タイプごとのビルダー ----
const BUILDERS = {
  // 年長〜
  count(p) {
    const emoji = pick(COUNT_EMOJI)
    const n = rng(3, Math.min(5 + p.level * 2, 12))
    return numQ('count', {
      visual: { kind: 'groups', groups: [{ emoji, n }] },
      instruction: 'いくつ あるかな？',
      speak: 'いくつ あるか かぞえて、すうじを えらんでね',
      answer: n, cc: p.cc, spread: 2, say: `${n}こ`,
      explain: `5こずつ かぞえると はやいよ。ぜんぶで ${n}こ`
    })
  },
  compareCards(p) {
    const e1 = pick(COUNT_EMOJI)
    let e2 = pick(COUNT_EMOJI)
    if (e2 === e1) e2 = COUNT_EMOJI[(COUNT_EMOJI.indexOf(e1) + 1) % COUNT_EMOJI.length]
    let a = rng(2, Math.min(4 + p.level * 2, 12))
    let b = rng(2, Math.min(4 + p.level * 2, 12))
    if (a === b) b = b >= 12 ? b - 1 : b + 1
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:compareCards', visual: null,
      instruction: 'おおい ほうを タッチ！',
      speak: 'かずが おおいのは どっちかな？',
      answerId: a > b ? 'a' : 'b',
      choices: [{ id: 'a', grid: { emoji: e1, n: a } }, { id: 'b', grid: { emoji: e2, n: b } }],
      answerWord: { text: `おおいほうは ${Math.max(a, b)}こ` },
      explain: `${Math.max(a, b)}この ほうが おおいね`
    }
  },
  add10(p) {
    const emoji = pick(COUNT_EMOJI)
    const a = rng(1, 5)
    const b = rng(1, Math.min(5, 10 - a))
    return numQ('add10', {
      visual: { kind: 'groups', groups: [{ emoji, n: a }, { emoji, n: b }], op: '＋' },
      instruction: `${a} ＋ ${b} ＝ ？`,
      speak: `${a} たす ${b} は いくつ？`,
      answer: a + b, cc: p.cc, spread: 2, say: `${a}たす${b}は${a + b}`,
      explain: `ぜんぶ あわせて かぞえよう。${a}たす${b}は ${a + b}`
    })
  },
  make10(p) {
    const a = rng(1, 9)
    return numQ('make10', {
      visual: { kind: 'tenframe', filled: a },
      instruction: `${a} と いくつで 10？`,
      speak: `ほしが ${a}こ。あと いくつで 10に なるかな？`,
      answer: 10 - a, cc: p.cc, spread: 2, say: `${10 - a}`,
      explain: `あいている マスを かぞえよう。${a}と ${10 - a}で 10だよ`
    })
  },
  sequence(p) {
    const step = p.grade >= 2 ? pick([1, 2, 5, 10]) : 1
    const start = rng(1, p.grade >= 2 ? 40 : 12)
    const seq = [start, start + step, start + step * 2, start + step * 3]
    const hole = rng(1, 2)
    const ans = seq[hole]
    return numQ('sequence', {
      visual: { kind: 'bigtext', text: seq.map((v, i) => (i === hole ? '❓' : v)).join('   ') },
      instruction: '❓に はいる かずは？',
      speak: 'かずの ならびを よく みて、はてなに はいる かずを えらんでね',
      answer: ans, cc: p.cc, spread: step, say: `${ans}`,
      explain: `${step}ずつ ふえているね。こたえは ${ans}`
    })
  },
  sub10(p) {
    const a = rng(4, 10)
    const b = rng(1, a - 1)
    return numQ('sub10', {
      visual: { kind: 'bigtext', text: `${a} − ${b} ＝ ❓` },
      instruction: `${a} − ${b} ＝ ？`,
      speak: `${a} ひく ${b} は いくつ？`,
      answer: a - b, cc: p.cc, spread: 2, say: `こたえは ${a - b}`,
      explain: `${a}から ${b}を とると ${a - b}だよ`
    })
  },
  // 小1〜
  addCarry(p) {
    const a = rng(5, 9)
    const b = rng(Math.max(2, 11 - a), 9)
    return numQ('addCarry', {
      visual: { kind: 'bigtext', text: `${a} ＋ ${b} ＝ ❓` },
      instruction: `${a} ＋ ${b} ＝ ？`,
      speak: `${a} たす ${b} は いくつ？`,
      answer: a + b, cc: p.cc, spread: 3, say: `こたえは ${a + b}`,
      explain: `${a}に ${10 - a}を たして 10。のこりは ${b - (10 - a)}。だから ${a + b}`
    })
  },
  subBorrow(p) {
    const a = rng(11, 18)
    const b = rng(a - 9, 9)
    return numQ('subBorrow', {
      visual: { kind: 'bigtext', text: `${a} − ${b} ＝ ❓` },
      instruction: `${a} − ${b} ＝ ？`,
      speak: `${a} ひく ${b} は いくつ？`,
      answer: a - b, cc: p.cc, spread: 3, say: `こたえは ${a - b}`,
      explain: `10から ${b}を ひいて、のこりと あわせると ${a - b}`
    })
  },
  compareNum(p) {
    const max = p.grade >= 2 ? 999 : 99
    let a = rng(1, max)
    let b = rng(1, max)
    if (a === b) b = (b % max) + 1
    const big = Math.max(a, b)
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:compareNum', visual: null,
      instruction: 'おおきい かずを タッチ！',
      speak: `${a}と ${b}、おおきいのは どっち？`,
      answerId: String(big),
      choices: shuffle([a, b]).map((v) => ({ id: String(v), label: String(v), speak: `${v}` })),
      answerWord: { text: `おおきいのは ${big}` },
      explain: `くらいの おおきい ほうから くらべよう。${big}が おおきい`
    }
  },
  add3nums(p) {
    const a = rng(1, 6), b = rng(1, 6), c = rng(1, 6)
    return numQ('add3nums', {
      visual: { kind: 'bigtext', text: `${a} ＋ ${b} ＋ ${c} ＝ ❓` },
      instruction: `${a}＋${b}＋${c} ＝ ？`,
      speak: `${a} たす ${b} たす ${c} は いくつ？`,
      answer: a + b + c, cc: p.cc, spread: 2, say: `こたえは ${a + b + c}`,
      explain: `まえから じゅんばんに。${a}たす${b}は${a + b}、それに${c}で ${a + b + c}`
    })
  },
  // 小2〜
  add2digit(p) {
    const a = rng(12, 78), b = rng(11, 99 - a)
    return numQ('add2digit', {
      visual: { kind: 'bigtext', text: `${a} ＋ ${b} ＝ ❓` },
      instruction: `${a} ＋ ${b} ＝ ？`,
      speak: `${a} たす ${b} は いくつ？`,
      answer: a + b, cc: p.cc, spread: 10, say: `こたえは ${a + b}`,
      explain: `一のくらいから けいさんしよう。こたえは ${a + b}`
    })
  },
  sub2digit(p) {
    const a = rng(30, 99), b = rng(11, a - 5)
    return numQ('sub2digit', {
      visual: { kind: 'bigtext', text: `${a} − ${b} ＝ ❓` },
      instruction: `${a} − ${b} ＝ ？`,
      speak: `${a} ひく ${b} は いくつ？`,
      answer: a - b, cc: p.cc, spread: 10, say: `こたえは ${a - b}`,
      explain: `一のくらいから けいさんしよう。こたえは ${a - b}`
    })
  },
  kuku(p) {
    const dan = p.level <= 3 ? pick([2, 3, 5]) : rng(2, 9)
    const b = rng(1, 9)
    return numQ('kuku', {
      visual: { kind: 'bigtext', text: `${dan} × ${b} ＝ ❓` },
      instruction: `${dan} × ${b} ＝ ？`,
      speak: `${dan} かける ${b} は いくつ？`,
      answer: dan * b, cc: p.cc, spread: dan, say: `${dan}かける${b}は${dan * b}`,
      explain: `${dan}のだんの 九九だよ。${dan}が ${b}こぶんで ${dan * b}`
    })
  },
  // 小3〜
  div(p) {
    const b = rng(2, 9), ans = rng(2, 9)
    const a = b * ans
    return numQ('div', {
      visual: { kind: 'bigtext', text: `${a} ÷ ${b} ＝ ❓` },
      instruction: `${a} ÷ ${b} ＝ ？`,
      speak: `${a} わる ${b} は いくつ？`,
      answer: ans, cc: p.cc, spread: 2, say: `こたえは ${ans}`,
      explain: `${b}に なにを かけたら ${a}かな？ ${b}かける${ans}は${a}だから こたえは ${ans}`
    })
  },
  divRemainder(p) {
    const b = rng(2, 9), q = rng(2, 8), r = rng(1, b - 1)
    const a = b * q + r
    const answer = `${q} あまり ${r}`
    const dummies = [`${q} あまり ${(r % (b - 1)) + 1}`, `${q + 1} あまり ${r}`, `${q - 1} あまり ${r}`, `${q} あまり ${Math.max(1, r - 1)}`].filter((d) => d !== answer)
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:divRemainder',
      visual: { kind: 'bigtext', text: `${a} ÷ ${b} ＝ ❓` },
      instruction: `${a} ÷ ${b} ＝ ？（あまりも！）`,
      speak: `${a} わる ${b} は？ あまりも かんがえてね`,
      answerId: answer,
      choices: stringChoices(answer, dummies, p.cc),
      answerWord: { text: answer },
      explain: `${b}かける${q}は${b * q}。${a}まで あと${r}だから ${answer}`
    }
  },
  add3digit(p) {
    const a = rng(120, 780), b = rng(110, 999 - a)
    return numQ('add3digit', {
      visual: { kind: 'bigtext', text: `${a} ＋ ${b} ＝ ❓` },
      instruction: `${a} ＋ ${b} ＝ ？`,
      speak: `${a} たす ${b} は いくつ？`,
      answer: a + b, cc: p.cc, spread: 100, say: `こたえは ${a + b}`,
      explain: `くらいごとに けいさんしよう。こたえは ${a + b}`
    })
  },
  mul2x1(p) {
    const a = rng(12, 49), b = rng(2, 6)
    return numQ('mul2x1', {
      visual: { kind: 'bigtext', text: `${a} × ${b} ＝ ❓` },
      instruction: `${a} × ${b} ＝ ？`,
      speak: `${a} かける ${b} は いくつ？`,
      answer: a * b, cc: p.cc, spread: b * 3, say: `こたえは ${a * b}`,
      explain: `${Math.floor(a / 10) * 10}かける${b}と ${a % 10}かける${b}に わけて けいさん。こたえは ${a * b}`
    })
  },
  fracCompareSame(p) {
    const d = pick([3, 4, 5, 6, 8])
    let a = rng(1, d - 1)
    let b = rng(1, d - 1)
    if (a === b) b = (b % (d - 1)) + 1
    const big = Math.max(a, b)
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:fracCompareSame', visual: null,
      instruction: 'おおきい ほうを タッチ！',
      speak: `${d}ぶんの${a} と ${d}ぶんの${b}、おおきいのは どっち？`,
      answerId: `${big}/${d}`,
      choices: shuffle([a, b]).map((v) => ({ id: `${v}/${d}`, label: `${v}/${d}` })),
      answerWord: { text: `${d}ぶんの${big}` },
      explain: `わける かずが おなじなら、うえの かずが おおきい ほうが おおきいよ`
    }
  },
  // 小4〜
  div3digit(p) {
    const b = rng(2, 9), ans = rng(21, 120)
    const a = b * ans
    return numQ('div3digit', {
      visual: { kind: 'bigtext', text: `${a} ÷ ${b} ＝ ❓` },
      instruction: `${a} ÷ ${b} ＝ ？`,
      speak: `${a} わる ${b} は いくつ？`,
      answer: ans, cc: p.cc, spread: 8, say: `こたえは ${ans}`,
      explain: `ひっさんで うえの くらいから わっていこう。こたえは ${ans}`
    })
  },
  decimalAdd(p) {
    const a = rng(1, 89) / 10, b = rng(1, 89) / 10
    const ans = Math.round((a + b) * 10) / 10
    const mk = (v) => (Math.round(v * 10) / 10).toFixed(1)
    const dummies = [mk(ans + 0.1), mk(ans - 0.1), mk(ans + 1), mk(Math.abs(ans - 1))]
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:decimalAdd',
      visual: { kind: 'bigtext', text: `${a.toFixed(1)} ＋ ${b.toFixed(1)} ＝ ❓` },
      instruction: `${a.toFixed(1)} ＋ ${b.toFixed(1)} ＝ ？`,
      speak: `しょうすうの たしざんだよ`,
      answerId: mk(ans),
      choices: stringChoices(mk(ans), dummies, p.cc),
      answerWord: { text: mk(ans) },
      explain: `てんの いちを そろえて けいさんしよう。こたえは ${mk(ans)}`
    }
  },
  bigNumbers(p) {
    const a = rng(1, 99) * 1000, b = rng(1, 99) * 1000
    const big = Math.max(a, b === a ? b + 1000 : b)
    const other = big === a ? (b === a ? b + 1000 : b) : a
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:bigNumbers', visual: null,
      instruction: 'おおきい かずを タッチ！',
      speak: 'おおきい かずを えらんでね',
      answerId: String(big),
      choices: shuffle([big, other]).map((v) => ({ id: String(v), label: v.toLocaleString('ja-JP') })),
      answerWord: { text: big.toLocaleString('ja-JP') },
      explain: `けたの おおきい ほうから くらべよう`
    }
  },
  // 小5〜
  decimalMul(p) {
    const a = rng(2, 99) / 10, b = rng(2, 9)
    const ans = Math.round(a * b * 10) / 10
    const mk = (v) => String(Math.round(v * 10) / 10)
    const dummies = [mk(ans + b / 10), mk(ans - b / 10), mk(ans * 10), mk(ans + 1)]
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:decimalMul',
      visual: { kind: 'bigtext', text: `${a} × ${b} ＝ ❓` },
      instruction: `${a} × ${b} ＝ ？`,
      speak: `しょうすうの かけざんだよ`,
      answerId: mk(ans),
      choices: stringChoices(mk(ans), dummies, p.cc),
      answerWord: { text: mk(ans) },
      explain: `${Math.round(a * 10)}かける${b}を けいさんして、てんを ひとつ もどそう。こたえは ${mk(ans)}`
    }
  },
  fracAddDiff(p) {
    // 通分が1回でできる、きれいな組み合わせ
    const pairs = [[1, 2, 1, 4], [1, 2, 1, 6], [1, 3, 1, 6], [1, 2, 1, 8], [1, 4, 1, 8], [2, 3, 1, 6], [1, 3, 1, 9]]
    const [a, b, c, d] = pick(pairs)
    const denom = (b * d) / gcd(b, d)
    const num = a * (denom / b) + c * (denom / d)
    const g = gcd(num, denom)
    const ans = `${num / g}/${denom / g}`
    const dummies = [`${a + c}/${b + d}`, `${num}/${denom * 2}`, `${num / g + 1}/${denom / g}`, `${a + c}/${Math.max(b, d)}`].filter((x) => x !== ans)
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:fracAddDiff',
      visual: { kind: 'bigtext', text: `${a}/${b} ＋ ${c}/${d} ＝ ❓` },
      instruction: `${a}/${b} ＋ ${c}/${d} ＝ ？`,
      speak: `ぶんぼの ちがう ぶんすうの たしざんだよ。つうぶんしてから たそう`,
      answerId: ans,
      choices: stringChoices(ans, dummies, p.cc),
      answerWord: { text: ans },
      explain: `ぶんぼを ${denom}に そろえると ${a * (denom / b)}/${denom} ＋ ${c * (denom / d)}/${denom}。こたえは ${ans}`
    }
  },
  percent(p) {
    const base = pick([200, 300, 400, 500, 600, 800, 1000])
    const pct = pick([10, 20, 25, 50])
    const ans = (base * pct) / 100
    return numQ('percent', {
      visual: { kind: 'bigtext', text: `${base} の ${pct}％ ＝ ❓` },
      instruction: `${base}の ${pct}％は？`,
      speak: `${base}の ${pct}パーセントは いくつ？`,
      answer: ans, cc: p.cc, spread: Math.max(5, ans / 4), say: `こたえは ${ans}`,
      explain: `${pct}％は ${pct / 100}を かけること。${base}かける${pct / 100}で ${ans}`
    })
  },
  // 小6〜
  fracMul(p) {
    const pairs = [[1, 2, 4], [1, 3, 6], [2, 3, 6], [1, 4, 8], [3, 4, 8], [2, 5, 10], [1, 5, 10]]
    const [a, b, m] = pick(pairs)
    const num = a * m
    const ans = num / b
    return numQ('fracMul', {
      visual: { kind: 'bigtext', text: `${a}/${b} × ${m} ＝ ❓` },
      instruction: `${a}/${b} × ${m} ＝ ？`,
      speak: `ぶんすうかける せいすうだよ`,
      answer: ans, cc: p.cc, spread: 2, say: `こたえは ${ans}`,
      explain: `うえの かずに ${m}を かけて ${num}/${b}。やくぶんすると ${ans}`
    })
  },
  ratio(p) {
    const a = rng(2, 6), b = rng(2, 6), k = rng(2, 5)
    const ans = b * k
    return numQ('ratio', {
      visual: { kind: 'bigtext', text: `${a} : ${b} ＝ ${a * k} : ❓` },
      instruction: `${a}：${b} ＝ ${a * k}：？`,
      speak: `ひが ひとしく なるように、はてなの かずを えらんでね`,
      answer: ans, cc: p.cc, spread: b, say: `こたえは ${ans}`,
      explain: `${a}が ${k}ばいで ${a * k}。だから ${b}も ${k}ばいして ${ans}`
    })
  },
  speed(p) {
    const v = pick([30, 40, 50, 60, 80]), t = rng(2, 5)
    const ans = v * t
    return numQ('speed', {
      visual: { kind: 'bigtext', text: `じそく ${v}km で ${t}じかん ＝ ❓ km` },
      instruction: `じそく${v}kmで ${t}じかん すすむと？`,
      speak: `じそく ${v}キロメートルで ${t}じかん はしると、なんキロ すすむ？`,
      answer: ans, cc: p.cc, spread: v / 2, say: `${ans}キロメートル`,
      explain: `みちのりは はやさ かける じかん。${v}かける${t}で ${ans}キロだよ`
    })
  }
}

// 学年ごとの出題タイプ（あとの学年ほど前の学年の一部も混ざる）
function kindsForGrade(grade, level) {
  if (grade <= 0) {
    const k = ['count', 'compareCards', 'add10', 'make10']
    if (level >= 3) k.push('sub10', 'sequence')
    return k
  }
  if (grade === 1) {
    const k = ['add10', 'make10', 'sub10', 'addCarry', 'sequence']
    if (level >= 3) k.push('subBorrow', 'compareNum', 'add3nums', 'addCarry', 'subBorrow')
    return k
  }
  if (grade === 2) {
    const k = ['addCarry', 'subBorrow', 'add2digit', 'sub2digit', 'kuku', 'kuku', 'sequence']
    if (level >= 4) k.push('compareNum', 'kuku')
    return k
  }
  if (grade === 3) {
    const k = ['kuku', 'div', 'div', 'add3digit', 'mul2x1']
    if (level >= 3) k.push('divRemainder', 'fracCompareSame', 'divRemainder')
    return k
  }
  if (grade === 4) {
    const k = ['mul2x1', 'div', 'divRemainder', 'div3digit', 'decimalAdd']
    if (level >= 3) k.push('bigNumbers', 'decimalAdd', 'div3digit')
    return k
  }
  if (grade === 5) {
    const k = ['div3digit', 'decimalAdd', 'decimalMul', 'fracAddDiff']
    if (level >= 3) k.push('percent', 'fracAddDiff', 'decimalMul')
    return k
  }
  // 小6
  const k = ['decimalMul', 'fracAddDiff', 'percent', 'fracMul', 'ratio']
  if (level >= 3) k.push('speed', 'ratio', 'fracMul')
  return k
}

/**
 * すうじの問題を1問生成する。
 * @param {object} params 難易度パラメータ（grade を含む）
 * @param {string|null} reviewKey 'n:タイプ名'（復習したい出題タイプ）
 */
export function generateNumbersQuestion(params, reviewKey = null) {
  const grade = params.grade || 0
  const p = { ...params, grade, cc: Math.max(3, params.choiceCount) }

  if (reviewKey && reviewKey.startsWith('n:')) {
    const kind = reviewKey.slice(2)
    if (BUILDERS[kind]) return BUILDERS[kind](p)
  }
  const kind = pick(kindsForGrade(grade, params.level))
  return BUILDERS[kind](p)
}

// 復習画面でのラベル表示用
export const KIND_LABELS = {
  count: 'かぞえる', compareCards: 'くらべっこ', add10: 'たしざん', make10: '10づくり',
  sequence: 'かずのならび', sub10: 'ひきざん', addCarry: 'くり上がり', subBorrow: 'くり下がり',
  compareNum: 'かずくらべ', add3nums: '3つのかず', add2digit: '2けたのたしざん',
  sub2digit: '2けたのひきざん', kuku: '九九', div: 'わり算', divRemainder: 'あまりのわり算',
  add3digit: '3けたのたしざん', mul2x1: '2けた×1けた', fracCompareSame: 'ぶんすうくらべ',
  div3digit: 'わり算(大)', decimalAdd: 'しょうすう＋', bigNumbers: 'おおきなかず',
  decimalMul: 'しょうすう×', fracAddDiff: 'ぶんすう＋', percent: 'パーセント',
  fracMul: 'ぶんすう×', ratio: 'ひ', speed: 'はやさ'
}
