import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as ort from 'onnxruntime-web/wasm'
import { PiperPlus } from 'piper-plus'
import { NARRATOR_MODEL_URL } from '../src/engine/narratorCache.js'
import { createLiteJapaneseWasmModule } from '../src/engine/liteJapanesePhonemizer.js'
import { narratorLengthScale } from '../src/config/ttsRates.js'

// Browser版はViteがWASM URLを解決する。NodeにはそのアセットURLが
// ないため、本番ビルドと同じ12MB版バイナリを直接渡す。
ort.env.wasm.numThreads = 1
ort.env.wasm.wasmBinary = await readFile(
  new URL('../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', import.meta.url)
)

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
  model: NARRATOR_MODEL_URL,
  ort: testOrt,
  wasmLoader: async () => createLiteJapaneseWasmModule(),
  onProgress: ({ stage, progress, message }) => {
    const percentage = Number.isFinite(progress) ? `${Math.round(progress * 100)}%` : ''
    console.log(`${stage} ${percentage} ${message || ''}`.trim())
  }
})

// 設定画面で実際に再生する確認文を、本番と同じ軽量経路で合成する。
const text = 'こんにちは。つくよみちゃんです。いっしょに、たのしく、まなぼうね。'
// 長さだけを検証するため、推論時のランダムな抑揚は固定する。
// これを指定しないと、正しいlengthScaleでも波形の揺らぎで秒数の順序が
// たまたま入れ替わり、再生とは無関係な不安定テストになる。
const fixedVoice = { language: 'ja', noiseScale: 0, noiseW: 0 }
const normalResult = await piper.synthesize(text, { ...fixedVoice, lengthScale: narratorLengthScale(0.8) })
const slowResult = await piper.synthesize(text, { ...fixedVoice, lengthScale: narratorLengthScale(0.6) })
const fastResult = await piper.synthesize(text, { ...fixedVoice, lengthScale: narratorLengthScale(1.2) })

assert.ok(normalResult.samples instanceof Float32Array)
assert.ok(normalResult.samples.length > normalResult.sampleRate, 'at least one second of speech is required')
const peak = normalResult.samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
assert.ok(peak > 0.001, 'generated speech must not be silent')
const speedSeconds = {
  slow: slowResult.samples.length / slowResult.sampleRate,
  normal: normalResult.samples.length / normalResult.sampleRate,
  fast: fastResult.samples.length / fastResult.sampleRate
}
console.log('speed durations', speedSeconds)
assert.ok(
  slowResult.samples.length > normalResult.samples.length && normalResult.samples.length > fastResult.samples.length,
  'the three narrator speed choices must produce slow > normal > fast durations'
)
assert.ok(
  normalResult.samples.length >= fastResult.samples.length * 1.35,
  'normal narration must be materially slower than the adult-speed preset'
)

// 報告された「国語でわからないを2回」の経路。回答と解説を
// 続けて合成しても、波形が作られ、前回結果を保持し続けないことを確認する。
const dontKnowText = 'だいじょうぶ。こたえは「ほし」。これは「ほし」。ほしだよ。つぎはできるよ！'
for (let index = 0; index < 2; index += 1) {
  const feedbackResult = await piper.synthesize(dontKnowText, { ...fixedVoice, lengthScale: narratorLengthScale(0.8) })
  assert.ok(feedbackResult.samples.length > feedbackResult.sampleRate, `feedback ${index + 1} must not be silent`)
}

console.log(JSON.stringify({
  samples: normalResult.samples.length,
  sampleRate: normalResult.sampleRate,
  seconds: normalResult.samples.length / normalResult.sampleRate,
  peak,
  speedSeconds
}))
