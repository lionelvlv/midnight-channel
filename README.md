# NIGHT CHANNEL 📺

> *A virtual late-night TV that surfs random YouTube videos.*  
> *Dark. Eerie. Liminal. Slightly haunted.*

Night Channel is an immersive atmospheric web experience that simulates channel surfing on a strange TV at 2–4AM. Each flip loads a new random YouTube video through a brief analog static burst, complete with CRT effects, a procedural horror anomaly system, and live Web Audio synthesis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 6 |
| **Styling** | Vanilla CSS — zero UI framework |
| **Fonts** | VT323 (CRT pixel), Space Mono |
| **Video** | YouTube IFrame Embed API |
| **Static + click audio** | Web Audio API (procedural — no audio files) |
| **Background hum** | Web Audio oscillator + LFO |
| **Grain + static** | Canvas 2D API |
| **Backend** | Vercel Serverless Functions (Node.js) |
| **Video data** | YouTube Data API v3 |
| **Client cache** | `localStorage`, 7-day TTL |

---

## Features

### 🖥️ CRT TV Interface
A styled CRT television in pure CSS:
- Beveled dark body with multi-layer `box-shadow` depth
- Recessed screen with scanlines, vignette, barrel-curve illusion, glass gloss
- Animated film grain (Canvas 2D, ~12fps)
- Breathing green power LED (off during channel switch)
- `NOCTURNE` brand label on the chin

### ⚡ Static Burst Transition (PDR §5.6–5.7)
3-phase channel flip:
1. **Cut to black** (~65ms) — phosphor decay
2. **Static burst** (430–820ms) — Canvas-animated analog noise + procedural Web Audio hiss
3. **Fade in** — new video loads, OSD updates

Three static variants (PDR §5.7):
- `clean` — white noise + scanlines (~88%)
- `heavy` — horizontal tear bands + color bleed (~6%)
- `color` — RGB channel separation (~6%)

### 📻 Channel System
- **Bug-free channel numbering**: `goNext()`/`goPrev()` return the correct channel number directly, no stale closure
- **Channel history**: back navigation with ◀ Prev replays already-seen channels
- **Pool prefetch**: background pool of 5–20 videos, silently refills
- **24 search seeds**: nature docs, concerts, travel, cooking, gaming, ambient, fireside, aquarium, etc.
- **Real cable TV numbering**: gaps like actual broadcast channels (2, 4, 5, 7, 9, 11, 13…)

### 📺 Lost Channels (PDR §5.4)
5% of channel flips → a channel with no content:

| Type | What appears |
|---|---|
| `test_pattern` | Canvas-drawn SMPTE color bars with real-time clock + channel number overlay |
| `standby_card` | "PLEASE STAND BY" with blinking text |
| `cryptic` | Atmospheric messages ("TRANSMISSION ERROR", "DO NOT ADJUST YOUR SET", etc.) |

### 👁 Anomaly System (PDR §5) — 8 types
~2.5% probability, 12-flip cooldown, all with **proper timeout + auto-clear**:

| Anomaly | Description |
|---|---|
| `impossible_channel` | OSD shows "CH 8023" |
| `please_stand_by` | Full-screen standby card, then auto-resumes to the video |
| `no_signal` | Black screen + blinking cursor, then auto-resumes |
| `landing_flash` | 180ms overlay of landing page text, then auto-resumes |
| `ch_question` | OSD shows "CH ???" |
| `crt_warp` | CSS `filter` distorts the screen for 2.8s |
| `shadow_pass` | Dark silhouette sweeps across the screen |
| `static_heavy` | Extended (820ms) heavy-distortion static burst |

### 🎵 Audio
- **Static hiss**: procedural white noise, low-pass filtered, gain-enveloped, per flip
- **Background hum**: 55Hz sine oscillator + 0.08Hz LFO frequency wobble, ~inaudible (gain 0.007)
- **Hum deepening**: after 5 minutes, hum volume increases to 0.013 (PDR §5.5)
- **TV click**: sharp transient burst when sleep timer fires (classic CRT relay sound)

### ∞ Ambient Auto-Surf
Toggle via the control bar. Auto-flips every 45–105 seconds with a random interval. Shows `AUTO` badge in OSD. Stops on sleep timer.

### ☽ Sleep Timer
Cycles: OFF → 15m → 30m → 60m → OFF. Live countdown in the control bar. When it fires:
- Sharp click sound
- **CRT collapse animation** — screen implodes from full frame → horizontal line → bright dot → black (clip-path inset animation)
- TV body goes dark with LED off
- Hum fades out

### ⏱ Time-Based Events (PDR §5.5)
- After **5 min**: background hum deepens
- After **10 min**: CRT vignette darkens, grain intensifies (`.room-deep` class)

### 🕹 Control Bar
Hover-revealed (opacity 0.18 → 1.0) row below the TV with three buttons:
- `∞ AMBIENT` — auto-surf toggle
- `☽ SLEEP` — timer cycle (OFF / 15m / 30m / 60m) with countdown
- `♪ SOUND` — mute toggle (silences static hiss and hum)

---

## Project Structure

```
night-channel/
├── api/
│   └── search.js                  # Vercel function — YouTube search, key rotation
├── src/
│   ├── App.jsx                    # Landing → TV state machine
│   ├── main.jsx
│   ├── api.js                     # localStorage cache + in-flight dedup
│   ├── components/
│   │   ├── LandingPage.jsx        # Atmospheric staged fade-in + ENTER
│   │   ├── TVInterface.jsx        # CRT, static, OSD, anomalies, ambient, sleep
│   │   ├── TestPattern.jsx        # Canvas SMPTE pattern, standby, cryptic screens
│   │   └── ControlBar.jsx        # Ambient / sleep timer / mute
│   ├── hooks/
│   │   ├── useChannel.js          # History, pool prefetch, lost channels
│   │   └── useAnomaly.js          # Probability engine, 8 anomaly types
│   └── styles/
│       ├── base.css               # Reset, CSS vars, fonts
│       ├── landing.css            # Landing animations
│       └── tv.css                 # TV body, CRT, OSD, control bar, CRT-off animation
├── index.html                     # Google Fonts: VT323 + Space Mono
├── package.json
├── vite.config.js
└── vercel.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- YouTube Data API v3 key

### Local dev

```bash
npm install
echo "YOUTUBE_API_KEY_1=your_key" > .env.local
npx vercel dev
```

### Deploy

```bash
npx vercel --prod
```

Add `YOUTUBE_API_KEY_1` (and optionally `_2` through `_10`) in **Vercel → Settings → Environment Variables**.

---

## Roadmap
- [ ] Emergency alert broadcast interruption screen
- [ ] Volume slider on screen (via postMessage to iframe)
- [ ] Reduced-motion mode (crossfade instead of static)
- [ ] Keyboard shortcuts (← → for channel, M for mute, A for ambient)
# midnight-channel
