import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(process.env.MONSTER_ART_ROOT ?? process.cwd())
const PILOT_IDS = Array.from({ length: 12 }, (_, index) => `g${String(index + 42).padStart(3, '0')}`)
const inputs = [
  ...PILOT_IDS.map((id) => `public/monsters/full/${id}.webp`),
  'public/monsters/forms/g052-awakening.webp',
  'public/monsters/forms/g053-giga.webp'
]
const themes = {
  light: { background: '#f4f7ff', fill: '#17213a' },
  dark: { background: '#101426', fill: '#f5f7ff' }
}

function digest(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function render(outputPath, theme) {
  const args = [
    ...inputs.map((input) => path.join(ROOT, input)),
    '-thumbnail', '220x220',
    '-background', theme.background,
    '-fill', theme.fill,
    '-font', 'Helvetica',
    '-pointsize', '18',
    '-set', 'label', '%t',
    '-geometry', '220x250+10+10',
    '-tile', '4x4',
    outputPath
  ]
  const result = spawnSync('montage', args, { encoding: 'utf8' })
  assert.equal(result.error, undefined, `ImageMagick montage is required (${result.error?.message ?? ''})`)
  assert.equal(result.status, 0, `contact sheet generation (${result.stderr.trim()})`)
}

const check = process.argv.includes('--check')
const write = process.argv.includes('--write')
assert.notEqual(check, write, 'choose exactly one of --check or --write')

const temporaryRoot = process.env.RUNNER_TEMP ?? path.join(ROOT, 'tmp')
if (check) await mkdir(temporaryRoot, { recursive: true })
const outputDir = write
  ? path.join(ROOT, 'design/monsters/qa')
  : await mkdtemp(path.join(temporaryRoot, 'monster-art-contact-'))

try {
  for (const [name, theme] of Object.entries(themes)) {
    const filename = `contact-051-062-${name}.png`
    const outputPath = path.join(outputDir, filename)
    render(outputPath, theme)
    if (check) {
      const generated = await readFile(outputPath)
      const committed = await readFile(path.join(ROOT, 'design/monsters/qa', filename))
      assert.equal(digest(generated), digest(committed), `${filename}: exactly reproducible from the ordered approved app assets`)
    }
  }
  console.log(check ? 'Contact sheets reproduce exactly.' : `Contact sheets written to ${outputDir}`)
} finally {
  if (check) await rm(outputDir, { recursive: true, force: true })
}
