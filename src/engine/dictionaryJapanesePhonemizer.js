// ============================================================
// つくよみちゃん用・辞書入り日本語フォネマイザー（試験版）
//
// 軽量版はiPhone 11 Proで安定して動かすため、かなへ限定した小さな
// 変換を使う。こちらは約58MBの日本語辞書を持つ公式WASMを使い、
// 漢字・助詞・文の区切りをより自然に読むための選択肢。
//
// このファイルを動的 import にしておくことで、軽量版を使う間は
// 辞書WASMをダウンロードもメモリ確保もしない。
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
