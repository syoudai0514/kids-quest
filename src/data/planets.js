// ============================================================
// 惑星（ワールド）進行データ — 宇宙の旅の舞台
//
// ミッションをクリアするたびロケットが進み、unlockAt に達すると
// 次の惑星に到着。物語が進み、なかまが増え、空の色（bg）が変わる。
//
// 追加方法: 配列に1件足すだけ。
//   unlockAt      : 到着する累計クリア数
//   bg            : [上の色, 下の色] ホーム背景のグラデーション
//   unlockMonster : 到着時になかまになるモンスターid（なくてもよい）
// ============================================================

export const PLANETS = [
  {
    id: 'station', name: 'ほしぞらステーション', emoji: '🛸', unlockAt: 0,
    bg: ['#1b1140', '#2a1a5e'],
    story: 'うちゅうの たびが はじまる！ あいぼうと いっしょに しゅっぱつだ。',
    unlockMonster: null
  },
  {
    id: 'kira', name: 'キラキラせい', emoji: '⭐', unlockAt: 2,
    bg: ['#1a1448', '#3a2a6e'],
    story: 'ほしが ふりそそぐ わくせい。コメタが なかまに なった！',
    unlockMonster: 'cometa'
  },
  {
    id: 'dino', name: 'きょうりゅうのほし', emoji: '🦕', unlockAt: 4,
    bg: ['#0e2418', '#1e4a2e'],
    story: 'みどりの もりに きょうりゅうの こえが ひびく。レクサが てを ふっている！',
    unlockMonster: 'rexa'
  },
  {
    id: 'tsuki', name: 'おつきさまのうみ', emoji: '🌙', unlockAt: 7,
    bg: ['#141838', '#2a3060'],
    story: 'しずかな つきの うみ。ルナコが ふわふわ あらわれた。',
    unlockMonster: 'lunaco'
  },
  {
    id: 'sora', name: 'そらとぶりゅうのたに', emoji: '🦅', unlockAt: 10,
    bg: ['#0f2a3e', '#1e4a6e'],
    story: 'かぜが うずまく たに。そらとぶ プテリィと ともだちに なった！',
    unlockMonster: 'pterry'
  },
  {
    id: 'magma', name: 'マグマのかざんせい', emoji: '🌋', unlockAt: 14,
    bg: ['#2e0e14', '#5a1e1e'],
    story: 'あつあつの かざんが ドーン！ ようがんの なかから あたらしい なかまが！',
    unlockMonster: 'g010'
  },
  {
    id: 'ice', name: 'こおりのわくせい', emoji: '❄️', unlockAt: 18,
    bg: ['#0e2030', '#1e4a5e'],
    story: 'キラキラの こおりの せかい。つるつる すべって あそぼう！',
    unlockMonster: 'g015'
  },
  {
    id: 'thunder', name: 'かみなりぐものくに', emoji: '⚡', unlockAt: 23,
    bg: ['#241a3e', '#4a3a1e'],
    story: 'ゴロゴロ ピカピカ！ くもの うえに かくれていた なかまを みつけた！',
    unlockMonster: 'g020'
  },
  {
    id: 'garden', name: 'はなのガーデンせい', emoji: '🌸', unlockAt: 28,
    bg: ['#2e1430', '#5a2a4a'],
    story: 'いちめんの おはなばたけ。あまい かおりに さそわれて なかまが きた！',
    unlockMonster: 'g030'
  },
  {
    id: 'rainbow', name: 'にじのゲートせい', emoji: '🌈', unlockAt: 34,
    bg: ['#1a1a4e', '#3a2a6e'],
    story: 'にじの ゲートの むこうには、まだ みぬ うちゅうが つづいている…！',
    unlockMonster: 'g040'
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
  return PLANETS.find((p) => p.unlockAt === totalClears && p.unlockAt > 0) || null
}
