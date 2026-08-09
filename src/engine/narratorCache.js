// 旧74MB版と同じリポジトリ名をキャッシュキーにすると、配布元が38MB版へ
// 更新されてもiPhoneは古いモデルを使い続ける。軽量化済みFP16モデルを
// コミット単位で固定し、キャッシュキーも変えて確実に移行する。
export const NARRATOR_MODEL_URL =
  'https://huggingface.co/ayousanz/piper-plus-tsukuyomi-chan/resolve/36b59c825c36bd386b8960cf3f604382f52f2a87/tsukuyomi-chan-6lang-fp16.onnx'

const LEGACY_NARRATOR_CACHE_KEY = 'ayousanz/piper-plus-tsukuyomi-chan'
// 「声を選んだ」ことと「約38MBを端末に保存してよい」ことは別の意思決定。
// v4 は、自然な日本語の辞書を標準で使う版。
// 旧版で保存済みの38MB音声モデルはそのまま再利用する。
const NARRATOR_INSTALL_KEY = 'hoshizora:narrator-model-v4-dictionary-installed'
const LEGACY_NARRATOR_INSTALL_KEYS = [
  'hoshizora:narrator-model-v2-installed',
  'hoshizora:narrator-model-v3-lite-installed'
]
const LEGACY_NARRATOR_RUNTIME_CACHES = ['narrator-wasm-v1', 'narrator-wasm-v2-lite']

export class NarratorNotDownloadedError extends Error {
  constructor() {
    super('つくよみちゃんは、まだ端末にダウンロードされていません')
    this.name = 'NarratorNotDownloadedError'
  }
}

export function hasNarratorInstallMarker() {
  try {
    return globalThis.localStorage?.getItem(NARRATOR_INSTALL_KEY) === '1' ||
      LEGACY_NARRATOR_INSTALL_KEYS.some((key) => globalThis.localStorage?.getItem(key) === '1')
  } catch (_) {
    return false
  }
}

export function markNarratorInstalled() {
  try {
    globalThis.localStorage?.setItem(NARRATOR_INSTALL_KEY, '1')
    LEGACY_NARRATOR_INSTALL_KEYS.forEach((key) => globalThis.localStorage?.removeItem(key))
  } catch (_) { /* noop */ }
}

export function clearNarratorInstallMarker() {
  try { globalThis.localStorage?.removeItem(NARRATOR_INSTALL_KEY) } catch (_) { /* noop */ }
}

export function removeLegacyNarratorRuntimeCaches() {
  if (!globalThis.caches?.delete) return Promise.resolve()
  return Promise.all(
    LEGACY_NARRATOR_RUNTIME_CACHES.map((cacheName) => globalThis.caches.delete(cacheName).catch(() => false))
  ).then(() => undefined)
}

function removeLegacyNarratorModel() {
  if (typeof indexedDB === 'undefined') return
  try {
    const request = indexedDB.open('piper-plus-models', 2)
    request.onsuccess = () => {
      const db = request.result
      try {
        const tx = db.transaction('models', 'readwrite')
        tx.objectStore('models').delete(LEGACY_NARRATOR_CACHE_KEY)
        tx.oncomplete = () => db.close()
        tx.onerror = () => db.close()
      } catch (_) {
        db.close()
      }
    }
  } catch (_) {
    // 古いキャッシュの削除に失敗しても、新モデルの利用は継続する。
  }
}

// PiperPlus.initialize() は現行版ではモデルURLを直接 ONNX Runtime へ渡すため、
// ModelManager の IndexedDB キャッシュを通らない。先に ModelManager でモデルを
// 明示保存し、ONNXセッション作成時だけ保存済みバイト列を渡す。
export async function loadCachedNarratorModel(ModelManager, onStatus = () => {}, { allowDownload = false } = {}) {
  if (typeof indexedDB === 'undefined') return null

  onStatus({
    storage: 'checking',
    progress: null,
    detail: '端末に保存した声を確認しています…'
  })

  try {
    // 保存領域がOSの自動整理対象になりにくいよう依頼する。未対応端末では
    // 何も起きないため、Safariでも安全に呼べる。
    globalThis.navigator?.storage?.persist?.().catch(() => {})

    const manager = new ModelManager()
    const urls = await manager.resolveUrls(NARRATOR_MODEL_URL)
    const cached = await manager.getFromCache(urls.cacheKey)
    if (cached?.modelData) {
      onStatus({
        storage: 'cached',
        progress: null,
        detail: '保存済みの声を読み込んでいます…（再ダウンロードなし）'
      })
      return { ...urls, ...cached }
    }

    // 音声を選択しただけ／問題を開始しただけでは、通信も保存も始めない。
    // OSのストレージ整理で保存済みモデルが消えた場合も同じ扱いに戻す。
    if (!allowDownload) {
      clearNarratorInstallMarker()
      onStatus({
        storage: 'not-downloaded',
        progress: null,
        detail: 'つくよみちゃんは、まだ端末に保存されていません'
      })
      throw new NarratorNotDownloadedError()
    }

    onStatus({
      storage: 'downloading',
      progress: 0,
      detail: '初回だけ、声のデータを端末へ保存しています…'
    })
    // onProgress を渡したModelManagerは、受信チャンクを全保持した後でもう1本の
    // ArrayBufferへ結合するため、ダウンロード中だけモデル2個分を消費する。
    // iPhoneではresponse.arrayBuffer()の単一経路を使い、ピークメモリを抑える。
    const loaded = await manager.loadModel(NARRATOR_MODEL_URL)
    // 旧74MB版は同じ声だが、以後使わない。新38MB版の保存後にだけ削除する。
    removeLegacyNarratorModel()
    onStatus({
      storage: 'saved',
      progress: 100,
      detail: '声のデータを端末へ保存しました'
    })
    return { ...urls, ...loaded }
  } catch (error) {
    // これは失敗ではなく「保護者がまだ保存を許可していない」通常状態。
    // temporary 扱いにすると、後段がURLを使って暗黙に取得してしまう。
    if (error instanceof NarratorNotDownloadedError) throw error
    // IndexedDBが使えない環境でも音声機能そのものは止めない。ただし毎回取得に
    // 戻ったことを画面に出し、保存できたようには見せない。
    onStatus({
      storage: 'temporary',
      progress: null,
      detail: '端末保存を使えないため、一時読み込みで準備しています…',
      error: `声の保存に失敗: ${error?.message || error}`
    })
    return null
  }
}

export function ortWithCachedModel(ort, cachedModel) {
  if (!cachedModel?.modelData || !cachedModel?.modelUrl) return ort
  let modelData = cachedModel.modelData
  return {
    ...ort,
    InferenceSession: {
      create: async (source, options) => {
        if (source === cachedModel.modelUrl && modelData) {
          const bytes = modelData
          modelData = null
          // cachedModel側の参照も外す。ORTがWASMメモリへモデルを読み込む間に、
          // 38MBのJavaScript側コピーを余分に保持しない。
          cachedModel.modelData = null
          return ort.InferenceSession.create(bytes, options)
        }
        return ort.InferenceSession.create(source, options)
      }
    }
  }
}
