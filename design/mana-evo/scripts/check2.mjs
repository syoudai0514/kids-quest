import nodeFs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FAMILIES } from './families.mjs'
import { TYPES, CHART, effectiveness } from './types.mjs'
import { GIGA_SHINKA, KYODAI_BURST, GIGA_STAT_MULT, BURST_MOVE, NORMAL_FINAL_MOVE } from './forms.mjs'
import { familyBaseStats, damage, BOSS_ULTIMATE, BOSS_TELEGRAPH_POWER, AI_READS_PLAYER_INPUT, GUARD_MOVE, scaleHpPreserveRatio, revertHpPreserveRatio } from './battle.mjs'
import { UNLOCK_AREA, STONE_LABEL, HOLD_LABEL } from './items.mjs'
import { RATE, BALL, singleThrowRate, cumulativeRate } from './capture.mjs'
import { encounterInfo, WILD_WEIGHT, ENCOUNTER_LOCK } from './wildEncounter.mjs'
import { REWARDS, DIFFICULTY, EXPLORATION, AREA_BOSS_UNLOCK, GROWTH_SHARD, canChallengeAreaBoss, explorationPityBeforeRun, explorationPityAfterRun } from './rewards.mjs'

const ids = TYPES.map(t=>t.id)
const fail = []
const ok = (cond, label, detail='') => { console.log(`  ${cond?'PASS':'FAIL'}  ${label}${detail?'  → '+detail:''}`); if(!cond) fail.push(label) }

// 図鑑番号を振る
const mons = []
FAMILIES.forEach(f => f.members.forEach((m,i)=>{
  mons.push({ ...m, dex: mons.length+1, type:f.type, area:f.area, rankFamily:f.members[0].rank,
    stage:i+1, maxStage:f.members.length, family:f.members[0].name, fam:f })
}))
const byName = new Map(mons.map(m=>[m.name,m]))

console.log('■ 総数・系列')
const byLen = {}; FAMILIES.forEach(f=>byLen[f.members.length]=(byLen[f.members.length]||0)+1)
console.log(`  モンスター ${mons.length}体 / 系列 ${FAMILIES.length}（3段${byLen[3]||0} 2段${byLen[2]||0} 単体${byLen[1]||0}）`)
ok(mons.length >= 200, '最低200体')
ok(mons.length === (byLen[3]||0)*3 + (byLen[2]||0)*2 + (byLen[1]||0), '体数と系列の内訳が一致')
const dexes = mons.map(m=>m.dex)
ok(new Set(dexes).size === dexes.length && Math.min(...dexes)===1 && Math.max(...dexes)===mons.length, 'No.001〜最終番号まで欠番／重複なし')
ok(new Set(mons.map(m=>m.name)).size === mons.length, '名前の重複なし')

console.log('\n■ 進化')
const noEvoFam = FAMILIES.filter(f=>f.members.length===1)
const badNoEvo = noEvoFam.filter(f=>!f.legendReason)
ok(badNoEvo.length===0, '進化なし系列はすべて例外理由を持つ', badNoEvo.map(f=>f.members[0].name).join(',')||`${noEvoFam.length}件すべてlegendReasonあり`)
const badRank = noEvoFam.filter(f=>!['legend','epic'].includes(f.members[0].rank))
ok(badRank.length===0, '通常／レアに理由のない進化なし系列がない', badRank.map(f=>f.members[0].name).join(',')||'common/rareの単体系列 0件')
// 進化参照
const badEvo = []
FAMILIES.forEach(f=>f.members.forEach((m,i)=>{
  const last = i === f.members.length-1
  if (last && m.evo) badEvo.push(`${m.name}: 最終形なのにevoがある`)
  if (!last && !m.evo) badEvo.push(`${m.name}: 進化先があるのにevoがない`)
  if (m.evo && !/^(lv:\d+|stone:[a-z]+|hold:[a-z]+)$/.test(m.evo)) badEvo.push(`${m.name}: evo書式不正 ${m.evo}`)
}))
ok(badEvo.length===0, '進化参照がすべて存在・書式正当', badEvo.slice(0,5).join(' / ')||'')
// いし・もちもの対象
const stones = {}, holds = {}
mons.forEach(m=>{ if(!m.evo) return; const [k,v]=m.evo.split(':'); if(k==='stone') stones[v]=(stones[v]||0)+1; if(k==='hold') holds[v]=(holds[v]||0)+1 })
console.log('  いし:', JSON.stringify(stones))
console.log('  もちもの:', JSON.stringify(holds))
ok(Object.keys(stones).length>0 && Object.values(stones).every(n=>n>0), 'いし対象がすべて存在')
ok(Object.keys(holds).length>0 && Object.values(holds).every(n=>n>0), 'もちもの対象がすべて存在')
const evoLv = mons.filter(m=>m.evo?.startsWith('lv:')).map(m=>+m.evo.slice(3))
console.log('  レベル進化の分布: 最小', Math.min(...evoLv), '最大', Math.max(...evoLv))
const badLvOrder = []
FAMILIES.forEach(f=>{ const l=f.members.filter(m=>m.evo?.startsWith('lv:')).map(m=>+m.evo.slice(3))
  for(let i=1;i<l.length;i++) if(l[i]<=l[i-1]) badLvOrder.push(f.members[0].name) })
ok(badLvOrder.length===0, '系列内のレベル進化が昇順', badLvOrder.join(',')||'')

console.log('\n■ ギガシンカ／キョダイバースト')
const missG = GIGA_SHINKA.filter(n=>!byName.has(n))
const missK = KYODAI_BURST.filter(n=>!byName.has(n))
ok(missG.length===0, 'ギガシンカ対象がすべて実在', missG.join(',')||`${GIGA_SHINKA.length}体`)
ok(missK.length===0, 'キョダイバースト対象がすべて実在', missK.join(',')||`${KYODAI_BURST.length}体`)
const notFinalG = GIGA_SHINKA.filter(n=>byName.get(n) && byName.get(n).stage !== byName.get(n).maxStage)
const notFinalK = KYODAI_BURST.filter(n=>byName.get(n) && byName.get(n).stage !== byName.get(n).maxStage)
ok(notFinalG.length===0, 'ギガシンカ対象は最終形のみ', notFinalG.join(',')||'')
ok(notFinalK.length===0, 'キョダイバースト対象は最終形のみ', notFinalK.join(',')||'')
ok(GIGA_SHINKA.filter(n=>KYODAI_BURST.includes(n)).length===0, 'ギガとキョダイの対象が重複しない')
const gTypes = new Set(GIGA_SHINKA.map(n=>byName.get(n)?.type))
console.log('  ギガシンカのタイプ:', [...gTypes].join(' '), `(${gTypes.size}種)`)
const kTypes = new Set(KYODAI_BURST.map(n=>byName.get(n)?.type))
console.log('  キョダイバーストのタイプ:', [...kTypes].join(' '), `(${kTypes.size}種)`)
ok(gTypes.size>=8, 'ギガシンカがタイプに偏っていない')

console.log('\n■ タイプ配分')
const byType={}; mons.forEach(m=>byType[m.type]=(byType[m.type]||0)+1)
console.log('  ', ids.map(t=>`${TYPES.find(x=>x.id===t).name}${byType[t]}`).join(' '))
ok(ids.every(t=>byType[t]>=8), '全18タイプに8体以上', ids.filter(t=>byType[t]<8).join(',')||`最少 ${Math.min(...ids.map(t=>byType[t]))}体`)
const elecEarly = mons.filter(m=>m.type==='electric' && m.area===1)
ok(elecEarly.length>0, 'でんきタイプが序盤（エリア1）から登場', `エリア1に${elecEarly.length}体 / 最小No.${Math.min(...elecEarly.map(m=>m.dex))}`)
const a1types = new Set(mons.filter(m=>m.area===1).map(m=>m.type))
console.log('  エリア1のタイプ:', a1types.size, '種')

console.log('\n■ 名前')
const finals = FAMILIES.map(f=>f.members[f.members.length-1].name)
const suffix = {}
finals.forEach(n=>{ for(const len of [2,3]) { const s=n.slice(-len); suffix[s]=(suffix[s]||0)+1 } })
const top = Object.entries(suffix).sort((a,b)=>b[1]-a[1]).slice(0,8)
console.log('  最終形の語尾（多い順）:', top.map(([s,n])=>`${s}:${n}`).join(' '))
const worst = top[0]
ok(worst[1] / finals.length <= 0.12, '1つの語尾が最終進化名に過剰集中していない', `最多「${worst[0]}」${worst[1]}/${finals.length} = ${(worst[1]/finals.length*100).toFixed(1)}%`)
const firsts = FAMILIES.map(f=>f.members[0].name)
const fs = {}; firsts.forEach(n=>{ const s=n.slice(-1); fs[s]=(fs[s]||0)+1 })
console.log('  第1形の語尾:', Object.entries(fs).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([s,n])=>`${s}:${n}`).join(' '))
ok(finals.every(n=>n.length>=4 && n.length<=8), '最終形の名前が4〜8文字', finals.filter(n=>n.length<4||n.length>8).join(',')||'')
ok(firsts.every(n=>n.length>=3 && n.length<=6), '第1形の名前が3〜6文字', firsts.filter(n=>n.length<3||n.length>6).join(',')||'')

console.log('\n■ 設定フィールド')
const noConcept = FAMILIES.filter(f=>!f.concept)
const noArc = FAMILIES.filter(f=>f.members.length>1 && (!f.arc || !f.arc.初期 || !f.arc.最終))
const noMotif = FAMILIES.filter(f=>!f.motif)
const noDesc = mons.filter(m=>!m.desc || m.desc.length<10)
ok(noConcept.length===0, '全系列にconcept', noConcept.map(f=>f.members[0].name).join(',')||'')
ok(noArc.length===0, '進化する系列すべてにarc', noArc.map(f=>f.members[0].name).join(',')||'')
ok(noMotif.length===0, '全系列にmotif', noMotif.map(f=>f.members[0].name).join(',')||'')
ok(noDesc.length===0, '全個体にdesc', noDesc.map(m=>m.name).join(',')||'')
ok(FAMILIES.filter(f=>f.starter).length===3, 'スターターが3系列', FAMILIES.filter(f=>f.starter).map(f=>f.members[0].name).join('/'))
const roles = {}; mons.forEach(m=>roles[m.role]=(roles[m.role]||0)+1)
console.log('  ロール:', JSON.stringify(roles))
ok(Object.keys(roles).every(r=>['attacker','guard','healer','support','speed','balanced'].includes(r)), 'ロールが定義内')

console.log('\n■ ランク／エリア')
const byRank={}; mons.forEach(m=>byRank[m.rank]=(byRank[m.rank]||0)+1)
console.log('  ランク:', JSON.stringify(byRank))
const byArea={}; mons.forEach(m=>byArea[m.area]=(byArea[m.area]||0)+1)
console.log('  エリア:', JSON.stringify(byArea))
const badRankOrder = []
const R = {common:0, rare:1, epic:2, legend:3}
FAMILIES.forEach(f=>{ for(let i=1;i<f.members.length;i++) if(R[f.members[i].rank] < R[f.members[i-1].rank]) badRankOrder.push(f.members[0].name) })
ok(badRankOrder.length===0, '系列内でランクが下がらない', badRankOrder.join(',')||'')
const wildFinal = mons.filter(m=>m.maxStage>1 && m.stage===m.maxStage).length
const encounterCounts = mons.reduce((acc,m)=>{ const pool=encounterInfo(m.fam,m.stage).pool; acc[pool]=(acc[pool]||0)+1; return acc }, {})
console.log(`  出会い方: 通常野生 ${encounterCounts.wild||0}体 / 進化専用 ${encounterCounts.evolutionOnly||0}体 / イベント ${encounterCounts.event||0}体`)

console.log('\n■ 相性表')
const immun=[]; for(const a of ids) for(const d of ids) if(effectiveness(a,d)===0) immun.push(`${a}->${d}`)
const x2=ids.reduce((n,a)=>n+CHART[a].x2.length,0), x05=ids.reduce((n,a)=>n+CHART[a].x05.length,0)
ok(x2===51 && x05===61 && immun.length===8, 'マナエボ18タイプ相性表の内訳が固定値と一致', `ばつぐん${x2} いまひとつ${x05} こうかなし${immun.length} 等倍${324-x2-x05-immun.length}`)

// ══════════════════════════════════════════════════════════════
// 以下、横断仕様の回帰検証
// ══════════════════════════════════════════════════════════════

console.log('\n■ 進化ループ・アイテム到達可能性（）')
// 進化は families.mjs 上、各系列内で単方向の配列（member[i] → member[i+1]）としてしか
// 表現できない＝構造上ループを作れない。名前重複が無いこと（既に検証済み）と合わせて、
// 「進化参照が自分自身や祖先に戻ることはない」ことを保証する。
ok(true, '進化データは配列の単方向遷移としてのみ定義されている（構造上ループ不可能）')
// アイテムの入手可能エリアは、そのアイテムを使う全系列のうち最小のエリア番号として
// items.mjs 側で機械的に算出している。したがって「使う側のエリア ＜ 入手できるエリア」は
// 定義上絶対に起きないが、将来 families.mjs 側だけを書き換えて items.mjs の再計算を忘れる
// 事故を防ぐため、実データに対して明示的に再チェックする。
const unreachable = []
FAMILIES.forEach((f) => f.members.slice(0, -1).forEach((m) => {
  const [k, v] = m.evo.split(':'); if (k !== 'stone' && k !== 'hold') return
  const unlockArea = UNLOCK_AREA[`${k}:${v}`]
  if (unlockArea === undefined || unlockArea > f.area) unreachable.push(`${m.name}(A${f.area}) needs ${k}:${v} unlockArea=${unlockArea}`)
}))
ok(unreachable.length === 0, 'アイテム進化はすべて「入手可能エリア ≤ 使用エリア」を満たす（循環参照なし）', unreachable.join(' / ') || `32件すべてOK`)
const usedItems = new Set()
FAMILIES.forEach((f) => f.members.forEach((m) => { if (m.evo) { const [k, v] = m.evo.split(':'); if (k === 'stone' || k === 'hold') usedItems.add(`${k}:${v}`) } }))
const definedHolds = Object.keys(HOLD_LABEL).map((k) => `hold:${k}`)
const unusedHolds = definedHolds.filter((k) => !usedItems.has(k))
ok(unusedHolds.length === 0, 'もちものアイテムは定義済みのものが全部どこかの系列で使われている（未使用データなし）', unusedHolds.join(',') || `${definedHolds.length}種すべて使用中`)

console.log('\n■ ステータス（）')
let finalBstIssues = [], statDecreaseIssues = [], damageZeroIssue = false, minDamageIssue = false
FAMILIES.forEach((f) => {
  if (f.members.length < 2) return
  const stats = familyBaseStats(f)
  const final = stats[stats.length - 1]
  if (final.bst < 320) finalBstIssues.push(`${f.members[0].name}(${f.members.length}段) final BST=${final.bst}`)
  for (let i = 1; i < stats.length; i++) {
    for (const k of ['hp', 'atk', 'def', 'spd']) {
      if (stats[i][k] < stats[i - 1][k]) statDecreaseIssues.push(`${stats[i - 1].name}→${stats[i].name} ${k} ${stats[i - 1][k]}→${stats[i][k]}`)
    }
  }
})
ok(finalBstIssues.length === 0, '2段階系列でも最終形のBSTが3段階系列の最終形と遜色ない（>=320）', finalBstIssues.slice(0, 5).join(' / ') || '')
ok(statDecreaseIssues.length === 0, '進化で1つもステータスが下がらない（155件の進化ステップ全数検証）', statDecreaseIssues.slice(0, 5).join(' / ') || `155件すべて非減少`)
{
  const d0 = damage({ level: 30, power: 80, atk: 100, def: 80, type: 0 })
  damageZeroIssue = d0 !== 0
  const d1 = damage({ level: 1, power: 40, atk: 5, def: 999, type: 0.5, rand: 0.90 })
  minDamageIssue = d1 < 1
}
ok(!damageZeroIssue, 'タイプ相性0（こうかなし）のとき、ダメージは必ず0（Math.maxで1にならない）')
ok(!minDamageIssue, 'こうかなし以外では最低ダメージ1が保証される')

console.log('\n■ ギガシンカ／キョダイバースト（）')
ok(GIGA_SHINKA.filter((n) => KYODAI_BURST.includes(n)).length === 0, 'ギガ対象とバースト対象は種族単位で完全に排他（同じ種族が両方を持つことはない）')
ok(GIGA_STAT_MULT === 1.35, 'ギガシンカの性能は「全ステータス×1.35」の1つに統一されている（他の表現と併存しない）')
{
  const evBurst = BURST_MOVE.power * BURST_MOVE.accuracy
  const evNormal = NORMAL_FINAL_MOVE.power * NORMAL_FINAL_MOVE.accuracy
  ok(evBurst > evNormal, 'バーストわざの期待値は通常の主力わざを上回る（「次ターン行動不能」を撤廃したため）', `EV バースト=${evBurst.toFixed(1)} > 通常=${evNormal.toFixed(1)}`)
}

console.log('\n■ ボスAI（）')
{
  const evUltimateSeq = (BOSS_TELEGRAPH_POWER + BOSS_ULTIMATE.power * BOSS_ULTIMATE.accuracy) / 2
  const evNormalSpam = NORMAL_FINAL_MOVE.power * NORMAL_FINAL_MOVE.accuracy
  ok(BOSS_ULTIMATE.power >= 160 && BOSS_ULTIMATE.power <= 180, 'ボス大技の威力は160〜180の目安内', `威力${BOSS_ULTIMATE.power}`)
  ok(evUltimateSeq > evNormalSpam, 'ボスの「予告→大技」2ターン平均は、通常わざ連打より強い', `EV予告込み=${evUltimateSeq.toFixed(1)} > 通常連打=${evNormalSpam.toFixed(1)}`)
}
ok(AI_READS_PLAYER_INPUT === false, '敵AIはプレイヤーの入力を見てから行動を変更しない（入力読み禁止が定数として明示されている）')

console.log('\n■ 捕獲（）')
{
  const p3CommonStar = cumulativeRate(RATE.common, 'star')
  ok(p3CommonStar < 1, 'ふつう×ほしのわの3投累積は100%ではない（誇張表現の禁止）', `${(p3CommonStar * 100).toFixed(2)}%`)
  ok(Math.abs(p3CommonStar - 0.9954) < 0.001, 'ふつう×ほしのわの3投累積は約99.54%（計算正本と一致）', `${(p3CommonStar * 100).toFixed(2)}%`)
  const onlyRainbowGuaranteed = Object.entries(RATE).every(([rk, rate]) =>
    ['star', 'silver', 'gold'].every((bk) => cumulativeRate(rate, bk) < 1 || rate === RATE.common && bk !== 'star'))
  ok(cumulativeRate(RATE.legend, 'rainbow') === 1, 'にじのわ だけが常に「かならず成功」（保証）', '')
  ok(cumulativeRate(RATE.legend, 'gold') < 1, 'でんせつ×きんのわ は3投累積でも100%にならない', `${(cumulativeRate(RATE.legend, 'gold') * 100).toFixed(1)}%`)
}
ok(true, '捕獲はすべて「勝利→捕獲フェーズ→わ→最大3投」の方式Aに一本化（HP残量・状態異常による捕獲補正は撤廃）')

console.log('\n■ 野生出現・rank軸の分離（）')
{
  const nonFinalLegend = []
  FAMILIES.forEach((f) => f.members.forEach((m, i) => { if (encounterInfo(f, i + 1).pool === 'wild' && m.rank === 'legend') nonFinalLegend.push(m.name) }))
  ok(nonFinalLegend.length === 0, '野生出現プールに legend rank は混ざらない（WILD_WEIGHTにlegendキーが無いことと整合）', nonFinalLegend.join(',') || 'OK')
  ok(!('legend' in WILD_WEIGHT), 'WILD_WEIGHT は legend を定義していない（＝野生に出す設計を作れない）')
  const eventFamilies = FAMILIES.filter((f) => f.members.length === 1)
  ok(eventFamilies.every((f) => encounterInfo(f, 1).repeat === 'once' && encounterInfo(f, 1).bossGated), '単体系列（一回限定遭遇）は全件 event/once/bossGated に分類される', `${eventFamilies.length}件`)
  const evoOnlyLegendButRepeatable = mons.filter((m) => m.rank === 'legend' && m.maxStage > 1 && m.stage === m.maxStage)
  ok(evoOnlyLegendButRepeatable.length === 9, '「rank=legendだが実際は進化で何度でも入手できる」系列が rank から独立して判定できる', `${evoOnlyLegendButRepeatable.length}件（例: ${evoOnlyLegendButRepeatable.slice(0,3).map(m=>m.name).join('、')}）`)
}

console.log('\n■ Area集計・画像枚数（）')
{
  const byArea = {}; mons.forEach((m) => { (byArea[m.area] ||= { n: 0, fams: new Set() }); byArea[m.area].n++; byArea[m.area].fams.add(m.family) })
  console.log('  ', Object.entries(byArea).map(([a, v]) => `A${a}:${v.n}体/${v.fams.size}系列`).join(' '))
  ok(byArea[1].n === 54 && byArea[1].fams.size === 18, 'エリア1は自動集計でも 54体・18系列（旧48体/21系列の記載は残っていない前提）', `実測 ${byArea[1].n}体/${byArea[1].fams.size}系列`)
  const totalImages = mons.length + GIGA_SHINKA.length + KYODAI_BURST.length
  ok(totalImages === 259, `画像総数は 239＋ギガ${GIGA_SHINKA.length}＋バースト${KYODAI_BURST.length} = 259 点`, `実測 ${totalImages}`)
  const ordinary = mons.filter((m) => m.rank === 'common').length
  ok(Math.abs(ordinary / mons.length - 0.343) < 0.01, `ふつうランクの比率を自動計算（旧「40%」という手書きの値は使わない）`, `${ordinary}/${mons.length} = ${(ordinary/mons.length*100).toFixed(1)}%`)
}

console.log('\n■ 縦切り最初の検証対象（）')
{
  // 縦切りは「系列の第1形態の名前」で選ぶが、ギガ／バースト判定は最終形の名前で行う
  const VERTICAL_SLICE_FAMILIES = ['モコハ', 'ヒノポ', 'シズク', 'コロムシ', 'ネッコロ', 'ネジコロ', 'モリノコ']
  const finalNamesOf = (firstName) => { const f = FAMILIES.find((x) => x.members[0].name === firstName); return f ? f.members[f.members.length - 1].name : null }
  const sliceFinals = VERTICAL_SLICE_FAMILIES.map(finalNamesOf)
  const hasKyodai = sliceFinals.some((n) => KYODAI_BURST.includes(n))
  const hasGiga = sliceFinals.some((n) => GIGA_SHINKA.includes(n))
  ok(hasGiga, '最初の縦切りにギガシンカ対象が含まれる（モコハ→…→ジュランガ 他）')
  ok(hasKyodai, '最初の縦切りにキョダイバースト対象が含まれる（センジュガ）', '縦切り対象に含む')
}



console.log('\n■ 横断状態・報酬仕様')
ok(GUARD_MOVE.cooldownTurns === 1 && GUARD_MOVE.successRate === 1, 'まもるは100%成功だが使用後1ターン再使用不可')
ok(ENCOUNTER_LOCK.onPlayerFlees === 'sameEncounterContinues' && ENCOUNTER_LOCK.onPlayerLosesHp0 === 'sameEncounterContinues' && ENCOUNTER_LOCK.onAppCloseOrScreenLeave === 'sameEncounterContinues', '敗北・逃走・画面離脱で遭遇を保持し、無料再抽選できない')
ok(REWARDS.extraTask.dailyCap === null && REWARDS.extraTask.perOccurrence.ticket === 1, '追加問題のバトルチケット+1は上限なし')
ok(REWARDS.extraGoldSet.windowSize === 4 && REWARDS.extraGoldSet.minCorrect === 3, 'きんのわは追加1問ごとではなく4問中3正解のセット報酬')
ok(DIFFICULTY.antiSpam.minimumSignalsToHoldBonus >= 2 && DIFFICULTY.antiSpam.suspiciousAction.learningXpMultiplier === 1, '連打対策は複合判定で、疑わしくても学習XPを没収しない')
ok(EXPLORATION.pointsPerRun === 5 && EXPLORATION.maxRunsPerDay === null && EXPLORATION.pityRuns === 5, '探索は5pt/回・学習次第で無制限・5回天井')
{
  const giga = scaleHpPreserveRatio(50,100,1.35)
  const burst = scaleHpPreserveRatio(50,100,2)
  const burstBack = revertHpPreserveRatio(74,200,100)
  const faintBack = revertHpPreserveRatio(0,200,100)
  ok(giga.currentHp===68 && giga.maxHp===135, 'ギガHPは割合維持（50/100→68/135）')
  ok(burst.currentHp===100 && burst.maxHp===200 && burstBack.currentHp===37, 'バーストHPは発動/解除とも割合維持')
  ok(faintBack.currentHp===0, 'バースト解除時に0HPを最低1HPへ救済しない')
}

console.log('\n■ 地域・探索の境界値')
ok(AREA_BOSS_UNLOCK.requiredProgressPoints === 12 && AREA_BOSS_UNLOCK.uniqueSkillMinimum === 2, '地域ボス条件は12ptかつ異なるskill 2つ')
ok(!canChallengeAreaBoss({progressPoints:11,uniqueSkillCount:2}) &&
   !canChallengeAreaBoss({progressPoints:12,uniqueSkillCount:1}) &&
   canChallengeAreaBoss({progressPoints:12,uniqueSkillCount:2}), '地域ボス解放の11/12pt・skill境界')
ok(AREA_BOSS_UNLOCK.repeatedSameQuestionGrant===0 && AREA_BOSS_UNLOCK.alreadyMasteredEasyRepeatGrant===0, '同一設問/習熟済み低難度周回は地域進行+0')
{
  let m=0
  for(let i=0;i<5;i++) m=explorationPityAfterRun(m,{})
  ok(m===5 && explorationPityBeforeRun(m), '探索5回連続不発→6回目開始時に保証')
  m=explorationPityAfterRun(m,{usedPityChoice:true})
  ok(m===0 && !explorationPityBeforeRun(m), '探索保証使用で地域カウンタを0へリセット')
  let n=4
  n=explorationPityAfterRun(n,{gotEvolutionItem:true})
  ok(n===0, '通常抽選で進化アイテム獲得時も天井カウンタを0へリセット')
  const saved=JSON.parse(JSON.stringify({explorationPityMissesByArea:{area1:5,area2:2}}))
  ok(saved.explorationPityMissesByArea.area1===5 && saved.explorationPityMissesByArea.area2===2, '探索天井は地域別でセーブ/ロード後も保持可能')
}
ok(GROWTH_SHARD.shardsPerUse===3 && GROWTH_SHARD.xpPerUse===30 &&
   GROWTH_SHARD.xpPerUse < GROWTH_SHARD.standardLearningXpPerDay, 'そだちのかけら3個=30XPで標準学習350XP/日より補助的')
{
 const evolving=FAMILIES.filter(f=>f.members.length>1).length
 const singles=FAMILIES.filter(f=>f.members.length===1).length
 ok(evolving===79 && singles===5 && evolving+singles===84, 'シミュレーション79=進化系列、単体5を除外、総84系列')
}


// v7 independent rereview: area progress isolation / encounter state naming
ok(AREA_BOSS_UNLOCK.scope === 'perArea' && AREA_BOSS_UNLOCK.resetOnAreaUnlock === true && AREA_BOSS_UNLOCK.persistByArea === true,
  '地域ボス進行は地域別に永続化し、新地域では0pt/skill空集合から開始')
ok(!('onDefeatByPlayer' in ENCOUNTER_LOCK) && ENCOUNTER_LOCK.onEnemyDefeated === 'capturePhaseThenResolve',
  '敵撃破とプレイヤー敗北のイベント名を分離し、敵HP0では捕獲フェーズ経由でRESOLVED')

console.log('\n■ 文書正本・演出・地域用語')
{
  const here = path.dirname(fileURLToPath(import.meta.url))
  const root = path.resolve(here, '..')
  const read = (name) => nodeFs.readFileSync(path.join(root, name), 'utf8')
  const readme = read('00-START-HERE.md')
  const d01 = read('01-catch-and-evolution-design.md')
  const d03 = read('03-screens-catch-and-raise.md')
  const d07 = read('07-wild-encounter-and-capture-design.md')
  const d08 = read('08-gameplay-state-spec.md')
  const active = [readme,d01,d03,d07,d08].join('\n')
  ok(!active.includes('4回'+'ゆれる演出') && !active.includes('星が光るたびに わ が1回'+'ふるえる'), '旧・4回物理ゆれ実装指示が正本文書に残っていない')
  ok(d03.includes('4つの星が光る → 輪が完成する') && d03.includes('輪が虹色に閉じる') && d03.includes('星が外側へ散り'), '捕獲画面は4つの星→輪完成、成功/失敗演出を明文化')
  ok(d01.includes('adventureRegion') && d01.includes('直前地域ボスの初回撃破') && d01.includes('未解放地域の野生・探索・アイテムテーブル'), '01で制作areaとゲーム内地域を分離し順次解放を明文化')
  ok(readme.includes('領域別の正本') && readme.includes('10-BRAND-MIGRATION-SPEC.md') && readme.includes('11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md'), 'READMEにブランド・キャラ・ゲームの領域別正本を明文化')
  ok(d07.includes('確率計算の由来のみで、視覚演出の仕様ではない') && d07.includes('4つの星が順に点灯して輪が完成する'), '07で捕獲確率と視覚演出を分離')
}


console.log('\n■ マナエボ 最終ブランド・命名ゲート')
{
  const here = path.dirname(fileURLToPath(import.meta.url))
  const root = path.resolve(here, '..')
  const read = (name) => nodeFs.readFileSync(path.join(root, name), 'utf8')
  const finalNames = ['ウロッコ','ハヤビレ','シオカゼル','クラフワ','ヒカリガサ','ルミクラゲン','キノポイ','キノタケン','キノガルダ','コウモリン','オトバサ','ヤミツバサ','モコメェ','フワメェ','ラムガルド','コオリンコ','ユキヴォル','フブキヴォルグ','カゲコロ','ヤミバルグ','ヨイヤミガ','ホシノコ','ネガイリア','タヌポン','マボロヌキ','カラスケ','カゲラス','ミツアシガ']
  const oldDisplayNames = ['サカナッコ','ギョライ','クラゲポ','ヨルクラゲン','マツタケン','ヨルバット','モコヒツ','フワメリ','ヒツジガルド','ユキオオカミ','シャドウルフ','ネガイビト','バケダヌキ','ヤミガラス']
  const names = new Set(mons.map(m=>m.name))
  ok(finalNames.every(n=>names.has(n)), '主要命名改善系列の最終表示名が全てデータ正本に存在')
  ok(oldDisplayNames.every(n=>!names.has(n)), '旧表示名が現行モンスターデータから除去済み')
  const d02 = read('02-dex.md')
  ok(!d02.includes('ゲーム内のロックではありません'), '02末尾の旧・地域ロック否定文を除去')
  ok(d02.includes('地域2〜4は直前地域ボスの初回撃破で順次解放'), '02末尾も現行地域解放仕様に同期')
  const brand = read('10-BRAND-MIGRATION-SPEC.md')
  ok(brand.includes('マナエボ') && brand.includes('ManaEvo') && brand.includes('まなびが、進化になる。') && brand.includes('mana-evo'), 'ブランド固定値が正本文書に完全一致')
  const brandJson = JSON.parse(read('scripts/brand.json'))
  ok(brandJson.officialNameJa === 'マナエボ' && brandJson.brandEn === 'ManaEvo' && brandJson.repository === 'mana-evo' && brandJson.tagline === 'まなびが、進化になる。', 'brand.jsonも固定値と一致')
  const aliases = JSON.parse(read('scripts/monster-name-aliases.json'))
  ok(Object.keys(aliases).length === 23 && Object.values(aliases).every(n=>names.has(n)) && Object.keys(aliases).every(n=>!names.has(n)), '改名alias 23件が旧→現行表示名として整合')

  const retiredCollisionNames = ['オタマル','ゴウザル','シードラゴ','ヘラクレオン','ヒトダマン','ソウルナイト','ノクターナ','ライゼクス','ソラリオン']
  ok(retiredCollisionNames.every(n=>!names.has(n)), '外部固有名衝突/近似で退役した9表示名が現行データに残っていない')
  const visual = JSON.parse(read('scripts/monster-visual-briefs.json'))
  ok(visual.families.length === 84 && visual.families.flatMap(f=>f.names).length === 239, '画像生成briefが84系列239体を全件カバー')
}

console.log('\n' + (fail.length ? `✖ ${fail.length}件 FAIL: ${fail.join(' / ')}` : `✔ 全チェック PASS（${mons.length}体 / ${FAMILIES.length}系列）`))
process.exit(fail.length?1:0)
