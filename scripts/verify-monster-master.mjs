import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { MONSTERS } from '../src/data/monsters.js'
import {
  BATTLE_TYPES,
  BOSS_TIERS,
  MONSTER_IDENTITY_VERSION,
  MONSTER_MASTER_SCHEMA_VERSION,
  MONSTER_ROLES,
  MOVE_CATEGORIES,
  MOVE_MASTER_SCHEMA_VERSION,
  MOVE_TARGETS,
  RARITIES
} from '../src/data/monsterMaster/schema.js'
import { FAMILY_ALLOCATION, FAMILY_PLANS } from '../src/data/monsterMaster/familyPlan.js'
import {
  AWAKENING_IDS,
  BOSS_IDS,
  BOSS_TARGETS,
  GIGA_IDS,
  MONSTER_TARGET_COUNTS,
  SIGNATURE_HOLDER_IDS
} from '../src/data/monsterMaster/targets.js'
import { MOVE_MASTER, MOVE_MASTER_COUNTS } from '../src/data/monsterMaster/moves.js'
import {
  MONSTER_MASTER_CHUNKS,
  MONSTER_MASTER_V2,
  getMonsterDetailOrFallback,
  getMonsterMasterChunk,
  isValidMonsterDetailForChunk,
  loadMonsterDetailOrFallback
} from '../src/data/monsterMaster/monsterMaster.js'
import { DESIGN_MANIFEST_051_100, DESIGN_PROMPT_VERSION } from '../design/monsters/manifest-051-100.js'
import {
  FIXED_MONSTER_RULES,
  canonicalSha256,
  normalizedFamilyFingerprint,
  normalizedTargetFingerprint,
  validateDesignEntry,
  validateMonsterProgressionRules,
  validateMoveSemantics
} from './lib/monster-master-validation.mjs'

const errors = []
const requireValue = (condition, message) => {
  if (!condition) errors.push(message)
}
const countBy = (items, key) => Object.fromEntries([...items.reduce((map, item) => {
  const value = typeof key === 'function' ? key(item) : item[key]
  map.set(value, (map.get(value) ?? 0) + 1)
  return map
}, new Map()).entries()].sort(([a], [b]) => String(a).localeCompare(String(b))))

const identityEntries = MONSTERS.map((monster, index) => ({
  dexNo: index + 1,
  id: monster.id,
  name: monster.name,
  element: monster.element,
  description: monster.desc
}))
const snapshotUrl = new URL('./fixtures/monster-identities.v1.json', import.meta.url)
const snapshot = JSON.parse(await readFile(snapshotUrl, 'utf8'))
const identityCanonical = JSON.stringify(identityEntries)
const identityHash = createHash('sha256').update(identityCanonical).digest('hex')
requireValue(snapshot.version === MONSTER_IDENTITY_VERSION, `identity snapshot version: ${snapshot.version}`)
requireValue(snapshot.count === 1000, `identity snapshot count: ${snapshot.count}`)
requireValue(snapshot.sha256 === identityHash, `identity snapshot hash changed: ${identityHash}`)
requireValue(JSON.stringify(snapshot.entries) === identityCanonical, 'identity snapshot entries changed')

requireValue(MONSTER_MASTER_SCHEMA_VERSION === 2, 'monster master schema version must be 2')
requireValue(MOVE_MASTER_SCHEMA_VERSION === 1, 'move master schema version must be 1')
requireValue(MONSTER_MASTER_V2.length === 1000, `monster count: ${MONSTER_MASTER_V2.length}`)

const monsterIds = MONSTER_MASTER_V2.map((monster) => monster.id)
const dexNumbers = MONSTER_MASTER_V2.map((monster) => monster.dexNo)
requireValue(new Set(monsterIds).size === 1000, 'monster id duplicate')
requireValue(new Set(dexNumbers).size === 1000, 'dexNo duplicate')
requireValue(dexNumbers.every((dexNo, index) => dexNo === index + 1), 'dexNo must be continuous 1-1000')

const monsterById = Object.fromEntries(MONSTER_MASTER_V2.map((monster) => [monster.id, monster]))
const moveById = Object.fromEntries(MOVE_MASTER.map((move) => [move.id, move]))
const identityById = Object.fromEntries(MONSTERS.map((monster) => [monster.id, monster]))

for (const [index, monster] of MONSTER_MASTER_V2.entries()) {
  const identity = identityEntries[index]
  const label = `dex ${monster.dexNo} ${monster.id}`
  requireValue(monster.id === identity.id, `${label}: id differs from identity`)
  requireValue(monster.name === identity.name, `${label}: name differs from identity`)
  requireValue(monster.element === identity.element, `${label}: element differs from identity`)
  requireValue(monster.description === identity.description, `${label}: description differs from identity`)
  requireValue(BATTLE_TYPES.includes(monster.battleType), `${label}: battleType ${monster.battleType}`)
  requireValue(typeof monster.familyId === 'string' && monster.familyId, `${label}: familyId missing`)
  requireValue(Number.isInteger(monster.stage) && monster.stage >= 1 && monster.stage <= 3, `${label}: stage`)
  requireValue(Number.isInteger(monster.maxStage) && monster.maxStage >= monster.stage && monster.maxStage <= 3, `${label}: maxStage`)
  requireValue(MONSTER_ROLES.includes(monster.role), `${label}: role ${monster.role}`)
  requireValue(RARITIES.includes(monster.rarity), `${label}: rarity ${monster.rarity}`)
  requireValue(BOSS_TIERS.includes(monster.bossTier), `${label}: bossTier ${monster.bossTier}`)
  requireValue(monster.growthRole === monster.role, `${label}: growthRole differs from role`)
  requireValue(monster.statBudget === FIXED_MONSTER_RULES.statBudgetByRarity[monster.rarity], `${label}: rarity/statBudget ${monster.rarity}/${monster.statBudget}`)
  requireValue(Object.values(monster.baseStats).every((value) => Number.isInteger(value) && value > 0), `${label}: invalid baseStats`)
  requireValue(Object.values(monster.baseStats).reduce((sum, value) => sum + value, 0) === monster.statBudget, `${label}: stat budget sum`)
  requireValue(Array.isArray(monster.learnset) && monster.learnset.length >= 4 && monster.learnset.length <= 8, `${label}: learnset count`)
  requireValue(new Set(monster.learnset.map((entry) => entry.moveId)).size === monster.learnset.length, `${label}: duplicate learnset move`)
  requireValue(monster.learnset.every((entry, moveIndex) => Number.isInteger(entry.level) && entry.level >= 1 && (moveIndex === 0 || entry.level >= monster.learnset[moveIndex - 1].level)), `${label}: learnset levels`)
  for (const entry of monster.learnset) requireValue(Boolean(moveById[entry.moveId]), `${label}: unknown move ${entry.moveId}`)
  if (monster.signatureMoveId) {
    requireValue(Boolean(moveById[monster.signatureMoveId]), `${label}: unknown signature move`)
    requireValue(monster.learnset.some((entry) => entry.moveId === monster.signatureMoveId), `${label}: signature not in learnset`)
  }
  if (monster.bossMoveId) requireValue(Boolean(moveById[monster.bossMoveId]), `${label}: unknown boss move`)
  requireValue(Array.isArray(monster.encounterTags) && monster.encounterTags.length >= 2, `${label}: encounterTags`)
  requireValue(typeof monster.assets?.thumb === 'string' && monster.assets.thumb, `${label}: thumb path`)
  requireValue(typeof monster.assets?.full === 'string' && monster.assets.full, `${label}: full path`)

  if (monster.evolvesFrom) {
    const previous = monsterById[monster.evolvesFrom]
    requireValue(Boolean(previous), `${label}: missing evolvesFrom ${monster.evolvesFrom}`)
    requireValue(previous?.evolvesTo.includes(monster.id), `${label}: asymmetric evolvesFrom`)
    requireValue(previous?.familyId === monster.familyId, `${label}: evolvesFrom family mismatch`)
  }
  for (const nextId of monster.evolvesTo) {
    const next = monsterById[nextId]
    requireValue(Boolean(next), `${label}: missing evolvesTo ${nextId}`)
    requireValue(next?.evolvesFrom === monster.id, `${label}: asymmetric evolvesTo ${nextId}`)
    requireValue(next?.familyId === monster.familyId, `${label}: evolvesTo family mismatch`)
    requireValue(next?.dexNo > monster.dexNo, `${label}: evolution dexNo must increase (${next?.dexNo})`)
  }
  requireValue((monster.evolvesTo.length > 0) === Boolean(monster.evolution), `${label}: evolution condition mismatch`)

  for (const [kind, form] of Object.entries(monster.forms)) {
    requireValue(form.kind === kind, `${label}: form kind mismatch ${kind}`)
    requireValue(Boolean(moveById[form.moveId]), `${label}: form move missing ${form.moveId}`)
    requireValue(typeof form.asset === 'string' && form.asset.includes(monster.id), `${label}: form asset`)
    requireValue(form.minSubjectCount === 5, `${label}: form subjects`)
    requireValue(kind === 'awakening' ? form.durationTurns === null : form.durationTurns === 3, `${label}: form duration ${kind}`)
  }
  for (const error of validateMonsterProgressionRules(monster)) errors.push(`${label}: ${error}`)
}

// A linear chain should never revisit a node.  This catches future branching
// edits that accidentally introduce a cycle even when pairwise refs exist.
for (const monster of MONSTER_MASTER_V2) {
  const visited = new Set([monster.id])
  let cursor = monster
  while (cursor.evolvesTo.length) {
    const nextId = cursor.evolvesTo[0]
    requireValue(!visited.has(nextId), `${monster.id}: evolution cycle through ${nextId}`)
    if (visited.has(nextId)) break
    visited.add(nextId)
    cursor = monsterById[nextId]
  }
}

const expansionFamilies = new Map()
for (const monster of MONSTER_MASTER_V2.slice(50)) {
  if (!expansionFamilies.has(monster.familyId)) expansionFamilies.set(monster.familyId, [])
  expansionFamilies.get(monster.familyId).push(monster)
}
const expansionFamilyCounts = { three: 0, two: 0, standalone: 0 }
for (const [familyId, members] of expansionFamilies) {
  const expectedSize = members[0].maxStage
  requireValue(members.length === expectedSize, `${familyId}: member count ${members.length}/${expectedSize}`)
  requireValue(members.every((member) => member.maxStage === expectedSize), `${familyId}: inconsistent maxStage`)
  if (expectedSize === 3) expansionFamilyCounts.three++
  if (expectedSize === 2) expansionFamilyCounts.two++
  if (expectedSize === 1) expansionFamilyCounts.standalone++
}
requireValue(expansionFamilyCounts.three === FAMILY_ALLOCATION.expansionThreeStageFamilies, `three-stage families: ${expansionFamilyCounts.three}`)
requireValue(expansionFamilyCounts.two === FAMILY_ALLOCATION.expansionTwoStageFamilies, `two-stage families: ${expansionFamilyCounts.two}`)
requireValue(expansionFamilyCounts.standalone === FAMILY_ALLOCATION.expansionStandalone, `standalone: ${expansionFamilyCounts.standalone}`)
requireValue(FAMILY_PLANS.length === 475, `total family plans: ${FAMILY_PLANS.length}`)

requireValue(AWAKENING_IDS.length === MONSTER_TARGET_COUNTS.awakening, `awakening targets: ${AWAKENING_IDS.length}`)
requireValue(GIGA_IDS.length === MONSTER_TARGET_COUNTS.giga, `giga targets: ${GIGA_IDS.length}`)
requireValue(BOSS_IDS.length === MONSTER_TARGET_COUNTS.boss, `boss targets: ${BOSS_IDS.length}`)
requireValue(SIGNATURE_HOLDER_IDS.length === MONSTER_TARGET_COUNTS.signatureHolders, `signature holders: ${SIGNATURE_HOLDER_IDS.length}`)
for (const [label, values] of Object.entries({ AWAKENING_IDS, GIGA_IDS, BOSS_IDS, SIGNATURE_HOLDER_IDS })) {
  requireValue(new Set(values).size === values.length, `${label}: duplicate target`)
  requireValue(values.every((id) => monsterById[id]), `${label}: unknown monster`)
  requireValue(values.every((id) => monsterById[id]?.stage === monsterById[id]?.maxStage), `${label}: target must be a final/standalone stage`)
}
requireValue(MONSTER_MASTER_V2.filter((monster) => monster.forms.awakening).length === 60, 'runtime awakening count')
requireValue(MONSTER_MASTER_V2.filter((monster) => monster.forms.giga).length === 24, 'runtime giga count')
requireValue(MONSTER_MASTER_V2.filter((monster) => monster.bossTier !== 'none').length === 36, 'runtime boss count')
requireValue(MONSTER_MASTER_V2.filter((monster) => monster.signatureMoveId).length === 120, 'runtime signature holder count')

requireValue(MOVE_MASTER.length === MOVE_MASTER_COUNTS.total, `move total: ${MOVE_MASTER.length}`)
requireValue(new Set(MOVE_MASTER.map((move) => move.id)).size === MOVE_MASTER.length, 'move id duplicate')
requireValue(new Set(MOVE_MASTER.map((move) => move.name)).size === MOVE_MASTER.length, 'move name duplicate')
const moveKinds = {
  shared: MOVE_MASTER.filter((move) => move.id.startsWith('shared-')).length,
  signature: MOVE_MASTER.filter((move) => move.id.startsWith('signature-')).length,
  boss: MOVE_MASTER.filter((move) => move.id.startsWith('boss-')).length
}
for (const [kind, target] of Object.entries(MOVE_MASTER_COUNTS)) {
  if (kind !== 'total') requireValue(moveKinds[kind] === target, `${kind} moves: ${moveKinds[kind]}/${target}`)
}
const effectKinds = new Set(['damage', 'guard', 'heal', 'buff', 'expose', 'reflect'])
for (const move of MOVE_MASTER) {
  const label = `move ${move.id}`
  requireValue(typeof move.name === 'string' && move.name, `${label}: name`)
  requireValue(BATTLE_TYPES.includes(move.battleType), `${label}: battleType`)
  requireValue(MOVE_CATEGORIES.includes(move.category), `${label}: category`)
  requireValue(MOVE_TARGETS.includes(move.target), `${label}: target`)
  requireValue(Number.isFinite(move.power) && move.power >= 0, `${label}: power`)
  requireValue(Number.isInteger(move.priority) && move.priority >= -1 && move.priority <= 1, `${label}: priority`)
  requireValue(effectKinds.has(move.effect?.kind), `${label}: effect kind ${move.effect?.kind}`)
  requireValue(typeof move.description === 'string' && move.description, `${label}: description`)
  requireValue(typeof move.animationKey === 'string' && move.animationKey, `${label}: animationKey`)
  requireValue(typeof move.sfxKey === 'string' && move.sfxKey, `${label}: sfxKey`)
  for (const error of validateMoveSemantics(move)) errors.push(`${label}: ${error}`)
  if (move.id.startsWith('boss-')) {
    requireValue(move.telegraph?.message && move.telegraph?.icon, `${label}: telegraph`)
    requireValue(move.enemyTuning?.powerMultiplier > 1, `${label}: enemyTuning`)
  }
}

requireValue(MONSTER_MASTER_CHUNKS.length === 10, `chunk count: ${MONSTER_MASTER_CHUNKS.length}`)
requireValue(MONSTER_MASTER_CHUNKS.every((chunk) => chunk.length === 100), 'every master chunk must have 100 entries')
requireValue(getMonsterMasterChunk(0).length === 0, 'chunk 0 must safely fall back')
requireValue(getMonsterMasterChunk(11).length === 0, 'chunk 11 must safely fall back')
const missingChunkFallback = getMonsterDetailOrFallback('g042', 10)
requireValue(missingChunkFallback.detailAvailable === false && missingChunkFallback.monster?.id === 'g042', 'missing chunk compact fallback')
requireValue(getMonsterDetailOrFallback('missing-id', 1).monster === null, 'unknown id fallback')
const rejectedChunkFallback = await loadMonsterDetailOrFallback('g042', 1, async () => {
  throw new Error('simulated dynamic import failure')
})
requireValue(rejectedChunkFallback.detailAvailable === false && rejectedChunkFallback.monster?.id === 'g042', 'rejected loader compact fallback')
const malformedChunkFallback = await loadMonsterDetailOrFallback('g042', 1, async () => ({ default: [] }))
requireValue(malformedChunkFallback.detailAvailable === false && malformedChunkFallback.monster?.id === 'g042', 'malformed loader compact fallback')
const wrongAsyncChunkFallback = await loadMonsterDetailOrFallback('g042', 1, async () => getMonsterMasterChunk(10))
requireValue(wrongAsyncChunkFallback.detailAvailable === false && wrongAsyncChunkFallback.monster?.id === 'g042', 'wrong async chunk compact fallback')
const unknownAsyncFallback = await loadMonsterDetailOrFallback('missing-id', 1, async () => {
  throw new Error('simulated missing module')
})
requireValue(unknownAsyncFallback.detailAvailable === false && unknownAsyncFallback.monster === null, 'unknown async id fallback')
const validAsyncDetail = await loadMonsterDetailOrFallback('g042', 1, async () => getMonsterMasterChunk(1))
requireValue(validAsyncDetail.detailAvailable === true && validAsyncDetail.monster?.id === 'g042', 'valid async detail')
const brokenSameIdFallback = await loadMonsterDetailOrFallback('g042', 1, async () => [{ id: 'g042', name: 'こわれたデータ' }])
requireValue(brokenSameIdFallback.detailAvailable === false && brokenSameIdFallback.monster?.id === 'g042', 'broken same-id compact fallback')
const wrongIdentityDetail = structuredClone(monsterById.g042)
wrongIdentityDetail.name = 'こわれたデータ'
requireValue(!isValidMonsterDetailForChunk('g042', 1, wrongIdentityDetail), 'changed detail identity must be invalid')
const wrongDexDetail = structuredClone(monsterById.g042)
wrongDexDetail.dexNo = 999
requireValue(!isValidMonsterDetailForChunk('g042', 1, wrongDexDetail), 'changed detail dexNo must be invalid')
const oldSchemaDetail = structuredClone(monsterById.g042)
delete oldSchemaDetail.forms
requireValue(!isValidMonsterDetailForChunk('g042', 1, oldSchemaDetail), 'old detail schema must be invalid')

const pilotIds = MONSTER_MASTER_V2.slice(50, 100).map((monster) => monster.id)
requireValue(DESIGN_MANIFEST_051_100.length === 50, `design manifest count: ${DESIGN_MANIFEST_051_100.length}`)
requireValue(new Set(DESIGN_MANIFEST_051_100.map((entry) => entry.monsterId)).size === 50, 'design manifest duplicate id')
requireValue(pilotIds.every((id) => DESIGN_MANIFEST_051_100.some((entry) => entry.monsterId === id)), 'design manifest does not cover dex 51-100')
for (const entry of DESIGN_MANIFEST_051_100) {
  const label = `design ${entry.monsterId}`
  for (const error of validateDesignEntry(entry, monsterById[entry.monsterId], identityById[entry.monsterId])) {
    errors.push(`${label}: ${error}`)
  }
  requireValue(entry.promptVersion === DESIGN_PROMPT_VERSION, `${label}: promptVersion`)
  requireValue(entry.inheritedDesignCues.length >= 3, `${label}: inherited cues`)
  requireValue(entry.uniqueDesignCues.length >= 3, `${label}: unique cues`)
  requireValue(entry.forbiddenSimilarityNotes.length >= 3, `${label}: forbidden similarity notes`)
  requireValue(entry.framing.safeMarginPercent >= 10, `${label}: safe margin`)
  requireValue(entry.assetTargets.thumb === monsterById[entry.monsterId].assets.thumb, `${label}: thumb mismatch`)
  requireValue(entry.assetTargets.full === monsterById[entry.monsterId].assets.full, `${label}: full mismatch`)
  requireValue(JSON.stringify(entry.assetTargets.forms) === JSON.stringify(Object.fromEntries(Object.entries(monsterById[entry.monsterId].forms).map(([kind, form]) => [kind, form.asset]))), `${label}: form asset mismatch`)
}
requireValue(new Set(DESIGN_MANIFEST_051_100.map((entry) => JSON.stringify(entry.uniqueDesignCues))).size === 50, 'design unique cue sets must differ for all 50 monsters')
requireValue(new Set(DESIGN_MANIFEST_051_100.map((entry) => JSON.stringify(entry.forbiddenSimilarityNotes))).size === 50, 'design forbidden notes must be family/monster specific')
for (let start = 51; start <= 100; start += 10) {
  const batch = DESIGN_MANIFEST_051_100.filter((entry) => entry.dexNo >= start && entry.dexNo < start + 10)
  const silhouetteCounts = countBy(batch, 'silhouetteGroup')
  requireValue(Math.max(...Object.values(silhouetteCounts)) <= 2, `design dex ${start}-${start + 9}: silhouette group exceeds 2`)
}

const vertical = {
  g042: ['family-core-orbit', 'balanced'],
  g043: ['family-core-orbit', 'guard'],
  g044: ['family-core-orbit', 'control'],
  g045: ['family-sky-metamorph', 'attacker'],
  g046: ['family-sky-metamorph', 'support'],
  g047: ['family-sky-metamorph', 'attacker'],
  g048: ['family-galaxy-pulse', 'healer'],
  g049: ['family-ancient-sand', 'attacker'],
  g050: ['family-green-beacon', 'support'],
  g051: ['family-snow-bastion', 'guard'],
  g052: ['family-rainbow-mirage', 'control'],
  g053: ['family-cosmic-wing', 'attacker']
}
for (const [id, [familyId, role]] of Object.entries(vertical)) {
  requireValue(monsterById[id].familyId === familyId, `${id}: vertical family`)
  requireValue(monsterById[id].role === role, `${id}: vertical role`)
}
requireValue(moveById['signature-g044']?.name === 'ダークオービット', 'g044 signature name')
requireValue(moveById['signature-g047']?.name === 'りゅうせいジェル', 'g047 signature name')
requireValue(moveById['signature-g051']?.name === 'ゆきいわガード', 'g051 signature name')
requireValue(moveById['signature-g052']?.name === 'にじうつし', 'g052 signature name')
requireValue(moveById['signature-g053']?.name === 'コズミックウイング', 'g053 signature name')
requireValue(moveById['boss-g053']?.name === 'ビッグバンストーム', 'g053 giga/boss move name')
requireValue(Boolean(monsterById.g052.forms.awakening), 'g052 awakening target')
requireValue(Boolean(monsterById.g053.forms.giga), 'g053 giga target')
requireValue(monsterById.g053.bossTier === 'planet', 'g053 planet boss')
const verticalEliteIds = MONSTER_MASTER_V2.slice(50, 62)
  .filter((monster) => monster.encounterTags.includes('elite-candidate'))
  .map((monster) => monster.id)
requireValue(JSON.stringify(verticalEliteIds) === JSON.stringify(['g051', 'g052']), `vertical elite candidates: ${verticalEliteIds.join(',')}`)
for (const monster of MONSTER_MASTER_V2.slice(50, 62)) {
  const expectedAwakening = monster.id === 'g052'
  const expectedGiga = monster.id === 'g053'
  const expectedBoss = monster.id === 'g053'
  const expectedSignature = ['g044', 'g047', 'g051', 'g052', 'g053'].includes(monster.id)
  requireValue(Boolean(monster.forms.awakening) === expectedAwakening, `${monster.id}: unexpected vertical awakening assignment`)
  requireValue(Boolean(monster.forms.giga) === expectedGiga, `${monster.id}: unexpected vertical giga assignment`)
  requireValue((monster.bossTier !== 'none') === expectedBoss, `${monster.id}: unexpected vertical boss assignment`)
  requireValue(Boolean(monster.signatureMoveId) === expectedSignature, `${monster.id}: unexpected vertical signature assignment`)
}

for (const monster of MONSTER_MASTER_V2.slice(0, 50)) {
  try {
    await access(fileURLToPath(new URL(`../public${monster.assets.full}`, import.meta.url)))
  } catch {
    errors.push(`${monster.id}: legacy asset does not exist ${monster.assets.full}`)
  }
}

const report = {
  schema: { monster: MONSTER_MASTER_SCHEMA_VERSION, move: MOVE_MASTER_SCHEMA_VERSION, identity: MONSTER_IDENTITY_VERSION },
  identity: { count: identityEntries.length, sha256: identityHash },
  monsters: {
    count: MONSTER_MASTER_V2.length,
    families: { total: FAMILY_PLANS.length, expansion: expansionFamilyCounts },
    roles: countBy(MONSTER_MASTER_V2, 'role'),
    rarities: countBy(MONSTER_MASTER_V2, 'rarity'),
    battleTypes: countBy(MONSTER_MASTER_V2, 'battleType'),
    bossTiers: countBy(MONSTER_MASTER_V2, 'bossTier'),
    targets: {
      awakening: AWAKENING_IDS.length,
      giga: GIGA_IDS.length,
      boss: BOSS_IDS.length,
      signatureHolders: SIGNATURE_HOLDER_IDS.length
    }
  },
  moves: { ...moveKinds, total: MOVE_MASTER.length },
  chunks: MONSTER_MASTER_CHUNKS.map((chunk) => chunk.length),
  designPilot: DESIGN_MANIFEST_051_100.length
}

const distributionSnapshot = JSON.parse(await readFile(
  new URL('./fixtures/monster-master-distribution.v2.json', import.meta.url),
  'utf8'
))
const currentDistribution = {
  families: report.monsters.families,
  roles: report.monsters.roles,
  rarities: report.monsters.rarities,
  battleTypes: report.monsters.battleTypes,
  bossTiers: report.monsters.bossTiers,
  targets: report.monsters.targets,
  moves: report.moves,
  chunks: report.chunks,
  designPilot: report.designPilot,
  integrity: {
    familyMembershipSha256: normalizedFamilyFingerprint(FAMILY_PLANS),
    targetsSha256: normalizedTargetFingerprint({
      awakening: AWAKENING_IDS,
      giga: GIGA_IDS,
      boss: BOSS_IDS,
      signatureHolders: SIGNATURE_HOLDER_IDS
    }),
    bossAssignmentsSha256: canonicalSha256(BOSS_IDS.map((id) => ({
      id,
      ...BOSS_TARGETS[id],
      move: {
        id: moveById[`boss-${id}`]?.id,
        power: moveById[`boss-${id}`]?.power,
        priority: moveById[`boss-${id}`]?.priority,
        effect: moveById[`boss-${id}`]?.effect,
        enemyTuning: moveById[`boss-${id}`]?.enemyTuning
      }
    })))
  }
}
if (JSON.stringify(distributionSnapshot) !== JSON.stringify(currentDistribution)) {
  errors.push(
    `master distribution changed\n  expected: ${JSON.stringify(distributionSnapshot)}\n  actual:   ${JSON.stringify(currentDistribution)}`
  )
}

if (errors.length) {
  console.error(`モンスターマスター検証NG: ${errors.length}件`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else {
  console.log(
    `モンスターマスター検証OK: ${report.monsters.count}体、` +
    `進化系列 ${expansionFamilyCounts.three}/${expansionFamilyCounts.two}/${expansionFamilyCounts.standalone}、` +
    `覚醒${AWAKENING_IDS.length}・ギガ${GIGA_IDS.length}・ボス${BOSS_IDS.length}、` +
    `技${MOVE_MASTER.length}、デザイン台帳${DESIGN_MANIFEST_051_100.length}体`
  )
}
