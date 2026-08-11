// ============================================================
// とっくん（復習）画面 — 「まちがいは たからもの」
//
// v2: 間隔反復に対応。
//   ここに出るのは「きょうが 復習の期限」の問題だけ。
//   正解すると 次に会う日が のびていく（1→3→7→14→30日）ので、
//   だんだん出てこなくなる ＝ 身についた しるし。
//
// 「まちがいから おぼえた数」を大きく見せて、
// 失敗するほど知っていることが増える、を体感させる。
// ============================================================

import React, { useEffect } from 'react'
import { useGame, missedCount, REVIEW_BATCH_MAX } from '../state/GameContext.jsx'
import { DOMAIN_BY_ID, domainName } from '../engine/activities.js'
import { dueEntries, daysUntilNext, boxCounts, dayNumber, MAX_BOX } from '../engine/srs.js'
import { englishDaysUntilNext, englishDueEntries } from '../engine/englishProgress.js'
import { KIND_LABELS } from '../data/content/numbers.js'
import { SEIKATSU_LABELS } from '../data/content/seikatsu.js'
import { ENGLISH_WORDS, ENGLISH_PHRASES } from '../data/content/english.js'
import { AppHeader, Starfield } from '../components/common.jsx'
import { speak } from '../engine/tts.js'
import { sfx } from '../engine/sfx.js'
import { baseItemKey } from '../engine/reviewKey.js'

// 長い問題文は 子どもが見て わかる長さに切る
function short(text, n = 14) {
  const t = String(text).replace(/\s+/g, '')
  return t.length > n ? t.slice(0, n) + '…' : t
}

// itemKey → 子ども向けの表示
function labelOf(domainId, key) {
  const baseKey = baseItemKey(key)
  if (domainId === 'yomu') {
    if (baseKey.startsWith('j:')) return { big: baseKey.slice(2), sub: 'じゅくご' }
    if (baseKey.startsWith('k:')) return { big: baseKey.slice(2), sub: 'かんじ' }
    if (baseKey.startsWith('w:')) return { big: baseKey.slice(2), sub: 'ことば' }
  }
  if (domainId === 'kaku') return { big: baseKey.startsWith('char:') ? baseKey.split(':').slice(2).join(':') : baseKey.replace(/^k:/, ''), sub: 'かく' }
  if (domainId === 'suuji' && baseKey.startsWith('skill:math:')) {
    return { big: '🔢', sub: KIND_LABELS[baseKey.slice('skill:math:'.length)] || 'さんすう' }
  }
  if (domainId === 'suuji' && baseKey.startsWith('n:')) {
    return { big: '🔢', sub: KIND_LABELS[baseKey.slice(2)] || 'さんすう' }
  }
  if (domainId === 'seikatsu' && baseKey.startsWith('s:')) {
    return { big: '📅', sub: SEIKATSU_LABELS[baseKey.slice(2)] || 'せいかつ' }
  }
  if (domainId === 'rika' && baseKey.startsWith('r:')) return { big: '🔬', sub: short(baseKey.slice(2)) }
  if (domainId === 'shakai' && baseKey.startsWith('c:')) return { big: '🗾', sub: short(baseKey.slice(2)) }
  if (domainId === 'doutoku' && baseKey.startsWith('d:')) return { big: '💗', sub: short(baseKey.slice(2)) }
  if (domainId === 'english') {
    if (baseKey.startsWith('enw:')) {
      const word = ENGLISH_WORDS.find((item) => item.id === baseKey.slice(4))
      return word ? { big: word.english, sub: word.japanese } : { big: '🔤', sub: 'えいたんご' }
    }
    if (baseKey.startsWith('enp:')) {
      const phrase = ENGLISH_PHRASES.find((item) => item.id === baseKey.slice(4))
      return phrase ? { big: short(phrase.english), sub: phrase.japanese } : { big: '💬', sub: 'えいかいわ' }
    }
    if (baseKey.startsWith('ena:')) return { big: baseKey.slice(4), sub: 'アルファベット' }
  }
  return { big: '❓', sub: '' }
}

export default function ReviewScreen({ onBack, onStartTask }) {
  const { state } = useGame()
  const count = missedCount(state)
  const items = [...dueEntries(state.srs), ...englishDueEntries(state, dayNumber())]
    .sort((a, b) => (a.entry.due ?? 0) - (b.entry.due ?? 0))
  const nextInDays = Math.min(daysUntilNext(state.srs) ?? Infinity, englishDaysUntilNext(state, dayNumber()) ?? Infinity)
  const normalizedNextInDays = Number.isFinite(nextInDays) ? nextInDays : null
  const boxes = boxCounts(state.srs)
  const learning = boxes.slice(0, MAX_BOX).reduce((a, b) => a + b, 0)

  useEffect(() => {
    if (count === 0) {
      speak(
        normalizedNextInDays
          ? `すごい！ きょう ふくしゅうする もんだいは ないよ。つぎの ふくしゅうは ${normalizedNextInDays}にちごに でてくるね`
          : `すごい！ いまは ぜんぶ おぼえてるよ。きみは まちがいから ${state.conquered}こも おぼえたんだ！`
      )
    } else {
      speak(
        `とっくんの じかん！ きょう ふくしゅうすると いい もんだいが ${count}こ あるよ。わすれる まえに もういちど やろう！`
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = () => {
    sfx.swoosh()
    // 期限の古い順に、多すぎない数だけ（心が折れないように）
    const plan = items.slice(0, REVIEW_BATCH_MAX).map(({ domainId, key }) => ({ domainId, key }))
    onStartTask({
      uid: `review_${Date.now()}`,
      kind: 'review',
      domainId: plan[0].domainId,
      questionCount: plan.length,
      plan
    })
  }

  return (
    <div className="screen screen-in">
      <Starfield />
      <AppHeader onBack={onBack} title="🎯 とっくん" right={<div className="pill">⚡ {state.conquered}</div>} />

      <div className="center-col scroll-col">
        {/* 「失敗から学んだ数」を主役に */}
        <div className="conquer-counter">
          <div className="conquer-counter__num">{state.conquered}</div>
          <div className="conquer-counter__label">まちがいから おぼえた かず</div>
        </div>

        {count === 0 ? (
          <div className="card" style={{ textAlign: 'center', width: 'min(560px,92vw)' }}>
            <div style={{ fontSize: 60 }}>🏆</div>
            <div style={{ fontWeight: 900, fontSize: 'clamp(18px,3.4vw,26px)', margin: '8px 0' }}>
              きょうの ふくしゅうは かんりょう！
            </div>
            <div className="muted" style={{ fontWeight: 700, lineHeight: 1.6 }}>
              {normalizedNextInDays ? (
                <>
                  つぎの ふくしゅうは <b>{normalizedNextInDays}にちご</b>に でてくるよ。
                  <br />
                  わすれた ころに もういちど 出すから、
                  <br />
                  だんだん わすれなく なるんだ！
                </>
              ) : (
                <>
                  まちがえたら ここに あつまるよ。
                  <br />
                  まちがいは あたらしく おぼえられる チャンス！
                </>
              )}
            </div>
            {learning > 0 && (
              <div className="pill" style={{ marginTop: 12 }}>
                おぼえかけ {learning}こ ／ かんぺき {boxes[MAX_BOX]}こ
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="muted" style={{ fontWeight: 800, fontSize: 'clamp(14px,2.6vw,18px)', textAlign: 'center', lineHeight: 1.6 }}>
              きょう ふくしゅうする もんだい <b>{count}こ</b>
              <br />
              <span style={{ fontSize: 13 }}>
                せいかいすると、つぎは もっと あとに でてくるよ（1→3→7→14→30日）
              </span>
            </div>
            <div className="seed-grid">
              {items.slice(0, 12).map(({ domainId, key, entry }) => {
                const l = labelOf(domainId, key)
                const dom = DOMAIN_BY_ID[domainId]
                return (
                  <div key={`${domainId}:${key}`} className="seed-card">
                    <span className="seed-card__big">{l.big}</span>
                    <span className="seed-card__sub">
                      {dom?.emoji} {l.sub}
                    </span>
                    <span className="seed-card__sub" style={{ opacity: 0.75 }}>
                      {'★'.repeat(entry.box || 0) || '・'}
                    </span>
                  </div>
                )
              })}
            </div>
            <button className="btn btn--sun btn--big" onClick={start}>
              ⚡ とっくん スタート！（{Math.min(count, REVIEW_BATCH_MAX)}もん）
            </button>
          </>
        )}
      </div>
    </div>
  )
}
