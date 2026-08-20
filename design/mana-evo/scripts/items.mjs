// 進化アイテム（いし・もちもの）のマスタ。
//
// 仕様整合: //  - 「アイテムは、そのモンスターの最初の進化でもらえる」という説明は、
//    アイテムがその進化そのものに必要な場合（＝そのアイテムが無いと進化できない）に矛盾する。
//    （例: ロウソッコ→トモシビ が hold:emberwick を要求するのに、
//     emberwick を「最初の進化でもらう」と書くと絶対に手に入らない）
//  - そこで入手方式を「進化でもらう」から「対応エリアに入った時点で入手できる」へ変更した。
//    unlockArea は、そのアイテムを最初に必要とする系列の エリア番号の最小値（= 機械的に算出）。
//    これにより「アイテムを要求する進化より後にアイテムが手に入る」矛盾が構造的に起きなくなる。
//  - stone:ancient（カセキーノ→コダイガメ 用）が「エリア4のボス」に紐づいていた誤りも、
//    unlockArea = 2（カセキーノ自身のエリア）に訂正されて解消する。
//  - mindprism は定義だけで、どの系列からも参照されていなかった（未使用）ため削除した（）。

import { FAMILIES } from './families.mjs'

export const STONE_LABEL = {
  fire: 'ほのおのいし', water: 'みずのいし', thunder: 'かみなりのいし', leaf: 'リーフのいし',
  moon: 'つきのいし', ice: 'こおりのいし', dusk: 'よいやみのいし', ancient: 'いにしえのいし',
}
export const HOLD_LABEL = {
  emberwick: 'きえないシン', steelplate: 'はがねのいた', sunscale: 'たいようのウロコ',
  barkarmor: 'きのよろい', frostgem: 'こおりのハート', nightfeather: 'よるのハネ',
  skyplume: 'そらのカザリ', windband: 'かぜのハチマキ', dragonfang: 'りゅうのキバ', corepart: 'コアパーツ',
}

// unlockArea を実データから機械的に算出する（手書きの対応表を持たない）。
function computeUnlockAreas() {
  const areas = {}
  for (const f of FAMILIES) {
    for (const m of f.members) {
      if (!m.evo) continue
      const [kind, id] = m.evo.split(':')
      if (kind !== 'stone' && kind !== 'hold') continue
      const key = `${kind}:${id}`
      areas[key] = Math.min(areas[key] ?? Infinity, f.area)
    }
  }
  return areas
}
export const UNLOCK_AREA = computeUnlockAreas()

// 入手方法（すべてのアイテムに共通のルール）。
export const ACQUIRE_RULE =
  '対応エリアに入った瞬間から、たんけん（探索）ドロップとして手に入る。' +
  'エリアボスを初めて倒すと、同じアイテムがもう1こボーナスでもらえる。' +
  '「進化して初めてもらえる」アイテムは存在しない（進化条件そのものに使うアイテムと矛盾するため）。'

export function itemUsers(kind, id) {
  const rows = []
  for (const f of FAMILIES) {
    f.members.slice(0, -1).forEach((m, i) => {
      const [k, v] = m.evo.split(':')
      if (k === kind && v === id) rows.push({ family: f.members[0].name, area: f.area, from: m.name, to: f.members[i + 1].name, isFirstStep: i === 0 })
    })
  }
  return rows
}

if ((process.argv[1] || '').endsWith('items.mjs')) {
  console.log('■ いし（unlockArea = 機械算出）')
  for (const [id, label] of Object.entries(STONE_LABEL)) {
    const key = `stone:${id}`
    const users = itemUsers('stone', id)
    console.log(`  ${label.padEnd(10)} unlockArea=${UNLOCK_AREA[key] ?? '(未使用)'}  使用 ${users.length}件  ` + users.map(u => `${u.family}(A${u.area}${u.isFirstStep ? '*' : ''})`).join(' '))
  }
  console.log('■ もちもの（unlockArea = 機械算出）')
  for (const [id, label] of Object.entries(HOLD_LABEL)) {
    const key = `hold:${id}`
    const users = itemUsers('hold', id)
    console.log(`  ${label.padEnd(10)} unlockArea=${UNLOCK_AREA[key] ?? '(未使用)'}  使用 ${users.length}件  ` + users.map(u => `${u.family}(A${u.area}${u.isFirstStep ? '*' : ''})`).join(' '))
  }
}
