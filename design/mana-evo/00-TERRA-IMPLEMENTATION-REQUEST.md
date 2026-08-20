# Terra 実装依頼 — マナエボ FINAL

## 依頼

GitHubリポジトリ **`syoudai0514/kids-quest`** の作業開始時点の最新 `origin/main` を取得し、このZIPの設計を実装してください。

今回はゲーム実装と同時に、プロダクト名を **Kids Quest → マナエボ** へ正式移行します。実装・テスト・移行確認後、GitHubリポジトリ名も **`mana-evo`** へ変更し、正規のGitHub Pages公開先を `/mana-evo/` にしてください。

**計画だけで終了禁止。** 調査 → 実装 → テスト → セルフレビュー → ブランド移行 → `main` 反映 → GitHub Pages公開確認 → 実装再レビュー用ZIP作成まで完了してください。force pushは禁止です。

## ブランド固定値

- 正式名称: **マナエボ**
- 英字表記: **ManaEvo**
- GitHub: **`mana-evo`**
- キャッチコピー: **まなびが、進化になる。**
- 世界観: **まなぶと「マナ」が生まれる。マナの力で冒険し、仲間を育て、進化させよう。**
- `マナ` は今回、物語上の共通概念。**新しい消費通貨を追加しない。** 既存チケット/探索pt/XPを二重化しない。
- 新規コード命名の標準: camelCase=`manaEvo`、定数prefix=`MANA_EVO`。ただし既存の永続ID/schema keyを見た目の都合だけでrenameしない。

## 作業前提

- 現行コード、保存形式、PWA構成、manifest、Service Worker、GitHub Pages base path、CI、既存テストを最初に調査する。
- 既存ユーザーのセーブ、XP、学習/英語/SRS/連続記録、プロフィール、図鑑、所持、報酬を可能な限り保持する。
- モンスター名は表示名として更新し、安定IDが存在する場合はIDを維持する。名前保存しかない旧データは `scripts/monster-name-aliases.json` で移行する。
- 外部作品の固有名・キャラクターデザイン・UI・文章・演出をコードや画像指示へ持ち込まない。18タイプ/確率/数値はこのZIP自身の正本だけを参照する。
- テスト削除・skip・期待値弱体化でPASSさせない。
- unrelatedな全面リファクタや不要依存追加をしない。
- APIキー等をコミットしない。既存未コミット変更を勝手に破棄しない。

## 正本

- ブランド/PWA/GitHub/保存互換: `10-BRAND-MIGRATION-SPEC.md`
- キャラ名/画像設定: `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md` + `scripts/families.mjs` + `scripts/monster-visual-briefs.json`
- ゲーム仕様: `08-gameplay-state-spec.md` > scripts > `06/07` > `03` > `01/02`

## ゲーム仕様の必須条件

- 基本学習ノルマ達成 → バトルチケット+3
- 追加問題1問 → チケット+1、日次上限なし
- チケットは獲得日ごとに7日保持し、期限が近いものから消費。0時一括消去は禁止。旧個数セーブも失わず冪等migration
- きんのわ → 追加4問中3正解
- 勝利確定時だけチケット1枚消費。敗北/逃走/画面離脱では消費しない
- 敗北/逃走/画面離脱では同じ `encounterId` を保持
- 捕獲成功または3投失敗でのみ `RESOLVED`
- 地域2〜4は直前地域ボス初回撃破で順次解放
- 地域ボス条件 = 12pt + 異なるskill 2つ以上。進行は地域別、新地域は0pt/空集合
- 未解放地域の野生/探索/アイテム参照禁止
- 探索5pt/回、日次上限なし。同地域5回連続不発→6回目開始時に進化アイテム1個選択保証
- `まもる`=100%防御、次ターン再使用不可
- ギガ=全ステータス×1.35、HP割合維持
- キョダイバースト=HP×2/攻撃×1.2/3ターン、解除時HP割合維持
- ギガ/バーストは種族単位で排他、1バトル全体で1回
- 同種2匹目以降は「なかま / おうえん」選択
- そだちのかけら3個=30XP
- 捕獲主UIは★＋日本語ラベル。4星→輪完成。4回の物理揺れを必須にしない

## ブランド移行の必須対象

`10-BRAND-MIGRATION-SPEC.md` のチェックリストを全件実施すること。最低限、次を含む。

- document title / 主要画面 / onboarding / footer / about / README
- PWA `manifest` の name/short_name/start_url/scope/id（既存構成を調査した上で互換性を判断）
- Apple/PWA関連meta、OG/Twitter metadata、favicon/icon参照
- `package.json` / lockfile / build設定 / GitHub Actions / badges / repo link
- GitHub Pages base path・asset path・Service Worker・Cache Storage
- export/import/backup filename等のブランド表示
- リポジトリ `kids-quest` → `mana-evo` renameとremote更新
- 旧 `/kids-quest/` ブックマーク/PWA導線の互換確認。必要なら安全なredirect/移行導線
- 旧保存データ → 新保存方式の一方向・冪等移行
- 旧ブランド文言がユーザー画面に残っていないこと

## 必須テスト

既存テストに加え `99-IMPLEMENTATION-REVIEW-CHECKLIST.md` を回帰テスト化できる範囲で自動化する。特に、

- 勝利確定前後のチケット数、敗北/逃走/再読込
- チケットの7日expiry、複数獲得日のFEFO消費、旧個数形式→期限付き形式の冪等migration
- 捕獲1〜3投、成功/失敗、同encounter再開
- 地域ボス11→12pt、skill 1→2、地域解放前後
- 探索5回不発→6回目保証
- `まもる` cooldown
- ギガ/バースト変身・解除・0HP
- 旧セーブ移行を複数回実行して重複なし
- **旧キャラ名を含むセーブ → 新表示名で同一個体として復元**
- **旧 `/kids-quest/` からの導線/保存 → `/mana-evo/` で継続**
- PWAオフライン起動、更新、Service Worker scope/cache

## 画像assetsの扱い

- `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md` と `scripts/monster-visual-briefs.json` がキャラ画像の正本。
- 最新mainの既存画像を棚卸しし、正本に適合するものだけ再利用する。古い固定枚数を前提にしない。
- 未制作画像があっても404を出さないfallbackを実装し、未制作asset一覧を完了報告へ含める。
- 画像生成環境がリポジトリに無い場合、Terraが独断で大量の仮画像を最終assetとして確定しない。
- 縦切りは検証順序であり、**そこで作業を終了しない**。今回の依頼は全完了条件まで進める。

## 完了条件

1. lint/typecheck/unit/integration/build等を実行しPASS。
2. 差分をセルフレビューし、不要変更・デグレ・旧仕様復活がない。
3. ブランド移行前後の保存互換を確認。
4. `origin/main` 最新と安全に統合。
5. ローカルで `/mana-evo/` base・PWA・save移行の検証を終えてから、リポジトリ名を **`mana-evo`** に変更し、remoteを更新。renameを先行させて公開中アプリを壊さない。
6. **`main` へpush**。
7. GitHub Pages `/mana-evo/` のdeploy完了・公開URL正常表示・主要asset/PWA起動を確認。
8. 旧 `/kids-quest/` 導線の扱いも確認して結果報告。
9. 最終コミットSHA、公開URL、テスト結果、移行内容を報告。
10. 実装再レビュー用ZIPを作成。

「実装予定」「計画しました」で終了せず、上記完了条件まで進めてください。
