// ============================================================
// むずかしいモード（Phase 2）— さんすう「特殊算」
//
// 対象は小4〜6。中学受験の標準的な特殊算（つるかめ算・旅人算・植木算・
// 過不足算・差集め算・仕事算・年令算・相当算）を扱う。
//
// 通常モードとの分離（計画書§4.2(d)）:
//   - itemKey は必ず `hard:n:${kind}` の名前空間を使う。
//   - GameContext.jsx の ANSWER reducer が、この 'hard:' 接頭辞を見て
//     srs/skills/unitStats/domainAccuracy を 'hard:suuji' へ切り分ける。
//     通常の unitLedger・進級判定・ホームメーターには一切合流しない。
//   - ほしのしれん（章末テスト, trialQuestions.js）はこのモジュールを
//     呼ばない。進級はいつも ふつうモードの問題で判定する。
//
// 回答形式（計画書§8-③の決定）:
//   4択からの逆算で正解できてしまわないよう、数値入力（type:'keypad'、
//   既存の NumberPad を流用）を標準とする。答えは常に0以上の整数に
//   そろえている（NumberPad は数字キーのみで負号・小数点を持たないため）。
//
// 解説（計画書§4.2(e)・むずかしいモードの本体価値）:
//   explain（結論1文）に加えて、explainSteps（考え方を追った番号リスト）
//   を必ず持たせる。答えを当てることより、式の組み立て方を残すことを
//   優先する。
// ============================================================

function rng(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

function hardQ(kind, { visual, instruction, speak, answer, explain, explainSteps, explainWhy }) {
  return {
    domain: 'suuji',
    type: 'keypad',
    itemKey: `hard:n:${kind}`,
    visual,
    instruction,
    speak,
    answerId: String(answer),
    answerWord: { text: String(answer) },
    explain,
    explainSteps,
    explainWhy
  }
}

const HARD_BUILDERS = {
  // つるかめ算: 頭の数と足の数から、2種類の生き物の内訳を求める。
  jrTsurukame() {
    const turtles = rng(2, 8)
    const cranes = rng(2, 8)
    const total = turtles + cranes
    const legs = cranes * 2 + turtles * 4
    const assumedLegs = total * 2
    const diff = legs - assumedLegs
    return hardQ('jrTsurukame', {
      visual: { kind: 'sentence', text: `つると かめが あわせて ${total}匹います。足の数は ぜんぶで ${legs}本です。` },
      instruction: 'かめは何匹？',
      speak: `つると かめが あわせて ${total}匹います。足の数は ぜんぶで ${legs}本です。かめは何匹でしょう？`,
      answer: turtles,
      explain: `かめは ${turtles}匹`,
      explainSteps: [
        `ぜんぶ つるだと すると、足の数は 2×${total}＝${assumedLegs}本`,
        `本当の足の数との差は ${legs}－${assumedLegs}＝${diff}本`,
        `かめは つるより 足が2本多いので、差の${diff}本は「かめの数×2」`,
        `かめの数は ${diff}÷2＝${turtles}匹`
      ]
    })
  },

  // 旅人算（出会い）: 向かい合って歩く2人が出会うまでの時間。
  jrTabibito() {
    const speedA = rng(40, 90)
    const speedB = rng(40, 90)
    const combined = speedA + speedB
    const time = rng(3, 12)
    const distance = combined * time
    return hardQ('jrTabibito', {
      visual: { kind: 'sentence', text: `${distance}m はなれた 2人が、分速${speedA}mと 分速${speedB}mで むかい合って 歩きます。` },
      instruction: '何分後に出会う？',
      speak: `${distance}メートル はなれた 2人が、分速${speedA}メートルと 分速${speedB}メートルで むかい合って歩きます。何分後に出会いますか？`,
      answer: time,
      explain: `${time}分後`,
      explainSteps: [
        `2人は 近づき合うので、1分間に ちぢまる きょりは ${speedA}＋${speedB}＝${combined}m`,
        `出会うまでに ちぢめる きょりは ぜんぶで ${distance}m`,
        `かかる時間は ${distance}÷${combined}＝${time}分`
      ]
    })
  },

  // 植木算: 道の両端に木を植えるときの本数。
  jrUekigi() {
    const spacing = pick([3, 4, 5, 6])
    const gaps = rng(4, 15)
    const length = spacing * gaps
    const trees = gaps + 1
    return hardQ('jrUekigi', {
      visual: { kind: 'sentence', text: `長さ${length}mの まっすぐな 道に、${spacing}mおきに、はしから はしまで 木を植えます。` },
      instruction: '木は何本いる？',
      speak: `長さ${length}メートルの まっすぐな道に、${spacing}メートルおきに、はしからはしまで木を植えます。木は何本いりますか？`,
      answer: trees,
      explain: `${trees}本`,
      explainSteps: [
        `木と木の 間の数は ${length}÷${spacing}＝${gaps}か所`,
        `両はしに 木を植えるので、間の数より 1本 多く必要`,
        `木の本数は ${gaps}＋1＝${trees}本`
      ]
    })
  },

  // 過不足算: 1人あたりの配り方で「あまり」と「たりない」が入れ替わる。
  jrKafusoku() {
    const people = rng(6, 18)
    const a = rng(2, 6)
    const b = a + rng(1, 4)
    const surplus = rng(1, 8)
    const total = a * people + surplus
    const shortage = b * people - total
    if (shortage <= 0) return HARD_BUILDERS.jrKafusoku()
    return hardQ('jrKafusoku', {
      visual: { kind: 'sentence', text: `1人に ${a}こずつ 配ると ${surplus}こ あまり、1人に ${b}こずつ 配ると ${shortage}こ たりません。` },
      instruction: '何人に配る？',
      speak: `みかんを 何人かで分けます。1人に${a}こずつ配ると${surplus}こあまり、1人に${b}こずつ配ると${shortage}こたりません。何人に配りますか？`,
      answer: people,
      explain: `${people}人`,
      explainSteps: [
        `1人分を ${a}こから ${b}こに 増やすと、1人あたり ${b - a}こ 多く必要になる`,
        `全体で 必要になる差は、あまっていた ${surplus}こ と たりなかった ${shortage}こ を 合わせた ${surplus + shortage}こ`,
        `人数は ${surplus + shortage}÷${b - a}＝${people}人`
      ]
    })
  },

  // 差集め算: 2通りの配り方が どちらも「あまる」ケース。
  jrSashiatsume() {
    const people = rng(6, 18)
    const a = rng(2, 6)
    const c = a + rng(1, 4)
    const q = rng(1, 6)
    const p = q + (c - a) * people
    return hardQ('jrSashiatsume', {
      visual: { kind: 'sentence', text: `1人に ${a}まいずつ 配ると ${p}まい あまり、1人に ${c}まいずつ 配ると ${q}まい あまります。` },
      instruction: '何人に配る？',
      speak: `色紙を 何人かで分けます。1人に${a}まいずつ配ると${p}まいあまり、1人に${c}まいずつ配ると${q}まいあまります。何人に配りますか？`,
      answer: people,
      explain: `${people}人`,
      explainSteps: [
        `1人分を ${a}まいから ${c}まいに 増やすと、1人あたり ${c - a}まい 多く配ることになる`,
        `あまりの差は ${p}－${q}＝${p - q}まい。これは「1人あたりの差×人数」`,
        `人数は ${p - q}÷${c - a}＝${people}人`
      ]
    })
  },

  // 仕事算: 2人がそれぞれ1人で仕上げる日数から、2人でやる日数を求める。
  jrShigoto() {
    const pairs = []
    for (let x = 2; x <= 12; x++) {
      for (let y = x; y <= 12; y++) {
        const l = (x * y) / gcd(x, y)
        const rate = l / x + l / y
        if (l % rate === 0 && l / rate >= 1 && l / rate < Math.min(x, y)) pairs.push([x, y, l / rate])
      }
    }
    const [daysA, daysB, together] = pick(pairs)
    const whole = (daysA * daysB) / gcd(daysA, daysB)
    return hardQ('jrShigoto', {
      visual: { kind: 'sentence', text: `ある仕事を、Aさん1人だと${daysA}日、Bさん1人だと${daysB}日で 終わります。` },
      instruction: '2人でやると何日？',
      speak: `ある仕事を、Aさん1人でやると${daysA}日、Bさん1人でやると${daysB}日で終わります。2人いっしょにやると、何日で終わりますか？`,
      answer: together,
      explain: `${together}日`,
      explainSteps: [
        `仕事全体を ${daysA}と${daysB}の 最小公倍数、${whole} と考える`,
        `Aさんは 1日に ${whole}÷${daysA}＝${whole / daysA}、Bさんは 1日に ${whole}÷${daysB}＝${whole / daysB} 進める`,
        `2人合わせると 1日に ${whole / daysA + whole / daysB} 進む`,
        `終わるまでの日数は ${whole}÷${whole / daysA + whole / daysB}＝${together}日`
      ]
    })
  },

  // 年令算: 父の年令が子の年令の何倍になるかを求める（未来）。
  jrNenrei() {
    const k = pick([2, 3])
    const child = rng(6, 12)
    const father = child + rng(20, 30)
    const years = (father - k * child) / (k - 1)
    if (!Number.isInteger(years) || years <= 0 || years > 40) return HARD_BUILDERS.jrNenrei()
    return hardQ('jrNenrei', {
      visual: { kind: 'sentence', text: `いま お父さんは${father}才、子どもは${child}才です。何年後に お父さんの年令が 子どもの${k}倍に なりますか？` },
      instruction: '何年後？',
      speak: `いま お父さんは${father}才、子どもは${child}才です。何年後に、お父さんの年令が子どもの${k}倍になりますか？`,
      answer: years,
      explain: `${years}年後`,
      explainSteps: [
        `何年後かを □年後とすると、そのとき お父さんは(${father}＋□)才、子どもは(${child}＋□)才`,
        `お父さんの年令が子どもの${k}倍になるので、${father}＋□＝${k}×(${child}＋□)`,
        `右の式を広げると ${father}＋□＝${k * child}＋${k}×□`,
        `□について整理すると □＝${years}`
      ]
    })
  },

  // 相当算: 「全体の何分の何を使った残り」から、はじめの量を求める。
  jrSoutou() {
    const den = pick([3, 4, 5])
    const num = rng(1, den - 1)
    const whole = den * rng(4, 12)
    const remaining = Math.round((whole * (den - num)) / den)
    return hardQ('jrSoutou', {
      visual: { kind: 'sentence', text: `持っていたお金の ${den}分の${num} を つかったら、残りが ${remaining}円に なりました。` },
      instruction: 'はじめにいくら持っていた？',
      speak: `持っていたお金の${den}分の${num}を使ったところ、残りが${remaining}円になりました。はじめにいくら持っていましたか？`,
      answer: whole,
      explain: `${whole}円`,
      explainSteps: [
        `${num}／${den} を使ったので、残りは 全体の (${den}－${num})／${den}`,
        `残りの ${remaining}円 が、全体の (${den - num})／${den} にあたる`,
        `全体は ${remaining}÷(${den - num})×${den}＝${whole}円`
      ]
    })
  }
}

export const HARD_NUMBERS_KINDS = Object.keys(HARD_BUILDERS)

// 小4〜6のいずれも同じ8種を対象にする（複雑さは数値の範囲で吸収する）。
export const HARD_NUMBERS_KINDS_BY_GRADE = {
  4: ['jrTsurukame', 'jrUekigi', 'jrKafusoku'],
  5: ['jrTsurukame', 'jrTabibito', 'jrUekigi', 'jrKafusoku', 'jrSashiatsume', 'jrSoutou'],
  6: HARD_NUMBERS_KINDS
}

export function generateHardNumbersQuestion(params, reviewKey = null) {
  const grade = params.grade || 4
  if (reviewKey && reviewKey.startsWith('hard:n:')) {
    const kind = reviewKey.slice(7).split('#')[0]
    if (HARD_BUILDERS[kind]) return HARD_BUILDERS[kind]()
  }
  const kinds = HARD_NUMBERS_KINDS_BY_GRADE[grade] || HARD_NUMBERS_KINDS_BY_GRADE[4]
  const kind = pick(kinds)
  return HARD_BUILDERS[kind] ? HARD_BUILDERS[kind]() : null
}

export const HARD_NUMBERS_LABELS = {
  jrTsurukame: 'つるかめ算', jrTabibito: '旅人算', jrUekigi: '植木算',
  jrKafusoku: '過不足算', jrSashiatsume: '差集め算', jrShigoto: '仕事算',
  jrNenrei: '年令算', jrSoutou: '相当算'
}
