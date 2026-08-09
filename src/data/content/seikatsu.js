// ============================================================
// 「せいかつ」分野 — 日付かんかく と 時計
//
// ねらい（保護者からの相談）:
//   「何月何日何曜日」「明日/明後日/昨日/一昨日」「祝日」といった
//   日付のかんかくが弱いので、そこを毎日さわって身につける。
//
// 大事にしていること:
//   ・「きょう」は実際の今日の日付を使う。画面の中の作り話ではなく
//     ほんとうの今日なので、生活とつながって定着しやすい。
//   ・時計はアナログ時計の絵で出す（読む力そのものを育てる）。
//
// 学習指導要領の位置づけ:
//   年長〜小2: 生活科（日付・曜日・季節・行事）
//   時計は小1〜の算数。ここでは両方まとめて「せいかつ」として扱い、
//   小1以上では算数側にも時計の問題が出る。
// ============================================================

const WEEK = ['にちようび', 'げつようび', 'かようび', 'すいようび', 'もくようび', 'きんようび', 'どようび']
const WEEK_KANJI = ['日', '月', '火', '水', '木', '金', '土']

// 日付が動かない祝日だけを「何月何日？」の問題に使う（確実に正しいもの）
const FIXED_HOLIDAYS = [
  { m: 1, d: 1, name: 'がんじつ（お正月）' },
  { m: 2, d: 11, name: 'けんこくきねんの日' },
  { m: 2, d: 23, name: 'てんのうたんじょうび' },
  { m: 4, d: 29, name: 'しょうわの日' },
  { m: 5, d: 3, name: 'けんぽうきねんび' },
  { m: 5, d: 4, name: 'みどりの日' },
  { m: 5, d: 5, name: 'こどもの日' },
  { m: 8, d: 11, name: '山の日' },
  { m: 11, d: 3, name: 'ぶんかの日' },
  { m: 11, d: 23, name: 'きんろうかんしゃの日' }
]

// 月ごとの行事（季節感を育てる）
const MONTH_EVENT = {
  1: 'お正月', 2: 'せつぶん', 3: 'ひなまつり', 4: 'にゅうがくしき', 5: 'こどもの日',
  6: 'つゆ（雨がおおい）', 7: 'たなばた', 8: 'なつやすみ', 9: 'おつきみ', 10: 'ハロウィン',
  11: 'しちごさん', 12: 'クリスマス'
}

const SEASONS = [
  { name: 'はる', months: [3, 4, 5], emoji: '🌸' },
  { name: 'なつ', months: [6, 7, 8], emoji: '🌻' },
  { name: 'あき', months: [9, 10, 11], emoji: '🍁' },
  { name: 'ふゆ', months: [12, 1, 2], emoji: '⛄' }
]

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

// 文字列の選択肢（正解1つ＋かぶらないダミー）
function strChoices(answer, dummies, count) {
  const opts = [answer]
  for (const d of shuffle(dummies)) {
    if (opts.length >= count) break
    if (!opts.includes(d)) opts.push(d)
  }
  return shuffle(opts).map((v) => ({ id: v, label: v, speak: v }))
}

function sq(kind, { visual, instruction, speak, answer, answerId = answer, dummies, cc, explain, say, type = 'choice' }) {
  return {
    domain: 'seikatsu',
    type,
    itemKey: `s:${kind}`,
    visual: visual || null,
    instruction,
    speak,
    answerId,
    choices: type === 'choice' ? strChoices(answer, dummies, cc) : undefined,
    answerWord: { text: say || answer },
    explain
  }
}

const addDays = (base, n) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + n)

// ---- 出題タイプ ----
const BUILDERS = {
  // きょうは何月何日？（ほんものの今日）
  todayDate(p) {
    const t = new Date()
    const m = t.getMonth() + 1
    const d = t.getDate()
    const ans = `${m}がつ ${d}にち`
    const dummies = [
      `${m}がつ ${d === 1 ? d + 2 : d - 1}にち`,
      `${m}がつ ${d + 1}にち`,
      `${m === 12 ? 1 : m + 1}がつ ${d}にち`,
      `${m === 1 ? 12 : m - 1}がつ ${d}にち`
    ]
    return sq('todayDate', {
      visual: { kind: 'bigtext', text: '📅 きょうは？' },
      instruction: 'きょうは 何月何日？',
      speak: 'きょうは なんがつ なんにち かな？',
      answer: ans, dummies, cc: p.cc,
      explain: `きょうは ${ans}だよ`
    })
  },
  // きょうは何曜日？
  todayWeek(p) {
    const t = new Date()
    const ans = WEEK[t.getDay()]
    return sq('todayWeek', {
      visual: { kind: 'bigtext', text: '📅 きょうは\n何ようび？' },
      instruction: 'きょうは 何ようび？',
      speak: 'きょうは なんようび かな？',
      answer: ans, dummies: WEEK.filter((w) => w !== ans), cc: p.cc,
      explain: `きょうは ${ans}だよ`
    })
  },
  // あした・あさって・きのう・おととい
  relativeDay(p) {
    const t = new Date()
    const opts = [
      { label: 'あした', off: 1 },
      { label: 'あさって', off: 2 },
      { label: 'きのう', off: -1 },
      { label: 'おととい', off: -2 }
    ]
    const o = pick(p.grade >= 1 ? opts : opts.slice(0, 3))
    const target = addDays(t, o.off)
    const askWeek = Math.random() < 0.5
    if (askWeek) {
      const ans = WEEK[target.getDay()]
      return sq('relativeDay', {
        visual: { kind: 'bigtext', text: `📅 きょうは ${WEEK_KANJI[t.getDay()]}よう\n${o.label}は？` },
        instruction: `${o.label}は 何ようび？`,
        speak: `きょうは ${WEEK[t.getDay()]}。${o.label}は なんようび？`,
        answer: ans, dummies: WEEK.filter((w) => w !== ans), cc: p.cc,
        explain: `きょうが ${WEEK[t.getDay()]}だから、${o.label}は ${ans}`
      })
    }
    const ans = `${target.getMonth() + 1}がつ ${target.getDate()}にち`
    const dummies = [-3, -1, 1, 3].map((k) => {
      const x = addDays(target, k)
      return `${x.getMonth() + 1}がつ ${x.getDate()}にち`
    })
    return sq('relativeDay', {
      visual: { kind: 'bigtext', text: `📅 きょうは\n${t.getMonth() + 1}/${t.getDate()}` },
      instruction: `${o.label}は 何月何日？`,
      speak: `きょうは ${t.getMonth() + 1}がつ ${t.getDate()}にち。${o.label}は なんがつ なんにち？`,
      answer: ans, dummies, cc: p.cc,
      explain: `きょうから ${o.off > 0 ? `${o.off}日 あと` : `${-o.off}日 まえ`}だから ${ans}`
    })
  },
  // 曜日のならび
  weekOrder(p) {
    const i = rng(0, 6)
    const ans = WEEK[(i + 1) % 7]
    return sq('weekOrder', {
      visual: { kind: 'bigtext', text: `${WEEK_KANJI[i]}よう → ❓` },
      instruction: `${WEEK[i]}の つぎは？`,
      speak: `${WEEK[i]}の つぎの ひは なんようび？`,
      answer: ans, dummies: WEEK.filter((w) => w !== ans), cc: p.cc,
      explain: `にち・げつ・か・すい・もく・きん・ど のじゅん。${WEEK[i]}の つぎは ${ans}`
    })
  },
  // 月のならび
  monthOrder(p) {
    const m = rng(1, 12)
    const next = (m % 12) + 1
    const ans = `${next}がつ`
    return sq('monthOrder', {
      visual: { kind: 'bigtext', text: `${m}がつ → ❓` },
      instruction: `${m}がつの つぎは？`,
      speak: `${m}がつの つぎは なんがつ？`,
      answer: ans,
      dummies: [1, 2, 3, 4].map((k) => `${((m + k) % 12) + 1}がつ`).filter((x) => x !== ans),
      cc: p.cc,
      explain: `${m}がつの つぎは ${ans}。12がつの つぎは 1がつに もどるよ`
    })
  },
  // 季節
  season(p) {
    const s = pick(SEASONS)
    const m = pick(s.months)
    return sq('season', {
      visual: { kind: 'bigtext', text: `${m}がつは\nどの きせつ？` },
      instruction: `${m}がつは どの きせつ？`,
      speak: `${m}がつは どの きせつ かな？`,
      answer: s.name, dummies: SEASONS.filter((x) => x.name !== s.name).map((x) => x.name), cc: p.cc,
      explain: `${m}がつは ${s.emoji}${s.name}だよ`
    })
  },
  // 行事の月
  monthEvent(p) {
    const m = rng(1, 12)
    const ans = `${m}がつ`
    return sq('monthEvent', {
      visual: { kind: 'bigtext', text: MONTH_EVENT[m] },
      instruction: `${MONTH_EVENT[m]}は 何月？`,
      speak: `${MONTH_EVENT[m]}が あるのは なんがつ？`,
      answer: ans,
      dummies: [1, 2, 3, 5].map((k) => `${((m + k) % 12) + 1}がつ`).filter((x) => x !== ans),
      cc: p.cc,
      explain: `${MONTH_EVENT[m]}は ${m}がつだよ`
    })
  },
  // 祝日の日づけ
  holiday(p) {
    const h = pick(FIXED_HOLIDAYS)
    const ans = `${h.m}がつ ${h.d}にち`
    const dummies = FIXED_HOLIDAYS.filter((x) => x.name !== h.name).map((x) => `${x.m}がつ ${x.d}にち`)
    return sq('holiday', {
      visual: { kind: 'bigtext', text: `🎌 ${h.name}` },
      instruction: `${h.name}は いつ？`,
      speak: `${h.name}は なんがつ なんにち かな？`,
      answer: ans, dummies, cc: p.cc,
      explain: `${h.name}は ${ans}だよ`
    })
  },
  // 祝日の名前
  holidayName(p) {
    const h = pick(FIXED_HOLIDAYS)
    return sq('holidayName', {
      visual: { kind: 'bigtext', text: `🎌 ${h.m}がつ${h.d}にち` },
      instruction: 'この日は なんの日？',
      speak: `${h.m}がつ ${h.d}にちは なんの ひ かな？`,
      answer: h.name, dummies: FIXED_HOLIDAYS.filter((x) => x.name !== h.name).map((x) => x.name), cc: p.cc,
      explain: `${h.m}がつ${h.d}にちは ${h.name}`
    })
  },
  // 何月は何日まで
  daysInMonth(p) {
    const m = rng(1, 12)
    const days = new Date(2025, m, 0).getDate() // 2025は平年
    const ans = `${days}にち`
    return sq('daysInMonth', {
      visual: { kind: 'bigtext', text: `${m}がつは\n何日まで？` },
      instruction: `${m}がつは 何日まで ある？`,
      speak: `${m}がつは なんにちまで あるかな？`,
      answer: ans, dummies: ['28にち', '29にち', '30にち', '31にち'].filter((x) => x !== ans), cc: p.cc,
      explain: `${m}がつは ${days}にちまで。2がつだけ みじかいよ`
    })
  },

  // ---- 時計 ----
  // 何時（ちょうど・半）
  clockRead(p) {
    const h = rng(1, 12)
    const half = p.level >= 2 && Math.random() < 0.5
    const m = half ? 30 : 0
    const ans = half ? `${h}じ 30ぷん` : `${h}じ`
    const dummies = [
      `${(h % 12) + 1}じ${half ? ' 30ぷん' : ''}`,
      `${h === 1 ? 12 : h - 1}じ${half ? ' 30ぷん' : ''}`,
      half ? `${h}じ` : `${h}じ 30ぷん`
    ]
    return sq('clockRead', {
      visual: { kind: 'clock', h, m },
      instruction: 'なんじ？',
      speak: 'とけいを みて、なんじか こたえてね',
      answer: ans, answerId: `${h}:${m}`, dummies, cc: p.cc, type: 'clock',
      explain: half
        ? `みじかい はりが ${h}と ${(h % 12) + 1}の あいだ、ながい はりが 6。だから ${h}じ30ぷん`
        : `みじかい はりが ${h}、ながい はりが 12。だから ${h}じ`
    })
  },
  // 何時何分（5分きざみ）
  clockMinutes(p) {
    const h = rng(1, 12)
    const m = pick([5, 10, 15, 20, 25, 35, 40, 45, 50, 55])
    const ans = `${h}じ ${m}ふん`
    const dummies = [
      `${h}じ ${m + 5 > 55 ? m - 5 : m + 5}ふん`,
      `${h}じ ${m - 5 < 5 ? m + 5 : m - 5}ふん`,
      `${(h % 12) + 1}じ ${m}ふん`
    ]
    return sq('clockMinutes', {
      visual: { kind: 'clock', h, m },
      instruction: 'なんじ なんぷん？',
      speak: 'とけいを みて、なんじ なんぷんか こたえてね',
      answer: ans, dummies, cc: p.cc,
      explain: `ながい はりは 1めもり 5ふん。${m / 5}こ すすんで ${m}ふん。だから ${ans}`
    })
  },
  // ○時の○分前
  clockBefore(p) {
    const h = rng(2, 12)
    const before = pick([10, 15, 20, 30])
    const total = h * 60 - before
    const ansH = Math.floor(total / 60)
    const ansM = total % 60
    const ans = ansM === 0 ? `${ansH}じ` : `${ansH}じ ${ansM}ふん`
    const dummies = [
      `${h}じ ${before}ふん`,
      `${ansH}じ ${(ansM + 10) % 60}ふん`,
      `${h}じ`,
      `${ansH === 12 ? 1 : ansH + 1}じ ${ansM}ふん`
    ]
    return sq('clockBefore', {
      visual: { kind: 'bigtext', text: `🕐 ${h}じの\n${before}ぷん まえ` },
      instruction: `${h}じの ${before}ぷん まえは？`,
      speak: `${h}じの ${before}ふん まえは なんじ なんぷん？`,
      answer: ans, dummies, cc: p.cc,
      explain: `${h}じから ${before}ぷん もどると ${ans}`
    })
  },
  // ○時○分の○分後
  clockAfter(p) {
    const h = rng(1, 11)
    const m = pick([10, 20, 30, 40])
    const add = pick([10, 15, 20, 30])
    const total = h * 60 + m + add
    const ansH = Math.floor(total / 60)
    const ansM = total % 60
    const ans = ansM === 0 ? `${ansH}じ` : `${ansH}じ ${ansM}ふん`
    const dummies = [
      `${h}じ ${(m + add) % 60}ふん`,
      `${ansH}じ ${(ansM + 10) % 60}ふん`,
      `${ansH === 12 ? 1 : ansH + 1}じ ${ansM}ふん`
    ]
    return sq('clockAfter', {
      visual: { kind: 'clock', h, m },
      instruction: `いまから ${add}ぷん あとは？`,
      speak: `いまは ${h}じ ${m}ふん。${add}ふん あとは なんじ なんぷん？`,
      answer: ans, dummies, cc: p.cc,
      explain: `${h}じ${m}ふんから ${add}ぷん すすむと ${ans}`
    })
  },
  // 午前・午後
  amPm(p) {
    const cases = [
      { t: 'あさ ごはんを たべる とき', ans: 'ごぜん' },
      { t: 'よるに ねる とき', ans: 'ごご' },
      { t: 'がっこうに いく あさ 8じ', ans: 'ごぜん' },
      { t: 'ゆうがた 5じ', ans: 'ごご' },
      { t: 'おひるごはんの あとの 2じ', ans: 'ごご' },
      { t: 'あさ おきる 7じ', ans: 'ごぜん' }
    ]
    const c = pick(cases)
    return sq('amPm', {
      visual: { kind: 'bigtext', text: c.t },
      instruction: 'ごぜん？ ごご？',
      speak: `${c.t}は、ごぜんと ごご どっち？`,
      answer: c.ans, dummies: ['ごぜん', 'ごご'], cc: 2,
      explain: 'よるの 12じから おひるの 12じまでが ごぜん。そのあとが ごご'
    })
  }
}

// 学年ごとの出題タイプ
function kindsForGrade(grade, level) {
  if (grade <= 0) {
    const k = ['todayDate', 'todayWeek', 'relativeDay', 'weekOrder', 'monthOrder', 'season', 'monthEvent']
    if (level >= 2) k.push('clockRead', 'holiday', 'relativeDay', 'todayWeek')
    return k
  }
  if (grade === 1) {
    const k = ['todayDate', 'todayWeek', 'relativeDay', 'weekOrder', 'monthOrder', 'season', 'clockRead', 'holiday', 'holidayName']
    if (level >= 3) k.push('clockMinutes', 'daysInMonth', 'monthEvent', 'amPm')
    return k
  }
  // 小2以上: 時計の応用まで
  const k = ['relativeDay', 'clockRead', 'clockMinutes', 'holiday', 'holidayName', 'daysInMonth', 'season', 'amPm', 'todayDate', 'todayWeek']
  if (level >= 2) k.push('clockBefore', 'clockAfter', 'clockMinutes', 'monthOrder')
  return k
}

/**
 * せいかつ（日付・時計）の問題を1問つくる。
 * @param {object} params grade / level / choiceCount
 * @param {string|null} reviewKey 's:タイプ名'
 */
export function generateSeikatsuQuestion(params, reviewKey = null) {
  const grade = params.grade || 0
  const p = { ...params, grade, cc: Math.max(3, params.choiceCount || 3) }
  if (reviewKey && reviewKey.startsWith('s:')) {
    const kind = reviewKey.slice(2)
    if (BUILDERS[kind]) return BUILDERS[kind](p)
  }
  return BUILDERS[pick(kindsForGrade(grade, params.level || 1))](p)
}

export const SEIKATSU_LABELS = {
  todayDate: 'きょうの日づけ', todayWeek: 'きょうの曜日', relativeDay: 'あした・きのう',
  weekOrder: '曜日のならび', monthOrder: '月のならび', season: 'きせつ',
  monthEvent: '行事の月', holiday: 'しゅくじつの日', holidayName: 'しゅくじつの名前',
  daysInMonth: '月の日数', clockRead: 'とけい（なんじ）', clockMinutes: 'とけい（なんぷん）',
  clockBefore: '○分まえ', clockAfter: '○分あと', amPm: 'ごぜん・ごご'
}
