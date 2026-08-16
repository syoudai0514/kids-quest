// Monster Master v2 is deliberately dependency-free.  The app is plain
// JavaScript, so these constants and JSDoc types are the runtime schema and
// the validator in scripts/verify-monster-master.mjs enforces them in CI.

export const MONSTER_MASTER_SCHEMA_VERSION = 2
export const MONSTER_IDENTITY_VERSION = 1
export const MOVE_MASTER_SCHEMA_VERSION = 1

export const BATTLE_TYPES = Object.freeze(['hi', 'mizu', 'kusa', 'hoshi'])
export const MONSTER_ROLES = Object.freeze([
  'attacker',
  'guard',
  'healer',
  'support',
  'control',
  'balanced'
])
export const RARITIES = Object.freeze(['common', 'rare', 'epic', 'legend'])
export const BOSS_TIERS = Object.freeze(['none', 'planet', 'grand', 'special'])
export const MOVE_CATEGORIES = Object.freeze(['attack', 'guard', 'heal', 'support'])
export const MOVE_TARGETS = Object.freeze(['self', 'ally', 'enemy'])
export const FORM_KINDS = Object.freeze(['awakening', 'giga'])

/**
 * @typedef {Object} EvolutionCondition
 * @property {number} minLevel
 * @property {number} minTrainedDays
 * @property {number} minSubjectCount
 * @property {string=} requiredWinTag
 */

/**
 * @typedef {Object} FormRef
 * @property {string} id
 * @property {'awakening'|'giga'} kind
 * @property {number} minLevel
 * @property {number} minTrainedDays
 * @property {number} minSubjectCount
 * @property {string} requiredWinTag
 * @property {number|null} durationTurns null means until the battle ends
 * @property {string} moveId
 * @property {string} asset
 */

/**
 * @typedef {Object} MonsterMasterV2Entry
 * @property {string} id
 * @property {number} dexNo
 * @property {string} name
 * @property {string} description
 * @property {string} element
 * @property {'hi'|'mizu'|'kusa'|'hoshi'} battleType
 * @property {string} familyId
 * @property {1|2|3} stage
 * @property {1|2|3} maxStage
 * @property {string|null} evolvesFrom
 * @property {string[]} evolvesTo
 * @property {EvolutionCondition|null} evolution
 * @property {'common'|'rare'|'epic'|'legend'} rarity
 * @property {'attacker'|'guard'|'healer'|'support'|'control'|'balanced'} role
 * @property {{ hp:number, attack:number, guard:number, speed:number }} baseStats
 * @property {number} statBudget
 * @property {string} growthRole
 * @property {{ level:number, moveId:string }[]} learnset
 * @property {string=} signatureMoveId
 * @property {string=} bossMoveId
 * @property {string[]} encounterTags
 * @property {'none'|'planet'|'grand'|'special'} bossTier
 * @property {{ awakening?:FormRef, giga?:FormRef }} forms
 * @property {{ thumb:string, full:string }} assets
 */

/**
 * @typedef {Object} MoveMasterEntry
 * @property {string} id
 * @property {string} name
 * @property {'hi'|'mizu'|'kusa'|'hoshi'} battleType
 * @property {'attack'|'guard'|'heal'|'support'} category
 * @property {number} power
 * @property {number} priority
 * @property {'self'|'ally'|'enemy'} target
 * @property {{ kind:string, [key:string]:string|number|boolean }} effect
 * @property {{ powerMultiplier:number }=} enemyTuning
 * @property {{ message:string, icon:string }=} telegraph
 * @property {string} description
 * @property {string} animationKey
 * @property {string} sfxKey
 */
