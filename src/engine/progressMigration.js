// v14 学習進捗移行。プロフィール、図鑑、XP、当日ミッションには触れない。
export function migrateLearningProgress(saved = {}) {
  if ((saved.unitProgressVersion || 0) >= 14) return saved
  const unitStats = {}
  for (const [grade, byDomain] of Object.entries(saved.unitStats || {})) {
    unitStats[grade] = {}
    for (const [domain, byUnit] of Object.entries(byDomain || {})) {
      unitStats[grade][domain] = {}
      for (const [unit, stat] of Object.entries(byUnit || {})) {
        // 旧キーは選択肢順を含むことがあったため、distinctItemsだけ再確認する。
        unitStats[grade][domain][unit] = { ...stat, itemKeys: [] }
      }
    }
  }
  const { english: _legacyGenericEnglishSrs, ...srs } = saved.srs || {}
  return { ...saved, unitStats, srs, unitProgressVersion: 14 }
}
