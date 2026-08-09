// 読み上げ速度は、子どもが聞き取りやすいように「ふつう」を基準に大きく差を付ける。
// Piper は lengthScale が大きいほど遅く、iPhone の読み上げは rate が大きいほど速い。
export const TTS_RATE_PRESETS = Object.freeze([
  { label: 'ゆっくり', value: 0.5 },
  { label: 'ふつう', value: 0.7 },
  { label: 'はやめ', value: 0.9 }
])

export const DEFAULT_TTS_RATE = 0.7

// つくよみちゃんは軽量かな変換にすると、同じ設定値でも端末音声より
// テンポが速く聞こえる。年長児が問題文を聞き取れる速度を基準に、
// 「ふつう」を前版の「ゆっくり」相当にする。ゆっくりはそこから
// もう一段、読み聞かせの間を取る。各プリセットは端末音声のrate値と
// 独立しており、つくよみちゃんではこの長さを正確に保つ。
const NARRATOR_LENGTH_SCALE_BY_RATE = Object.freeze({
  0.5: 3.35,
  0.7: 2.667,
  0.9: 2
})
const NARRATOR_LENGTH_SCALE_BASE = 1.6

export function narratorLengthScale(rate) {
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_TTS_RATE
  const presetScale = NARRATOR_LENGTH_SCALE_BY_RATE[safeRate]
  if (presetScale) return presetScale
  return Math.max(0.9, Math.min(3.6, NARRATOR_LENGTH_SCALE_BASE / safeRate))
}

// 保存済みの選択は、段階名の意味を保ったまま移す。数値が重ならない
// 新しい値にしたため、移行後にアプリを開き直しても再変換されない。
export function migrateTtsRate(value) {
  if (value === 0.84 || value === 0.6) return 0.5
  if (value === 0.96 || value === 0.8) return 0.7
  if (value === 1.08 || value === 1.2) return 0.9
  return Number.isFinite(value) ? value : DEFAULT_TTS_RATE
}
