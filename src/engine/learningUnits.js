// 進級に使う単元台帳。問題生成元が公開する一覧だけから組み立てるため、
// 「出るのに必須でない」「必須だが出ない」をテストで検出できる。
import { NUMBERS_KINDS_BY_GRADE, KIND_LABELS } from '../data/content/numbers.js'
import { SEIKATSU_KINDS_BY_GRADE } from '../data/content/seikatsu.js'
import { RIKA_LESSON_POINTS, RIKA_UNIT_IDS_BY_GRADE } from '../data/content/rika.js'
import { SHAKAI_LESSON_POINTS, SHAKAI_UNIT_IDS_BY_GRADE } from '../data/content/shakai.js'
import { WRITING_GROUPS_BY_GRADE } from '../data/content/writing.js'
import { dayNumber } from './srs.js'

function gradeId(grade) { return Math.max(0, Math.min(6, Number(grade) || 0)) }

export function unitIdFor(question, grade = 0) {
  if (!question) return null
  if (question.unitId) return question.unitId
  const g = gradeId(grade)
  const key = String(question.itemKey || '')
  if (question.domain === 'suuji' || key.startsWith('n:')) return `math:${key.slice(2).split('#')[0]}`
  if (question.domain === 'seikatsu' || key.startsWith('s:')) {
    const kind = key.slice(2).split('#')[0]
    if (['todayDate', 'relativeDay', 'monthOrder', 'daysInMonth', 'monthEvent', 'holiday', 'holidayName'].includes(kind)) return 'life:calendar'
    if (['todayWeek', 'weekOrder'].includes(kind)) return 'life:weekday'
    if (kind.startsWith('clock') || kind === 'amPm') return 'life:clock'
    return 'life:season'
  }
  if (question.domain === 'kaku' || question.type === 'trace') {
    const text = String(question.target || key)
    const groups = WRITING_GROUPS_BY_GRADE[g] || []
    const group = groups.find((entry) => entry.chars.includes(text))
    return group ? `writing:${g}:${group.id}` : /[ぁ-ん]/.test(text) ? `writing:${g}:hiragana-1` : /[ァ-ヶ]/.test(text) ? `writing:${g}:katakana-1` : `writing:${g}:kanji-1`
  }
  if (question.domain === 'yomu' || key.startsWith('w:') || key.startsWith('j:') || key.startsWith('k:')) return key.startsWith('j:') ? `reading:${g}:kanji-words` : `reading:${g}:kana-words`
  return null
}

export function withLearningUnit(question, grade = 0) {
  if (!question || question.domain === 'english' || question.domain === 'doutoku') return question
  const unitId = unitIdFor(question, grade)
  return unitId ? { ...question, unitId, skillId: unitId } : question
}

const readingUnits = (g) => g === 0 ? [`reading:${g}:kana-words`] : [`reading:${g}:kana-words`, `reading:${g}:kanji-words`]
const writingUnits = (g) => (WRITING_GROUPS_BY_GRADE[g] || []).map((entry) => `writing:${g}:${entry.id}`)
const lifeUnits = (g) => [...new Set((SEIKATSU_KINDS_BY_GRADE[g] || []).map((kind) => unitIdFor({ domain: 'seikatsu', itemKey: `s:${kind}` }, g)))]

export function unitLedger(grade = 0) {
  const g = gradeId(grade)
  const domains = [
    ['yomu', readingUnits(g)],
    ['kaku', writingUnits(g)],
    ['suuji', (NUMBERS_KINDS_BY_GRADE[g] || []).map((kind) => `math:${kind}`)]
  ]
  if (g <= 2) domains.push(['seikatsu', lifeUnits(g)])
  if (g >= 3) {
    domains.push(['rika', RIKA_UNIT_IDS_BY_GRADE[g] || []])
    domains.push(['shakai', SHAKAI_UNIT_IDS_BY_GRADE[g] || []])
  }
  return domains.flatMap(([domainId, unitIds]) => unitIds.map((unitId) => ({ unitId, domainId, requiredForPromotion: true })))
}

export function requiredUnitIds(grade = 0) { return unitLedger(grade).filter((unit) => unit.requiredForPromotion).map((unit) => unit.unitId) }
export function unitLabel(unitId) {
  const id = String(unitId || '')
  if (id.startsWith('math:')) return KIND_LABELS[id.slice(5)] || 'さんすう'
  if (id.startsWith('life:')) return ({ calendar: 'カレンダー', weekday: '曜日', clock: 'とけい', season: 'きせつ' })[id.slice(5)] || 'せいかつ'
  if (id.startsWith('reading:')) return id.endsWith('kanji-words') ? 'かんじの ことば' : 'ことばを よむ'
  if (id.startsWith('writing:')) {
    const [, grade, groupId] = id.split(':')
    const group = (WRITING_GROUPS_BY_GRADE[Number(grade)] || []).find((entry) => entry.id === groupId)
    const kind = groupId?.startsWith('hiragana') ? 'ひらがな' : groupId?.startsWith('katakana') ? 'カタカナ' : '収録かんじ'
    const number = Number(groupId?.split('-').at(-1)) || 1
    return `${kind}${number}（${(group?.chars || []).slice(0, 4).join('・')}）`
  }
  const science = { insects: 'こん虫', plants: '植物', 'light-shadow': '光とかげ', magnet: 'じしゃく', sound: '音', 'rubber-wind': 'ゴムと風', 'air-water': '空気と水', electricity: '電気', 'moon-stars': '月と星', heat: 'あたたまり方', 'water-states': '水のすがた', 'living-things': '生き物', 'germination-growth': '発芽と成長', medaka: 'メダカ', pendulum: 'ふりこ', electromagnet: '電磁石', 'running-water': '流れる水', weather: '天気', flowers: '花', combustion: '燃焼', 'plant-sunlight': '植物と日光', body: '人の体', lever: 'てこ', solutions: '水よう液', earth: '大地のつくり' }
  const social = { 'map-symbols': '地図記号', safety: '安全なくらし', shops: '店のしごと', 'old-tools': '昔のくらし', 'public-safety': '公共の安全', prefectures: '都道府県', 'waste-water': 'ごみと水', disasters: '自然災害', maps: '地図', land: '国土', agriculture: '農業', fishing: '水産業', industry: '工業', information: '情報', forests: '森林', history: '歴史', politics: '政治', constitution: '日本国憲法', international: '国際社会' }
  const topic = id.split(':').at(-1) || 'この たんげん'
  return science[topic] || social[topic] || topic.replaceAll('-', ' ')
}

const MATH_LESSON_GROUPS = [
  [['count', 'countKeypad', 'tens', 'countMoney100', 'bigNumbers'], ['数は1こずつ対応させ、10のまとまりを作ると数えやすい', '23は「10が2こと1が3こ」。位をそろえて読もう', '数え飛ばしや位の読み違いがないか、最後にもう一度確かめよう']],
  [['compareCards', 'compareNum'], ['大きさは、まず桁数、同じなら左の位からくらべる', '47と42は十の位が同じなので、一の位7と2をくらべる', '数字の見た目ではなく、どの位の数かに注目しよう']],
  [['add10', 'addKeypad', 'addCarry', 'add2digit', 'add3digit', 'add3nums', 'holeAdd'], ['たし算は同じ位どうしを足し、10になったら一つ上の位へくり上げる', '28+7は、2をもらって30にしてから残り5を足すと35', '筆算では一の位をそろえ、くり上がりの1を書き忘れない']],
  [['sub10', 'subBorrow', 'sub2digit', 'holeSub'], ['ひき算は同じ位どうしを引き、足りないときは上の位から10を借りる', '32-7は、32を20と12に分けて12-7=5、20+5=25', '借りた上の位を1へらすのを忘れない']],
  [['make10'], ['10になる組は、1と9、2と8、3と7、4と6、5と5', '8にいくつ足すと10かは、10-8で2', '10の組をすぐ言えると、くり上がりの計算が速くなる']],
  [['sequence', 'orderNumbers', 'evenOdd'], ['数の並びは、いくつずつ増減しているかを先に見る', '2,4,6,8は2ずつ増える偶数の並び', '最初の二つだけで決めず、次の数でも規則を確かめよう']],
  [['double', 'half', 'mul10', 'kuku', 'holeMul', 'tensMul', 'mul2x1', 'mul3x1'], ['かけ算は同じ数がいくつ分あるかを表す', '3×4は3が4こ分で12。×10なら位が一つ上がる', '筆算では一の位からかけ、くり上がりを足し忘れない']],
  [['div', 'divRemainder', 'div3digit'], ['わり算は、同じ数ずつ分ける、またはいくつ分あるかを求める計算', '14÷3は3が4こで12、残り2なので4あまり2', 'あまりは、わる数より小さくなることを確かめよう']],
  [['fracCompareSame', 'fracCompareDiff', 'fracAddDiff', 'fracMul', 'fracDiv'], ['分数は分母が分けた数、分子がそのいくつ分かを表す', '分母が同じなら分子をくらべ、違うなら同じ分母にそろえる。整数でわるときは分母にその数をかける', '足し算で分母どうしをそのまま足さないようにしよう']],
  [['decimalAdd', 'decimalSub', 'decimalMul', 'decimalDiv'], ['小数は小数点を基準に位をそろえて計算する', '2.4+0.35は2.40+0.35として2.75。わり算は10倍して整数のわり算にしてから点をもどす', '答えの小数点の位置を、計算前の見積もりで確かめよう']],
  [['shapeName', 'shapeGroups'], ['形は辺の数・角の数・長さなど同じ特徴で分ける', '三角形は辺が3本、四角形は辺が4本', '向きや大きさが変わっても、形の特徴は変わらない']],
  [['perimeter', 'area', 'triangleArea', 'volume'], ['周りの長さと面積・体積は、表しているものが違う', '長方形の面積はたて×よこ、三角形は底辺×高さ÷2', '単位を、長さcm・面積cm²・体積cm³で取り違えない']],
  [['moneyAdd', 'moneyChange', 'unitPrice', 'discount', 'percent'], ['金額は同じ単位にそろえ、合計・差・割合のどれかを見分ける', 'おつりは出した金額-代金、20%引きは元の80%', '「引いた額」と「支払う額」を取り違えない']],
  [['clockPlus', 'timeCalc', 'speedTime'], ['時刻は何時何分、時間はどれだけ続いたかを表す', '1時間は60分。50分後は時間をまたぐことがある', '時刻と時間を書き分け、60分で1時間に直そう']],
  [['lengthConv', 'kgConv', 'literConv'], ['単位をそろえてから計算する', '1m=100cm、1kg=1000g、1L=1000mL', '大きい単位から小さい単位へ直すと数は大きくなる']],
  [['roundNum', 'roundTen'], ['がい数は、残す位の一つ下を見て四捨五入する', '十の位までなら一の位が0〜4で切り捨て、5〜9で切り上げ', 'どの位まで求めるのかに線を引いてから丸めよう']],
  [['average'], ['平均は、全部を合わせた量を個数で同じに分けた値', '4,6,8の平均は(4+6+8)÷3=6', '合計を出したあと、何個で割るかを数えよう']],
  [['ratio'], ['比は二つの量の関係を同じ順番で表す', '2:3は、前が2こ分のとき後ろが3こ分', '問題文と答えで比の順番を入れ替えない']],
  [['speed'], ['速さ=道のり÷時間。道のり=速さ×時間', '120kmを2時間なら120÷2=60km/h', '分と時間、mとkmの単位をそろえてから計算しよう']],
  [['lcm', 'gcdKind'], ['公倍数は両方の倍数、公約数は両方を割り切れる数', '6と8の最小公倍数は24、最大公約数は2', '倍数と約数を逆にしないよう、言葉を確かめよう']]
]
const MATH_LESSONS = Object.fromEntries(MATH_LESSON_GROUPS.flatMap(([kinds, points]) => kinds.map((kind) => [kind, points])))

export function lessonForUnit(unitId) {
  const label = unitLabel(unitId)
  const id = String(unitId || '')
  const topic = id.split(':').at(-1)
  let points = MATH_LESSONS[topic] || RIKA_LESSON_POINTS[id] || SHAKAI_LESSON_POINTS[id]
  if (id.startsWith('life:')) points = ({
    calendar: ['カレンダーは月・日・曜日を組み合わせて読む', '前の日と次の日は、月をまたぐと数字が大きく変わる', '月ごとの日数と行事を、実際のカレンダーで確かめよう'],
    weekday: ['曜日は月・火・水・木・金・土・日の7日でくり返す', '今日の次が明日、今日の前が昨日の曜日', '日付が変わると曜日も一つ進むことを忘れない'],
    clock: ['短い針は時、長い針は分を表す', '長い針は数字一つで5分。6なら30分', '○分前と○分後は、60分をまたぐか確かめよう'],
    season: ['春・夏・秋・冬で、気温や生き物のようすが変わる', '同じ月でも場所で違うので、代表的な変化を覚えよう', '行事の月と季節をセットで考えよう']
  })[topic]
  if (id.startsWith('reading:')) points = id.endsWith('kanji-words')
    ? ['漢字一字ではなく、前後の文字を合わせた言葉として読む', '同じ漢字でも言葉によって読み方が変わる', '送りがなや二字熟語を最後まで見てから答えよう']
    : ['文字を左から順に音へつなげて、一つの言葉として読む', '小さい「ゃ・ゅ・ょ」や「っ」は前後の音と合わせる', '絵だけで決めず、書かれた文字を最後まで見よう']
  if (id.startsWith('writing:')) {
    const [, grade, groupId] = id.split(':')
    const chars = (WRITING_GROUPS_BY_GRADE[Number(grade)] || []).find((entry) => entry.id === groupId)?.chars || []
    points = [`このグループは「${chars.join('・')}」を練習する`, 'お手本で書き始めと書き順を見てから、同じ道をゆっくりなぞる', '別の日に思い出して、ガイドなしで書けたら定着のしるし']
  }
  if (!points) points = [`「${label}」のルールを例といっしょに確かめる`, '問題文の条件に線を引き、何を答えるかを先に決める', '答えたあと、単位や言葉が合っているか見直す']
  if (points.length === 2) points = [...points, '似ている言葉を取り違えないよう、問題文の条件まで確かめよう']
  return { title: `${label}を ならおう`, points, tip: '答えだけでなく「どうして？」も一言で言ってみよう' }
}
export function unitStatsFor(state, grade = state.grade, domainId) { return state.unitStats?.[grade]?.[domainId] || {} }

// 同じ1問を連打して「覚えた」にはしない。各単元で異なる項目にも触れる。
export function unitReady(stat, itemCount = 2) {
  return !!stat && (stat.attempts || 0) >= 4 && (stat.firstAttemptCorrect || 0) >= 3 &&
    new Set(stat.successDays || []).size >= 2 && ((stat.itemRequirement || itemCount) <= 1 || new Set(stat.itemKeys || []).size >= 2)
}

export function nextLearningUnit(state, grade, domainId) {
  const candidates = unitLedger(grade).filter((unit) => unit.domainId === domainId).map((unit) => unit.unitId)
  const stats = unitStatsFor(state, grade, domainId)
  const newUnit = candidates.find((id) => !unitReady(stats[id]))
  if (newUnit) return newUnit
  return selectPracticeUnit(state, grade, domainId, candidates)
}

// 混合練習は、期限到来→長く出ていない→正答率が低い、の順で選ぶ。
export function selectPracticeUnit(state, grade, domainId, candidates = null, today = dayNumber()) {
  const stats = unitStatsFor(state, grade, domainId)
  const ids = candidates || unitLedger(grade).filter((unit) => unit.domainId === domainId && stats[unit.unitId]?.attempts > 0).map((unit) => unit.unitId)
  return [...ids].sort((a, b) => {
    const sa = stats[a] || {}
    const sb = stats[b] || {}
    const aDue = (sa.nextDue ?? Infinity) <= today ? 0 : 1
    const bDue = (sb.nextDue ?? Infinity) <= today ? 0 : 1
    return aDue - bDue ||
      (sa.nextDue ?? Infinity) - (sb.nextDue ?? Infinity) ||
      (sa.lastPresentedDate ?? -Infinity) - (sb.lastPresentedDate ?? -Infinity) ||
      (sa.firstAttemptCorrect || 0) / Math.max(1, sa.attempts || 0) - (sb.firstAttemptCorrect || 0) / Math.max(1, sb.attempts || 0)
  })[0] || null
}

export function trialUnlocked(state, grade = state.grade) {
  const stats = state.unitStats?.[grade] || {}
  const missing = unitLedger(grade).filter(({ domainId, unitId, requiredForPromotion }) => requiredForPromotion && !unitReady(stats[domainId]?.[unitId])).map(({ unitId }) => unitId)
  return { unlocked: missing.length === 0, missing }
}

// 画面表示・保存・学年解放で必ず同じ判定を使う。
export function promotionResult(state, grade, candidateRound = null) {
  const rounds = [...(state.starTrials?.[grade]?.rounds || []).slice(-1), ...(candidateRound ? [candidateRound] : [])]
  const correct = rounds.reduce((sum, round) => sum + (round.correct || 0), 0)
  const total = rounds.reduce((sum, round) => sum + (round.total || 0), 0)
  const gate = trialUnlocked(state, grade)
  const scorePassed = total >= 12 && correct >= 9
  const requiredDomains = unitLedger(grade).map((entry) => entry.domainId).filter((id, index, all) => all.indexOf(id) === index)
  const correctDomains = new Set(rounds.flatMap((round) => round.correctDomains || []))
  const domainsPassed = requiredDomains.every((id) => correctDomains.has(id))
  return { rounds, correct, total, scorePassed, domainsPassed, requiredDomains, correctDomains: [...correctDomains], missingUnits: gate.missing, passed: scorePassed && domainsPassed && gate.unlocked }
}

export function recordUnitResult(stats, grade, domainId, unitId, correct, day, itemKey) {
  if (!unitId || domainId === 'english' || domainId === 'doutoku') return stats || {}
  const byGrade = stats?.[grade] || {}
  const byDomain = byGrade[domainId] || {}
  const previous = byDomain[unitId] || { attempts: 0, firstAttemptCorrect: 0, successDays: [], itemKeys: [], lastPresentedDate: null, nextDue: null }
  const successDays = correct && !previous.successDays?.includes(day) ? [...(previous.successDays || []), day].slice(-12) : previous.successDays || []
  const itemKeys = itemKey && !previous.itemKeys?.includes(itemKey) ? [...(previous.itemKeys || []), itemKey].slice(-24) : previous.itemKeys || []
  const next = { ...previous, attempts: (previous.attempts || 0) + 1, firstAttemptCorrect: (previous.firstAttemptCorrect || 0) + (correct ? 1 : 0), successDays, itemKeys, itemRequirement: domainId === 'suuji' ? 1 : previous.itemRequirement, lastPresentedDate: day, nextDue: correct ? day + 1 : day }
  return { ...stats, [grade]: { ...byGrade, [domainId]: { ...byDomain, [unitId]: next } } }
}
