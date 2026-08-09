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

const result = await piper.synthesize(
  'こちらは、アプリ専用のつくよみちゃんです。',
  { language: 'ja', lengthScale: 1 }
)

assert.ok(result.samples instanceof Float32Array)
assert.ok(result.samples.length > result.sampleRate, 'at least one second of speech is required')
const peak = result.samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
assert.ok(peak > 0.001, 'generated speech must not be silent')

console.log(JSON.stringify({
  samples: result.samples.length,
  sampleRate: result.sampleRate,
  seconds: result.samples.length / result.sampleRate,
  peak
}))
