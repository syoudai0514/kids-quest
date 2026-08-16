import { MONSTERS } from '../monsters.js'

const LEGACY_DEX_COUNT = 50
const EXPANSION_DEX_COUNT = 950

function family(id, memberIds, source) {
  return Object.freeze({ id, memberIds: Object.freeze([...memberIds]), source })
}

// The first art pilot keeps every evolution line inside dex 51-100, so WP2
// can judge complete silhouettes instead of drawing orphan stages.
const PILOT_THREE_STAGE = [
  ['family-core-orbit', ['g042', 'g043', 'g044']],
  ['family-sky-metamorph', ['g045', 'g046', 'g047']],
  ['family-pilot-aurora-shell', ['g054', 'g055', 'g056']],
  ['family-pilot-tidal-seed', ['g057', 'g058', 'g059']],
  ['family-pilot-shadow-wing', ['g060', 'g061', 'g062']],
  ['family-pilot-flare-gel', ['g063', 'g064', 'g065']],
  ['family-pilot-bloom-orbit', ['g066', 'g067', 'g068']],
  ['family-pilot-snow-flight', ['g069', 'g070', 'g071']],
  ['family-pilot-moon-core', ['g072', 'g073', 'g074']],
  ['family-pilot-river-spirit', ['g075', 'g076', 'g077']]
]

const PILOT_TWO_STAGE = [
  ['family-pilot-stone-spark', ['g078', 'g079']],
  ['family-pilot-fire-sky', ['g080', 'g081']],
  ['family-pilot-dino-flower', ['g082', 'g083']],
  ['family-pilot-galaxy-sand', ['g084', 'g085']],
  ['family-pilot-green-snow', ['g086', 'g087']]
]

const PILOT_STANDALONE = [
  ['family-galaxy-pulse', ['g048']],
  ['family-ancient-sand', ['g049']],
  ['family-green-beacon', ['g050']],
  ['family-snow-bastion', ['g051']],
  ['family-rainbow-mirage', ['g052']],
  ['family-cosmic-wing', ['g053']],
  ['family-pilot-cosmic-drop', ['g088']],
  ['family-pilot-star-dino', ['g089']],
  ['family-pilot-moon-lantern', ['g090']],
  ['family-pilot-solar-crag', ['g091']]
]

function buildLegacyFamilies() {
  return MONSTERS.slice(0, LEGACY_DEX_COUNT).map((monster) =>
    family(`legacy-${monster.id}`, [monster.id], 'legacy-1-50')
  )
}

function buildPilotFamilies() {
  return [...PILOT_THREE_STAGE, ...PILOT_TWO_STAGE, ...PILOT_STANDALONE].map(
    ([id, members]) => family(id, members, 'pilot-51-100')
  )
}

// Dex 101-1000 is split into ten 90-entry regions.  Each region contributes
// exactly 19 three-stage, 12 two-stage and 9 standalone lines.  A coprime
// stride deliberately keeps family membership from being inferred from dex
// adjacency; the generated explicit references are the source of truth.
function buildExpansionFamilies() {
  const ids = MONSTERS.slice(100).map((monster) => monster.id)
  const plans = []

  for (let region = 0; region < 10; region++) {
    const regionIds = ids.slice(region * 90, region * 90 + 90)
    const order = Array.from({ length: 90 }, (_, index) => regionIds[(index * 37) % 90])
    const dexOrder = new Map(regionIds.map((id, index) => [id, index]))
    let cursor = 0
    const take = (count) => {
      const members = order.slice(cursor, cursor + count)
      cursor += count
      return members.sort((a, b) => dexOrder.get(a) - dexOrder.get(b))
    }

    for (let index = 0; index < 19; index++) {
      plans.push(family(
        `family-r${String(region + 1).padStart(2, '0')}-three-${String(index + 1).padStart(2, '0')}`,
        take(3),
        'expansion-101-1000'
      ))
    }
    for (let index = 0; index < 12; index++) {
      plans.push(family(
        `family-r${String(region + 1).padStart(2, '0')}-two-${String(index + 1).padStart(2, '0')}`,
        take(2),
        'expansion-101-1000'
      ))
    }
    for (let index = 0; index < 9; index++) {
      plans.push(family(
        `family-r${String(region + 1).padStart(2, '0')}-solo-${String(index + 1).padStart(2, '0')}`,
        take(1),
        'expansion-101-1000'
      ))
    }
  }

  return plans
}

export const FAMILY_PLANS = Object.freeze([
  ...buildLegacyFamilies(),
  ...buildPilotFamilies(),
  ...buildExpansionFamilies()
])

export const FAMILY_BY_MONSTER_ID = Object.freeze(Object.fromEntries(
  FAMILY_PLANS.flatMap((plan) => plan.memberIds.map((monsterId, index) => [
    monsterId,
    Object.freeze({
      familyId: plan.id,
      stage: index + 1,
      maxStage: plan.memberIds.length,
      evolvesFrom: index === 0 ? null : plan.memberIds[index - 1],
      evolvesTo: index === plan.memberIds.length - 1 ? [] : [plan.memberIds[index + 1]],
      source: plan.source
    })
  ]))
))

export const FAMILY_ALLOCATION = Object.freeze({
  legacyStandalone: LEGACY_DEX_COUNT,
  expansionDexCount: EXPANSION_DEX_COUNT,
  expansionThreeStageFamilies: 200,
  expansionTwoStageFamilies: 125,
  expansionStandalone: 100
})
