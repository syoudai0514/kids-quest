// ふつう／むずかしいで分離した学習台帳のうち、いま表示・出題する側を選ぶ。
// 現時点のhard専用教材は小4〜6算数だけなので、他教科は通常台帳を使う。
export function activeStatsDomainId(state, domainId, grade = state.grade) {
  return state.settings?.mode === 'hard' && domainId === 'suuji' && grade >= 4
    ? 'hard:suuji'
    : domainId
}

// 反対モードの算数SRSは削除せず、切り替えるまで一覧から隠す。
export function activeReviewSrs(state) {
  const activeMath = activeStatsDomainId(state, 'suuji')
  return Object.fromEntries(Object.entries(state.srs || {}).filter(([domainId]) => {
    if (domainId === 'suuji' || domainId === 'hard:suuji') return domainId === activeMath
    return !domainId.startsWith('hard:')
  }))
}
