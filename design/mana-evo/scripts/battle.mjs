import { FAMILIES } from './families.mjs'

// ── XP曲線 ───────────────────────────────────────────
export const totalXp = (L) => Math.round(6 * Math.pow(L - 1, 1.9))
export const xpBetween = (a, b) => totalXp(b) - totalXp(a)

// ── 1日のXP ─────────────────────────────────────────
export const DAY = {
  min:  { label: 'さいてい（コアだけ・正答6割）', xp: 210 },
  std:  { label: '標準例（コア5タスク＋基本チケット3戦）', xp: 350 },
  plus: { label: 'がんばった日（おかわり＋追加バトル）', xp: 600 },
}

// ── 野生レベル帯（プレイヤーに追従しない固定値）─────────
export const WILD = { 1: [4, 10], 2: [13, 20], 3: [24, 32], 4: [36, 44] }
export const BOSS = { 1: 14, 2: 26, 3: 38, 4: 52 }
const catchLv = (area) => WILD[area][0]

// ── ボスの大技（仕様整合: ）─────────────
// 旧仕様「1ターン溜め→威力100」は、2ターン平均が通常わざ連打より弱くなり得た。
// 予告ターンもボスは何もしないわけではなく、控えめな威力で普通に攻撃する
// （子どもから見て「ボスが1ターン止まる」ように見えない）。
// EV/ターン（予告込み2ターン平均） = (TELEGRAPH_POWER + ULTIMATE_POWER×命中) / 2
//                                  = (50 + 170×0.9) / 2 = 101.5
// これがボスの通常わざ（80×0.95=76 EV/ターン）を明確に上回るようにしてある。
export const BOSS_TELEGRAPH_POWER = 50   // 予告ターンにボスが実際に繰り出す通常の一撃
export const BOSS_ULTIMATE = { power: 170, accuracy: 0.90 } // 予告の次のターンに発動する大技

// ── 「まもる」の正式仕様（仕様整合: ）────
// 採用する。中途半端な残置をやめ、以下で完全に確定する。
export const GUARD_MOVE = {
  usableEveryTurn: false,
  cooldownTurns: 1,        // 使った次の1ターンは再使用不可。ランダム失敗ではなく見える確定ルール。
  damageCut: 1.0,
  successRate: 1.0,
  blocksStatus: true,
  uiAfterUse: 'つぎは まもるを つかえないよ！',
  note: '成功率は100%だが連続使用不可。ボス大技への対処は、まもる・こうたい・攻撃で押し切るの3択になる。',
}

// ── 敵AIの入力読み禁止（仕様整合: ）──────
// 敵（野生・ボースとも）は、プレイヤーがその ターンの行動を選ぶ「前」に、
// 内部的に自分の行動を決定する。プレイヤーの交代・わざ選択を見てから
// 行動を変える処理は存在しない（存在させない、という設計上の断言としてこの定数を置く）。
export const AI_READS_PLAYER_INPUT = false

// ── エリア到達日数の目安（で使う累積推定）────
// 「そのエリアの野生下限Lvから、標準ペースでそのエリアのボスを倒せるLvまで」に
// かかる日数を積み上げただけの簡易推定（実際は寄り道やレベル超過で前後する）。
export function areaUnlockDays() {
  const days = { 1: 0 }
  for (const a of [2, 3, 4]) {
    const prevBossDays = xpBetween(WILD[a - 1][0], BOSS[a - 1]) / DAY.std.xp
    days[a] = days[a - 1] + prevBossDays
  }
  return days
}
export const AREA_UNLOCK_DAY = areaUnlockDays()


// ── ベース種族値 ─────────────────────────────────────
//
// 仕様整合: //  旧実装は STAGE_BST を「そのステージ番号」で引いていたため、2段階系列の最終形が
//  STAGE_BST[2]=270 になり、3段階系列の最終形 STAGE_BST[3]=340 と大差が付いていた
//  （＝2段階系列は「最終形なのに中間形相当」になっていた）。
//  「そのモンスターが系列内で最終形かどうか」を基準に決め直す。
export function bstForPosition(stageIndex, maxStage) {
  if (maxStage === 1) return 380       // 単体（進化なし）は最終形と同格＋α
  if (stageIndex === maxStage) return 340 // 最終形は2段階でも3段階でも常に340
  if (maxStage === 2) return 200        // 2段階の第1形態
  return stageIndex === 1 ? 200 : 270   // 3段階の第1形態／中間形態
}

const RANK_MUL = { common: 0.95, rare: 1.00, epic: 1.08, legend: 1.20 }
export const ROLE_SPLIT = {
  attacker: { hp:0.24, atk:0.36, def:0.18, spd:0.22 },
  guard:    { hp:0.32, atk:0.20, def:0.34, spd:0.14 },
  speed:    { hp:0.22, atk:0.28, def:0.16, spd:0.34 },
  healer:   { hp:0.30, atk:0.18, def:0.28, spd:0.24 },
  support:  { hp:0.26, atk:0.22, def:0.28, spd:0.24 },
  balanced: { hp:0.26, atk:0.26, def:0.24, spd:0.24 },
}
// 単発の例示用（ドキュメントの「例」表など、実際の進化チェーンではない比較に使う）。
export function baseStats(stage, maxStage, rank, role) {
  const bst = Math.round(bstForPosition(stage, maxStage) * RANK_MUL[rank])
  const s = ROLE_SPLIT[role]
  return { hp: Math.round(bst*s.hp), atk: Math.round(bst*s.atk), def: Math.round(bst*s.def), spd: Math.round(bst*s.spd), bst }
}

// 仕様整合: //  ロールが進化で変わる系列（155件中52件）では、BSTが増えていても
//  配分比率の変化幅の方が大きく、素の計算だと一部ステータスが下がるケースがあった
//  （例: ワカバネ→ジュランガ で こうげき 70→68、すばやさ 65→48）。
//  「進化して1つでも下がるステータスがある」は5歳向けに絶対に避けたいため、
//  実際に使う数値は、各ステータスを「1つ前の形態の値未満にはしない」よう底上げする。
//  底上げ後の合計を bst として持たせ直す（表示用のBSTもこの底上げ後の値に揃える）。
export function familyBaseStats(family) {
  const raw = family.members.map((m, i) => {
    const s = baseStats(i + 1, family.members.length, m.rank, m.role)
    return { name: m.name, hp: s.hp, atk: s.atk, def: s.def, spd: s.spd }
  })
  for (let i = 1; i < raw.length; i++) {
    for (const k of ['hp', 'atk', 'def', 'spd']) {
      if (raw[i][k] < raw[i - 1][k]) raw[i][k] = raw[i - 1][k]
    }
  }
  return raw.map((s) => ({ ...s, bst: s.hp + s.atk + s.def + s.spd }))
}

export const realHp  = (b, L) => Math.floor(b * L / 50) + L + 10
export const realStat= (b, L) => Math.floor(b * L / 50) + 5

// ── ダメージ式 ───────────────────────────────────────
//
// 仕様整合: タイプ倍率が0（こうかなし）のときは、
// Math.max(1, ...) の下駄を履かせず、必ず0ダメージにする。
export function damage({ level, power, atk, def, stab = 1, type = 1, crit = 1, rand = 0.95 }) {
  if (type === 0) return 0
  const base = Math.floor(Math.floor((2 * level / 5 + 2) * power * atk / def) / 50) + 2
  return Math.max(1, Math.floor(base * stab * type * crit * rand))
}

// ── レポート ─────────────────────────────────────────
if ((process.argv[1] || '').endsWith('battle.mjs')) {
  console.log('■ XP曲線  total(L) = round(6 × (L−1)^1.9)')
  console.log('  ' + [5,8,10,12,16,20,24,28,32,36,40,45,50,55,60].map(L=>`Lv${L}:${totalXp(L)}`).join('  '))
  console.log('  レベル1つ分のXP: Lv5→6 =', xpBetween(5,6), '/ Lv20→21 =', xpBetween(20,21), '/ Lv40→41 =', xpBetween(40,41))

  console.log('\n■ 進化までの日数（標準350XP/日・捕獲レベルからの実測）')
  // レベル進化＝XPで測る。いし／もちもの進化＝アイテム入手が門なので別枠で扱う。
  const BAND = {
    starter3_first: [2,4],   starter3_final: [10,14],
    common3_first:  [3,7],   common3_final:  [14,28],
    rare3_first:    [3,7],   rare3_final:    [14,28],
    epic3_first:    [7,14],  epic3_final:    [21,40],
    legend3_first:  [7,14],  legend3_final:  [21,40],
    two_stage:      [8,14],  // 2段階は1回しか進化しないので、3段階の1回目と最終の間を狙う
  }
  const bandKey = (f, idx) => {
    if (f.members.length === 2) return 'two_stage'
    const k = f.starter ? 'starter' : f.members[0].rank
    return `${k}3_${idx === 0 ? 'first' : 'final'}`
  }
  const rows = [], itemSteps = []
  for (const f of FAMILIES) {
    if (f.members.length < 2) continue
    const start = catchLv(f.area)
    let prev = start
    f.members.slice(0, -1).forEach((m, i) => {
      const [k, v] = m.evo.split(':')
      if (k !== 'lv') { itemSteps.push({ f, i, kind: k, item: v, from: m.name, to: f.members[i+1].name, atLv: prev }); return }
      const b = BAND[bandKey(f, i)]
      const days = xpBetween(start, +v) / DAY.std.xp
      rows.push({ name: m.name, fam: f.members[0].name, area: f.area, band: bandKey(f, i), lv: +v, days,
                  ok: days >= b[0] - 0.6 && days <= b[1] + 0.6, b })
      prev = +v
    })
  }
  const grp = {}
  rows.forEach(r => { (grp[r.band] ||= []).push(r) })
  for (const [k, list] of Object.entries(grp)) {
    const d = list.map(r => r.days)
    const ng = list.filter(r => !r.ok).length
    console.log(`  ${k.padEnd(15)} ${String(list.length).padStart(3)}件  ${Math.min(...d).toFixed(1)}〜${Math.max(...d).toFixed(1)}日  (目安 ${BAND[k].join('〜')}日)  ${ng ? 'NG ' + ng + '件' : 'OK'}`)
  }
  const ng = rows.filter(r => !r.ok)
  console.log(`  レベル進化 ${rows.length}件中 目安内 ${rows.length - ng.length}件 / 外れ ${ng.length}件`)
  ng.slice(0, 15).forEach(r => console.log(`    ${r.fam}(A${r.area}) ${r.name}→Lv${r.lv} ${r.days.toFixed(1)}日 (目安${r.b.join('〜')})`))
  console.log(`  いし／もちもの進化 ${itemSteps.length}件（レベルではなくアイテム入手が門）`)
  const byItem = {}
  itemSteps.forEach(s => { (byItem[s.kind + ':' + s.item] ||= []).push(s) })
  console.log('    ' + Object.entries(byItem).map(([k, v]) => `${k}×${v.length}`).join(' '))
  const itemLv = itemSteps.map(s => s.atLv)
  console.log(`    使うころの推定レベル: ${Math.min(...itemLv)}〜${Math.max(...itemLv)}`)

  console.log('\n■ ステータス例（Lv.30時点の実数値）')
  const ex = [['stage1 common attacker',1,3,'common','attacker'],['stage3 rare guard',3,3,'rare','guard'],
              ['stage3 epic attacker',3,3,'epic','attacker'],['単体 legend balanced',1,1,'legend','balanced']]
  for (const [label,st,mx,rk,ro] of ex) {
    const b = baseStats(st,mx,rk,ro)
    console.log(`  ${label.padEnd(24)} 種族値 HP${b.hp} こう${b.atk} ぼう${b.def} すば${b.spd} (計${b.bst})  → Lv30 HP${realHp(b.hp,30)} こう${realStat(b.atk,30)} ぼう${realStat(b.def,30)} すば${realStat(b.spd,30)}`)
  }

  console.log('\n■ ダメージ検算（同格どうし・威力60・等倍・タイプ一致なし）')
  for (const L of [10, 20, 30, 40]) {
    const a = baseStats(Math.min(3,Math.ceil(L/16)),3,'rare','attacker')
    const d = baseStats(Math.min(3,Math.ceil(L/16)),3,'rare','guard')
    const dmg = damage({ level:L, power:60, atk:realStat(a.atk,L), def:realStat(d.def,L) })
    const hp = realHp(d.hp,L)
    console.log(`  Lv${L}: ${dmg} ダメージ / 相手HP ${hp} → ${(hp/dmg).toFixed(1)}発で たおれる`)
  }
  console.log('\n■ 相性・タイプ一致・急所を掛けたとき（Lv30・威力60・アタッカー→ガード）')
  const a30 = realStat(baseStats(3,3,'rare','attacker').atk,30), d30 = realStat(baseStats(3,3,'rare','guard').def,30)
  const hp30 = realHp(baseStats(3,3,'rare','guard').hp,30)
  for (const [lab,stab,ty,cr] of [['ふつう',1,1,1],['タイプ一致',1.5,1,1],['ばつぐん',1,2,1],['一致＋ばつぐん',1.5,2,1],['一致＋ばつぐん＋急所',1.5,2,1.5],['いまひとつ',1,0.5,1]]) {
    const dmg = damage({level:30,power:60,atk:a30,def:d30,stab,type:ty,crit:cr})
    console.log(`  ${lab.padEnd(20)} ${String(dmg).padStart(3)} ダメージ（相手HP${hp30}の ${(dmg/hp30*100).toFixed(0)}%） → ${Math.ceil(hp30/dmg)}発`)
  }
  console.log('\n■ 「育てたら本当に強い」検証（Lv40最終形 → エリア1の野生Lv6 stage1）')
  const strong = baseStats(3,3,'rare','attacker')
  const weak = baseStats(1,3,'common','balanced')
  const d = damage({level:40,power:60,atk:realStat(strong.atk,40),def:realStat(weak.def,6),stab:1.5})
  console.log(`  こちらの一撃: ${d} / 相手HP ${realHp(weak.hp,6)} → ${d >= realHp(weak.hp,6) ? '一撃' : Math.ceil(realHp(weak.hp,6)/d)+'発'}`)
  const back = damage({level:6,power:60,atk:realStat(weak.atk,6),def:realStat(strong.def,40)})
  console.log(`  相手の一撃: ${back} / こちらHP ${realHp(strong.hp,40)} → ${(realHp(strong.hp,40)/back).toFixed(0)}発ぶん耐える`)
}


// ── 特殊変身時のHP変換 ───────────────────────────
// ギガは最大HPと現在HPを同率1.35倍（割合維持、四捨五入）。
// バーストは発動時に最大HP・現在HPを2倍。解除時は「増えたHP」をそのまま通常HPへ持ち越さず、
// 割合を通常最大HPへ戻す。0HPは0のままで、最低1HP保証はしない（瀕死回避ボタン化を防ぐ）。
export function scaleHpPreserveRatio(currentHp, maxHp, multiplier) {
  if (maxHp <= 0) throw new Error('maxHp must be > 0')
  const newMax = Math.max(1, Math.round(maxHp * multiplier))
  const newCurrent = currentHp <= 0 ? 0 : Math.min(newMax, Math.round(currentHp / maxHp * newMax))
  return { currentHp: newCurrent, maxHp: newMax }
}
export function revertHpPreserveRatio(currentHp, transformedMaxHp, baseMaxHp) {
  if (transformedMaxHp <= 0 || baseMaxHp <= 0) throw new Error('maxHp must be > 0')
  if (currentHp <= 0) return { currentHp: 0, maxHp: baseMaxHp }
  return { currentHp: Math.min(baseMaxHp, Math.round(currentHp / transformedMaxHp * baseMaxHp)), maxHp: baseMaxHp }
}
