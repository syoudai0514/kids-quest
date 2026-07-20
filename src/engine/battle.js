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
//
// v2: 敵にも「レベル」を導入し、相棒のレベルに追従して強くなり続ける
// （以前は総クリア数で最大+30止まりで、遊ぶほど簡単になっていた）。
// さらに「つよい てき（elite）」がときどき出現し、属性を正しく選ばないと
// 本当に負けることがある「本気の戦い」を用意した。相棒の わざも
// レベルに応じて強くなり、たまに会心の一撃も出る。
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

// 会心の一撃（たまに大ダメージ。えらぶ楽しさに「運」も少し足す）
const CRIT_CHANCE = 0.08
const CRIT_MULT = 1.5

export function rollDamage(move, enemyType, partnerLv = 1) {
  // レベルが上がるほど わざも強くなる（相棒の成長を実感できるように）
  const growth = 1 + partnerLv * 0.022
  const base = Math.floor((move.min + Math.random() * (move.max - move.min + 1)) * growth)
  const mult = effectiveness(move.type, enemyType)
  const crit = Math.random() < CRIT_CHANCE
  const dmg = Math.max(1, Math.round(base * mult * (crit ? CRIT_MULT : 1)))
  return { dmg, mult, crit }
}

// 敵のレベル: 相棒のレベルに合わせて上下（±1）。強敵(elite)は さらに +1〜+3。
// → 頭打ちがなく、遊ぶほど手ごたえが続く（以前は総クリア数で最大+30止まりだった）
export function enemyLevelFor(partnerLv, elite = false) {
  const variance = Math.floor(Math.random() * 3) - 1
  let lvl = Math.max(1, partnerLv + variance)
  if (elite) lvl += 1 + Math.floor(Math.random() * 3)
  return lvl
}

// 5〜12歳が「かんがえて選べば だいたい勝てる」バランス。
// 通常戦はレベルが上がるほど手ごたえのある戦い（ターン数が増える）に、
// 強敵(elite)戦は属性を正しく選ばないと本当に負けることがある「本気の相手」。
export function enemyMaxHp(enemyLevel, elite = false) {
  const base = 24 + enemyLevel * 5.2
  return Math.round(elite ? base * 1.35 : base)
}
export function partnerMaxHp(level) {
  return 58 + level * 6
}
export function enemyDamage(enemyLevel, elite = false) {
  const base = 3 + enemyLevel * 0.75
  const mn = Math.max(2, Math.round(base - 2))
  const mx = Math.round(base + (elite ? 4 : 3))
  return Math.floor(mn + Math.random() * (mx - mn + 1))
}
