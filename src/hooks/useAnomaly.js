// src/hooks/useAnomaly.js
import { useRef } from 'react'
import { fetchGif, fetchAsciiArt, fetchQuote } from '../api'

// ─────────────────────────────────────────────
//  CONTENT LIBRARIES
// ─────────────────────────────────────────────

export const AS_BUMP_TEXTS = [
  // Self-aware / viewer aware
  ["we know you're still awake."],
  ["go to bed."],
  ["stop."],
  ["please."],
  ["we said goodnight.", "we meant it."],
  ["the television is not your friend.", "it is, however, still on."],
  ["you have been watching for a while.", "we're not judging.", "we are, though."],
  ["this channel does not need you.", "it is broadcasting anyway."],
  ["something is wrong with your set.", "it may be you."],
  ["we can see the remote from here."],
  ["not all channels exist.", "this one barely does."],
  ["nobody watches this channel.", "except you.", "we noticed."],
  ["you've seen this before.", "you will see this again."],
  ["the person next to you is asleep."],
  ["nobody is next to you.", "that's fine."],
  ["this is a test.", "you failed.", "we're still broadcasting."],
  ["the signal is fine.", "you are the signal."],
  ["we are still broadcasting.", "we don't know why."],
  ["you are not the target demographic.", "there is no target demographic."],
  ["please don't change the channel.", "we noticed when you did."],
  ["this channel remembers you.", "from last time."],
  ["some of these are real shows.", "this one is not one of them."],
  ["none of this is happening.", "you're still watching though."],
  ["the screen is off.", "you're imagining this."],
  ["it's late.", "you already knew that."],
  ["this message will not repeat.", "this message will not repeat."],
  // Broadcast / signal
  ["the broadcast continues regardless of viewership."],
  ["signal strength: adequate.", "reason for broadcast: unknown."],
  ["we have been on the air for", "longer than you've been awake."],
  ["you are channel 1.", "we are watching you back."],
  ["there are other people watching this right now.", "none of them know about the others."],
  ["this channel is licensed to broadcast.", "the license expired in 2003."],
  ["the camera is off.", "it's pointing at you anyway."],
  ["the next channel is worse.", "the one after that is fine."],
  ["you are the only one who can hear this.", "that is not a compliment."],
  ["we are legally required to tell you:", "nothing you are watching is real."],
  ["all content on this channel is", "pre-approved for late night viewing."],
  ["this channel has been on the air since 1987.", "nobody noticed when it started."],
  ["this is emergency broadcast system audio.", "the emergency is: you."],
  ["we are receiving your signal too.", "it's mostly static."],
  ["transmission quality: poor.", "viewer quality: also poor.", "we're all doing our best."],
  // Absurdist
  ["have you tried turning yourself off", "and on again."],
  ["the television does not love you.", "but it doesn't have to."],
  ["the knob goes all the way to 72.", "don't touch 72."],
  ["some channels loop.", "you may already be in a loop."],
  ["the remote is in the couch.", "you know this. you're not moving."],
  ["what were you looking for", "when you started watching?"],
  ["this channel ends at 4am.", "we haven't decided what comes next."],
  ["your eyes have adjusted to the dark.", "that took 20 minutes."],
  ["you blinked.", "we saw it."],
  ["the television doesn't know where you are.", "it has a guess though."],
  ["channel 1 is you.", "you've been watching yourself this whole time."],
  ["this is not the channel you were looking for.", "this is the channel you found."],
  ["the show you want is on another channel.", "we know which one.", "we won't say."],
  ["there are 900 channels.", "you're on this one."],
  ["the test pattern comes on at 4.", "it means something.", "we never found out what."],
  ["you can change the channel.", "we can change it back."],
  ["this program contains scenes of television.", "viewer discretion is advised."],
  ["everything you see on television is real.", "including this.", "especially this."],
  // Minimal
  ["later."],
  ["okay."],
  ["hm."],
  ["interesting."],
  ["noted."],
  ["we'll talk."],
  ["not yet."],
  ["soon."],
  ["still."],
  ["wait."],
  ["oh."],
  // Time-aware
  ["it's after midnight.", "you made a choice."],
  ["the next morning is getting closer.", "you're making it worse."],
  ["you could sleep now.", "the channel will be here.", "it's always here."],
  ["at 4am everything looks different.", "this channel looks the same."],
  ["the dark outside is not the dark in here.", "they're related though."],
]

export const MUNDANE_IMAGES = [
  { url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=900&q=65", label: "PARKING STRUCTURE · LEVEL B2" },
  { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=65", label: "CORRIDOR · FLOOR 3 · NO OCCUPANTS" },
  { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=65", label: "WAITING AREA · UNOCCUPIED" },
  { url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=900&q=65", label: "HOSPITAL CORRIDOR · 03:00" },
  { url: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=900&q=65", label: "OFFICE SPACE · NIGHT · LIGHTS ON" },
  { url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=900&q=65", label: "LOADING BAY · OVERNIGHT" },
  { url: "https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=900&q=65", label: "STAIRWELL · EAST WING" },
  { url: "https://images.unsplash.com/photo-1602526432604-029a709e131b?w=900&q=65", label: "LAUNDROMAT · MACHINES IDLE" },
  { url: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=900&q=65", label: "HIGHWAY · 02:48 · MINIMAL TRAFFIC" },
  { url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=65", label: "SHOPPING AREA · AFTER HOURS" },
  { url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=65", label: "GYM FLOOR · POST-CLOSE" },
  { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=65", label: "FIELD · NO ACTIVITY DETECTED" },
  { url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900&q=65", label: "STREET · 3AM · NO PEDESTRIANS" },
  { url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=900&q=65", label: "CITY BLOCK · LIGHTS ON · EMPTY" },
  { url: "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=900&q=65", label: "MOTEL EXTERIOR · VACANCY" },
  { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=65", label: "OFFICE LOBBY · 02:48 · UNMANNED" },
  { url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&q=65", label: "CONFERENCE ROOM · UNUSED" },
  { url: "https://images.unsplash.com/photo-1508919801845-fc2ae1bc2a28?w=900&q=65", label: "BUS STOP · NO SCHEDULE POSTED" },
  { url: "https://images.unsplash.com/photo-1499336315816-097655dcfbda?w=900&q=65", label: "HOTEL HALLWAY · FLOOR 8" },
  { url: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900&q=65", label: "COFFEE SHOP · CLOSED" },
  { url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=65", label: "CONVENTION FLOOR · EMPTY" },
  { url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=65", label: "SUBURBAN STREET · PORCH LIGHTS ON" },
  { url: "https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?w=900&q=65", label: "VENDING MACHINE · UNIT 7 · STOCKED" },
  { url: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=900&q=65", label: "MONITOR · LOCKED SCREEN" },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=65", label: "ELEVATOR · FLOOR 4 · NO PASSENGERS" },
  { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=65", label: "RESTAURANT INTERIOR · CHAIRS UP" },
  { url: "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=900&q=65", label: "BACKYARD · NIGHT · LIGHT ON" },
  { url: "https://images.unsplash.com/photo-1527853787696-f7be74f2e39a?w=900&q=65", label: "CEILING · NO ANNOTATION" },
  { url: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=900&q=65", label: "ROAD · LONG EXPOSURE · NO CARS" },
  { url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=65", label: "ROOFTOP · NIGHTTIME · UNOCCUPIED" },
  { url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=65", label: "FOREST EDGE · NIGHT · NO MOVEMENT" },
  { url: "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=900&q=65", label: "BRIDGE · LOW TRAFFIC · 04:01" },
]

export const FAKE_COMMERCIALS = [
  {
    headline: null,
    lines: ["Have you tried not watching television?"],
    tagline: "NOCTURNE",
    tone: true,
  },
  {
    headline: "NOCTURNE",
    lines: ["for people who can't sleep.", "we understand."],
    tagline: null,
    tone: false,
  },
  {
    headline: null,
    lines: ["Ask your doctor if staying awake is right for you."],
    tagline: "side effects include: seeing this ad.",
    tone: true,
  },
  {
    headline: null,
    lines: ["This message brought to you by nothing."],
    tagline: null,
    tone: false,
  },
  {
    headline: "ATTENTION:",
    lines: ["you are currently watching television."],
    tagline: "this has been a paid announcement.",
    tone: true,
  },
  {
    headline: null,
    lines: ["Are you sitting comfortably?", "good.", "don't get up."],
    tagline: null,
    tone: false,
  },
  {
    headline: null,
    lines: ["Introducing: nothing.", "available: nowhere.", "price: irrelevant."],
    tagline: null,
    tone: true,
  },
  {
    headline: "NEW",
    lines: ["television.", "now with more broadcast.", "only on this channel."],
    tagline: null,
    tone: false,
  },
  {
    headline: null,
    lines: ["We interrupt this programming", "to bring you this programming."],
    tagline: "REGULAR BROADCASTING HAS BEEN SUSPENDED.",
    tone: true,
  },
  {
    headline: null,
    lines: ["The television works.", "you checked.", "it's fine."],
    tagline: null,
    tone: false,
  },
  {
    headline: null,
    lines: ["brought to you by:", "the space between channels."],
    tagline: null,
    tone: true,
  },
  {
    headline: "REMINDER",
    lines: ["to drink water.", "to close your eyes.", "to try."],
    tagline: null,
    tone: false,
  },
  {
    headline: null,
    lines: ["Your viewing habits", "are being measured.", "not by us."],
    tagline: null,
    tone: true,
  },
  {
    headline: null,
    lines: ["This time slot is sponsored by", "the 3am you always end up at."],
    tagline: null,
    tone: false,
  },
  {
    headline: "NOCTURNE PRESENTS",
    lines: ["a moment of silence", "for the channels you'll never find."],
    tagline: null,
    tone: true,
  },
  {
    headline: null,
    lines: ["PLEASE STAND BY", "we lost the program.", "we're not looking very hard."],
    tagline: null,
    tone: false,
  },
  {
    headline: null,
    lines: ["If you are watching this at 3am or later,", "please know that we see you."],
    tagline: "we always see you.",
    tone: true,
  },
  {
    headline: null,
    lines: ["The credits are:", "not available."],
    tagline: "end of program.",
    tone: false,
  },
  {
    headline: null,
    lines: ["SLEEP", "is a product.", "it is not sold here."],
    tagline: null,
    tone: true,
  },
  {
    headline: null,
    lines: ["You've been watching for a while.", "We appreciate your loyalty.", "Please go home.", "You're already home."],
    tagline: null,
    tone: false,
  },
  {
    headline: "A MESSAGE FROM YOUR TELEVISION",
    lines: ["I am doing my best."],
    tagline: null,
    tone: true,
  },
  {
    headline: null,
    lines: ["This channel is provided free of charge.", "No charge is possible.", "You owe us nothing.", "This changes nothing."],
    tagline: null,
    tone: false,
  },
]

export const ERROR_MESSAGES = [
  { code: "VIDEO_MEM_FAULT", detail: "FRAME 847 CORRUPTED", note: "THIS IS THE 3RD TIME THIS SESSION" },
  { code: "VIEWER_REG_FAILED", detail: "CONTINUING ANYWAY", note: "YOUR PRESENCE HAS BEEN NOTED" },
  { code: "SIGNAL_INTEGRITY_12%", detail: "THRESHOLD: 14%", note: "BROADCASTING REGARDLESS" },
  { code: "CLOCK_DESYNC", detail: "LOCAL TIME REJECTED", note: "ADOPTING BROADCAST TIME" },
  { code: "ERR_CHANNEL_BLEED", detail: "ADJACENT SIGNAL DETECTED", note: "SOURCE: UNREGISTERED" },
  { code: "RENDER_TIMEOUT", detail: "FRAME HELD INDEFINITELY", note: "THIS IS INTENTIONAL" },
  { code: "AUDIO_PHASE_INV", detail: "SOUND IS BACKWARDS", note: "DO NOT ADJUST YOUR SET" },
  { code: "MEMORY_OVERWRITE", detail: "ADDR 0xA3F8 MODIFIED", note: "BY UNKNOWN PROCESS" },
  { code: "NULL_CHANNEL_REF", detail: "NO SOURCE FOUND", note: "CHANNEL EXISTS ANYWAY" },
  { code: "BUFFER_OVERFLOW", detail: "EXCESS CONTENT DISCARDED", note: "SOME OF IT WAS YOURS" },
  { code: "VIEWER_COUNT_ERR", detail: "COUNT EXCEEDS EXPECTED", note: "EXTRA VIEWERS UNACCOUNTED FOR" },
  { code: "TIMESTAMP_INVALID", detail: "THIS TIME DOES NOT EXIST", note: "PROCEED NORMALLY" },
  { code: "SIGNAL_LOOP_DETECT", detail: "SAME FRAME RECEIVED 6x", note: "BREAKING LOOP... FAILED" },
  { code: "REGION_MISMATCH", detail: "BROADCAST ZONE UNKNOWN", note: "TRANSMITTING ANYWAY" },
  { code: "AUTH_TOKEN_EXPIRED", detail: "VIEWING UNAUTHORIZED", note: "AUTHORIZATION NO LONGER REQUIRED" },
  { code: "DMA_TRANSFER_FAIL", detail: "PARTIAL IMAGE RECEIVED", note: "REMAINING DATA: UNKNOWN" },
  { code: "ENCODER_FAULT", detail: "OUTPUT MAY DIFFER FROM INPUT", note: "DIFFERENCE: UNSPECIFIED" },
  { code: "WATCHDOG_TIMEOUT", detail: "PROCESS FAILED TO RESPOND", note: "PROCESS: YOU" },
  { code: "COLOR_LUT_CORRUPT", detail: "HUES REMAPPED INCORRECTLY", note: "VISUAL DIFFERENCE: MINOR" },
  { code: "CARRIER_LOST", detail: "SIGNAL RECONSTRUCTED FROM NOISE", note: "ACCURACY: 67%" },
  { code: "INDEX_FAULT", detail: "CHANNEL LIST PARTIAL", note: "MISSING CHANNELS: UNKNOWN" },
  { code: "LATENCY_SPIKE", detail: "BROADCAST DELAYED 14 MIN", note: "WHAT YOU ARE WATCHING ALREADY HAPPENED" },
  { code: "SESSION_ANOMALY", detail: "BEHAVIOR OUTSIDE EXPECTED RANGE", note: "LOGGED" },
  { code: "SYNC_PULSE_MISS", detail: "3 CONSECUTIVE FRAMES DROPPED", note: "YOU DID NOT NOTICE" },
  { code: "DECODE_WARN", detail: "UNKNOWN CODEC ACCEPTED", note: "PLAYING REGARDLESS" },
  { code: "GHOST_SIGNAL", detail: "SECOND CARRIER WAVE DETECTED", note: "ORIGIN: NOT THIS TOWER" },
  { code: "USER_STATE_CORRUPT", detail: "VIEWER RECORD MODIFIED", note: "BY: BROADCAST SYSTEM" },
  { code: "THERMAL_LIMIT", detail: "TUBE TEMPERATURE NOMINAL", note: "LAST CALIBRATION: 1994" },
  { code: "RF_INTERFERENCE", detail: "EXTERNAL SOURCE DETECTED", note: "SOURCE LOCATION: YOUR BUILDING" },
  { code: "PAGE_FAULT_0x0000", detail: "NULL POINTER IN SCHEDULER", note: "SCHEDULER: BROADCAST SCHEDULE" },
  { code: "HEAP_CORRUPTED", detail: "VIEWER DATA INVALIDATED", note: "REBUILDING FROM DEFAULTS" },
  { code: "STACK_OVERFLOW_7", detail: "RECURSION DEPTH EXCEEDED", note: "YOU HAVE BEEN HERE BEFORE" },
  { code: "ERR_HANDSHAKE_FAIL", detail: "CHANNEL REFUSED AUTHENTICATION", note: "WATCHING ANYWAY" },
  { code: "ORPHANED_PROCESS", detail: "PARENT PROCESS: NOT FOUND", note: "RUNNING WITHOUT SUPERVISION" },
  { code: "ASSERT_FAILED", detail: "VIEWER EXISTS: FALSE", note: "CONDITION IGNORED, CONTINUING" },
]

export const IDLE_MESSAGES = [
  "still there?",
  "still watching?",
  "you haven't moved.",
  "we noticed.",
  "it noticed.",
  "blink twice if you're ok.",
  "the television is concerned.",
  "are you still here?",
  "you've been very still.",
  "we can wait.",
  "we've been waiting.",
  "is anyone watching this?",
  "hello?",
  "hello.",
  "okay.",
  "you can go.",
  "the channel will still be here.",
  "wherever here is.",
  "you fell asleep, didn't you.",
  "the tv doesn't sleep.",
  "it's still on.",
  "we're still here.",
  "take your time.",
  "no rush.",
  "are you okay?",
  "the remote is right there.",
  "the volume hasn't changed in a while.",
  "that's fine.",
]

export const WRONG_CHANNEL_IDS = [
  'CH \u2205',
  'CH LATE',
  'CH 0000',
  'CH NULL',
  'CH -1',
  'CH \u221e',
  'CH LOST',
  'CH \u2588\u2588\u2588\u2588',
  'CH ???',
  'CH ..',
  'CH VOID',
  'CH ERR',
  'CH \u25cc',
  'CH DEAD',
  'CH SOON',
  'CH BACK',
  'CH HERE',
  'CH NONE',
]

// ─────────────────────────────────────────────
//  ANOMALY REGISTRY
// ─────────────────────────────────────────────
export const ANOMALIES = [
  { id: 'static_heavy',    duration: 700,   type: 'static'  },
  { id: 'live_broadcast',  duration: 12000, type: 'overlay' },
  { id: 'as_bump',         duration: 6000,  type: 'overlay' },
  { id: 'mundane_still',   duration: 10000, type: 'overlay' },
  { id: 'fake_commercial', duration: 7000,  type: 'overlay' },
  { id: 'error_message',   duration: 8000,  type: 'overlay' },
]

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const BASE_CHANCE  = 0.028
const MIN_COOLDOWN = 1

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function pickUnique(array, seenSet) {
  if (seenSet.size >= Math.floor(array.length * 0.6)) seenSet.clear()
  const available = array.map((_, i) => i).filter(i => !seenSet.has(i))
  const idx = available[Math.floor(Math.random() * available.length)]
  seenSet.add(idx)
  return array[idx]
}

// ─────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────
export function useAnomaly(anomalyChance = BASE_CHANCE) {
  const flipCountRef       = useRef(0)
  const lastAnomalyFlipRef = useRef(-MIN_COOLDOWN)
  const seenGifsRef        = useRef(new Set())
  const seenBumpsRef       = useRef(new Set())
  const seenImagesRef      = useRef(new Set())
  const seenCommercialsRef = useRef(new Set())
  const seenErrorsRef      = useRef(new Set())

  function check() {
    flipCountRef.current++
    const since = flipCountRef.current - lastAnomalyFlipRef.current
    if (since < MIN_COOLDOWN) return null

    const chance = anomalyChance >= 0.12
      ? 1
      : anomalyChance + Math.min(0.05, (since - MIN_COOLDOWN) * 0.003)

    if (Math.random() > chance) return null

    lastAnomalyFlipRef.current = flipCountRef.current

    if (Math.random() < 0.15) {
      return { ...ANOMALIES.find(a => a.id === 'static_heavy'), duration: rand(1000, 6000) }
    }

    const r = Math.random()
    let id
    if      (r < 0.22) id = 'live_broadcast'
    else if (r < 0.46) id = 'as_bump'
    else if (r < 0.66) id = 'mundane_still'
    else if (r < 0.83) id = 'fake_commercial'
    else                id = 'error_message'

    const anomaly = ANOMALIES.find(a => a.id === id)
    const durations = {
      live_broadcast:  [10000, 15000],
      as_bump:         [5000,  8000],
      mundane_still:   [8000,  13000],
      fake_commercial: [6000,  10000],
      error_message:   [7000,  11000],
    }
    const [dMin, dMax] = durations[id]
    return { ...anomaly, duration: rand(dMin, dMax) }
  }

  async function buildData(anomalyId) {
    switch (anomalyId) {

      case 'live_broadcast': {
        const useGif = Math.random() < 0.7
        if (useGif) {
          const [gifResult, quoteResult] = await Promise.allSettled([
            fetchGifUnique(seenGifsRef),
            fetchQuote(),
          ])
          const gif   = gifResult.status === 'fulfilled'   ? gifResult.value   : null
          const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
          return { layout: 'gif_quote', gif, ascii: null, quote }
        } else {
          const [asciiResult, quoteResult] = await Promise.allSettled([
            fetchAsciiArt(),
            fetchQuote(),
          ])
          const ascii = asciiResult.status === 'fulfilled' ? asciiResult.value : null
          const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
          return { layout: 'ascii_quote', gif: null, ascii, quote }
        }
      }

      case 'as_bump': {
        const lines = pickUnique(AS_BUMP_TEXTS, seenBumpsRef)
        let quote = null
        if (Math.random() < 0.3) {
          quote = await fetchQuote().catch(() => null)
        }
        return { lines, quote }
      }

      case 'mundane_still': {
        const image = pickUnique(MUNDANE_IMAGES, seenImagesRef)
        return { image }
      }

      case 'fake_commercial': {
        const commercial = pickUnique(FAKE_COMMERCIALS, seenCommercialsRef)
        return { commercial }
      }

      case 'error_message': {
        const error = pickUnique(ERROR_MESSAGES, seenErrorsRef)
        return {
          error,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          addr: '0x' + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0'),
          count: rand(1, 7),
        }
      }

      default:
        return {}
    }
  }

  return { check, buildData }
}

async function fetchGifUnique(seenRef, attempts = 0) {
  const result = await fetchGif()
  if (!result?.url) return result
  if (seenRef.current.has(result.url) && attempts < 3) {
    return fetchGifUnique(seenRef, attempts + 1)
  }
  if (seenRef.current.size > 40) seenRef.current.clear()
  seenRef.current.add(result.url)
  return result
}
