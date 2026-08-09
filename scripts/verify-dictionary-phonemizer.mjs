import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import init, { WasmPhonemizer } from 'piper-plus/wasm/multilingual'
import { normalizeForSpeech } from '../src/engine/tts.js'

// 表示用の「こん虫」が、音声では必ず「こんちゅう」になる回帰テスト。
// この事故を再発させると、子どもが誤った読み方を覚えてしまうため固定する。
const normalizedLessonText = normalizeForSpeech('こん虫の からだ。昆虫には 6本の あしがあります。')
assert.equal(normalizedLessonText, 'こんちゅうのからだ。こんちゅうには6本のあしがあります。')

// 本番の辞書WASMを、Nodeでは同じバイナリを直接渡して初期化する。
// 漢字まじりの出題文を辞書経路で音素にできることを確認する。
const configUrl = 'https://huggingface.co/ayousanz/piper-plus-tsukuyomi-chan/resolve/36b59c825c36bd386b8960cf3f604382f52f2a87/config.json'
const response = await fetch(configUrl)
assert.ok(response.ok, `config download failed: ${response.status}`)
const config = await response.json()
const bytes = await readFile(new URL('../node_modules/piper-plus/dist/rust-wasm/piper_plus_wasm_bg.wasm', import.meta.url))
await init(bytes)

const phonemizer = new WasmPhonemizer(JSON.stringify(config))
const result = phonemizer.phonemize(normalizedLessonText, 'ja')
assert.ok(result.phonemeIds.length > 50, 'dictionary phonemizer must encode Japanese text')
assert.equal(result.prosodyFeatures.length, result.phonemeIds.length * 3)
result.free()
phonemizer.free()

console.log('Dictionary Japanese phonemizer verified')
