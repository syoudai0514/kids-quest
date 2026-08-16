// ============================================================
// むずかしいモード（Phase 2 / WP10 低学年拡張）— こくご 先取り発展
//
// 対象は小1〜3。中学受験レベルの発展内容（reading-hard.js、対象小4〜6）
// とは別に、1つ先の学年で新しく習う漢字・熟語の読みだけを先取りする。
//   小1 → 小2で習う漢字・熟語の読み
//   小2 → 小3で習う漢字・熟語の読み
//   小3 → 小4で習う漢字・熟語の読み
//
// 通常モードとの分離（計画書§4.2(d)、reading-hard.js/numbers-hard.jsと
// 同じ設計）:
//   - itemKeyは reading-hard.js と同じ `hard:yomu:...` 名前空間を使う。
//   - unitIdも明示的に `hard:yomu:kanjiPreview` / `hard:yomu:jukugoPreview`
//     を持たせる（reading-hard.jsのHARD_READING_LABELSがそのままカテゴリ
//     コードで拾えるよう合流させる）。readingUnits()など固定リストからしか
//     単元を集めないunitLedger()には一切合流しない。
//   - 対象は「まだ習わない、1つ先の学年の漢字・熟語」だけに限定する
//     （現在の学年の漢字は通常モードで既に練習しているため対象外）。
// ============================================================

import { KANJI_BY_GRADE, JUKUGO_BY_GRADE, kanjiPoolForGrade, jukugoPoolForGrade } from '../../kanjiByGrade.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// 学年ごとに「1つ先の学年」だけを対象にする（現在の学年の漢字/熟語は
// 通常モードの範囲なので、先取りの対象からは除く）。
const PREVIEW_GRADE_BY_GRADE = { 1: 2, 2: 3, 3: 4 }

function distractorsFor(pool, answer, count) {
  const seen = new Set([answer.yomi])
  const distractors = []
  for (const item of shuffle(pool)) {
    if (distractors.length >= count) break
    if (seen.has(item.yomi)) continue
    seen.add(item.yomi)
    distractors.push(item)
  }
  return distractors
}

function kanjiPreviewQuestion(item, params) {
  const previewGrade = PREVIEW_GRADE_BY_GRADE[params.grade] || 2
  const distractors = distractorsFor(kanjiPoolForGrade(previewGrade), item, (params.choiceCount || 4) - 1)
  const options = shuffle([item, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: 'hard:yomu:kanjiPreview',
    itemKey: `hard:yomu:kanjiPreview:${item.k}`,
    visual: { kind: 'kanji', text: item.k },
    speak: 'この かんじは なんて よむかな？',
    instruction: 'なんて よむ？',
    answerId: item.yomi,
    choices: options.map((k) => ({ id: k.yomi, label: k.yomi, speak: k.yomi })),
    answerWord: { text: item.yomi },
    explain: `この かんじは 「${item.yomi}」と よむよ。小${previewGrade}で ならう かんじだよ`
  }
}

function jukugoPreviewQuestion(item, params) {
  const previewGrade = PREVIEW_GRADE_BY_GRADE[params.grade] || 2
  const distractors = distractorsFor(jukugoPoolForGrade(previewGrade), item, (params.choiceCount || 4) - 1)
  const options = shuffle([item, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: 'hard:yomu:jukugoPreview',
    itemKey: `hard:yomu:jukugoPreview:${item.k}`,
    visual: { kind: 'kanji', text: item.k },
    speak: 'この ことばは なんて よむかな？',
    instruction: 'なんて よむ？',
    answerId: item.yomi,
    choices: options.map((j) => ({ id: j.yomi, label: j.yomi, speak: j.yomi })),
    answerWord: { text: item.yomi },
    explain: `これは 「${item.yomi}」と よむよ。小${previewGrade}で ならう ことばだよ`
  }
}

const HARD_FORMS = [
  { prefix: 'hard:yomu:kanjiPreview:', poolFor: (g) => KANJI_BY_GRADE[PREVIEW_GRADE_BY_GRADE[g] || 2] || [], build: kanjiPreviewQuestion, keyOf: (it) => `hard:yomu:kanjiPreview:${it.k}` },
  { prefix: 'hard:yomu:jukugoPreview:', poolFor: (g) => JUKUGO_BY_GRADE[PREVIEW_GRADE_BY_GRADE[g] || 2] || [], build: jukugoPreviewQuestion, keyOf: (it) => `hard:yomu:jukugoPreview:${it.k}` }
]

// 学年をまたいだ指定復習（reviewKey）にも対応できるよう、全学年ぶんの
// プールから該当項目を探す（例: 前日は小2だった子が小3になっても、
// 前日の「小3先取り」項目を引き続き復習できる）。
const ALL_KANJI = [2, 3, 4].flatMap((g) => KANJI_BY_GRADE[g] || [])
const ALL_JUKUGO = [2, 3, 4].flatMap((g) => JUKUGO_BY_GRADE[g] || [])

export function generateHardYomuAdvanceQuestion(params, reviewKey = null) {
  const grade = params.grade || 1
  if (reviewKey) {
    if (reviewKey.startsWith('hard:yomu:kanjiPreview:')) {
      const k = reviewKey.slice('hard:yomu:kanjiPreview:'.length).split('#')[0]
      const item = ALL_KANJI.find((entry) => entry.k === k)
      if (item) return kanjiPreviewQuestion(item, params)
    }
    if (reviewKey.startsWith('hard:yomu:jukugoPreview:')) {
      const k = reviewKey.slice('hard:yomu:jukugoPreview:'.length).split('#')[0]
      const item = ALL_JUKUGO.find((entry) => entry.k === k)
      if (item) return jukugoPreviewQuestion(item, params)
    }
  }
  const form = pick(HARD_FORMS)
  const pool = form.poolFor(grade)
  if (!pool.length) return null
  const everSeen = params.everSeenKnowledge
  const unseen = everSeen ? pool.filter((item) => !everSeen.has(form.keyOf(item))) : []
  const chosen = pick(unseen.length ? unseen : pool)
  return form.build(chosen, params)
}

export const HARD_YOMU_ADVANCE_LABELS = {
  kanjiPreview: '漢字の さきどり', jukugoPreview: '熟語の さきどり'
}
