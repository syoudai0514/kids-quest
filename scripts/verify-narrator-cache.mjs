import assert from 'node:assert/strict'
import {
  NARRATOR_MODEL_URL,
  loadCachedNarratorModel,
  ortWithCachedModel
} from '../src/engine/narratorCache.js'

globalThis.indexedDB = {}

const modelUrl = 'https://example.test/voice.onnx'
const modelData = new ArrayBuffer(8)
let loadCalls = 0
class CachedManager {
  async resolveUrls(requested) {
    assert.equal(requested, NARRATOR_MODEL_URL)
    return { modelUrl, configUrl: `${modelUrl}.json`, cacheKey: 'voice' }
  }
  async getFromCache() { return { modelData, config: {} } }
  async loadModel() { loadCalls += 1; throw new Error('must not download on a cache hit') }
}

const statuses = []
const cached = await loadCachedNarratorModel(CachedManager, (status) => statuses.push(status))
assert.equal(loadCalls, 0)
assert.equal(cached.modelData, modelData)
assert.equal(statuses.at(-1).storage, 'cached')

const sources = []
const ort = {
  Tensor: class {},
  InferenceSession: {
    create: async (source) => { sources.push(source); return { source } }
  }
}
const wrappedOrt = ortWithCachedModel(ort, cached)
await wrappedOrt.InferenceSession.create(modelUrl)
await wrappedOrt.InferenceSession.create(modelUrl)
assert.equal(sources[0], modelData, 'the first session must use IndexedDB bytes')
assert.equal(sources[1], modelUrl, 'cached bytes must be released after session creation')

let downloaded = 0
class EmptyManager extends CachedManager {
  async getFromCache() { return null }
  async loadModel(name, options) {
    assert.equal(name, NARRATOR_MODEL_URL)
    assert.equal(options, undefined, 'low-memory download must not retain progress chunks')
    downloaded += 1
    return { modelData, config: {} }
  }
}
const missStatuses = []
// 通常の読み上げ経路は、キャッシュが無ければ通信しない。
await assert.rejects(
  () => loadCachedNarratorModel(EmptyManager, (status) => missStatuses.push(status)),
  { name: 'NarratorNotDownloadedError' }
)
assert.equal(downloaded, 0, 'selecting the narrator must never download its model')
assert.equal(missStatuses.at(-1).storage, 'not-downloaded')

// 保護者が明示的にダウンロード操作をした時だけ取得する。
await loadCachedNarratorModel(EmptyManager, (status) => missStatuses.push(status), { allowDownload: true })
assert.equal(downloaded, 1)
assert.equal(missStatuses.at(-1).storage, 'saved')
assert.equal(missStatuses.at(-1).progress, 100)

console.log('Narrator IndexedDB cache path verified')
