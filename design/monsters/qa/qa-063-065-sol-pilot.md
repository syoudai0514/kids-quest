# 図鑑63〜65 Sol基準パイロット

Issue #9の量産移管用パイロット。対象はg054〜g056通常3体とg056ギガスター。生成・採否はCodex Sol、後続量産はCodex Terra、全12画像完成後の一括最終採否はCodex Solが担当する。

## 採否

| 対象 | 判定 | 根拠 |
|---|---|---|
| g054 メリン | Sol pilot-approved | 6本の不揃いな脚、二股触角、3枚の三日月殻、紫青の極光線、5方向の胸核を確認 |
| g055 リリン | Sol pilot-approved | 低い柔体へ体型変更。浮遊する三日月殻、二股感覚器、紫青極光を継承 |
| g056 ヨリン | Sol pilot-approved | 黒曜石殻翼と溶岩・極光を統合し、横幅と胸核で惑星ボスとして識別可能 |
| g056 ギガ | Sol pilot-approved | 顔・触角・胸核・素材を保持し、左右各3層の三日月アーチと円環腹で輪郭変更 |

## 機械確認

- source: RGBA PNG、1254×1254
- full/form: 512×512 WebP、上限160KB以下
- thumb: 192×192 WebP、上限30KB以下
- alpha閾値8の四辺余白: 最小12.0%
- 白背景・暗背景: 背景残り、白halo、切れなし
- g056ギガの生成結果に焼き込まれた市松背景は、既存converterの画像端連結領域抽出で除去後に確認

## Terra量産の固定基準

- 正本: `design/monsters/prompts/monster-v2-batch-063-071.md`
- 残り: g057〜g062、g059ギガ、g062覚醒の8画像
- 1回の生成単位: 3段階系列をまとめて設計し、画像生成呼び出しは1 assetずつ行う
- 自動採用しない。変換・一覧化・機械QA後、Solが12画像を一括採否する
- 同一IDが2回不採用なら生成を止め、Issue #9へ理由と画像上の問題を記録してSolへ戻す
- g057は二足、g059は非対称盾、g060は浮遊霊、g061は飛行獣、g062は6脚の闇虫という主要輪郭を崩さない
- source/full/thumb/formのID別SHA fixture、実decode、source→derivative、contact sheet再生成、negative testを63〜71バッチへ拡張する

`pilot-approved`はSolが量産見本として採用したことを表し、63〜71バッチの最終`asset-approved`やUI配線完了を意味しない。
