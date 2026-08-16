# モンスターマスターv2

Issue #7 / WP1 #8 の正本。現行の `src/data/monsters.js` を壊さず、後続WPが進化・個体育成・技・ボス・画像を同じIDで参照するためのデータ層を追加する。

## 正本と責務

| データ | 正本 | 用途 |
|---|---|---|
| 既存identity | `src/data/monsters.js` | ID、図鑑番号、名前、属性、説明を維持 |
| identity固定fixture | `scripts/fixtures/monster-identities.v1.json` | 1000件の意図しない変更をCIで停止 |
| 分布固定fixture | `scripts/fixtures/monster-master-distribution.v2.json` | role、rarity、type、対象数の意図しない変化を差分表示 |
| family割当 | `src/data/monsterMaster/familyPlan.js` | stage、進化元/先、系列数 |
| 対象割当 | `src/data/monsterMaster/targets.js` | 覚醒、ギガ、ボス、固有技保有 |
| 技 | `src/data/monsterMaster/moves.js` | 共通48、固有120、ボス36 |
| runtime master | `src/data/monsterMaster/monsterMaster.js` | 図鑑、育成、バトル用の1000件 |
| 画像制作台帳 | `design/monsters/manifest-051-100.js` | Codex画像パイロット。アプリbundleへ入れない |
| schema | `src/data/monsterMaster/schema.js` | version、列挙値、JSDoc型 |
| validator | `scripts/verify-monster-master.mjs` | 件数、参照、循環、identity、台帳を検証 |

`MONSTER_MASTER_V2`は既存identityを入力として決定論的に構築する。進化関係は`familyPlan.js`が明示し、IDの隣接だけからruntimeで推測しない。

## 図鑑割当

- 図鑑1〜50: 既存identity/imageを維持するlegacy standalone
- 図鑑51〜1000:
  - 3段階 200系列 = 600枠
  - 2段階 125系列 = 250枠
  - standalone 100枠
- 合計: 1000体、475 family/standalone
- 覚醒60、ギガ24、ボス36、固有技保有120
- 一時形態は図鑑番号を消費しない

図鑑51〜100は画像パイロット内で系列を完結させる。101〜1000は90件×10 regionごとに19個の3段階、12個の2段階、9個のstandaloneを割り当てる。stride 37の固定順で並べ、単なる連番推測を防ぐ。

## runtime schemaの要点

- `id`、`dexNo`、`name`、`description`、`element`はidentity fixtureと完全一致
- `familyId`、`stage`、`maxStage`、`evolvesFrom`、`evolvesTo`で進化を明示
- `evolution`は現在段階から次へ進む条件。最終段階は`null`
- `baseStats`の合計は`statBudget`と一致
- `learnset`は4〜5件で開始2技、Lv5、Lv8、固有技はLv12
- `forms.awakening`と`forms.giga`は別object。共通flagへ統合しない
- `bossTier`と`bossMoveId`は敵用の階層/技。捕獲後の能力へ倍率を保存しない
- `assets`は1〜50が既存asset、51以降が`thumb`/`full`の将来path

compact indexは図鑑cardに必要な項目だけを持ち、詳細は100件×10 chunkで取得できる。chunkが未取得/不正でも`getMonsterDetailOrFallback`がcompact entryを返す。

## 技schema

MVPは命中率を持たず、既存crit以外は選択結果を説明できるeffectに限定する。

- category: `attack` / `guard` / `heal` / `support`
- target: `self` / `ally` / `enemy`
- effect kind: `damage` / `guard` / `heal` / `buff` / `expose` / `reflect`
- ボス技は`telegraph`を必須とし、player基準値と`enemyTuning`を分離
- 技数: 共通48 + player固有120 + ボス36 = 204

## 進化条件

| 対象 | 条件 |
|---|---|
| 3段階の第1進化 | Lv8、育成3日、2教科 |
| 2段階進化 | Lv12、育成7日、3教科 |
| 3段階の第2進化 | Lv20、育成14日、4教科、elite勝利 |
| スターかくせい | Lv30、育成30日、5教科、指定boss |
| ギガスター | Lv40、育成60日、5教科、指定boss、3ターン |

XP式と付与処理はWP5/WP8で実装する。WP1では条件値と参照だけを固定し、保存形式や既存global XPは変更しない。

## 51〜62の縦切り

- `g042→g043→g044`: `family-core-orbit`、固有技「ダークオービット」
- `g045→g046→g047`: `family-sky-metamorph`、固有技「りゅうせいジェル」
- `g048`: 支援/回復、`g049`: 攻撃、`g050`: 支援
- `g051`: elite候補/防御、「ゆきいわガード」
- `g052`: elite候補/妨害、最初の覚醒、「にじうつし」
- `g053`: 最初の惑星ボス/ギガ、「コズミックウイング」「ビッグバンストーム」

各identityの名前・属性・説明は旧データのまま。画像指示は`design/monsters/manifest-051-100.js`にあり、最低3つの継承特徴、固有特徴、禁止類似、12%安全余白を持つ。

## 検証

```bash
npm run test:monster-master
node scripts/verify-monster-master.mjs --json
npm run check
```

identityを意図的に変更する場合だけ、影響と移行を別Issueで承認した後に次を実行する。

```bash
node scripts/generate-monster-identity-snapshot.mjs
```

通常のmaster編集でsnapshotを再生成してテストを通してはいけない。

validatorは次を確認する。

- 1000件、連続dexNo、ID、identity hash
- family件数、参照対称性、循環なし
- role、rarity、stats、learnset、asset参照
- 覚醒60、ギガ24、ボス36、固有技保有120
- move 204、effect schema、ボス予告
- 100件×10 chunk、missing chunk fallback
- 51〜100デザイン台帳50件と51〜62固有仕様
- 1〜50の既存asset実在
- role、rarity、battle type、boss tier、対象数のbaseline差分
