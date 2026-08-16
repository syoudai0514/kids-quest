import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { inflateSync } from 'node:zlib'

const PILOT_IDS = Array.from({ length: 12 }, (_, index) => `g${String(index + 42).padStart(3, '0')}`)
const FORM_IDS = ['g052-awakening', 'g053-giga']
const SAFE_MARGIN_RATIO = 0.115

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

function decodeRgbaPng(buffer, label) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${label}: PNG signature`)
  let offset = 8
  let width
  let height
  const idat = []
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      assert.equal(data[8], 8, `${label}: 8-bit PNG`)
      assert.equal(data[9], 6, `${label}: RGBA PNG`)
      assert.equal(data[12], 0, `${label}: non-interlaced PNG`)
    } else if (type === 'IDAT') idat.push(data)
    offset += length + 12
    if (type === 'IEND') break
  }
  assert.ok(width && height && idat.length, `${label}: complete PNG`)
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * 4
  assert.equal(raw.length, height * (stride + 1), `${label}: decoded byte length`)
  const pixels = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)]
    const rowStart = y * (stride + 1) + 1
    const outStart = y * stride
    for (let x = 0; x < stride; x += 1) {
      const source = raw[rowStart + x]
      const left = x >= 4 ? pixels[outStart + x - 4] : 0
      const up = y > 0 ? pixels[outStart - stride + x] : 0
      const upLeft = y > 0 && x >= 4 ? pixels[outStart - stride + x - 4] : 0
      const value = filter === 0 ? source
        : filter === 1 ? source + left
          : filter === 2 ? source + up
            : filter === 3 ? source + Math.floor((left + up) / 2)
              : filter === 4 ? source + paeth(left, up, upLeft)
                : assert.fail(`${label}: unsupported PNG filter ${filter}`)
      pixels[outStart + x] = value & 0xff
    }
  }
  return { width, height, pixels }
}

function alphaBounds(image, label) {
  let minX = image.width
  let minY = image.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.pixels[(y * image.width + x) * 4 + 3] <= 8) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  assert.ok(maxX >= minX && maxY >= minY, `${label}: visible foreground`)
  return { minX, minY, maxX, maxY }
}

function silhouetteHash(image) {
  const cells = 16
  let bits = ''
  for (let cy = 0; cy < cells; cy += 1) {
    for (let cx = 0; cx < cells; cx += 1) {
      const startX = Math.floor(cx * image.width / cells)
      const endX = Math.floor((cx + 1) * image.width / cells)
      const startY = Math.floor(cy * image.height / cells)
      const endY = Math.floor((cy + 1) * image.height / cells)
      let alpha = 0
      let count = 0
      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          alpha += image.pixels[(y * image.width + x) * 4 + 3]
          count += 1
        }
      }
      bits += alpha / count >= 64 ? '1' : '0'
    }
  }
  return bits
}

function hamming(a, b) {
  let distance = 0
  for (let index = 0; index < a.length; index += 1) distance += a[index] === b[index] ? 0 : 1
  return distance
}

function parseWebp(buffer, label) {
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', `${label}: RIFF`)
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP', `${label}: WEBP`)
  let offset = 12
  let width
  let height
  let hasAlpha = false
  while (offset + 8 <= buffer.length) {
    const type = buffer.subarray(offset, offset + 4).toString('ascii')
    const size = buffer.readUInt32LE(offset + 4)
    const data = buffer.subarray(offset + 8, offset + 8 + size)
    if (type === 'VP8X') {
      hasAlpha ||= Boolean(data[0] & 0x10)
      width = 1 + data[4] + (data[5] << 8) + (data[6] << 16)
      height = 1 + data[7] + (data[8] << 8) + (data[9] << 16)
    } else if (type === 'ALPH') hasAlpha = true
    offset += 8 + size + (size % 2)
  }
  assert.ok(width && height, `${label}: VP8X dimensions`)
  assert.ok(hasAlpha, `${label}: alpha channel`)
  return { width, height }
}

async function inspectSource(id) {
  const path = `design/monsters/source/${id}.png`
  const buffer = await readFile(path)
  const image = decodeRgbaPng(buffer, path)
  assert.equal(image.width, image.height, `${path}: square`)
  assert.ok(image.width >= 1024, `${path}: high-resolution source`)
  const bounds = alphaBounds(image, path)
  const margins = [bounds.minX, bounds.minY, image.width - 1 - bounds.maxX, image.height - 1 - bounds.maxY]
  for (const margin of margins) assert.ok(margin / image.width >= SAFE_MARGIN_RATIO, `${path}: >= 11.5% safe margin`)
  return { id, hash: createHash('sha256').update(buffer).digest('hex'), silhouette: silhouetteHash(image), margins }
}

async function inspectWebp(path, expectedSize, maxBytes) {
  const buffer = await readFile(path)
  assert.ok(buffer.length > 0 && buffer.length <= maxBytes, `${path}: 1..${maxBytes} bytes`)
  const image = parseWebp(buffer, path)
  assert.deepEqual(image, { width: expectedSize, height: expectedSize }, `${path}: dimensions`)
  return buffer.length
}

const sources = []
for (const id of [...PILOT_IDS, ...FORM_IDS]) sources.push(await inspectSource(id))
assert.equal(new Set(sources.map((entry) => entry.hash)).size, sources.length, 'source images are byte-distinct')
for (let left = 0; left < sources.length; left += 1) {
  for (let right = left + 1; right < sources.length; right += 1) {
    assert.ok(hamming(sources[left].silhouette, sources[right].silhouette) > 4,
      `${sources[left].id}/${sources[right].id}: silhouette is not near-duplicate`)
  }
}

const fullSizes = []
const thumbSizes = []
for (const id of PILOT_IDS) {
  fullSizes.push(await inspectWebp(`public/monsters/full/${id}.webp`, 512, 160_000))
  thumbSizes.push(await inspectWebp(`public/monsters/thumb/${id}.webp`, 192, 30_000))
}
for (const id of FORM_IDS) fullSizes.push(await inspectWebp(`public/monsters/forms/${id}.webp`, 512, 160_000))
assert.ok(fullSizes.reduce((sum, size) => sum + size, 0) / fullSizes.length <= 90_000, 'full average <= 90KB')
assert.ok(thumbSizes.reduce((sum, size) => sum + size, 0) / thumbSizes.length <= 15_000, 'thumb average <= 15KB')
for (const path of ['design/monsters/qa/contact-051-062-light.png', 'design/monsters/qa/contact-051-062-dark.png']) {
  assert.ok((await stat(path)).size > 0, `${path}: contact sheet exists`)
}

console.log(JSON.stringify({
  monsters: PILOT_IDS.length,
  forms: FORM_IDS.length,
  fullAverageBytes: Math.round(fullSizes.reduce((sum, size) => sum + size, 0) / fullSizes.length),
  thumbAverageBytes: Math.round(thumbSizes.reduce((sum, size) => sum + size, 0) / thumbSizes.length),
  minimumSilhouetteDistance: Math.min(...sources.flatMap((left, index) => sources.slice(index + 1).map((right) => hamming(left.silhouette, right.silhouette))))
}, null, 2))
