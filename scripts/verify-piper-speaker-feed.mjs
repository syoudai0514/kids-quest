import assert from 'node:assert/strict'
import { PiperPlus } from 'piper-plus'

class FakeTensor {
  constructor(type, data, dims) {
    this.type = type
    this.data = data
    this.dims = dims
  }
}

let capturedFeeds
const piper = Object.create(PiperPlus.prototype)
piper._ort = { Tensor: FakeTensor }
piper._config = { audio: { sample_rate: 22050 } }
piper._hasSpeakerEmbedding = true
piper._speakerEmbeddingSize = 256
piper._speakerEmbeddingMaskShape = [1, 1]
piper._hasProsodyFeatures = false
piper._sessionManager = { currentProvider: 'wasm' }
piper._session = {
  inputNames: [
    'input',
    'input_lengths',
    'scales',
    'speaker_embedding',
    'speaker_embedding_mask'
  ],
  async run(feeds) {
    capturedFeeds = feeds
    return { output: { data: new Float32Array([0.1, -0.1]) } }
  }
}

await piper._infer([1, 2, 3], null, {
  noiseScale: 0.5,
  lengthScale: 1,
  noiseW: 0.5,
  language: 'ja'
})

assert.ok(capturedFeeds.speaker_embedding, 'speaker_embedding must be supplied')
assert.deepEqual(capturedFeeds.speaker_embedding.dims, [1, 256])
assert.ok(
  capturedFeeds.speaker_embedding.data.every((value) => value === 0),
  'the built-in voice must use a zero embedding'
)
assert.ok(capturedFeeds.speaker_embedding_mask, 'speaker_embedding_mask must be supplied')
assert.deepEqual(capturedFeeds.speaker_embedding_mask.dims, [1, 1])
assert.equal(capturedFeeds.speaker_embedding_mask.data[0], 0n)

console.log('Piper built-in speaker feed verified')
