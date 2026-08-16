import { questionIds, withQuestionIds } from './reviewKey.js'
import { WRITING_GROUPS_BY_GRADE } from '../data/content/writing.js'

export const UNIT_PROGRESS_VERSION = 15

function mergeSrsEntry(current, incoming) {
  if (!current) return incoming
  return {
    ...current,
    ...incoming,
    box: Math.min(current.box ?? 0, incoming.box ?? 0),
    due: Math.min(current.due ?? Infinity, incoming.due ?? Infinity),
    lapses: Math.max(current.lapses || 0, incoming.lapses || 0)
  }
}

function normalizedKnowledgeId(domainId, oldKey, snapshot = null, fallbackGrade = null) {
  if (snapshot) {
    const id = questionIds(snapshot).knowledgeId
    if (id) return id
  }
  const base = String(oldKey || '').split('#')[0]
  if (!base) return null
  // むずかしいモードの itemKey/skillId（'hard:xxx' や 'skill:hard:xxx'）は、
  // 生成時から既に安定した識別子として設計されている（計画書§4.2(d)）ため、
  // 通常モードのような旧形式からの変換は不要でそのまま通す。
  // hard:suuji はreviewQuestionsにスナップショットを保存しない（計算式
  // そのものは保存せず毎回類題を作る設計）ため、上のsnapshot分岐を
  // 必ず素通りしてここへ来る。ここで拾わないと、次にUNIT_PROGRESS_VERSIONを
  // 上げた瞬間に全ユーザーのhardさんすう進捗が消えてしまう（Issue #23）。
  if (domainId.startsWith('hard:')) return base
  if (domainId === 'suuji') {
    if (base.startsWith('skill:math:')) return base
    if (base.startsWith('n:')) return `skill:math:${base.slice(2)}`
  }
  if (domainId === 'kaku') {
    if (base.startsWith('char:')) return base
    if (base.startsWith('k:') && fallbackGrade != null) return `char:${fallbackGrade}:${base.slice(2)}`
    return null
  }
  if (/^(w:|j:|k:|s:|r:|c:|d:)/.test(base)) return base
  return null
}

function mergeUnitStat(current, incoming) {
  if (!current) return incoming
  const nextDue = Math.min(current.nextDue ?? Infinity, incoming.nextDue ?? Infinity)
  return {
    ...current,
    ...incoming,
    attempts: Math.max(current.attempts || 0, incoming.attempts || 0),
    firstAttemptCorrect: Math.max(current.firstAttemptCorrect || 0, incoming.firstAttemptCorrect || 0),
    successDays: [...new Set([...(current.successDays || []), ...(incoming.successDays || [])])].sort((a, b) => a - b).slice(-12),
    itemKeys: [...new Set([...(current.itemKeys || []), ...(incoming.itemKeys || [])])].slice(-24),
    lastPresentedDate: Math.max(current.lastPresentedDate || 0, incoming.lastPresentedDate || 0) || null,
    nextDue: Number.isFinite(nextDue) ? nextDue : null
  }
}

function currentWritingUnit(grade, legacyUnit) {
  const match = String(legacyUnit).match(/^writing:\d+:(hiragana|katakana|kanji)$/)
  if (!match) return legacyUnit.startsWith(`writing:${grade}:`) ? legacyUnit : null
  const first = (WRITING_GROUPS_BY_GRADE[Number(grade)] || []).find((group) => group.id.startsWith(`${match[1]}-`))
  return first ? `writing:${grade}:${first.id}` : null
}

function rebuildWritingStats(unitStats, writingStats) {
  const next = { ...unitStats }
  for (const [key, stat] of Object.entries(writingStats || {})) {
    const separator = key.indexOf(':')
    if (separator < 0) continue
    const grade = Number(key.slice(0, separator))
    const target = key.slice(separator + 1)
    const group = (WRITING_GROUPS_BY_GRADE[grade] || []).find((entry) => entry.chars.includes(target))
    if (!group) continue
    const unitId = `writing:${grade}:${group.id}`
    const byGrade = next[grade] || {}
    const byDomain = byGrade.kaku || {}
    const previous = byDomain[unitId] || { attempts: 0, firstAttemptCorrect: 0, successDays: [], itemKeys: [] }
    const successDays = stat.successDays || []
    const contribution = {
      attempts: (previous.attempts || 0) + (stat.attempts || 0),
      firstAttemptCorrect: (previous.firstAttemptCorrect || 0) + Math.min(stat.attempts || 0, successDays.length),
      successDays: [...new Set([...(previous.successDays || []), ...successDays])].sort((a, b) => a - b).slice(-12),
      itemKeys: successDays.length ? [...new Set([...(previous.itemKeys || []), `char:${grade}:${target}`])].slice(-24) : previous.itemKeys || [],
      lastPresentedDate: Math.max(previous.lastPresentedDate || 0, ...successDays, 0) || null,
      nextDue: successDays.length ? Math.max(...successDays) + 1 : previous.nextDue ?? null
    }
    next[grade] = { ...byGrade, kaku: { ...byDomain, [unitId]: { ...previous, ...contribution } } }
  }
  return next
}

// v15: 三層ID・書字グループ・英語一本化へ移す。プロフィールや報酬には触れない。
export function migrateLearningProgress(saved = {}) {
  if ((saved.unitProgressVersion || 0) >= UNIT_PROGRESS_VERSION) return saved

  const reviewQuestions = {}
  for (const [domainId, byKey] of Object.entries(saved.reviewQuestions || {})) {
    if (domainId === 'english' || domainId === 'suuji') continue
    for (const [oldKey, snapshot] of Object.entries(byKey || {})) {
      const newKey = normalizedKnowledgeId(domainId, oldKey, snapshot, saved.grade)
      if (!newKey) continue
      reviewQuestions[domainId] ||= {}
      reviewQuestions[domainId][newKey] = { ...withQuestionIds(snapshot), reviewKey: newKey }
    }
  }

  const srs = {}
  for (const [domainId, byKey] of Object.entries(saved.srs || {})) {
    if (domainId === 'english') continue
    for (const [oldKey, entry] of Object.entries(byKey || {})) {
      const snapshot = saved.reviewQuestions?.[domainId]?.[oldKey]
      const newKey = normalizedKnowledgeId(domainId, oldKey, snapshot, saved.grade)
      if (!newKey) continue
      srs[domainId] ||= {}
      srs[domainId][newKey] = mergeSrsEntry(srs[domainId][newKey], entry)
    }
  }

  let unitStats = {}
  for (const [grade, byDomain] of Object.entries(saved.unitStats || {})) {
    unitStats[grade] = {}
    for (const [domainId, byUnit] of Object.entries(byDomain || {})) {
      for (const [legacyUnit, stat] of Object.entries(byUnit || {})) {
        let unitId = legacyUnit
        if (domainId === 'kaku') unitId = currentWritingUnit(grade, legacyUnit)
        if (!unitId) continue
        const itemKeys = (stat.itemKeys || []).map((oldKey) => normalizedKnowledgeId(domainId, oldKey, saved.reviewQuestions?.[domainId]?.[oldKey], grade)).filter(Boolean)
        const migrated = { ...stat, itemKeys: [...new Set(itemKeys)] }
        if (domainId === 'suuji') migrated.itemRequirement = 1
        unitStats[grade][domainId] ||= {}
        unitStats[grade][domainId][unitId] = mergeUnitStat(unitStats[grade][domainId][unitId], migrated)
      }
    }
  }
  unitStats = rebuildWritingStats(unitStats, saved.writingStats)

  return { ...saved, unitStats, srs, reviewQuestions, unitProgressVersion: UNIT_PROGRESS_VERSION }
}
