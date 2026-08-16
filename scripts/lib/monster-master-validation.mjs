import { createHash } from 'node:crypto'

const STAT_BUDGET_BY_RARITY = Object.freeze({
  common: 240,
  rare: 248,
  epic: 256,
  legend: 264
})

const EVOLUTION_RULES = Object.freeze({
  'three-stage-1': Object.freeze({ minLevel: 8, minTrainedDays: 3, minSubjectCount: 2 }),
  'two-stage-1': Object.freeze({ minLevel: 12, minTrainedDays: 7, minSubjectCount: 3 }),
  'three-stage-2': Object.freeze({ minLevel: 20, minTrainedDays: 14, minSubjectCount: 4, requiredWinTag: 'elite-win' })
})

const FORM_RULES = Object.freeze({
  awakening: Object.freeze({
    minLevel: 30,
    minTrainedDays: 30,
    minSubjectCount: 5,
    requiredWinTag: 'boss-awakening-gate',
    durationTurns: null
  }),
  giga: Object.freeze({
    minLevel: 40,
    minTrainedDays: 60,
    minSubjectCount: 5,
    durationTurns: 3
  })
})

const sameJson = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected)
const isFiniteBetween = (value, minExclusive, maxInclusive) => (
  Number.isFinite(value) && value > minExclusive && value <= maxInclusive
)
const isPositiveTurns = (value) => Number.isInteger(value) && value >= 1 && value <= 5

export function canonicalSha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export function normalizedTargetFingerprint(targets) {
  return canonicalSha256(Object.fromEntries(Object.entries(targets)
    .sort(([a], [b]) => a.localeCompare(b))
    // Target order is part of the contract. BOSS_IDS decides tier/campaign,
    // and SIGNATURE_HOLDER_IDS decides generated move profiles by index.
    .map(([key, ids]) => [key, [...ids]])))
}

export function normalizedFamilyFingerprint(plans) {
  return canonicalSha256(plans
    .map((plan) => ({ id: plan.id, memberIds: [...plan.memberIds], source: plan.source }))
    .sort((a, b) => a.id.localeCompare(b.id)))
}

export function validateMonsterProgressionRules(monster) {
  const errors = []
  const expectedBudget = STAT_BUDGET_BY_RARITY[monster.rarity]
  if (monster.statBudget !== expectedBudget) {
    errors.push(`statBudget ${monster.statBudget}/${expectedBudget}`)
  }

  let expectedEvolution = null
  if (monster.evolvesTo?.length) {
    if (monster.maxStage === 2 && monster.stage === 1) expectedEvolution = EVOLUTION_RULES['two-stage-1']
    if (monster.maxStage === 3 && monster.stage === 1) expectedEvolution = EVOLUTION_RULES['three-stage-1']
    if (monster.maxStage === 3 && monster.stage === 2) expectedEvolution = EVOLUTION_RULES['three-stage-2']
  }
  if (!sameJson(monster.evolution, expectedEvolution)) {
    errors.push(`evolution ${JSON.stringify(monster.evolution)}/${JSON.stringify(expectedEvolution)}`)
  }

  for (const [kind, form] of Object.entries(monster.forms ?? {})) {
    const baseRule = FORM_RULES[kind]
    if (!baseRule) {
      errors.push(`unknown form ${kind}`)
      continue
    }
    const expected = kind === 'giga'
      ? {
          ...baseRule,
          requiredWinTag: monster.bossTier === 'none' ? 'boss-giga-gate' : `boss-${monster.id}`
        }
      : baseRule
    const actual = Object.fromEntries(Object.keys(expected).map((key) => [key, form[key]]))
    if (!sameJson(actual, expected)) errors.push(`${kind} conditions ${JSON.stringify(actual)}/${JSON.stringify(expected)}`)
  }

  return errors
}

export function validateMoveSemantics(move) {
  const errors = []
  const effect = move.effect ?? {}
  const categoryRules = {
    attack: { effects: ['damage'], targets: ['enemy'], positivePower: true },
    guard: { effects: ['guard'], targets: ['self'], positivePower: false },
    heal: { effects: ['heal'], targets: ['self', 'ally'], positivePower: false },
    support: { effects: ['buff', 'expose', 'reflect'], targets: ['self', 'ally', 'enemy'], positivePower: false }
  }
  const rule = categoryRules[move.category]
  if (rule) {
    if (!rule.effects.includes(effect.kind)) errors.push(`category/effect ${move.category}/${effect.kind}`)
    if (!rule.targets.includes(move.target)) errors.push(`category/target ${move.category}/${move.target}`)
    if (rule.positivePower ? !(move.power > 0) : move.power !== 0) errors.push(`category/power ${move.category}/${move.power}`)
  }

  if (effect.kind === 'damage' && !isFiniteBetween(effect.scale, 0, 3)) errors.push('damage scale')
  if (effect.kind === 'guard') {
    if (!isFiniteBetween(effect.reduction, 0, 1)) errors.push('guard reduction')
    if (!isPositiveTurns(effect.turns)) errors.push('guard turns')
  }
  if (effect.kind === 'heal' && !isFiniteBetween(effect.ratio, 0, 1)) errors.push('heal ratio')
  if (effect.kind === 'buff') {
    if (!['attack', 'guard', 'speed'].includes(effect.stat)) errors.push('buff stat')
    if (!isFiniteBetween(effect.amount, 0, 1)) errors.push('buff amount')
    if (!isPositiveTurns(effect.turns)) errors.push('buff turns')
    if (!['self', 'ally'].includes(move.target)) errors.push('buff target')
  }
  if (effect.kind === 'expose') {
    if (!(Number.isFinite(effect.multiplier) && effect.multiplier > 1 && effect.multiplier <= 3)) errors.push('expose multiplier')
    if (!isPositiveTurns(effect.turns)) errors.push('expose turns')
    if (move.target !== 'enemy') errors.push('expose target')
  }
  if (effect.kind === 'reflect') {
    if (!isFiniteBetween(effect.ratio, 0, 1)) errors.push('reflect ratio')
    if (!isPositiveTurns(effect.turns)) errors.push('reflect turns')
    if (move.target !== 'self') errors.push('reflect target')
  }

  if (move.id?.startsWith('boss-')) {
    if (move.category !== 'attack' || move.target !== 'enemy' || effect.kind !== 'damage') errors.push('boss attack contract')
    if (!(move.power > 0) || move.priority !== -1) errors.push('boss power/priority contract')
  }
  return errors
}

export function validateDesignEntry(entry, runtime, identity) {
  const errors = []
  for (const field of ['bodyArchetype', 'motif', 'silhouetteGroup', 'personality']) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) errors.push(`${field} missing`)
  }
  const identityPairs = [
    ['dexNo', runtime?.dexNo],
    ['name', identity?.name],
    ['description', identity?.desc],
    ['element', identity?.element],
    ['familyId', runtime?.familyId],
    ['stage', runtime?.stage],
    ['maxStage', runtime?.maxStage]
  ]
  for (const [field, expected] of identityPairs) {
    if (entry[field] !== expected) errors.push(`${field} mismatch`)
  }

  for (const [field, minimum] of [['inheritedDesignCues', 3], ['uniqueDesignCues', 3], ['forbiddenSimilarityNotes', 3]]) {
    if (!Array.isArray(entry[field]) || entry[field].length < minimum) errors.push(`${field} count`)
    else if (entry[field].some((cue) => typeof cue !== 'string' || !cue.trim())) errors.push(`${field} content`)
  }
  if (Array.isArray(entry.uniqueDesignCues)) {
    if (new Set(entry.uniqueDesignCues).size !== entry.uniqueDesignCues.length) errors.push('uniqueDesignCues duplicate')
    if (entry.uniqueDesignCues.some((cue) => cue.trim().length < 8)) errors.push('uniqueDesignCues too vague')
    if (entry.uniqueDesignCues.some((cue) => /しない|禁止|避け|そのまま|再利用/.test(cue))) {
      errors.push('uniqueDesignCues must be positive visual features')
    }
  }
  if (Array.isArray(entry.forbiddenSimilarityNotes) && entry.forbiddenSimilarityNotes.some((cue) => cue.trim().length < 8)) {
    errors.push('forbiddenSimilarityNotes too vague')
  }
  return errors
}

export function isProtectedIdentityPath(path) {
  return path === 'src/data/monsters.js'
}

export const FIXED_MONSTER_RULES = Object.freeze({
  statBudgetByRarity: STAT_BUDGET_BY_RARITY,
  evolution: EVOLUTION_RULES,
  forms: FORM_RULES
})
