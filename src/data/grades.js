// ============================================================
// 学年（レベル）定義 — 年長〜小6
//
// 「いまの学年をマスターしたら次が解放」される先取りシステム。
// マスター条件: その学年で全分野の習熟レベル平均が MASTER_LEVEL 以上。
// 解放済みの学年はいつでも行き来できる（戻って復習もOK）。
// ============================================================

export const GRADES = [
  { id: 0, name: 'ねんちょう', short: 'ねんちょう', emoji: '🌱' },
  { id: 1, name: 'しょうがく 1ねんせい', short: '小1', emoji: '🎒' },
  { id: 2, name: 'しょうがく 2ねんせい', short: '小2', emoji: '📗' },
  { id: 3, name: 'しょうがく 3ねんせい', short: '小3', emoji: '📘' },
  { id: 4, name: 'しょうがく 4ねんせい', short: '小4', emoji: '📙' },
  { id: 5, name: 'しょうがく 5ねんせい', short: '小5', emoji: '📕' },
  { id: 6, name: 'しょうがく 6ねんせい', short: '小6', emoji: '🎓' }
]

export const MAX_GRADE = 6

// この学年の全分野平均レベルがこれ以上になったら次の学年が解放される
export const MASTER_LEVEL = 8

export function gradeOf(id) {
  return GRADES[Math.max(0, Math.min(MAX_GRADE, id))]
}
