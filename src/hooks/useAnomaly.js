// src/hooks/useAnomaly.js — 30 atmospheric horror events, many pulling from live APIs
import { useRef, useEffect } from 'react'
import { fetchJoke, fetchFact, fetchAdvice, fetchWeatherFact, fetchNumberFact, fetchGif, fetchAsciiArt } from '../api'

// ─────────────────────────────────────────────
//  ANOMALY REGISTRY
//  type: 'osd' | 'screen' | 'static' | 'overlay'
//  overlay events auto-switch after duration
// ─────────────────────────────────────────────
export const ANOMALIES = [
  // ── Subtle (OSD / screen, no full takeover) ──────────────────────────────
  { id: 'impossible_channel', duration: 3000, type: 'osd'    },
  { id: 'ch_question',        duration: 2200, type: 'osd'    },
  { id: 'crt_warp',           duration: 2600, type: 'screen' },
  { id: 'shadow_pass',        duration: 2400, type: 'screen' },
  { id: 'static_heavy',       duration: 700,  type: 'static' },

  // ── Full-screen overlays ──────────────────────────────────────────────────
  // Classic
  { id: 'please_stand_by',    duration: 28000, type: 'overlay' },
  { id: 'no_signal',          duration: 25000, type: 'overlay' },
  { id: 'landing_flash',      duration: 30000, type: 'overlay' },
  { id: 'dead_frequency',     duration: 32000, type: 'overlay' },
  { id: 'channel_zero',       duration: 27000, type: 'overlay' },
  { id: 'color_bars_glitch',  duration: 25000, type: 'overlay' },
  { id: 'memory_corruption',  duration: 30000, type: 'overlay' },
  { id: 'broadcast_warning',  duration: 35000, type: 'overlay' },

  // API-powered
  { id: 'system_message',     duration: 28000, type: 'overlay', needsApi: true },
  { id: 'ascii_face',         duration: 30000, type: 'overlay', needsApi: true },
  { id: 'static_gif',         duration: 27000, type: 'overlay', needsApi: true },
  { id: 'eerie_gif',          duration: 32000, type: 'overlay', needsApi: true },
  { id: 'late_night_joke',    duration: 30000, type: 'overlay', needsApi: true },
  { id: 'cryptic_fact',       duration: 28000, type: 'overlay', needsApi: true },
  { id: 'unsolicited_advice', duration: 25000, type: 'overlay', needsApi: true },
  { id: 'weather_intercept',  duration: 30000, type: 'overlay', needsApi: true },
  { id: 'number_transmission',duration: 27000, type: 'overlay', needsApi: true },

  // New creative overlays
  { id: 'viewer_count',       duration: 28000, type: 'overlay' },
  { id: 'signal_decoded',     duration: 30000, type: 'overlay' },
  { id: 'static_poem',        duration: 35000, type: 'overlay' },
  { id: 'lost_transmission',  duration: 32000, type: 'overlay' },
  { id: 'countdown',          duration: 25000, type: 'overlay' },
  { id: 'mirror_test',        duration: 28000, type: 'overlay' },
  { id: 'classified_footage', duration: 30000, type: 'overlay' },
  { id: 'time_glitch',        duration: 27000, type: 'overlay' },
  { id: 'morse_code',         duration: 30000, type: 'overlay' },
  { id: 'pixel_eyes',         duration: 32000, type: 'overlay' },
]

// ─────────────────────────────────────────────
//  STATIC CONTENT POOLS
// ─────────────────────────────────────────────
export const SYSTEM_MESSAGES = [
  'THIS CHANNEL DOES NOT EXIST',
  'YOU HAVE BEEN WATCHING FOR TOO LONG',
  'THE SIGNAL KNOWS YOU ARE HERE',
  'DO NOT ADJUST YOUR SET',
  'TRANSMISSION INTERCEPTED BY UNKNOWN SOURCE',
  'THIS FREQUENCY IS RESTRICTED',
  'VIEWER DATA LOGGED.\nANALYSIS PENDING.',
  'CONNECTION UNSTABLE.\nCONTINUE?',
  'YOU ARE THE ONLY VIEWER',
  'ERROR: CHANNEL ORIGIN UNKNOWN',
  'LOCATION DATA ACQUIRED',
  'WE HAVE BEEN WATCHING YOU\nWATCH US',
  'THE FEED CANNOT BE STOPPED',
  'SIGNAL ORIGIN:\n[REDACTED]',
  'THIS IS NOT A TEST',
  'YOU WERE NOT SUPPOSED\nTO SEE THIS',
  'DISCONNECT NOW',
]

export const BROADCAST_WARNINGS = [
  { headline: 'EMERGENCY BROADCAST SYSTEM', body: 'AN ANOMALY HAS BEEN DETECTED\nIN YOUR AREA.\nREMAIN INDOORS.' },
  { headline: 'VIEWER ADVISORY', body: 'THE FOLLOWING PROGRAM\nHAS BEEN INTERRUPTED\nBY FORCES UNKNOWN TO US.' },
  { headline: 'SIGNAL LOST', body: 'WE ARE EXPERIENCING\nTECHNICAL DIFFICULTIES.\nDO NOT LEAVE YOUR TELEVISION.' },
  { headline: 'NOTICE', body: 'THIS BROADCAST IS NOT AUTHORIZED\nBY ANY KNOWN ENTITY.\nPLEASE STAND BY.' },
  { headline: 'ALERT', body: 'THE FOLLOWING IMAGES\nHAVE BEEN DEEMED UNSUITABLE\nFOR GENERAL AUDIENCES.' },
  { headline: 'INTRUSION DETECTED', body: 'AN UNAUTHORIZED SIGNAL\nHAS HIJACKED THIS FREQUENCY.\nAWAITING OVERRIDE...' },
  { headline: 'DO NOT PANIC', body: 'THIS IS AN AUTOMATED MESSAGE.\nTHERE IS NO CAUSE FOR ALARM.\nREPEAT: DO NOT PANIC.' },
]

export const ASCII_FACES = [
  `▓▓▓▓▓▓▓▓▓▓▓
▓           ▓
▓  ●     ●  ▓
▓           ▓
▓    ___    ▓
▓▓▓▓▓▓▓▓▓▓▓`,

  `   /\\_/\\
  ( -.- )
   > ω <
 STILL HERE`,

  `████████████
█          █
█  ◉    ◉  █
█    ──    █
█  \\____/  █
████████████`,

  `01001000 01000101
01001100 01001100
01001111
────────────
H  E  L  L  O`,

  `  .  .  .  .  .
  .  (  )  .  .
 .  (    )  . .
.  (  ::  )  .
  (  ::::  ) .
   \\______/`,

  `. . . . . . . . .
  ┌─────────────┐
  │  ▓▓▓▓▓▓▓▓  │
  │  ▓ ◉  ◉ ▓  │
  │  ▓   ▿   ▓  │
  │  ▓▓▓▓▓▓▓▓  │
  └─────────────┘
  . . . . . . . . .`,

  `     ╔═══╗
     ║ ◉ ║
  ╔══╝   ╚══╗
  ║  ─────  ║
  ╚═════════╝
  I SEE YOU`,

  `~  ~  ~  ~  ~
 ( (  (  (  ) )
  \\  \\  /  /
   \\  \\/  /
    \\ __ /
     \\  /
      \\/
  ~  ~  ~  ~  ~`,
]

export const CRYPTIC_POEMS = [
  `the channel finds you
not the other way
it always has`,

  `static is not noise
it is the sound of
everything at once`,

  `you pressed next again
and again and again
was that you?`,

  `between the stations
something lives
that has no name`,

  `the signal was sent
before you were born
it waited for you`,

  `do not fall asleep
with the television on
it will notice`,

  `every channel is
someone's last thing seen
before the dark`,
]

export const LOST_TRANSMISSIONS = [
  { from: 'STATION K7-DELTA', msg: 'WE ARE STILL BROADCASTING.\nIS ANYONE RECEIVING?\nPLEASE RESPOND.' },
  { from: 'RELAY NODE 9',     msg: 'SIGNAL BOUNCED 847 TIMES.\nORIGIN: UNKNOWN.\nDESTINATION: YOU.' },
  { from: 'NIGHT OPERATOR',   msg: 'STILL HERE AT 3AM.\nPHONES STOPPED RINGING\nHOURS AGO.' },
  { from: '[UNIDENTIFIED]',   msg: 'WE TRIED TO REACH YOU\nTHROUGH THE TELEVISION.\nDID IT WORK?' },
  { from: 'BROADCAST GHOST',  msg: 'THIS FREQUENCY WAS\nDECOMMISSIONED IN 1987.\nHOW ARE YOU WATCHING?' },
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

// Morse-encoded messages (visual dots and dashes)
export const MORSE_MESSAGES = [
  { decoded: 'HELLO', morse: '.... . .-.. .-.. ---' },
  { decoded: 'WHO ARE YOU', morse: '.-- .... ---   .- .-. .   -.-- --- ..-' },
  { decoded: 'STAY', morse: '... - .- -.--' },
  { decoded: 'WATCH', morse: '.-- .- - -.-. ....' },
  { decoded: 'SIGNAL FOUND', morse: '... .. --. -. .- .-..   ..-. --- ..- -. -..' },
  { decoded: 'NOT ALONE', morse: '-. --- -   .- .-.. --- -. .' },
]

// Static GIF pool (themed)
export const CREEPY_GIFS = [
  { url: 'https://media.giphy.com/media/3o7aD2d7hy9ktXNDP2/giphy.gif', msg: 'SEARCHING FOR SIGNAL...' },
  { url: 'https://media.giphy.com/media/26tknCqiJrBQG6bxC/giphy.gif', msg: 'WE ARE STILL HERE' },
  { url: 'https://media.giphy.com/media/xT0GqtcVR0jOXzmmPK/giphy.gif', msg: 'PLEASE DO NOT CHANGE THE CHANNEL' },
  { url: 'https://media.giphy.com/media/3o7aCSPqXE5C6T8tBC/giphy.gif', msg: 'SIGNAL INTERRUPTED' },
  { url: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif', msg: 'DO YOU SEE IT TOO?' },
  { url: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', msg: 'THIS PROGRAM HAS ENDED' },
  { url: 'https://media.giphy.com/media/3oEjHYqzMSPZd6YvYs/giphy.gif', msg: 'REWINDING...' },
  { url: 'https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif', msg: 'LOADING NEXT REALITY...' },
]

export const EERIE_GIFS = [
  { url: 'https://media.giphy.com/media/26BRsLG9GIWDIB0oM/giphy.gif', msg: 'IT IS WATCHING' },
  { url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', msg: 'HELLO AGAIN' },
  { url: 'https://media.giphy.com/media/l41YnDn1KXGPF5PnO/giphy.gif', msg: 'YOU CANNOT LOOK AWAY' },
  { url: 'https://media.giphy.com/media/3o6MbdRAwIFJN3KXyE/giphy.gif', msg: 'STILL TRANSMITTING' },
]

// Cryptic messages for live GIFs (randomized per fire)
export const GIF_MSGS = {
  creepy: [
    'SEARCHING FOR SIGNAL...',
    'STILL TRANSMITTING',
    'DO NOT CHANGE THE CHANNEL',
    'SIGNAL INTERRUPTED',
    'DO YOU SEE IT TOO?',
    'THIS PROGRAM HAS ENDED',
    'PLEASE STAND BY',
    'WE ARE STILL HERE',
    'LOADING NEXT REALITY...',
    'RECEIVING...',
  ],
  eerie: [
    'IT IS WATCHING',
    'HELLO AGAIN',
    'YOU CANNOT LOOK AWAY',
    'WE HAVE ALWAYS BEEN HERE',
    'FOUND YOU',
    'DO NOT ADJUST YOUR SET',
    'THE SIGNAL PERSISTS',
    'ARE YOU STILL THERE?',
  ],
}

// ─────────────────────────────────────────────
//  PROBABILITY CONFIG
// ─────────────────────────────────────────────
const BASE_CHANCE  = 0.028   // ~2.8% per flip — overrideable via anomalyChance prop
const MIN_COOLDOWN = 10      // min flips between anomalies

// ─────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────
export function useAnomaly(anomalyChance = BASE_CHANCE) {
  const flipCountRef       = useRef(0)
  const lastAnomalyFlipRef = useRef(-MIN_COOLDOWN)
  // Pre-fetched API data so overlays render instantly
  const prefetchedRef      = useRef({})

  // Background prefetch API data so it's ready when anomaly fires
  async function prefetchApiData() {
    try {
      const [joke, fact, advice, weather, numFact, creepyGif, eerieGif, analogGif, surrealGif, asciiArt] = await Promise.allSettled([
        fetchJoke(),
        fetchFact(),
        fetchAdvice(),
        fetchWeatherFact(),
        fetchNumberFact(),
        fetchGif('creepy'),
        fetchGif('eerie'),
        fetchGif('analog'),
        fetchGif('surreal'),
        fetchAsciiArt(),
      ])
      prefetchedRef.current = {
        joke:       joke.status      === 'fulfilled' ? joke.value      : null,
        fact:       fact.status      === 'fulfilled' ? fact.value      : null,
        advice:     advice.status    === 'fulfilled' ? advice.value    : null,
        weather:    weather.status   === 'fulfilled' ? weather.value   : null,
        numFact:    numFact.status   === 'fulfilled' ? numFact.value   : null,
        creepyGif:  creepyGif.status === 'fulfilled' ? creepyGif.value  : null,
        eerieGif:   eerieGif.status  === 'fulfilled' ? eerieGif.value   : null,
        analogGif:  analogGif.status === 'fulfilled' ? analogGif.value  : null,
        surrealGif: surrealGif.status=== 'fulfilled' ? surrealGif.value : null,
        asciiArt:   asciiArt.status  === 'fulfilled' ? asciiArt.value   : null,
        fetchedAt: Date.now(),
      }
    } catch {}
  }

  // ── check() — call on every channel flip ──────────────────────────────────
  function check() {
    flipCountRef.current++
    const since = flipCountRef.current - lastAnomalyFlipRef.current
    if (since < MIN_COOLDOWN) return null

    const chance = anomalyChance + Math.min(0.05, (since - MIN_COOLDOWN) * 0.003)
    if (Math.random() > chance) return null

    lastAnomalyFlipRef.current = flipCountRef.current

    // Pick a random anomaly
    const anomaly = ANOMALIES[Math.floor(Math.random() * ANOMALIES.length)]
    return anomaly
  }

  // ── buildData() — build overlay-specific payload ──────────────────────────
  function buildData(anomalyId) {
    const p = prefetchedRef.current

    switch (anomalyId) {
      case 'system_message':
        return { message: SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)] }

      case 'broadcast_warning':
        return { warning: BROADCAST_WARNINGS[Math.floor(Math.random() * BROADCAST_WARNINGS.length)] }

      case 'ascii_face': {
        // Use live ASCII art from API, fall back to hand-crafted faces
        const live = p.asciiArt
        if (live?.art) return { face: live.art, word: live.word }
        return { face: ASCII_FACES[Math.floor(Math.random() * ASCII_FACES.length)] }
      }

      case 'static_gif': {
        // Cycle through live GIF sources — analog/creepy themed
        const gif = p.analogGif ?? p.creepyGif
        if (gif?.url) return { gif: { url: gif.url, msg: GIF_MSGS.creepy[Math.floor(Math.random() * GIF_MSGS.creepy.length)] } }
        return { gif: CREEPY_GIFS[Math.floor(Math.random() * CREEPY_GIFS.length)] }
      }

      case 'eerie_gif': {
        const gif = p.eerieGif ?? p.surrealGif ?? p.creepyGif
        if (gif?.url) return { gif: { url: gif.url, msg: GIF_MSGS.eerie[Math.floor(Math.random() * GIF_MSGS.eerie.length)] } }
        return { gif: EERIE_GIFS[Math.floor(Math.random() * EERIE_GIFS.length)] }
      }

      case 'late_night_joke':
        return { joke: p.joke ?? "Why did the TV turn itself on?\n\nBecause it never really turns off." }

      case 'cryptic_fact':
        return {
          fact: p.fact ?? 'A group of crows is called a murder.\nThis has always seemed accurate.',
          label: Math.random() > 0.5 ? 'FACT INTERCEPTED' : 'TRANSMISSION RECEIVED',
        }

      case 'unsolicited_advice':
        return { advice: p.advice ?? 'Stop looking at screens so late.\nSomething might look back.' }

      case 'weather_intercept':
        return p.weather
          ? { location: p.weather.location, temp: p.weather.temp, wind: p.weather.wind }
          : { location: 'UNKNOWN LOCATION', temp: '??', wind: '??' }

      case 'number_transmission':
        return p.numFact
          ? { number: p.numFact.number, text: p.numFact.text }
          : { number: Math.floor(Math.random() * 999), text: 'This number has been flagged.' }

      case 'viewer_count': {
        const n = Math.floor(Math.random() * 3) // 0, 1, or 2 viewers
        return { count: n }
      }

      case 'signal_decoded':
        return { morse: MORSE_MESSAGES[Math.floor(Math.random() * MORSE_MESSAGES.length)] }

      case 'static_poem':
        return { poem: CRYPTIC_POEMS[Math.floor(Math.random() * CRYPTIC_POEMS.length)] }

      case 'lost_transmission':
        return { tx: LOST_TRANSMISSIONS[Math.floor(Math.random() * LOST_TRANSMISSIONS.length)] }

      case 'countdown': {
        const from = Math.floor(Math.random() * 7) + 4
        return { from }
      }

      case 'mirror_test':
        return { seed: Math.random() }

      case 'classified_footage': {
        const level = CLASSIFIED_LEVELS[Math.floor(Math.random() * CLASSIFIED_LEVELS.length)]
        const lines = shuffle([...REDACTED_LINES]).slice(0, 4)
        return { level, lines }
      }

      case 'time_glitch': {
        const offsets = [-1, -2, -5, -10, -60, 1, 2, 5, 10]
        const offset  = offsets[Math.floor(Math.random() * offsets.length)]
        const wrong   = new Date(Date.now() + offset * 60 * 1000)
        return {
          wrong: wrong.toLocaleTimeString(),
          right: new Date().toLocaleTimeString(),
          diff:  offset > 0 ? `${offset}min ahead` : `${Math.abs(offset)}min behind`,
        }
      }

      case 'morse_code':
        return { morse: MORSE_MESSAGES[Math.floor(Math.random() * MORSE_MESSAGES.length)] }

      case 'pixel_eyes': {
        // Generate random pixel art eye positions
        const eyes = Array.from({ length: 2 + Math.floor(Math.random() * 4) }, () => ({
          x: Math.floor(Math.random() * 8),
          y: Math.floor(Math.random() * 6),
        }))
        return { eyes }
      }

      default:
        return {}
    }
  }

  // Trigger prefetch immediately on mount, refresh every 5 min
  useEffect(() => {
    prefetchApiData()
    const t = setInterval(prefetchApiData, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line

  return { check, buildData }
}

// helper used in shuffle inside buildData
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
