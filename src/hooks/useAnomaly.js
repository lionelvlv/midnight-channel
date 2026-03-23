// src/hooks/useAnomaly.js — live-composed anomaly events
import { useRef } from 'react'
import { fetchGif, fetchAsciiArt, fetchQuote } from '../api'

// ─────────────────────────────────────────────
//  ANOMALY REGISTRY
//  All overlays are now composed live from API data.
//  Durations: 15-25s (randomised per event)
// ─────────────────────────────────────────────
export const ANOMALIES = [
  // subtle non-overlay
  { id: 'impossible_channel', duration: 3000,  type: 'osd'    },
  { id: 'ch_question',        duration: 2200,  type: 'osd'    },
  { id: 'crt_warp',           duration: 2600,  type: 'screen' },
  { id: 'shadow_pass',        duration: 2400,  type: 'screen' },
  { id: 'static_heavy',       duration: 700,   type: 'static' },

  // full-screen overlays — duration randomised 15-25s in buildData
  { id: 'live_broadcast',     duration: 20000, type: 'overlay' },  // main live event
  { id: 'please_stand_by',    duration: 18000, type: 'overlay' },
  { id: 'no_signal',          duration: 15000, type: 'overlay' },
  { id: 'dead_frequency',     duration: 22000, type: 'overlay' },
  { id: 'channel_zero',       duration: 17000, type: 'overlay' },
  { id: 'color_bars_glitch',  duration: 15000, type: 'overlay' },
  { id: 'memory_corruption',  duration: 20000, type: 'overlay' },
  { id: 'broadcast_warning',  duration: 25000, type: 'overlay' },
  { id: 'landing_flash',      duration: 20000, type: 'overlay' },
  { id: 'countdown',          duration: 18000, type: 'overlay' },
  { id: 'viewer_count',       duration: 17000, type: 'overlay' },
  { id: 'classified_footage', duration: 22000, type: 'overlay' },
  { id: 'lost_transmission',  duration: 20000, type: 'overlay' },
  { id: 'time_glitch',        duration: 15000, type: 'overlay' },
  { id: 'pixel_eyes',         duration: 22000, type: 'overlay' },
  { id: 'mirror_test',        duration: 18000, type: 'overlay' },
  { id: 'morse_code',         duration: 20000, type: 'overlay' },
]

// ─────────────────────────────────────────────
//  STATIC CONTENT POOLS
// ─────────────────────────────────────────────
export const BROADCAST_WARNINGS = [
  { headline: 'EMERGENCY BROADCAST', body: 'AN ANOMALY HAS BEEN DETECTED\nIN YOUR AREA.\nREMAIN INDOORS.' },
  { headline: 'VIEWER ADVISORY', body: 'THIS PROGRAM HAS BEEN INTERRUPTED\nBY FORCES UNKNOWN TO US.' },
  { headline: 'SIGNAL LOST', body: 'WE ARE EXPERIENCING\nTECHNICAL DIFFICULTIES.\nDO NOT LEAVE YOUR TELEVISION.' },
  { headline: 'INTRUSION DETECTED', body: 'AN UNAUTHORIZED SIGNAL\nHAS HIJACKED THIS FREQUENCY.\nAWAITING OVERRIDE...' },
  { headline: 'DO NOT PANIC', body: 'THIS IS AN AUTOMATED MESSAGE.\nTHERE IS NO CAUSE FOR ALARM.\nREPEAT: DO NOT PANIC.' },
]

export const CLASSIFIED_LEVELS = ['TOP SECRET', 'EYES ONLY', 'CLASSIFIED', 'RESTRICTED', 'NEED TO KNOW']
export const REDACTED_LINES = [
  '█████████ HAS BEEN CONFIRMED',
  'SUBJECT ██ LAST SEEN AT ████',
  'OPERATION ████████ IS ONGOING',
  'COORDINATES: ████° N  ████° W',
  'THE ENTITY KNOWN AS ████████',
  '████ SURVIVORS REMAIN',
  'DO NOT CONTACT ████████████',
]

export const MORSE_MESSAGES = [
  { decoded: 'HELLO',       morse: '.... . .-.. .-.. ---' },
  { decoded: 'WHO ARE YOU', morse: '.-- .... ---   .- .-. .   -.-- --- ..-' },
  { decoded: 'STAY',        morse: '... - .- -.--' },
  { decoded: 'WATCH',       morse: '.-- .- - -.-. ....' },
  { decoded: 'NOT ALONE',   morse: '-. --- -   .- .-.. --- -. .' },
]

export const LOST_TRANSMISSIONS = [
  { from: 'STATION K7-DELTA', msg: 'WE ARE STILL BROADCASTING.\nIS ANYONE RECEIVING?\nPLEASE RESPOND.' },
  { from: 'RELAY NODE 9',     msg: 'SIGNAL BOUNCED 847 TIMES.\nORIGIN: UNKNOWN.\nDESTINATION: YOU.' },
  { from: 'NIGHT OPERATOR',   msg: 'STILL HERE AT 3AM.\nPHONES STOPPED RINGING\nHOURS AGO.' },
  { from: '[UNIDENTIFIED]',   msg: 'WE TRIED TO REACH YOU\nTHROUGH THE TELEVISION.\nDID IT WORK?' },
]

// ASCII faces as pure text — used when API is unavailable
export const ASCII_FACES = [
  `▓▓▓▓▓▓▓▓▓▓▓
▓           ▓
▓  ●     ●  ▓
▓    ___    ▓
▓▓▓▓▓▓▓▓▓▓▓`,
  `  /\\_/\\
 ( -.- )
  > ω <
STILL HERE`,
  `01001000 01000101
01001100 01001100
01001111
H  E  L  L  O`,
  `     ╔═══╗
     ║ ◉ ║
  ╔══╝   ╚══╗
  ║  ─────  ║
  ╚═════════╝
  I SEE YOU`,
]

// Creepy GIF fallbacks
export const CREEPY_GIFS = [
  { url: 'https://media.giphy.com/media/3o7aD2d7hy9ktXNDP2/giphy.gif' },
  { url: 'https://media.giphy.com/media/26tknCqiJrBQG6bxC/giphy.gif' },
  { url: 'https://media.giphy.com/media/3o7aCSPqXE5C6T8tBC/giphy.gif' },
  { url: 'https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif' },
  { url: 'https://media.giphy.com/media/26BRsLG9GIWDIB0oM/giphy.gif' },
  { url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif' },
]

// ─────────────────────────────────────────────
//  PROBABILITY CONFIG
// ─────────────────────────────────────────────
const BASE_CHANCE  = 0.028
const MIN_COOLDOWN = 10

// ─────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

// ─────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────
export function useAnomaly(anomalyChance = BASE_CHANCE) {
  const flipCountRef       = useRef(0)
  const lastAnomalyFlipRef = useRef(-MIN_COOLDOWN)

  // ── check() ──────────────────────────────────────────────────────────────
  function check() {
    flipCountRef.current++
    const since = flipCountRef.current - lastAnomalyFlipRef.current
    if (since < MIN_COOLDOWN) return null

    const chance = anomalyChance >= 0.12
      ? 1
      : anomalyChance + Math.min(0.05, (since - MIN_COOLDOWN) * 0.003)

    if (Math.random() > chance) return null

    lastAnomalyFlipRef.current = flipCountRef.current

    const WEIGHTED = [
      ...Array(4).fill('live_broadcast'),
      'please_stand_by', 'no_signal', 'dead_frequency',
      'channel_zero', 'color_bars_glitch', 'memory_corruption',
      'broadcast_warning', 'landing_flash', 'countdown',
      'viewer_count', 'classified_footage', 'lost_transmission',
      'time_glitch', 'pixel_eyes', 'mirror_test', 'morse_code',
      'impossible_channel', 'ch_question', 'crt_warp', 'shadow_pass',
    ]
    const id = WEIGHTED[Math.floor(Math.random() * WEIGHTED.length)]
    const anomaly = ANOMALIES.find(a => a.id === id) ?? ANOMALIES[0]

    if (anomaly.type === 'overlay') {
      return { ...anomaly, duration: rand(15000, 25000) }
    }
    return anomaly
  }

  // ── buildData() — always fetches fresh content, returns Promise ───────────
  async function buildData(anomalyId) {
    if (anomalyId === 'live_broadcast') {
      // Fetch gif AND quote simultaneously — always fresh, never from cache pool
      const useGif = Math.random() < 0.7
      const [gifResult, quoteResult] = await Promise.allSettled([
        useGif ? fetchGif() : fetchAsciiArt(),
        fetchQuote(),
      ])
      const media = gifResult.status === 'fulfilled' ? gifResult.value : null
      const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null

      if (useGif) {
        return {
          layout: 'gif_quote',
          gif: media ?? CREEPY_GIFS[Math.floor(Math.random() * CREEPY_GIFS.length)],
          ascii: null,
          quote,
        }
      } else {
        return {
          layout: 'ascii_quote',
          gif: null,
          ascii: media ?? { art: ASCII_FACES[Math.floor(Math.random() * ASCII_FACES.length)], word: '' },
          quote,
        }
      }
    }

    // Other overlays — just fetch a fresh quote
    const quoteResult = await Promise.race([
      fetchQuote(),
      new Promise(r => setTimeout(() => r(null), 2000)), // 2s timeout
    ]).catch(() => null)

    const q = quoteResult

    switch (anomalyId) {
      case 'broadcast_warning':
        return {
          warning: BROADCAST_WARNINGS[Math.floor(Math.random()*BROADCAST_WARNINGS.length)],
          quote: Math.random() < 0.5 ? q : null,
        }
      case 'classified_footage':
        return {
          level: CLASSIFIED_LEVELS[Math.floor(Math.random()*CLASSIFIED_LEVELS.length)],
          lines: shuffle([...REDACTED_LINES]).slice(0,4),
          quote: Math.random() < 0.4 ? q : null,
        }
      case 'lost_transmission':
        return { tx: LOST_TRANSMISSIONS[Math.floor(Math.random()*LOST_TRANSMISSIONS.length)], quote: q }
      case 'morse_code':
        return { morse: MORSE_MESSAGES[Math.floor(Math.random()*MORSE_MESSAGES.length)], quote: q }
      case 'viewer_count':
        return { count: rand(0, 2), quote: q }
      case 'countdown':
        return { from: rand(4, 9), quote: q }
      case 'pixel_eyes':
        return { eyes: Array.from({length: rand(2,5)}, () => ({x: rand(0,7), y: rand(0,5)})), quote: q }
      case 'mirror_test':
        return { seed: Math.random(), quote: q }
      case 'time_glitch': {
        const offsets = [-1,-2,-5,-10,-60,1,2,5,10]
        const offset  = offsets[Math.floor(Math.random()*offsets.length)]
        const wrong   = new Date(Date.now() + offset*60*1000)
        return { wrong: wrong.toLocaleTimeString(), right: new Date().toLocaleTimeString(), diff: offset > 0 ? `${offset}min ahead` : `${Math.abs(offset)}min behind`, quote: q }
      }
      default:
        return { quote: q }
    }
  }

  return { check, buildData }
}
