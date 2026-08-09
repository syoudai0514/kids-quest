import assert from 'node:assert/strict'
import { liteJapaneseInternals } from '../src/engine/liteJapanesePhonemizer.js'
import { WORDS } from '../src/data/content/reading.js'
import { JUKUGO_BY_WORD, KANJI_BY_CHAR } from '../src/data/kanjiByGrade.js'

const { toReadableKana, encodeKana } = liteJapaneseInternals

assert.equal(toReadableKana('国語を 3もん'), 'こくごを さんもん')
assert.equal(toReadableKana('つくよみちゃんです'), 'つくよみちゃんです')
assert.ok(encodeKana('こんにちは。つくよみちゃんです。').length > 20)
assert.ok(encodeKana('だいじょうぶ。こたえは「ほし」。つぎは できるよ！').length > 30)
assert.throws(() => encodeKana('未対応漢字'), { code: 'LITE_PHONEMIZER_UNSUPPORTED' })

// 報告経路の「国語」で出る単語・漢字・熟語の読みを全件確認。
for (const word of WORDS) assert.doesNotThrow(() => encodeKana(word.text), `word: ${word.text}`)
for (const item of Object.values(KANJI_BY_CHAR)) assert.doesNotThrow(() => encodeKana(item.yomi), `kanji: ${item.k}`)
for (const item of Object.values(JUKUGO_BY_WORD)) assert.doesNotThrow(() => encodeKana(item.yomi), `jukugo: ${item.k}`)

console.log('Lite Japanese phonemizer verified')
