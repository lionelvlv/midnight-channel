// src/api.js — multi-source search + external content APIs for anomaly events

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const YT_URL         = 'https://www.googleapis.com/youtube/v3/search'
const LS_PREFIX      = 'nc_'
const YT_TTL         = 24 * 60 * 60 * 1000
const ARCH_TTL       = 7  * 24 * 60 * 60 * 1000
const DM_TTL         = 6  * 60 * 60 * 1000       // Dailymotion: 6h
const JOKE_TTL       = 30 * 60 * 1000             // jokes/trivia: 30 min (stay fresh)
const MAX_LS_ENTRIES = 80

// ─────────────────────────────────────────────
//  L1 IN-MEMORY CACHE
// ─────────────────────────────────────────────
const memCache = new Map()

function memGet(key) {
  const hit = memCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.ts > hit.ttl) { memCache.delete(key); return null }
  return hit.data
}
function memSet(key, data, ttl) { memCache.set(key, { data, ts: Date.now(), ttl }) }

// ─────────────────────────────────────────────
//  L2 LOCALSTORAGE CACHE
// ─────────────────────────────────────────────
function lsKey(k) { return LS_PREFIX + k }

function lsGet(key, ttl) {
  try {
    const raw = localStorage.getItem(lsKey(key))
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > ttl) { localStorage.removeItem(lsKey(key)); return null }
    return data
  } catch { return null }
}

function lsSet(key, data, ttl) {
  if (!data) return
  try {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX))
    if (allKeys.length >= MAX_LS_ENTRIES) {
      const entries = allKeys.map(k => {
        try { return { k, ts: JSON.parse(localStorage.getItem(k)).ts } } catch { return { k, ts: 0 } }
      }).sort((a, b) => a.ts - b.ts)
      entries.slice(0, Math.ceil(MAX_LS_ENTRIES * 0.2)).forEach(e => localStorage.removeItem(e.k))
    }
    localStorage.setItem(lsKey(key), JSON.stringify({ data, ts: Date.now() }))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX)).forEach(k => localStorage.removeItem(k))
      try { localStorage.setItem(lsKey(key), JSON.stringify({ data, ts: Date.now() })) } catch {}
    }
  }
}

function cacheGet(key, ttl)      { return memGet(key) ?? lsGet(key, ttl) ?? null }
function cacheSet(key, data, ttl) { if (!data) return; memSet(key, data, ttl); lsSet(key, data, ttl) }

// ─────────────────────────────────────────────
//  IN-FLIGHT DEDUPLICATION
// ─────────────────────────────────────────────
const _inflight = new Map()
function dedupe(key, fetcher) {
  if (_inflight.has(key)) return _inflight.get(key)
  const p = fetcher().finally(() => _inflight.delete(key))
  _inflight.set(key, p)
  return p
}

// ─────────────────────────────────────────────
//  YOUTUBE
// ─────────────────────────────────────────────
const exhaustedKeys = new Set()

function getViteKeys() {
  const keys = []
  for (let i = 1; i <= 10; i++) {
    const k = import.meta.env[`VITE_YOUTUBE_API_KEY_${i}`]
    if (k && !exhaustedKeys.has(k)) keys.push(k)
  }
  const single = import.meta.env.VITE_YOUTUBE_API_KEY
  if (single && !exhaustedKeys.has(single)) keys.push(single)
  return keys
}

async function ytFetchWithKey(key, query, opts) {
  const { order, publishedAfter, publishedBefore } = opts
  const p = new URLSearchParams({ part: 'snippet', q: query, type: 'video', maxResults: 20, order, key })
  if (publishedAfter)  p.set('publishedAfter',  publishedAfter)
  if (publishedBefore) p.set('publishedBefore', publishedBefore)
  const res  = await fetch(`${YT_URL}?${p}`)
  const data = await res.json()
  const reason = data?.error?.errors?.[0]?.reason
  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') { exhaustedKeys.add(key); return { exhausted: true } }
  if (!res.ok || data.error) throw new Error(data?.error?.message ?? `YT ${res.status}`)
  return { data }
}

async function ytFetchViaProd(query, opts) {
  const { order, publishedAfter, publishedBefore } = opts
  const p = new URLSearchParams({ q: query, order })
  if (publishedAfter)  p.set('publishedAfter',  publishedAfter)
  if (publishedBefore) p.set('publishedBefore', publishedBefore)
  const res = await fetch(`/api/search?${p}`)
  if (res.status === 429) return { exhausted: true }
  if (!res.ok) throw new Error(`Proxy ${res.status}`)
  const data = await res.json()
  if (typeof data.error === 'string' && data.error.includes('exhausted')) return { exhausted: true }
  if (data.error) throw new Error(data.error)
  return { data }
}

export async function ytSearch(query, opts = {}) {
  const order = opts.order ?? 'relevance'
  const after = opts.publishedAfter  ?? ''
  const before= opts.publishedBefore ?? ''
  const cacheKey = `yt:${query}:${order}:${after}:${before}`
  const cached = cacheGet(cacheKey, YT_TTL)
  if (cached) return cached
  return dedupe(cacheKey, async () => {
    const fullOpts = { order, publishedAfter: after || undefined, publishedBefore: before || undefined }
    for (const key of getViteKeys()) {
      try {
        const r = await ytFetchWithKey(key, query, fullOpts)
        if (r.exhausted) continue
        cacheSet(cacheKey, r.data, YT_TTL); return r.data
      } catch {}
    }
    try {
      const r = await ytFetchViaProd(query, fullOpts)
      if (!r.exhausted) { cacheSet(cacheKey, r.data, YT_TTL); return r.data }
    } catch {}
    return { items: [], _exhausted: true }
  })
}

export function isYouTubeExhausted(data) { return data?._exhausted === true }

// ─────────────────────────────────────────────
//  INTERNET ARCHIVE
// ─────────────────────────────────────────────
export async function archiveSearch(query) {
  const cacheKey = `arch:${query}`
  const cached = cacheGet(cacheKey, ARCH_TTL)
  if (cached) return cached
  return dedupe(cacheKey, async () => {
    try {
      const p = new URLSearchParams({
        q: `${query} AND mediatype:movies`, fl: 'identifier,title,description',
        rows: 20, output: 'json', sort: 'downloads desc',
      })
      const res  = await fetch(`https://archive.org/advancedsearch.php?${p}`)
      if (!res.ok) return null
      const raw  = await res.json()
      const items = (raw?.response?.docs ?? []).map(doc => ({
        source: 'archive', id: { videoId: doc.identifier },
        snippet: { title: doc.title ?? doc.identifier, description: doc.description ?? '' },
      }))
      if (items.length) cacheSet(cacheKey, items, ARCH_TTL)
      return items.length ? items : null
    } catch { return null }
  })
}

// ─────────────────────────────────────────────
//  DAILYMOTION  (no API key required)
// ─────────────────────────────────────────────
// Curated tags that produce interesting, varied content
export const DM_TAG_GROUPS = [
  ['documentary', 'nature', 'science'],
  ['travel', 'adventure', 'explore'],
  ['history', 'vintage', 'classic'],
  ['space', 'astronomy', 'nasa'],
  ['animals', 'wildlife', 'ocean'],
  ['cooking', 'food', 'street-food'],
  ['music', 'concert', 'live'],
  ['sport', 'extreme', 'action'],
  ['art', 'culture', 'photography'],
  ['technology', 'innovation', 'future'],
]

export async function dailymotionSearch(tags = []) {
  const tagStr   = tags.length ? tags.join(',') : 'documentary'
  const cacheKey = `dm:${tagStr}`
  const cached   = cacheGet(cacheKey, DM_TTL)
  if (cached) return cached

  return dedupe(cacheKey, async () => {
    try {
      const p = new URLSearchParams({
        fields:  'id,title,description,thumbnail_60_url',
        limit:   20,
        sort:    'random',
        tags:    tagStr,
        private: 0,
        // family_filter keeps it safe
        family_filter: 1,
      })
      const res  = await fetch(`https://api.dailymotion.com/videos?${p}`)
      if (!res.ok) return null
      const data = await res.json()
      const items = (data?.list ?? []).map(v => ({
        source:  'dailymotion',
        id:      { videoId: v.id },
        snippet: { title: v.title ?? '', description: v.description ?? '' },
      }))
      if (items.length) cacheSet(cacheKey, items, DM_TTL)
      return items.length ? items : null
    } catch { return null }
  })
}

// ─────────────────────────────────────────────
//  CONTENT APIs FOR ANOMALY EVENTS
// ─────────────────────────────────────────────

// Joke API (JokeAPI v2 — free, no key)
export async function fetchJoke() {
  const cacheKey = `joke:${Math.floor(Date.now() / JOKE_TTL)}`
  const cached   = cacheGet(cacheKey, JOKE_TTL)
  if (cached) return cached
  try {
    // Get a batch, store them, pop one at a time
    const batchKey = `jokebatch:${Math.floor(Date.now() / JOKE_TTL)}`
    let batch = memGet(batchKey)
    if (!batch?.length) {
      const res  = await fetch('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist&type=single&amount=10')
      if (!res.ok) throw new Error('joke fetch failed')
      const data = await res.json()
      batch = (data.jokes ?? [data]).filter(j => j.joke).map(j => j.joke)
      memSet(batchKey, batch, JOKE_TTL)
    }
    const joke = batch.pop() ?? null
    memSet(batchKey, batch, JOKE_TTL)
    return joke
  } catch { return null }
}

// Random fact (uselessfacts API — free, no key)
export async function fetchFact() {
  try {
    const res  = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.text ?? null
  } catch { return null }
}

// Numbers API — random trivia about a number (free, no key)
export async function fetchNumberFact() {
  try {
    const n   = Math.floor(Math.random() * 999) + 1
    const res = await fetch(`http://numbersapi.com/${n}/trivia?json`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.found ? { number: n, text: data.text } : null
  } catch { return null }
}

// Dog/cat/fox image (random animal pic — free, no key)
export async function fetchAnimalImage() {
  const apis = [
    { url: 'https://dog.ceo/api/breeds/image/random', extract: d => d.message },
    { url: 'https://api.thecatapi.com/v1/images/search', extract: d => d[0]?.url },
    { url: 'https://randomfox.ca/floof/', extract: d => d.image },
  ]
  const api = apis[Math.floor(Math.random() * apis.length)]
  try {
    const res  = await fetch(api.url)
    if (!res.ok) throw new Error()
    const data = await res.json()
    return api.extract(data) ?? null
  } catch { return null }
}

// Advice Slip API — random advice (free, no key)
export async function fetchAdvice() {
  try {
    const res  = await fetch('https://api.adviceslip.com/advice')
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.slip?.advice ?? null
  } catch { return null }
}

// Open-Meteo API — current weather for a random city (free, no key)
// Used to generate "location data intercepted" anomaly
export async function fetchWeatherFact() {
  const cities = [
    { name: 'SIBERIA',     lat: 60.0,  lon: 105.0 },
    { name: 'ANTARCTICA',  lat: -75.0, lon: 0.0   },
    { name: 'CHERNOBYL',   lat: 51.27, lon: 30.22 },
    { name: 'MARIANA DEEP',lat: 11.35, lon: 142.2 },
    { name: 'BERMUDA',     lat: 32.3,  lon: -64.8 },
    { name: 'AREA 51',     lat: 37.24, lon: -115.8},
    { name: 'TUNGUSKA',    lat: 60.9,  lon: 101.9 },
  ]
  const city = cities[Math.floor(Math.random() * cities.length)]
  try {
    const p   = new URLSearchParams({ latitude: city.lat, longitude: city.lon, current: 'temperature_2m,wind_speed_10m', temperature_unit: 'fahrenheit' })
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    return {
      location: city.name,
      temp:     Math.round(data.current?.temperature_2m ?? 0),
      wind:     Math.round(data.current?.wind_speed_10m ?? 0),
    }
  } catch { return null }
}

// ─────────────────────────────────────────────
//  WARM CACHE
// ─────────────────────────────────────────────
export async function warmCache(seeds, opts = {}) {
  if (!seeds?.length) return
  const picks = [...seeds].sort(() => Math.random() - 0.5).slice(0, 4)
  await Promise.allSettled(picks.map(seed => ytSearch(seed, opts)))
}

// ─────────────────────────────────────────────
//  GIPHY — random themed GIFs (no key needed with public beta)
//  Uses public endpoint that works without auth for reasonable usage
// ─────────────────────────────────────────────
const GIPHY_TAGS = {
  creepy:  ['horror','glitch','static','disturbing','weird','trippy','analog','vhs'],
  eerie:   ['ghost','paranormal','haunted','spooky','fog','dark','watching'],
  analog:  ['television','static','broadcast','signal','old tv','noise'],
  surreal: ['surreal','bizarre','uncanny','strange','dreamlike','liminal'],
}

export async function fetchGif(mood = 'creepy') {
  const tags = GIPHY_TAGS[mood] ?? GIPHY_TAGS.creepy
  const tag  = tags[Math.floor(Math.random() * tags.length)]
  const cacheKey = `gif:${mood}:${tag}:${Math.floor(Date.now() / (10 * 60 * 1000))}` // 10min cache slot
  const cached = memGet(cacheKey)
  if (cached) return cached

  try {
    // Tenor public API — no key required
    const p = new URLSearchParams({
      q:       tag,
      limit:   20,
      media_filter: 'minimal',
      contentfilter: 'medium',
    })
    const res  = await fetch(`https://tenor.googleapis.com/v2/search?${p}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCyk`)
    if (res.ok) {
      const data = await res.json()
      const results = data?.results ?? []
      if (results.length) {
        const pick = results[Math.floor(Math.random() * results.length)]
        const url  = pick?.media_formats?.gif?.url ?? pick?.media_formats?.tinygif?.url
        if (url) { memSet(cacheKey, { url, tag }, 10 * 60 * 1000); return { url, tag } }
      }
    }
  } catch {}

  // Fallback: Giphy public beta endpoint
  try {
    const p = new URLSearchParams({ tag, rating: 'pg-13', api_key: 'dc6zaTOxFJmzC' }) // public beta key
    const res  = await fetch(`https://api.giphy.com/v1/gifs/random?${p}`)
    if (res.ok) {
      const data = await res.json()
      const url  = data?.data?.images?.original?.url ?? data?.data?.images?.fixed_height?.url
      if (url) { memSet(cacheKey, { url, tag }, 10 * 60 * 1000); return { url, tag } }
    }
  } catch {}

  return null
}

// ─────────────────────────────────────────────
//  ASCII ART — from textart.io / artii API
// ─────────────────────────────────────────────
const ASCII_WORDS = [
  'SIGNAL', 'WATCH', 'HELLO', 'ERROR', 'STATIC',
  'NOISE', 'FOUND', 'LOST', 'WAIT', 'STAY',
  'RUN', 'SLEEP', 'DREAM', 'DARK', 'WAKE',
]

export async function fetchAsciiArt() {
  const word = ASCII_WORDS[Math.floor(Math.random() * ASCII_WORDS.length)]
  const cacheKey = `ascii:${word}`
  const cached   = memGet(cacheKey)
  if (cached) return cached
  try {
    // artii.me — free ASCII art API, no key
    const res  = await fetch(`https://artii.me/make?text=${encodeURIComponent(word)}&font=banner`)
    if (!res.ok) throw new Error()
    const text = await res.text()
    if (text && text.trim().length > 5) {
      memSet(cacheKey, { art: text, word }, 60 * 60 * 1000)
      return { art: text, word }
    }
  } catch {}
  return null
}
