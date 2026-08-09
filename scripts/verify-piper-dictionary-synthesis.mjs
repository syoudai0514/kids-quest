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

const text = 'こんにちは。つくよみちゃんです。いっしょに、たのしく、まなぼうね。'
const fixedVoice = { language: 'ja', noiseScale: 0, noiseW: 0 }
const slowResult = await piper.synthesize(text, { ...fixedVoice, lengthScale: narratorLengthScale(0.5) })
const normalResult = await piper.synthesize(text, { ...fixedVoice, lengthScale: narratorLengthScale(0.7) })
const fastResult = await piper.synthesize(text, { ...fixedVoice, lengthScale: narratorLengthScale(0.9) })

assert.ok(normalResult.samples instanceof Float32Array)
assert.ok(normalResult.samples.length > normalResult.sampleRate, 'dictionary narration must produce audible audio')
assert.ok(normalResult.samples.some((sample) => Math.abs(sample) > 0.001), 'dictionary narration must not be silent')
assert.ok(
  slowResult.samples.length > normalResult.samples.length && normalResult.samples.length > fastResult.samples.length,
  'the three dictionary narrator speed choices must produce slow > normal > fast durations'
)
assert.ok(
  slowResult.samples.length >= normalResult.samples.length * 1.2 &&
    normalResult.samples.length >= fastResult.samples.length * 1.2,
  'each child-facing speed choice must be clearly distinct'
)

console.log('Dictionary narrator speed durations', {
  slow: slowResult.samples.length / slowResult.sampleRate,
  normal: normalResult.samples.length / normalResult.sampleRate,
  fast: fastResult.samples.length / fastResult.sampleRate
})
piper.dispose()

console.log('Dictionary narrator synthesis verified')
