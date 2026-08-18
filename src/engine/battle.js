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

// モンスターの element（20種）を4属性に割り当てる。
// v3: 以前は未割り当ての element が すべて「ほし」に落ちて 4割が ほし になり、
// 「どの わざも同じ」＝相性を考える意味のない戦いが多発していた。
// すべての element に属性を持たせ、ほし は 25%程度の「特別枠」に。
const ELEMENT_TYPE = {
  'マグマ': 'hi', 'たいよう': 'hi', 'ほのお': 'hi', 'でんき': 'hi', 'かざん': 'hi',
  'みず': 'mizu', 'こおり': 'mizu', 'ゆき': 'mizu', 'うみ': 'mizu', 'そら': 'mizu', 'やみ': 'mizu',
  'くさ': 'kusa', 'みどり': 'kusa', 'はな': 'kusa', 'すな': 'kusa', 'きょうりゅう': 'kusa', 'いわ': 'kusa',
  'ほし': 'hoshi', 'つき': 'hoshi', 'ぎんが': 'hoshi', 'にじ': 'hoshi', 'うちゅう': 'hoshi'
}

export function typeOfElement(element) {
  return ELEMENT_TYPE[element] || 'hoshi'
}

/** 攻撃属性 a → 防御属性 d の倍率
 *  ほし どうしは「ばつぐん」にして、どの敵にも かならず正解の わざがある形に。
 *  （＝ 考えて選べば いつでも報われる） */
export function effectiveness(a, d) {
  if (a === 'hoshi' && d === 'hoshi') return 1.5
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
const CRIT_CHANCE = 0.06
const CRIT_MULT = 1.5

// 武器の数字は「強くなった実感」を出すための表示用の元データ。
// そのまま全量を足すと、レア武器を1本取った時点で属性を考えなくても
// 倒せてしまうため、実戦で使うぶんは小さく丸める。
export function battleAttackBonus(weapon) {
  return weapon ? Math.max(1, Math.round((weapon.atk || 0) * 0.25)) : 0
}

export function battleHpBonus(weapon) {
  return weapon ? Math.max(0, Math.round((weapon.hp || 0) * 0.35)) : 0
}

/** わざのダメージ。そうびの こうげき力(weapon.atk)が そのまま のる。
 *  → 良い武器を そうびすると少し有利。ただし属性を選ぶ方が大事。 */
export function moveAffinityMultiplier(moveType, companionType) {
  return moveType && companionType && moveType === companionType ? 1.25 : 1
}

export function rollDamage(move, enemyType, partnerLv = 1, weapon = null, attackBonus = 0, companionType = null) {
  // レベルが上がるほど わざも強くなる（相棒の成長を実感できるように）
  const growth = 1 + partnerLv * 0.018
  const base =
    Math.floor((move.min + Math.random() * (move.max - move.min + 1)) * growth) +
    battleAttackBonus(weapon) + Math.max(0, Math.floor(attackBonus || 0))
  const mult = effectiveness(move.type, enemyType)
  const affinityMult = moveAffinityMultiplier(move.type, companionType)
  const crit = Math.random() < CRIT_CHANCE
  const dmg = Math.max(1, Math.round(base * mult * affinityMult * (crit ? CRIT_MULT : 1)))
  return { dmg, mult, affinityMult, crit }
}

// 敵のレベル: 相棒のレベルより ややゆっくり上がる（×0.85）。
// v3: 以前は 敵レベル＝相棒レベル で「いたちごっこ」になり、
// レベルを上げても強くなった実感がゼロだった。少し引き離すことで、
// 成長＋そうびが ちゃんと効いてくる形にする。強敵(elite)は +2〜+4。
export function enemyLevelFor(partnerLv, elite = false) {
  const variance = Math.floor(Math.random() * 3) - 1
  let lvl = Math.max(1, Math.round(partnerLv * 0.85) + variance)
  if (elite) lvl += 2 + Math.floor(Math.random() * 3)
  // 相棒より上げすぎない。はじめたばかりの子が いきなり格上と当たって
  // 心が折れるのを防ぐ（レベルが上がれば この上限には ほぼ当たらない）
  return Math.max(1, Math.min(lvl, partnerLv + 3))
}

// つよい てき が出はじめるレベル（序盤は やさしく成功体験を積ませる）
export const ELITE_MIN_LEVEL = 4

// 「そうびを ととのえて 考えて選べば 気持ちよく勝てる」バランス。
// 武器なしだと 高レベルでは 苦戦する（＝武器をあつめる動機になる）。
export function enemyMaxHp(enemyLevel, elite = false) {
  // 有利属性なら2回前後、等倍なら3〜4回で倒せる目安。
  const base = 36 + enemyLevel * 4
  return Math.round(elite ? base * 1.28 : base)
}
export function partnerMaxHp(level, weapon = null, hpBonus = 0) {
  return Math.max(36, 58 + level * 6 + battleHpBonus(weapon) + Math.round(hpBonus || 0))
}
export function enemyDamage(enemyLevel, elite = false) {
  const base = 3 + enemyLevel * 0.65
  const mn = Math.max(2, Math.round(base - 2))
  const mx = Math.round(base + (elite ? 4 : 3))
  return Math.floor(mn + Math.random() * (mx - mn + 1))
}
