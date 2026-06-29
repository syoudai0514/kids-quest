// PWA 用 PNG アイコンを依存ライブラリなしで生成する（Node 標準の zlib のみ）。
// 相棒モンスター(ホッシュ)風の、星のアンテナを持つ丸い顔を描く。
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
  const cx = size / 2
  const cy = size * 0.56
  const r = size * 0.30
  const set = (x, y, [r2, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    // simple alpha over
    const af = a / 255
    buf[i] = buf[i] * (1 - af) + r2 * af
    buf[i + 1] = buf[i + 1] * (1 - af) + g * af
    buf[i + 2] = buf[i + 2] * (1 - af) + b * af
    buf[i + 3] = Math.max(buf[i + 3], a)
  }
  const bg = [27, 17, 64, 255]
  const body = [122, 240, 208, 255]
  const belly = [186, 251, 233, 255]
  const eye = [27, 17, 64, 255]
  const white = [255, 255, 255, 255]
  const star = [255, 209, 102, 255]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 角丸背景
      const rad = size * 0.18
      const inX = Math.min(x, size - 1 - x)
      const inY = Math.min(y, size - 1 - y)
      let inside = true
      if (inX < rad && inY < rad) {
        const dx = rad - inX
        const dy = rad - inY
        if (dx * dx + dy * dy > rad * rad) inside = false
      }
      if (inside) set(x, y, bg)
    }
  }
  // からだ（円）
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r * r) set(x, y, body)
      // おなか
      const by = cy + r * 0.28
      if (dx * dx * 1.6 + (y - by) * (y - by) * 2.4 <= (r * 0.55) * (r * 0.55)) set(x, y, belly)
    }
  }
  // め
  const ex = r * 0.42
  const ey = cy - r * 0.12
  for (const sx of [-1, 1]) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - (cx + sx * ex)
        const dy = y - ey
        const er = r * 0.2
        if (dx * dx + dy * dy <= er * er) set(x, y, white)
        if (dx * dx + dy * dy <= (er * 0.55) * (er * 0.55)) set(x, y, eye)
      }
    }
  }
  // アンテナの星（簡易: 小さな菱形）
  const starCx = cx
  const starCy = cy - r * 1.25
  const ss = r * 0.45
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x - starCx)
      const dy = Math.abs(y - starCy)
      if (dx / ss + dy / ss <= 1) set(x, y, star)
    }
  }
  // アンテナの軸
  for (let y = Math.floor(cy - r); y > starCy; y--) {
    for (let x = Math.floor(cx - size * 0.012); x <= cx + size * 0.012; x++) set(x, y, body)
  }
  return png(size, size, buf)
}

mkdirSync(new URL('../public/', import.meta.url), { recursive: true })
for (const size of [192, 512]) {
  const out = new URL(`../public/icon-${size}.png`, import.meta.url)
  writeFileSync(out, draw(size))
  console.log(`wrote icon-${size}.png`)
}
