// ============================================================
// 毎日ミッションの構造
//
//  - コアミッション: 最短15分で終わる量。タスク数 × 1〜2分。
//  - 各タスク: 数問の小さなまとまり（テンポよくクリアを積む）。
//  - おかわり: コア後に最大30分まで遊べる追加タスク。
//  - 追加問題(extra): 息抜きバトルの「解放チケット」がもらえる枠。
//
// タスクは「どの分野を何問」だけを持ち、難易度は実行時に
// その分野の現在の習熟度から決める（＝アダプティブ）。
// ============================================================

import { availableDomains } from './activities.js'

export const QUESTIONS_PER_TASK = 4 // 1タスクの問題数（1〜2分目安）
export const CORE_TASK_COUNT = 5 // コアのタスク数（約15分）

let taskSeq = 0
function makeTask(domainId, kind) {
  return {
    uid: `t${Date.now()}_${taskSeq++}`,
    domainId,
    kind, // 'core' | 'okawari' | 'extra'
    questionCount: QUESTIONS_PER_TASK
  }
}

// 利用可能な分野を順番に割り当てる（今は「よむ」のみ。増えれば自動で混ざる）
function pickDomainId(i) {
  const doms = availableDomains()
  if (!doms.length) return 'yomu'
  return doms[i % doms.length].id
}

// 今日のコアミッションを作る
export function buildCoreMission() {
  const tasks = []
  for (let i = 0; i < CORE_TASK_COUNT; i++) {
    tasks.push(makeTask(pickDomainId(i), 'core'))
  }
  return tasks
}

// おかわりタスク（コア後の追加。1つずつ生成）
export function buildOkawariTask(index = 0) {
  return makeTask(pickDomainId(index), 'okawari')
}

// 追加問題（解放チケット用）。少し短めにしてテンポを保つ。
export function buildExtraTask(index = 0) {
  const t = makeTask(pickDomainId(index), 'extra')
  t.questionCount = 3
  return t
}
