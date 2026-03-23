// src/components/TVInterface.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useChannel }              from '../hooks/useChannel'
import { useAnomaly } from '../hooks/useAnomaly'
import { ControlBar }              from './ControlBar'
import { FilterPanel, GENRE_FILTERS } from './FilterPanel'
import { TestPatternScreen, StandbyScreen, CrypticScreen } from './TestPattern'
import '../styles/tv.css'

// ═══════════════════════════════════════════════
//  WEB AUDIO
// ═══════════════════════════════════════════════
let _audioCtx = null
let _humNodes = null

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return _audioCtx
}
function resumeCtx() {
  try { const c = getAudioCtx(); if (c.state === 'suspended') c.resume() } catch {}
}

function playStaticSound(durationSec, vol = 0.45) {
  try {
    resumeCtx()
    const ctx     = getAudioCtx()
    const samples = Math.ceil(ctx.sampleRate * durationSec)
    const buf     = ctx.createBuffer(1, samples, ctx.sampleRate)
    const data    = buf.getChannelData(0)
    for (let i = 0; i < samples; i++) data[i] = (Math.random() * 2 - 1) * 0.14
    const src = ctx.createBufferSource(); src.buffer = buf
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 3800
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec)
    src.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination); src.start()
  } catch {}
}

function playToneSound(freq, durationSec, vol = 0.15, type = 'sine') {
  try {
    resumeCtx()
    const ctx  = getAudioCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type; osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + durationSec)
  } catch {}
}

function playEerieSound() {
  try {
    resumeCtx()
    const ctx  = getAudioCtx()
    const now  = ctx.currentTime
    // sweep + harmonics
    const osc1 = ctx.createOscillator(); osc1.type = 'sine'
    const osc2 = ctx.createOscillator(); osc2.type = 'triangle'
    const gain = ctx.createGain()
    osc1.frequency.setValueAtTime(180, now)
    osc1.frequency.exponentialRampToValueAtTime(60, now + 2.5)
    osc2.frequency.setValueAtTime(360, now)
    osc2.frequency.exponentialRampToValueAtTime(120, now + 2.5)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3)
    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination)
    osc1.start(); osc1.stop(now + 3)
    osc2.start(); osc2.stop(now + 3)
  } catch {}
}

function playWhisperSound() {
  try {
    resumeCtx()
    const ctx    = getAudioCtx()
    const now    = ctx.currentTime
    const samples = ctx.sampleRate * 1.5
    const buf    = ctx.createBuffer(1, samples, ctx.sampleRate)
    const data   = buf.getChannelData(0)
    for (let i = 0; i < samples; i++) data[i] = (Math.random() * 2 - 1) * 0.04
    const src  = ctx.createBufferSource(); src.buffer = buf; src.loop = false
    const bpf  = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 2200; bpf.Q.value = 0.8
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.35, now + 0.3)
    gain.gain.linearRampToValueAtTime(0, now + 1.5)
    src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination); src.start()
  } catch {}
}

function playGlitchSound() {
  try {
    resumeCtx()
    const ctx = getAudioCtx()
    const now = ctx.currentTime
    for (let i = 0; i < 4; i++) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = 200 + Math.random() * 2000
      gain.gain.setValueAtTime(0.08, now + i * 0.07)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.06)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.07)
    }
  } catch {}
}

function startHum(vol = 0.06) {
  if (_humNodes) return
  try {
    resumeCtx()
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 55
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07
    const lfoG = ctx.createGain(); lfoG.gain.value = 1.2
    lfo.connect(lfoG); lfoG.connect(osc.frequency)
    const gain = ctx.createGain(); gain.gain.value = 0
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); lfo.start()
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2.5)
    _humNodes = { osc, lfo, gain }
  } catch {}
}

function setHumVolume(vol) {
  if (!_humNodes) return
  try { _humNodes.gain.gain.linearRampToValueAtTime(Math.max(0, vol), getAudioCtx().currentTime + 0.4) } catch {}
}

// ═══════════════════════════════════════════════
//  CANVAS STATIC
// ═══════════════════════════════════════════════
function drawCleanStatic(ctx, w, h) {
  const img = ctx.createImageData(w, h); const data = img.data
  for (let i = 0; i < data.length; i += 4) { const v = Math.random()*255; data[i]=v; data[i+1]=v; data[i+2]=v; data[i+3]=255 }
  ctx.putImageData(img, 0, 0)
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1)
}
function drawHeavyStatic(ctx, w, h) {
  drawCleanStatic(ctx, w, h)
  const bands = Math.floor(Math.random()*3)+1
  for (let b = 0; b < bands; b++) {
    const y = Math.random()*h, bh = Math.random()*20+4, sx = (Math.random()-0.5)*32
    try { const s = ctx.getImageData(0, Math.max(0,y-bh/2), w, bh); ctx.putImageData(s, sx, y-bh/2) } catch {}
  }
  ctx.globalCompositeOperation='screen'; ctx.fillStyle=`rgba(${Math.random()>.5?160:0},0,${Math.random()>.5?160:0},0.09)`; ctx.fillRect(0,0,w,h); ctx.globalCompositeOperation='source-over'
}
function drawColorStatic(ctx, w, h) {
  const img = ctx.createImageData(w, h); const data = img.data
  for (let i = 0; i < data.length; i += 4) { data[i]=Math.random()*200; data[i+1]=Math.random()*200; data[i+2]=Math.random()*200; data[i+3]=255 }
  ctx.putImageData(img, 0, 0)
  ctx.globalCompositeOperation='screen'
  for (let y = 0; y < h; y += 6) { ctx.fillStyle='rgba(255,0,0,0.07)'; ctx.fillRect(-5,y,w,2); ctx.fillStyle='rgba(0,0,255,0.07)'; ctx.fillRect(5,y+2,w,2) }
  ctx.globalCompositeOperation='source-over'; ctx.fillStyle='rgba(0,0,0,0.26)'; for (let y = 0; y < h; y += 2) ctx.fillRect(0,y,w,1)
}

// ═══════════════════════════════════════════════
//  GHOST ARROW BUTTON
// ═══════════════════════════════════════════════
function GhostArrow({ direction, onClick, disabled }) {
  return (
    <button
      className={`ghost-btn ghost-${direction}${disabled ? ' ghost-disabled' : ''}`}
      onClick={onClick} disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous channel' : 'Next channel'}
    >
      <svg viewBox="0 0 24 40" xmlns="http://www.w3.org/2000/svg" className="ghost-svg">
        {direction === 'prev'
          ? <polyline points="18,4 6,20 18,36" />
          : <polyline points="6,4 18,20 6,36" />}
      </svg>
    </button>
  )
}

// ═══════════════════════════════════════════════
//  YOUTUBE VOLUME VIA POSTMESSAGE
// ═══════════════════════════════════════════════
function setIframeVolume(iframeEl, vol) {
  try {
    iframeEl?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(vol)] }), '*'
    )
  } catch {}
}

// ═══════════════════════════════════════════════
//  COUNTDOWN DIGIT (animated)
// ═══════════════════════════════════════════════
function CountdownDigit({ from }) {
  const [n, setN] = useState(from)
  useEffect(() => {
    if (n <= 0) return
    const t = setTimeout(() => setN(v => v - 1), 900)
    return () => clearTimeout(t)
  }, [n])
  return <div className="cd-digit">{n > 0 ? n : '▓'}</div>
}

// ═══════════════════════════════════════════════
//  DEAD AIR SCREEN
// ═══════════════════════════════════════════════
function DeadAirScreen({ onOpenFilter }) {
  return (
    <div className="anomaly-overlay anomaly-dead-air">
      <div className="dead-air-text">SOURCE EXHAUSTED</div>
      <div className="dead-air-sub">This source has no more signal tonight.</div>
      <div className="dead-air-sub">Try enabling other sources or changing filters.</div>
      {onOpenFilter && (
        <button className="dead-air-btn" onClick={onOpenFilter}>
          CHANGE SOURCE
        </button>
      )}
      <div className="dead-air-code">ERR_NO_SIGNAL :: {new Date().toLocaleTimeString()}</div>
    </div>
  )
}

const DEFAULT_FILTER = {
  genreId: 'any', yearEnabled: false,
  yearFrom: 2000, yearTo: new Date().getFullYear(),
  includeTags: [], excludeTags: [],
  sourceWeights: null,  // null = use defaults from VIDEO_SOURCES
}

// ═══════════════════════════════════════════════
//  TVInterface
// ═══════════════════════════════════════════════
export function TVInterface() {
  const { goNext, goPrev, setFilterConfig } = useChannel()
  const { check: checkAnomaly, buildData: buildAnomalyData } = useAnomaly()

  const [videoSrc,      setVideoSrc]      = useState('')
  const [videoSource,   setVideoSource]   = useState('youtube')
  const [currentVideo,  setCurrentVideo]  = useState(null)   // full video object for copy-link
  const [copied,        setCopied]        = useState(false)  // flash state for copy feedback
  const [isSwitching,   setIsSwitching]   = useState(false)
  const [osd,           setOsd]           = useState({ visible: false, channel: '', status: '' })
  const [screenWarped,  setScreenWarped]  = useState(false)
  const [lostChannel,   setLostChannel]   = useState(null)
  const [screenAnomaly, setScreenAnomaly] = useState(null)
  const [anomalyData,   setAnomalyData]   = useState(null)
  const [volume,        setVolume]        = useState(80)
  const [isPlaying,     setIsPlaying]     = useState(true)
  const [showFilter,    setShowFilter]    = useState(false)
  const [filterConfig,  setFilterConfig_] = useState(DEFAULT_FILTER)
  const [sessionAge,    setSessionAge]    = useState(0)
  // UI fade
  const [uiVisible,     setUiVisible]     = useState(true)
  const [uiHidden,      setUiHidden]      = useState(false) // tab keybind

  const iframeRef       = useRef(null)
  const videoRef        = useRef(null)   // for native <video> elements (wikimedia)
  const staticCanvasRef = useRef(null)
  const grainCanvasRef  = useRef(null)
  const grainInterval   = useRef(null)
  const switchingRef    = useRef(false)
  const sessionTimer    = useRef(null)
  const humStarted      = useRef(false)
  const osdTimer        = useRef(null)
  const anomalyTimer    = useRef(null)
  const uiTimer         = useRef(null)
  const volumeRef       = useRef(volume)
  volumeRef.current = volume

  // ── Canvas sync ──
  function syncSize(canvas) {
    if (!canvas?.parentElement) return
    const { width, height } = canvas.parentElement.getBoundingClientRect()
    const w = Math.floor(width), h = Math.floor(height)
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
  }

  // ── Grain ──
  useEffect(() => {
    grainInterval.current = setInterval(() => {
      const canvas = grainCanvasRef.current; if (!canvas) return
      syncSize(canvas)
      const ctx = canvas.getContext('2d'); const { width: w, height: h } = canvas; if (!w||!h) return
      const img = ctx.createImageData(w, h); const data = img.data
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.2) {
          const v = Math.floor(Math.random()*255)
          data[i]=v; data[i+1]=v; data[i+2]=v; data[i+3]=Math.floor(Math.random()*24)
        }
      }
      ctx.putImageData(img, 0, 0)
    }, 85)
    return () => clearInterval(grainInterval.current)
  }, [])

  // ── Session aging ──
  useEffect(() => {
    sessionTimer.current = setInterval(() => {
      setSessionAge(a => { const n = a+1; if (n===5 && humStarted.current) setHumVolume(0.1); return n })
    }, 60_000)
    return () => clearInterval(sessionTimer.current)
  }, [])

  // ── Volume → all video sources + hum ──
  useEffect(() => {
    // YouTube / Archive / Dailymotion iframes (YouTube uses postMessage API)
    if (iframeRef.current) setIframeVolume(iframeRef.current, volume)
    // Wikimedia native <video> — set volume directly on DOM node
    if (videoRef.current) {
      const el = videoRef.current
      el.volume = volume / 100
      if (volume === 0) {
        el.muted = true
      } else {
        // Must remove the muted attribute AND set .muted = false for all browsers
        el.muted = false
        el.removeAttribute('muted')
      }
    }
    if (humStarted.current) setHumVolume(volume === 0 ? 0 : (sessionAge >= 5 ? 0.1 : 0.06))
  }, [volume, sessionAge])

  // ── UI fade on inactivity ──
  function resetUiTimer() {
    if (uiHidden) return
    setUiVisible(true)
    clearTimeout(uiTimer.current)
    uiTimer.current = setTimeout(() => setUiVisible(false), 4000)
  }

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart']
    events.forEach(ev => window.addEventListener(ev, resetUiTimer, { passive: true }))
    resetUiTimer()
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetUiTimer))
      clearTimeout(uiTimer.current)
    }
  }, [uiHidden]) // eslint-disable-line

  // ── Keyboard navigation ──
  useEffect(() => {
    function onKey(e) {
      if (showFilter) return
      if (e.target.tagName === 'INPUT') return

      // Tab = toggle hide everything
      if (e.key === 'Tab') {
        e.preventDefault()
        setUiHidden(v => { const next = !v; setUiVisible(!next); return next })
        return
      }

      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') { e.preventDefault(); handleSwitch('prev') }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); handleSwitch('next') }
      if (e.key === 'f'          || e.key === 'F') { e.preventDefault(); setShowFilter(v => !v) }
      if (e.key === 'c'          || e.key === 'C') { e.preventDefault(); handleCopyLink() }
      if (e.key === ' ')                           { e.preventDefault(); handlePlayPause() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showFilter]) // eslint-disable-line

  // ── Static burst ──
  function burstStatic(durationMs, variant = 'clean') {
    return new Promise(resolve => {
      const canvas = staticCanvasRef.current
      if (!canvas) { setTimeout(resolve, durationMs); return }
      syncSize(canvas); canvas.style.opacity = '1'
      const ctx = canvas.getContext('2d'); const { width: w, height: h } = canvas
      if (volumeRef.current > 0) playStaticSound(durationMs / 1000, 0.45)
      const start = performance.now()
      function frame() {
        const prog = Math.min((performance.now()-start)/durationMs, 1)
        if (prog < 0.72) {
          if      (variant==='heavy') drawHeavyStatic(ctx, w, h)
          else if (variant==='color') drawColorStatic(ctx, w, h)
          else                         drawCleanStatic(ctx, w, h)
        } else {
          drawCleanStatic(ctx, w, h)
          ctx.fillStyle=`rgba(0,0,0,${(prog-0.72)/0.28})`; ctx.fillRect(0,0,w,h)
        }
        if (prog < 1) requestAnimationFrame(frame)
        else { canvas.style.opacity='0'; ctx.clearRect(0,0,w,h); resolve() }
      }
      requestAnimationFrame(frame)
    })
  }

  // ── Build video src from item ──
  function buildVideoSrc(video) {
    if (!video) return ''

    if (video.source === 'archive') {
      // archive.org embed: suppress their header/controls, autoplay
      return `https://archive.org/embed/${video.id.videoId}?autoplay=1&start=0&output=embed`
    }

    if (video.source === 'wikimedia') {
      return video.url ?? ''  // direct MP4/WebM — volume set via videoRef after mount
    }

    if (video.source === 'dailymotion') {
      const vid = video.id?.videoId
      if (!vid) return ''
      // Suppress all Dailymotion UI chrome
      const p = new URLSearchParams({
        autoplay: 1,
        'queue-enable': 0,
        'ui-logo': 0,
        'sharing-enable': 0,
        'ui-start-screen-info': 0,
        'ui-end-screen-info': 0,
        'endscreen-enable': 0,
        'ui-theme': 'dark',
        'background': '000000',
      })
      return `https://www.dailymotion.com/embed/video/${vid}?${p}`
    }

    // YouTube — controls=0 hides play bar, playsinline for iOS,
    // playlist= same vid enables seamless loop without end-screen
    const vid = video.id?.videoId
    if (!vid) return ''
    const p = new URLSearchParams({
      autoplay:        1,
      controls:        0,
      rel:             0,
      modestbranding:  1,
      enablejsapi:     1,
      iv_load_policy:  3,
      disablekb:       1,
      playsinline:     1,
      loop:            1,
      playlist:        vid,  // required for loop to work
    })
    return `https://www.youtube.com/embed/${vid}?${p}`
  }

  // ── Get shareable original URL from video object ──
  function getCanonicalUrl(video) {
    if (!video) return null
    if (video.source === 'archive') {
      return `https://archive.org/details/${video.id.videoId}`
    }
    if (video.source === 'wikimedia') {
      return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(video.id.videoId)}`
    }
    if (video.source === 'dailymotion') {
      return `https://www.dailymotion.com/video/${video.id.videoId}`
    }
    // youtube
    const vid = video.id?.videoId
    return vid ? `https://www.youtube.com/watch?v=${vid}` : null
  }

  // ── Copy canonical URL to clipboard ──
  const copiedTimerRef = useRef(null)
  function handleCopyLink() {
    const url = getCanonicalUrl(currentVideo)
    if (!url) return
    try {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2200)
      })
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = url; el.style.position = 'fixed'; el.style.opacity = '0'
      document.body.appendChild(el); el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2200)
    }
  }

  // ── Play / Pause ──────────────────────────────────────────────────────────
  function handlePlayPause() {
    const next = !isPlaying
    setIsPlaying(next)

    // Native <video> (Wikimedia)
    if (videoRef.current) {
      next ? videoRef.current.play() : videoRef.current.pause()
    }

    // YouTube iframe — postMessage API
    if (videoSource === 'youtube' && iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: next ? 'playVideo' : 'pauseVideo', args: [] }), '*'
        )
      } catch {}
    }

    // Archive / Dailymotion iframes — no JS API; swap src to effectively pause
    // (removing src stops playback; restoring resumes from start — best we can do cross-origin)
    if ((videoSource === 'archive' || videoSource === 'dailymotion') && iframeRef.current) {
      if (!next) {
        iframeRef.current.dataset.pausedSrc = iframeRef.current.src
        iframeRef.current.src = 'about:blank'
      } else {
        const saved = iframeRef.current.dataset.pausedSrc
        if (saved) iframeRef.current.src = saved
      }
    }
  }

  const handleSwitch = useCallback(async (direction) => {
    if (switchingRef.current) return
    switchingRef.current = true; setIsSwitching(true)
    setIsPlaying(true)  // always resume on channel change

    if (!humStarted.current) { humStarted.current = true; startHum(0.06) }

    clearTimeout(anomalyTimer.current)
    setScreenAnomaly(null); setAnomalyData(null); setLostChannel(null); setCurrentVideo(null)

    const anom = checkAnomaly()
    let variant = 'clean'
    if (anom?.id === 'static_heavy') variant = 'heavy'
    else { const r = Math.random(); if (r<0.06) variant='heavy'; else if (r<0.12) variant='color' }

    setVideoSrc('')
    setOsd({ visible: true, channel: 'CH --', status: 'Searching…' })
    await new Promise(r => setTimeout(r, 65))
    await burstStatic(anom?.id==='static_heavy' ? 820 : 430, variant)

    let result
    if (direction === 'next') result = await goNext()
    else                       result = goPrev()
    const { video, channelNum, lostChannel: lost } = result ?? {}

    // ── Handle overlay anomalies ──
    if (anom && anom.type === 'overlay') {
      const data = buildAnomalyData(anom.id)

      // Play appropriate sound
      const vol = volumeRef.current
      if (vol > 0) {
        const soundMap = {
          system_message:    () => setTimeout(() => playWhisperSound(), 200),
          ascii_face:        () => setTimeout(() => playEerieSound(), 100),
          eerie_gif:         () => setTimeout(() => playWhisperSound(), 500),
          dead_frequency:    () => playEerieSound(),
          memory_corruption: () => setTimeout(() => playGlitchSound(), 200),
          color_bars_glitch: () => setTimeout(() => playToneSound(1000, 0.2, 0.12, 'square'), 100),
          broadcast_warning: () => setTimeout(() => playToneSound(440, 0.15, 0.18, 'square'), 100),
          countdown:         () => playEerieSound(),
          morse_code:        () => setTimeout(() => playGlitchSound(), 100),
          classified_footage:() => setTimeout(() => playWhisperSound(), 300),
          lost_transmission: () => setTimeout(() => playEerieSound(), 200),
          pixel_eyes:        () => setTimeout(() => playWhisperSound(), 400),
          viewer_count:      () => setTimeout(() => playWhisperSound(), 100),
          late_night_joke:   () => setTimeout(() => playToneSound(220, 0.3, 0.08, 'sine'), 200),
          cryptic_fact:      () => setTimeout(() => playWhisperSound(), 300),
          weather_intercept: () => setTimeout(() => playGlitchSound(), 200),
          number_transmission:() => setTimeout(() => playEerieSound(), 100),
          time_glitch:       () => setTimeout(() => playGlitchSound(), 150),
          signal_decoded:    () => setTimeout(() => playToneSound(800, 0.4, 0.1, 'square'), 100),
        }
        soundMap[anom.id]?.()
      }

      setAnomalyData(data)
      setScreenAnomaly(anom.id)
      setOsd({ visible: false, channel: '', status: '' })

      anomalyTimer.current = setTimeout(() => {
        setScreenAnomaly(null); setAnomalyData(null)
        const src = buildVideoSrc(video)
        if (src) { setVideoSrc(src); setVideoSource(video?.source ?? 'youtube'); setCurrentVideo(video) }
        else if (lost) setLostChannel(lost)
        const ch = channelNum ?? '--'
        setOsd({ visible: true, channel: `CH ${ch}`, status: lost ? 'No Signal' : 'Now Playing' })
        clearTimeout(osdTimer.current)
        osdTimer.current = setTimeout(() => setOsd(s=>({...s,visible:false})), 3500)
      }, anom.duration)
      switchingRef.current = false; setIsSwitching(false); return
    }

    // ── Non-overlay anomalies ──
    if (anom?.id === 'crt_warp') { setScreenWarped(true); setTimeout(() => setScreenWarped(false), 2800) }
    if (anom?.id === 'shadow_pass') { setScreenAnomaly('shadow_pass'); setTimeout(() => setScreenAnomaly(null), 2400) }

    const osdCh = anom?.id==='impossible_channel' ? `CH ${Math.floor(Math.random()*9000)+1000}`
                : anom?.id==='ch_question'         ? 'CH ???'
                : `CH ${channelNum ?? '--'}`

    if (lost) {
      setLostChannel(lost); setCurrentVideo(null)
    } else {
      const src = buildVideoSrc(video)
      if (src) { setVideoSrc(src); setVideoSource(video?.source ?? 'youtube'); setCurrentVideo(video) }
    }

    clearTimeout(osdTimer.current)
    setOsd({ visible: true, channel: osdCh, status: lost ? 'No Signal' : 'Now Playing' })
    osdTimer.current = setTimeout(() => setOsd(s=>({...s,visible:false})), 3800)
    switchingRef.current = false; setIsSwitching(false)
  }, [goNext, goPrev, checkAnomaly]) // eslint-disable-line

  useEffect(() => {
    if (!videoSrc) return
    const t = setTimeout(() => {
      // Iframe sources (YouTube postMessage volume)
      if (iframeRef.current) setIframeVolume(iframeRef.current, volumeRef.current)
      // Native video element (Wikimedia) — unmute after autoplay starts
      if (videoRef.current) {
        const el = videoRef.current
        el.volume = volumeRef.current / 100
        if (volumeRef.current > 0) {
          el.muted = false
          el.removeAttribute('muted')
        }
      }
    }, 400)
    return () => clearTimeout(t)
  }, [videoSrc])

  useEffect(() => { handleSwitch('next') }, []) // eslint-disable-line

  function handleFilterApply({ genreId, genre, searchOpts, sourceWeights: sw }) {
    // sw = [{id, weight, enabled}] from FilterPanel — contains the full enabled state
    // Convert to active weights for useChannel (disabled sources get weight 0)
    const activeWeights = sw
      ? sw.map(s => ({ id: s.id, weight: (s.enabled !== false) ? s.weight : 0 }))
      : null

    const newConfig = {
      genreId,
      yearEnabled:   !!searchOpts.publishedAfter,
      yearFrom:      searchOpts.publishedAfter  ? parseInt(searchOpts.publishedAfter)  : 2000,
      yearTo:        searchOpts.publishedBefore ? parseInt(searchOpts.publishedBefore) : new Date().getFullYear(),
      includeTags:   searchOpts.includeTags  ?? [],
      excludeTags:   searchOpts.excludeTags  ?? [],
      sourceWeights: sw ?? null,  // store full objects so panel re-opens with correct state
    }
    setFilterConfig_(newConfig)
    setFilterConfig({ seeds: genre?.seeds ?? null, searchOpts, sourceWeights: activeWeights })
    setLostChannel(null); setVideoSrc(''); setCurrentVideo(null)
    setTimeout(() => handleSwitch('next'), 50)
  }

  // ── Render anomaly overlays ──
  function renderScreenAnomaly() {
    const d = anomalyData ?? {}
    switch (screenAnomaly) {

      // ── Classic ────────────────────────────────────────────────────────────
      case 'please_stand_by':
        return (
          <div className="anomaly-overlay anomaly-standby">
            <div className="standby-bar"/>
            <div className="standby-text">PLEASE STAND BY</div>
            <div className="standby-sub">The broadcast will resume shortly</div>
          </div>
        )
      case 'no_signal':
        return (
          <div className="anomaly-overlay anomaly-nosignal">
            <div className="nosignal-text">NO SIGNAL</div>
            <div className="nosignal-cursor"/>
          </div>
        )
      case 'landing_flash':
        return (
          <div className="anomaly-overlay anomaly-landing-flash">
            <div className="flash-text">It's late.<br/>You're still awake.</div>
          </div>
        )
      case 'dead_frequency':
        return (
          <div className="anomaly-overlay anomaly-dead-freq">
            <div className="dead-freq-inner">
              <div className="dead-freq-line">— — — — — — — — — —</div>
              <div className="dead-freq-ch">FREQUENCY LOST</div>
              <div className="dead-freq-hz">~~ 88.7 MHz ~~</div>
              <div className="dead-freq-line">— — — — — — — — — —</div>
            </div>
          </div>
        )
      case 'channel_zero':
        return (
          <div className="anomaly-overlay anomaly-ch-zero">
            <div className="ch-zero-num">CH 0</div>
            <div className="ch-zero-msg">THIS CHANNEL SHOULD NOT EXIST</div>
            <div className="ch-zero-sub">0 0 0 0 0 0 0 0 0 0 0 0 0 0</div>
          </div>
        )
      case 'color_bars_glitch':
        return (
          <div className="anomaly-overlay anomaly-color-bars">
            {['#fff','#ff0','#0ff','#0f0','#f0f','#f00','#00f'].map((c, i) => (
              <div key={i} className="color-bar" style={{ background: c, animationDelay: `${i*0.08}s` }}/>
            ))}
            <div className="color-bars-glitch-line"/>
          </div>
        )
      case 'memory_corruption':
        return (
          <div className="anomaly-overlay anomaly-corruption">
            <div className="corrupt-grid">
              {Array.from({ length: 64 }).map((_, i) => (
                <span key={i} className="corrupt-cell" style={{ animationDelay: `${(i * 0.007).toFixed(2)}s` }}>
                  {String.fromCharCode(0x2580 + Math.floor(Math.random() * 32))}
                </span>
              ))}
            </div>
            <div className="corrupt-msg">MEMORY FAULT :: ADDR {Math.floor(Math.random()*0xFFFF).toString(16).toUpperCase().padStart(4,'0')}</div>
          </div>
        )
      case 'broadcast_warning': {
        const w = d.warning
        return (
          <div className="anomaly-overlay anomaly-broadcast-warn">
            <div className="bcast-stripe"/>
            <div className="bcast-body">
              <div className="bcast-headline">{w?.headline ?? 'NOTICE'}</div>
              <div className="bcast-content">{w?.body ?? ''}</div>
            </div>
            <div className="bcast-stripe"/>
          </div>
        )
      }
      case 'shadow_pass':
        return <div className="anomaly-shadow-pass"/>

      // ── Static content ─────────────────────────────────────────────────────
      case 'system_message':
        return (
          <div className="anomaly-overlay anomaly-system-msg">
            <div className="sys-msg-pre">// SYSTEM MESSAGE //</div>
            <div className="sys-msg-text">{d.message ?? 'ERROR'}</div>
            <div className="sys-msg-post">{new Date().toLocaleTimeString()}</div>
          </div>
        )
      case 'ascii_face':
        return (
          <div className="anomaly-overlay anomaly-ascii">
            <pre className="ascii-art">{d.face ?? ''}</pre>
          </div>
        )
      case 'static_gif':
      case 'eerie_gif': {
        const g = d.gif
        return (
          <div className="anomaly-overlay anomaly-gif-screen">
            {g && <img className="anom-gif" src={g.url} alt="" />}
            <div className="anom-gif-msg">{g?.msg ?? '...'}</div>
          </div>
        )
      }

      // ── API-powered ────────────────────────────────────────────────────────
      case 'late_night_joke':
        return (
          <div className="anomaly-overlay anomaly-joke">
            <div className="joke-label">━━ LATE NIGHT PROGRAMMING ━━</div>
            <div className="joke-text">{d.joke ?? '...'}</div>
            <div className="joke-laugh">[ laugh track ]</div>
          </div>
        )
      case 'cryptic_fact':
        return (
          <div className="anomaly-overlay anomaly-cryptic-fact">
            <div className="cfact-label">{d.label ?? 'FACT INTERCEPTED'}</div>
            <div className="cfact-divider">▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</div>
            <div className="cfact-text">{d.fact ?? '...'}</div>
            <div className="cfact-source">— SOURCE UNKNOWN —</div>
          </div>
        )
      case 'unsolicited_advice':
        return (
          <div className="anomaly-overlay anomaly-advice">
            <div className="advice-label">◈ UNSOLICITED ADVICE ◈</div>
            <div className="advice-text">"{d.advice ?? 'Stop watching.'}"</div>
            <div className="advice-sig">— the television</div>
          </div>
        )
      case 'weather_intercept':
        return (
          <div className="anomaly-overlay anomaly-weather">
            <div className="weather-label">⚡ SIGNAL INTERCEPT ⚡</div>
            <div className="weather-loc">{d.location ?? 'UNKNOWN LOCATION'}</div>
            <div className="weather-data">
              <span className="weather-item">{d.temp}°F</span>
              <span className="weather-sep">·</span>
              <span className="weather-item">{d.wind} mph wind</span>
            </div>
            <div className="weather-note">{'YOU ARE NOT THERE.\nBUT SOMETHING IS.'}</div>
          </div>
        )
      case 'number_transmission':
        return (
          <div className="anomaly-overlay anomaly-number">
            <div className="num-label">TRANSMISSION №{d.number}</div>
            <div className="num-divider">· · · · · · · · · · ·</div>
            <div className="num-text">{d.text ?? '...'}</div>
            <div className="num-footer">END TRANSMISSION</div>
          </div>
        )

      // ── New creative ───────────────────────────────────────────────────────
      case 'viewer_count': {
        const n = d.count ?? 0
        const msgs = ['YOU ARE ALONE.', 'YOU AND ONE OTHER.', 'THREE OF YOU NOW.']
        return (
          <div className="anomaly-overlay anomaly-viewer-count">
            <div className="vc-label">CURRENT VIEWERS</div>
            <div className="vc-number">{n + 1}</div>
            <div className="vc-msg">{msgs[n] ?? msgs[0]}</div>
            <div className="vc-sub">THIS NUMBER SHOULD NOT BE VISIBLE</div>
          </div>
        )
      }
      case 'signal_decoded':
      case 'morse_code': {
        const m = d.morse
        return (
          <div className="anomaly-overlay anomaly-morse">
            <div className="morse-label">SIGNAL DECODED</div>
            <div className="morse-code">{m?.morse ?? '... --- ...'}</div>
            <div className="morse-reveal">{m?.decoded ?? '???'}</div>
          </div>
        )
      }
      case 'static_poem':
        return (
          <div className="anomaly-overlay anomaly-poem">
            <div className="poem-deco">~  ~  ~  ~  ~  ~  ~</div>
            <pre className="poem-text">{d.poem ?? '...'}</pre>
            <div className="poem-deco">~  ~  ~  ~  ~  ~  ~</div>
          </div>
        )
      case 'lost_transmission': {
        const tx = d.tx
        return (
          <div className="anomaly-overlay anomaly-lost-tx">
            <div className="ltx-from">FROM: {tx?.from ?? 'UNKNOWN'}</div>
            <div className="ltx-divider">════════════════════</div>
            <div className="ltx-msg">{tx?.msg ?? '...'}</div>
            <div className="ltx-ts">{new Date().toISOString().slice(0,19).replace('T',' ')}</div>
          </div>
        )
      }
      case 'countdown': {
        const n = d.from ?? 5
        return (
          <div className="anomaly-overlay anomaly-countdown">
            <div className="cd-label">RESUMING IN</div>
            <CountdownDigit from={n} />
            <div className="cd-sub">DO NOT TOUCH THE DIAL</div>
          </div>
        )
      }
      case 'mirror_test':
        return (
          <div className="anomaly-overlay anomaly-mirror">
            <div className="mirror-label">MIRROR TEST ACTIVE</div>
            <div className="mirror-grid">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`mirror-cell mirror-cell-${i}`}>
                  {i === 4 ? '◉' : ['·','○','·','○','·','○','·','·'][i] ?? '·'}
                </div>
              ))}
            </div>
            <div className="mirror-note">IS THAT YOU?</div>
          </div>
        )
      case 'classified_footage':
        return (
          <div className="anomaly-overlay anomaly-classified">
            <div className="class-level">{d.level ?? 'CLASSIFIED'}</div>
            <div className="class-divider">▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬</div>
            {(d.lines ?? []).map((line, i) => (
              <div key={i} className="class-line">{line}</div>
            ))}
            <div className="class-footer">UNAUTHORIZED VIEWING IS A FEDERAL OFFENSE</div>
          </div>
        )
      case 'time_glitch':
        return (
          <div className="anomaly-overlay anomaly-time-glitch">
            <div className="tg-label">TIME SYNC ERROR</div>
            <div className="tg-wrong">{d.wrong}</div>
            <div className="tg-note">{d.diff ?? 'time displaced'}</div>
            <div className="tg-right">ACTUAL: {d.right}</div>
          </div>
        )
      case 'pixel_eyes': {
        const grid = Array.from({ length: 48 }).map((_, i) => {
          const x = i % 8, y = Math.floor(i / 8)
          const isEye = (d.eyes ?? []).some(e => e.x === x && e.y === y)
          return { isEye, key: i }
        })
        return (
          <div className="anomaly-overlay anomaly-pixel-eyes">
            <div className="pxeye-grid">
              {grid.map(cell => (
                <div key={cell.key} className={`pxeye-cell${cell.isEye ? ' pxeye-on' : ''}`} />
              ))}
            </div>
            <div className="pxeye-msg">I SEE {(d.eyes ?? []).length} OF YOU</div>
          </div>
        )
      }

      default: return null
    }
  }

  function renderLostChannel() {
    if (lostChannel === 'dead_air') return <DeadAirScreen onOpenFilter={() => setShowFilter(true)} />
    switch (lostChannel) {
      case 'test_pattern': return <TestPatternScreen />
      case 'standby_card': return <StandbyScreen />
      case 'cryptic':      return <CrypticScreen />
      default: return null
    }
  }

  const filterLabel = filterConfig.genreId !== 'any'
    ? GENRE_FILTERS.find(g => g.id === filterConfig.genreId)?.label
    : null

  const uiClass = uiHidden ? ' ui-force-hide' : (!uiVisible ? ' ui-faded' : '')

  return (
    <>
      <div className={`room${sessionAge >= 10 ? ' room-deep' : ''}`}>
        <div className={`room-glow${isSwitching ? ' dim' : ''}`} />

        <div className="tv-rig-wrapper">
          <div className="tv-rig">
            <GhostArrow direction="prev" onClick={() => handleSwitch('prev')} disabled={isSwitching} />

            <div className="tv-body tv-body-3d">
              <div className="tv-bezel">
                <div className={`tv-screen${screenWarped ? ' crt-warped' : ''}`}>

                  {videoSrc && videoSource === 'youtube' && (
                    <>
                      <iframe
                        ref={iframeRef} key={videoSrc}
                        className="tv-iframe tv-iframe-yt"
                        src={videoSrc}
                        allow="autoplay; encrypted-media" allowFullScreen
                        title="Night Channel"
                      />
                      {/* Hides the YouTube watermark logo in the bottom-right corner */}
                      <div className="yt-logo-mask" />
                      {/* Transparent overlay catches pointer events so YT UI never appears */}
                      <div className="yt-ui-blocker" onClick={() => handleSwitch('next')} />
                    </>
                  )}

                  {videoSrc && videoSource === 'wikimedia' && (
                    <video
                      ref={videoRef}
                      key={videoSrc}
                      className="tv-iframe"
                      src={videoSrc}
                      autoPlay
                      muted        // always start muted — volume useEffect unmutes after interaction
                      loop
                      playsInline
                      style={{ objectFit: 'cover' }}
                    />
                  )}

                  {videoSrc && (videoSource === 'archive' || videoSource === 'dailymotion') && (
                    <iframe
                      ref={iframeRef} key={videoSrc}
                      className="tv-iframe"
                      src={videoSrc}
                      allow="autoplay; encrypted-media" allowFullScreen
                      title="Night Channel"
                    />
                  )}

                  {lostChannel && !videoSrc && renderLostChannel()}
                  {screenAnomaly && renderScreenAnomaly()}

                  <div className="crt-scanlines" />
                  <div className="crt-vignette"  />
                  <div className="crt-gloss"     />
                  <canvas ref={grainCanvasRef}  className="crt-grain"     />
                  <canvas ref={staticCanvasRef} className="static-canvas" />

                  <div className={`osd${osd.visible ? '' : ' hidden'}`}>
                    <span className="osd-channel">{osd.channel}</span>
                    {osd.status && <span className="osd-status">{osd.status}</span>}
                    {filterLabel && <span className="osd-filter">{filterLabel}</span>}
                  </div>

                  {currentVideo && !isSwitching && (
                    <button
                      className={`copy-link-btn${copied ? ' copy-done' : ''}`}
                      onClick={handleCopyLink}
                      title="Copy link to this video (C)"
                      aria-label="Copy link"
                    >
                      <span className="copy-icon">{copied ? '✓' : '🔗'}</span>
                      <span className="copy-label">{copied ? 'COPIED!' : 'LINK'}</span>
                    </button>
                  )}

                </div>
              </div>
              <div className="tv-chin">
                <div className={`tv-led${isSwitching ? ' off' : ''}`} />
                <div className="tv-brand">NOCTURNE</div>
                <div className={`tv-led${isSwitching ? ' off' : ''}`} />
              </div>
            </div>

            <GhostArrow direction="next" onClick={() => handleSwitch('next')} disabled={isSwitching} />
          </div>

          <div className={`ui-fade-group${uiClass}`}>
            <ControlBar
              volume={volume}
              onVolumeChange={setVolume}
              filterConfig={filterConfig}
              onFilterOpen={() => setShowFilter(true)}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
            />
            <div className="key-hint">
              ← → or A/D &nbsp;·&nbsp; Space pause &nbsp;·&nbsp; F filter &nbsp;·&nbsp; C copy &nbsp;·&nbsp; <span className="key-hint-tab">TAB</span> hide
            </div>
          </div>
        </div>

        <div className="nav-btns-mobile">
          <GhostArrow direction="prev" onClick={() => handleSwitch('prev')} disabled={isSwitching} />
          <GhostArrow direction="next" onClick={() => handleSwitch('next')} disabled={isSwitching} />
        </div>
      </div>

      {showFilter && (
        <FilterPanel
          config={filterConfig}
          onApply={handleFilterApply}
          onClose={() => setShowFilter(false)}
        />
      )}
    </>
  )
}
