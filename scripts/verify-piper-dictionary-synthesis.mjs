import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as ort from 'onnxruntime-web/wasm'
import { PiperPlus } from 'piper-plus'
import init, { WasmPhonemizer } from 'piper-plus/wasm/multilingual'
import { NARRATOR_MODEL_URL } from '../src/engine/narratorCache.js'
import { narratorLengthScale } from '../src/config/ttsRates.js'

ort.env.wasm.numThreads = 1
ort.env.wasm.wasmBinary = await readFile(
  new URL('../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', import.meta.url)
)
const dictionaryBytes = await readFile(
  new URL('../node_modules/piper-plus/dist/rust-wasm/piper_plus_wasm_bg.wasm', import.meta.url)
)

const testOrt = {
  ...ort,
  InferenceSession: {
    create: async (source, options) => {
      if (typeof source === 'string' && /^https?:\/\//.test(source)) {
        const response = await fetch(source)
        assert.ok(response.ok, `model download failed: ${response.status}`)
        source = new Uint8Array(await response.arrayBuffer())
      }
      return ort.InferenceSession.create(source, options)
    }
  }
}

let dictionaryReady = false
class JapaneseDictionaryPhonemizer {
  constructor(configJson) { this.delegate = new WasmPhonemizer(configJson) }
  getSupportedLanguages() { return ['ja'] }
  detectLanguage() { return 'ja' }
  phonemize(text) { return this.delegate.phonemize(text, 'ja') }
  free() { this.delegate?.free?.() }
}

const piper = await PiperPlus.initialize({
  model: NARRATOR_MODEL_URL,
  ort: testOrt,
  wasmLoader: async () => {
    if (!dictionaryReady) {
      await init(dictionaryBytes)
      dictionaryReady = true
    }
    return { WasmPhonemizer: JapaneseDictionaryPhonemizer }
  }
})

const result = await piper.synthesize('今日は国語の問題です。星を見つけよう。', {
  language: 'ja', lengthScale: narratorLengthScale(0.7), noiseScale: 0, noiseW: 0
})
assert.ok(result.samples instanceof Float32Array)
assert.ok(result.samples.length > result.sampleRate, 'dictionary narration must produce audible audio')
assert.ok(result.samples.some((sample) => Math.abs(sample) > 0.001), 'dictionary narration must not be silent')
piper.dispose()

console.log('Dictionary narrator synthesis verified')
