// 英単語・会話表現用の間隔反復。録音・自己申告ではこの関数を呼ばない。
export const ENGLISH_REVIEW_DAYS = [0, 1, 3, 7, 14]

export function emptyEnglishProgress(today = 0) {
  return { correct: 0, wrong: 0, streak: 0, stage: 0, lastDay: null, nextDue: today, speakingCount: 0 }
}

export function advanceEnglishProgress(previous, correct, today, at = Date.now()) {
  const prev = previous || emptyEnglishProgress(today)
  if (!correct) {
    const stage = Math.max(0, prev.stage - 1)
    return { ...prev, wrong: prev.wrong + 1, streak: 0, stage, nextDue: today + 1, lastAnsweredAt: at }
  }
  // 同じ日に何問正解しても、習得段階は一度しか進めない。
  const canAdvance = prev.lastDay !== today && (prev.stage === 0 || (prev.nextDue ?? today) <= today)
  const stage = canAdvance ? Math.min(4, prev.stage + 1) : prev.stage
  return {
    ...prev,
    correct: prev.correct + 1,
    streak: prev.streak + 1,
    stage,
    lastDay: today,
    nextDue: today + ENGLISH_REVIEW_DAYS[stage],
    masteredAt: stage >= 4 ? (prev.masteredAt || at) : null,
    lastAnsweredAt: at
  }
}
