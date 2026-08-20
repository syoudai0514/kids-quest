# マナエボ — Terra最終実装パッケージ START HERE

## このZIPの目的

**このZIPがTerraへ渡す最終版です。** レビュー履歴保管用ではなく、**Terraが旧 `syoudai0514/kids-quest` を `syoudai0514/mana-evo` へ安全に進化させ、設計を実装・公開するための実装パッケージ**です。

正式ブランドは次で固定します。

- 正式名称: **マナエボ**
- 英字表記: **ManaEvo**
- GitHub: **`mana-evo`**
- キャッチコピー: **まなびが、進化になる。**

世界観の核は、**「まなぶと『マナ』が生まれる。マナの力で冒険し、仲間を育て、進化させよう。」** です。

## Terraが最初に読む順番

1. `00-TERRA-IMPLEMENTATION-REQUEST.md`
2. `10-BRAND-MIGRATION-SPEC.md` — ブランド/PWA/GitHub/保存互換の正本
3. `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md` — キャラ名/グラフィックの正本
4. `scripts/families.mjs` / `scripts/monster-visual-briefs.json` — キャラ機械可読正本
5. `08-gameplay-state-spec.md` — ゲームプレイ正本
6. その他 `scripts/*.mjs` — 定数・機械チェック
7. `06-battle-and-progression-design.md` / `07-wild-encounter-and-capture-design.md`
8. `03-screens-catch-and-raise.md`
9. `01-catch-and-evolution-design.md` / `02-dex.md`
10. `09-implementation-traceability.md`
11. `99-IMPLEMENTATION-REVIEW-CHECKLIST.md`

## 領域別の正本

- ブランド/リポジトリ/PWA/保存移行: **`10-BRAND-MIGRATION-SPEC.md`**
- モンスター名/キャラクター設定/画像生成: **`11` + `families.mjs` + `monster-visual-briefs.json`**
- バトル/捕獲/探索/進化のゲーム仕様: **`08` > scripts > `06/07` > `03` > `01/02`**

下位文書の古い表現を理由に上位正本を変更してはいけません。

## 特に誤解禁止

- `area` は制作・データ分類、`adventureRegion` はゲーム内地域。
- 地域2〜4は直前地域ボス初回撃破で順次解放。
- アイテムは地域解放時に自動付与しない。解放地域の探索ドロップ候補になる。
- 子ども向け捕獲UIは ★＋日本語ラベルが主表示。%は補助値。
- 今回のキャラ改名は**表示名の改善**。既存の安定monsterId/dexIdを名前に合わせて変更しない。
- `Kids Quest` は移行元を説明する技術文脈以外では新UIに残さない。
- 他作品の名称・UI・画像・演出・文章・音声を模倣しない。
