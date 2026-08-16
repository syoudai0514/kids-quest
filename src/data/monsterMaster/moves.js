import { MONSTER_BY_ID } from '../monsters.js'
import { typeOfElement } from '../../engine/battle.js'
import { BOSS_IDS, SIGNATURE_HOLDER_IDS } from './targets.js'

const SHARED_NAMES = Object.freeze({
  hi: ['ひのこ', 'ほのおパンチ', 'フレアボール', 'マグマキック', 'ほのおガード', 'ひだまり', 'あついエール', 'かそくのほのお', 'フレアシールド', 'たいようのいやし', 'もえるこころ', 'あつさをみやぶる'],
  mizu: ['みずでっぽう', 'あわパンチ', 'しおなみ', 'こおりスプラッシュ', 'みずガード', 'いやしのしずく', 'なみのエール', 'しぶきダッシュ', 'こおりのかべ', 'うるおい', 'しずかなこころ', 'ながれをみやぶる'],
  kusa: ['このは', 'つるパンチ', 'はっぱカッター', 'だいちキック', 'くさガード', 'いやしのつぼみ', 'もりのエール', 'かぜのはっぱ', 'つるのかべ', 'もりのいやし', 'そだつこころ', 'ねっこをみやぶる'],
  hoshi: ['ほしつぶ', 'ほしパンチ', 'スターライン', 'ぎんがビーム', 'ほしガード', 'つきのひかり', 'きらきらエール', 'すいせいダッシュ', 'ほしのかべ', 'ぎんがのいやし', 'ひかるこころ', 'きらめきをみやぶる']
})

const SHARED_PROFILES = Object.freeze([
  { category: 'attack', power: 18, priority: 0, target: 'enemy', effect: { kind: 'damage', scale: 1 } },
  { category: 'attack', power: 22, priority: 0, target: 'enemy', effect: { kind: 'damage', scale: 1 } },
  { category: 'attack', power: 26, priority: 0, target: 'enemy', effect: { kind: 'damage', scale: 1 } },
  { category: 'attack', power: 30, priority: -1, target: 'enemy', effect: { kind: 'damage', scale: 1 } },
  { category: 'guard', power: 0, priority: 1, target: 'self', effect: { kind: 'guard', reduction: 0.35, turns: 1 } },
  { category: 'heal', power: 0, priority: 0, target: 'self', effect: { kind: 'heal', ratio: 0.18 } },
  { category: 'support', power: 0, priority: 0, target: 'ally', effect: { kind: 'buff', stat: 'attack', amount: 0.12, turns: 2 } },
  { category: 'support', power: 0, priority: 1, target: 'self', effect: { kind: 'buff', stat: 'speed', amount: 0.15, turns: 2 } },
  { category: 'guard', power: 0, priority: 1, target: 'self', effect: { kind: 'guard', reduction: 0.5, turns: 1 } },
  { category: 'heal', power: 0, priority: -1, target: 'ally', effect: { kind: 'heal', ratio: 0.25 } },
  { category: 'support', power: 0, priority: 0, target: 'ally', effect: { kind: 'buff', stat: 'guard', amount: 0.15, turns: 2 } },
  { category: 'support', power: 0, priority: 0, target: 'enemy', effect: { kind: 'expose', multiplier: 1.2, turns: 1 } }
])

function sharedMove(type, index) {
  const profile = SHARED_PROFILES[index]
  return Object.freeze({
    id: `shared-${type}-${String(index + 1).padStart(2, '0')}`,
    name: SHARED_NAMES[type][index],
    battleType: type,
    ...profile,
    effect: Object.freeze({ ...profile.effect }),
    description: profile.category === 'attack'
      ? `${SHARED_NAMES[type][index]}で こうげきする。`
      : `${SHARED_NAMES[type][index]}で たたかいを たすける。`,
    animationKey: `${type}-${profile.category}`,
    sfxKey: profile.category
  })
}

export const SHARED_MOVES = Object.freeze(
  Object.keys(SHARED_NAMES).flatMap((type) => SHARED_NAMES[type].map((_, index) => sharedMove(type, index)))
)

export const SHARED_MOVE_IDS_BY_TYPE = Object.freeze(Object.fromEntries(
  Object.keys(SHARED_NAMES).map((type) => [
    type,
    Object.freeze(SHARED_MOVES.filter((move) => move.battleType === type).map((move) => move.id))
  ])
))

const SPECIAL_SIGNATURES = Object.freeze({
  g044: { name: 'ダークオービット', category: 'attack', power: 40, effect: { kind: 'damage', scale: 1.15 } },
  g047: { name: 'りゅうせいジェル', category: 'attack', power: 42, effect: { kind: 'damage', scale: 1.2 } },
  g051: { name: 'ゆきいわガード', category: 'guard', power: 0, effect: { kind: 'guard', reduction: 0.6, turns: 1 } },
  g052: { name: 'にじうつし', category: 'support', power: 0, target: 'self', effect: { kind: 'reflect', ratio: 0.35, turns: 1 } },
  g053: { name: 'コズミックウイング', category: 'attack', power: 40, effect: { kind: 'damage', scale: 1.15 } }
})

function signatureMove(monsterId, index) {
  const monster = MONSTER_BY_ID[monsterId]
  const special = SPECIAL_SIGNATURES[monsterId]
  const category = special?.category ?? (index % 9 === 0 ? 'support' : 'attack')
  const effect = special?.effect ?? (category === 'attack'
    ? { kind: 'damage', scale: 1.1 }
    : { kind: 'buff', stat: 'attack', amount: 0.18, turns: 2 })
  const target = special?.target ?? (category === 'attack' ? 'enemy' : category === 'support' ? 'ally' : 'self')
  const name = special?.name ?? `${monster.name}のきらめき`
  return Object.freeze({
    id: `signature-${monsterId}`,
    name,
    battleType: typeOfElement(monster.element),
    category,
    power: special?.power ?? (category === 'attack' ? 36 : 0),
    priority: category === 'guard' ? 1 : 0,
    target,
    effect: Object.freeze({ ...effect }),
    description: category === 'attack' ? `${monster.name}だけの とくべつな こうげき。` : `${monster.name}だけの とくべつな ちから。`,
    animationKey: `signature-${typeOfElement(monster.element)}`,
    sfxKey: 'signature'
  })
}

export const SIGNATURE_MOVES = Object.freeze(SIGNATURE_HOLDER_IDS.map(signatureMove))

function bossMove(monsterId, index) {
  const monster = MONSTER_BY_ID[monsterId]
  const name = monsterId === 'g053' ? 'ビッグバンストーム' : `${monster.name}のだいひっさつ`
  return Object.freeze({
    id: `boss-${monsterId}`,
    name,
    battleType: typeOfElement(monster.element),
    category: 'attack',
    power: index < 9 ? 42 : index < 27 ? 44 : 46,
    priority: -1,
    target: 'enemy',
    effect: Object.freeze({ kind: 'damage', scale: 1.2 }),
    enemyTuning: Object.freeze({ powerMultiplier: index < 27 ? 1.12 : 1.15 }),
    telegraph: Object.freeze({ message: 'つよい こうげきが くるよ！', icon: '⚠️' }),
    description: 'まえの ターンに しらせてから くりだす おおわざ。',
    animationKey: 'boss-burst',
    sfxKey: 'boss-warning'
  })
}

export const BOSS_MOVES = Object.freeze(BOSS_IDS.map(bossMove))

export const MOVE_MASTER = Object.freeze([
  ...SHARED_MOVES,
  ...SIGNATURE_MOVES,
  ...BOSS_MOVES
])

export const MOVE_BY_ID = Object.freeze(Object.fromEntries(MOVE_MASTER.map((move) => [move.id, move])))

export const MOVE_MASTER_COUNTS = Object.freeze({
  shared: 48,
  signature: 120,
  boss: 36,
  total: 204
})
