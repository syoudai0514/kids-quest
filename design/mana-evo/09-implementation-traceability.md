# 実装トレーサビリティ

Terraが「どの要件をどこで確認するか」を短く固定する。レビュー履歴ではなく、現行仕様だけを対象にする。

| 領域 | 仕様正本 | 機械可読・テスト |
|---|---|---|
| ブランド/PWA/GitHub Pages/保存互換 | `10-BRAND-MIGRATION-SPEC.md` | `scripts/brand.json`, 実装側migration test |
| モンスター名・系列・進化・図鑑 | `02-dex.md` | `scripts/families.mjs`, `scripts/check2.mjs` |
| キャラ設定・画像制作 | `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md` | `scripts/monster-visual-briefs.json` |
| チケット/遭遇/地域/探索/重複捕獲 | `08-gameplay-state-spec.md` | `scripts/rewards.mjs`, `scripts/wildEncounter.mjs`, `scripts/check2.mjs` |
| バトル/XP/AI/特殊変身 | `06-battle-and-progression-design.md` | `scripts/battle.mjs`, `scripts/forms.mjs` |
| 野生出現/捕獲確率 | `07-wild-encounter-and-capture-design.md` | `scripts/capture.mjs`, `scripts/wildEncounter.mjs` |
| 子ども向け画面 | `03-screens-catch-and-raise.md` | 実装側UI/E2E/viewport test |
| 進化アイテム | `01-catch-and-evolution-design.md`, `08-gameplay-state-spec.md` | `scripts/items.mjs` |
| 最終受入条件 | `99-IMPLEMENTATION-REVIEW-CHECKLIST.md` | repoのlint/typecheck/unit/integration/build/E2E |

## 衝突時

- ブランド・移行: `10` を優先。
- モンスター名・画像設定: `11` + `scripts/families.mjs` / visual briefs を優先。
- ゲーム状態遷移: `08` を優先。
- 数値は対応する `scripts/*.mjs` を優先。
- 過去版・GitHub上の旧コメントから仕様を復活させない。
