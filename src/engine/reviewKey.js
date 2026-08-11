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

function knowledgeFingerprint(question) {
  // 固定知識は itemKey が教材の設問ID。算数だけは skillId を知識として復習し、
  // 翌日には同じ単元の別の類題を出す。
  if (question.domain === 'suuji' && (question.skillId || question.unitId)) return `skill:${question.skillId || question.unitId}`
  if (question.domain === 'kaku' && question.target) return `char:${question.grade ?? ''}:${question.target}`
  return JSON.stringify({
    domain: question.domain || '', unitId: question.unitId || question.skillId || '',
    itemKey: baseItemKey(question.itemKey), target: question.target || '',
    instruction: question.instruction || '', answerId: question.answerId || '',
    correctOrder: question.correctOrder || null, correctGroups: question.correctGroups || null
  })
}

function instanceFingerprint(question) {
  return JSON.stringify({
    knowledge: knowledgeFingerprint(question), visual: question.visual || null,
    // 並べ替えの偶然を除く。数値・問題文が違えば instance は変わる。
    choices: normalizedChoices(question), items: [...(question.items || [])].map(({ id, label, shape, color }) => ({ id, label, shape, color })).sort((a, b) => String(a.id).localeCompare(String(b.id)))
  })
}

export function questionIds(question) {
  if (!question) return { knowledgeId: null, unitId: null, skillId: null, questionInstanceId: null }
  const unitId = question.unitId || question.skillId || null
  const direct = knowledgeFingerprint(question)
  const knowledgeId = question.knowledgeId || (direct.startsWith('skill:') ? direct : `${question.domain || 'item'}:${hash(direct)}`)
  const questionInstanceId = question.questionInstanceId || `${knowledgeId}#${hash(instanceFingerprint(question))}`
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

export function savedReviewQuestion(state, domainId, reviewKey) {
  const question = state.reviewQuestions?.[domainId]?.[reviewKey]
  return question ? withQuestionIds({ ...question, reviewKey }) : null
}
