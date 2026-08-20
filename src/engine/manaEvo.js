// ManaEvo の保存互換・ゲーム状態の正本。UI とは分離し、再読込しても
// チケット、遭遇、地域進行が二重に変化しないよう純粋関数にしている。
import { BATTLE_TICKET_TTL_DAYS, dateKeyAfter, normalizeBattleTickets, spendBattleTicket } from './battleTickets.js'

export const MANA_EVO_STORAGE_KEY = 'mana-evo:v1'
export const LEGACY_STORAGE_KEY = 'hoshizora-quest:v1'
export const ADVENTURE_REGIONS = ['region-1', 'region-2', 'region-3', 'region-4']

export function migrateManaEvoState(saved, today) {
  if (!saved || typeof saved !== 'object') return saved
  const battle = normalizeBattleTickets(saved.battle || {}, today)
  return {
    ...saved,
    version: Math.max(Number(saved.version) || 0, 4),
    brandMigrationVersion: 1,
    battle: { ...battle, encounters: battle.encounters || {}, consumedResolutionIds: battle.consumedResolutionIds || [] },
    adventure: {
      unlockedRegions: ['region-1', ...(saved.adventure?.unlockedRegions || []).filter((id) => ADVENTURE_REGIONS.includes(id) && id !== 'region-1')],
      areaBossProgress: saved.adventure?.areaBossProgress || {},
      explorationPityMissesByArea: saved.adventure?.explorationPityMissesByArea || {},
      explorationPoints: Math.max(0, Number(saved.adventure?.explorationPoints) || 0),
      inventory: saved.adventure?.inventory || {},
      growthShards: Math.max(0, Number(saved.adventure?.growthShards) || 0)
    }
  }
}

export function beginEncounter(state, encounter) {
  const current = state.battle?.encounters?.active
  if (current && current.status !== 'RESOLVED') return state
  return { ...state, battle: { ...state.battle, encounters: { ...(state.battle?.encounters || {}), active: { ...encounter, status: 'ENCOUNTERED', throws: 0, ticketConsumed: false } } } }
}

export function leaveEncounter(state) { return state }
export function loseEncounter(state) { return state }
export function fleeEncounter(state) { return state }

export function winEncounter(state, today, resolutionId) {
  const active = state.battle?.encounters?.active
  if (!active || active.status === 'RESOLVED') return state
  const used = state.battle?.consumedResolutionIds || []
  if (used.includes(resolutionId)) return state
  const battle = spendBattleTicket(state.battle, today)
  return { ...state, battle: { ...battle, encounters: { ...battle.encounters, active: { ...active, status: 'CAPTURE', ticketConsumed: true, battleResolutionId: resolutionId } }, consumedResolutionIds: [...used, resolutionId].slice(-100) } }
}

export function resolveCapture(state, { success }) {
  const active = state.battle?.encounters?.active
  if (!active || active.status !== 'CAPTURE') return state
  const throws = active.throws + 1
  if (!success && throws < 3) return { ...state, battle: { ...state.battle, encounters: { ...state.battle.encounters, active: { ...active, throws } } } }
  return { ...state, battle: { ...state.battle, encounters: { ...state.battle.encounters, active: { ...active, throws, status: 'RESOLVED' } } } }
}

export function canEnterRegion(state, regionId) { return (state.adventure?.unlockedRegions || ['region-1']).includes(regionId) }
export function addBossProgress(state, regionId, { points = 0, skillId } = {}) {
  if (!canEnterRegion(state, regionId)) return state
  const all = state.adventure?.areaBossProgress || {}
  const current = all[regionId] || { points: 0, uniqueSkillIds: [], bossDefeated: false }
  const uniqueSkillIds = skillId && !current.uniqueSkillIds.includes(skillId) ? [...current.uniqueSkillIds, skillId] : current.uniqueSkillIds
  return { ...state, adventure: { ...state.adventure, areaBossProgress: { ...all, [regionId]: { ...current, points: current.points + Math.max(0, points), uniqueSkillIds } } } }
}
export function canChallengeBoss(state, regionId) { const p = state.adventure?.areaBossProgress?.[regionId] || {}; return (p.points || 0) >= 12 && (p.uniqueSkillIds || []).length >= 2 }
export function defeatBoss(state, regionId) {
  if (!canChallengeBoss(state, regionId)) return state
  const index = ADVENTURE_REGIONS.indexOf(regionId)
  const next = ADVENTURE_REGIONS[index + 1]
  const unlockedRegions = next && !canEnterRegion(state, next) ? [...state.adventure.unlockedRegions, next] : state.adventure.unlockedRegions
  return { ...state, adventure: { ...state.adventure, unlockedRegions, areaBossProgress: { ...state.adventure.areaBossProgress, [regionId]: { ...state.adventure.areaBossProgress[regionId], bossDefeated: true }, ...(next ? { [next]: state.adventure.areaBossProgress[next] || { points: 0, uniqueSkillIds: [], bossDefeated: false } } : {}) } } }
}

export function explore(state, regionId, { gotEvolutionItem = false, pityChoice = false } = {}) {
  if (!canEnterRegion(state, regionId) || (state.adventure?.explorationPoints || 0) < 5) return state
  const misses = state.adventure.explorationPityMissesByArea?.[regionId] || 0
  const usedPityChoice = pityChoice && misses >= 5
  const nextMisses = gotEvolutionItem || usedPityChoice ? 0 : misses + 1
  return { ...state, adventure: { ...state.adventure, explorationPoints: state.adventure.explorationPoints - 5, explorationPityMissesByArea: { ...state.adventure.explorationPityMissesByArea, [regionId]: nextMisses } } }
}

export function transformedHp({ currentHp, maxHp, kind, ending = false }) {
  const multiplier = kind === 'burst' ? (ending ? 1 : 2) : (ending ? 1 : 1.35)
  const fromMultiplier = kind === 'burst' ? (ending ? 2 : 1) : (ending ? 1.35 : 1)
  const nextMaxHp = Math.round(maxHp * multiplier / fromMultiplier)
  return { maxHp: nextMaxHp, currentHp: currentHp <= 0 ? 0 : Math.round((currentHp / maxHp) * nextMaxHp) }
}

export const manaEvoTicketExpiry = (today) => dateKeyAfter(today, BATTLE_TICKET_TTL_DAYS)
