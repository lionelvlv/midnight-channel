// src/hooks/useChannel.js — multi-source, randomness-first pool management
import { useRef, useCallback, useEffect } from 'react'
import {
  ytSearch, archiveSearch, dailymotionSearch, wikimediaSearch,
  isYouTubeExhausted, warmCache,
  DM_TAG_GROUPS, WIKI_QUERIES,
} from '../api'

// ─────────────────────────────────────────────
//  SEED LISTS
// ─────────────────────────────────────────────
export const DEFAULT_SEEDS = [
  'documentary nature wildlife',
  'live music concert performance',
  'cooking food tutorial recipe',
  'travel world adventure explore',
  'science experiment technology',
  'vintage classic television show',
  'comedy entertainment sketch',
  'sports highlights best moments',
  'space astronomy universe',
  'ocean underwater sea',
  'city street urban life',
  'animals wildlife amazing',
  'history documentary ancient',
  'dance choreography performance',
  'storm weather extreme nature',
  'interview talk show',
  'music video official',
  'extreme sports action',
  'art gallery exhibition',
  'night landscape timelapse',
  'relaxing ambient scenery',
  'train journey window view',
  'fireside fireplace ambient',
  'aquarium fish tank relaxing',
]

const ARCHIVE_SEEDS = [
  'classic television',
  'documentary film',
  'nature wildlife',
  'space science',
  'vintage educational',
  'classic music performance',
  'short film',
  'old instructional video',
  'public domain film',
  'newsreel footage',
  'amateur home movie',
  'industrial film',
]

// ─────────────────────────────────────────────
//  VIDEO SOURCE DEFINITIONS
//  Each source has: id, label, enabled by default,
//  a weight (relative probability), and fetcher
// ─────────────────────────────────────────────
export const VIDEO_SOURCES = [
  { id: 'youtube',    label: 'YouTube',          defaultWeight: 55 },
  { id: 'archive',    label: 'Internet Archive', defaultWeight: 20 },
  { id: 'dailymotion',label: 'Dailymotion',      defaultWeight: 15 },
  { id: 'wikimedia',  label: 'Wikimedia',        defaultWeight: 10 },
]

// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const POOL_LOW_MARK  = 10
const POOL_PARALLEL  = 2
const HISTORY_CAP    = 200
const LOST_CHANCE    = 0.05
const LOST_TYPES     = ['test_pattern', 'test_pattern', 'standby_card', 'cryptic']

const CHANNEL_SEQUENCE = [
  2, 4, 5, 7, 9, 11, 13, 14, 16, 17, 18, 20, 22, 23, 25, 27, 28, 30,
  31, 33, 36, 38, 39, 40, 44, 46, 48, 50, 51, 53, 55, 57, 58, 60, 62,
  64, 65, 67, 69, 70, 72, 74, 76, 78, 80, 83, 85, 87, 89, 91,
]

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function makeSeedQueue(seeds) {
  let queue = []
  return { next() { if (!queue.length) queue = shuffle([...seeds]); return queue.pop() } }
}

// Weighted random pick from array of { id, weight }
function weightedPick(items) {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) { r -= item.weight; if (r <= 0) return item.id }
  return items[items.length - 1].id
}

function videoPassesFilter(item, excludeTags) {
  if (!excludeTags.length) return true
  const title = (item.snippet?.title ?? '').toLowerCase()
  const desc  = (item.snippet?.description ?? '').toLowerCase()
  return !excludeTags.some(tag => title.includes(tag) || desc.includes(tag))
}

// ─────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────
export function useChannel() {
  const historyRef     = useRef([])
  const indexRef       = useRef(-1)
  const poolRef        = useRef([])
  const fillingRef     = useRef(false)
  const seedQueueRef   = useRef(makeSeedQueue(DEFAULT_SEEDS))
  const archQueueRef   = useRef(makeSeedQueue(ARCHIVE_SEEDS))
  const dmQueueRef     = useRef(makeSeedQueue(DM_TAG_GROUPS))
  const wikiQueueRef   = useRef(makeSeedQueue(WIKI_QUERIES))
  const searchOptsRef  = useRef({})
  const ytExhaustedRef = useRef(false)
  const seenIdsRef     = useRef(new Set())
  // Enabled source weights — can be changed by filter
  const sourceWeightsRef = useRef(
    VIDEO_SOURCES.map(s => ({ id: s.id, weight: s.defaultWeight, enabled: true }))
  )

  useEffect(() => { warmCache(DEFAULT_SEEDS.slice(0, 8)) }, [])

  // ─────────────────────────────────────────
  //  setFilterConfig
  // ─────────────────────────────────────────
  function setFilterConfig({ seeds, searchOpts, sourceWeights }) {
    const newSeeds = seeds ?? DEFAULT_SEEDS
    seedQueueRef.current     = makeSeedQueue(newSeeds)
    // Embed genre seeds into searchOpts so non-YT fillers can also use them
    const enrichedOpts = {
      ...(searchOpts ?? {}),
      _genreSeeds: seeds ?? null,   // null = default / no genre filter
    }
    searchOptsRef.current    = enrichedOpts
    poolRef.current          = []
    historyRef.current       = []
    indexRef.current         = -1
    ytExhaustedRef.current   = false
    seenIdsRef.current       = new Set()
    if (sourceWeights) sourceWeightsRef.current = sourceWeights

    warmCache(newSeeds, {
      publishedAfter:  searchOpts?.publishedAfter,
      publishedBefore: searchOpts?.publishedBefore,
    })
  }

  // ─────────────────────────────────────────
  //  Per-source fillers
  // ─────────────────────────────────────────
  async function fillFromYouTube(count = POOL_PARALLEL) {
    const opts = searchOptsRef.current
    const excludeTags = opts.excludeTags ?? []
    const seeds  = Array.from({ length: count }, () => {
      let s = seedQueueRef.current.next()
      if (opts.includeTags?.length) s += ' ' + opts.includeTags.join(' ')
      return s
    })
    const orders = seeds.map(() => Math.random() > 0.55 ? 'viewCount' : 'relevance')
    const results = await Promise.allSettled(
      seeds.map((s, i) => ytSearch(s, {
        order: orders[i],
        publishedAfter:  opts.publishedAfter,
        publishedBefore: opts.publishedBefore,
      }))
    )
    let items = []
    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      if (isYouTubeExhausted(r.value)) { ytExhaustedRef.current = true; continue }
      const filtered = (r.value.items ?? [])
        .filter(i => i.id?.videoId && !seenIdsRef.current.has(i.id.videoId))
        .filter(i => videoPassesFilter(i, excludeTags))
      filtered.forEach(i => seenIdsRef.current.add(i.id.videoId))
      items = items.concat(filtered)
    }
    return shuffle(items)
  }

  async function fillFromArchive() {
    const opts = searchOptsRef.current
    // Build a query: start from archive seed, enrich with include keywords
    let seed = archQueueRef.current.next()
    if (opts.includeTags?.length) seed = opts.includeTags.join(' ') + ' ' + seed
    // If genre seeds are set, occasionally use one of them
    const gSeeds = opts._genreSeeds
    if (gSeeds?.length && Math.random() < 0.6) {
      seed = gSeeds[Math.floor(Math.random() * gSeeds.length)]
    }
    const raw = await archiveSearch(seed)
    if (!raw?.length) return []
    const exc = opts.excludeTags ?? []
    return raw
      .filter(i => !seenIdsRef.current.has(i.id.videoId) && videoPassesFilter(i, exc))
      .map(i => { seenIdsRef.current.add(i.id.videoId); return i })
  }

  async function fillFromDailymotion() {
    const opts = searchOptsRef.current
    // Build tag list from include keywords + a random DM tag group
    let tags = dmQueueRef.current.next()
    if (opts.includeTags?.length) {
      // Inject user keywords as tags (DM accepts these)
      tags = [...opts.includeTags.slice(0, 3), ...tags.slice(0, 2)]
    }
    // Genre seeds: extract keywords from the first seed
    const gSeeds = opts._genreSeeds
    if (gSeeds?.length && Math.random() < 0.5) {
      const words = gSeeds[Math.floor(Math.random() * gSeeds.length)].split(' ').slice(0, 2)
      tags = [...words, ...tags.slice(0, 2)]
    }
    const raw = await dailymotionSearch(tags)
    if (!raw?.length) return []
    const exc = opts.excludeTags ?? []
    // Also apply year filter client-side if set
    let items = raw.filter(i => !seenIdsRef.current.has(i.id.videoId) && videoPassesFilter(i, exc))
    items.forEach(i => { seenIdsRef.current.add(i.id.videoId) })
    return items
  }

  async function fillFromWikimedia() {
    const opts  = searchOptsRef.current
    // Build query from include keywords or genre seeds
    let query = wikiQueueRef.current.next()
    if (opts.includeTags?.length) query = opts.includeTags.slice(0, 2).join(' ')
    const gSeeds = opts._genreSeeds
    if (gSeeds?.length && Math.random() < 0.5) {
      query = gSeeds[Math.floor(Math.random() * gSeeds.length)].split(' ').slice(0, 2).join(' ')
    }
    const raw = await wikimediaSearch(query)
    if (!raw?.length) return []
    const exc = opts.excludeTags ?? []
    return raw
      .filter(i => !seenIdsRef.current.has(i.id.videoId) && videoPassesFilter(i, exc))
      .map(i => { seenIdsRef.current.add(i.id.videoId); return i })
  }

  // ─────────────────────────────────────────
  //  fillPool — weighted random source selection
  // ─────────────────────────────────────────
  async function fillPool() {
    if (fillingRef.current) return
    fillingRef.current = true
    try {
      // Build active weights (zero out exhausted YT)
      const weights = sourceWeightsRef.current.map(s => ({
        ...s,
        weight: (s.id === 'youtube' && ytExhaustedRef.current) ? 0 : s.weight,
      })).filter(s => s.weight > 0)

      if (!weights.length) { fillingRef.current = false; return }

      // Pick 2-3 sources randomly (weighted, with replacement OK for variety)
      const numSources = 2 + (Math.random() < 0.4 ? 1 : 0)
      const chosen = Array.from({ length: numSources }, () => weightedPick(weights))

      // Fire all chosen sources in parallel
      const fetchers = {
        youtube:     () => fillFromYouTube(),
        archive:     () => fillFromArchive(),
        dailymotion: () => fillFromDailymotion(),
        wikimedia:   () => fillFromWikimedia(),
      }

      const results = await Promise.allSettled(chosen.map(src => fetchers[src]?.()))
      let allItems = []
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value?.length) allItems = allItems.concat(r.value)
      }

      // Hard shuffle the combined multi-source batch
      poolRef.current = [...poolRef.current, ...shuffle(allItems)]
    } catch (err) {
      console.warn('[useChannel] fillPool error:', err)
    } finally {
      fillingRef.current = false
    }
  }

  // ─────────────────────────────────────────
  //  pickVideo
  // ─────────────────────────────────────────
  async function pickVideo() {
    if (!poolRef.current.length) await fillPool()
    if (!poolRef.current.length) await fillPool()
    if (!poolRef.current.length) return null
    const video = poolRef.current.shift()
    if (poolRef.current.length < POOL_LOW_MARK) fillPool()
    return video
  }

  // ─────────────────────────────────────────
  //  goNext / goPrev
  // ─────────────────────────────────────────
  const goNext = useCallback(async () => {
    const idx  = indexRef.current
    const hist = historyRef.current

    if (idx < hist.length - 1) {
      const ni    = idx + 1
      indexRef.current = ni
      const entry = hist[ni]
      return {
        video:       entry?._lost ? null : entry,
        channelNum:  CHANNEL_SEQUENCE[ni % CHANNEL_SEQUENCE.length],
        lostChannel: entry?._lost ?? null,
      }
    }

    let video = null, lostChannel = null
    if (Math.random() < LOST_CHANCE) {
      lostChannel = LOST_TYPES[Math.floor(Math.random() * LOST_TYPES.length)]
    } else {
      video = await pickVideo()
      if (!video) lostChannel = 'dead_air'
    }

    const entry = lostChannel ? { _lost: lostChannel } : video

    if (hist.length >= HISTORY_CAP) {
      const trimmed = hist.slice(Math.floor(HISTORY_CAP / 2))
      trimmed.push(entry)
      historyRef.current = trimmed
      indexRef.current   = trimmed.length - 1
    } else {
      historyRef.current = [...hist, entry]
      indexRef.current   = historyRef.current.length - 1
    }

    return {
      video,
      channelNum:  CHANNEL_SEQUENCE[indexRef.current % CHANNEL_SEQUENCE.length],
      lostChannel,
    }
  }, []) // eslint-disable-line

  const goPrev = useCallback(() => {
    const idx  = indexRef.current
    const hist = historyRef.current
    if (idx <= 0) return { video: null, channelNum: null, lostChannel: null }
    const ni    = idx - 1
    indexRef.current = ni
    const entry = hist[ni]
    return {
      video:       entry?._lost ? null : entry,
      channelNum:  CHANNEL_SEQUENCE[ni % CHANNEL_SEQUENCE.length],
      lostChannel: entry?._lost ?? null,
    }
  }, [])

  return { goNext, goPrev, setFilterConfig }
}
