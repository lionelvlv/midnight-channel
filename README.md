# NIGHT CHANNEL 📺

> *A virtual late-night TV that surfs random videos from across the internet.*  
> *Dark. Eerie. Liminal. Slightly haunted.*

Night Channel is an immersive atmospheric web experience that simulates channel surfing on a strange TV at 2–4AM. Each flip loads a new random video through a brief analog static burst, complete with CRT effects, 32 procedural horror anomaly events, and live Web Audio synthesis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 6 |
| **Styling** | Vanilla CSS — zero UI framework |
| **Fonts** | VT323 (CRT pixel), Space Mono |
| **Video** | YouTube IFrame API, Dailymotion API, Internet Archive, Wikimedia Commons |
| **Audio** | Web Audio API (procedural — zero audio files) |
| **Grain + static** | Canvas 2D API |
| **Backend** | Vercel Serverless Functions (Node.js) |
| **Cache** | L1 in-memory Map + L2 localStorage (separate TTLs per source) |

---

## Video Sources

| Source | API | Key needed | Notes |
|---|---|---|---|
| **YouTube** | Data API v3 | Yes — up to 10 keys with auto-rotation | Quota-exhaustion fallthrough |
| **Dailymotion** | Public REST API | No | Random tag groups, 6h cache |
| **Internet Archive** | advancedsearch | No | Public domain films, 7d cache |
| **Wikimedia Commons** | MediaWiki API | No | Free video files (WebM/MP4), 7d cache |

Sources are weighted randomly (default: YT 55%, Archive 20%, DM 15%, Wiki 10%) and fully configurable via the **Sources** filter tab.

---

## Environment Variables

```bash
# .env.local
VITE_YOUTUBE_API_KEY=your_key_here

# Optional: up to 10 rotating keys (server-side too via api/search.js)
VITE_YOUTUBE_API_KEY_1=key1
VITE_YOUTUBE_API_KEY_2=key2
# ...

# Server-side (Vercel) — same pattern
YOUTUBE_API_KEY_1=key1
YOUTUBE_API_KEY_2=key2
```

When all YouTube keys are exhausted, the app falls through to Archive + Dailymotion + Wikimedia automatically. If all sources fail, a special "dead air" screen appears.

---

## Features

### 🖥️ CRT TV Interface
A styled 3D CRT monitor in pure CSS with scanlines, vignette, phosphor grain, and barrel distortion illusion. YouTube player chrome is hidden via a transparent overlay (`controls=0` + `z-index` blocker).

### 📡 Multi-Source Random Pool
- Videos fetched from 4 sources with weighted randomness
- Fisher-Yates shuffled seed queue — no back-to-back repeats
- Session-level deduplication (never see same video twice per session)
- Parallel prefetch (`POOL_PARALLEL = 2`) keeps pool topped up
- History navigation (← goes back through seen channels, zero network cost)
- History capped at 200 entries to prevent memory growth

### 🎚️ Filter System
Three tabs:
- **Presets** — 6 one-click vibes (Eerie Early 2000s, Golden Age 2010s, Late Night Broadcast, Deep Nature, VHS Nightmare, Retro Science)
- **Custom** — genre, year range (with proper text inputs), include/exclude keywords matched against video title + description
- **Sources** — enable/disable each source and adjust relative weights with sliders

### 👻 Anomaly System (32 events)
Rare (~2.8% per flip, min 10-flip cooldown) atmospheric interruptions. All auto-switch to next channel after their duration.

**Subtle (OSD/screen):** impossible_channel, ch_question, crt_warp, shadow_pass, static_heavy

**Classic overlays:** please_stand_by, no_signal, landing_flash, dead_frequency, channel_zero, color_bars_glitch, memory_corruption, broadcast_warning

**Content overlays (static):** system_message, ascii_face, static_gif, eerie_gif, viewer_count, signal_decoded, static_poem, lost_transmission, countdown, mirror_test, classified_footage, time_glitch, morse_code, pixel_eyes

**API-powered overlays:** late_night_joke (JokeAPI), cryptic_fact (uselessfacts), unsolicited_advice (AdviceSlip), weather_intercept (Open-Meteo), number_transmission (NumbersAPI)

API data is prefetched on mount and refreshed every 5 minutes so overlays render instantly with no perceptible delay.

### 🔊 Audio
All audio is procedural — no audio files loaded:
- Static noise burst on channel change
- Ambient 55Hz hum with LFO modulation (deepens after 5 min)
- Whisper noise (bandpass-filtered noise burst)
- Eerie sweep (dual oscillator descending)
- Glitch burst (4 random-frequency square pulses)
- Tone generator (configurable freq/duration/type)

### 🌑 UI Fade + Hide
- Controls fade to invisible after 4s of inactivity, return on any input
- **Tab** key hard-hides everything (including arrows) — re-press to restore

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `← / A` | Previous channel |
| `→ / D` | Next channel |
| `F` | Open filter panel |
| `Tab` | Toggle UI visibility |

---

## Development

```bash
npm install
npm run dev
```

## Deploy (Vercel)

```bash
npm run build
vercel deploy
```

Set your `YOUTUBE_API_KEY_*` variables in Vercel dashboard under Project → Settings → Environment Variables.

---

## Caching Architecture

```
Request → L1 memCache (Map, in-memory) → hit: return instantly
                ↓ miss
         L2 localStorage → hit: promote to L1, return
                ↓ miss
         Network fetch → write to L1 + L2
```

| Source | TTL |
|---|---|
| YouTube search | 24h |
| Dailymotion | 6h |
| Internet Archive | 7d |
| Wikimedia Commons | 7d |
| Jokes / facts | 30 min |

localStorage evicts oldest 20% of entries when the 80-entry cap is reached (LRU-style), rather than clearing everything.
