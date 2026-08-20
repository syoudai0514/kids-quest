# マナエボ ブランド移行仕様

## 1. ブランド正本

| 用途 | 固定値 |
|---|---|
| 正式名称 | **マナエボ** |
| 英字表記 | **ManaEvo** |
| GitHub repository | **`mana-evo`** |
| キャッチコピー | **まなびが、進化になる。** |
| 世界観の核 | **まなぶと「マナ」が生まれる。マナの力で冒険し、仲間を育て、進化させよう。** |
| 新規camelCase | `manaEvo` |
| 新規定数prefix | `MANA_EVO` |

`MANABI × EVOLUTION` をブランドの意味の核とする。モンスターだけではなく、学習・冒険・育成・将来の機能拡張すべてを「学ぶことで**自分も、仲間も、ゲーム世界も**進化する」で包む。

## 2. 表示ルール

- 日本語UIのプロダクト名は **マナエボ**。
- 英字ロゴ/metadataで必要な場合は **ManaEvo**。`Mana Evo` / `MANAEVO` / `Mana-Evo` を勝手に増やさない。
- キャッチコピーの句読点は **「まなびが、進化になる。」** を正本とする。
- `Kids Quest` は移行元を説明する技術文書・migration test以外のユーザー画面から除去する。
- 「マナ」は学習によって生まれる**物語上の力**として扱う。今回の実装では `mana` 残高・新通貨・新しい保存カウンタを追加しない。既存のXP・チケット・探索pt等を「マナ」にrenameしない。将来数値化する場合は別仕様・別レビューとする。

## 3. 世界観の導入文

ホーム/初回導入では長文説明ではなく、次の2文を正本にする。

> まなぶと「マナ」が生まれる。  
> マナの力で冒険し、仲間を育て、進化させよう。

キャッチコピーはタイトル/スプラッシュ/README冒頭などブランド接点で使用し、毎画面繰り返さない。

## 4. GitHub rename

移行元: `syoudai0514/kids-quest`  
移行先: `syoudai0514/mana-evo`

- 履歴・Issues・PR・stars等を維持できるGitHub repository renameを優先し、新規repoへのコピーで履歴を切らない。
- rename後にlocal remote、README link、workflow、badge、Pages設定を確認。
- force push禁止。
- renameはコード/PWAのbase path対応とテストが済んだ段階で実施する。

## 5. PWA / Web表示の変更対象

Terraは実ファイルを検索し、存在するものだけ漏れなく更新する。

- `<title>` / document title
- manifest `name`, `short_name`
- manifest `start_url`, `scope`, `id`
- `apple-mobile-web-app-title`, application-name等のmeta
- description / OG / Twitter metadata
- favicon / icon / splashの参照
- PWA install UI
- onboarding / home / settings / about / error / offline page
- README、スクリーンショット説明
- export/import/backupの表示名・ファイル名
- package metadata

**manifest `id` は機械的に変更しない。** 現状とブラウザ/PWA互換への影響を調査し、既存インストールを不必要に別アプリ扱いさせないことを優先する。

## 6. GitHub Pages / base path

正規URLは `https://syoudai0514.github.io/mana-evo/` を想定する。

- Vite/webpack等の `base`
- absolute/relative asset URL
- router basename
- manifest start_url/scope
- service worker registration URL/scope
- offline fallback
- dynamic import
- icon/font/audio/image path

を実装構成に応じて確認する。

`/kids-quest/` と `/mana-evo/` は同じ origin だが path が違う。localStorage/IndexedDBとService Worker scopeを混同しない。

## 7. 保存データ互換

最重要。ブランド変更を理由に既存データを消さない。

### 原則
1. 現行コードから実際のstorage key/schema/versionを抽出する。
2. 既存キーをそのまま継続可能なら、名前だけの理由で変更しないのも可。
3. 新namespaceへ移す場合は `mana-evo:*` を基本とし、旧キーread-only → 新キーwriteの一方向移行。
4. migrationは冪等。何回起動しても二重報酬・二重モンスター・二重チケットを作らない。
5. 成功確認前に旧データを削除しない。
6. migration失敗時は旧データから再試行可能にする。

### キャラ改名
今回の改名はdisplay nameの変更。

- `monsterId`, `dexId`, familyId等の安定IDがあるなら**維持**。
- 名前をkeyにしている旧saveが存在する場合は `scripts/monster-name-aliases.json` の `oldName -> newName` alias tableで移行。
- 画像ファイル名がID基準なら変更しない。名前基準ならalias/manifestで安全に置換。
- 捕獲済み、編成中、図鑑、XP、進化状態が改名でリセットされないテストを追加。

## 8. Service Worker / Cache

- `/kids-quest/` scopeの旧SWと `/mana-evo/` scopeの新SWは別物として扱う。
- 新SWが正しくactivateしてから新cacheへ切替える。
- 旧cache削除はアプリ所有cache名に限定。origin上の無関係cacheを消さない。
- localStorage/IndexedDBをcache cleanupに巻き込まない。
- オフライン起動、更新直後、旧タブが残るケースを確認。

## 9. 旧URL互換

GitHub repository rename後、`/kids-quest/` が自動で安全に新URLへ到達できるか実測する。

到達できない場合は、旧PWA/ブックマークを404にしないことを優先する。GitHub Pagesの構成上必要なら、rename後に旧名 `kids-quest` を**移行専用の最小redirect repo**として再作成する案を検討し、既存repo履歴を複製しない。redirect先は同一originの `/mana-evo/` のみに限定し、query/hashを必要に応じて保持する。追加repoを作れない場合は、少なくとも旧URLが切れる事実・再インストール手順・saveが同一originに残ることを完了報告へ明記し、互換確認済みと偽らない。

## 10. rename検索ゲート

実装完了時、リポジトリ全体を検索し、ユーザー表示領域の次を確認する。

- `Kids Quest` / `kids quest` / `kids-quest` が意図せず表示に残っていない
- `Mana Evo` 等の表記揺れがない
- repo URLが古くない
- manifest/title/READMEが一致

旧名が残ってよいのは、migration alias、legacy test、履歴説明など**互換のために必要なコード/技術文書だけ**。

## 11. 受入条件

- [ ] UI正式名称がマナエボ
- [ ] 英字表記がManaEvo
- [ ] キャッチコピーが完全一致
- [ ] 世界観導入2文が反映
- [ ] repoがmana-evo
- [ ] Pagesが/mana-evo/で正常
- [ ] PWA install/offline/update正常
- [ ] 旧saveを保持
- [ ] 改名キャラも同一個体として保持
- [ ] 旧URLからの導線を確認
- [ ] ユーザー画面に旧ブランド残存なし
