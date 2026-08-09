import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as ort from 'onnxruntime-web'
import { PiperPlus } from 'piper-plus'
import * as japanesePhonemizer from 'piper-plus/wasm/multilingual'

// onnxruntime-web expects browsers to fetch remote model URLs itself. In this
// Node verification, fetch the exact same bytes first and pass them to ORT.
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

const piper = await PiperPlus.initialize({
  model: 'tsukuyomi',
  ort: testOrt,
  wasmLoader: async () => {
    const wasmBytes = await readFile(
      new URL('../node_modules/piper-plus/dist/rust-wasm/piper_plus_wasm_bg.wasm', import.meta.url)
    )
    await japanesePhonemizer.default(wasmBytes)
    return japanesePhonemizer
  },
  onProgress: ({ stage, progress, message }) => {
    const percentage = Number.isFinite(progress) ? `${Math.round(progress * 100)}%` : ''
    console.log(`${stage} ${percentage} ${message || ''}`.trim())
  }
})

const text = 'こちらは、アプリ専用のつくよみちゃんです。'
// 長さだけを検証するため、推論時のランダムな抑揚は固定する。
// これを指定しないと、正しいlengthScaleでも波形の揺らぎで秒数の順序が
// たまたま入れ替わり、再生とは無関係な不安定テストになる。
const fixedVoice = { language: 'ja', noiseScale: 0, noiseW: 0 }
const result = await piper.synthesize(text, { ...fixedVoice, lengthScale: 1 })
const slowResult = await piper.synthesize(text, { ...fixedVoice, lengthScale: 0.98 / 0.84 })
const fastResult = await piper.synthesize(text, { ...fixedVoice, lengthScale: 0.98 / 1.08 })

assert.ok(result.samples instanceof Float32Array)
assert.ok(result.samples.length > result.sampleRate, 'at least one second of speech is required')
const peak = result.samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
assert.ok(peak > 0.001, 'generated speech must not be silent')
const speedSeconds = {
  slow: slowResult.samples.length / slowResult.sampleRate,
  normal: result.samples.length / result.sampleRate,
  fast: fastResult.samples.length / fastResult.sampleRate
}
console.log('speed durations', speedSeconds)
assert.ok(
  slowResult.samples.length > result.samples.length && result.samples.length > fastResult.samples.length,
  'the three narrator speed choices must produce slow > normal > fast durations'
)

console.log(JSON.stringify({
  samples: result.samples.length,
  sampleRate: result.sampleRate,
  seconds: result.samples.length / result.sampleRate,
  peak,
  speedSeconds
}))
