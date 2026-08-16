// ============================================================
// 保護者向けビュー（おまけ）
//  - 今日やった量、得意/苦手の傾向、息抜き解放（チケット）の回数。
//  - 音声・効果音の ON/OFF、データのリセット。
//  - すべて端末内にのみ保存（プライバシー説明つき）。
// ============================================================

import React, { useEffect, useState } from 'react'
import { useGame, skillOf, missedCount } from '../state/GameContext.jsx'
import { DOMAINS, domainName } from '../engine/activities.js'
import { trendLabel } from '../engine/difficulty.js'
import { TTS_RATE_PRESETS } from '../config/ttsRates.js'
import {
  getNarratorStatus,
  prepareNarratorVoice,
  setTtsEnabled,
  setTtsPreferences,
  speak,
  subscribeNarratorStatus
} from '../engine/tts.js'
import { setSfxEnabled } from '../engine/sfx.js'
import { setBgmEnabled } from '../engine/bgm.js'
import { serializeForExport, parseImport } from '../engine/storage.js'
import { GRADES, MAX_GRADE, gradeOf } from '../data/grades.js'
import { boxCounts, daysUntilNext, MAX_BOX } from '../engine/srs.js'
import { getWeapon } from '../data/weapons.js'
import { AppHeader } from '../components/common.jsx'
import { trialUnlocked, unitLabel } from '../engine/learningUnits.js'
import { activeReviewSrs } from '../engine/reviewMode.js'

function downloadText(filename, text) {
  try {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
    return true
  } catch (_) {
    return false
  }
}

// 機種変更のための「データひきつぎ」（バックアップ書き出し／読み込み）
function DataMigration({ state, dispatch, onBack }) {
  const [mode, setMode] = useState(null) // null | 'export' | 'import'
  const [importText, setImportText] = useState('')
  const [confirmImport, setConfirmImport] = useState(false)
  const [msg, setMsg] = useState(null) // {ok, text}

  const exportText = serializeForExport(state)
  const stamp = new Date().toISOString().slice(0, 10)

  const doDownload = () => {
    const ok = downloadText(`hoshizora-quest-${stamp}.json`, exportText)
    setMsg(ok ? { ok: true, text: 'ファイルを ほぞんしました（ダウンロード）' } : { ok: false, text: 'ダウンロードできませんでした。下のコードを コピーして ほかんしてください' })
  }
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setMsg({ ok: true, text: 'コードを コピーしました。メモやメールに はりつけて ほかんしてください' })
    } catch (_) {
      setMsg({ ok: false, text: 'コピーできませんでした。下のコードを 手で えらんで コピーしてください' })
    }
  }
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    try {
      const text = await f.text()
      setImportText(text)
      setMsg({ ok: true, text: 'ファイルを よみこみました。「このデータで ひきつぐ」を おしてください' })
    } catch (_) {
      setMsg({ ok: false, text: 'ファイルを ひらけませんでした' })
    }
    e.target.value = ''
  }
  const doImport = () => {
    let data
    try {
      data = parseImport(importText.trim())
    } catch (_) {
      setMsg({ ok: false, text: 'ひきつぎデータの 形式が ちがうようです。もういちど かくにんしてください' })
      setConfirmImport(false)
      return
    }
    dispatch({ type: 'IMPORT_STATE', data })
    setMsg({ ok: true, text: '✅ ひきつぎ かんりょう！ データを もどしました' })
    setConfirmImport(false)
    setTimeout(onBack, 1200)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 900 }}>📦 データひきつぎ（機種変更）</div>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
        データは この端末のなかだけに 保存されます。機種変更のときは、
        <b>古い端末で「書き出す」→ 新しい端末で「読み込む」</b>と 進捗を そのまま 引っ越せます。
      </p>

      <div className="row wrap" style={{ gap: 8 }}>
        <button
          className={'btn ' + (mode === 'export' ? 'btn--primary' : 'btn--ghost')}
          style={{ minHeight: 52 }}
          onClick={() => { setMode(mode === 'export' ? null : 'export'); setMsg(null) }}
        >
          ⬆️ データを 書き出す
        </button>
        <button
          className={'btn ' + (mode === 'import' ? 'btn--primary' : 'btn--ghost')}
          style={{ minHeight: 52 }}
          onClick={() => { setMode(mode === 'import' ? null : 'import'); setMsg(null); setConfirmImport(false) }}
        >
          ⬇️ データを 読み込む
        </button>
      </div>

      {mode === 'export' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn btn--primary" style={{ minHeight: 52 }} onClick={doDownload}>
              💾 ファイルに ほぞん
            </button>
            <button className="btn btn--ghost" style={{ minHeight: 52 }} onClick={doCopy}>
              📋 コードを コピー
            </button>
          </div>
          <textarea
            readOnly
            value={exportText}
            onFocus={(e) => e.target.select()}
            spellCheck={false}
            style={{
              width: '100%', minHeight: 96, fontSize: 11, fontFamily: 'monospace',
              borderRadius: 12, padding: 10, boxSizing: 'border-box', resize: 'vertical'
            }}
          />
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            ※ ファイルか、この文字（コード）を メモ・メール・クラウド等に 保存してください。
          </p>
        </div>
      )}

      {mode === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="btn btn--ghost" style={{ minHeight: 52, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            📂 ファイルを えらぶ
            <input type="file" accept=".json,application/json" onChange={onFile} style={{ display: 'none' }} />
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="…または、書き出した コードを ここに はりつけてください"
            spellCheck={false}
            style={{
              width: '100%', minHeight: 96, fontSize: 11, fontFamily: 'monospace',
              borderRadius: 12, padding: 10, boxSizing: 'border-box', resize: 'vertical'
            }}
          />
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            ⚠️ 読み込むと、いまの端末のデータは <b>上書き</b>されます。
          </p>
          {!confirmImport ? (
            <button
              className="btn btn--primary"
              style={{ minHeight: 52 }}
              disabled={!importText.trim()}
              onClick={() => { setMsg(null); setConfirmImport(true) }}
            >
              このデータで ひきつぐ
            </button>
          ) : (
            <div className="row wrap" style={{ gap: 8 }}>
              <button className="btn btn--pink" style={{ minHeight: 52 }} onClick={doImport}>
                上書きして ひきつぐ
              </button>
              <button className="btn btn--ghost" style={{ minHeight: 52 }} onClick={() => setConfirmImport(false)}>
                やめる
              </button>
            </div>
          )}
        </div>
      )}

      {msg && (
        <div
          className="pill"
          style={{
            background: msg.ok ? 'var(--good)' : 'var(--bad-soft)',
            color: '#10231c', border: 'none', alignSelf: 'flex-start',
            whiteSpace: 'normal', lineHeight: 1.5, padding: '8px 12px'
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="card" style={{ flex: '1 1 140px', textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(26px,5vw,40px)', fontWeight: 900 }}>{value}</div>
      <div className="muted" style={{ fontWeight: 700 }}>{label}</div>
      {sub && <div className="muted" style={{ fontSize: 12 }}>{sub}</div>}
    </div>
  )
}

function trendColor(label) {
  if (label === 'とくい！') return 'var(--good)'
  if (label === 'おうえん中') return 'var(--bad-soft)'
  return 'var(--accent)'
}

export default function ParentScreen({ onBack }) {
  const { state, dispatch } = useGame()
  const reviewSrs = activeReviewSrs(state)
  const [narratorStatus, setNarratorStatus] = useState(getNarratorStatus)
  const d = state.daily
  const accuracy = d.attemptsToday ? Math.round((d.correctToday / d.attemptsToday) * 100) : 0
  const [confirmReset, setConfirmReset] = useState(false)
  const [weaponToRemove, setWeaponToRemove] = useState(null)
  const [newProfileName, setNewProfileName] = useState('')
  const remainingUnits = trialUnlocked(state, state.grade).missing

  // 直近7日間の取り組み日数
  const activeDays = Object.keys(state.history).length + (d.attemptsToday > 0 ? 1 : 0)
  const currentDomains = DOMAINS.filter((dom) => dom.available && dom.grades.includes(state.grade))
  // 「にがて」のラベルだけでは次に何をすればよいか分かりにくいので、
  // 直近の正答率と回答数を使って、家で声かけしやすい1教科を出す。
  const priorityDomain = [...currentDomains]
    .map((dom) => {
      const acc = state.domainAccuracy?.[`${state.grade}:${dom.id}`] || { c: 0, n: 0 }
      return { dom, acc, rate: acc.n ? acc.c / acc.n : null }
    })
    .filter((x) => x.acc.n >= 3)
    .sort((a, b) => (a.rate - b.rate) || (b.acc.n - a.acc.n))[0]

  const toggle = (key) => {
    const next = !state.settings[key]
    dispatch({ type: 'SET_SETTING', key, value: next })
    if (key === 'tts') setTtsEnabled(next)
    if (key === 'sfx') setSfxEnabled(next)
    if (key === 'bgm') setBgmEnabled(next)
  }

  const setTtsOption = (key, value) => {
    dispatch({ type: 'SET_SETTING', key, value })
    setTtsPreferences({
      rate: key === 'ttsRate' ? value : state.settings.ttsRate,
      volume: key === 'ttsVolume' ? value : state.settings.ttsVolume,
      voiceStyle: key === 'ttsVoice' ? value : state.settings.ttsVoice
    })
  }

  useEffect(() => subscribeNarratorStatus(setNarratorStatus), [])

  const testSelectedVoice = async () => {
    const voiceStyle = state.settings.ttsVoice === 'device' ? 'device' : 'neural'
    try {
      if (voiceStyle === 'neural') await prepareNarratorVoice({ allowDownload: false })
      await speak(
        voiceStyle === 'neural'
          ? 'こんにちは。つくよみちゃんです。いっしょに、たのしく、まなぼうね。'
          : 'こんにちは。アイフォンの読み上げ音声です。いっしょに、たのしく、まなぼうね。',
        { voiceStyle }
      )
    } catch (_) {
      // エラー内容は narratorStatus として画面に出す。
    }
  }

  const downloadNarratorVoice = async () => {
    try {
      await prepareNarratorVoice({ allowDownload: true })
    } catch (_) {
      // 詳細は narratorStatus として同じカードに表示する。
    }
  }

  return (
    <div className="screen fade-in parent-screen">
      <AppHeader onBack={onBack} title="👨‍👩‍👧 おうちのひとへ" right={<span />} />

      <div className="scroll-y" style={{ flex: 1, padding: '4px 8px 28px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 兄弟姉妹は別の完全なセーブを持つ。切替時に学年・図鑑・連続記録が混ざらない。 */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>👧🧒 子どもプロフィール</h3>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                学年、モンスター、コイン、連続記録、教科ごとの履歴は子どもごとに別に保存されます。
              </p>
              <div className="row wrap" style={{ gap: 8 }}>
                {Object.entries(state.profiles || {}).map(([id, profile]) => (
                  <button key={id} className={'btn ' + (id === state.activeProfileId ? 'btn--primary' : 'btn--ghost')} style={{ minHeight: 48, padding: '8px 14px' }} onClick={() => dispatch({ type: 'SWITCH_PROFILE', profileId: id })}>
                    {id === state.activeProfileId ? '✓ ' : ''}{profile.name}
                  </button>
                ))}
              </div>
              <div className="row wrap" style={{ gap: 8 }}>
                <input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} placeholder="新しい子どもの なまえ" aria-label="新しい子どものなまえ" style={{ minHeight: 46, flex: '1 1 180px', borderRadius: 12, padding: '0 12px', fontSize: 16 }} />
                <button className="btn btn--sun" style={{ minHeight: 48, padding: '8px 14px' }} onClick={() => { dispatch({ type: 'CREATE_PROFILE', name: newProfileName }); setNewProfileName('') }}>
                  ＋ ついか
                </button>
              </div>
            </div>
          </div>
          {/* 今日のサマリー */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>きょうの がんばり</h3>
            <div className="row wrap">
              <Stat label="クリアした タスク" value={d.tasksClearedToday} />
              <Stat label="といた もんだい" value={d.attemptsToday} />
              <Stat label="せいかい率" value={`${accuracy}%`} />
              <Stat
                label="息抜き解放"
                value={d.ticketsEarnedToday}
                sub="追加問題で獲得したチケット数"
              />
              <Stat label="連続日数" value={`${state.streak}日`} sub="毎日つづけると🔥" />
              <Stat
                label="まちがいから覚えた数"
                value={state.conquered}
                sub="復習(とっくん)で克服した累計"
              />
            </div>
          </div>

          {/* 分野ごとの傾向 */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>🌱 しれんまでに のこる単元</h3>
            <div className="card">
              {remainingUnits.length ? <div className="muted" style={{ lineHeight: 1.7 }}>{remainingUnits.length}こ：{remainingUnits.map(unitLabel).join('、')}</div> : <div style={{ fontWeight: 900 }}>全部の必須単元を、別の日にも確認できました。</div>}
            </div>
          </div>

          {/* 分野ごとの傾向 */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>とくい・にがての けいこう</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOMAINS.map((dom) => {
                const sk = skillOf(state, dom.id)
                const today = d.perDomainToday[dom.id]
                const label = dom.available ? trendLabel(sk) : 'じゅんびちゅう'
                return (
                  <div key={dom.id} className="card row" style={{ alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 30 }}>{dom.emoji}</div>
                    <div className="grow">
                      <div style={{ fontWeight: 900 }}>{dom.name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {dom.available
                          ? `レベル ${Math.floor(sk.level)} ・ きょう ${
                              today ? `${today.correct}/${today.attempts}` : '0/0'
                            }`
                          : 'もうすぐ ついか予定'}
                      </div>
                    </div>
                    <div
                      className="pill"
                      style={{ background: trendColor(label), color: '#10231c', border: 'none' }}
                    >
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
              ※「おうえん中」の分野は、アプリが自動でヒントを増やし、段階を細かくして支えます。
              苦手意識を持たせない設計です。
            </p>
            <div className="card" style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 900 }}>🎯 つぎに ひとつ やるなら</div>
              {priorityDomain ? (
                <p className="muted" style={{ margin: '6px 0 0', lineHeight: 1.6 }}>
                  <b style={{ color: 'var(--text)' }}>{priorityDomain.dom.emoji} {domainName(priorityDomain.dom, state.grade)}</b>
                  {' '}（直近 {priorityDomain.acc.c}/{priorityDomain.acc.n}問 正解）
                  <br />「できない」ではなく、いま一番のびしろが大きい教科です。短いミッションを1回やると、復習が自動で混ざります。
                </p>
              ) : (
                <p className="muted" style={{ margin: '6px 0 0', lineHeight: 1.6 }}>
                  まだデータを集めているところです。各教科を3問以上やると、次に優先する教科が出ます。
                </p>
              )}
            </div>
          </div>

          {/* 学年（先取り解放の保護者操作） */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>学年レベル</h3>
            <div className="card">
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
                現在: {gradeOf(state.grade).short} ／ 解放済み: {gradeOf(state.gradeMax).short} まで
                <br />
                通常は各学年の基礎単元をすべて習得し、ほしのしれんに合格すると次が解放されます。
                保護者判断で先取り解放できます。
                <br />
                まぐれや周りに聞いて進んでしまい、学年が実力と合わなくなったときは
                「もどす」で今の力に合う学年まで下げられます（XP・図鑑・そうび・とっくんは消えません）。
              </p>
              <div className="row wrap">
                {state.gradeMax < MAX_GRADE && (
                  <button
                    className="btn btn--ghost"
                    onClick={() => dispatch({ type: 'FORCE_GRADE_MAX', gradeMax: state.gradeMax + 1 })}
                  >
                    ⏭ {gradeOf(state.gradeMax + 1).short} を先取り解放
                  </button>
                )}
                {state.gradeMax > 0 && (
                  <button
                    className="btn btn--ghost"
                    onClick={() => dispatch({ type: 'LOWER_GRADE_MAX', gradeMax: state.gradeMax - 1 })}
                  >
                    ⏪ {gradeOf(state.gradeMax - 1).short} までに もどす
                  </button>
                )}
                {GRADES.filter((g) => g.id <= state.gradeMax).map((g) => (
                  <button
                    key={g.id}
                    className={'btn ' + (g.id === state.grade ? 'btn--primary' : 'btn--ghost')}
                    style={{ minHeight: 52, padding: '8px 16px' }}
                    onClick={() => dispatch({ type: 'SET_GRADE', grade: g.id })}
                  >
                    {g.short}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* どうとく: 生き物の「いのちの終わり」の話題（既定OFF・保護者設定必須） */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>どうとく：いのちの おわりの 話題</h3>
            <div className="card">
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.7, marginTop: 0 }}>
                ONにすると、どうとくの「答えのない問い」の中に、虫・ペット・
                植物など生き物の死をテーマにした話題（小5・小6のみ）が
                まざるようになります。<br />
                この話題は、正解・不正解を つけず、「かなしい」「ありがとう」
                「よくわからない」など複数の感じ方を そのまま 認める形式です。
                死のようすを 具体的に えがいたり、こわがらせたりする表現は
                使いません。人の死は 扱いません。<br />
                既定は OFFで、ONにしないかぎり 一切 出題されません。ご家庭の
                お考えで 判断してください。
              </p>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🕊️ 生き物の いのちの おわり</span>
                <button
                  className={'btn ' + (state.settings.showLifeEndTopics ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => toggle('showLifeEndTopics')}
                >
                  {state.settings.showLifeEndTopics ? 'ON' : 'OFF'}
                </button>
              </label>
            </div>
          </div>

          {/* むずかしいモード（中学受験レベル・保護者のみ変更可） */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>むずかしいモード</h3>
            <div className="card">
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.7, marginTop: 0 }}>
                ONにすると、<b>小4〜6の さんすう・こくご・りか・しゃかい・えいご</b>が
                中学受験・中学レベル（特殊算・数の性質・発展読解・てこや電気回路・
                歴史や公民・文法など）に、<b>小1〜3の さんすう</b>が
                数のパターン・なかまはずれなどの ちえパズルに 入れかわります。
                その教科は ぜんぶ むずかしい問題になり、出題中は
                「🎓 むずかしいモードの もんだい」と 画面に表示されます。<br />
                <b>年長・かきとりは、まだ ふつうの問題のまま</b>
                です（順次 追加していきます）。<br />
                進級（ほしのしれん）はこのモードの結果を使わず、いつも
                「ふつう」の問題で判定します。とっくん（復習）・習熟度も
                ふつうの問題とは 別で記録するので、まちがえても ふだんの
                学習には ひびきません。バトル・チケット・図鑑・そうび
                の仕組みも変わりません。
              </p>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🎓 いまの せってい</span>
                <button
                  className={'btn ' + (state.settings.mode === 'hard' ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => dispatch({ type: 'SET_SETTING', key: 'mode', value: state.settings.mode === 'hard' ? 'normal' : 'hard' })}
                >
                  {state.settings.mode === 'hard' ? 'むずかしい' : 'ふつう'}
                </button>
              </label>
              <p className="muted" style={{ fontSize: 12, marginBottom: 0, opacity: 0.8 }}>
                ボタンには <b>いま えらばれている ほう</b>が 出ています。
                タップすると もう一方に 切りかわります。
              </p>
            </div>
          </div>

          {/* 設定 */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>せってい</h3>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🔊 おんせい よみあげ</span>
                <button
                  className={'btn ' + (state.settings.tts ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => toggle('tts')}
                >
                  {state.settings.tts ? 'ON' : 'OFF'}
                </button>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontWeight: 800 }}>🗣️ いま使う ナビの こえ</span>
                <div className="row wrap" style={{ gap: 7 }}>
                  {[
                    ['アプリの ナビ音声', 'neural'],
                    ['端末の よみあげ', 'device']
                  ].map(([label, value]) => (
                    <button
                      key={value}
                      className={'btn ' + (state.settings.ttsVoice === value ? 'btn--primary' : 'btn--ghost')}
                      style={{ minHeight: 44, padding: '7px 14px' }}
                      onClick={() => setTtsOption('ttsVoice', value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="card" style={{ padding: '10px 12px', background: '#f2edff', border: '1px solid #d7c8ff' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                    ✨ いま選ばれている声：{state.settings.ttsVoice === 'neural' ? narratorStatus.engine : 'iPhoneの読み上げ'}
                  </div>
                  {narratorStatus.state === 'ready' ? (
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>
                      <p style={{ margin: 0 }}>
                        {state.settings.ttsVoice === 'device'
                          ? '今はiPhoneの読み上げを使います。上の「アプリの ナビ音声」を押すと、つくよみちゃんへ切り替わります。'
                          : narratorStatus.storage === 'cached'
                            ? '端末に保存した声を、自然な日本語で使います。音声モデルの大きな再ダウンロードはありません。'
                            : 'つくよみちゃんを使う準備ができました。下のボタンで聞けます。'}
                      </p>
                      {narratorStatus.playback === 'app' && (
                        <p style={{ margin: '5px 0 0', color: '#167246', fontWeight: 800 }}>
                          ✅ つくよみちゃんを再生中／再生しました
                          {narratorStatus.audio
                            ? `（${narratorStatus.audio.seconds}秒・${narratorStatus.audio.context}）`
                            : ''}
                        </p>
                      )}
                      {narratorStatus.playback === 'device-fallback' && (
                        <p style={{ margin: '5px 0 0', color: '#b54708', fontWeight: 800 }}>
                          ⚠️ アプリ音声の再生に失敗し、端末の読み上げが鳴っています
                          {narratorStatus.error ? `（${narratorStatus.error}）` : ''}
                        </p>
                      )}
                      {narratorStatus.playback === 'device' && (
                        <p style={{ margin: '5px 0 0', color: '#56506b', fontWeight: 800 }}>
                          Aを再生中：これはiPhoneの声です
                        </p>
                      )}
                    </div>
                  ) : narratorStatus.state === 'loading' ? (
                    <p className="muted" style={{ fontSize: 12, lineHeight: 1.45, margin: 0 }}>
                      声を準備中… {narratorStatus.progress != null ? `${narratorStatus.progress}%` : narratorStatus.detail || '少し待ってね'}
                    </p>
                  ) : narratorStatus.state === 'error' ? (
                    <p className="muted" style={{ fontSize: 12, lineHeight: 1.45, margin: 0 }}>
                      準備できませんでした。Wi‑Fiにつないで、もう一度ためしてください。{narratorStatus.error ? `（${narratorStatus.error}）` : ''}
                    </p>
                  ) : narratorStatus.state === 'not-downloaded' ? (
                    <p className="muted" style={{ fontSize: 12, lineHeight: 1.45, margin: 0 }}>
                      つくよみちゃんは、まだ準備されていません。<b>声を選んだだけではダウンロードしません。</b>
                      Wi‑Fiで、下のボタンから必要なときだけ準備できます（声と日本語辞書で最大約100MB、保存済みモデルは再利用）。
                    </p>
                  ) : (
                    <p className="muted" style={{ fontSize: 12, lineHeight: 1.45, margin: 0 }}>
                      保存済みのつくよみちゃんを確認しています。必要な通信は、下のダウンロード操作をしたときだけです。
                    </p>
                  )}
                  {state.settings.ttsVoice === 'neural' && narratorStatus.state === 'not-downloaded' && (
                    <button
                      className="btn btn--primary"
                      style={{ minHeight: 52, padding: '8px 14px', marginTop: 8, width: '100%' }}
                      onClick={downloadNarratorVoice}
                    >
                      ⬇️ つくよみちゃんを 準備（最大約100MB）
                    </button>
                  )}
                  <button
                    className="btn btn--primary"
                    style={{ minHeight: 50, padding: '7px 14px', marginTop: 8, width: '100%' }}
                    disabled={narratorStatus.state === 'loading' || (state.settings.ttsVoice === 'neural' && narratorStatus.state === 'not-downloaded')}
                    onClick={testSelectedVoice}
                  >
                    {narratorStatus.state === 'loading'
                      ? '⏳ 声を準備中…'
                      : state.settings.ttsVoice === 'neural' && narratorStatus.state === 'not-downloaded'
                        ? '⬆️ 先にダウンロードしてください'
                      : `🔊 いま選んでいる「${state.settings.ttsVoice === 'neural' ? 'つくよみちゃん' : 'iPhoneの声'}」を聞く`}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontWeight: 800 }}>🗣️ よみあげの はやさ</span>
                <span className="muted" style={{ fontSize: 12 }}>ふつう＝前の「はやめ」 ／ ゆっくり・はやめは、ふつうを基準に聞き取りやすく調整</span>
                <div className="row wrap" style={{ gap: 7 }}>
                  {TTS_RATE_PRESETS.map(({ label, value }) => (
                    <button
                      key={label}
                      className={'btn ' + (state.settings.ttsRate === value ? 'btn--primary' : 'btn--ghost')}
                      style={{ minHeight: 44, padding: '7px 14px' }}
                      onClick={() => setTtsOption('ttsRate', value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontWeight: 800 }}>🔉 よみあげの おおきさ</span>
                <div className="row wrap" style={{ gap: 7 }}>
                  {[
                    ['小', 0.55],
                    ['ふつう', 0.9],
                    ['大', 1]
                  ].map(([label, value]) => (
                    <button
                      key={label}
                      className={'btn ' + (state.settings.ttsVolume === value ? 'btn--primary' : 'btn--ghost')}
                      style={{ minHeight: 44, padding: '7px 14px' }}
                      onClick={() => setTtsOption('ttsVolume', value)}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    className="btn btn--ghost"
                    style={{ minHeight: 44, padding: '7px 14px' }}
                    onClick={() => speak('こんにちは。ほしぞらクエストだよ！ ゆっくり きいてね。')}
                  >
                    🔊 ためす
                  </button>
                </div>
              </div>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🎵 こうかおん</span>
                <button
                  className={'btn ' + (state.settings.sfx ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => toggle('sfx')}
                >
                  {state.settings.sfx ? 'ON' : 'OFF'}
                </button>
              </label>
              <label className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>🎼 BGM（うちゅうの音楽）</span>
                <button
                  className={'btn ' + (state.settings.bgm ? 'btn--primary' : 'btn--ghost')}
                  style={{ minHeight: 52, padding: '8px 20px' }}
                  onClick={() => toggle('bgm')}
                >
                  {state.settings.bgm ? 'ON' : 'OFF'}
                </button>
              </label>
            </div>
          </div>

          {/* 武器の整理。子ども用の装備画面には置かず、保護者だけが変更できる。 */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>そうびの かんり</h3>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                持っている武器を整理できます。そうび中の武器を消すと、残っている武器に自動で切り替わります。
              </p>
              {!state.weapons?.length ? (
                <div className="muted" style={{ fontWeight: 700 }}>いま持っている武器はありません。</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {state.weapons.map((id) => {
                    const weapon = getWeapon(id)
                    if (!weapon) return null
                    const confirming = weaponToRemove === id
                    return (
                      <div key={id} className="row wrap" style={{ justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontWeight: 800 }}>
                          {weapon.emoji} {weapon.name}{state.equipped === id ? '（そうび中）' : ''}
                        </div>
                        {confirming ? (
                          <div className="row wrap" style={{ gap: 6 }}>
                            <button
                              className="btn btn--pink"
                              style={{ minHeight: 44, padding: '7px 12px' }}
                              onClick={() => {
                                dispatch({ type: 'REMOVE_WEAPON', weaponId: id })
                                setWeaponToRemove(null)
                              }}
                            >
                              消す
                            </button>
                            <button className="btn btn--ghost" style={{ minHeight: 44, padding: '7px 12px' }} onClick={() => setWeaponToRemove(null)}>
                              やめる
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn--ghost" style={{ minHeight: 44, padding: '7px 12px' }} onClick={() => setWeaponToRemove(id)}>
                            整理する
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* データ */}
          <div>
            <h3 style={{ margin: '4px 0 10px' }}>データ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DataMigration state={state} dispatch={dispatch} onBack={onBack} />
            <div className="card">
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
                とりくみ日数: {activeDays}日 ／ 累計クリア: {state.totalClears}回
                <br />
                <b>定着状況（間隔反復）</b>: きょう復習 {missedCount(state)}問（英語を含む）／
                おぼえかけ {boxCounts(reviewSrs).slice(0, MAX_BOX).reduce((a, b) => a + b, 0)}問 ／
                定着ずみ {boxCounts(reviewSrs)[MAX_BOX]}問
                {daysUntilNext(reviewSrs) ? `（次の復習は${daysUntilNext(reviewSrs)}日後）` : ''}
                <br />
                ※まちがえた問題は 1→3→7→14→30日 と間隔をあけて再出題し、忘れる前に思い出させます。
                <br />
                すべてのデータは この端末のなかだけに保存されます（アカウント登録不要）。
              </p>
              {!confirmReset ? (
                <button className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
                  さいしょから やりなおす
                </button>
              ) : (
                <div className="row wrap">
                  <button
                    className="btn btn--pink"
                    onClick={() => {
                      dispatch({ type: 'RESET_ALL' })
                      setConfirmReset(false)
                      onBack()
                    }}
                  >
                    ほんとうに けす
                  </button>
                  <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
                    やめる
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
