import assert from 'node:assert/strict'
import { migrateManaEvoState, beginEncounter, winEncounter, resolveCapture, addBossProgress, canChallengeBoss, defeatBoss, explore, transformedHp } from '../src/engine/manaEvo.js'
const today = '2026-08-20'
let s = migrateManaEvoState({ version: 3, battle: { tickets: 2 } }, today)
assert.equal(s.battle.tickets, 2); assert.equal(migrateManaEvoState(s, today).battle.tickets, 2)
s = beginEncounter(s, { id: 'e1', monsterId: 'g001' }); const before = s.battle.tickets
s = winEncounter(s, today, 'r1'); assert.equal(s.battle.tickets, before - 1); assert.equal(s.battle.encounters.active.status, 'CAPTURE')
assert.equal(winEncounter(s, today, 'r1').battle.tickets, s.battle.tickets)
s = resolveCapture(s, { success: false }); s = resolveCapture(s, { success: false }); assert.equal(s.battle.encounters.active.status, 'CAPTURE'); s = resolveCapture(s, { success: false }); assert.equal(s.battle.encounters.active.status, 'RESOLVED')
s = addBossProgress(s, 'region-1', { points: 12, skillId: 'math' }); s = addBossProgress(s, 'region-1', { skillId: 'reading' }); assert.ok(canChallengeBoss(s, 'region-1')); s = defeatBoss(s, 'region-1'); assert.ok(s.adventure.unlockedRegions.includes('region-2')); assert.equal(s.adventure.areaBossProgress['region-2'].points, 0)
s = { ...s, adventure: { ...s.adventure, explorationPoints: 30, explorationPityMissesByArea: { 'region-1': 5 } } }; s = explore(s, 'region-1', { pityChoice: true }); assert.equal(s.adventure.explorationPityMissesByArea['region-1'], 0)
assert.deepEqual(transformedHp({ currentHp: 50, maxHp: 100, kind: 'burst' }), { currentHp: 100, maxHp: 200 }); assert.deepEqual(transformedHp({ currentHp: 0, maxHp: 200, kind: 'burst', ending: true }), { currentHp: 0, maxHp: 100 })
console.log('ManaEvo state tests passed')
