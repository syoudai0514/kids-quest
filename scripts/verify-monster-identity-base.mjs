import { execFileSync } from 'node:child_process'
import { isProtectedIdentityPath } from './lib/monster-master-validation.mjs'

const baseRef = process.env.MONSTER_IDENTITY_BASE_REF || 'origin/main'

let changedPaths
try {
  execFileSync('git', ['rev-parse', '--verify', `${baseRef}^{commit}`], { stdio: 'ignore' })
  changedPaths = execFileSync(
    'git',
    ['diff', '--name-only', baseRef, '--', 'src/data/monsters.js'],
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean)
} catch (error) {
  console.error(`Monster identity base gate could not inspect ${baseRef}: ${error.message}`)
  process.exit(1)
}

const protectedChanges = changedPaths.filter(isProtectedIdentityPath)
if (protectedChanges.length) {
  console.error('Monster identity base gate NG: normal PRs may not change the 1000 existing identities.')
  for (const path of protectedChanges) console.error(`- ${path}`)
  console.error('Use a separately approved identity-migration issue/workflow; regenerating the snapshot is not an override.')
  process.exit(1)
}

console.log(`Monster identity base gate OK: ${baseRef} -> working tree`)
