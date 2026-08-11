// 英語IDの教材更新を、保存データの版番号で一度だけ行う純粋関数。
export function migrateEnglishWordStats(stats = {}, savedContentVersion = 0) {
  // contentVersion 13 以降の ew173 は diamond。触らない。
  if (!(savedContentVersion > 0 && savedContentVersion < 13) || !stats.ew173) return stats
  const oldStar = stats.ew173
  const currentStar = stats.ew137 || {}
  const { ew173, ...withoutOldStar } = stats
  return { ...withoutOldStar, ew137: (currentStar.stage || 0) >= (oldStar.stage || 0) ? currentStar : oldStar }
}
