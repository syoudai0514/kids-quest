// 進級に使う単元台帳。問題生成元が公開する一覧だけから組み立てるため、
// 「出るのに必須でない」「必須だが出ない」をテストで検出できる。
import { NUMBERS_KINDS_BY_GRADE, KIND_LABELS } from '../data/content/numbers.js'
import { SEIKATSU_KINDS_BY_GRADE } from '../data/content/seikatsu.js'
import { RIKA_UNIT_IDS_BY_GRADE } from '../data/content/rika.js'
import { SHAKAI_UNIT_IDS_BY_GRADE } from '../data/content/shakai.js'

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
    return /[ぁ-ん]/.test(text) ? `writing:${g}:hiragana` : /[ァ-ヶ]/.test(text) ? `writing:${g}:katakana` : `writing:${g}:kanji`
  }
  return null
}

export function withLearningUnit(question, grade = 0) {
  if (!question || question.domain === 'english' || question.domain === 'doutoku') return question
  const unitId = unitIdFor(question, grade)
  return unitId ? { ...question, unitId, skillId: unitId } : question
}

const readingUnits = (g) => g === 0 ? [`reading:${g}:kana-words`] : [`reading:${g}:kana-words`, `reading:${g}:kanji-words`]
const writingUnits = (g) => g === 0 ? [`writing:${g}:hiragana`, `writing:${g}:katakana`] : g === 1 ? [`writing:${g}:hiragana`, `writing:${g}:katakana`, `writing:${g}:kanji`] : [`writing:${g}:kanji`]
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
  if (id.startsWith('writing:')) return id.endsWith('hiragana') ? 'ひらがなを かく' : id.endsWith('katakana') ? 'カタカナを かく' : 'かんじを かく'
  const topic = id.split(':').at(-1)?.replaceAll('-', ' ') || 'この たんげん'
  return topic
}
export function lessonForUnit(unitId) {
  const label = unitLabel(unitId)
  return { title: `${label}を ならおう`, points: [`きょうは「${label}」を ひとつずつ たしかめよう`, 'もんだいを よく よんで、あわてずに かんがえよう', 'まちがえても、せつめいを 見て つぎに いかそう'], tip: 'できたところを ひとつ見つけよう' }
}
export function unitStatsFor(state, grade = state.grade, domainId) { return state.unitStats?.[grade]?.[domainId] || {} }

// 同じ1問を連打して「覚えた」にはしない。各単元で異なる項目にも触れる。
export function unitReady(stat, itemCount = 2) {
  return !!stat && (stat.attempts || 0) >= 4 && (stat.firstAttemptCorrect || 0) >= 3 &&
    new Set(stat.successDays || []).size >= 2 && (itemCount <= 1 || new Set(stat.itemKeys || []).size >= 2)
}

export function nextLearningUnit(state, grade, domainId) {
  const candidates = unitLedger(grade).filter((unit) => unit.domainId === domainId).map((unit) => unit.unitId)
  const stats = unitStatsFor(state, grade, domainId)
  return candidates.find((id) => !unitReady(stats[id])) || candidates[0] || null
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
  return { rounds, correct, total, scorePassed, missingUnits: gate.missing, passed: scorePassed && gate.unlocked }
}

export function recordUnitResult(stats, grade, domainId, unitId, correct, day, itemKey) {
  if (!unitId || domainId === 'english' || domainId === 'doutoku') return stats || {}
  const byGrade = stats?.[grade] || {}
  const byDomain = byGrade[domainId] || {}
  const previous = byDomain[unitId] || { attempts: 0, firstAttemptCorrect: 0, successDays: [], itemKeys: [], lastPresentedDate: null, nextDue: null }
  const successDays = correct && !previous.successDays?.includes(day) ? [...(previous.successDays || []), day].slice(-12) : previous.successDays || []
  const itemKeys = itemKey && !previous.itemKeys?.includes(itemKey) ? [...(previous.itemKeys || []), itemKey].slice(-24) : previous.itemKeys || []
  const next = { ...previous, attempts: (previous.attempts || 0) + 1, firstAttemptCorrect: (previous.firstAttemptCorrect || 0) + (correct ? 1 : 0), successDays, itemKeys, lastPresentedDate: day, nextDue: correct ? day + 1 : day }
  return { ...stats, [grade]: { ...byGrade, [domainId]: { ...byDomain, [unitId]: next } } }
}
