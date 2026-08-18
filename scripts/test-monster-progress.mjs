import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { MONSTERS } from '../src/data/monsters.js'
import {
  catchCompanion,
  companionForMonster,
  companionBattleStats,
  companionIdFor,
  companionLevel,
  createCompanion,
  consumeStarGauge,
  evolveCompanion,
  formStatus,
  grantBattleResult,
  grantLearningAnswerXp,
  grantLearningTaskXp,
  normalizeMonsterProgress,
  movePartyCompanion,
  setActiveCompanion,
  togglePartyCompanion,
  unlockForm,
  xpForLevel
} from '../src/engine/monsterProgress.js'
import { moveAffinityMultiplier, partnerMaxHp } from '../src/engine/battle.js'
import { releasedMonsterFormAsset, releasedMonsterFullAsset } from '../src/data/monsterAssets.js'

// GameContext contains JSX, so this small source-level regression tripwire
// keeps SET_GRADE from ever falling through into the ANSWER reducer branch.
const gameContextSource = await readFile(new URL('../src/state/GameContext.jsx', import.meta.url), 'utf8')
assert.match(gameContextSource, /case 'SET_GRADE':[\s\S]*?return next\s*\n\s*}\s*\n\s*\/\/ 1問の回答結果/)

const oldSave = {
  version: 3,
  createdAt: 123456,
  xp: xpForLevel(12),
  unlockedMonsters: ['hoshu', 'g042', 'g052', 'unknown-old-id'],
  battle: { tickets: 2, ticketGrants: [{ earnedOn: '2026-08-10', expiresOn: '2026-08-17' }] },
  srs: { suuji: { a: { box: 2, due: 123 } } },
  englishWordStats: { apple: { box: 1 } },
  grade: 2,
  streak: 7
}

const migrated = normalizeMonsterProgress(oldSave)
assert.equal(migrated.version, 3)
assert.equal(migrated.battle, oldSave.battle)
assert.equal(migrated.srs, oldSave.srs)
assert.equal(migrated.englishWordStats, oldSave.englishWordStats)
assert.equal(migrated.grade, 2)
assert.equal(migrated.streak, 7)
assert.ok(migrated.unlockedMonsters.includes('unknown-old-id'))
assert.equal(companionForMonster(migrated, 'unknown-old-id'), null)
assert.equal(migrated.party.length, 3)
assert.equal(migrated.companions[companionIdFor('hoshu')].xp, oldSave.xp)
assert.equal(companionLevel(migrated.companions[companionIdFor('g042')].xp), 9)
assert.deepEqual(normalizeMonsterProgress(migrated), migrated, 'migration must be idempotent')
assert.equal(normalizeMonsterProgress({ ...oldSave, version: 4 }).version, 3, 'an early v4 growth save must roll back to the public v3 envelope')
assert.ok(releasedMonsterFullAsset('g042'), 'release pilot uses generated full artwork')
assert.equal(releasedMonsterFullAsset('g054'), null, 'unreleased catalogue entries keep their existing artwork')
assert.equal(releasedMonsterFormAsset({ id: 'awakening-g052', asset: '/monsters/forms/g052-awakening.webp' }), '/monsters/forms/g052-awakening.webp')
assert.equal(releasedMonsterFormAsset({ id: 'awakening-g054', asset: '/monsters/forms/g054-awakening.webp' }), null, 'unreleased forms keep their normal monster artwork')

const originalParty = [...migrated.party]
const reordered = movePartyCompanion(migrated, originalParty[1], 'forward')
assert.deepEqual(reordered.party, [originalParty[1], originalParty[0], originalParty[2]], 'party order can be changed without changing companion IDs')
assert.deepEqual(movePartyCompanion(reordered, originalParty[1], 'forward').party, reordered.party, 'first party member cannot move beyond the front')
assert.equal(moveAffinityMultiplier('mizu', 'mizu'), 1.25, 'a monster gets a bonus for its own type move')
assert.equal(moveAffinityMultiplier('mizu', 'kusa'), 1, 'off-type moves stay usable without a same-type bonus')
const g042Stats = companionBattleStats(migrated.companions[companionIdFor('g042')])
assert.ok(g042Stats.attack > 0 && partnerMaxHp(1, null, g042Stats.hpBonus) > 0, 'derived battle stats are safe for existing companions')

let state = grantLearningAnswerXp(migrated, { xpGain: 2, domainId: 'suuji', dayKey: '2026-08-16' })
const activeId = state.activeCompanionId
assert.equal(state.companions[activeId].xp, migrated.companions[activeId].xp + 2)
assert.equal(state.companions[state.party[1]].xp, migrated.companions[state.party[1]].xp + 1)
state = grantLearningTaskXp(state, { kind: 'core', domainId: 'suuji', dayKey: '2026-08-16', correctCount: 4, rewardKey: 'task-1' })
assert.equal(state.starGauge, 20)
assert.equal(state.companions[activeId].trainedDays, 1)
const afterTask = state
state = grantLearningTaskXp(state, { kind: 'core', domainId: 'suuji', dayKey: '2026-08-16', correctCount: 4, rewardKey: 'task-1' })
assert.deepEqual(state, afterTask, 'same learning reward key must not pay twice')

const beforeSuspicious = state
state = grantLearningTaskXp(state, { kind: 'extra', domainId: 'suuji', dayKey: '2026-08-16', correctCount: 1, suspicious: true, rewardKey: 'extra-bad' })
assert.equal(state.companions[activeId].xp, beforeSuspicious.companions[activeId].xp, 'suspicious extra task must grant no monster XP')
assert.equal(state.starGauge, beforeSuspicious.starGauge, 'suspicious extra task must grant no star gauge')

const beforeValidExtraXp = state.companions[activeId].xp
state = grantLearningTaskXp(state, { kind: 'extra', domainId: 'suuji', dayKey: '2026-08-16', correctCount: 2, rewardKey: 'extra-good' })
assert.equal(state.companions[activeId].xp, beforeValidExtraXp + 10, 'valid extra task grants completion XP plus deferred answer XP')

const g042Id = companionIdFor('g042')
state = setActiveCompanion(state, g042Id)
assert.equal(state.activeCompanionId, g042Id)
state = togglePartyCompanion(state, state.party.find((id) => id !== g042Id))
assert.ok(state.party.length >= 1 && state.party.length <= 3)

state = {
  ...state,
  companions: {
    ...state.companions,
    [g042Id]: {
      ...state.companions[g042Id],
      xp: xpForLevel(8),
      trainedDays: 3,
      trainedDayKeys: ['1', '2', '3'],
      domainMask: 3
    }
  }
}
state = evolveCompanion(state, g042Id)
assert.equal(state.companions[g042Id].currentMonsterId, 'g043')
assert.ok(state.unlockedMonsters.includes('g043'))

const g052Id = companionIdFor('g052')
state = {
  ...state,
  defeatedBossIds: ['g053'],
  companions: {
    ...state.companions,
    [g052Id]: {
      ...state.companions[g052Id],
      xp: xpForLevel(30),
      trainedDays: 30,
      trainedDayKeys: Array.from({ length: 30 }, (_, index) => String(index)),
      domainMask: 31
    }
  }
}
assert.equal(formStatus(state, g052Id, 'awakening').ready, true)
state = unlockForm(state, g052Id, 'awakening')
assert.ok(state.companions[g052Id].unlockedFormIds.includes('awakening-g052'))

const beforeBattleXp = state.companions[state.activeCompanionId].xp
state = grantBattleResult(state, { won: true, enemyId: 'g053', elite: true })
assert.equal(state.companions[state.activeCompanionId].xp, beforeBattleXp + 3)
assert.ok(state.companions[state.activeCompanionId].winTags.includes('elite-win'))
assert.ok(state.defeatedBossIds.includes('g053'))

const caught = catchCompanion(state, 'g053')
assert.ok(companionForMonster(caught, 'g053'))
assert.ok(caught.party.length <= 3)

const [g053Id] = companionForMonster(caught, 'g053')
state = {
  ...caught,
  starGauge: 100,
  companions: {
    ...caught.companions,
    [g053Id]: {
      ...caught.companions[g053Id],
      xp: xpForLevel(40),
      trainedDays: 60,
      trainedDayKeys: Array.from({ length: 60 }, (_, index) => String(index)),
      domainMask: 31
    }
  }
}
assert.equal(formStatus(state, g053Id, 'giga').ready, true)
state = unlockForm(state, g053Id, 'giga')
assert.ok(state.companions[g053Id].unlockedFormIds.includes('giga-g053'))
const g053AtLevel8 = createCompanion('g053', xpForLevel(8))
const g053AfterLevelUp = normalizeMonsterProgress({
  version: 3,
  unlockedMonsters: ['hoshu', 'g053'],
  companions: { [companionIdFor('g053')]: { ...g053AtLevel8, xp: xpForLevel(12) } }
})
assert.ok(g053AfterLevelUp.companions[companionIdFor('g053')].selectedMoveIds.includes('signature-g053'), 'an existing level 8 companion equips its signature move when it reaches level 12')
state = consumeStarGauge(state)
assert.equal(state.starGauge, 0, 'using a form consumes a full star gauge')

const allCaught = normalizeMonsterProgress({ version: 3, createdAt: 1, xp: 0, unlockedMonsters: MONSTERS.map((monster) => monster.id) })
const bytes = Buffer.byteLength(JSON.stringify(allCaught))
assert.ok(bytes < 750 * 1024, `1000 companion save is too large: ${bytes} bytes`)

console.log(`monster progress: PASS (${bytes} bytes for 1000 companions)`)
