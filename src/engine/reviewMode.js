// hard専用教材（src/data/content/hard/配下）が存在する教科だけをここに足す。
// 教材の無い教科をここに入れると、統計だけ 'hard:xxx' 側へ切り替わって
// 通常の習熟度（skillOf）が空の状態から始まってしまうため、
// 実際にhardコンテンツを持つ教科だけを明示的に列挙する。
// さんすうだけ小1〜3向けのパズルバンク（suuji-puzzle-hard.js）を持つため
// 最低学年が低い。他の教科はまだ小4〜6の発展内容のみ。
const HARD_CONTENT_MIN_GRADE = { suuji: 1, yomu: 4, rika: 4, shakai: 4, english: 4 }
const DOMAINS_WITH_HARD_CONTENT = new Set(Object.keys(HARD_CONTENT_MIN_GRADE))

// ふつう／むずかしいで分離した学習台帳のうち、いま表示・出題する側を選ぶ。
export function activeStatsDomainId(state, domainId, grade = state.grade) {
  const minGrade = HARD_CONTENT_MIN_GRADE[domainId] ?? 4
  return state.settings?.mode === 'hard' && DOMAINS_WITH_HARD_CONTENT.has(domainId) && grade >= minGrade
    ? `hard:${domainId}`
    : domainId
}

// 反対モードのSRSは削除せず、切り替えるまで一覧から隠す。
// hardコンテンツを持つ教科（DOMAINS_WITH_HARD_CONTENT）は、いま有効な
// 側（'xxx' か 'hard:xxx'）だけを見せる。それ以外の教科は常に通常台帳のみ。
export function activeReviewSrs(state) {
  const activeByDomain = new Map(
    [...DOMAINS_WITH_HARD_CONTENT].map((domainId) => [domainId, activeStatsDomainId(state, domainId)])
  )
  return Object.fromEntries(Object.entries(state.srs || {}).filter(([domainId]) => {
    const base = domainId.startsWith('hard:') ? domainId.slice(5) : domainId
    if (activeByDomain.has(base)) return domainId === activeByDomain.get(base)
    return !domainId.startsWith('hard:')
  }))
}
