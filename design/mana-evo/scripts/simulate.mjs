// 長期運用シミュレーション。
// 旧「約440日」は確定値ではなく基準ケース。捕獲・遭遇・探索の待ちを係数で織り込む3ケースを出す。
import { FAMILIES } from './families.mjs'

function baseDaysToFinal(family) {
  if (family.starter) return 12.0
  if (family.members.length === 2) return 11.0
  switch (family.members[0].rank) {
    case 'common': return 16.0
    case 'rare': return 19.0
    case 'epic': return 26.0
    case 'legend': return 30.0
    default: return 18.0
  }
}

export const SCENARIOS = {
  standard: { label: '標準ケース', learningSpeed: 1.00, encounterWait: 1.08, captureWait: 1.05, explorationWait: 1.06 },
  unlucky: { label: 'やや不運ケース', learningSpeed: 1.00, encounterWait: 1.20, captureWait: 1.15, explorationWait: 1.18 },
  highStudy: { label: '高学習ケース', learningSpeed: 1.45, encounterWait: 1.04, captureWait: 1.03, explorationWait: 1.02 },
}

export function simulateDexCompletion(scenarioKey='standard') {
  const sc=SCENARIOS[scenarioKey]
  const wait=sc.encounterWait*sc.captureWait*sc.explorationWait
  const jobs=FAMILIES.filter(f=>f.members.length>1).map(f=>({
    name:f.members[0].name,
    area:f.area,
    duration:baseDaysToFinal(f)*wait/sc.learningSpeed,
  }))
  const workers=[0,0,0], completions=[]
  for (const job of jobs) {
    const wi=workers.indexOf(Math.min(...workers)); const start=workers[wi]; const finish=start+job.duration
    workers[wi]=finish; completions.push({...job, finish})
  }
  completions.sort((a,b)=>a.finish-b.finish)
  return {scenario:sc, jobs, completions, totalFamilies:jobs.length, singles:FAMILIES.length-jobs.length}
}

if ((process.argv[1]||'').endsWith('simulate.mjs')) {
  console.log('■ 図鑑進行シミュレーション（確定値ではなく比較用の目安）')
  for (const key of Object.keys(SCENARIOS)) {
    const {scenario, completions,totalFamilies}=simulateDexCompletion(key)
    const last=completions.at(-1)
    const milestones=[30,90,180,365].map(d=>`${d}日:${completions.filter(c=>c.finish<=d).length}系列`).join(' / ')
    console.log(`  ${scenario.label}: ${milestones} / 全${totalFamilies}系列≈${last.finish.toFixed(0)}日`)
  }
  console.log('  ※ 遭遇・捕獲・探索は簡易係数。実運用ログで再推定する。旧440日は「基準ケース」の一例で、完成保証日ではない。')
}
