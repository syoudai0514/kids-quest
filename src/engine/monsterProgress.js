import { MONSTER_BY_ID } from '../data/monsters.js'
import { MONSTER_MASTER_BY_ID } from '../data/monsterMaster/monsterMaster.js'

export const MONSTER_SAVE_VERSION = 4
export const MONSTER_ROSTER_VERSION = 1
export const MAX_PARTY_SIZE = 3
export const PILOT_MONSTER_IDS = Object.freeze(Array.from({ length: 12 }, (_, index) => `g${String(42 + index).padStart(3, '0')}`))

const SUBJECT_BITS = Object.freeze({
  yomu: 1 << 0,
  kaku: 1 << 1,
  suuji: 1 << 2,
  seikatsu: 1 << 3,
  rika: 1 << 4,
  shakai: 1 << 5,
  english: 1 << 6,
  doutoku: 1 << 7
})

const clampInt = (value, min, max) => Math.max(min, Math.min(max, Math.floor(Number(value) || 0)))
const uniqueStrings = (value) => [...new Set((Array.isArray(value) ? value : []).filter((item) => typeof item === 'string' && item))]

export function xpForLevel(level) {
  const safeLevel = clampInt(level, 1, 99)
  return 6 * (safeLevel - 1) ** 2
}

export function companionLevel(xp) {
  return Math.min(99, Math.floor(Math.sqrt(Math.max(0, Number(xp) || 0) / 6)) + 1)
}

export function subjectCount(domainMask = 0) {
  let value = clampInt(domainMask, 0, 0x7fffffff)
  let count = 0
  while (value) {
    count += value & 1
    value >>>= 1
  }
  return count
}

export function companionIdFor(monsterId) {
  return `companion:${monsterId}`
}

function availableMoveIds(monsterId, xp) {
  const master = MONSTER_MASTER_BY_ID[monsterId]
  if (!master) return []
  const level = companionLevel(xp)
  return master.learnset.filter((entry) => entry.level <= level).map((entry) => entry.moveId)
}

function repairedMoveIds(monsterId, xp, selectedMoveIds) {
  const available = availableMoveIds(monsterId, xp)
  const selected = uniqueStrings(selectedMoveIds).filter((id) => available.includes(id)).slice(0, 4)
  for (const id of available) {
    if (selected.length >= Math.min(4, available.length)) break
    if (!selected.includes(id)) selected.push(id)
  }
  return selected
}

export function createCompanion(monsterId, xp = 0, caughtAt = Date.now()) {
  if (!MONSTER_MASTER_BY_ID[monsterId] || !MONSTER_BY_ID[monsterId]) return null
  const safeXp = clampInt(xp, 0, xpForLevel(99))
  return {
    sourceMonsterId: monsterId,
    currentMonsterId: monsterId,
    xp: safeXp,
    learningXp: 0,
    battleXp: 0,
    selectedMoveIds: repairedMoveIds(monsterId, safeXp, []),
    unlockedFormIds: [],
    lastTrainedDay: null,
    trainedDays: 0,
    trainedDayKeys: [],
    domainMask: 0,
    battles: 0,
    wins: 0,
    winTags: [],
    caughtAt: Number.isFinite(caughtAt) ? caughtAt : Date.now()
  }
}

function normalizeCompanion(value, fallbackMonsterId, fallbackXp = 0) {
  const sourceMonsterId = MONSTER_MASTER_BY_ID[value?.sourceMonsterId] ? value.sourceMonsterId : fallbackMonsterId
  const currentMonsterId = MONSTER_MASTER_BY_ID[value?.currentMonsterId] ? value.currentMonsterId : sourceMonsterId
  if (!MONSTER_MASTER_BY_ID[sourceMonsterId] || !MONSTER_BY_ID[sourceMonsterId]) return null
  const xp = clampInt(value?.xp ?? fallbackXp, 0, xpForLevel(99))
  const trainedDayKeys = uniqueStrings(value?.trainedDayKeys).slice(-120)
  return {
    ...createCompanion(sourceMonsterId, xp, value?.caughtAt),
    ...value,
    sourceMonsterId,
    currentMonsterId,
    xp,
    learningXp: clampInt(value?.learningXp, 0, xpForLevel(99)),
    battleXp: clampInt(value?.battleXp, 0, xpForLevel(99)),
    selectedMoveIds: repairedMoveIds(currentMonsterId, xp, value?.selectedMoveIds),
    unlockedFormIds: uniqueStrings(value?.unlockedFormIds),
    trainedDayKeys,
    trainedDays: Math.max(clampInt(value?.trainedDays, 0, 9999), trainedDayKeys.length),
    domainMask: clampInt(value?.domainMask, 0, 0x7fffffff),
    battles: clampInt(value?.battles, 0, Number.MAX_SAFE_INTEGER),
    wins: clampInt(value?.wins, 0, Number.MAX_SAFE_INTEGER),
    winTags: uniqueStrings(value?.winTags)
  }
}

export function normalizeMonsterProgress(saved = {}, partnerId = 'hoshu') {
  const unlocked = uniqueStrings(saved.unlockedMonsters)
  if (!unlocked.includes(partnerId)) unlocked.unshift(partnerId)
  const globalLevel = companionLevel(saved.xp)
  const inheritedOtherXp = xpForLevel(Math.max(1, Math.floor(globalLevel * 0.8)))
  const existing = saved.companions && typeof saved.companions === 'object' ? saved.companions : {}
  const companions = {}

  for (const [companionId, value] of Object.entries(existing)) {
    const normalized = normalizeCompanion(value, value?.sourceMonsterId)
    if (normalized) companions[companionId] = normalized
  }
  for (const monsterId of unlocked) {
    if (!MONSTER_MASTER_BY_ID[monsterId] || Object.values(companions).some((item) => item.sourceMonsterId === monsterId)) continue
    const companionId = companionIdFor(monsterId)
    companions[companionId] = createCompanion(monsterId, monsterId === partnerId ? saved.xp : inheritedOtherXp, saved.createdAt)
  }

  const rosterIds = Object.keys(companions)
  const preferredPartner = rosterIds.find((id) => companions[id].sourceMonsterId === partnerId) || rosterIds[0] || null
  const requestedParty = uniqueStrings(saved.party).filter((id) => companions[id]).slice(0, MAX_PARTY_SIZE)
  const party = [...requestedParty]
  if (preferredPartner && !party.length) party.push(preferredPartner)
  for (const id of rosterIds) {
    if (party.length >= MAX_PARTY_SIZE) break
    if (!party.includes(id)) party.push(id)
  }
  const activeCompanionId = companions[saved.activeCompanionId] && party.includes(saved.activeCompanionId)
    ? saved.activeCompanionId
    : party[0] || null

  const rewardState = saved.monsterRewardState && typeof saved.monsterRewardState === 'object'
    ? saved.monsterRewardState
    : {}
  return {
    ...saved,
    version: MONSTER_SAVE_VERSION,
    monsterRosterVersion: MONSTER_ROSTER_VERSION,
    unlockedMonsters: unlocked,
    companions,
    party,
    activeCompanionId,
    defeatedBossIds: uniqueStrings(saved.defeatedBossIds),
    starGauge: clampInt(saved.starGauge, 0, 100),
    monsterRewardState: {
      day: typeof rewardState.day === 'string' ? rewardState.day : null,
      extraCount: clampInt(rewardState.extraCount, 0, 999),
      subjectIds: uniqueStrings(rewardState.subjectIds),
      keys: uniqueStrings(rewardState.keys).slice(-120)
    }
  }
}

export function activeCompanion(state) {
  return state.companions?.[state.activeCompanionId] || null
}

function updatePartyXp(state, activeXp, reserveXp, source, domainId, dayKey) {
  if (!state.activeCompanionId || activeXp <= 0) return state
  const companions = { ...state.companions }
  for (const companionId of state.party || []) {
    const companion = companions[companionId]
    if (!companion) continue
    const gain = companionId === state.activeCompanionId ? activeXp : reserveXp
    if (gain <= 0) continue
    const trainingDay = source === 'learning' && dayKey && !companion.trainedDayKeys.includes(dayKey)
    const trainedDayKeys = trainingDay ? [...companion.trainedDayKeys, dayKey].slice(-120) : companion.trainedDayKeys
    const domainBit = source === 'learning' ? (SUBJECT_BITS[domainId] || 0) : 0
    const nextXp = Math.min(xpForLevel(99), companion.xp + gain)
    companions[companionId] = {
      ...companion,
      xp: nextXp,
      learningXp: companion.learningXp + (source === 'learning' ? gain : 0),
      battleXp: companion.battleXp + (source === 'battle' ? gain : 0),
      lastTrainedDay: source === 'learning' && dayKey ? dayKey : companion.lastTrainedDay,
      trainedDayKeys,
      trainedDays: Math.max(companion.trainedDays, trainedDayKeys.length),
      domainMask: companion.domainMask | domainBit,
      selectedMoveIds: repairedMoveIds(companion.currentMonsterId, nextXp, companion.selectedMoveIds)
    }
  }
  return { ...state, companions }
}

function rewardStateForDay(state, dayKey) {
  const current = state.monsterRewardState || {}
  return current.day === dayKey
    ? current
    : { day: dayKey, extraCount: 0, subjectIds: [], keys: [] }
}

export function grantLearningAnswerXp(state, { xpGain, domainId, dayKey }) {
  const gain = clampInt(xpGain, 0, 20)
  return updatePartyXp(state, gain, Math.floor(gain * 0.7), 'learning', domainId, dayKey)
}

export function grantLearningTaskXp(state, { kind, domainId, dayKey, correctCount = 0, suspicious = false, rewardKey }) {
  const rewardState = rewardStateForDay(state, dayKey)
  if (suspicious || (rewardKey && rewardState.keys.includes(rewardKey))) {
    return { ...state, monsterRewardState: rewardState }
  }
  const isExtra = ['extra', 'okawari', 'free'].includes(kind)
  const extraCount = rewardState.extraCount + (isExtra ? 1 : 0)
  const rate = !isExtra || extraCount <= 3 ? 1 : extraCount <= 6 ? 0.6 : 0.25
  const firstSubject = domainId && !rewardState.subjectIds.includes(domainId)
  // 通常問題の正解XPは ANSWER で即時付与。追加問題は不正判定後まで
  // 保留しているので、合格したタスクだけ正解数×2をここで精算する。
  const deferredAnswerXp = isExtra ? clampInt(correctCount, 0, 20) * 2 : 0
  const activeXp = Math.max(1, Math.floor((6 + deferredAnswerXp + (firstSubject ? 2 : 0)) * rate))
  const next = updatePartyXp(state, activeXp, Math.floor(activeXp * 0.7), 'learning', domainId, dayKey)
  return {
    ...next,
    starGauge: Math.min(100, (state.starGauge || 0) + Math.min(20, clampInt(correctCount, 0, 20) * 4 + 4)),
    monsterRewardState: {
      day: dayKey,
      extraCount,
      subjectIds: firstSubject ? [...rewardState.subjectIds, domainId] : rewardState.subjectIds,
      keys: rewardKey ? [...rewardState.keys, rewardKey].slice(-120) : rewardState.keys
    }
  }
}

export function catchCompanion(state, monsterId) {
  if (!MONSTER_MASTER_BY_ID[monsterId] || Object.values(state.companions || {}).some((item) => item.sourceMonsterId === monsterId)) return state
  let companionId = companionIdFor(monsterId)
  let suffix = 2
  while (state.companions?.[companionId]) companionId = `${companionId}:${suffix++}`
  const companions = { ...state.companions, [companionId]: createCompanion(monsterId) }
  const party = state.party.length < MAX_PARTY_SIZE ? [...state.party, companionId] : state.party
  return { ...state, companions, party }
}

export function setActiveCompanion(state, companionId) {
  if (!state.companions?.[companionId]) return state
  const party = state.party.includes(companionId)
    ? state.party
    : state.party.length < MAX_PARTY_SIZE
      ? [...state.party, companionId]
      : [companionId, ...state.party.slice(0, MAX_PARTY_SIZE - 1)]
  return { ...state, party, activeCompanionId: companionId }
}

export function togglePartyCompanion(state, companionId) {
  if (!state.companions?.[companionId]) return state
  if (state.party.includes(companionId)) {
    if (state.party.length <= 1) return state
    const party = state.party.filter((id) => id !== companionId)
    return { ...state, party, activeCompanionId: state.activeCompanionId === companionId ? party[0] : state.activeCompanionId }
  }
  if (state.party.length >= MAX_PARTY_SIZE) return state
  return { ...state, party: [...state.party, companionId] }
}

function hasRequiredWin(state, companion, requiredWinTag) {
  if (!requiredWinTag) return true
  if (companion.winTags.includes(requiredWinTag)) return true
  if (requiredWinTag === 'boss-awakening-gate' || requiredWinTag === 'boss-giga-gate') return state.defeatedBossIds.length > 0
  if (requiredWinTag.startsWith('boss-')) return state.defeatedBossIds.includes(requiredWinTag.slice(5))
  return false
}

function requirementStatus(state, companion, requirement) {
  const missing = []
  const level = companionLevel(companion.xp)
  if (level < requirement.minLevel) missing.push(`Lv.${requirement.minLevel}`)
  if (companion.trainedDays < requirement.minTrainedDays) missing.push(`あと${requirement.minTrainedDays - companion.trainedDays}にち`)
  const subjects = subjectCount(companion.domainMask)
  if (subjects < requirement.minSubjectCount) missing.push(`あと${requirement.minSubjectCount - subjects}きょうか`)
  if (!hasRequiredWin(state, companion, requirement.requiredWinTag)) missing.push('ボスを たおそう')
  return { ready: missing.length === 0, missing, level, subjects }
}

export function evolutionStatus(state, companionId) {
  const companion = state.companions?.[companionId]
  const master = companion && MONSTER_MASTER_BY_ID[companion.currentMonsterId]
  if (!companion || !master?.evolution || !master.evolvesTo.length) return { available: false, ready: false, missing: [] }
  return { available: true, nextMonsterId: master.evolvesTo[0], ...requirementStatus(state, companion, master.evolution) }
}

export function evolveCompanion(state, companionId) {
  const status = evolutionStatus(state, companionId)
  if (!status.ready) return state
  const companion = state.companions[companionId]
  const evolved = {
    ...companion,
    currentMonsterId: status.nextMonsterId,
    selectedMoveIds: repairedMoveIds(status.nextMonsterId, companion.xp, companion.selectedMoveIds)
  }
  return {
    ...state,
    companions: { ...state.companions, [companionId]: evolved },
    unlockedMonsters: state.unlockedMonsters.includes(status.nextMonsterId)
      ? state.unlockedMonsters
      : [...state.unlockedMonsters, status.nextMonsterId]
  }
}

export function formStatus(state, companionId, kind) {
  const companion = state.companions?.[companionId]
  const form = companion && MONSTER_MASTER_BY_ID[companion.currentMonsterId]?.forms?.[kind]
  if (!companion || !form) return { available: false, ready: false, unlocked: false, missing: [] }
  const status = requirementStatus(state, companion, form)
  const unlocked = companion.unlockedFormIds.includes(form.id)
  return { available: true, form, unlocked, ...status }
}

export function unlockForm(state, companionId, kind) {
  const status = formStatus(state, companionId, kind)
  if (!status.ready || status.unlocked) return state
  const companion = state.companions[companionId]
  return {
    ...state,
    companions: {
      ...state.companions,
      [companionId]: { ...companion, unlockedFormIds: [...companion.unlockedFormIds, status.form.id] }
    }
  }
}

export function consumeStarGauge(state) {
  return state.starGauge >= 100 ? { ...state, starGauge: 0 } : state
}

export function grantBattleResult(state, { won, enemyId, elite = false }) {
  let next = updatePartyXp(state, won ? 3 : 1, won ? 1 : 0, 'battle', null, null)
  const companions = { ...next.companions }
  for (const companionId of next.party || []) {
    const companion = companions[companionId]
    if (!companion) continue
    const winTags = [...companion.winTags]
    if (won && elite && !winTags.includes('elite-win')) winTags.push('elite-win')
    if (won && enemyId && !winTags.includes(`boss-${enemyId}`)) winTags.push(`boss-${enemyId}`)
    companions[companionId] = {
      ...companion,
      battles: companion.battles + 1,
      wins: companion.wins + (won ? 1 : 0),
      winTags
    }
  }
  const isBoss = won && MONSTER_MASTER_BY_ID[enemyId]?.bossTier !== 'none'
  next = {
    ...next,
    companions,
    defeatedBossIds: isBoss && !next.defeatedBossIds.includes(enemyId)
      ? [...next.defeatedBossIds, enemyId]
      : next.defeatedBossIds
  }
  return next
}

export function companionForMonster(state, monsterId) {
  return Object.entries(state.companions || {}).find(([, companion]) => companion.currentMonsterId === monsterId || companion.sourceMonsterId === monsterId) || null
}
