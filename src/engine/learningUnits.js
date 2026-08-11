// 学習を「教科全体」ではなく、小さな単元ごとに進めるための共通ルール。
// 英語はこの仕組みから明確に除外する（英語は englishProgress.js が担当）。

const MATH_CORE = {
  0: ['count', 'add10'], 1: ['add10', 'addCarry'], 2: ['kuku', 'add2digit'],
  3: ['div', 'fracCompareSame'], 4: ['decimalAdd', 'roundNum'],
  5: ['decimalMul', 'percent'], 6: ['fracMul', 'ratio']
}

const LIFE_CORE = {
  0: ['calendar', 'weekday'], 1: ['calendar', 'clock'], 2: ['calendar', 'clock']
}

function gradeId(grade) { return Math.max(0, Math.min(6, Number(grade) || 0)) }

export function unitIdFor(question, grade = 0) {
  if (!question) return null
  if (question.unitId) return question.unitId
  const g = gradeId(grade)
  const key = String(question.itemKey || '')
  if (question.domain === 'suuji' || key.startsWith('n:')) return `math:${key.slice(2).split('#')[0]}`
  if (question.domain === 'seikatsu' || key.startsWith('s:')) {
    const kind = key.slice(2)
    if (['todayDate', 'relativeDay', 'monthOrder', 'daysInMonth'].includes(kind)) return 'life:calendar'
    if (['todayWeek', 'weekOrder'].includes(kind)) return 'life:weekday'
    if (kind.startsWith('clock') || kind === 'amPm') return 'life:clock'
    return 'life:season'
  }
  if (question.domain === 'yomu' || key.startsWith('w:') || key.startsWith('j:') || key.startsWith('k:')) return key.startsWith('j:') ? `reading:${g}:jukugo` : `reading:${g}:words`
  if (question.domain === 'kaku' || question.type === 'trace') {
    const text = String(question.target || key)
    const script = /[ぁ-ん]/.test(text) ? 'hira' : /[ァ-ヶ]/.test(text) ? 'kata' : 'kanji'
    // 文字種を小さな書字グループとして扱う。文字単体ではなく、ひらがな／
    // カタカナ／各学年の収録漢字を、別日に書けたかで進める。
    return `writing:${g}:${script}`
  }
  if (question.domain === 'rika' || key.startsWith('r:')) return `science:${g}`
  if (question.domain === 'shakai' || key.startsWith('c:')) return `social:${g}`
  return null
}

export function withLearningUnit(question, grade = 0) {
  if (!question || question.domain === 'english') return question
  const unitId = unitIdFor(question, grade)
  return unitId ? { ...question, unitId, skillId: unitId } : question
}

export function requiredUnitIds(grade = 0) {
  const g = gradeId(grade)
  const units = [`reading:${g}:words`, `writing:${g}:${g === 0 ? 'hira' : g === 1 ? 'kata' : 'kanji'}`, ...MATH_CORE[g].map((k) => `math:${k}`)]
  if (g <= 2) units.push(...LIFE_CORE[g].map((k) => `life:${k}`))
  if (g >= 3) units.push(`science:${g}`, `social:${g}`)
  return units
}

export function unitReady(stat) {
  return !!stat && (stat.attempts || 0) >= 4 && (stat.firstAttemptCorrect || 0) >= 3 && new Set(stat.successDays || []).size >= 2
}

export function unitStatsFor(state, grade = state.grade, domainId) { return state.unitStats?.[grade]?.[domainId] || {} }

export function nextLearningUnit(state, grade, domainId) {
  const candidates = requiredUnitIds(grade).filter((id) => {
    if (domainId === 'yomu') return id.startsWith('reading:')
    if (domainId === 'kaku') return id.startsWith('writing:')
    if (domainId === 'suuji') return id.startsWith('math:')
    if (domainId === 'seikatsu') return id.startsWith('life:')
    if (domainId === 'rika') return id === `science:${gradeId(grade)}`
    if (domainId === 'shakai') return id === `social:${gradeId(grade)}`
    return false
  })
  const stats = unitStatsFor(state, grade, domainId)
  return candidates.find((id) => !unitReady(stats[id])) || candidates[0] || null
}

export function trialUnlocked(state, grade = state.grade) {
  const stats = state.unitStats?.[grade] || {}
  const missing = requiredUnitIds(grade).filter((id) => {
    const domain = id.startsWith('reading:') ? 'yomu' : id.startsWith('writing:') ? 'kaku' : id.startsWith('math:') ? 'suuji' : id.startsWith('life:') ? 'seikatsu' : id.startsWith('science:') ? 'rika' : 'shakai'
    return !unitReady(stats[domain]?.[id])
  })
  return { unlocked: missing.length === 0, missing }
}

export function recordUnitResult(stats, grade, domainId, unitId, correct, day) {
  if (!unitId || domainId === 'english' || domainId === 'doutoku') return stats || {}
  const byGrade = stats?.[grade] || {}
  const byDomain = byGrade[domainId] || {}
  const previous = byDomain[unitId] || { attempts: 0, firstAttemptCorrect: 0, successDays: [], lastDay: null }
  const successDays = correct && !previous.successDays?.includes(day) ? [...(previous.successDays || []), day].slice(-12) : previous.successDays || []
  const next = { ...previous, attempts: (previous.attempts || 0) + 1, firstAttemptCorrect: (previous.firstAttemptCorrect || 0) + (correct ? 1 : 0), successDays, lastDay: day }
  return { ...stats, [grade]: { ...byGrade, [domainId]: { ...byDomain, [unitId]: next } } }
}
