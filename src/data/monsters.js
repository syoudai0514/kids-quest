// ============================================================
// オリジナルモンスター定義（宇宙・恐竜モチーフ）
// 既存IPは一切使わず、独自デザイン。見た目は SVG で描画（components/Monster.jsx）。
//
// 追加方法: この配列に1件足すだけ。art の種類と色を指定する。
//   art:   'blob' | 'dino' | 'star' | 'rock' | 'ghost' のいずれか（描画パターン）
//   role:  'partner'（相棒/育つ） | 'friend'（収集仲間） | 'wild'（バトルの相手）
//   stages: 相棒が育つときの見た目の段階（名前と少しの色変化）
// ============================================================

export const MONSTERS = [
  {
    id: 'hoshu',
    name: 'ホッシュ',
    role: 'partner',
    art: 'blob',
    colors: { body: '#7af0d0', belly: '#bafbe9', accent: '#ffd166', eye: '#1b1140' },
    element: 'ほし',
    desc: 'ほしのかけらから うまれた あいぼうモンスター。いっしょに うちゅうを たびする。',
    // 育つ段階。clearCount（クリア数）でしきい値を超えると進化。
    stages: [
      { at: 0, name: 'ホッシュ', scale: 1.0 },
      { at: 6, name: 'ホシュリン', scale: 1.12, colors: { accent: '#ffe08a' } },
      { at: 16, name: 'ホシュガード', scale: 1.25, colors: { body: '#8bf7ff', accent: '#ffd166' } }
    ]
  },
  {
    id: 'pterry',
    name: 'プテリィ',
    role: 'friend',
    art: 'dino',
    colors: { body: '#ff8fb1', belly: '#ffd9e4', accent: '#fff3b0', eye: '#3a0c20' },
    element: 'きょうりゅう',
    desc: 'そらを とぶ よくりゅうの こ。はやさじまんで げんき。'
  },
  {
    id: 'lunaco',
    name: 'ルナコ',
    role: 'friend',
    art: 'ghost',
    colors: { body: '#b6a8ff', belly: '#e6dfff', accent: '#fff', eye: '#2a1f5c' },
    element: 'つき',
    desc: 'つきの ひかりから うまれた、ふわふわ モンスター。'
  },
  {
    id: 'rexa',
    name: 'レクサ',
    role: 'friend',
    art: 'dino',
    colors: { body: '#9be36b', belly: '#d8ffba', accent: '#ff8f5e', eye: '#1d2b0c' },
    element: 'きょうりゅう',
    desc: 'ちいさいけど ゆうかんな りくの きょうりゅうモンスター。'
  },
  {
    id: 'cometa',
    name: 'コメタ',
    role: 'friend',
    art: 'star',
    colors: { body: '#ffd166', belly: '#fff0b8', accent: '#ff8fb1', eye: '#5a3a00' },
    element: 'ほし',
    desc: 'すいせいの しっぽを もつ、きらきら モンスター。'
  },
  // ---- バトルに登場する野生モンスター（息抜きバトル用） ----
  {
    id: 'gokkon',
    name: 'ゴッコン',
    role: 'wild',
    art: 'rock',
    colors: { body: '#9aa7c7', belly: '#cdd6ee', accent: '#ffd166', eye: '#1b1140' },
    element: 'いわ',
    desc: 'いんせきから うまれた がんこな モンスター。'
  },
  {
    id: 'mognyu',
    name: 'モグニュ',
    role: 'wild',
    art: 'blob',
    colors: { body: '#ff9d5c', belly: '#ffd9b0', accent: '#7af0d0', eye: '#3a1d00' },
    element: 'マグマ',
    desc: 'あかい わくせいに すむ あったか モンスター。'
  },
  {
    id: 'shadex',
    name: 'シャデックス',
    role: 'wild',
    art: 'ghost',
    colors: { body: '#8a7bd8', belly: '#bcb0f0', accent: '#ff8fb1', eye: '#fff' },
    element: 'やみ',
    desc: 'うちゅうの すきまに かくれる いたずら モンスター。'
  }
]

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
