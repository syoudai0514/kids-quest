import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { MONSTERS } from '../src/data/monsters.js'
import { MONSTER_IDENTITY_VERSION } from '../src/data/monsterMaster/schema.js'

if (!process.argv.includes('--approved-identity-migration')) {
  console.error('Identity snapshot generation is locked for normal work.')
  console.error('Use --approved-identity-migration only from a separately approved migration issue/workflow.')
  process.exit(1)
}

const entries = MONSTERS.map((monster, index) => ({
  dexNo: index + 1,
  id: monster.id,
  name: monster.name,
  element: monster.element,
  description: monster.desc
}))
const canonical = JSON.stringify(entries)
const snapshot = {
  version: MONSTER_IDENTITY_VERSION,
  count: entries.length,
  sha256: createHash('sha256').update(canonical).digest('hex'),
  entries
}

const targetUrl = new URL('./fixtures/monster-identities.v1.json', import.meta.url)
await mkdir(fileURLToPath(new URL('./fixtures/', import.meta.url)), { recursive: true })
await writeFile(targetUrl, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
console.log(`Monster identity snapshot written: ${entries.length} entries, ${snapshot.sha256}`)
