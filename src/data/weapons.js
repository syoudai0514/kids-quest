// ============================================================
// 武器（そうび）— 「まなぶと つよくなる」を形にする収集要素
//
// ねらい:
//   ・バトルの勝利や べんきょうの クリアで 武器が てにはいる
//   ・そうびすると こうげき力・たいりょくが 上がり、
//     「レベルが上がった」だけでなく「強くなった」を目に見える形にする
//   ・44しゅるいを あつめる たのしみ（ずかんと同じ収集のよろこび）
//
// レアリティ: ふつう → レア → スーパーレア → でんせつ
// ============================================================

export const RARITIES = {
  common: { key: 'common', name: 'ふつう', color: '#cfe3f5', glow: 'rgba(207,227,245,0.5)', stars: 1 },
  rare: { key: 'rare', name: 'レア', color: '#7ac9f0', glow: 'rgba(122,201,240,0.65)', stars: 2 },
  sr: { key: 'sr', name: 'スーパーレア', color: '#c9a4ff', glow: 'rgba(201,164,255,0.75)', stars: 3 },
  legend: { key: 'legend', name: 'でんせつ', color: '#ffd166', glow: 'rgba(255,209,102,0.85)', stars: 4 }
}

// atk = こうげき力アップ / hp = さいだいたいりょくアップ
export const WEAPONS = [
  // ---- ふつう ----
  { id: 'w01', name: 'ほしのかけら', emoji: '✨', rarity: 'common', atk: 4, hp: 2 },
  { id: 'w02', name: 'きのぼう', emoji: '🪵', rarity: 'common', atk: 3, hp: 3 },
  { id: 'w03', name: 'いしのナイフ', emoji: '🔪', rarity: 'common', atk: 5, hp: 0 },
  { id: 'w04', name: 'つきのつえ', emoji: '🌙', rarity: 'common', atk: 4, hp: 3 },
  { id: 'w05', name: 'どんぐりバット', emoji: '🌰', rarity: 'common', atk: 5, hp: 1 },
  { id: 'w06', name: 'はっぱのむち', emoji: '🍃', rarity: 'common', atk: 4, hp: 2 },
  { id: 'w07', name: 'こおりのつぶて', emoji: '❄️', rarity: 'common', atk: 5, hp: 1 },
  { id: 'w08', name: 'ひのこハンマー', emoji: '🔨', rarity: 'common', atk: 6, hp: 0 },
  { id: 'w09', name: 'しゃぼんステッキ', emoji: '🫧', rarity: 'common', atk: 3, hp: 5 },
  { id: 'w10', name: 'すなのやり', emoji: '⏳', rarity: 'common', atk: 6, hp: 1 },
  { id: 'w11', name: 'かいがらのたて', emoji: '🐚', rarity: 'common', atk: 3, hp: 6 },
  { id: 'w12', name: 'たけのこソード', emoji: '🎋', rarity: 'common', atk: 6, hp: 2 },
  { id: 'w13', name: 'でんきゅうロッド', emoji: '💡', rarity: 'common', atk: 7, hp: 0 },
  { id: 'w14', name: 'ゆきのつるぎ', emoji: '⛄', rarity: 'common', atk: 6, hp: 3 },
  { id: 'w15', name: 'きらきらリング', emoji: '💫', rarity: 'common', atk: 5, hp: 4 },
  { id: 'w16', name: 'ふうせんメイス', emoji: '🎈', rarity: 'common', atk: 4, hp: 5 },

  // ---- レア ----
  { id: 'w17', name: 'コメットソード', emoji: '☄️', rarity: 'rare', atk: 12, hp: 4 },
  { id: 'w18', name: 'ぎんがブレード', emoji: '🌌', rarity: 'rare', atk: 11, hp: 6 },
  { id: 'w19', name: 'マグマアックス', emoji: '🌋', rarity: 'rare', atk: 13, hp: 5 },
  { id: 'w20', name: 'アクアトライデント', emoji: '🔱', rarity: 'rare', atk: 11, hp: 7 },
  { id: 'w21', name: 'フォレストボウ', emoji: '🏹', rarity: 'rare', atk: 10, hp: 8 },
  { id: 'w22', name: 'サンダースピア', emoji: '⚡', rarity: 'rare', atk: 14, hp: 4 },
  { id: 'w23', name: 'オーロラワンド', emoji: '🌈', rarity: 'rare', atk: 10, hp: 9 },
  { id: 'w24', name: 'クリスタルソード', emoji: '💎', rarity: 'rare', atk: 12, hp: 6 },
  { id: 'w25', name: 'ドラゴンのつめ', emoji: '🐉', rarity: 'rare', atk: 13, hp: 6 },
  { id: 'w26', name: 'ロケットパンチ', emoji: '🚀', rarity: 'rare', atk: 12, hp: 8 },
  { id: 'w27', name: 'ムーンサイズ', emoji: '🌜', rarity: 'rare', atk: 11, hp: 7 },
  { id: 'w28', name: 'サンフレイム', emoji: '🔥', rarity: 'rare', atk: 13, hp: 5 },
  { id: 'w29', name: 'アイスランス', emoji: '🧊', rarity: 'rare', atk: 12, hp: 7 },
  { id: 'w30', name: 'まなびのペン', emoji: '✏️', rarity: 'rare', atk: 10, hp: 10 },

  // ---- スーパーレア ----
  { id: 'w31', name: 'スターセイバー', emoji: '⭐', rarity: 'sr', atk: 20, hp: 12 },
  { id: 'w32', name: 'ギャラクシーハンマー', emoji: '🛠️', rarity: 'sr', atk: 22, hp: 10 },
  { id: 'w33', name: 'ノヴァキャノン', emoji: '💥', rarity: 'sr', atk: 23, hp: 10 },
  { id: 'w34', name: 'ティラノファング', emoji: '🦖', rarity: 'sr', atk: 21, hp: 13 },
  { id: 'w35', name: 'ポセイドンのほこ', emoji: '🌊', rarity: 'sr', atk: 19, hp: 16 },
  { id: 'w36', name: 'ワールドツリー', emoji: '🌳', rarity: 'sr', atk: 18, hp: 18 },
  { id: 'w37', name: 'プラズマブレード', emoji: '⚔️', rarity: 'sr', atk: 22, hp: 12 },
  { id: 'w38', name: 'ブラックホール', emoji: '🕳️', rarity: 'sr', atk: 23, hp: 11 },
  { id: 'w39', name: 'フェニックスのつばさ', emoji: '🦅', rarity: 'sr', atk: 19, hp: 17 },
  { id: 'w40', name: 'ちしきのほん', emoji: '📚', rarity: 'sr', atk: 18, hp: 20 },

  // ---- でんせつ ----
  { id: 'w41', name: 'エクスカリバー', emoji: '👑', rarity: 'legend', atk: 30, hp: 25 },
  { id: 'w42', name: 'うちゅうのつるぎ', emoji: '🪐', rarity: 'legend', atk: 34, hp: 22 },
  { id: 'w43', name: 'ひかりのやいば', emoji: '🌞', rarity: 'legend', atk: 32, hp: 26 },
  { id: 'w44', name: 'そうぞうのペン', emoji: '🖋️', rarity: 'legend', atk: 28, hp: 30 }
]

export const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map((w) => [w.id, w]))

export function getWeapon(id) {
  return id ? WEAPON_BY_ID[id] || null : null
}

// 強さのめやす（そうびの比較・自動そうびに使う）
export function weaponScore(w) {
  return w ? w.atk * 2 + w.hp : 0
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// レベルが上がるほど 良い武器が出やすくなる（つよい てき は さらに good）
//
// v2: 以前は elite補正で どのレベル帯でも一律 legend+5% していたため、
// レベルが低いうち（本来 legend が出ないはずの帯）でも「でんせつ」が
// 出てしまっていた（＝1日目で最強装備が出る不具合）。
// いまは「各レアリティの一部を1段階だけ格上げする」方式にして、
// まだ そのレアリティに 到達していない帯では 格上げ先も 0 のままに なる
// ようにした（例: legendが0の帯では、格上げ元のsrも0なので legendも0）。
function rarityWeights(partnerLv, elite) {
  let w
  if (partnerLv < 8) w = { common: 85, rare: 15, sr: 0, legend: 0 }
  else if (partnerLv < 16) w = { common: 55, rare: 38, sr: 7, legend: 0 }
  else if (partnerLv < 25) w = { common: 30, rare: 45, sr: 23, legend: 2 }
  else w = { common: 12, rare: 40, sr: 40, legend: 8 }
  if (elite) {
    const order = ['common', 'rare', 'sr', 'legend']
    const shifted = { common: 0, rare: 0, sr: 0, legend: 0 }
    const SHIFT = 0.3 // それぞれの3割ぶんを1段階 格上げ
    order.forEach((key, i) => {
      const amt = w[key] * SHIFT
      const upKey = order[Math.min(i + 1, order.length - 1)]
      shifted[key] += w[key] - amt
      shifted[upKey] += amt
    })
    w = shifted
  }
  return w
}

function rollRarity(partnerLv, elite) {
  const w = rarityWeights(partnerLv, elite)
  const total = Object.values(w).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const [key, val] of Object.entries(w)) {
    r -= val
    if (r <= 0) return key
  }
  return 'common'
}

// 武器は勝利のたびにランダムで落とさない。幼い子には「いつ出るか分からない」より
// 「ここまで続けたら宝箱」が分かる方が、学習の継続理由になりやすいため。
// 最初の5本は活動日ごとに確定。以降は3活動日ごと → 週2本程度へゆるやかにする。
export function weaponAwardsDue(activityDays) {
  if (activityDays <= 0) return 0
  if (activityDays <= 5) return activityDays
  const throughThirty = 5 + Math.floor(Math.max(0, Math.min(activityDays, 30) - 8) / 3) + (activityDays >= 8 ? 1 : 0)
  if (activityDays <= 30) return throughThirty
  return throughThirty + Math.floor(((activityDays - 30) * 2) / 7)
}

function unlockedRarities({ activityDays, eliteWins = 0, chapterPassed = false, ownedIds = [] }) {
  const owned = new Set(ownedIds)
  const hasLegend = WEAPONS.some((w) => w.rarity === 'legend' && owned.has(w.id))
  const rarities = ['common', 'rare']
  if (activityDays >= 20 || chapterPassed) rarities.push('sr')
  if ((activityDays >= 45 && eliteWins > 0) || (activityDays >= 60 && !hasLegend)) rarities.push('legend')
  return rarities
}

/**
 * 次の武器宝箱。未解放の上位レアには絶対に繰り上げない。
 * @returns {object|null} 今回の宝箱がなければ null
 */
export function rollScheduledWeaponReward({ activityDays = 0, ownedIds = [], eliteWins = 0, chapterPassed = false }) {
  const due = weaponAwardsDue(activityDays)
  const owned = new Set(ownedIds)
  // 60活動日までに伝説を持っていなければ、以前の高速配布で武器数が多いセーブでも
  // 伝説の確定宝箱だけは止めない。
  const isPityLegend = activityDays >= 60 && !WEAPONS.some((w) => w.rarity === 'legend' && owned.has(w.id))
  if (ownedIds.length >= due && !isPityLegend) return null

  // 1〜5日目は、開けるたびに必ず基本武器を1本。
  const starters = WEAPONS.filter((w) => w.rarity === 'common' && !owned.has(w.id))
  if (ownedIds.length < 5 && starters.length) return starters[0]

  const allowed = unlockedRarities({ activityDays, eliteWins, chapterPassed, ownedIds })
  const rarity = isPityLegend ? 'legend' : rollRarity(Math.max(1, Math.floor(activityDays / 2)), false)
  const desired = allowed.includes(rarity) ? rarity : allowed[allowed.length - 1]
  const fresh = WEAPONS.filter((w) => w.rarity === desired && !owned.has(w.id))
  if (fresh.length) return pick(fresh)

  // 同じか下のレアリティだけを探す。上位レアへのフォールバックは禁止。
  const lowerOrSame = [...allowed].reverse()
  for (const key of lowerOrSame) {
    const options = WEAPONS.filter((w) => w.rarity === key && !owned.has(w.id))
    if (options.length) return pick(options)
  }
  return null
}

export function nextWeaponAwardDay(activityDays, ownedCount) {
  for (let day = Math.max(1, activityDays); day <= 365; day++) {
    if (weaponAwardsDue(day) > ownedCount) return day
  }
  return null
}

// これまでの がんばりに応じた「引き継ぎ武器」。
// 武器システム導入前から遊んでくれていた分を、さかのぼって手わたしする。
// （ランダムにせず、必ず同じ結果になるようにする）
export function starterWeaponsFor(monstersCaught = 0, partnerLv = 1) {
  const ids = ['w01']
  if (monstersCaught >= 5 || partnerLv >= 5) ids.push('w08', 'w13')
  if (monstersCaught >= 20 || partnerLv >= 10) ids.push('w17', 'w24')
  if (monstersCaught >= 50 || partnerLv >= 16) ids.push('w22', 'w26')
  if (monstersCaught >= 90 || partnerLv >= 22) ids.push('w31', 'w35')
  return [...new Set(ids)]
}
