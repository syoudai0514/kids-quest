# ほしぞらクエスト：Luna向け作業ルール

このアプリは5歳〜小学生向けの学習PWAです。Lunaには **教材の追加・画像の差し替え・軽い見た目調整** を任せます。音声、書き取り、保存、PWA設定は安定動作を優先し、明示依頼がない限り変更しません。

## 最初にすること

1. `main` から `luna/<短い作業名>` ブランチを作る。
2. `git status --short --branch` と `git log --oneline -5` を表示する。
3. 既にある未コミット変更や、他の人の変更には触らない。

## Lunaが変更してよい範囲

- 教材データ: `src/data/content/`
- 教科登録: `src/engine/activities.js`（新しい教科を追加するときだけ）
- 独自画像: `public/monsters/`、`public/icons/`
- 文言・軽い見た目: 対象画面1つと `src/styles/global.css`
- このルール・README・テスト

## 明示依頼なしでは変更禁止

- 音声: `src/engine/tts.js`、`src/engine/narratorCache.js`、`src/engine/ttsPronunciation.js`、`src/engine/dictionaryJapanesePhonemizer.js`
- 書き取り: `src/components/TracingCanvas.jsx`、`src/data/strokeOrder.js`
- 保存: `src/engine/storage.js`、`src/state/GameContext.jsx`
- PWA/公開: `vite.config.js`、`.github/workflows/`、`index.html`
- `package.json` の依存関係、ロックファイル

理由: ここは以前、音声の重複・負荷、書き取り完了後の停止、公開ブランチの混乱が起きた領域。教材の追加と切り離している。

## 教材データの必須ルール

- 事実問題は、正解・誤答・解説をセットで追加する。あいまいな問題は入れない。
- 年長〜小2には短い文・身近な語を使う。小3以上は学年相当の内容に限定する。
- 選択肢は正解を必ず1つにし、同じ文言を重複させない。
- 読み上げる文は、漢字の途中にかなを混ぜて単語を分断しない。必要なら発音辞書側の対応を上位モデルへ依頼する。
- 既存の学習方針（間違いを責めない、解説を短く前向きに）を守る。

## 終了条件（必須）

変更後に必ず次を実行する。

```bash
npm run test:content
npm run test:tts-cache
npm run build
git diff --check
git status --short
```

成功したら、変更ファイル・テスト結果・残る懸念を3行で報告する。`main` へpush・マージ・公開はしない。公開は人またはTerra/Solの最終確認後に `main` からだけ行う。

## Lunaへそのまま渡せる依頼文

```text
Kids Quest の <作業内容> を対応して。
AGENTS.mdを最初に読んで、mainから luna/<短い作業名> を作成。
指定された範囲だけを変更し、音声・書き取り・保存・PWA設定・GitHub Actionsには触れない。
最後に npm run test:content、npm run test:tts-cache、npm run build、git diff --check を実行し、変更ファイルと結果だけ報告して。mainへのpush・公開はしない。
```
