// ============================================================
// 共有 AudioContext
//
// 効果音(sfx)と BGM で「1つの」AudioContext を使い回す。
// 以前は sfx.js と bgm.js がそれぞれ別の AudioContext を作っていて、
// スマホ等で「BGM は鳴るのに効果音が無音」になることがあった
// （ブラウザは同時に持てる AudioContext 数に制限がある）。
// ここに一本化して、最初のタップで確実に解錠する。
// ============================================================

let ctx = null

export function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  // 自動再生制限でとまっていたら、呼ばれるたびに起こす
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// 最初のユーザー操作で呼ぶ（解錠）
export function unlockAudio() {
  const a = getCtx()
  if (a && a.state === 'suspended') a.resume()
  return a
}
