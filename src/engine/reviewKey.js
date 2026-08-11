// 問題を三つの粒度で扱う。
// knowledgeId: 同じ知識か（選択肢の順番では変わらない）
// unitId/skillId: どの単元を練習するか
// questionInstanceId: 今回の数値・問題文を含む設問。誤答補強の再出題に使う。

export function baseItemKey(key) { return String(key || '').split('#')[0] }

function hash(text) {
  let value = 0x811c9dc5
  for (let i = 0; i < text.length; i++) { value ^= text.charCodeAt(i); value = Math.imul(value, 0x01000193) }
  return (value >>> 0).toString(36)
}

function normalizedChoices(question) {
  return [...(question.choices || [])].map(({ id, label, emoji, grid }) => ({ id, label, emoji, grid }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
}

function stableKnowledgeId(question) {
  const unitId = question.unitId || question.skillId || ''
  // 算数は数値ではなく技能単位。翌日以降は同じ技能の別の類題にする。
  if (question.domain === 'suuji' && unitId) return `skill:${unitId}`
  // 書字は別の文字の成功を流用しない。学年も単元IDから復元できるようにする。
  if (question.domain === 'kaku' && question.target) {
    const grade = question.grade ?? String(unitId).split(':')[1] ?? ''
    return `char:${grade}:${question.target}`
  }
  // 固定教材は itemKey 自体が安定ID。問題文・正解・選択肢順は混ぜない。
  const itemKey = baseItemKey(question.itemKey)
  if (itemKey) return itemKey
  return `${question.domain || 'item'}:${hash(JSON.stringify({ unitId, target: question.target || '' }))}`
}

function instanceFingerprint(question, knowledgeId) {
  return JSON.stringify({
    knowledgeId,
    instruction: question.instruction || '',
    answerId: question.answerId || '',
    visual: question.visual || null,
    // 表示時のランダムな並べ替えだけを除く。答え・数値・問題文が違えば変わる。
    choices: normalizedChoices(question),
    items: [...(question.items || [])].map(({ id, label, shape, color }) => ({ id, label, shape, color })).sort((a, b) => String(a.id).localeCompare(String(b.id))),
    correctOrder: question.correctOrder || null,
    correctGroups: question.correctGroups || null
  })
}

export function questionIds(question) {
  if (!question) return { knowledgeId: null, unitId: null, skillId: null, questionInstanceId: null }
  const unitId = question.unitId || question.skillId || null
  const knowledgeId = stableKnowledgeId(question)
  // 古い保存に入ったIDは再計算して正規化する。今回生成済みのIDだけは同じ値になる。
  const questionInstanceId = `${knowledgeId}#${hash(instanceFingerprint(question, knowledgeId))}`
  return { knowledgeId, unitId, skillId: question.skillId || unitId, questionInstanceId }
}

export function withQuestionIds(question) {
  if (!question) return question
  return { ...question, ...questionIds(question) }
}

// 旧API互換。SRS・単元達成とも知識IDを使う。
export function reviewKeyFor(question) { return questionIds(question).knowledgeId }

export function snapshotQuestion(question, reviewKey = reviewKeyFor(question)) {
  if (!question || !reviewKey) return null
  const { reviewKey: _reviewKey, ...snapshot } = withQuestionIds(question)
  return { ...snapshot, reviewKey, reinforcement: true }
}

// 算数の翌日以降は同じskillIdの類題を作るので、式のスナップショットは永続化しない。
export function persistentReviewSnapshot(domainId, question, reviewKey = reviewKeyFor(question)) {
  return domainId === 'suuji' ? null : snapshotQuestion(question, reviewKey)
}

export function savedReviewQuestion(state, domainId, reviewKey) {
  const question = state.reviewQuestions?.[domainId]?.[reviewKey]
  return question ? withQuestionIds({ ...question, reviewKey }) : null
}
