import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const validator = path.join(ROOT, 'scripts/verify-monster-art.mjs')
const temporaryRoot = process.env.RUNNER_TEMP ?? path.join(ROOT, 'tmp')
await mkdir(temporaryRoot, { recursive: true })
const sandbox = await mkdtemp(path.join(temporaryRoot, 'monster-art-mutations-'))

function at(relativePath) {
  return path.join(sandbox, relativePath)
}

function headerOnlyWebp() {
  const buffer = Buffer.alloc(30)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(22, 4)
  buffer.write('WEBP', 8, 'ascii')
  buffer.write('VP8X', 12, 'ascii')
  buffer.writeUInt32LE(10, 16)
  buffer[20] = 0x10
  for (const offset of [24, 27]) {
    buffer[offset] = 0xff
    buffer[offset + 1] = 0x01
  }
  return buffer
}

async function expectRejected(name, targets, mutate, expectedText) {
  const originals = new Map()
  for (const target of targets) originals.set(target, await readFile(at(target)))
  try {
    await mutate()
    const result = spawnSync(process.execPath, [validator], {
      cwd: sandbox,
      env: { ...process.env, MONSTER_ART_ROOT: sandbox },
      encoding: 'utf8',
      timeout: 30_000
    })
    assert.notEqual(result.status, 0, `${name}: validator must reject the mutation`)
    const output = `${result.stdout}\n${result.stderr}`
    assert.match(output, expectedText, `${name}: rejection should identify the failed invariant`)
    console.log(`PASS ${name}`)
  } finally {
    for (const [target, original] of originals) await writeFile(at(target), original)
  }
}

try {
  await cp(path.join(ROOT, 'design/monsters'), at('design/monsters'), { recursive: true })
  await cp(path.join(ROOT, 'public/monsters'), at('public/monsters'), { recursive: true })
  await cp(path.join(ROOT, 'scripts/fixtures'), at('scripts/fixtures'), { recursive: true })

  await expectRejected('header-only WebP', ['public/monsters/full/g042.webp'], async () => {
    await writeFile(at('public/monsters/full/g042.webp'), headerOnlyWebp())
  }, /compressed image payload/)

  await expectRejected('truncated WebP', ['public/monsters/full/g042.webp'], async () => {
    const target = at('public/monsters/full/g042.webp')
    const original = await readFile(target)
    await writeFile(target, original.subarray(0, original.length - 17))
  }, /RIFF declared size|complete .* chunk payload/)

  await expectRejected('RIFF size mismatch', ['public/monsters/full/g042.webp'], async () => {
    const target = at('public/monsters/full/g042.webp')
    const changed = Buffer.from(await readFile(target))
    changed.writeUInt32LE(changed.readUInt32LE(4) - 2, 4)
    await writeFile(target, changed)
  }, /RIFF declared size/)

  await expectRejected('corrupt compressed payload', ['public/monsters/full/g042.webp'], async () => {
    const target = at('public/monsters/full/g042.webp')
    const changed = Buffer.from(await readFile(target))
    changed.fill(0, Math.max(20, changed.length - 256))
    await writeFile(target, changed)
  }, /actual image decode|source-to-derivative|approved source and derivative hashes/)

  await expectRejected('full ID swap', ['public/monsters/full/g042.webp', 'public/monsters/full/g043.webp'], async () => {
    const left = await readFile(at('public/monsters/full/g042.webp'))
    const right = await readFile(at('public/monsters/full/g043.webp'))
    await writeFile(at('public/monsters/full/g042.webp'), right)
    await writeFile(at('public/monsters/full/g043.webp'), left)
  }, /source-to-derivative/)

  await expectRejected('thumbnail ID swap', ['public/monsters/thumb/g042.webp', 'public/monsters/thumb/g043.webp'], async () => {
    const left = await readFile(at('public/monsters/thumb/g042.webp'))
    const right = await readFile(at('public/monsters/thumb/g043.webp'))
    await writeFile(at('public/monsters/thumb/g042.webp'), right)
    await writeFile(at('public/monsters/thumb/g043.webp'), left)
  }, /source-to-derivative/)

  await expectRejected('source-only horizontal flip', ['design/monsters/source/g042.png'], async () => {
    const target = at('design/monsters/source/g042.png')
    const temporary = `${target}.flipped.png`
    const result = spawnSync('convert', [target, '-flop', `PNG32:${temporary}`], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    await rename(temporary, target)
  }, /source-to-derivative/)

  await expectRejected('normal/form swap', ['public/monsters/full/g052.webp', 'public/monsters/forms/g052-awakening.webp'], async () => {
    const normal = await readFile(at('public/monsters/full/g052.webp'))
    const form = await readFile(at('public/monsters/forms/g052-awakening.webp'))
    await writeFile(at('public/monsters/full/g052.webp'), form)
    await writeFile(at('public/monsters/forms/g052-awakening.webp'), normal)
  }, /source-to-derivative/)

  await expectRejected('copied derivative under another ID', ['public/monsters/full/g044.webp'], async () => {
    await writeFile(at('public/monsters/full/g044.webp'), await readFile(at('public/monsters/full/g042.webp')))
  }, /source-to-derivative/)

  await expectRejected('one-pixel contact sheet', ['design/monsters/qa/contact-051-062-light.png'], async () => {
    const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFgAI/ScL1WQAAAABJRU5ErkJggg==', 'base64')
    await writeFile(at('design/monsters/qa/contact-051-062-light.png'), onePixelPng)
  }, /approved dimensions/)
} finally {
  await rm(sandbox, { recursive: true, force: true })
}
