import React, { useEffect, useRef, useState } from 'react'
import { speakEnglish } from '../engine/tts.js'

// 録音はこの画面だけの一時Blob。送信・永続化・自動採点はしない。
export default function EnglishSpeakingPractice({ text, onDone }) {
  const recorder = useRef(null); const stream = useRef(null); const url = useRef(null); const timer = useRef(null); const player = useRef(null); const mounted = useRef(true); const completed = useRef(false)
  const [state, setState] = useState('idle'); const [audioUrl, setAudioUrl] = useState(null); const [note, setNote] = useState('おてほんを きいて、まねして いってみよう！')
  const stopTracks = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null }
  const stop = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; if (recorder.current?.state === 'recording') recorder.current.stop(); else stopTracks() }
  const finish = () => { if (completed.current) return; completed.current = true; stop(); player.current?.pause(); onDone?.() }
  useEffect(() => () => { mounted.current = false; stop(); player.current?.pause(); stopTracks(); if (url.current) URL.revokeObjectURL(url.current) }, [])
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setNote('この ききでは ろくおん できないよ。おてほんを きいて こえに だしてみよう！'); return }
    try { stopTracks(); const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true }); if (!mounted.current || completed.current) { nextStream.getTracks().forEach((t) => t.stop()); return }; stream.current = nextStream; const chunks = []; const r = new MediaRecorder(nextStream); recorder.current = r
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }; r.onstop = () => { nextStream.getTracks().forEach((t) => t.stop()); if (stream.current === nextStream) stream.current = null; if (!mounted.current || completed.current) return; const next = URL.createObjectURL(new Blob(chunks, { type: r.mimeType || 'audio/webm' })); if (url.current) URL.revokeObjectURL(url.current); url.current = next; setAudioUrl(next); setState('done'); setNote('じぶんの こえを きいてみよう！') }
      r.start(); setState('recording'); setNote('🔴 ろくおん中… 5びょうで とまるよ'); timer.current = setTimeout(stop, 5000)
    } catch (_) { stopTracks(); if (mounted.current) setNote('マイクを つかわなくても だいじょうぶ。おてほんを まねして いってみよう！') }
  }
  const playOwnVoice = () => {
    if (!audioUrl) return
    player.current?.pause(); const audio = new Audio(audioUrl); player.current = audio; void audio.play().catch(() => {})
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
        <button className="btn btn--sun english-speaking-action" onClick={finish} type="button">✅ まねできた！</button>
      </div>
      <small className="english-speaking-practice__note">{note}</small>
    </section>
  )
}
