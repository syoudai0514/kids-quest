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
// 各問題は itemKey = 出題タイプ名 を持つ。実際の復習キーは画面側で
// 問題ごとに分け、元の問題スナップショットを優先して再出題する。
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

function numQ(kind, { visual, instruction, speak, answer, cc, spread, say, explain, choices, type = 'choice', ...rest }) {
  return {
    domain: 'suuji',
    type,
    itemKey: `n:${kind}`,
    visual,
    instruction,
    speak,
    answerId: String(answer),
    choices: type === 'choice' ? (choices || numberChoices(answer, cc, spread)) : undefined,
    answerWord: { text: say },
    explain: explain || `こたえは ${answer}`,
    ...rest
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
  // 年長から「自分で数字を入れる」感覚を育てる。選択肢を当てるだけでなく、
  // 数を頭から取り出す想起練習になるので、簡単な範囲だけテンキーにする。
  countKeypad(p) {
    const emoji = pick(COUNT_EMOJI)
    const n = rng(3, 9)
    return numQ('countKeypad', {
      type: 'keypad', visual: { kind: 'groups', groups: [{ emoji, n }] },
      instruction: 'いくつ あるかな？ すうじを いれてね',
      speak: 'いくつ あるか かぞえて、テンキーで すうじを いれてね',
      answer: n, say: `${n}こ`,
      explain: `ゆびで ひとつずつ かぞえると、${n}こだよ`
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
  addKeypad(p) {
    const emoji = pick(COUNT_EMOJI)
    const a = rng(1, 5)
    const b = rng(1, 5)
    return numQ('addKeypad', {
      type: 'keypad', visual: { kind: 'groups', groups: [{ emoji, n: a }, { emoji, n: b }], op: '＋' },
      instruction: `${a} ＋ ${b} ＝ ？ すうじを いれてね`,
      speak: `${a} たす ${b} は いくつ？ テンキーで こたえてね`,
      answer: a + b, say: `${a}たす${b}は${a + b}`,
      explain: `ぜんぶ あわせて かぞえると ${a + b}`
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
  orderNumbers(p) {
    const start = rng(1, 7)
    const nums = shuffle([start, start + rng(2, 4), start + rng(6, 9)])
    const correct = [...nums].sort((a, b) => a - b)
    const items = nums.map((n) => ({ id: String(n), label: String(n) }))
    return {
      domain: 'suuji', type: 'order', itemKey: 'n:orderNumbers', visual: { kind: 'bigtext', text: '🔢 じゅんばんに ならべよう' },
      instruction: 'ちいさい じゅんに タッチ！',
      speak: 'かずを ちいさい じゅんに、ひとつずつ タッチして ならべよう',
      items, correctOrder: correct.map(String), answerId: correct.map(String).join('|'),
      answerWord: { text: correct.join('、') },
      explain: `${correct.join('、')}の じゅんだよ`
    }
  },
  shapeName(p) {
    const shapes = [
      { id: 'circle', label: 'まる', color: '#76d8ff' },
      { id: 'triangle', label: 'さんかく', color: '#ffd166' },
      { id: 'square', label: 'しかく', color: '#ff91b8' },
      { id: 'rectangle', label: 'ながしかく', color: '#9ef0b8' }
    ]
    const target = pick(shapes)
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:shapeName',
      visual: { kind: 'shape', shape: target.id, color: target.color },
      instruction: 'この かたちは なに？', speak: 'この かたちの なまえは なにかな？',
      answerId: target.id, choices: shuffle(shapes.slice(0, 3).includes(target) ? shapes.slice(0, 3) : [target, ...shapes.filter((s) => s.id !== target).slice(0, 2)]).map((s) => ({ id: s.id, label: s.label })),
      answerWord: { text: target.label }, explain: `これは ${target.label}だよ`
    }
  },
  shapeGroups(p) {
    const items = shuffle([
      { id: 'circle', label: 'あお', shape: 'circle', color: '#76d8ff', group: 'round' },
      { id: 'triangle', label: 'きいろ', shape: 'triangle', color: '#ffd166', group: 'corners' },
      { id: 'square', label: 'ももいろ', shape: 'square', color: '#ff91b8', group: 'corners' },
      { id: 'oval', label: 'みどり', shape: 'circle', color: '#9ef0b8', group: 'round' }
    ])
    const correctGroups = Object.fromEntries(items.map((item) => [item.id, item.group]))
    return {
      domain: 'suuji', type: 'group', itemKey: 'n:shapeGroups', visual: { kind: 'shapes', items },
      instruction: 'かたちの なかまで わけよう！', speak: 'まるい かたちと、かどが ある かたちに わけよう',
      items, groups: [{ id: 'round', label: 'まるい' }, { id: 'corners', label: 'かどがある' }], correctGroups,
      answerId: items.map((item) => `${item.id}:${item.group}`).join('|'),
      answerWord: { text: 'まるい・かどがある' }, explain: 'まるには かどがないよ。さんかくと しかくには かどがあるね'
    }
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
  }  ,
  // ---- 追加タイプ（大量増量ぶん） ----
  holeAdd(p) {
    const b = rng(2, 8), ans = rng(1, 9)
    return numQ('holeAdd', {
      visual: { kind: 'bigtext', text: `❓ ＋ ${b} ＝ ${ans + b}` },
      instruction: `❓ ＋ ${b} ＝ ${ans + b}`,
      speak: `はてなに ${b}を たすと ${ans + b}。はてなは いくつ？`,
      answer: ans, cc: p.cc, spread: 2, say: `${ans}`,
      explain: `${ans + b}から ${b}を ひけば わかるよ。こたえは ${ans}`
    })
  },
  holeSub(p) {
    const b = rng(2, 8), ans = rng(2, 9)
    return numQ('holeSub', {
      visual: { kind: 'bigtext', text: `❓ − ${b} ＝ ${ans}` },
      instruction: `❓ − ${b} ＝ ${ans}`,
      speak: `はてなから ${b}を ひくと ${ans}。はてなは いくつ？`,
      answer: ans + b, cc: p.cc, spread: 2, say: `${ans + b}`,
      explain: `${ans}に ${b}を たせば わかるよ。こたえは ${ans + b}`
    })
  },
  double(p) {
    const a = rng(3, 40)
    return numQ('double', {
      visual: { kind: 'bigtext', text: `${a} の 2ばい ＝ ❓` },
      instruction: `${a}の 2ばいは？`,
      speak: `${a}の 2ばいは いくつ？`,
      answer: a * 2, cc: p.cc, spread: 4, say: `${a * 2}`,
      explain: `おなじ かずを もういっかい たすと ${a * 2}`
    })
  },
  half(p) {
    const ans = rng(2, 30)
    return numQ('half', {
      visual: { kind: 'bigtext', text: `${ans * 2} の はんぶん ＝ ❓` },
      instruction: `${ans * 2}の はんぶんは？`,
      speak: `${ans * 2}の はんぶんは いくつ？`,
      answer: ans, cc: p.cc, spread: 3, say: `${ans}`,
      explain: `ふたつに わけると ${ans}と ${ans}だね`
    })
  },
  evenOdd(p) {
    const even = rng(1, 20) * 2
    let odd = rng(0, 19) * 2 + 1
    const askEven = Math.random() < 0.5
    const target = askEven ? even : odd
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:evenOdd', visual: null,
      instruction: askEven ? 'ぐうすうを タッチ！' : 'きすうを タッチ！',
      speak: askEven
        ? 'ふたつに わけきれる かず、ぐうすうは どっち？'
        : 'ふたつに わけると 1あまる かず、きすうは どっち？',
      answerId: String(target),
      choices: shuffle([even, odd]).map((v) => ({ id: String(v), label: String(v), speak: `${v}` })),
      answerWord: { text: `${target}` },
      explain: askEven ? `${even}は 2で わりきれるから ぐうすう` : `${odd}は 1あまるから きすう`
    }
  },
  moneyAdd(p) {
    const a = pick([10, 20, 30, 50]), b = pick([10, 20, 30, 50])
    return numQ('moneyAdd', {
      visual: { kind: 'bigtext', text: `${a}えん ＋ ${b}えん ＝ ❓えん` },
      instruction: `${a}えんと ${b}えんで いくら？`,
      speak: `${a}えんと ${b}えんを あわせると なんえん？`,
      answer: a + b, cc: p.cc, spread: 10, say: `${a + b}えん`,
      explain: `あわせて ${a + b}えんだよ`
    })
  },
  moneyChange(p) {
    const price = pick([30, 40, 60, 70, 80]), pay = 100
    return numQ('moneyChange', {
      visual: { kind: 'bigtext', text: `100えん − ${price}えん ＝ ❓えん` },
      instruction: `${pay}えんで ${price}えんの おかし。おつりは？`,
      speak: `${pay}えんを だして ${price}えんの おかしを かったよ。おつりは なんえん？`,
      answer: pay - price, cc: p.cc, spread: 10, say: `おつりは ${pay - price}えん`,
      explain: `100から ${price}を ひくと ${pay - price}えん`
    })
  },
  clockPlus(p) {
    const h = rng(1, 10)
    const addHalf = Math.random() < 0.5
    const ans = addHalf ? `${h}じ30ぷん` : `${h + 1}じ`
    const dummies = addHalf
      ? [`${h + 1}じ30ぷん`, `${h}じ`, `${h + 1}じ`]
      : [`${h}じ30ぷん`, `${h + 2}じ`, `${h}じ`]
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:clockPlus',
      visual: { kind: 'bigtext', text: `${h}じ の ${addHalf ? '30ぷん' : '1じかん'}あと ＝ ❓` },
      instruction: `${h}じの ${addHalf ? '30ぷん' : '1じかん'}あとは？`,
      speak: `${h}じの ${addHalf ? 'さんじゅっぷん' : 'いちじかん'}あとは なんじ？`,
      answerId: ans,
      choices: stringChoices(ans, dummies, p.cc),
      answerWord: { text: ans },
      explain: `とけいの はりを すすめて ${ans}だよ`
    }
  },
  lengthConv(p) {
    const m = rng(1, 5)
    return numQ('lengthConv', {
      visual: { kind: 'bigtext', text: `${m}m ＝ ❓cm` },
      instruction: `${m}メートルは なんセンチ？`,
      speak: `${m}メートルは なんセンチメートル？`,
      answer: m * 100, cc: p.cc, spread: 100, say: `${m * 100}センチ`,
      explain: `1メートルは 100センチ。だから ${m * 100}センチ`
    })
  },
  kgConv(p) {
    const kg = rng(1, 5)
    return numQ('kgConv', {
      visual: { kind: 'bigtext', text: `${kg}kg ＝ ❓g` },
      instruction: `${kg}キログラムは なんグラム？`,
      speak: `${kg}キログラムは なんグラム？`,
      answer: kg * 1000, cc: p.cc, spread: 1000, say: `${kg * 1000}グラム`,
      explain: `1キログラムは 1000グラム。だから ${kg * 1000}グラム`
    })
  },
  literConv(p) {
    const l = rng(1, 8)
    return numQ('literConv', {
      visual: { kind: 'bigtext', text: `${l}L ＝ ❓dL` },
      instruction: `${l}リットルは なんデシリットル？`,
      speak: `${l}リットルは なんデシリットル？`,
      answer: l * 10, cc: p.cc, spread: 10, say: `${l * 10}デシリットル`,
      explain: `1リットルは 10デシリットル。だから ${l * 10}デシリットル`
    })
  },
  timeCalc(p) {
    const a = pick([20, 30, 40, 50]), b = pick([20, 30, 40, 50])
    const total = a + b
    const ans = total >= 60 ? `1じかん${total - 60 > 0 ? `${total - 60}ぷん` : ''}` : `${total}ぷん`
    const dummies = [`${total}ぷん`, `1じかん${total - 50}ぷん`, `${a + b + 10}ぷん`, '1じかん'].filter((d) => d !== ans)
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:timeCalc',
      visual: { kind: 'bigtext', text: `${a}ぷん ＋ ${b}ぷん ＝ ❓` },
      instruction: `${a}ぷんと ${b}ぷんで どれくらい？`,
      speak: `${a}ふんと ${b}ふんを あわせると どれくらいの じかん？`,
      answerId: ans,
      choices: stringChoices(ans, dummies, p.cc),
      answerWord: { text: ans },
      explain: `60ぷんで 1じかんだよ。あわせて ${ans}`
    }
  },
  holeMul(p) {
    const b = rng(2, 9), ans = rng(2, 9)
    return numQ('holeMul', {
      visual: { kind: 'bigtext', text: `❓ × ${b} ＝ ${ans * b}` },
      instruction: `❓ × ${b} ＝ ${ans * b}`,
      speak: `はてな かける ${b}は ${ans * b}。はてなは いくつ？`,
      answer: ans, cc: p.cc, spread: 2, say: `${ans}`,
      explain: `${b}のだんで ${ans * b}に なるのは ${ans}だね`
    })
  },
  tensMul(p) {
    const a = rng(2, 9) * 10, b = rng(2, 9)
    return numQ('tensMul', {
      visual: { kind: 'bigtext', text: `${a} × ${b} ＝ ❓` },
      instruction: `${a} × ${b} ＝ ？`,
      speak: `${a} かける ${b} は いくつ？`,
      answer: a * b, cc: p.cc, spread: 30, say: `${a * b}`,
      explain: `${a / 10}かける${b}の 10ばい。こたえは ${a * b}`
    })
  },
  perimeter(p) {
    const a = rng(2, 8), b = rng(2, 8)
    return numQ('perimeter', {
      visual: { kind: 'bigtext', text: `たて${a}cm よこ${b}cm の\nまわりの ながさ ＝ ❓cm` },
      instruction: `まわりの ながさは？`,
      speak: `たて${a}センチ、よこ${b}センチの しかくの まわりの ながさは？`,
      answer: (a + b) * 2, cc: p.cc, spread: 4, say: `${(a + b) * 2}センチ`,
      explain: `たてと よこを たして 2ばい。${a}たす${b}は${a + b}、2ばいで ${(a + b) * 2}センチ`
    })
  },
  mul3x1(p) {
    const a = rng(120, 450), b = rng(2, 4)
    return numQ('mul3x1', {
      visual: { kind: 'bigtext', text: `${a} × ${b} ＝ ❓` },
      instruction: `${a} × ${b} ＝ ？`,
      speak: `${a} かける ${b} は いくつ？`,
      answer: a * b, cc: p.cc, spread: 100, say: `${a * b}`,
      explain: `くらいごとに かけて たそう。こたえは ${a * b}`
    })
  },
  decimalSub(p) {
    const ans = rng(1, 60) / 10, b = rng(1, 30) / 10
    const a = Math.round((ans + b) * 10) / 10
    const mk = (v) => (Math.round(v * 10) / 10).toFixed(1)
    const dummies = [mk(ans + 0.1), mk(Math.max(0.1, ans - 0.1)), mk(ans + 1)]
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:decimalSub',
      visual: { kind: 'bigtext', text: `${mk(a)} − ${mk(b)} ＝ ❓` },
      instruction: `${mk(a)} − ${mk(b)} ＝ ？`,
      speak: 'しょうすうの ひきざんだよ',
      answerId: mk(ans),
      choices: stringChoices(mk(ans), dummies, p.cc),
      answerWord: { text: mk(ans) },
      explain: `てんの いちを そろえて ひこう。こたえは ${mk(ans)}`
    }
  },
  roundNum(p) {
    const a = rng(1100, 9900)
    const ans = Math.round(a / 100) * 100
    return numQ('roundNum', {
      visual: { kind: 'bigtext', text: `${a} を 百のくらいで\nしごにゅう ＝ ❓` },
      instruction: `${a}の がいすうは？（百のくらい）`,
      speak: `${a}を ひゃくのくらいで ししゃごにゅうすると いくつ？`,
      answer: ans, cc: p.cc, spread: 100, say: `やく${ans}`,
      explain: `じゅうのくらいが 5いじょうなら くりあげ。こたえは ${ans}`
    })
  },
  area(p) {
    const square = Math.random() < 0.4
    const a = rng(2, 9), b = square ? a : rng(2, 9)
    return numQ('area', {
      visual: { kind: 'bigtext', text: `たて${a}cm よこ${b}cm の\nめんせき ＝ ❓cm²` },
      instruction: `めんせきは？`,
      speak: `たて${a}センチ、よこ${b}センチの ${square ? 'せいほうけい' : 'ちょうほうけい'}の めんせきは？`,
      answer: a * b, cc: p.cc, spread: a, say: `${a * b}へいほうセンチ`,
      explain: `めんせきは たて かける よこ。${a}かける${b}で ${a * b}`
    })
  },
  average(p) {
    const ans = rng(3, 12)
    const d = rng(1, 3)
    const nums = [ans - d, ans, ans + d]
    return numQ('average', {
      visual: { kind: 'bigtext', text: `${nums.join('、 ')} の へいきん ＝ ❓` },
      instruction: `${nums.join('と')}の へいきんは？`,
      speak: `${nums.join('と')}の へいきんは いくつ？`,
      answer: ans, cc: p.cc, spread: 2, say: `${ans}`,
      explain: `ぜんぶ たして 3で わる。${nums.reduce((x, y) => x + y, 0)}わる3で ${ans}`
    })
  },
  fracCompareDiff(p) {
    const pairs = [[1, 2, 1, 3], [1, 3, 1, 4], [2, 3, 1, 2], [3, 4, 2, 3], [1, 2, 2, 5], [1, 4, 1, 5]]
    const [a, b, c, d] = pick(pairs)
    const bigFirst = a / b > c / d
    const ans = bigFirst ? `${a}/${b}` : `${c}/${d}`
    return {
      domain: 'suuji', type: 'choice', itemKey: 'n:fracCompareDiff', visual: null,
      instruction: 'おおきい ほうを タッチ！',
      speak: `${b}ぶんの${a}と ${d}ぶんの${c}、おおきいのは どっち？`,
      answerId: ans,
      choices: shuffle([`${a}/${b}`, `${c}/${d}`]).map((v) => ({ id: v, label: v })),
      answerWord: { text: ans },
      explain: `つうぶんして くらべよう。おおきいのは ${ans}`
    }
  },
  discount(p) {
    const base = pick([500, 800, 1000, 2000])
    const pct = pick([10, 20, 50])
    const ans = base - (base * pct) / 100
    return numQ('discount', {
      visual: { kind: 'bigtext', text: `${base}えんの ${pct}％びき ＝ ❓えん` },
      instruction: `${base}えんの ${pct}％びきは？`,
      speak: `${base}えんの しなものが ${pct}パーセントびき。いくらに なる？`,
      answer: ans, cc: p.cc, spread: base / 10, say: `${ans}えん`,
      explain: `${pct}％は ${(base * pct) / 100}えん。ひくと ${ans}えん`
    })
  },
  speedTime(p) {
    const v = pick([30, 40, 50, 60]), t = rng(2, 4)
    const dist = v * t
    return numQ('speedTime', {
      visual: { kind: 'bigtext', text: `${dist}km ÷ じそく${v}km ＝ ❓じかん` },
      instruction: `${dist}kmを じそく${v}kmで いくと？`,
      speak: `${dist}キロの みちのりを じそく${v}キロで いくと なんじかん かかる？`,
      answer: t, cc: p.cc, spread: 1, say: `${t}じかん`,
      explain: `じかんは みちのり わる はやさ。${dist}わる${v}で ${t}じかん`
    })
  },
  // ---- さらに追加タイプ ----
  tens(p) {
    const c = rng(2, 9)
    return numQ('tens', {
      visual: { kind: 'bigtext', text: `10が ${c}こで ＝ ❓` },
      instruction: `10が ${c}こで いくつ？`,
      speak: `10が ${c}こ あつまると いくつ？`,
      answer: c * 10, cc: p.cc, spread: 10, say: `${c * 10}`,
      explain: `10が ${c}こで ${c * 10}だよ`
    })
  },
  mul10(p) {
    const a = rng(2, 9)
    return numQ('mul10', {
      visual: { kind: 'bigtext', text: `${a} × 10 ＝ ❓` },
      instruction: `${a} × 10 ＝ ？`,
      speak: `${a} かける 10 は いくつ？`,
      answer: a * 10, cc: p.cc, spread: 10, say: `${a * 10}`,
      explain: `10を かけると 0が ひとつ ふえる。こたえは ${a * 10}`
    })
  },
  countMoney100(p) {
    const c = rng(2, 6)
    return numQ('countMoney100', {
      visual: { kind: 'bigtext', text: `100えんが ${c}こで ＝ ❓えん` },
      instruction: `100えんだまが ${c}こで いくら？`,
      speak: `100えんだまが ${c}こ あると なんえん？`,
      answer: c * 100, cc: p.cc, spread: 100, say: `${c * 100}えん`,
      explain: `100が ${c}こで ${c * 100}えんだよ`
    })
  },
  unitPrice(p) {
    const price = pick([20, 30, 50, 80, 100]), n = rng(2, 5)
    return numQ('unitPrice', {
      visual: { kind: 'bigtext', text: `1こ${price}えんの あめ ${n}こ ＝ ❓えん` },
      instruction: `1こ${price}えんの あめを ${n}こ かうと？`,
      speak: `1こ ${price}えんの あめを ${n}こ かうと いくら？`,
      answer: price * n, cc: p.cc, spread: price, say: `${price * n}えん`,
      explain: `${price}かける${n}で ${price * n}えんだよ`
    })
  },
  roundTen(p) {
    const a = rng(11, 99)
    const ans = Math.round(a / 10) * 10
    return numQ('roundTen', {
      visual: { kind: 'bigtext', text: `${a} を 十のくらいで\nしごにゅう ＝ ❓` },
      instruction: `${a}の がいすうは？（十のくらい）`,
      speak: `${a}を じゅうのくらいで ししゃごにゅうすると いくつ？`,
      answer: ans, cc: p.cc, spread: 10, say: `やく${ans}`,
      explain: `一のくらいが 5いじょうなら くりあげ。こたえは ${ans}`
    })
  },
  triangleArea(p) {
    const base = rng(1, 4) * 2, h = rng(2, 8)
    const ans = (base * h) / 2
    return numQ('triangleArea', {
      visual: { kind: 'bigtext', text: `そこへん${base}cm たかさ${h}cm の\nさんかく ＝ ❓cm²` },
      instruction: `さんかくの めんせきは？`,
      speak: `そこへん${base}センチ、たかさ${h}センチの さんかくの めんせきは？`,
      answer: ans, cc: p.cc, spread: base, say: `${ans}へいほうセンチ`,
      explain: `そこへん かける たかさ わる 2。${base}かける${h}わる2で ${ans}`
    })
  },
  volume(p) {
    const a = rng(2, 6), b = rng(2, 6), c = rng(2, 5)
    return numQ('volume', {
      visual: { kind: 'bigtext', text: `たて${a} よこ${b} たかさ${c} の\nたいせき ＝ ❓cm³` },
      instruction: `たいせきは？`,
      speak: `たて${a}、よこ${b}、たかさ${c}センチの はこの たいせきは？`,
      answer: a * b * c, cc: p.cc, spread: a * b, say: `${a * b * c}りっぽうセンチ`,
      explain: `たて かける よこ かける たかさ。${a}かける${b}かける${c}で ${a * b * c}`
    })
  },
  lcm(p) {
    const [a, b] = pick([[2, 3], [2, 5], [3, 4], [4, 6], [3, 6], [2, 6], [3, 5], [4, 8]])
    const ans = (a * b) / gcd(a, b)
    return numQ('lcm', {
      visual: { kind: 'bigtext', text: `${a} と ${b} の\nさいしょうこうばいすう ＝ ❓` },
      instruction: `${a}と${b}の さいしょうこうばいすうは？`,
      speak: `${a}と${b}の さいしょうこうばいすうは いくつ？`,
      answer: ans, cc: p.cc, spread: Math.max(2, a), say: `${ans}`,
      explain: `${a}のばいすうと ${b}のばいすう、どちらにも でてくる いちばん ちいさい かずは ${ans}`
    })
  },
  gcdKind(p) {
    const [a, b] = pick([[6, 8], [12, 8], [9, 6], [12, 18], [8, 12], [10, 15], [16, 12], [12, 9]])
    const ans = gcd(a, b)
    return numQ('gcdKind', {
      visual: { kind: 'bigtext', text: `${a} と ${b} の\nさいだいこうやくすう ＝ ❓` },
      instruction: `${a}と${b}の さいだいこうやくすうは？`,
      speak: `${a}と${b}の さいだいこうやくすうは いくつ？`,
      answer: ans, cc: p.cc, spread: 2, say: `${ans}`,
      explain: `${a}も ${b}も わりきれる いちばん おおきい かずは ${ans}`
    })
  }
}

// 学年ごとの出題タイプ（あとの学年ほど前の学年の一部も混ざる）
function kindsForGrade(grade, level) {
  if (grade <= 0) {
    const k = ['count', 'compareCards', 'add10', 'make10', 'countKeypad', 'addKeypad', 'orderNumbers', 'shapeName', 'shapeGroups']
    if (level >= 3) k.push('sub10', 'sequence', 'orderNumbers')
    return k
  }
  if (grade === 1) {
    const k = ['add10', 'make10', 'sub10', 'addCarry', 'sequence', 'holeAdd', 'moneyAdd', 'tens']
    if (level >= 3) k.push('subBorrow', 'compareNum', 'add3nums', 'addCarry', 'subBorrow', 'holeAdd')
    return k
  }
  if (grade === 2) {
    const k = ['addCarry', 'subBorrow', 'add2digit', 'sub2digit', 'kuku', 'kuku', 'sequence', 'holeSub', 'double', 'half', 'mul10']
    if (level >= 3) k.push('evenOdd', 'moneyChange', 'clockPlus', 'lengthConv', 'countMoney100')
    if (level >= 4) k.push('compareNum', 'kuku')
    return k
  }
  if (grade === 3) {
    const k = ['kuku', 'div', 'div', 'add3digit', 'mul2x1', 'holeMul', 'tensMul', 'unitPrice']
    if (level >= 3) k.push('divRemainder', 'fracCompareSame', 'divRemainder', 'perimeter', 'timeCalc', 'kgConv', 'literConv')
    return k
  }
  if (grade === 4) {
    const k = ['mul2x1', 'div', 'divRemainder', 'div3digit', 'decimalAdd', 'mul3x1', 'decimalSub']
    if (level >= 3) k.push('bigNumbers', 'decimalAdd', 'div3digit', 'roundNum', 'roundTen', 'area')
    return k
  }
  if (grade === 5) {
    const k = ['div3digit', 'decimalAdd', 'decimalMul', 'fracAddDiff', 'decimalSub', 'average']
    if (level >= 3) k.push('percent', 'fracAddDiff', 'decimalMul', 'fracCompareDiff', 'area', 'triangleArea')
    return k
  }
  // 小6
  const k = ['decimalMul', 'fracAddDiff', 'percent', 'fracMul', 'ratio', 'average', 'discount', 'lcm', 'gcdKind']
  if (level >= 3) k.push('speed', 'ratio', 'fracMul', 'speedTime', 'fracCompareDiff', 'volume')
  return k
}

/**
 * すうじの問題を1問生成する。
 * @param {object} params 難易度パラメータ（grade を含む）
 * @param {string|null} reviewKey 'n:タイプ名' または 'n:タイプ名#識別子'
 */
export function generateNumbersQuestion(params, reviewKey = null) {
  const grade = params.grade || 0
  const p = { ...params, grade, cc: Math.max(3, params.choiceCount) }

  if (reviewKey && reviewKey.startsWith('n:')) {
    // 古いセーブにある "n:add10" も、新しい "n:add10#xxxx" も受け入れる。
    const kind = reviewKey.slice(2).split('#')[0]
    if (BUILDERS[kind]) return BUILDERS[kind](p)
  }
  const kind = pick(kindsForGrade(grade, params.level))
  return BUILDERS[kind](p)
}

// 復習画面でのラベル表示用
export const KIND_LABELS = {
  count: 'かぞえる', compareCards: 'くらべっこ', add10: 'たしざん', make10: '10づくり',
  countKeypad: 'テンキーでかぞえる', addKeypad: 'テンキーたしざん', orderNumbers: 'かずをならべる',
  shapeName: 'かたちのなまえ', shapeGroups: 'かたちをグループ分け',
  sequence: 'かずのならび', sub10: 'ひきざん', addCarry: 'くり上がり', subBorrow: 'くり下がり',
  compareNum: 'かずくらべ', add3nums: '3つのかず', add2digit: '2けたのたしざん',
  sub2digit: '2けたのひきざん', kuku: '九九', div: 'わり算', divRemainder: 'あまりのわり算',
  add3digit: '3けたのたしざん', mul2x1: '2けた×1けた', fracCompareSame: 'ぶんすうくらべ',
  div3digit: 'わり算(大)', decimalAdd: 'しょうすう＋', bigNumbers: 'おおきなかず',
  decimalMul: 'しょうすう×', fracAddDiff: 'ぶんすう＋', percent: 'パーセント',
  fracMul: 'ぶんすう×', ratio: 'ひ', speed: 'はやさ',
  holeAdd: '□のたしざん', holeSub: '□のひきざん', holeMul: '□のかけざん',
  double: '2ばい', half: 'はんぶん', evenOdd: 'ぐうすう・きすう',
  moneyAdd: 'おかね', moneyChange: 'おつり', clockPlus: 'とけい',
  lengthConv: 'ながさ', kgConv: 'おもさ', literConv: 'かさ',
  timeCalc: 'じかん', tensMul: '何十×何', perimeter: 'まわりのながさ',
  mul3x1: '3けた×1けた', decimalSub: 'しょうすう−', roundNum: 'がいすう',
  area: 'めんせき', average: 'へいきん', fracCompareDiff: 'ぶんすうくらべ(異)',
  discount: 'ねびき', speedTime: 'じかんをもとめる',
  tens: '10のまとまり', mul10: '×10', countMoney100: '100だまのおかね',
  unitPrice: 'ねだんの計算', roundTen: 'がいすう(十)', triangleArea: 'さんかくのめんせき',
  volume: 'たいせき', lcm: 'さいしょうこうばいすう', gcdKind: 'さいだいこうやくすう'
}
