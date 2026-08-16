import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { inflateSync } from 'node:zlib'

const ROOT = path.resolve(process.env.MONSTER_ART_ROOT ?? process.cwd())
const PILOT_IDS = Array.from({ length: 12 }, (_, index) => `g${String(index + 42).padStart(3, '0')}`)
const FORM_IDS = ['g052-awakening', 'g053-giga']
const SAFE_MARGIN_RATIO = 0.115
const FIXTURE_PATH = 'scripts/fixtures/monster-art-051-062.v1.json'

function absolute(relativePath) {
  return path.join(ROOT, relativePath)
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

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
    assert.ok(offset + 12 <= buffer.length, `${label}: complete PNG chunk header`)
    const length = buffer.readUInt32BE(offset)
    assert.ok(offset + length + 12 <= buffer.length, `${label}: complete PNG chunk payload`)
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

function pngDimensions(buffer, label) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${label}: PNG signature`)
  assert.equal(buffer.subarray(12, 16).toString('ascii'), 'IHDR', `${label}: IHDR first chunk`)
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
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
  assert.ok(buffer.length >= 20, `${label}: complete RIFF header`)
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', `${label}: RIFF`)
  assert.equal(buffer.readUInt32LE(4), buffer.length - 8, `${label}: RIFF declared size`)
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP', `${label}: WEBP`)
  let offset = 12
  let width
  let height
  let hasAlpha = false
  let hasImagePayload = false
  while (offset < buffer.length) {
    assert.ok(offset + 8 <= buffer.length, `${label}: complete WebP chunk header`)
    const type = buffer.subarray(offset, offset + 4).toString('ascii')
    const size = buffer.readUInt32LE(offset + 4)
    const paddedSize = size + (size % 2)
    assert.ok(offset + 8 + paddedSize <= buffer.length, `${label}: complete ${type} chunk payload`)
    const data = buffer.subarray(offset + 8, offset + 8 + size)
    if (type === 'VP8X') {
      assert.ok(data.length >= 10, `${label}: complete VP8X chunk`)
      hasAlpha ||= Boolean(data[0] & 0x10)
      width = 1 + data[4] + (data[5] << 8) + (data[6] << 16)
      height = 1 + data[7] + (data[8] << 8) + (data[9] << 16)
    } else if (type === 'ALPH') hasAlpha = true
    else if (type === 'VP8 ' || type === 'VP8L') hasImagePayload = size > 0
    offset += 8 + paddedSize
  }
  assert.equal(offset, buffer.length, `${label}: RIFF chunk alignment`)
  assert.ok(width && height, `${label}: VP8X dimensions`)
  assert.ok(hasAlpha, `${label}: alpha channel`)
  assert.ok(hasImagePayload, `${label}: compressed image payload`)
  return { width, height }
}

function imageMagickRgba(relativePath, expectedSize, resize = false) {
  const args = [absolute(relativePath)]
  if (resize) args.push('-resize', `${expectedSize}x${expectedSize}!`)
  args.push('-alpha', 'on', '-depth', '8', 'rgba:-')
  const result = spawnSync('convert', args, { encoding: null, maxBuffer: 32 * 1024 * 1024 })
  assert.equal(result.error, undefined, `${relativePath}: ImageMagick is required (${result.error?.message ?? ''})`)
  assert.equal(result.status, 0, `${relativePath}: actual image decode (${result.stderr?.toString().trim() ?? ''})`)
  assert.equal(result.stdout.length, expectedSize * expectedSize * 4, `${relativePath}: decoded ${expectedSize}x${expectedSize} RGBA payload`)
  return result.stdout
}

function assertDerivativeMatches(sourcePath, derivativePath, size, rgbLimit) {
  const source = imageMagickRgba(sourcePath, size, true)
  const derivative = imageMagickRgba(derivativePath, size)
  let rgbDifference = 0
  let rgbSamples = 0
  let alphaDifference = 0
  const pixels = size * size
  for (let pixel = 0; pixel < pixels; pixel += 1) {
    const offset = pixel * 4
    const sourceAlpha = source[offset + 3]
    const derivativeAlpha = derivative[offset + 3]
    alphaDifference += Math.abs(sourceAlpha - derivativeAlpha)
    if (sourceAlpha > 8 || derivativeAlpha > 8) {
      rgbDifference += Math.abs(source[offset] - derivative[offset])
      rgbDifference += Math.abs(source[offset + 1] - derivative[offset + 1])
      rgbDifference += Math.abs(source[offset + 2] - derivative[offset + 2])
      rgbSamples += 3
    }
  }
  const rgbMae = rgbDifference / rgbSamples
  const alphaMae = alphaDifference / pixels
  assert.ok(rgbMae <= rgbLimit, `${derivativePath}: source-to-derivative RGB MAE ${rgbMae.toFixed(2)} <= ${rgbLimit}`)
  assert.ok(alphaMae <= 3, `${derivativePath}: source-to-derivative alpha MAE ${alphaMae.toFixed(2)} <= 3`)
  return { rgbMae, alphaMae }
}

async function inspectSource(id) {
  const relativePath = `design/monsters/source/${id}.png`
  const buffer = await readFile(absolute(relativePath))
  const image = decodeRgbaPng(buffer, relativePath)
  assert.equal(image.width, image.height, `${relativePath}: square`)
  assert.ok(image.width >= 1024, `${relativePath}: high-resolution source`)
  const bounds = alphaBounds(image, relativePath)
  const margins = [bounds.minX, bounds.minY, image.width - 1 - bounds.maxX, image.height - 1 - bounds.maxY]
  for (const margin of margins) assert.ok(margin / image.width >= SAFE_MARGIN_RATIO, `${relativePath}: >= 11.5% safe margin`)
  return { id, hash: sha256(buffer), silhouette: silhouetteHash(image), margins }
}

async function inspectWebp(relativePath, expectedSize, maxBytes) {
  const buffer = await readFile(absolute(relativePath))
  assert.ok(buffer.length > 0 && buffer.length <= maxBytes, `${relativePath}: 1..${maxBytes} bytes`)
  const image = parseWebp(buffer, relativePath)
  assert.deepEqual(image, { width: expectedSize, height: expectedSize }, `${relativePath}: dimensions`)
  imageMagickRgba(relativePath, expectedSize)
  return { bytes: buffer.length, hash: sha256(buffer) }
}

const fixture = JSON.parse(await readFile(absolute(FIXTURE_PATH), 'utf8'))
assert.equal(fixture.version, 1, `${FIXTURE_PATH}: supported version`)

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
const actualHashes = {}
const derivativeMetrics = []
for (const id of PILOT_IDS) {
  const sourcePath = `design/monsters/source/${id}.png`
  const fullPath = `public/monsters/full/${id}.webp`
  const thumbPath = `public/monsters/thumb/${id}.webp`
  const full = await inspectWebp(fullPath, 512, 160_000)
  const thumb = await inspectWebp(thumbPath, 192, 30_000)
  fullSizes.push(full.bytes)
  thumbSizes.push(thumb.bytes)
  derivativeMetrics.push(assertDerivativeMatches(sourcePath, fullPath, 512, 15))
  derivativeMetrics.push(assertDerivativeMatches(sourcePath, thumbPath, 192, 18))
  actualHashes[id] = { source: sources.find((entry) => entry.id === id).hash, full: full.hash, thumb: thumb.hash }
}
for (const id of FORM_IDS) {
  const sourcePath = `design/monsters/source/${id}.png`
  const formPath = `public/monsters/forms/${id}.webp`
  const form = await inspectWebp(formPath, 512, 160_000)
  fullSizes.push(form.bytes)
  derivativeMetrics.push(assertDerivativeMatches(sourcePath, formPath, 512, 15))
  actualHashes[id] = { source: sources.find((entry) => entry.id === id).hash, form: form.hash }
}
assert.deepEqual(actualHashes, fixture.assets, `${FIXTURE_PATH}: per-ID approved source and derivative hashes`)

assert.ok(fullSizes.reduce((sum, size) => sum + size, 0) / fullSizes.length <= 90_000, 'full average <= 90KB')
assert.ok(thumbSizes.reduce((sum, size) => sum + size, 0) / thumbSizes.length <= 15_000, 'thumb average <= 15KB')
for (const [name, approved] of Object.entries(fixture.contactSheets)) {
  const relativePath = `design/monsters/qa/${name}`
  const buffer = await readFile(absolute(relativePath))
  assert.deepEqual(pngDimensions(buffer, relativePath), approved.dimensions, `${relativePath}: approved dimensions`)
  assert.equal(sha256(buffer), approved.sha256, `${relativePath}: approved generated content`)
}

console.log(JSON.stringify({
  monsters: PILOT_IDS.length,
  forms: FORM_IDS.length,
  fullAverageBytes: Math.round(fullSizes.reduce((sum, size) => sum + size, 0) / fullSizes.length),
  thumbAverageBytes: Math.round(thumbSizes.reduce((sum, size) => sum + size, 0) / thumbSizes.length),
  maximumDerivativeRgbMae: Number(Math.max(...derivativeMetrics.map((entry) => entry.rgbMae)).toFixed(2)),
  minimumSilhouetteDistance: Math.min(...sources.flatMap((left, index) => sources.slice(index + 1).map((right) => hamming(left.silhouette, right.silhouette))))
}, null, 2))
