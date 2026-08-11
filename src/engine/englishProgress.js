// 英単語・会話表現用の間隔反復。録音・自己申告ではこの関数を呼ばない。
// 初見→1日→3日→7日→14日後。最後の14日後確認が終わってから習得。
export const ENGLISH_REVIEW_DAYS = [0, 1, 3, 7, 14, 30]

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
  const stage = canAdvance ? Math.min(5, prev.stage + 1) : prev.stage
  return {
    ...prev,
    correct: prev.correct + 1,
    streak: prev.streak + 1,
    stage,
    lastDay: today,
    nextDue: today + ENGLISH_REVIEW_DAYS[stage],
    masteredAt: stage >= 5 ? (prev.masteredAt || at) : null,
    lastAnsweredAt: at
  }
}

// 英語は汎用SRSへ二重登録せず、この進捗だけから「とっくん」を組み立てる。
export function englishDueEntries(state, today) {
  const sources = [
    ['enw:', state?.englishWordStats],
    ['enp:', state?.englishPhraseStats],
    ['ena:', state?.englishAlphabetStats]
  ]
  const out = []
  for (const [prefix, stats] of sources) {
    for (const [id, entry] of Object.entries(stats || {})) {
      if (((entry.correct || 0) > 0 || (entry.wrong || 0) > 0) && (entry.nextDue ?? Infinity) <= today) {
        out.push({ domainId: 'english', key: `${prefix}${id}`, entry: { ...entry, due: entry.nextDue } })
      }
    }
  }
  return out.sort((a, b) => (a.entry.due ?? 0) - (b.entry.due ?? 0))
}

export function englishDaysUntilNext(state, today) {
  let next = Infinity
  for (const stats of [state?.englishWordStats, state?.englishPhraseStats, state?.englishAlphabetStats]) {
    for (const entry of Object.values(stats || {})) {
      const days = (entry.nextDue ?? Infinity) - today
      if (((entry.correct || 0) > 0 || (entry.wrong || 0) > 0) && days > 0) next = Math.min(next, days)
    }
  }
  return Number.isFinite(next) ? next : null
}
