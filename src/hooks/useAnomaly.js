// src/hooks/useAnomaly.js
import { useRef } from 'react'
import { fetchGif, fetchAsciiArt, fetchQuote } from '../api'

// ─────────────────────────────────────────────
//  ANOMALY REGISTRY — only live_broadcast + static
// ─────────────────────────────────────────────
export const ANOMALIES = [
  { id: 'static_heavy',   duration: 700,   type: 'static'  },
  { id: 'live_broadcast', duration: 20000, type: 'overlay' },
]

// Static content used by other overlay cases (kept for legacy renders)
export const BROADCAST_WARNINGS = [
  { headline: 'EMERGENCY BROADCAST', body: 'AN ANOMALY HAS BEEN DETECTED\nIN YOUR AREA.\nREMAIN INDOORS.' },
  { headline: 'SIGNAL LOST', body: 'WE ARE EXPERIENCING\nTECHNICAL DIFFICULTIES.\nDO NOT LEAVE YOUR TELEVISION.' },
]
export const CLASSIFIED_LEVELS = ['TOP SECRET', 'EYES ONLY', 'CLASSIFIED']
export const REDACTED_LINES = [
  '█████████ HAS BEEN CONFIRMED',
  'SUBJECT ██ LAST SEEN AT ████',
  'COORDINATES: ████° N  ████° W',
]
export const MORSE_MESSAGES = [
  { decoded: 'HELLO', morse: '.... . .-.. .-.. ---' },
  { decoded: 'WATCH', morse: '.-- .- - -.-. ....' },
]
export const LOST_TRANSMISSIONS = [
  { from: 'STATION K7-DELTA', msg: 'WE ARE STILL BROADCASTING.\nIS ANYONE RECEIVING?' },
]
export const ASCII_FACES = [
  `  /\\_/\\\n ( o.o )\n  > ^ <`,
  `[][][][][]\n[ ERROR  ]\n[][][][][]`,
]
export const CREEPY_GIFS = []

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const BASE_CHANCE  = 0.028
const MIN_COOLDOWN = 1   // anomaly can fire on every channel switch

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

// ─────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────
export function useAnomaly(anomalyChance = BASE_CHANCE) {
  const flipCountRef       = useRef(0)
  const lastAnomalyFlipRef = useRef(-MIN_COOLDOWN)
  const seenGifsRef        = useRef(new Set())   // uniqueness — skip already-seen URLs

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

    // 15% long static burst, 85% live_broadcast
    const id = Math.random() < 0.15 ? 'static_heavy' : 'live_broadcast'
    const anomaly = ANOMALIES.find(a => a.id === id)

    if (anomaly.type === 'overlay') {
      return { ...anomaly, duration: rand(10000, 15000) }
    }
    // static_heavy: random long burst 1-6s
    return { ...anomaly, duration: rand(1000, 6000) }
  }

  // ── buildData() — async, fetches fresh content every call ────────────────
  async function buildData(anomalyId) {
    if (anomalyId !== 'live_broadcast') return {}

    const useGif = Math.random() < 0.7   // 70% gif+quote, 30% ascii+quote

    if (useGif) {
      // Fetch gif + quote in parallel
      const [gifResult, quoteResult] = await Promise.allSettled([
        fetchGifUnique(seenGifsRef),
        fetchQuote(),
      ])
      const gif   = gifResult.status === 'fulfilled' ? gifResult.value : null
      const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
      return { layout: 'gif_quote', gif, ascii: null, quote }
    } else {
      // Fetch ascii + quote in parallel — ascii is local so instant
      const [asciiResult, quoteResult] = await Promise.allSettled([
        fetchAsciiArt(),
        fetchQuote(),
      ])
      const ascii = asciiResult.status === 'fulfilled' ? asciiResult.value : null
      const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
      return { layout: 'ascii_quote', gif: null, ascii, quote }
    }
  }

  return { check, buildData }
}

// ── fetchGifUnique — retries up to 3 times to get an unseen GIF ──────────
async function fetchGifUnique(seenRef, attempts = 0) {
  const result = await fetchGif()
  if (!result?.url) return result

  // If we've seen this URL before, retry (up to 3 times)
  if (seenRef.current.has(result.url) && attempts < 3) {
    return fetchGifUnique(seenRef, attempts + 1)
  }

  // Mark as seen — clear the set when it gets large so we don't run out
  if (seenRef.current.size > 40) seenRef.current.clear()
  seenRef.current.add(result.url)
  return result
}
