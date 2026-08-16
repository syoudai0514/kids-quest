import { MONSTER_MASTER_BY_ID } from './monsterMaster/monsterMaster.js'

// The release ships generated full-size art only for the growth pilot.
// Every other catalogue entry deliberately keeps its existing in-app artwork,
// so opening the 1,000-slot catalogue never creates broken image requests.
export const RELEASED_MONSTER_FULL_IDS = Object.freeze(new Set([
  'g042', 'g043', 'g044', 'g045', 'g046', 'g047',
  'g048', 'g049', 'g050', 'g051', 'g052', 'g053'
]))

export function releasedMonsterFullAsset(monsterId) {
  if (!RELEASED_MONSTER_FULL_IDS.has(monsterId)) return null
  return MONSTER_MASTER_BY_ID[monsterId]?.assets?.full || null
}

export function withReleasedMonsterAsset(monster) {
  if (!monster) return monster
  return {
    ...monster,
    heroAsset: releasedMonsterFullAsset(monster.id) || monster.heroAsset
  }
}
