// ============================================================
// ローカル保存（端末内 localStorage）。アカウント登録不要。
// 進捗・収集・設定をまとめて1キーに保存する。
// ============================================================

import { LEGACY_STORAGE_KEY, MANA_EVO_STORAGE_KEY, migrateManaEvoState } from './manaEvo.js'

const KEY = MANA_EVO_STORAGE_KEY

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const migrated = migrateManaEvoState(JSON.parse(raw), todayKey())
    // 旧キーは消さない。書込み前の失敗時でも、次回起動で安全に再試行できる。
    localStorage.setItem(KEY, JSON.stringify(migrated))
    return migrated
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

// ---- 機種変更用: データのエクスポート / インポート ----
// 端末内保存なので、引っ越し（機種変更）のために手動で書き出し／読み込みできる。
export const EXPORT_MARKER = 'mana-evo-save'
const LEGACY_EXPORT_MARKER = 'hoshizora-quest-save'

export function serializeForExport(state) {
  return JSON.stringify(
    { marker: EXPORT_MARKER, formatVersion: 1, exportedAt: new Date().toISOString(), state },
    null,
    2
  )
}

// 貼り付け／ファイルの中身から「セーブ本体」を取り出す。おかしければ throw。
export function parseImport(text) {
  const obj = JSON.parse(text) // 不正な JSON はここで例外
  // 正式なエクスポート封筒
  if (obj && (obj.marker === EXPORT_MARKER || obj.marker === LEGACY_EXPORT_MARKER) && obj.state && typeof obj.state === 'object') {
    return migrateManaEvoState(obj.state, todayKey())
  }
  // 素のセーブ本体（念のため受け入れる）
  if (obj && typeof obj === 'object' && (obj.version || obj.skills || obj.unlockedMonsters)) {
    return migrateManaEvoState(obj, todayKey())
  }
  throw new Error('ひきつぎデータの形式が ちがいます')
}

// 今日の日付キー（ローカル時間。深夜0時でリセット）
export function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// コンテンツ更新は教材の表示だけを差し替える。開始済みの当日ミッションを
// 作り直すと、子どもが進めた順番・ごほうびへの期待を失わせてしまうため、
// 日次データには触れない。この純粋関数は保存移行の自動検証にも使う。
export function migrateContentVersion(saved, contentVersion) {
  return { ...saved, contentVersion }
}

/** 子どもごとの保存本体から、プロフィールの入れ物だけを除く。 */
export function profileSnapshot(state) {
  const { profiles: _profiles, activeProfileId: _activeProfileId, ...snapshot } = state || {}
  return snapshot
}

/** 現在の子どものセーブだけを更新する。ほかの子どもの状態は参照も変更もしない。 */
export function saveProfileSnapshot(profiles, profileId, name, state) {
  return {
    ...(profiles || {}),
    [profileId]: { name, state: profileSnapshot(state) }
  }
}
