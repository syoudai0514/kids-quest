import React, { useEffect, useRef, useState } from 'react'
import { speakEnglish } from '../engine/tts.js'

// 録音はこの画面だけの一時Blob。送信・永続化・自動採点はしない。
export default function EnglishSpeakingPractice({ text, onDone }) {
  const recorder = useRef(null); const stream = useRef(null); const url = useRef(null); const timer = useRef(null)
  const [state, setState] = useState('idle'); const [audioUrl, setAudioUrl] = useState(null); const [note, setNote] = useState('おてほんを きいて、まねして いってみよう！')
  const stop = () => { if (timer.current) clearTimeout(timer.current); if (recorder.current?.state === 'recording') recorder.current.stop() }
  useEffect(() => () => { stop(); stream.current?.getTracks().forEach((t) => t.stop()); if (url.current) URL.revokeObjectURL(url.current) }, [])
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setNote('この ききでは ろくおん できないよ。おてほんを きいて こえに だしてみよう！'); return }
    try { stream.current = await navigator.mediaDevices.getUserMedia({ audio: true }); const chunks = []; const r = new MediaRecorder(stream.current); recorder.current = r
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }; r.onstop = () => { stream.current?.getTracks().forEach((t) => t.stop()); const next = URL.createObjectURL(new Blob(chunks, { type: r.mimeType || 'audio/webm' })); if (url.current) URL.revokeObjectURL(url.current); url.current = next; setAudioUrl(next); setState('done'); setNote('じぶんの こえを きいてみよう！') }
      r.start(); setState('recording'); setNote('🔴 ろくおん中… 5びょうで とまるよ'); timer.current = setTimeout(stop, 5000)
    } catch (_) { setNote('マイクを つかわなくても だいじょうぶ。おてほんを まねして いってみよう！') }
  }
  const playOwnVoice = () => {
    if (!audioUrl) return
    void new Audio(audioUrl).play().catch(() => {})
  }

  return (
    <section className={'english-speaking-practice' + (state === 'recording' ? ' english-speaking-practice--recording' : '')} aria-label="まねして いってみよう">
      <strong className="english-speaking-practice__title">🗣️ まねして いってみよう</strong>
      <div className="english-speaking-actions">
        <button className="btn btn--ghost english-speaking-action" onClick={() => speakEnglish(text)} type="button">🔊 おてほん</button>
        <button className="btn btn--primary english-speaking-action" onClick={state === 'recording' ? stop : start} type="button">
          {state === 'recording' ? '⏹ とめる' : '🎙️ ろくおん'}
        </button>
        <button className="btn btn--ghost english-speaking-action" onClick={playOwnVoice} disabled={!audioUrl} type="button">▶️ じぶんのこえ</button>
        <button className="btn btn--sun english-speaking-action" onClick={onDone} type="button">✅ まねできた！</button>
      </div>
      <small className="english-speaking-practice__note">{note}</small>
    </section>
  )
}
