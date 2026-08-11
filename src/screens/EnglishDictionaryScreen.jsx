import React, { useMemo, useState } from 'react'
import { useGame } from '../state/GameContext.jsx'
import { ENGLISH_WORDS, ENGLISH_CATEGORIES, englishStatus } from '../data/content/english.js'
import { speakEnglish } from '../engine/tts.js'
import { buildFreeTask } from '../engine/missions.js'
import { AppHeader, Starfield, useSpeakOnMount } from '../components/common.jsx'

export default function EnglishDictionaryScreen({ onBack, onStartTask }) {
  const { state } = useGame()
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const words = useMemo(() => ENGLISH_WORDS.filter((word) => word.minGrade <= state.grade && (category === 'all' || word.category === category) && (status === 'all' || englishStatus(state.englishWordStats?.[word.id]) === status)), [state.grade, state.englishWordStats, category, status])
  const gradeWords = ENGLISH_WORDS.filter((w) => w.minGrade <= state.grade)
  const learned = gradeWords.filter((w) => state.englishWordStats?.[w.id]?.stage >= 4).length
  useSpeakOnMount('えいご ずかん。えいごを タッチすると、おてほんが きけるよ。')
  const startWord = (word) => onStartTask({ ...buildFreeTask('english'), focusWordId: word.id })
  return <div className="screen fade-in"><Starfield /><AppHeader onBack={onBack} title="🔤 えいごずかん" right={<div className="pill">{learned}/{gradeWords.length} おぼえた</div>} />
    <div className="scroll-y" style={{ flex: 1, padding: '6px 10px 24px' }}><div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="row wrap" style={{ justifyContent: 'center', gap: 6, marginBottom: 8 }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="カテゴリー"><option value="all">ぜんぶ</option>{Object.entries(ENGLISH_CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="おぼえたぐあい"><option value="all">ぜんぶ</option>{['はじめて','れんしゅう中','もうすぐ おぼえる','おぼえた！'].map((x) => <option key={x}>{x}</option>)}</select>
      </div>
      <p className="muted" style={{ textAlign: 'center', fontWeight: 800 }}>{words.length}こ ひょうじ中。🔊を おして おてほんを きこう！</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>{words.map((word) => <div className="menu-tile" key={word.id} style={{ background: 'linear-gradient(180deg,#e8f5ff,#b9d9ff)', minHeight: 144 }}>
        <button className="btn btn--ghost" style={{ minHeight: 42, width: '100%' }} onClick={() => speakEnglish(word.speak)}>🔊 {word.english}</button><span style={{ fontSize: 34 }}>{word.emoji}</span><strong>{word.japanese}</strong><small>{englishStatus(state.englishWordStats?.[word.id])}</small><button className="btn btn--sun" style={{ minHeight: 40, width: '100%', padding: '5px 6px', fontSize: 13 }} onClick={() => startWord(word)}>この たんごを れんしゅう</button>
      </div>)}</div>
      {words.length > 0 && <button className="btn btn--sun" style={{ margin: '18px auto', display: 'block', minHeight: 60 }} onClick={() => startWord(words[0])}>いちばん上の たんごで 4もん れんしゅう</button>}
    </div></div>
  </div>
}
