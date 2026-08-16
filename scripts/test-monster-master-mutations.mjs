import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MONSTERS } from '../src/data/monsters.js'
import { FAMILY_PLANS } from '../src/data/monsterMaster/familyPlan.js'
import { AWAKENING_IDS, BOSS_IDS, GIGA_IDS, SIGNATURE_HOLDER_IDS } from '../src/data/monsterMaster/targets.js'
import { MOVE_MASTER } from '../src/data/monsterMaster/moves.js'
import {
  MONSTER_MASTER_V2,
  loadMonsterDetailOrFallback
} from '../src/data/monsterMaster/monsterMaster.js'
import { DESIGN_MANIFEST_051_100 } from '../design/monsters/manifest-051-100.js'
import {
  isProtectedIdentityPath,
  normalizedFamilyFingerprint,
  normalizedTargetFingerprint,
  validateDesignEntry,
  validateMonsterProgressionRules,
  validateMoveSemantics
} from './lib/monster-master-validation.mjs'

const byId = Object.fromEntries(MONSTER_MASTER_V2.map((monster) => [monster.id, monster]))
const identityById = Object.fromEntries(MONSTERS.map((monster) => [monster.id, monster]))
const clone = (value) => structuredClone(value)

for (const move of MOVE_MASTER) assert.deepEqual(validateMoveSemantics(move), [], `${move.id} semantics`)
for (const monster of MONSTER_MASTER_V2) assert.deepEqual(validateMonsterProgressionRules(monster), [], `${monster.id} progression`)
for (const entry of DESIGN_MANIFEST_051_100) {
  assert.deepEqual(validateDesignEntry(entry, byId[entry.monsterId], identityById[entry.monsterId]), [], `${entry.monsterId} design`)
}

const contradictoryMove = clone(MOVE_MASTER.find((move) => move.id.startsWith('shared-')))
contradictoryMove.category = 'guard'
contradictoryMove.target = 'enemy'
assert(validateMoveSemantics(contradictoryMove).length > 0, 'guard + enemy damage must fail')

const missingRatio = clone(MOVE_MASTER.find((move) => move.effect.kind === 'heal'))
delete missingRatio.effect.ratio
assert(validateMoveSemantics(missingRatio).length > 0, 'heal without ratio must fail')

const weakenedBoss = clone(MOVE_MASTER.find((move) => move.id.startsWith('boss-')))
weakenedBoss.category = 'support'
weakenedBoss.priority = 0
assert(validateMoveSemantics(weakenedBoss).length > 0, 'boss support move must fail')

const missingBody = clone(DESIGN_MANIFEST_051_100[0])
delete missingBody.bodyArchetype
assert(validateDesignEntry(missingBody, byId[missingBody.monsterId], identityById[missingBody.monsterId]).length > 0, 'missing bodyArchetype must fail')

const wrongStage = clone(DESIGN_MANIFEST_051_100[0])
wrongStage.stage += 1
assert(validateDesignEntry(wrongStage, byId[wrongStage.monsterId], identityById[wrongStage.monsterId]).length > 0, 'design stage mismatch must fail')

const boilerplateDesign = clone(DESIGN_MANIFEST_051_100[0])
boilerplateDesign.uniqueDesignCues = ['色替えにしない方針', '輪郭をそのまま再利用しない', '禁止事項を守るデザイン']
assert(validateDesignEntry(boilerplateDesign, byId[boilerplateDesign.monsterId], identityById[boilerplateDesign.monsterId]).length > 0, 'negative boilerplate cues must fail')

const targetSets = {
  awakening: AWAKENING_IDS,
  giga: GIGA_IDS,
  boss: BOSS_IDS,
  signatureHolders: SIGNATURE_HOLDER_IDS
}
const originalTargetHash = normalizedTargetFingerprint(targetSets)
const changedAwakening = [...AWAKENING_IDS]
changedAwakening[changedAwakening.indexOf('g985')] = 'g083'
assert.notEqual(normalizedTargetFingerprint({ ...targetSets, awakening: changedAwakening }), originalTargetHash, 'same-count target swap must change fingerprint')

const changedFamilies = FAMILY_PLANS.map((plan) => ({ ...plan, memberIds: [...plan.memberIds] }))
const swappable = changedFamilies.filter((plan) => plan.memberIds.length === 3).slice(0, 2)
;[swappable[0].memberIds[0], swappable[1].memberIds[0]] = [swappable[1].memberIds[0], swappable[0].memberIds[0]]
assert.notEqual(normalizedFamilyFingerprint(changedFamilies), normalizedFamilyFingerprint(FAMILY_PLANS), 'same-count family swap must change fingerprint')

const wrongBudget = clone(MONSTER_MASTER_V2.find((monster) => monster.rarity === 'common'))
wrongBudget.statBudget = 248
assert(validateMonsterProgressionRules(wrongBudget).length > 0, 'rarity budget swap must fail')

const wrongEvolution = clone(MONSTER_MASTER_V2.find((monster) => monster.maxStage === 3 && monster.stage === 1))
wrongEvolution.evolution.minLevel += 1
assert(validateMonsterProgressionRules(wrongEvolution).length > 0, 'evolution level drift must fail')

const missingWinTag = clone(MONSTER_MASTER_V2.find((monster) => monster.maxStage === 3 && monster.stage === 2))
delete missingWinTag.evolution.requiredWinTag
assert(validateMonsterProgressionRules(missingWinTag).length > 0, 'evolution win tag removal must fail')

const wrongFormDays = clone(MONSTER_MASTER_V2.find((monster) => monster.forms.awakening))
wrongFormDays.forms.awakening.minTrainedDays -= 1
assert(validateMonsterProgressionRules(wrongFormDays).length > 0, 'awakening day drift must fail')

const eliteIds = MONSTER_MASTER_V2.slice(50, 62)
  .filter((monster) => monster.encounterTags.includes('elite-candidate'))
  .map((monster) => monster.id)
assert.deepEqual(eliteIds, ['g051', 'g052'], 'vertical elite set must be exclusive')

assert.equal(isProtectedIdentityPath('src/data/monsters.js'), true, 'identity source must be protected')
assert.equal(isProtectedIdentityPath('scripts/fixtures/monster-identities.v1.json'), false, 'snapshot alone is not the protected source')

const gateMutationRepo = await mkdtemp(join(process.cwd(), '.tmp-monster-identity-gate-'))
try {
  const identityPath = join(gateMutationRepo, 'src/data/monsters.js')
  const snapshotPath = join(gateMutationRepo, 'scripts/fixtures/monster-identities.v1.json')
  await mkdir(dirname(identityPath), { recursive: true })
  await mkdir(dirname(snapshotPath), { recursive: true })
  await writeFile(identityPath, 'export const MONSTERS = [{ id: "g001", name: "before" }]\n')
  await writeFile(snapshotPath, '{"name":"before"}\n')
  execFileSync('git', ['init', '-q'], { cwd: gateMutationRepo })
  execFileSync('git', ['config', 'user.email', 'mutation@test.invalid'], { cwd: gateMutationRepo })
  execFileSync('git', ['config', 'user.name', 'Mutation Test'], { cwd: gateMutationRepo })
  execFileSync('git', ['add', '.'], { cwd: gateMutationRepo })
  execFileSync('git', ['commit', '-qm', 'base identity'], { cwd: gateMutationRepo })
  const baseSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: gateMutationRepo, encoding: 'utf8' }).trim()
  await writeFile(identityPath, 'export const MONSTERS = [{ id: "g001", name: "changed" }]\n')
  await writeFile(snapshotPath, '{"name":"changed"}\n')
  const gateScript = fileURLToPath(new URL('./verify-monster-identity-base.mjs', import.meta.url))
  const gateResult = spawnSync(process.execPath, [gateScript], {
    cwd: gateMutationRepo,
    env: { ...process.env, MONSTER_IDENTITY_BASE_REF: baseSha },
    encoding: 'utf8'
  })
  assert.notEqual(gateResult.status, 0, 'identity source + regenerated snapshot must fail normal PR gate')
  assert.match(gateResult.stderr, /normal PRs may not change/, 'identity gate must explain the protected change')
} finally {
  await rm(gateMutationRepo, { recursive: true, force: true })
}

const rejected = await loadMonsterDetailOrFallback('g042', 1, async () => Promise.reject(new Error('offline')))
assert.equal(rejected.detailAvailable, false)
assert.equal(rejected.monster.id, 'g042')
const malformed = await loadMonsterDetailOrFallback('g042', 1, async () => ({ default: [] }))
assert.equal(malformed.detailAvailable, false)
assert.equal(malformed.monster.id, 'g042')
const wrongChunk = await loadMonsterDetailOrFallback('g042', 1, async () => MONSTER_MASTER_V2.slice(900, 1000))
assert.equal(wrongChunk.detailAvailable, false)
assert.equal(wrongChunk.monster.id, 'g042')
const unknown = await loadMonsterDetailOrFallback('missing-id', 1, async () => Promise.reject(new Error('offline')))
assert.equal(unknown.detailAvailable, false)
assert.equal(unknown.monster, null)

console.log('Monster master mutation tests OK')
