// ============================================================
// オリジナルモンスター定義（宇宙・恐竜モチーフ／既存IPなし）
// 見た目は SVG で描画（components/Monster.jsx）。
//
// 手描きの基本モンスター(BASE) + 自動生成(GENERATED) で約100体。
// 自動生成は「絵柄8種 × 多色パレット × 連結ネーム」で決定論的に作る
// （= 何度読み込んでも同じ id/名前。収集データが保てる）。
//
// 追加方法: BASE に足すか、PALETTES / 生成数を増やすだけ。
//   art   : 'blob'|'dino'|'star'|'rock'|'ghost'|'bird'|'bug'|'slime'
//   role  : 'partner'(相棒/育つ) | 'friend'(惑星で出会う) | 'wild'(バトルで捕まえる)
// ============================================================

const BASE = [
  {
    id: 'hoshu',
    name: 'ホッシュ',
    role: 'partner',
    art: 'blob',
    colors: { body: '#7af0d0', belly: '#bafbe9', accent: '#ffd166', eye: '#1b1140' },
    element: 'ほし',
    desc: 'ほしのかけらから うまれた あいぼうモンスター。いっしょに うちゅうを たびする。',
    stages: [
      { at: 0, name: 'ホッシュ', scale: 1.0 },
      { at: 6, name: 'ホシュリン', scale: 1.12, colors: { accent: '#ffe08a' } },
      { at: 16, name: 'ホシュガード', scale: 1.25, colors: { body: '#8bf7ff', accent: '#ffd166' } }
    ]
  },
  { id: 'pterry', name: 'プテリィ', role: 'friend', art: 'bird', element: 'きょうりゅう',
    colors: { body: '#ff8fb1', belly: '#ffd9e4', accent: '#fff3b0', eye: '#3a0c20' },
    desc: 'そらを とぶ よくりゅうの こ。はやさじまんで げんき。' },
  { id: 'lunaco', name: 'ルナコ', role: 'friend', art: 'ghost', element: 'つき',
    colors: { body: '#b6a8ff', belly: '#e6dfff', accent: '#fff', eye: '#2a1f5c' },
    desc: 'つきの ひかりから うまれた、ふわふわ モンスター。' },
  { id: 'rexa', name: 'レクサ', role: 'friend', art: 'dino', element: 'きょうりゅう',
    colors: { body: '#9be36b', belly: '#d8ffba', accent: '#ff8f5e', eye: '#1d2b0c' },
    desc: 'ちいさいけど ゆうかんな りくの きょうりゅうモンスター。' },
  { id: 'cometa', name: 'コメタ', role: 'friend', art: 'star', element: 'ほし',
    colors: { body: '#ffd166', belly: '#fff0b8', accent: '#ff8fb1', eye: '#5a3a00' },
    desc: 'すいせいの しっぽを もつ、きらきら モンスター。' },
  { id: 'gokkon', name: 'ゴッコン', role: 'wild', art: 'rock', element: 'いわ',
    colors: { body: '#9aa7c7', belly: '#cdd6ee', accent: '#ffd166', eye: '#1b1140' },
    desc: 'いんせきから うまれた がんこな モンスター。' },
  { id: 'mognyu', name: 'モグニュ', role: 'wild', art: 'slime', element: 'マグマ',
    colors: { body: '#ff9d5c', belly: '#ffd9b0', accent: '#7af0d0', eye: '#3a1d00' },
    desc: 'あかい わくせいに すむ あったか モンスター。' },
  { id: 'shadex', name: 'シャデックス', role: 'wild', art: 'ghost', element: 'やみ',
    colors: { body: '#8a7bd8', belly: '#bcb0f0', accent: '#ff8fb1', eye: '#fff' },
    desc: 'うちゅうの すきまに かくれる いたずら モンスター。' }
]

// ---- 自動生成のための材料 ----
const ART_KINDS = ['blob', 'dino', 'star', 'rock', 'ghost', 'bird', 'bug', 'slime']

const PALETTES = [
  { element: 'ほし', body: '#8bf7ff', belly: '#d6fbff', accent: '#ffd166', eye: '#10283a' },
  { element: 'つき', body: '#b6a8ff', belly: '#e6dfff', accent: '#fff3b0', eye: '#2a1f5c' },
  { element: 'たいよう', body: '#ffd166', belly: '#fff0b8', accent: '#ff8f5e', eye: '#5a3a00' },
  { element: 'マグマ', body: '#ff7a59', belly: '#ffd0bf', accent: '#ffd166', eye: '#3a1000' },
  { element: 'みず', body: '#5fc9ff', belly: '#cdeeff', accent: '#aef6e0', eye: '#0c2a3a' },
  { element: 'くさ', body: '#9be36b', belly: '#dcffc0', accent: '#ffcf5e', eye: '#1d2b0c' },
  { element: 'こおり', body: '#aef0ff', belly: '#e6fbff', accent: '#7ad6ff', eye: '#143a4a' },
  { element: 'いわ', body: '#9aa7c7', belly: '#cdd6ee', accent: '#ffd166', eye: '#1b1140' },
  { element: 'でんき', body: '#ffe14d', belly: '#fff6b0', accent: '#ff8fb1', eye: '#4a3a00' },
  { element: 'やみ', body: '#8a7bd8', belly: '#bcb0f0', accent: '#ff8fb1', eye: '#ffffff' },
  { element: 'ほのお', body: '#ff6f91', belly: '#ffd0db', accent: '#ffd166', eye: '#4a0c20' },
  { element: 'そら', body: '#7fd0ff', belly: '#d6f0ff', accent: '#ffffff', eye: '#0c2a4a' },
  { element: 'きょうりゅう', body: '#5ed1a8', belly: '#c8ffe8', accent: '#ff8f5e', eye: '#0c3a2a' },
  { element: 'はな', body: '#ff9ecb', belly: '#ffd9ec', accent: '#9be36b', eye: '#4a0c30' },
  { element: 'ぎんが', body: '#9d7bff', belly: '#d6c8ff', accent: '#7af0d0', eye: '#1a0c4a' },
  { element: 'すな', body: '#e8c98a', belly: '#fff0cf', accent: '#7ad6ff', eye: '#4a3210' },
  { element: 'みどり', body: '#7be3a0', belly: '#d0ffe0', accent: '#ffd166', eye: '#0c3a1a' },
  { element: 'ゆき', body: '#dfe8ff', belly: '#ffffff', accent: '#7fd0ff', eye: '#2a3a5a' },
  { element: 'にじ', body: '#ff9ec0', belly: '#fff0d6', accent: '#7fd0ff', eye: '#3a1030' },
  { element: 'うちゅう', body: '#6a8bff', belly: '#cdd6ff', accent: '#ffd166', eye: '#0c1640' }
]

const PRE = ['ピ', 'ポ', 'モ', 'ニ', 'クル', 'ゾ', 'ラ', 'ビ', 'ガ', 'ジャ', 'テ', 'ヌ', 'ベ', 'ロ', 'ワ', 'キ', 'チ', 'ヘ', 'ム', 'ソ', 'ダ', 'ヒ', 'メ', 'リ', 'ヨ', 'プ', 'ブ', 'グ', 'ズ', 'ネ', 'ファ', 'コ']
const SUF = ['ット', 'リン', 'ゴン', 'ピー', 'モン', 'タン', 'ニャ', 'ドン', 'ック', 'ララ', 'ゾン', 'ピョン', 'ポン', 'ミィ', 'ズー', 'バウ', 'ゴロ', 'クス', 'ノン', 'ピコ']

const DESC_BY_ART = {
  blob: 'ぷにぷにの からだを もつ モンスター。',
  dino: 'こだいから いきる きょうりゅうモンスター。',
  star: 'ほしの ひかりを あつめる モンスター。',
  rock: 'がんじょうな からだの モンスター。',
  ghost: 'ふわふわ うかぶ ふしぎな モンスター。',
  bird: 'そらを とぶのが だいすきな モンスター。',
  bug: 'すばしっこい むしの モンスター。',
  slime: 'とろりと のびちぢみする モンスター。'
}

function generateMonsters(count) {
  const out = []
  for (let i = 0; i < count; i++) {
    const art = ART_KINDS[i % ART_KINDS.length]
    const pal = PALETTES[(i + Math.floor(i / ART_KINDS.length)) % PALETTES.length]
    const name = PRE[i % PRE.length] + SUF[Math.floor(i / PRE.length) % SUF.length]
    out.push({
      id: 'g' + String(i).padStart(3, '0'),
      name,
      role: 'wild', // バトルで捕まえて集める
      art,
      element: pal.element,
      colors: { body: pal.body, belly: pal.belly, accent: pal.accent, eye: pal.eye },
      desc: `${pal.element}の ${DESC_BY_ART[art]}`
    })
  }
  return out
}

// BASE 8 + 生成 92 = 100体
export const MONSTERS = [...BASE, ...generateMonsters(92)]

export const MONSTER_BY_ID = Object.fromEntries(MONSTERS.map((m) => [m.id, m]))

export function getPartner() {
  return MONSTERS.find((m) => m.role === 'partner')
}
export function getWildMonsters() {
  return MONSTERS.filter((m) => m.role === 'wild')
}
export function getFriendMonsters() {
  return MONSTERS.filter((m) => m.role === 'friend')
}

// 相棒の現在の進化段階を clearCount から決める
export function partnerStage(monster, clearCount) {
  if (!monster.stages) return { name: monster.name, scale: 1, colors: monster.colors }
  let cur = monster.stages[0]
  for (const st of monster.stages) {
    if (clearCount >= st.at) cur = st
  }
  return {
    name: cur.name,
    scale: cur.scale || 1,
    colors: { ...monster.colors, ...(cur.colors || {}) }
  }
}
