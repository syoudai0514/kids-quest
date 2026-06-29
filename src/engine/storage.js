// ============================================================
// ローカル保存（端末内 localStorage）。アカウント登録不要。
// 進捗・収集・設定をまとめて1キーに保存する。
// ============================================================

const KEY = 'hoshizora-quest:v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (_) {
    /* 容量超過などは無視（学習アプリなので致命的でない） */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY)
  } catch (_) {
    /* noop */
  }
}

// 今日の日付キー（ローカル時間。深夜0時でリセット）
export function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
