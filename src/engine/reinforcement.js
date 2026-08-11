export function reinforcementTargetIndex(questionIndex) {
  return questionIndex + 2
}

export function reinforcementExtraCount(baseQuestionCount, currentExtraCount, questionIndex) {
  return Math.max(currentExtraCount, reinforcementTargetIndex(questionIndex) + 1 - baseQuestionCount)
}
