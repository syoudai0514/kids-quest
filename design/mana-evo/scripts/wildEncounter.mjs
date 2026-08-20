// 野生の出現設計。
//
// rank（common/rare/epic/legend）は「捕獲のしにくさ」だけを表す軸として使い、
//   「野生に出るか」「何回出会えるか」「進化専用か」「ボス限定・一回限定か」は
//   rank を再利用せず、系列の形（何段階目か・最終形かどうか・単体かどうか）から
//   機械的に導出する。手で個体ごとにタグを振り直す必要はない。
// 出現テーブル・未捕獲補正・連続出現抑制・エンカウント固定ルールを定義する。

import { FAMILIES } from './families.mjs'

// ── 軸を分離した「出会い方」の分類 ──────────────────────
// pool:   'wild'（野生に出る） / 'evolutionOnly'（進化でのみ入手） / 'event'（ボス・物語イベント限定）
// repeat: 'unlimited'（同じ種を何匹でも） / 'once'（そのイベントでの1体きり）
export function encounterInfo(family, stageIndex) {
  const maxStage = family.members.length
  if (maxStage === 1) {
    // 単体系列＝すべて legendReason 付きの神格級・特殊イベント個体（families.mjs で保証済み）
    return { pool: 'event', repeat: 'once', bossGated: true }
  }
  if (stageIndex === maxStage) {
    return { pool: 'evolutionOnly', repeat: 'unlimited', bossGated: false }
  }
  return { pool: 'wild', repeat: 'unlimited', bossGated: false }
}

// ── 野生出現テーブルの重み（rank別・legendは野生に出ない）──
// families.mjs のデータ上、非最終形（＝野生プールに入りうる個体）には
// legend rank が1件も存在しない（check2.mjs で検証）。これは仕様として明文化する。
export const WILD_WEIGHT = { common: 60, rare: 30, epic: 9 }

// ── 未捕獲補正・連続抑制 ───────────────────────────
export const ENCOUNTER_TUNING = {
  uncaughtBonusMult: 1.5,  // 図鑑未登録の種は出現重みを1.5倍
  caughtPenaltyMult: 0.6,  // 3匹以上すでに捕まえた種は出現重みを0.6倍（0にはしない＝厳選目的の再訪も許す）
  noImmediateRepeat: true, // 直前に出会ったのと同じ種は、次の1回だけ出現プールから除外する
}

// ── エンカウント固定ルール ─────────────────────────
// 「負けてもチケット消費なし」×「敗北で敵が再抽選される」の組み合わせは、
// 「レアが出るまでわざと負ける／わざと逃げる」を許してしまう抜け道になる。
// そこで、遭遇した個体は次のいずれかまで固定する。
export const ENCOUNTER_LOCK = {
  onEnemyDefeated: 'capturePhaseThenResolve', // 敵HP0→同じencounterIdの捕獲フェーズへ。捕獲成功または3投失敗でRESOLVED後、次回だけ再抽選
  onCaptureFail3: 'reroll',          // 3投とも失敗して「にげられた」→ 次は新しい抽選
  onPlayerLosesHp0: 'sameEncounterContinues', // 全滅してHP全快しても、目の前の相手は変わらない（再抽選なし）
  onPlayerFlees: 'sameEncounterContinues', // 自分から逃げても遭遇IDを保持。無料再抽選は不可
  onAppCloseOrScreenLeave: 'sameEncounterContinues', // 誤操作・画面遷移でも遭遇を保存
  // 新しい抽選に進めるのは、勝利後の捕獲フェーズ完了（成功または3投失敗）など、遭遇を正当に解決した時だけ。
  // 結果: 敗北・逃走・画面離脱のどれでもレア敵無料厳選はできない。
}

if ((process.argv[1] || '').endsWith('wildEncounter.mjs')) {
  const nonFinalLegend = []
  FAMILIES.forEach((f) => f.members.forEach((m, i) => {
    const info = encounterInfo(f, i + 1)
    if (info.pool === 'wild' && m.rank === 'legend') nonFinalLegend.push(m.name)
  }))
  console.log('野生プールに legend rank が混ざっていないか:', nonFinalLegend.length === 0 ? 'OK（0件）' : nonFinalLegend.join(','))
  const counts = { wild: 0, evolutionOnly: 0, event: 0 }
  FAMILIES.forEach((f) => f.members.forEach((m, i) => { counts[encounterInfo(f, i + 1).pool]++ }))
  console.log('出会い方の内訳:', JSON.stringify(counts))
}
