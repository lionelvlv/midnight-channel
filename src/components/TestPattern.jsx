// src/components/TestPattern.jsx
import { useEffect, useRef } from 'react'

// ── SMPTE color bar data ──
const BARS = [
  { r: 191, g: 191, b: 191 },   // White 75%
  { r: 191, g: 191, b: 0   },   // Yellow
  { r: 0,   g: 191, b: 191 },   // Cyan
  { r: 0,   g: 191, b: 0   },   // Green
  { r: 191, g: 0,   b: 191 },   // Magenta
  { r: 191, g: 0,   b: 0   },   // Red
  { r: 0,   g: 0,   b: 191 },   // Blue
]

const CRYPTIC_MESSAGES = [
  ['TRANSMISSION ERROR', 'CODE: 0x3F7A', '', 'PLEASE STAND BY'],
  ['SIGNAL LOST', 'ATTEMPTING RECOVERY', '', 'DO NOT ADJUST YOUR SET'],
  ['CHANNEL UNAVAILABLE', '', 'SERVICE INTERRUPTED', '04:17:33'],
  ['THIS CHANNEL HAS BEEN', 'TEMPORARILY REMOVED', '', 'FROM THE BROADCAST'],
  ['NO CARRIER DETECTED', 'LINE NOISE: HIGH', '', 'RECONNECTING...'],
  ['WARNING', 'BROADCAST ANOMALY', 'DETECTED ON THIS FREQUENCY', ''],
  ['THE SIGNAL IS WEAK', 'TONIGHT', '', 'PLEASE STAND BY'],
]

function drawSMPTE(canvas) {
  const ctx = canvas.getContext('2d')
  const w   = canvas.width
  const h   = canvas.height

  // Background
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)

  const barW    = w / 7
  const topH    = h * 0.67
  const midH    = h * 0.08
  const botH    = h - topH - midH

  // ── Top section: 7 color bars ──
  BARS.forEach((c, i) => {
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`
    ctx.fillRect(i * barW, 0, barW + 1, topH)
  })

  // ── Middle section: reverse-PLUGE strip ──
  const midBars = [
    { r: 0,   g: 0,   b: 191 },
    { r: 19,  g: 19,  b: 19  },
    { r: 191, g: 0,   b: 191 },
    { r: 19,  g: 19,  b: 19  },
    { r: 0,   g: 191, b: 191 },
    { r: 19,  g: 19,  b: 19  },
    { r: 191, g: 191, b: 191 },
  ]
  midBars.forEach((c, i) => {
    ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`
    ctx.fillRect(i * barW, topH, barW + 1, midH)
  })

  // ── Bottom section ──
  // Left third: -I (near black, blueish)
  ctx.fillStyle = 'rgb(0, 0, 16)'
  ctx.fillRect(0, topH + midH, w * 0.167, botH)
  // Center: white 100%
  ctx.fillStyle = 'rgb(255, 255, 255)'
  ctx.fillRect(w * 0.167, topH + midH, w * 0.666, botH)
  // Right third: -Q (near black, purplish)
  ctx.fillStyle = 'rgb(16, 0, 16)'
  ctx.fillRect(w * 0.833, topH + midH, w * 0.167, botH)

  // PLUGE bars within the white center
  const plugeX = w * 0.167
  const plugeW = w * 0.666
  const p3     = plugeW / 3
  // Sub-black
  ctx.fillStyle = 'rgb(0, 0, 0)'
  ctx.fillRect(plugeX, topH + midH, p3, botH)
  // Black reference
  ctx.fillStyle = 'rgb(7, 7, 7)'
  ctx.fillRect(plugeX + p3, topH + midH, p3, botH)
  // Super-black
  ctx.fillStyle = 'rgb(25, 25, 25)'
  ctx.fillRect(plugeX + p3 * 2, topH + midH, p3, botH)

  // ── Scanlines ──
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(0, y, w, 1)
  }

  // ── Channel number overlay ──
  const ch = Math.floor(Math.random() * 90) + 2
  ctx.font        = `bold ${Math.floor(h * 0.14)}px 'VT323', monospace`
  ctx.fillStyle   = 'rgba(255, 34, 0, 0.85)'
  ctx.textAlign   = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(`CH ${ch}`, w * 0.04, h * 0.03)

  // ── Timestamp ──
  const now = new Date()
  const ts  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
  ctx.font        = `${Math.floor(h * 0.07)}px 'VT323', monospace`
  ctx.fillStyle   = 'rgba(0, 224, 64, 0.75)'
  ctx.textAlign   = 'right'
  ctx.fillText(ts, w * 0.96, h * 0.03)

  // ── "ANALOG CABLE" label ──
  ctx.font        = `${Math.floor(h * 0.055)}px 'Space Mono', monospace`
  ctx.fillStyle   = 'rgba(255,255,255,0.18)'
  ctx.textAlign   = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('ANALOG CABLE CORP  ·  TEST SIGNAL  ·  DO NOT ADJUST', w / 2, h - 4)
}

// ── Test Pattern canvas ──
export function TestPatternScreen() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = canvas.parentElement.getBoundingClientRect()
    canvas.width  = Math.floor(width)
    canvas.height = Math.floor(height)
    drawSMPTE(canvas)

    // Subtle scanline wipe every 6s
    const interval = setInterval(() => {
      if (!canvasRef.current) return
      drawSMPTE(canvasRef.current)
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block', zIndex: 2,
      }}
    />
  )
}

// ── "PLEASE STAND BY" card ──
export function StandbyScreen() {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '14px', zIndex: 2,
    }}>
      <div style={{ width: '55%', height: '5px', background: 'linear-gradient(90deg,#444,#aaa,#444)', boxShadow: '0 0 12px rgba(255,255,255,0.2)' }} />
      <div style={{
        fontFamily: "'VT323', monospace",
        fontSize: 'clamp(20px, 3.5vw, 30px)',
        color: 'rgba(255,255,255,0.88)',
        letterSpacing: '6px',
        textShadow: '0 0 20px rgba(255,255,255,0.15)',
        animation: 'standby-blink 1.4s step-end infinite',
      }}>PLEASE STAND BY</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.22)', letterSpacing: '3px', textTransform: 'uppercase' }}>
        The broadcast will resume shortly
      </div>
      <div style={{ width: '55%', height: '5px', background: 'linear-gradient(90deg,#444,#aaa,#444)', boxShadow: '0 0 12px rgba(255,255,255,0.2)' }} />
    </div>
  )
}

// ── Cryptic message screen ──
export function CrypticScreen() {
  const lines = CRYPTIC_MESSAGES[Math.floor(Math.random() * CRYPTIC_MESSAGES.length)]
  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '8px', zIndex: 2,
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontFamily: "'VT323', monospace",
          fontSize: line ? 'clamp(16px, 2.8vw, 22px)' : '8px',
          color: i === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)',
          letterSpacing: '3px',
          textAlign: 'center',
          animation: i === lines.length - 1 && line ? 'standby-blink 1.8s step-end infinite' : 'none',
        }}>
          {line || '\u00A0'}
        </div>
      ))}
    </div>
  )
}
