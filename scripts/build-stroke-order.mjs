// ============================================================
// KanjiVG の SVG から書き順データ (src/data/strokeOrder.js) を生成する。
//
// 使い方:
//   1) scratchpad/kanjivg/ に対象文字の KanjiVG SVG を置く
//      （ファイル名はコードポイント5桁hex。例: を = 03092.svg）
//   2) node scripts/build-stroke-order.mjs <svgディレクトリ>
//
// 各画の <path>（3次ベジェ）を細かくサンプリング → 弧長で等間隔に
// 間引いた折れ線に変換し、viewBox 109×109 を 0〜100 に正規化する。
// KanjiVG は CC BY-SA 3.0（README に帰属表記あり）。
// ============================================================

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const srcDir = process.argv[2]
if (!srcDir) {
  console.error('usage: node scripts/build-stroke-order.mjs <kanjivg-svg-dir>')
  process.exit(1)
}

// ---- SVG パスパーサ（KanjiVG が使う M/m C/c S/s L/l H/h V/v Z/z に対応）----
function parsePathToPoints(d, samplesPerCurve = 32) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) || []
  let i = 0
  const num = () => parseFloat(tokens[i++])
  let cmd = ''
  let cx = 0, cy = 0 // 現在位置
  let sx = 0, sy = 0 // サブパス開始
  let pcx = null, pcy = null // 直前の制御点（S/s 用）
  const pts = []
  const push = (x, y) => pts.push([x, y])
  const cubic = (x1, y1, x2, y2, x, y) => {
    for (let k = 1; k <= samplesPerCurve; k++) {
      const t = k / samplesPerCurve
      const mt = 1 - t
      const px = mt * mt * mt * cx + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x
      const py = mt * mt * mt * cy + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y
      push(px, py)
    }
    pcx = x2
    pcy = y2
    cx = x
    cy = y
  }

  while (i < tokens.length) {
    const t = tokens[i]
    if (/[a-zA-Z]/.test(t)) {
      cmd = t
      i++
      if (cmd === 'Z' || cmd === 'z') {
        push(sx, sy)
        cx = sx
        cy = sy
        continue
      }
    }
    switch (cmd) {
      case 'M': cx = num(); cy = num(); sx = cx; sy = cy; push(cx, cy); pcx = pcy = null; cmd = 'L'; break
      case 'm': cx += num(); cy += num(); sx = cx; sy = cy; push(cx, cy); pcx = pcy = null; cmd = 'l'; break
      case 'L': cx = num(); cy = num(); push(cx, cy); pcx = pcy = null; break
      case 'l': cx += num(); cy += num(); push(cx, cy); pcx = pcy = null; break
      case 'H': cx = num(); push(cx, cy); pcx = pcy = null; break
      case 'h': cx += num(); push(cx, cy); pcx = pcy = null; break
      case 'V': cy = num(); push(cx, cy); pcx = pcy = null; break
      case 'v': cy += num(); push(cx, cy); pcx = pcy = null; break
      case 'C': { const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num(); cubic(x1, y1, x2, y2, x, y); break }
      case 'c': { const x1 = cx + num(), y1 = cy + num(), x2 = cx + num(), y2 = cy + num(), x = cx + num(), y = cy + num(); cubic(x1, y1, x2, y2, x, y); break }
      case 'S': { const x2 = num(), y2 = num(), x = num(), y = num(); const x1 = pcx != null ? 2 * cx - pcx : cx; const y1 = pcy != null ? 2 * cy - pcy : cy; cubic(x1, y1, x2, y2, x, y); break }
      case 's': { const x2 = cx + num(), y2 = cy + num(), x = cx + num(), y = cy + num(); const x1 = pcx != null ? 2 * cx - pcx : cx; const y1 = pcy != null ? 2 * cy - pcy : cy; cubic(x1, y1, x2, y2, x, y); break }
      default:
        throw new Error('unsupported path command: ' + cmd)
    }
  }
  return pts
}

// 弧長でだいたい等間隔になるよう間引く（画の長さに応じて点数を変える）
function resample(pts) {
  const lens = [0]
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    lens.push(total)
  }
  const n = Math.max(4, Math.min(28, Math.round(total / 4.5) + 1))
  const out = []
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total
    let j = 1
    while (j < lens.length - 1 && lens[j] < target) j++
    const seg = lens[j] - lens[j - 1] || 1e-6
    const t = (target - lens[j - 1]) / seg
    out.push([
      pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t,
      pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t
    ])
  }
  return out
}

const round1 = (v) => Math.round(v * 10) / 10

const files = readdirSync(srcDir).filter((f) => f.endsWith('.svg'))
const result = {}
for (const f of files) {
  const hex = f.replace('.svg', '')
  const char = String.fromCodePoint(parseInt(hex, 16))
  const svg = readFileSync(join(srcDir, f), 'utf8')
  // StrokePaths 内の path を -sN の番号順に取り出す
  const matches = [...svg.matchAll(/<path[^>]*id="kvg:[^"]*-s(\d+)"[^>]*\sd="([^"]+)"/g)]
  if (!matches.length) {
    console.error('no strokes found for', char, f)
    continue
  }
  matches.sort((a, b) => parseInt(a[1]) - parseInt(b[1]))
  const strokes = matches.map((m) => {
    const raw = parsePathToPoints(m[2])
    // viewBox 109×109 → 0〜100 に正規化
    return resample(raw).map(([x, y]) => [round1((x / 109) * 100), round1((y / 109) * 100)])
  })
  result[char] = strokes
}

console.log('converted chars:', Object.keys(result).length)

// strokeOrder.js を生成
const entries = Object.entries(result)
  .map(([ch, strokes]) => {
    const s = strokes.map((st) => '[' + st.map(([x, y]) => `[${x},${y}]`).join(',') + ']').join(',')
    return `  ${JSON.stringify(ch)}: [${s}]`
  })
  .join(',\n')

const out = `// ============================================================
// 文字の書き順データ（ひらがな・カタカナ・小1漢字 計${entries.split('\n').length}字）
//
// KanjiVG (https://kanjivg.tagaini.net / © Ulrich Apel,
// CC BY-SA 3.0) の標準書き順SVGから自動生成した折れ線データ。
// 生成スクリプト: scripts/build-stroke-order.mjs
// ※手で編集しないこと。文字を追加するときは KanjiVG の該当SVGを
//   取得してスクリプトで再生成する。
//
// 形式: { 文字: [ 画1の折れ線[[x,y],...], 画2, ... ] }
//   x/y は 0〜100 の相対座標（0=左/上）。画は正しい書き順の順番で、
//   各折れ線の最初の点がその画の正しい書きはじめ位置。
// ============================================================

export const STROKE_ORDER = {
${entries}
}

export function hasStrokeData(char) {
  return Array.isArray(STROKE_ORDER[char])
}
`
writeFileSync('src/data/strokeOrder.js', out)
console.log('wrote src/data/strokeOrder.js')
