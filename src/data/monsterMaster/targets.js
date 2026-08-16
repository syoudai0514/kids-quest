import { MONSTERS } from '../monsters.js'
import { FAMILY_BY_MONSTER_ID } from './familyPlan.js'

const DEX_BY_ID = Object.freeze(Object.fromEntries(MONSTERS.map((monster, index) => [monster.id, index + 1])))

const FINAL_FORM_IDS = MONSTERS
  .filter((monster) => DEX_BY_ID[monster.id] >= 51)
  .filter((monster) => {
    const family = FAMILY_BY_MONSTER_ID[monster.id]
    return family.stage === family.maxStage
  })
  .map((monster) => monster.id)

// The vertical slice has explicit assignments: g052 is the only awakening
// target and g053 is the only boss/giga target in dex 51-62.  Global sampling
// starts after that range so it cannot silently add extra special forms.
const POST_VERTICAL_FINAL_IDS = FINAL_FORM_IDS.filter((id) => DEX_BY_ID[id] >= 63)

function spreadSelect(source, count) {
  if (count <= 0) return []
  if (source.length < count) throw new Error(`Not enough target candidates: ${source.length}/${count}`)
  const selected = []
  const used = new Set()
  for (let index = 0; index < count; index++) {
    let sourceIndex = Math.floor(index * source.length / count)
    while (used.has(sourceIndex)) sourceIndex = (sourceIndex + 1) % source.length
    used.add(sourceIndex)
    selected.push(source[sourceIndex])
  }
  return selected
}

function without(source, excluded) {
  const blocked = new Set(excluded)
  return source.filter((id) => !blocked.has(id))
}

export const BOSS_IDS = Object.freeze([
  'g053',
  ...spreadSelect(POST_VERTICAL_FINAL_IDS, 35)
])

const gigaBosses = BOSS_IDS.slice(1, 12)
const gigaNonBosses = spreadSelect(without(POST_VERTICAL_FINAL_IDS, BOSS_IDS), 12)
export const GIGA_IDS = Object.freeze(['g053', ...gigaBosses, ...gigaNonBosses])

export const AWAKENING_IDS = Object.freeze([
  'g052',
  ...spreadSelect(without(POST_VERTICAL_FINAL_IDS, GIGA_IDS), 59)
])

const requiredSignatureIds = [
  'g044',
  'g047',
  'g051',
  'g052',
  'g053',
  ...BOSS_IDS,
  ...GIGA_IDS,
  ...AWAKENING_IDS
]
const signatureSeed = [...new Set(requiredSignatureIds)]
export const SIGNATURE_HOLDER_IDS = Object.freeze([
  ...signatureSeed,
  ...spreadSelect(without(POST_VERTICAL_FINAL_IDS, signatureSeed), 120 - signatureSeed.length)
])

export const BOSS_TARGETS = Object.freeze(Object.fromEntries(BOSS_IDS.map((id, index) => {
  if (index < 9) {
    return [id, Object.freeze({ tier: 'planet', campaignTag: `planet-${index + 1}` })]
  }
  if (index < 27) {
    return [id, Object.freeze({ tier: 'planet', campaignTag: `sector-reserved-${index - 8}` })]
  }
  if (index < 32) {
    return [id, Object.freeze({ tier: 'grand', campaignTag: `grand-${index - 26}` })]
  }
  return [id, Object.freeze({ tier: 'special', campaignTag: `special-${index - 31}` })]
})))

export const MONSTER_TARGET_COUNTS = Object.freeze({
  awakening: 60,
  giga: 24,
  boss: 36,
  signatureHolders: 120
})
