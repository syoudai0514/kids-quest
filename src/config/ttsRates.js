// 読み上げ速度は、子どもが聞き取りやすいように「ふつう」を基準に大きく差を付ける。
// Piper は lengthScale が大きいほど遅く、iPhone の読み上げは rate が大きいほど速い。
export const TTS_RATE_PRESETS = Object.freeze([
  { label: 'ゆっくり', value: 0.6 },
  { label: 'ふつう', value: 0.8 },
  { label: 'はやめ', value: 1.2 }
])

export const DEFAULT_TTS_RATE = 0.8

// 旧版は 0.84 / 0.96 / 1.08 で差が小さく、ふつうも早口だった。
// 既に保存されている選択は、意味を保ったまま新しい3段階へ移す。
export function migrateTtsRate(value) {
  if (value === 0.84) return 0.6
  if (value === 0.96) return 0.8
  if (value === 1.08) return 1.2
  return Number.isFinite(value) ? value : DEFAULT_TTS_RATE
}
