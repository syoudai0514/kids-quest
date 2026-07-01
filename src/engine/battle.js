// ============================================================
// バトルエンジン（属性の三すくみ）
//
// ねらいは「考えて選ぶと強い」という体験。
//   🔥ほのお は 🌿くさ に つよい
//   🌿くさ  は 💧みず に つよい
//   💧みず  は 🔥ほのお に つよい
//   ⭐ほし  は どれにも ふつう（安定択）
// 5歳が3すくみを推論できるよう、相手の属性は常に表示し、
// 効果は音声でも「こうか ばつぐん！」と伝える。
// ============================================================

export const TYPES = {
  hi: { emoji: '🔥', name: 'ほのお' },
  mizu: { emoji: '💧', name: 'みず' },
  kusa: { emoji: '🌿', name: 'くさ' },
  hoshi: { emoji: '⭐', name: 'ほし' }
}

const BEATS = { hi: 'kusa', kusa: 'mizu', mizu: 'hi' }

// モンスターの element（20種）を4属性に割り当てる
const ELEMENT_TYPE = {
  'マグマ': 'hi', 'たいよう': 'hi', 'ほのお': 'hi', 'でんき': 'hi', 'かざん': 'hi',
  'みず': 'mizu', 'こおり': 'mizu', 'ゆき': 'mizu', 'うみ': 'mizu',
  'くさ': 'kusa', 'みどり': 'kusa', 'はな': 'kusa', 'すな': 'kusa', 'きょうりゅう': 'kusa'
}

export function typeOfElement(element) {
  return ELEMENT_TYPE[element] || 'hoshi'
}

/** 攻撃属性 a → 防御属性 d の倍率 */
export function effectiveness(a, d) {
  if (a === 'hoshi' || d === 'hoshi') return 1
  if (BEATS[a] === d) return 1.5
  if (BEATS[d] === a) return 0.6
  return 1
}

export function effectLabel(mult) {
  if (mult > 1) return 'こうか ばつぐん！'
  if (mult < 1) return 'うーん、いまひとつ…'
  return null
}

// 相棒のわざ（属性がそれぞれ違う＝選ぶ意味がある）
export const PARTNER_MOVES = [
  { name: 'ほしビーム', type: 'hoshi', emoji: '⭐', min: 12, max: 17 },
  { name: 'もえるパンチ', type: 'hi', emoji: '🔥', min: 8, max: 19 },
  { name: 'みずしゅりけん', type: 'mizu', emoji: '💧', min: 8, max: 19 },
  { name: 'このはカッター', type: 'kusa', emoji: '🌿', min: 8, max: 19 }
]

export function rollDamage(move, enemyType) {
  const base = Math.floor(move.min + Math.random() * (move.max - move.min + 1))
  const mult = effectiveness(move.type, enemyType)
  return { dmg: Math.max(1, Math.round(base * mult)), mult }
}

// 5歳が「だいたい勝てる」バランス。敵は累計クリアでゆるやかに強く。
export function enemyMaxHp(totalClears) {
  return 38 + Math.min(30, totalClears)
}
export function partnerMaxHp(level) {
  return 54 + level * 4
}
export function enemyDamage() {
  return Math.floor(5 + Math.random() * 7) // 5〜11
}
