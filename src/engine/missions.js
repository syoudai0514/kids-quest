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
function pickDomainId(i, grade = 0, today = dayNumber()) {
  const doms = domainsForGrade(grade)
  if (!doms.length) return 'yomu'
  const available = new Set(doms.map((d) => d.id))
  const base = grade >= 3
    ? ['yomu', 'suuji', 'kaku', 'rika', 'shakai', 'doutoku', 'english']
    : ['yomu', 'suuji', 'kaku', 'seikatsu', 'doutoku', 'english']
  const rotation = base.filter((id) => available.has(id))
  return rotation[(i + today) % rotation.length]
}

// コアミッションは その学年の教科を ひととおり まわす
export function buildCoreMission(grade = 0, today = dayNumber()) {
  const doms = domainsForGrade(grade)
  const count = Math.max(CORE_TASK_COUNT, Math.min(doms.length, 6))
  const tasks = []
  // 1日に同じ教科は重ねず、週内の開始位置をずらす。国語・算数は1タスクを
  // 5問、道徳は2問にして、学習量を重み付けする（英語の既存ローテは維持）。
  for (let i = 0, offset = 0; tasks.length < count && offset < doms.length * 2; offset++) {
    const domainId = pickDomainId(i + offset, grade, today)
    if (tasks.some((task) => task.domainId === domainId)) continue
    const task = makeTask(domainId, 'core')
    if (domainId === 'yomu' || domainId === 'suuji') task.questionCount = 5
    if (domainId === 'doutoku') task.questionCount = 2
    tasks.push(task)
  }
  return tasks
}

export function buildOkawariTask(index = 0, grade = 0) {
  return makeTask(pickDomainId(index, grade), 'okawari')
}

// 追加問題（解放チケット用）。少し短めにしてテンポを保つ。
export function buildExtraTask(index = 0, grade = 0) {
  const t = makeTask(pickDomainId(index, grade), 'extra')
  t.questionCount = 3
  return t
}

// じゆうべんきょう: 好きな教科をいつでも単発で。
// チケットは付かないので、ごほうび目当ての抜け道にはならない。
export function buildFreeTask(domainId) {
  return makeTask(domainId, 'free')
}
