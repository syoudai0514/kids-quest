import fs from 'node:fs'
import { FAMILIES } from './families.mjs'
import { totalXp, DAY, WILD } from './battle.mjs'

// 設計上の目安の中央付近を狙う（5歳向けに少し早め）
const TARGET = {
  starter: { first: 3.0, final: 12.0 },
  common:  { first: 4.0, final: 16.0 },
  rare:    { first: 5.0, final: 19.0 },
  epic:    { first: 9.0, final: 26.0 },
  legend:  { first: 11.0, final: 32.0 },
}
const lvForXp = (xp) => 1 + Math.pow(Math.max(xp,0) / 6, 1 / 1.9)
const catchLv = (area) => WILD[area][0]

const plan = []
for (const f of FAMILIES) {
  if (f.members.length < 2) continue
  const key = f.starter ? 'starter' : f.members[0].rank
  const t = TARGET[key]
  const start = catchLv(f.area)
  const steps = f.members.length - 1
  const dayTargets = steps === 2 ? [t.first, t.final] : [t.first + (t.final - t.first) * 0.45]
  let prev = start
  const lv = dayTargets.map((d) => {
    let L = Math.round(lvForXp(totalXp(start) + d * DAY.std.xp))
    if (L <= prev + 2) L = prev + 3
    prev = L
    return L
  })
  plan.push({ f, key, start, lv })
}

// families.mjs のテキストを、系列ごとに順番へ 'lv:NN' を書き戻す
let src = fs.readFileSync(new URL('./families.mjs', import.meta.url), 'utf8')
let replaced = 0, skipped = 0
for (const p of plan) {
  p.f.members.slice(0, -1).forEach((m, i) => {
    if (!m.evo.startsWith('lv:')) { skipped++; return }
    const want = `lv:${p.lv[i]}`
    if (m.evo === want) { replaced++; return }
    // その個体の行だけを狙って置換（名前で一意に特定できることは check2 で保証済み）
    const re = new RegExp(`(\\{ name: '${m.name}',[^\\n]*evo: ')${m.evo}(' \\})`)
    const before = src
    src = src.replace(re, `$1${want}$2`)
    if (src === before) throw new Error(`置換失敗: ${m.name} ${m.evo} -> ${want}`)
    replaced++
  })
}
fs.writeFileSync(new URL('./families.mjs', import.meta.url), src)
console.log(`レベル進化を再計算: ${replaced}件書き換え / いし・もちもの ${skipped}件は据え置き`)
