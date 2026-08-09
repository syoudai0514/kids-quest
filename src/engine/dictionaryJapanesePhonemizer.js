// ============================================================
// つくよみちゃん用・自然な日本語フォネマイザー
//
// 約58MBの日本語辞書を持つ公式WASMを使い、漢字・助詞・文の区切りを
// 自然に読む。学習問題だけでなく、今後追加する説明文・会話文にも
// 同じ経路を使えるよう、アプリ全体の標準としている。
// ============================================================

export async function createDictionaryJapaneseWasmModule() {
  const wasm = await import('piper-plus/wasm/multilingual')
  await wasm.default()
  // piper-plusの多言語WASMには中国語辞書の追加取得口もある。今回のモデルは
  // 常に日本語で呼ぶため、薄い日本語専用ラッパーを返して不要な中国語辞書の
  // 通信・メモリ確保を発生させない。
  class JapaneseDictionaryPhonemizer {
    constructor(configJson) {
      this.delegate = new wasm.WasmPhonemizer(configJson)
    }
    getSupportedLanguages() { return ['ja'] }
    detectLanguage() { return 'ja' }
    phonemize(text) { return this.delegate.phonemize(text, 'ja') }
    free() { this.delegate?.free?.() }
  }
  return { WasmPhonemizer: JapaneseDictionaryPhonemizer }
}

export const createJapanesePhonemizerModule = createDictionaryJapaneseWasmModule
