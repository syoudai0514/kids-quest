import fs from 'node:fs'
import { FAMILIES } from './families.mjs'
import { TYPES, TYPE_BY_ID, effectiveness } from './types.mjs'
import { GIGA_SHINKA, KYODAI_BURST, GIGA_NAME, GIGA_STAT_MULT, BURST_STAT_MULT_HP, BURST_STAT_MULT_ATK, BURST_MOVE } from './forms.mjs'
import { STONE_LABEL, HOLD_LABEL, UNLOCK_AREA, ACQUIRE_RULE } from './items.mjs'
import { RATE, RANK_LABEL, BALL, singleThrowRate, cumulativeRate, displayLabel } from './capture.mjs'
import { encounterInfo } from './wildEncounter.mjs'

const AREAS = {
  1: 'ひかりの のはら', 2: 'ほのおの かざん・すなの たに', 3: 'こおりの うみ・ふかい もり', 4: 'ぎんがの みやこ・そらの はて'
}
const RANKS = RANK_LABEL
const ROLES = { attacker: 'アタッカー', guard: 'ガード', healer: 'ヒーラー', support: 'サポート', speed: 'スピード', balanced: 'バランス' }
// STONES/HOLDS のラベルは items.mjs を唯一の正本にする（mindprismのような未使用データを持たない）
const STONES = STONE_LABEL
const HOLDS = HOLD_LABEL
const GIGA = new Set(GIGA_SHINKA)
const BURST = new Set(KYODAI_BURST)

let dex = 0
const mons = []
const fams = []
for (const f of FAMILIES) {
  const members = f.members.map((m, i) => {
    dex++
    const o = { ...m, dex, type: f.type, area: f.area, stage: i + 1, maxStage: f.members.length,
      starter: !!f.starter, giga: GIGA.has(m.name), burst: BURST.has(m.name), fam: f }
    mons.push(o); return o
  })
  fams.push({ ...f, members })
}

const evoLabel = (evo) => {
  if (!evo) return '—'
  const [k, v] = evo.split(':')
  if (k === 'lv') return `Lv.${v}`
  if (k === 'stone') return `${STONES[v]}`
  if (k === 'hold') return `${HOLDS[v]}を持たせてLv↑`
  return evo
}
const kind = (evo) => (evo ? evo.split(':')[0] : '')
const byLen = {}; for (const f of FAMILIES) byLen[f.members.length] = (byLen[f.members.length] || 0) + 1
const byEvo = {}; for (const m of mons) if (m.evo) byEvo[kind(m.evo)] = (byEvo[kind(m.evo)] || 0) + 1
const evolvable = mons.filter((m) => m.evo).length
const inFamily = mons.filter((m) => m.maxStage > 1).length
const singles = FAMILIES.filter((f) => f.members.length === 1)

const L = []
const w = (s = '') => L.push(s)

w('# ほしぞら図鑑')
w()
w(`新ゲームのモンスター全設計。**${mons.length}種類・${FAMILIES.length}系列・18タイプ**。`)
w()
w('> **Terra実装用の最終正本。** 表示名・進化・出会い方・強化形態は、この文書と `scripts/*.mjs` の一致を前提とする。')
w()
w(`> ${mons.length}種類の内訳: 通常の野生 ${mons.filter(m=>encounterInfo(m.fam,m.stage).pool==='wild').length}体 / 進化専用 ${mons.filter(m=>encounterInfo(m.fam,m.stage).pool==='evolutionOnly').length}体 / ボス・物語イベント限定 ${mons.filter(m=>encounterInfo(m.fam,m.stage).pool==='event').length}体。`)
w()
w('| 項目 | 値 |')
w('|---|---|')
w(`| 総数 | ${mons.length}種類 |`)
w(`| 系列数 | ${FAMILIES.length}（3段${byLen[3] || 0} / 2段${byLen[2] || 0} / 単体${byLen[1] || 0}） |`)
w('| タイプ | 18種類・すべて単タイプ |')
w(`| 進化できる個体 | ${evolvable}体（${(evolvable / mons.length * 100).toFixed(1)}%） |`)
w(`| 系列に属する | ${inFamily}体（${(inFamily / mons.length * 100).toFixed(1)}%） |`)
w(`| 進化ステップ | ${evolvable}回（レベル${byEvo.lv} / いし${byEvo.stone} / もちもの${byEvo.hold}） |`)
w(`| ギガシンカ | ${GIGA_SHINKA.length}体（最終形のみ・でんせつ級は対象外・種族ごとに ギガ専用） |`)
w(`| キョダイバースト | ${KYODAI_BURST.length}体（最終形のみ・でんせつ級は対象外・種族ごとに バースト専用。ギガ対象と重複0） |`)
w(`| 必要な画像 | ${mons.length + GIGA_SHINKA.length + KYODAI_BURST.length}点（本体${mons.length}＋ギガ${GIGA_SHINKA.length}＋バースト${KYODAI_BURST.length}） |`)
w()
w('---')
w()

// ===== 命名ルール =====
w('## なまえの ルール')
w()
w('進化前の愛着を最終形までつなぐため、同じ系列では音・意味・象徴部位のつながりを持たせる。')
w('**同じ子が育っていく**ことが名前で分かるように、3形とも音のかけらを共有させています。')
w()
w('| 段階 | 方針 | 例 |')
w('|---|---|---|')
w('| 第1形 | かわいい。3〜6文字。語尾はやわらかい音（コ・ィ・ロ・ポ） | モコハ / ヒノポ / パチネ |')
w('| 第2形 | 血統が音で分かる。まだ発展途中と分かる | ワカバネ / メラガミ / ビリスケ |')
w('| 最終形 | かっこいい。4〜8文字。重い音で終わる | ジュランガ / グレンドウ / ライガミ |')
w()
w('さらに、**1つの語尾に寄らない**ことを機械チェックしています（最多の語尾でも最終形の12%未満）。')
w('旧案は「○○オー」が最終形に集中していたため、全面的に付け直しました。')
w()
w('各系列には **モチーフ / コンセプト / 性格の変化（arc）** を持たせています。')
w('絵を描くときも、技を決めるときも、この3つを見れば迷わないようにするためです。')
w()
// ===== 現行命名 =====
w('### 現行命名の正本')
w()
w('最終投入前に全84系列を5観点（言いやすさ / 進化の憧れ / 血統感 / 独自性 / グラフィック適性）で再点検し、19系列・23表示名を最終調整した。')
w('過去案との比較履歴は実装判断に不要なので、この図鑑には持ち込みません。最終名と画像制作ルールは `11-MONSTER-NAMING-AND-GRAPHICS-BIBLE.md` を正本とします。')
w()
w('---')
w()

// ===== 相性表 =====
w('## 18タイプ相性表')
w()
w('マナエボの18タイプ相性表。複合タイプなし（全員が単タイプ）なので、倍率は 2 / 1 / ½ / 0 の4つだけ。`scripts/types.mjs` を機械可読正本とする。')
w()
w('- **2** = こうかばつぐん（2倍）')
w('- **½** = いまひとつ（0.5倍）')
w('- **0** = こうかなし')
w('- 空欄 = ふつう（等倍）')
w()
w('内訳: ばつぐん51組・いまひとつ61組・こうかなし8組・等倍204組 = 324通り')
w()
w('| こうげき＼ぼうぎょ | ' + TYPES.map((t) => t.name).join(' | ') + ' |')
w('|---|' + TYPES.map(() => '---').join('|') + '|')
for (const atk of TYPES) {
  const cells = TYPES.map((def) => {
    const e = effectiveness(atk.id, def.id)
    return e === 2 ? '**2**' : e === 0.5 ? '½' : e === 0 ? '**0**' : ''
  })
  w(`| **${atk.name}** | ${cells.join(' | ')} |`)
}
w()
w('### こうかなし（0倍）の8組')
w()
w('| こうげき | ぼうぎょ | 理由（子どもへの説明） |')
w('|---|---|---|')
w('| ノーマル | ゴースト | すりぬけてしまう |')
w('| ゴースト | ノーマル | ふれられない |')
w('| でんき | じめん | じめんに ながれてしまう |')
w('| じめん | ひこう | そらに とどかない |')
w('| かくとう | ゴースト | からだが ない |')
w('| エスパー | あく | こころを よまれない |')
w('| どく | はがね | どくが きかない |')
w('| ドラゴン | フェアリー | まほうに はじかれる |')
w()

w('### タイプ別の体数')
w()
const byType = {}
for (const m of mons) byType[m.type] = (byType[m.type] || 0) + 1
w('| タイプ | 体数 | タイプ | 体数 | タイプ | 体数 |')
w('|---|---|---|---|---|---|')
for (let i = 0; i < TYPES.length; i += 3) {
  const row = TYPES.slice(i, i + 3).map((t) => `${t.name} | ${byType[t.id] || 0}`)
  w(`| ${row.join(' | ')} |`)
}
w()
w(`最少は${TYPES.filter((t) => byType[t.id] === Math.min(...TYPES.map((x) => byType[x.id]))).map((t) => t.name).join('・')}の${Math.min(...TYPES.map((t) => byType[t.id]))}体。`)
w('ドラゴンが少ないのは意図的で、「めったに会えない」ことに意味を持たせています。')
w('**でんきは息子の必須リクエストのため、エリア1に2系列（No.022〜030）を置いて最初から出会えるようにしました。**')
w()
w('---')
w()

// ===== 系列一覧 =====
w(`## ${mons.length}体すべて（系列順）`)
w()
for (const area of [1, 2, 3, 4]) {
  const list = fams.filter((f) => f.area === area)
  const n = list.reduce((a, f) => a + f.members.length, 0)
  const from = list[0].members[0].dex
  const to = list[list.length - 1].members.slice(-1)[0].dex
  w(`### エリア${area}: ${AREAS[area]}（No.${from}〜${to} / ${n}体・${list.length}系列）`)
  w()
  for (const f of list) {
    const t = TYPE_BY_ID[f.type]
    const tags = [
      f.starter ? '**さいしょの なかま**' : '',
      f.members.length === 1 ? '**進化なし**' : `${f.members.length}だんかい`,
      f.members.some((m) => GIGA.has(m.name)) ? '✨ギガシンカ' : '',
      f.members.some((m) => BURST.has(m.name)) ? '🌟キョダイバースト' : ''
    ].filter(Boolean).join(' / ')
    w(`#### ${f.members[0].name} の かぞく　\`${t.name}\``)
    w()
    w(tags)
    w()
    w(`- **モチーフ**: ${f.motif}`)
    w(`- **コンセプト**: ${f.concept}`)
    if (f.legendReason) w(`- **進化しない理由**: ${f.legendReason}`)
    w()
    if (f.arc) {
      w('| 初期 | 未熟なところ | 中間 | 最終 |')
      w('|---|---|---|---|')
      w(`| ${f.arc.初期} | ${f.arc.未熟} | ${f.arc.中間} | ${f.arc.最終} |`)
      w()
    }
    if (f.members.length > 1) {
      const steps = f.members.slice(0, -1).map((m, i) => `${f.members[i].name} --[${evoLabel(m.evo)}]--> ${f.members[i + 1].name}`)
      w('```')
      w(steps.join('\n'))
      w('```')
      w()
    }
    w('| No. | なまえ | だんかい | ランク | ★ほしのわ1投 | やくわり | しんか条件 | とくちょう |')
    w('|---|---|---|---|---|---|---|---|')
    for (const m of f.members) {
      const badge = [m.giga ? '✨ギガ' : '', m.burst ? '🌟バースト' : ''].filter(Boolean).join(' ')
      const info = encounterInfo(f, m.stage)
      const p1 = (singleThrowRate(RATE[m.rank], 'star') * 100).toFixed(0)
      const encTag = info.pool === 'event' ? '（ボス限定・一回きり）' : info.pool === 'evolutionOnly' ? '（進化専用・野生には出ない）' : ''
      w(`| ${String(m.dex).padStart(3, '0')} | **${m.name}**${badge ? ' ' + badge : ''} | ${m.stage}/${m.maxStage} | ${RANKS[m.rank]} | ${p1}% | ${ROLES[m.role]} | ${evoLabel(m.evo)}${encTag} | ${m.desc} |`)
    }
    w()
  }
}
w('---')
w()

// ===== 進化 =====
w('## 進化のしかた')
w()
w('| 方式 | 回数 | 体験 |')
w('|---|---|---|')
w(`| レベル進化 | ${byEvo.lv} | バトル中に突然ひかる。おどろきの担当 |`)
w(`| いしで進化 | ${byEvo.stone} | 自分のタイミングで使う。達成感の担当 |`)
w(`| もちもの＋レベルアップ | ${byEvo.hold} | 持たせてから育てる。発見の担当 |`)
w()
w('> 「もちもの＋レベルアップ」は、対象アイテムを持たせた状態でレベルアップした時だけ成立する。いしを直接使う進化とは別操作として実装する。')
w()
w('### アイテムの入手方法（すべて共通ルール）')
w()
w(`> ${ACQUIRE_RULE}`)
w()
w('「進化して初めてもらえる」という説明は、そのアイテム自体が進化の条件になっている系列と')
w('矛盾する（例: きえないシン が無いと進化できないロウソッコに対して「進化したらもらえる」と書くと、')
w('一生手に入らなくなる）。そのため入手条件を**エリアに入った時点**へ統一した。')
w()
w('### いし（8しゅるい）')
w()
w('| いし | 入手できるエリア | 体数 | つかう こ |')
w('|---|---|---|---|')
for (const [k2, v] of Object.entries(STONES)) {
  const u = mons.filter((m) => m.evo === `stone:${k2}`)
  if (u.length) w(`| **${v}** | エリア${UNLOCK_AREA[`stone:${k2}`]} | ${u.length} | ${u.map((x) => x.name).join('、')} |`)
}
w()
w('### もちもの')
w()
w('| もちもの | 入手できるエリア | 体数 | もたせる こ |')
w('|---|---|---|---|')
for (const [k2, v] of Object.entries(HOLDS)) {
  const u = mons.filter((m) => m.evo === `hold:${k2}`)
  if (u.length) w(`| **${v}** | エリア${UNLOCK_AREA[`hold:${k2}`]} | ${u.length} | ${u.map((x) => x.name).join('、')} |`)
}
w()
w('### 進化しない系列')
w()
w('通常・レアの「行き止まり」は0件にしました。残るのは次の5系列だけで、すべて理由があります。')
w()
w('| No. | なまえ | タイプ | 理由 |')
w('|---|---|---|---|')
for (const f of singles) {
  const m = fams.find((x) => x.members[0].name === f.members[0].name).members[0]
  w(`| ${String(m.dex).padStart(3, '0')} | **${m.name}** | ${TYPE_BY_ID[f.type].name} | ${f.legendReason} |`)
}
w()
w('---')
w()

// ===== ギガ・バースト =====
w('## ギガシンカ と キョダイバースト')
w()
w('どちらも **最終進化形だけ**。図鑑の枠は増えず、1枠の中でタブを切り替えて姿とステータスを見られます。')
w('**でんせつ級（legend）は対象外**です。もともと強いので、ギガ／バーストは')
w('「中堅の最終形にもう一度スポットを当てる」ための仕組みにしました。')
w()
w('> **種族ごとに、ギガシンカとキョダイバーストのどちらか一方だけを持つ。** 同じ種族が両方を持つことはない')
w('> （下のギガシンカ表とキョダイバースト表に、同じ名前は1つも出てこない＝機械検証済み）。')
w('> パーティ内にギガ対象・バースト対象の両方がいることはあるが、**1バトルで使える特殊変身は合計1回だけ**。')
w('> プレイヤーが選ぶのは「この子をギガにするかバーストにするか」ではなく、')
w('> **「今回の切り札を、どのモンスターに使うか」**。')
w()
w(`### ✨ ギガシンカ ${GIGA_SHINKA.length}体`)
w()
w(`**ギガキー**（1個・永久）＋ その子専用の **ギガコア**（永久）。1バトルに1回、終わるともとに戻ります。`)
w(`**どちらも消えません。** 何度でも使えます。性能は **全ステータス ×${GIGA_STAT_MULT}** の1つに統一（他の表現は使わない）。`)
w()
w('| No. | ふつうの すがた | ギガの すがた | タイプ |')
w('|---|---|---|---|')
for (const m of mons.filter((x) => x.giga)) w(`| ${String(m.dex).padStart(3, '0')} | **${m.name}** | ${GIGA_NAME[m.name] || '—'} | ${TYPE_BY_ID[m.type].name} |`)
w()
w('12体＝12タイプ。1タイプにつき1体だけなので、「どのタイプで行くか」がそのまま')
w('「どの子をギガシンカさせるか」になります。')
w()
w(`### 🌟 キョダイバースト ${KYODAI_BURST.length}体`)
w()
w('**バーストのしるし**（永久）。3ターンだけ巨大化し、専用の「バーストわざ」を使えます。')
w(`性能は **たいりょく ×${BURST_STAT_MULT_HP} ／ こうげき ×${BURST_STAT_MULT_ATK}**、` +
  `バーストわざは **いりょく${BURST_MOVE.power}・命中${Math.round(BURST_MOVE.accuracy * 100)}%**（次ターン行動不能などの反動は無し）。`)
w('ギガシンカとは別の子が対象なので、両方をパーティに入れられます。')
w('ただし **1つのバトルで つかえる とくべつな ちからは 1つだけ**。どちらを切るかを選びます。')
w()
w('| No. | なまえ | タイプ | バーストわざ |')
w('|---|---|---|---|')
const BURST_MOVE_FLAVOR = {
  'センジュガ': 'バースト・ジュカイ（森が広がり、味方全員が毎ターン回復）',
  'カイテイリオ': 'バースト・オオナミ（大波で相手のすばやさを下げる）',
  'カブトレクス': 'バースト・ゴウワン（自分のこうげきを上げてから殴る）',
  'テラガイア': 'バースト・ダイチワリ（地面が割れ、相手のぼうぎょを下げる）',
  'テンショウガ': 'バースト・テンクウ（空に舞い上がり、次のターンまで攻撃を受けない）',
  'フドウザン': 'バースト・オオヅモウ（相手を押し出して強制的に交代させる）',
  'ゲンコツヅラ': 'バースト・ガンペキ（味方全体の前に岩の壁を立てる）',
  'アカリガルド': 'バースト・オオヒカリ（暗闇を照らし、相手の命中を戻す・やけど）'
}
for (const m of mons.filter((x) => x.burst)) w(`| ${String(m.dex).padStart(3, '0')} | **${m.name}** | ${TYPE_BY_ID[m.type].name} | ${BURST_MOVE_FLAVOR[m.name] || '—'} |`)
w()
w('---')
w()
w(`## 全${mons.length}体 索引（No.順）`)
w()
w('| No. | なまえ | タイプ | だんかい | ランク | エリア | ギガ／バースト |')
w('|---|---|---|---|---|---|---|')
for (const m of mons) {
  w(`| ${String(m.dex).padStart(3, '0')} | ${m.name} | ${TYPE_BY_ID[m.type].name} | ${m.stage}/${m.maxStage} | ${RANKS[m.rank]} | ${m.area} | ${m.giga ? '✨' : m.burst ? '🌟' : ''} |`)
}
w()
w('---')
w()
w('## 検証')
w()
w('図鑑データの整合は `node scripts/check2.mjs` で検証する。テスト出力をこの設計書へ埋め込まず、CI/実行結果を正とする。')
w()
w('*`area` は制作・データ分類、`adventureRegion` はゲーム内地域です。地域2〜4は直前地域ボスの初回撃破で順次解放し、未解放地域の野生・探索・アイテムテーブルにはアクセスできません。過去の解放済み地域にはいつでも戻れます。*')
w(`*制作上はエリア1（${fams.filter((f) => f.area === 1).reduce((a, f) => a + f.members.length, 0)}体）から画像制作を始められますが、これはゲーム内の地域解放条件とは別概念です。*`)
w()

fs.writeFileSync(new URL('../02-dex.md', import.meta.url), L.join('\n'))
console.log('02-dex.md:', L.join('\n').length, 'bytes /', L.length, 'lines')
