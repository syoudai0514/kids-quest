// ============================================================
// 惑星（ワールド）進行データ
// 宇宙を旅して、星や恐竜の惑星をめぐる物語の舞台。
// ミッションを規定数クリアするごとに次の惑星が解放され、物語が少し進む。
//
// 追加方法: 配列に1件足すだけ。unlockAt はその惑星が開く累計クリア数。
// ============================================================

export const PLANETS = [
  {
    id: 'hoshizora',
    name: 'ほしぞらステーション',
    emoji: '🛸',
    unlockAt: 0,
    story: 'うちゅうの たびが はじまる！ あいぼうの ホッシュと しゅっぱつだ。',
    unlockMonster: null
  },
  {
    id: 'kira-star',
    name: 'キラキラせい',
    emoji: '⭐',
    unlockAt: 2,
    story: 'ほしが いっぱいの わくせいに とうちゃく。あたらしい なかまが まってるよ。',
    unlockMonster: 'cometa'
  },
  {
    id: 'dino-planet',
    name: 'きょうりゅうのほし',
    emoji: '🦕',
    unlockAt: 4,
    story: 'きょうりゅうたちが くらす みどりの ほし。レクサが てを ふっている！',
    unlockMonster: 'rexa'
  },
  {
    id: 'tsuki-planet',
    name: 'おつきさまのうみ',
    emoji: '🌙',
    unlockAt: 7,
    story: 'しずかな つきの うみ。ルナコが ふわふわ あらわれた。',
    unlockMonster: 'lunaco'
  },
  {
    id: 'sora-planet',
    name: 'そらとぶりゅうのたに',
    emoji: '🪽',
    unlockAt: 10,
    story: 'そらを とぶ きょうりゅうの たに。プテリィと ともだちに なろう。',
    unlockMonster: 'pterry'
  }
]

export function currentPlanet(totalClears) {
  let cur = PLANETS[0]
  for (const p of PLANETS) {
    if (totalClears >= p.unlockAt) cur = p
  }
  return cur
}

export function nextPlanet(totalClears) {
  return PLANETS.find((p) => p.unlockAt > totalClears) || null
}

// このクリア数で「新しく開いた」惑星があれば返す（演出トリガー用）
export function planetUnlockedAt(totalClears) {
  return PLANETS.find((p) => p.unlockAt === totalClears) || null
}
