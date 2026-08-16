// ============================================================
// むずかしいモード（Phase 2 / WP10 低学年拡張）— さんすう パズル・ちえあそび
//
// 対象は小1〜3。中学受験の特殊算（numbers-hard.js）は前提知識が多く
// この学年には合わないため、暗記でなく「ひらめき」で解く5種類の
// パズルを 別バンクとして用意する:
//   数のパターン（つぎの数） / くり返しもよう（つぎの絵） /
//   おおきさくらべ（すいり） / なかまはずれ / ちえあそび（クイズ）
//
// 通常モードとの分離（計画書§4.2(d)、numbers-hard.jsと同じ設計）:
//   - itemKey は numbers-hard.js と同じ `hard:n:${kind}` 名前空間を使う
//     （domain:'suuji' なので、unitIdFor() が同じ 'hard:math:${kind}' を
//     自動でわりあてる。ReviewScreen の表示も既存の
//     HARD_NUMBERS_LABELS と同じ分岐でそのまま拾える。追加の
//     itemKey/label 分岐は不要）。
//   - 4択形式（type:'choice'）。小1〜3はキーパッド入力（数字のみ）より
//     選択肢から選ぶ形式のほうが操作しやすいため、numbers-hard.jsの
//     'keypad'とは別の choice ビルダーを使う。
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

// ---- なかまはずれ: 4つのうち3つは同じなかま、1つだけちがう ----
const NAKAMA_BANK = [
  { items: ['りんご', 'みかん', 'ぶどう'], odd: 'くるま', explain: 'りんご・みかん・ぶどうは くだもの。くるまだけ のりものだよ' },
  { items: ['いぬ', 'ねこ', 'うさぎ'], odd: 'さかな', explain: 'いぬ・ねこ・うさぎは 陸に すむどうぶつ。さかなだけ 水の中で くらすよ' },
  { items: ['くるま', 'バス', 'じてんしゃ'], odd: 'ひこうき', explain: 'くるま・バス・じてんしゃは 道を はしる。ひこうきだけ 空を とぶよ' },
  { items: ['にんじん', 'たまねぎ', 'キャベツ'], odd: 'りんご', explain: 'にんじん・たまねぎ・キャベツは やさい。りんごだけ くだものだよ' },
  { items: ['あか', 'あお', 'きいろ'], odd: 'さんかく', explain: 'あか・あお・きいろは いろの名前。さんかくだけ かたちの名前だよ' },
  { items: ['まる', 'しかく', 'さんかく'], odd: 'あか', explain: 'まる・しかく・さんかくは かたちの名前。あかだけ いろの名前だよ' },
  { items: ['えんぴつ', 'けしごむ', 'ノート'], odd: 'ボール', explain: 'えんぴつ・けしごむ・ノートは べんきょうの道具。ボールだけ あそぶ道具だよ' },
  { items: ['め', 'みみ', 'はな'], odd: 'つくえ', explain: 'め・みみ・はなは からだの一部。つくえだけ 家具だよ' },
  { items: ['はれ', 'あめ', 'くもり'], odd: 'いぬ', explain: 'はれ・あめ・くもりは 天気。いぬだけ どうぶつだよ' },
  { items: ['おかあさん', 'おとうさん', 'あに'], odd: 'せんせい', explain: 'おかあさん・おとうさん・あには かぞく。せんせいだけ かぞくじゃないよ' },
  { items: ['さかな', 'イルカ', 'たこ'], odd: 'とり', explain: 'さかな・イルカ・たこは 水の中を およぐ。とりだけ 空をとぶよ' },
  { items: ['ひこうき', 'ヘリコプター', 'ロケット'], odd: 'ふね', explain: 'ひこうき・ヘリコプター・ロケットは 空をとぶ。ふねだけ 水にうかぶよ' },
  { items: ['はる', 'なつ', 'あき'], odd: 'げつようび', explain: 'はる・なつ・あきは 季節。げつようびだけ 曜日だよ' },
  { items: ['げつようび', 'かようび', 'すいようび'], odd: 'はる', explain: 'げつようび・かようび・すいようびは 曜日。はるだけ 季節だよ' },
  { items: ['パン', 'ごはん', 'うどん'], odd: 'みず', explain: 'パン・ごはん・うどんは 食べもの。みずだけ のみものだよ' },
  { items: ['はし', 'スプーン', 'フォーク'], odd: 'えんぴつ', explain: 'はし・スプーン・フォークは 食べるときに使う道具。えんぴつだけ 書く道具だよ' }
]

// ---- ちえあそび: せつめいから ひとつの ことばを あてる ----
const CHIE_BANK = [
  { q: 'よるの そらで キラキラ ひかる、ちいさい てんのような ものは なあに？', a: 'ほし', d: ['つき', 'たいよう', 'くも'], explain: 'よるの そらで 小さく ひかっているのは「ほし」だよ' },
  { q: 'まんまるで きいろく、ひるまに そらで ひかっているのは なあに？', a: 'たいよう', d: ['ゆうやけ', 'つき', 'にじ'], explain: 'ひるまに そらで ひかっているのは「たいよう」だよ' },
  { q: 'しろくて つめたい、ふゆに そらから ひらひら ふってくるのは なあに？', a: 'ゆき', d: ['あめ', 'くも', 'こおり'], explain: 'ふゆに そらから ふってくる 白くて つめたいものは「ゆき」だよ' },
  { q: 'ながい はなを もっていて、おおきな みみが ある どうぶつは なあに？', a: 'ぞう', d: ['きりん', 'うさぎ', 'くま'], explain: 'ながい はなと おおきな みみが とくちょうなのは「ぞう」だよ' },
  { q: 'くびが とても ながい どうぶつは なあに？', a: 'きりん', d: ['ぞう', 'うま', 'らくだ'], explain: 'くびが とても ながいのが とくちょうなのは「きりん」だよ' },
  { q: 'あめの日に よく でてきて、からを せおって すすむ、ちいさい いきものは なあに？', a: 'かたつむり', d: ['かめ', 'だんごむし', 'なめくじ'], explain: 'あめの日に からを せおって すすむ 小さい生きものは「かたつむり」だよ' },
  { q: 'あめが やんだ あと、そらに かかる 7いろの はしのようなものは なあに？', a: 'にじ', d: ['くも', 'たいよう', 'ほし'], explain: 'あめの あとに そらに かかる 7いろの ものは「にじ」だよ' },
  { q: 'さむい ふゆに、みずが こおって できる つめたい かたまりは なあに？', a: 'こおり', d: ['ゆき', 'みず', 'つらら'], explain: 'みずが こおって できる かたまりは「こおり」だよ' }
]

const PUZZLE_BUILDERS = {
  // 数のパターン: きまりよく ならんだ数の つぎを あてる。
  jrSuuretsuKids(grade = 1) {
    const step = grade <= 1 ? pick([1, 2]) : grade === 2 ? pick([2, 3, 5]) : pick([2, 3, 4, 5, 10])
    const start = rng(1, grade <= 1 ? 10 : grade === 2 ? 20 : 30)
    const terms = [start, start + step, start + 2 * step, start + 3 * step]
    const answer = start + 4 * step
    const deltaPool = shuffle([...new Set([-2 * step, -step, -2, -1, 1, 2, 2 * step])].filter((d) => d !== 0))
    const wrongs = []
    for (const d of deltaPool) {
      const w = answer + d
      if (w > 0 && w !== answer && !wrongs.includes(w)) wrongs.push(w)
      if (wrongs.length === 3) break
    }
    const options = shuffle([answer, ...wrongs])
    return choiceQ('jrSuuretsuKids', {
      visual: { kind: 'sentence', text: `${terms.join('、')}、？` },
      instruction: '？に あてはまる 数は？',
      speak: `${terms.join('、')}と、きまりよく ならんでいます。つぎの 数は なんでしょう？`,
      answer: String(answer),
      choices: options.map((n) => ({ id: String(n), label: String(n) })),
      explain: `1つ前の数に いつも ${step} を たしているよ。${terms[3]}＋${step}＝${answer}`
    })
  },

  // くり返しもよう: きまった じゅんばんで くり返す絵の つぎを あてる。
  jrKurikaeshiMoyou() {
    const periods = [['🔴', '🔵'], ['🔴', '🔵', '🟡'], ['⭐', '🌙'], ['🍎', '🍌', '🍇'], ['🐶', '🐱', '🐭'], ['🔺', '⭕', '⬜']]
    const period = pick(periods)
    const shown = Array.from({ length: 5 }, (_, i) => period[i % period.length])
    const answer = period[5 % period.length]
    const decoyPool = ['🟢', '🟣', '⚫', '🟠', '🦊', '🐰', '🦋', '🐸'].filter((e) => !period.includes(e))
    const memberWrongs = period.filter((e) => e !== answer)
    const wrongs = [...memberWrongs, ...shuffle(decoyPool)].slice(0, 3)
    const options = shuffle([answer, ...wrongs])
    return choiceQ('jrKurikaeshiMoyou', {
      visual: { kind: 'bigtext', text: `${shown.join(' ')} ？` },
      instruction: '？に あてはまる えは？',
      speak: 'きまった じゅんばんで くりかえす もようです。？に あてはまる えは どれでしょう？',
      answer,
      choices: options.map((e) => ({ id: e, label: '', emoji: e })),
      explain: `${period.join('→')} の じゅんばんを くりかえしているよ`
    })
  },

  // おおきさくらべ: 2つのヒントから、いちばん おおきい（おもい）ものを すいりする。
  jrOokisaKurabe() {
    const labels = shuffle(['あかい ボール', 'あおい ボール', 'きいろい ボール'])
    const [a, b, c] = labels
    const ranks = shuffle([1, 2, 3])
    const vmap = new Map([[a, ranks[0]], [b, ranks[1]], [c, ranks[2]]])
    const attr = pick([{ big: 'おもい', small: 'かるい' }, { big: 'おおきい', small: 'ちいさい' }])
    const cmp1 = vmap.get(a) > vmap.get(b) ? attr.big : attr.small
    const cmp2 = vmap.get(b) > vmap.get(c) ? attr.big : attr.small
    const order = [a, b, c].sort((x, y) => vmap.get(y) - vmap.get(x))
    const [first, second, third] = order
    return choiceQ('jrOokisaKurabe', {
      visual: { kind: 'sentence', text: `${a}は ${b}より ${cmp1}。${b}は ${c}より ${cmp2}。` },
      instruction: `いちばん ${attr.big}のは どれ？`,
      speak: `${a}は ${b}より ${cmp1}です。${b}は ${c}より ${cmp2}です。いちばん ${attr.big}のは どれでしょう？`,
      answer: first,
      choices: [a, b, c].map((label) => ({ id: label, label })),
      explain: `${first}が いちばん ${attr.big}、${second}が つぎ、${third}が いちばん ${attr.small}だよ`
    })
  },

  // なかまはずれ: 4つのうち3つは同じなかま、1つだけちがう。
  jrNakamahazure() {
    const item = pick(NAKAMA_BANK)
    const options = shuffle([...item.items, item.odd])
    return choiceQ('jrNakamahazure', {
      visual: { kind: 'sentence', text: options.join('・') },
      instruction: 'なかまはずれは どれ？',
      speak: `${options.join('、')}の中で、なかまはずれは どれでしょう？`,
      answer: item.odd,
      choices: options.map((label) => ({ id: label, label })),
      explain: item.explain
    })
  },

  // ちえあそび: せつめいから ひとつの ことばを あてる。
  jrChieAsobi() {
    const item = pick(CHIE_BANK)
    const options = shuffle([item.a, ...item.d])
    return choiceQ('jrChieAsobi', {
      visual: { kind: 'sentence', text: item.q },
      instruction: 'こたえは どれ？',
      speak: item.q,
      answer: item.a,
      choices: options.map((label) => ({ id: label, label })),
      explain: item.explain
    })
  }
}

export const HARD_PUZZLE_KINDS = Object.keys(PUZZLE_BUILDERS)

export function generateHardPuzzleQuestion(params, reviewKey = null) {
  const grade = params.grade || 1
  if (reviewKey && reviewKey.startsWith('hard:n:')) {
    const kind = reviewKey.slice(7).split('#')[0]
    if (PUZZLE_BUILDERS[kind]) return PUZZLE_BUILDERS[kind](grade)
  }
  const kind = pick(HARD_PUZZLE_KINDS)
  return PUZZLE_BUILDERS[kind](grade)
}

export const HARD_PUZZLE_LABELS = {
  jrSuuretsuKids: '数のパターン', jrKurikaeshiMoyou: 'くり返しもよう',
  jrOokisaKurabe: 'おおきさくらべ', jrNakamahazure: 'なかまはずれ', jrChieAsobi: 'ちえあそび'
}
