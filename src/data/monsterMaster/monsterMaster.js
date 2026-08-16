import { MONSTERS } from '../monsters.js'
import { typeOfElement } from '../../engine/battle.js'
import { BATTLE_TYPES } from './schema.js'
import { FAMILY_BY_MONSTER_ID } from './familyPlan.js'
import {
  AWAKENING_IDS,
  BOSS_IDS,
  BOSS_TARGETS,
  GIGA_IDS,
  SIGNATURE_HOLDER_IDS
} from './targets.js'
import { SHARED_MOVE_IDS_BY_TYPE } from './moves.js'

const awakeningSet = new Set(AWAKENING_IDS)
const gigaSet = new Set(GIGA_IDS)
const bossSet = new Set(BOSS_IDS)
const signatureSet = new Set(SIGNATURE_HOLDER_IDS)

const ROLE_BY_DEX = ['balanced', 'attacker', 'guard', 'support', 'healer', 'control']
const PILOT_ROLE_OVERRIDES = Object.freeze({
  g042: 'balanced',
  g043: 'guard',
  g044: 'control',
  g045: 'attacker',
  g046: 'support',
  g047: 'attacker',
  g048: 'healer',
  g049: 'attacker',
  g050: 'support',
  g051: 'guard',
  g052: 'control',
  g053: 'attacker'
})

const ROLE_MOVE_INDEX = Object.freeze({
  attacker: 3,
  guard: 8,
  healer: 9,
  support: 10,
  control: 11,
  balanced: 7
})

const STAT_WEIGHTS = Object.freeze({
  attacker: [0.28, 0.38, 0.18, 0.16],
  guard: [0.34, 0.20, 0.34, 0.12],
  healer: [0.34, 0.18, 0.28, 0.20],
  support: [0.30, 0.22, 0.24, 0.24],
  control: [0.28, 0.24, 0.22, 0.26],
  balanced: [0.28, 0.26, 0.24, 0.22]
})

function evolutionCondition(family) {
  if (!family.evolvesTo.length) return null
  if (family.maxStage === 2) {
    return Object.freeze({ minLevel: 12, minTrainedDays: 7, minSubjectCount: 3 })
  }
  if (family.stage === 1) {
    return Object.freeze({ minLevel: 8, minTrainedDays: 3, minSubjectCount: 2 })
  }
  return Object.freeze({
    minLevel: 20,
    minTrainedDays: 14,
    minSubjectCount: 4,
    requiredWinTag: 'elite-win'
  })
}

function rarityFor(monsterId, dexNo) {
  if (bossSet.has(monsterId)) return 'legend'
  if (gigaSet.has(monsterId) || awakeningSet.has(monsterId)) return 'epic'
  if (dexNo % 11 === 0) return 'rare'
  return 'common'
}

function statBudgetFor(rarity) {
  return { common: 240, rare: 248, epic: 256, legend: 264 }[rarity]
}

function statsFor(role, statBudget) {
  const weights = STAT_WEIGHTS[role]
  const hp = Math.floor(statBudget * weights[0])
  const attack = Math.floor(statBudget * weights[1])
  const guard = Math.floor(statBudget * weights[2])
  const speed = statBudget - hp - attack - guard
  return Object.freeze({ hp, attack, guard, speed })
}

function learnsetFor(monsterId, battleType, role) {
  const typeOrder = [battleType, ...BATTLE_TYPES.filter((type) => type !== battleType)]
  const moves = [
    { level: 1, moveId: SHARED_MOVE_IDS_BY_TYPE[typeOrder[0]][0] },
    { level: 1, moveId: SHARED_MOVE_IDS_BY_TYPE[typeOrder[1]][1] },
    { level: 5, moveId: SHARED_MOVE_IDS_BY_TYPE[typeOrder[2]][2] },
    { level: 8, moveId: SHARED_MOVE_IDS_BY_TYPE[typeOrder[0]][ROLE_MOVE_INDEX[role]] }
  ]
  if (signatureSet.has(monsterId)) moves.push({ level: 12, moveId: `signature-${monsterId}` })
  return Object.freeze(moves.map((move) => Object.freeze(move)))
}

function formRefs(monsterId) {
  const forms = {}
  if (awakeningSet.has(monsterId)) {
    forms.awakening = Object.freeze({
      id: `awakening-${monsterId}`,
      kind: 'awakening',
      minLevel: 30,
      minTrainedDays: 30,
      minSubjectCount: 5,
      requiredWinTag: 'boss-awakening-gate',
      durationTurns: null,
      moveId: `signature-${monsterId}`,
      asset: `/monsters/forms/${monsterId}-awakening.webp`
    })
  }
  if (gigaSet.has(monsterId)) {
    forms.giga = Object.freeze({
      id: `giga-${monsterId}`,
      kind: 'giga',
      minLevel: 40,
      minTrainedDays: 60,
      minSubjectCount: 5,
      requiredWinTag: bossSet.has(monsterId) ? `boss-${monsterId}` : 'boss-giga-gate',
      durationTurns: 3,
      moveId: bossSet.has(monsterId) ? `boss-${monsterId}` : `signature-${monsterId}`,
      asset: `/monsters/forms/${monsterId}-giga.webp`
    })
  }
  return Object.freeze(forms)
}

function assetsFor(monster, dexNo) {
  if (dexNo <= 50 && monster.heroAsset) {
    return Object.freeze({ thumb: monster.heroAsset, full: monster.heroAsset })
  }
  return Object.freeze({
    thumb: `/monsters/thumb/${monster.id}.webp`,
    full: `/monsters/full/${monster.id}.webp`
  })
}

function encounterTagsFor(monster, dexNo, family) {
  const tags = [monster.role, family.source]
  if (dexNo >= 51) tags.push(`region-${Math.floor((dexNo - 51) / 90) + 1}`)
  if (monster.id === 'g051' || monster.id === 'g052' || dexNo % 13 === 0) tags.push('elite-candidate')
  const boss = BOSS_TARGETS[monster.id]
  if (boss) tags.push('boss', boss.campaignTag)
  return Object.freeze([...new Set(tags)])
}

export const MONSTER_MASTER_V2 = Object.freeze(MONSTERS.map((monster, index) => {
  const dexNo = index + 1
  const family = FAMILY_BY_MONSTER_ID[monster.id]
  const role = PILOT_ROLE_OVERRIDES[monster.id] ?? ROLE_BY_DEX[(dexNo - 1) % ROLE_BY_DEX.length]
  const rarity = rarityFor(monster.id, dexNo)
  const statBudget = statBudgetFor(rarity)
  const battleType = typeOfElement(monster.element)
  const boss = BOSS_TARGETS[monster.id]

  return Object.freeze({
    id: monster.id,
    dexNo,
    name: monster.name,
    description: monster.desc,
    element: monster.element,
    battleType,
    familyId: family.familyId,
    stage: family.stage,
    maxStage: family.maxStage,
    evolvesFrom: family.evolvesFrom,
    evolvesTo: Object.freeze([...family.evolvesTo]),
    evolution: evolutionCondition(family),
    rarity,
    role,
    baseStats: statsFor(role, statBudget),
    statBudget,
    growthRole: role,
    learnset: learnsetFor(monster.id, battleType, role),
    ...(signatureSet.has(monster.id) ? { signatureMoveId: `signature-${monster.id}` } : {}),
    ...(boss ? { bossMoveId: `boss-${monster.id}` } : {}),
    encounterTags: encounterTagsFor(monster, dexNo, family),
    bossTier: boss?.tier ?? 'none',
    forms: formRefs(monster.id),
    assets: assetsFor(monster, dexNo)
  })
}))

export const MONSTER_MASTER_BY_ID = Object.freeze(Object.fromEntries(
  MONSTER_MASTER_V2.map((monster) => [monster.id, monster])
))

export const MONSTER_INDEX_V2 = Object.freeze(MONSTER_MASTER_V2.map((monster) => Object.freeze({
  id: monster.id,
  dexNo: monster.dexNo,
  name: monster.name,
  element: monster.element,
  battleType: monster.battleType,
  familyId: monster.familyId,
  stage: monster.stage,
  maxStage: monster.maxStage,
  thumb: monster.assets.thumb
})))

export const MONSTER_INDEX_BY_ID = Object.freeze(Object.fromEntries(
  MONSTER_INDEX_V2.map((monster) => [monster.id, monster])
))

export const MONSTER_MASTER_CHUNK_SIZE = 100
export const MONSTER_MASTER_CHUNKS = Object.freeze(Array.from({ length: 10 }, (_, index) => Object.freeze(
  MONSTER_MASTER_V2.slice(index * MONSTER_MASTER_CHUNK_SIZE, (index + 1) * MONSTER_MASTER_CHUNK_SIZE)
)))

export function getMonsterMasterChunk(chunkNumber) {
  return MONSTER_MASTER_CHUNKS[chunkNumber - 1] ?? Object.freeze([])
}

// The compact entry is enough for a safe card/fallback when a detail chunk is
// unavailable offline.  Callers can distinguish it through detailAvailable.
export function getMonsterDetailOrFallback(monsterId, chunkNumber) {
  const detail = getMonsterMasterChunk(chunkNumber).find((monster) => monster.id === monsterId)
  if (detail) return Object.freeze({ detailAvailable: true, monster: detail })
  const compact = MONSTER_INDEX_BY_ID[monsterId]
  return compact
    ? Object.freeze({ detailAvailable: false, monster: compact })
    : Object.freeze({ detailAvailable: false, monster: null })
}
