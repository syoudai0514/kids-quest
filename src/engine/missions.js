// ============================================================
// 毎日ミッションの構造
//
//  - コアミッション: 5タスク × 4問（各タスク1〜2分 ≒ 最短15分）
//  - おかわり: コア後の追加タスク。1日 OKAWARI_MAX 回まで（≒最大30分）
//  - 追加問題(extra): 3問。クリアで息抜きバトルの解放チケット
//
// タスクは「どの分野を何問」だけを持ち、難易度は実行時に
// その分野の現在の習熟度から決める（＝アダプティブ）。
// ============================================================

import { domainsForGrade } from './activities.js'
import { dayNumber } from './srs.js'

export const QUESTIONS_PER_TASK = 4 // 1タスクの問題数（1〜2分目安）
export const CORE_TASK_COUNT = 5 // コアのタスク数（約15分）
export const OKAWARI_MAX = 6 // おかわりの1日上限（コアと合わせて約30分）

let taskSeq = 0
function makeTask(domainId, kind) {
  return {
    uid: `t${Date.now()}_${taskSeq++}`,
    domainId,
    kind, // 'core' | 'okawari' | 'extra'
    questionCount: QUESTIONS_PER_TASK
  }
}

// 国語・算数を中心にしつつ、他教科にも定期的に触れる。道徳は週2回程度。
function weeklyDomains(grade, today) {
  const available = new Set(domainsForGrade(grade).map((d) => d.id))
  const elective = (grade >= 3 ? ['kaku', 'rika', 'shakai', 'english'] : ['kaku', 'seikatsu', 'english']).filter((id) => available.has(id))
  const day = ((today % 7) + 7) % 7
  // 国語・算数は毎日。道徳は週2日だけ。残りは日替わりで必要教科を回す。
  const ids = ['yomu', 'suuji'].filter((id) => available.has(id))
  const moralDay = day === 1 || day === 5
  if (moralDay && available.has('doutoku')) ids.push('doutoku')
  for (let i = 0; ids.length < 5 && elective.length; i++) {
    const id = elective[(day * 2 + i) % elective.length]
    if (!ids.includes(id)) ids.push(id)
  }
  return ids.slice(0, 5)
}

// コアミッションは その学年の教科を ひととおり まわす
export function buildCoreMission(grade = 0, today = dayNumber()) {
  const tasks = []
  for (const domainId of weeklyDomains(grade, today)) {
    const task = makeTask(domainId, 'core')
    if (domainId === 'yomu' || domainId === 'suuji') task.questionCount = 5
    if (domainId === 'doutoku') task.questionCount = 2
    tasks.push(task)
  }
  return tasks
}

export function buildOkawariTask(index = 0, grade = 0) {
  return makeTask(weeklyDomains(grade, dayNumber() + index)[index % weeklyDomains(grade, dayNumber() + index).length], 'okawari')
}

// 追加問題（解放チケット用）。少し短めにしてテンポを保つ。
export function buildExtraTask(index = 0, grade = 0) {
  const ids = weeklyDomains(grade, dayNumber() + index)
  const t = makeTask(ids[index % ids.length], 'extra')
  t.questionCount = 3
  return t
}

// じゆうべんきょう: 好きな教科をいつでも単発で。
// チケットは付かないので、ごほうび目当ての抜け道にはならない。
export function buildFreeTask(domainId) {
  return makeTask(domainId, 'free')
}
