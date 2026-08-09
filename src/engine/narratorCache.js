// PiperPlus.initialize() は現行版ではモデルURLを直接 ONNX Runtime へ渡すため、
// ModelManager の IndexedDB キャッシュを通らない。先に ModelManager でモデルを
// 明示保存し、ONNXセッション作成時だけ保存済みバイト列を渡す。
export async function loadCachedNarratorModel(ModelManager, onStatus = () => {}) {
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
    const urls = await manager.resolveUrls('tsukuyomi')
    const cached = await manager.getFromCache(urls.cacheKey)
    if (cached?.modelData) {
      onStatus({
        storage: 'cached',
        progress: null,
        detail: '保存済みの声を読み込んでいます…（再ダウンロードなし）'
      })
      return { ...urls, ...cached }
    }

    onStatus({
      storage: 'downloading',
      progress: 0,
      detail: '初回だけ、声のデータを端末へ保存しています…'
    })
    const loaded = await manager.loadModel('tsukuyomi', {
      onProgress: ({ percentage }) => {
        onStatus({
          storage: 'downloading',
          progress: Number.isFinite(percentage) && percentage > 0 ? percentage : null,
          detail: percentage > 0
            ? `声のデータを保存しています… ${percentage}%`
            : '声のデータを保存しています…'
        })
      }
    })
    onStatus({
      storage: 'saved',
      progress: 100,
      detail: '声のデータを端末へ保存しました'
    })
    return { ...urls, ...loaded }
  } catch (error) {
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
          return ort.InferenceSession.create(bytes, options)
        }
        return ort.InferenceSession.create(source, options)
      }
    }
  }
}
