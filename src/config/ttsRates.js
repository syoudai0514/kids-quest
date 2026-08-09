// 読み上げ速度は、子どもが聞き取りやすいように「ふつう」を基準に差を付ける。
// Piper は lengthScale が大きいほど遅く、iPhone の読み上げは rate が大きいほど速い。
export const TTS_RATE_PRESETS = Object.freeze([
  { label: 'ゆっくり', value: 0.5 },
  { label: 'ふつう', value: 0.7 },
  { label: 'はやめ', value: 0.9 }
])

export const DEFAULT_TTS_RATE = 0.7

// 「ふつう」は、前版の「はやめ」（確認文で約3.5秒）をそのまま使う。
// そこから同じ比率で、ゆっくりは約33%長く、はやめは約25%短くする。
// 各プリセットは端末音声のrate値と独立しており、つくよみちゃんでは
// この長さを正確に保つ。
const NARRATOR_LENGTH_SCALE_BY_RATE = Object.freeze({
  0.5: 2.667,
  0.7: 2,
  0.9: 1.5
})
const NARRATOR_LENGTH_SCALE_BASE = 1.6

export function narratorLengthScale(rate) {
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_TTS_RATE
  const presetScale = NARRATOR_LENGTH_SCALE_BY_RATE[safeRate]
  if (presetScale) return presetScale
  return Math.max(0.9, Math.min(3.6, NARRATOR_LENGTH_SCALE_BASE / safeRate))
}

// 保存済みの選択は、段階名の意味を保ったまま移す。
export function migrateTtsRate(value) {
  if (value === 0.84 || value === 0.6) return 0.5
  if (value === 0.96 || value === 0.8) return 0.7
  if (value === 1.08 || value === 1.2) return 0.9
  return Number.isFinite(value) ? value : DEFAULT_TTS_RATE
}
