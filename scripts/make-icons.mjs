// PWA 用 PNG アイコンを依存ライブラリなしで生成する（Node 標準の zlib のみ）。
// 相棒モンスター「ホッシュ」を、ホーム画面で判別しやすい炎のキツネ＋星マークにする。
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function png(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const idat = deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function draw(size) {
  const buf = Buffer.alloc(size * size * 4)
  const set = (x, y, [r2, g, b, a = 255]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    // simple alpha over
    const af = a / 255
    buf[i] = buf[i] * (1 - af) + r2 * af
    buf[i + 1] = buf[i + 1] * (1 - af) + g * af
    buf[i + 2] = buf[i + 2] * (1 - af) + b * af
    buf[i + 3] = Math.max(buf[i + 3], a)
  }
  const fill = (color) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, color)
  }
  const circle = (cx, cy, r, color) => {
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(size - 1, Math.ceil(cx + r))
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(size - 1, Math.ceil(cy + r))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + .5 - cx, dy = y + .5 - cy
      if (dx * dx + dy * dy <= r * r) set(x, y, color)
    }
  }
  const ellipse = (cx, cy, rx, ry, color) => {
    const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(size - 1, Math.ceil(cx + rx))
    const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(size - 1, Math.ceil(cy + ry))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry
      if (dx * dx + dy * dy <= 1) set(x, y, color)
    }
  }
  const poly = (points, color) => {
    const minX = Math.max(0, Math.floor(Math.min(...points.map(([x]) => x))))
    const maxX = Math.min(size - 1, Math.ceil(Math.max(...points.map(([x]) => x))))
    const minY = Math.max(0, Math.floor(Math.min(...points.map(([, y]) => y))))
    const maxY = Math.min(size - 1, Math.ceil(Math.max(...points.map(([, y]) => y))))
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      let inside = false
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j]
        if ((yi > y + .5) !== (yj > y + .5) && x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi) inside = !inside
      }
      if (inside) set(x, y, color)
    }
  }
  const p = (x, y) => [x * size, y * size]
  const space = [13, 20, 57]
  const spaceLight = [28, 43, 96]
  const ink = [14, 23, 52]
  const orangeDark = [117, 42, 20]
  const orange = [246, 93, 20]
  const coral = [255, 126, 38]
  const gold = [255, 196, 49]
  const cream = [255, 238, 192]
  const page = [255, 249, 225]
  const cyan = [80, 224, 255]
  const white = [255, 255, 255]

  // 深い宇宙のグラデーション。小さく表示されても外周が締まって見える。
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = x / size - .5, dy = y / size - .43
    const t = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / .78)
    set(x, y, [space[0] + (spaceLight[0] - space[0]) * t, space[1] + (spaceLight[1] - space[1]) * t, space[2] + (spaceLight[2] - space[2]) * t])
  }
  // 金の軌道リングと星。宇宙と「クエスト」の気分を先に伝える。
  ellipse(.5 * size, .49 * size, .43 * size, .34 * size, [255, 203, 58, 34])
  ellipse(.5 * size, .49 * size, .395 * size, .302 * size, space)
  for (const [x, y, r, c] of [[.15,.25,.012,gold],[.83,.20,.018,cream],[.89,.59,.009,gold],[.18,.65,.008,cyan],[.33,.12,.007,cream]]) circle(x * size, y * size, r * size, c)

  // 学習冒険のエンブレム。輪郭は盾、中央は宇宙服を着た相棒ホッシュ。
  poly([p(.5,.08),p(.84,.22),p(.79,.67),p(.5,.90),p(.21,.67),p(.16,.22)], [7, 12, 34])
  poly([p(.5,.105),p(.81,.235),p(.76,.65),p(.5,.865),p(.24,.65),p(.19,.235)], gold)
  poly([p(.5,.13),p(.775,.25),p(.725,.63),p(.5,.83),p(.275,.63),p(.225,.25)], space)

  // 角張った耳とヘルメット。丸顔よりも、冒険装備らしい輪郭を優先。
  poly([p(.28,.52),p(.27,.24),p(.45,.39),p(.46,.61)], orangeDark)
  poly([p(.72,.52),p(.73,.24),p(.55,.39),p(.54,.61)], orangeDark)
  poly([p(.305,.49),p(.305,.29),p(.44,.42),p(.45,.57)], orange)
  poly([p(.695,.49),p(.695,.29),p(.56,.42),p(.55,.57)], orange)
  ellipse(.5 * size, .49 * size, .255 * size, .235 * size, orangeDark)
  ellipse(.5 * size, .475 * size, .235 * size, .215 * size, orange)
  // 金のバイザーと、青い光のヘッドセット
  poly([p(.32,.42),p(.40,.24),p(.49,.35),p(.58,.20),p(.68,.42),p(.62,.45),p(.5,.39),p(.38,.45)], gold)
  poly([p(.405,.36),p(.49,.285),p(.52,.39),p(.59,.30),p(.62,.41),p(.51,.45)], cream)
  circle(.72 * size, .48 * size, .038 * size, cyan)
  circle(.72 * size, .48 * size, .018 * size, white)
  // きりっとした瞳（白目を減らしてゲームらしい強さにする）。
  for (const x of [.405, .595]) {
    ellipse(x * size, .50 * size, .075 * size, .085 * size, ink)
    ellipse(x * size, .492 * size, .049 * size, .061 * size, [255, 234, 164])
    ellipse((x + .008) * size, .505 * size, .027 * size, .040 * size, ink)
    circle((x - .013) * size, .475 * size, .012 * size, white)
  }
  ellipse(.5 * size, .61 * size, .14 * size, .07 * size, cream)
  ellipse(.5 * size, .595 * size, .030 * size, .020 * size, ink)

  // 下半分を発光する「冒険ノート」にする。勉強アプリだと無言で伝わる主記号。
  poly([p(.18,.66),p(.48,.625),p(.5,.69),p(.5,.87),p(.18,.82)], [30, 84, 150])
  poly([p(.82,.66),p(.52,.625),p(.5,.69),p(.5,.87),p(.82,.82)], [31, 102, 176])
  poly([p(.21,.675),p(.47,.645),p(.485,.70),p(.485,.835),p(.21,.79)], page)
  poly([p(.79,.675),p(.53,.645),p(.515,.70),p(.515,.835),p(.79,.79)], page)
  // ノート上の「数・星・図形」を抽象記号として描く（縮小時にも読める）。
  circle(.33 * size, .727 * size, .024 * size, coral)
  poly([p(.385,.70),p(.395,.725),p(.425,.727),p(.402,.745),p(.41,.775),p(.385,.755),p(.36,.77),p(.368,.742),p(.345,.725),p(.375,.723)], gold)
  poly([p(.59,.705),p(.645,.73),p(.59,.755),p(.535,.73)], cyan)
  for (const [x,y,w] of [[.275,.775,.12],[.585,.785,.13],[.60,.81,.09]]) ellipse(x * size, y * size, w * size, .009 * size, [121, 167, 211])
  // ページ中央の背と、右上の小さな到達バッジ。
  ellipse(.5 * size, .76 * size, .012 * size, .11 * size, [160, 199, 230])
  circle(.77 * size, .31 * size, .07 * size, [8, 17, 48])
  circle(.77 * size, .31 * size, .058 * size, cyan)
  poly([p(.77,.265),p(.785,.298),p(.82,.303),p(.792,.32),p(.8,.355),p(.77,.333),p(.74,.355),p(.748,.32),p(.72,.303),p(.755,.298)], page)
  return png(size, size, buf)
}

mkdirSync(new URL('../public/', import.meta.url), { recursive: true })
for (const size of [180, 192, 512]) {
  const out = new URL(`../public/icon-${size}-v2.png`, import.meta.url)
  writeFileSync(out, draw(size))
  console.log(`wrote icon-${size}-v2.png`)
}
