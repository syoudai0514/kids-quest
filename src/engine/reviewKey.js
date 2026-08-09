// ============================================================
// 復習キーと問題スナップショット
//
// 以前は算数の復習キーが `n:add10` のように出題タイプだけだったため、
// 「7+6」でつまずいても別のたし算が出てしまっていた。新しい問題には
// 問題文・答え・図を元にした短い識別子を付け、元の問題をそのまま保存する。
// ============================================================

/** 表示・旧ジェネレーター用に、問題種別だけを取り出す。 */
export function baseItemKey(key) {
  return String(key || '').split('#')[0]
}

function fingerprint(question) {
  return JSON.stringify({
    instruction: question.instruction || '',
    answerId: question.answerId || '',
    type: question.type || 'choice',
    visual: question.visual || null,
    choices: (question.choices || []).map(({ id, label, emoji, grid }) => ({ id, label, emoji, grid })),
    items: (question.items || []).map(({ id, label, shape, color }) => ({ id, label, shape, color })),
    correctOrder: question.correctOrder || null,
    correctGroups: question.correctGroups || null
  })
}

// FNV-1a。暗号用途ではなく、localStorage のキーを短く安定させるためだけに使う。
function hash(text) {
  let value = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 0x01000193)
  }
  return (value >>> 0).toString(36)
}

/**
 * 新規出題の復習キーを返す。
 * すでに復習として出した問題は、保存済みキーを優先してそのまま使う。
 */
export function reviewKeyFor(question) {
  if (!question?.itemKey) return null
  if (question.reviewKey) return question.reviewKey
  return `${baseItemKey(question.itemKey)}#${hash(fingerprint(question))}`
}

/** localStorage に保存してよい、問題だけのコピーを作る。 */
export function snapshotQuestion(question, reviewKey = reviewKeyFor(question)) {
  if (!question || !reviewKey) return null
  const { reviewKey: _reviewKey, ...snapshot } = question
  return { ...snapshot, reviewKey }
}

/**
 * 保存済み問題を読む。古いセーブには無いので、その場合は null を返して
 * 従来の「同じ種類の類題」を生成する。
 */
export function savedReviewQuestion(state, domainId, reviewKey) {
  const question = state.reviewQuestions?.[domainId]?.[reviewKey]
  return question ? { ...question, reviewKey } : null
}
