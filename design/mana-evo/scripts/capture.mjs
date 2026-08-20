// 捕獲式。仕様整合: //  - 捕獲は「勝ってから、たおした相手に わ を投げる」方式Aに一本化。
//    HP残量・状態異常による補正は存在しない（HPはすでに0のため）。
//  - 「かならずつかまる」「100%」という表現は、にじのわ以外には使わない。
//    3投累積は幾何級数的に1へ近づくだけで、厳密な100%ではない。

export const RATE = { common: 200, rare: 90, epic: 45, legend: 12 }
export const RANK_LABEL = { common: 'ふつう', rare: 'めずらしい', epic: 'とてもめずらしい', legend: 'でんせつ' }

// わ の倍率。にじのわ（rainbow）だけは倍率ではなく「かならず成功」の特別処理。
export const BALL = {
  star:   { label: 'ほしのわ', mult: 1 },
  silver: { label: 'ぎんのわ', mult: 1.5 },
  gold:   { label: 'きんのわ', mult: 2 },
  rainbow:{ label: 'にじのわ', mult: null, guaranteed: true },
}

// 1投の成功確率。a = min(255, rate × ball倍率)、P = (a/255)^(3/4)。
// この簡約形は、第3〜4世代の「4回ゆれ判定」の的中確率と一致する
// （a = 10/45/90/135/180/200/254 の7点で元式と検算済み）。
// HP項は使わない（捕獲フェーズに入る時点で必ずHP0のため、HPで変動させる意味がない）。
export function singleThrowRate(rate, ballKey) {
  const ball = BALL[ballKey]
  if (ball.guaranteed) return 1
  const a = Math.min(255, rate * ball.mult)
  return Math.pow(a / 255, 3 / 4)
}

// 最大3投（失敗するたびに再投可能、3投目で失敗したら「にげられた」）。
export function cumulativeRate(rate, ballKey, throws = 3) {
  const ball = BALL[ballKey]
  if (ball.guaranteed) return 1
  const p = singleThrowRate(rate, ballKey)
  return 1 - Math.pow(1 - p, throws)
}

// UI表示用の丸め＋文言。「ほとんどつかまる」等、誇張しない表現に統一する。
export function displayLabel(rate) {
  if (rate >= 0.97) return 'ほとんど つかまる'
  if (rate >= 0.75) return 'つかまえやすい'
  if (rate >= 0.45) return 'ふつう'
  if (rate >= 0.20) return 'つかまえにくい'
  return 'かなり つかまえにくい'
}
export function starRating(rate) {
  return '★'.repeat(Math.max(1, Math.round(rate * 5))) + '☆'.repeat(5 - Math.max(1, Math.round(rate * 5)))
}

if ((process.argv[1] || '').endsWith('capture.mjs')) {
  console.log('■ 1投・3投累積の成功率（HP非依存・方式Aのみ）')
  console.log('| ランク | わ | 1投 | 3投累積 | 表示 |')
  for (const [rankKey, rate] of Object.entries(RATE)) {
    for (const ballKey of ['star', 'silver', 'gold', 'rainbow']) {
      const p1 = singleThrowRate(rate, ballKey)
      const p3 = cumulativeRate(rate, ballKey)
      console.log(`  ${RANK_LABEL[rankKey].padEnd(10)} ${BALL[ballKey].label.padEnd(8)} 1投=${(p1*100).toFixed(1)}% 3投累積=${(p3*100).toFixed(2)}% (${displayLabel(p3)})`)
    }
  }
  console.log('\n注意: 「かならずつかまる」と言えるのは にじのわ だけ。それ以外は3投しても100%にはならない。')
}
