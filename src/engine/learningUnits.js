// 進級に使う単元台帳。問題生成元が公開する一覧だけから組み立てるため、
// 「出るのに必須でない」「必須だが出ない」をテストで検出できる。
import { NUMBERS_KINDS_BY_GRADE, KIND_LABELS } from '../data/content/numbers.js'
import { SEIKATSU_KINDS_BY_GRADE } from '../data/content/seikatsu.js'
import { RIKA_UNIT_IDS_BY_GRADE } from '../data/content/rika.js'
import { SHAKAI_UNIT_IDS_BY_GRADE } from '../data/content/shakai.js'
import { WRITING_GROUPS_BY_GRADE } from '../data/content/writing.js'

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
  if (question.domain === 'yomu' || key.startsWith('w:') || key.startsWith('j:') || key.startsWith('k:')) return key.startsWith('j:') ? `reading:${g}:kanji-words` : `reading:${g}:kana-words`
  if (question.domain === 'kaku' || question.type === 'trace') {
    const text = String(question.target || key)
    const groups = WRITING_GROUPS_BY_GRADE[g] || []
    const group = groups.find((entry) => entry.chars.includes(text))
    return group ? `writing:${g}:${group.id}` : /[ぁ-ん]/.test(text) ? `writing:${g}:hiragana-1` : /[ァ-ヶ]/.test(text) ? `writing:${g}:katakana-1` : `writing:${g}:kanji-1`
  }
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
  if (id.startsWith('writing:')) return id.includes('hiragana') ? 'ひらがなを かく' : id.includes('katakana') ? 'カタカナを かく' : '収録かんじを かく'
  const science = { insects: 'こん虫', plants: '植物', 'light-shadow': '光とかげ', magnet: 'じしゃく', sound: '音', 'rubber-wind': 'ゴムと風', 'air-water': '空気と水', electricity: '電気', 'moon-stars': '月と星', heat: 'あたたまり方', 'water-states': '水のすがた', 'living-things': '生き物', 'germination-growth': '発芽と成長', medaka: 'メダカ', pendulum: 'ふりこ', electromagnet: '電磁石', 'running-water': '流れる水', weather: '天気', flowers: '花', combustion: '燃焼', 'plant-sunlight': '植物と日光', body: '人の体', lever: 'てこ', solutions: '水よう液', earth: '大地のつくり' }
  const social = { 'map-symbols': '地図記号', safety: '安全なくらし', shops: '店のしごと', 'old-tools': '昔のくらし', 'public-safety': '公共の安全', prefectures: '都道府県', 'waste-water': 'ごみと水', disasters: '自然災害', maps: '地図', land: '国土', agriculture: '農業', fishing: '水産業', industry: '工業', information: '情報', forests: '森林', history: '歴史', politics: '政治', constitution: '日本国憲法', international: '国際社会' }
  const topic = id.split(':').at(-1) || 'この たんげん'
  return science[topic] || social[topic] || topic.replaceAll('-', ' ')
}
export function lessonForUnit(unitId) {
  const label = unitLabel(unitId)
  const topic = String(unitId || '').split(':').at(-1)
  const lessons = {
    kuku: ['同じ数を何回もたすと、かけ算で短く書ける', '3×4 は「3を4回」ではなく、3が4こ分で12', '順番を入れかえても答えは同じ：3×4 と4×3'],
    div: ['わり算は、同じ数ずつ分ける計算', '12÷3 は、12を3人で同じ数ずつ分けると4', 'あまりがあるときは、わる数より小さくなる'],
    fraction: ['分数は、同じ大きさに分けたうちのいくつ分か', '1/2 は半分、2/4 も同じ大きさ', '分母は分けた数、分子は取った数'],
    clock: ['長い針は分、短い針は時を表す', '長い針が12なら「ちょうど」、6なら「30分」', '1目もりは5分ずつ進む'],
    'light-shadow': ['光が物に当たり、さえぎられた反対側に影ができる', '太陽が高い昼ごろは影が短い', '光の向きが変わると影の向きも変わる'],
    electromagnet: ['電流が流れるコイルは電磁石になる', '巻き数や電流を増やすと強くなる', '電流を止めると磁力もなくなる'],
    'running-water': ['流れる水には、けずる・運ぶ・積もらせるはたらきがある', '上流は石が大きく角ばり、下流ほど丸く小さい', '水だけでなく風も地面を運び、地層をつくる'],
    history: ['出来事を古い順につなげると歴史になる', '人物・制度・くらしをセットで考えよう', '時代名だけでなく、何が変わったかを確かめよう'],
    politics: ['国会は法律をつくり、内閣は実行し、裁判所は判断する', '三つが役割を分けて、力がかたよりすぎないようにする', '身近な市や町にも、くらしを支える仕事がある']
  }
  const points = lessons[topic] || [`「${label}」で使う言葉とルールを先に見よう`, '具体例を一つ声に出して考えてから答えよう', 'まちがいは、どこで考え方が違ったかを説明で確かめよう']
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
  // 全達成後は最初へ固定しない。最終出題が古く、正答率が低い単元を優先する。
  return [...candidates].sort((a, b) => ((stats[a]?.lastPresentedDate || 0) - (stats[b]?.lastPresentedDate || 0)) || ((stats[a]?.firstAttemptCorrect || 0) / Math.max(1, stats[a]?.attempts || 0)) - ((stats[b]?.firstAttemptCorrect || 0) / Math.max(1, stats[b]?.attempts || 0)))[0] || null
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
