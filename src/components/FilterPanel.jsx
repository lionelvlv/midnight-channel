// src/components/FilterPanel.jsx
import { useState } from 'react'
import { VIDEO_SOURCES } from '../hooks/useChannel'
import '../styles/filter.css'

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR     = 1970
const MAX_YEAR     = CURRENT_YEAR  // never allow future years

export const GENRE_FILTERS = [
  { id: 'any',     label: 'ALL CHANNELS',      seeds: null },
  { id: 'nature',  label: 'NATURE & WILDLIFE', seeds: ['nature wildlife documentary','ocean underwater sea','storm weather timelapse','animals amazing wildlife','forest river landscape'] },
  { id: 'music',   label: 'MUSIC & LIVE',      seeds: ['live music concert performance','music video official','jazz piano live','orchestra symphony live','folk acoustic performance'] },
  { id: 'space',   label: 'SPACE & SCIENCE',   seeds: ['space astronomy universe nasa','science experiment physics','deep ocean biology','telescope stars galaxy','physics documentary'] },
  { id: 'travel',  label: 'TRAVEL & PLACES',   seeds: ['travel world explore documentary','city street urban life','train journey window view','night landscape timelapse','aerial drone landscape'] },
  { id: 'ambient', label: 'AMBIENT & CALM',    seeds: ['relaxing ambient scenery','fireside fireplace cozy','aquarium fish tank calm','rain window cozy','lofi ambient study'] },
  { id: 'comedy',  label: 'COMEDY & CLIPS',    seeds: ['comedy sketch funny','stand up comedy','funny moments compilation','late night talk show'] },
  { id: 'sport',   label: 'SPORT & ACTION',    seeds: ['sports highlights best moments','extreme sports action','skateboard snowboard surf','martial arts boxing fight'] },
  { id: 'history', label: 'HISTORY & CULTURE', seeds: ['history documentary ancient','vintage classic television','art gallery exhibition','interview talk show classic'] },
  { id: 'cooking', label: 'FOOD & COOKING',    seeds: ['cooking food tutorial recipe','street food world','baking bread pastry','restaurant chef kitchen'] },
]

// Preset templates
export const PRESETS = [
  {
    id: 'early_internet',
    label: '🌐 Eerie Early 2000s',
    desc:  'Public access, weird flash intros, forgotten websites',
    config: {
      genreId:     'history',
      yearEnabled: true,
      yearFrom:    1999,
      yearTo:      2006,
      includeTags: ['internet', 'flash', 'old', 'early'],
      excludeTags: ['music', 'shorts'],
    },
    seeds: ['early internet 2000s weird','public access tv 2000s','flash animation internet 2000s','old website screen recording','y2k aesthetic video'],
  },
  {
    id: 'golden_internet',
    label: '✨ Golden Age 2010s',
    desc:  'Viral videos, memes, classic YouTube era',
    config: {
      genreId:     'any',
      yearEnabled: true,
      yearFrom:    2010,
      yearTo:      2015,
      includeTags: [],
      excludeTags: ['shorts', 'live'],
    },
    seeds: ['viral video 2010','classic youtube video 2010','internet meme original 2012','youtube classic viral 2011','early youtube viral 2013'],
  },
  {
    id: 'late_night_tv',
    label: '📺 Late Night Broadcast',
    desc:  'Infomercials, public access, off-air oddities',
    config: {
      genreId:     'history',
      yearEnabled: false,
      yearFrom:    MIN_YEAR,
      yearTo:      MAX_YEAR,
      includeTags: ['infomercial', 'public access', 'late night'],
      excludeTags: ['music', 'shorts'],
    },
    seeds: ['infomercial vintage classic','public access tv weird','late night television obscure','cable access show vintage','old tv commercial classic'],
  },
  {
    id: 'nature_ambient',
    label: '🌿 Deep Nature',
    desc:  'Forests, oceans, wildlife — totally random',
    config: {
      genreId:     'nature',
      yearEnabled: false,
      yearFrom:    MIN_YEAR,
      yearTo:      MAX_YEAR,
      includeTags: [],
      excludeTags: ['music', 'shorts', 'reaction'],
    },
    seeds: null, // use genre seeds
  },
  {
    id: 'vhs_horror',
    label: '📼 VHS Nightmare',
    desc:  'Creepy, analog, found footage vibes',
    config: {
      genreId:     'any',
      yearEnabled: false,
      yearFrom:    MIN_YEAR,
      yearTo:      MAX_YEAR,
      includeTags: ['vhs', 'found footage', 'analog', 'horror'],
      excludeTags: ['shorts', 'reaction'],
    },
    seeds: ['vhs found footage horror','analog horror creepy','vhs glitch horror weird','creepy vhs tape old recording','analog video horror atmosphere'],
  },
  {
    id: 'retro_science',
    label: '🔭 Retro Science',
    desc:  'Old NASA footage, vintage educational films',
    config: {
      genreId:     'space',
      yearEnabled: true,
      yearFrom:    1960,
      yearTo:      1995,
      includeTags: ['nasa', 'science', 'educational'],
      excludeTags: ['shorts', 'music'],
    },
    seeds: ['nasa archive vintage footage','vintage science educational film','old documentary space','classic science film 1970s','educational film 1980s'],
  },
]

function TagPill({ label, onRemove }) {
  return (
    <span className="tag-pill">
      {label}
      <button className="tag-remove" onClick={onRemove}>×</button>
    </span>
  )
}

function YearInput({ label, value, min, max, onChange }) {
  const [raw, setRaw] = useState(String(value))

  function handleChange(e) {
    const str = e.target.value
    // Allow typing freely
    setRaw(str)
  }

  function handleBlur() {
    let n = parseInt(raw, 10)
    if (isNaN(n)) n = value         // revert to previous if unparseable
    n = Math.max(min, Math.min(max, n))
    setRaw(String(n))
    if (n !== value) onChange(n)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(max, value + 1)
      setRaw(String(next)); onChange(next)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(min, value - 1)
      setRaw(String(next)); onChange(next)
    }
  }

  // Keep raw in sync when value changes externally
  const prevValue = value
  if (parseInt(raw, 10) !== value && document.activeElement?.dataset?.yearInput !== label) {
    // sync if not focused
  }

  return (
    <div className="year-col">
      <label className="year-label">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="year-input"
        value={raw}
        data-year-input={label}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

export function FilterPanel({ config, onApply, onClose }) {
  const [tab,          setTab]          = useState('presets') // 'presets' | 'custom' | 'sources'
  const [genreId,      setGenreId]      = useState(config.genreId      ?? 'any')
  const [yearFrom,     setYearFrom]     = useState(config.yearFrom     ?? 2000)
  const [yearTo,       setYearTo]       = useState(config.yearTo       ?? MAX_YEAR)
  const [yearEnabled,  setYearEnabled]  = useState(config.yearEnabled  ?? false)
  const [includeTags,  setIncludeTags]  = useState(config.includeTags  ?? [])
  const [excludeTags,  setExcludeTags]  = useState(config.excludeTags  ?? [])
  const [includeInput, setIncludeInput] = useState('')
  const [excludeInput, setExcludeInput] = useState('')
  const [activePreset, setActivePreset] = useState(null)
  const [sourceWeights, setSourceWeights] = useState(
    config.sourceWeights ?? VIDEO_SOURCES.map(s => ({ id: s.id, weight: s.defaultWeight, enabled: true }))
  )

  function addTag(list, setList, input, setInput) {
    const t = input.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!t || list.includes(t)) { setInput(''); return }
    setList([...list, t]); setInput('')
  }

  function removeTag(list, setList, tag) { setList(list.filter(t => t !== tag)) }

  function handleKeyDown(e, list, setList, input, setInput) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(list, setList, input, setInput)
    }
  }

  function applyPreset(preset) {
    setActivePreset(preset.id)
    setGenreId(preset.config.genreId)
    setYearEnabled(preset.config.yearEnabled)
    setYearFrom(preset.config.yearFrom)
    setYearTo(preset.config.yearTo)
    setIncludeTags(preset.config.includeTags)
    setExcludeTags(preset.config.excludeTags)
    const genre = GENRE_FILTERS.find(g => g.id === preset.config.genreId)
    const searchOpts = {}
    if (preset.config.yearEnabled) {
      searchOpts.publishedAfter  = `${preset.config.yearFrom}-01-01T00:00:00Z`
      searchOpts.publishedBefore = `${preset.config.yearTo}-12-31T23:59:59Z`
    }
    if (preset.config.includeTags.length) searchOpts.includeTags = preset.config.includeTags
    if (preset.config.excludeTags.length) searchOpts.excludeTags = preset.config.excludeTags
    // Send the full sourceWeights state (including enabled flag) — TVInterface converts to active weights
    onApply({ genreId: preset.config.genreId, genre: preset.seeds ? { seeds: preset.seeds } : genre, searchOpts, sourceWeights })
    onClose()
  }

  function handleApply() {
    const genre    = GENRE_FILTERS.find(g => g.id === genreId)
    const searchOpts = {}
    if (yearEnabled) {
      const from = Math.max(MIN_YEAR, Math.min(yearFrom, yearTo))
      const to   = Math.max(from, Math.min(yearTo, MAX_YEAR))
      searchOpts.publishedAfter  = `${from}-01-01T00:00:00Z`
      searchOpts.publishedBefore = `${to}-12-31T23:59:59Z`
    }
    if (includeTags.length) searchOpts.includeTags = includeTags
    if (excludeTags.length) searchOpts.excludeTags = excludeTags
    // Send the full sourceWeights state (including enabled flag) — TVInterface converts to active weights
    onApply({ genreId, genre, searchOpts, sourceWeights })
    onClose()
  }

  function handleYearFrom(val) {
    const clamped = Math.max(MIN_YEAR, Math.min(val, yearTo, MAX_YEAR))
    setYearFrom(clamped)
  }

  function handleYearTo(val) {
    const clamped = Math.max(yearFrom, Math.min(val, MAX_YEAR))
    setYearTo(clamped)
  }

  const isDefault = (
    genreId === 'any' && !yearEnabled &&
    includeTags.length === 0 && excludeTags.length === 0
  )

  return (
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={e => e.stopPropagation()}>

        <div className="filter-header">
          <span className="filter-title">CHANNEL FILTERS</span>
          <button className="filter-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="filter-tabs">
          <button className={`filter-tab${tab==='presets'?' active':''}`} onClick={() => setTab('presets')}>
            PRESETS
          </button>
          <button className={`filter-tab${tab==='custom'?' active':''}`} onClick={() => setTab('custom')}>
            CUSTOM
          </button>
          <button className={`filter-tab${tab==='sources'?' active':''}`} onClick={() => setTab('sources')}>
            SOURCES
          </button>
        </div>

        <div className="filter-body">

          {/* ── PRESETS TAB ── */}
          {tab === 'presets' && (
            <div className="filter-section">
              <div className="filter-hint-sub" style={{marginBottom:12}}>
                Tap a preset to instantly tune to that vibe
              </div>
              <div className="preset-grid">
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    className={`preset-card${activePreset === p.id ? ' active' : ''}`}
                    onClick={() => applyPreset(p)}
                  >
                    <div className="preset-label">{p.label}</div>
                    <div className="preset-desc">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CUSTOM TAB ── */}
          {tab === 'custom' && (
            <>
              {/* Genre */}
              <div className="filter-section">
                <div className="filter-section-label">GENRE</div>
                <div className="filter-genre-grid">
                  {GENRE_FILTERS.map(g => (
                    <button
                      key={g.id}
                      className={`filter-genre-btn${genreId === g.id ? ' active' : ''}`}
                      onClick={() => setGenreId(g.id)}
                    >
                      <span className="filter-dot" />
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year Range */}
              <div className="filter-section">
                <div className="filter-section-label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  YEAR RANGE
                  <label className="filter-toggle">
                    <input type="checkbox" checked={yearEnabled} onChange={e => setYearEnabled(e.target.checked)} />
                    <span className="filter-toggle-track" />
                  </label>
                </div>

                {yearEnabled && (
                  <div className="year-range-row">
                    <YearInput
                      label="FROM"
                      value={yearFrom}
                      min={MIN_YEAR}
                      max={yearTo}
                      onChange={handleYearFrom}
                    />
                    <div className="year-divider">—</div>
                    <YearInput
                      label="TO"
                      value={yearTo}
                      min={yearFrom}
                      max={MAX_YEAR}
                      onChange={handleYearTo}
                    />
                    <div className="year-hint">{yearTo - yearFrom + 1}yr span</div>
                  </div>
                )}
              </div>

              {/* Include Keywords */}
              <div className="filter-section">
                <div className="filter-section-label">INCLUDE KEYWORDS</div>
                <div className="filter-hint-sub">Match title or description</div>
                <div className="tag-input-row">
                  <input
                    className="tag-input"
                    placeholder="e.g. jazz, nasa  →  Enter to add"
                    value={includeInput}
                    onChange={e => setIncludeInput(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, includeTags, setIncludeTags, includeInput, setIncludeInput)}
                  />
                  <button className="tag-add-btn" onClick={() => addTag(includeTags, setIncludeTags, includeInput, setIncludeInput)}>+</button>
                </div>
                {includeTags.length > 0 && (
                  <div className="tag-pills include-pills">
                    {includeTags.map(t => <TagPill key={t} label={t} onRemove={() => removeTag(includeTags, setIncludeTags, t)} />)}
                  </div>
                )}
              </div>

              {/* Exclude Keywords */}
              <div className="filter-section">
                <div className="filter-section-label">EXCLUDE KEYWORDS</div>
                <div className="filter-hint-sub">Block by title or description (e.g. "music" blocks music videos)</div>
                <div className="tag-input-row">
                  <input
                    className="tag-input"
                    placeholder="e.g. music, shorts, reaction  →  Enter to add"
                    value={excludeInput}
                    onChange={e => setExcludeInput(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, excludeTags, setExcludeTags, excludeInput, setExcludeInput)}
                  />
                  <button className="tag-add-btn" onClick={() => addTag(excludeTags, setExcludeTags, excludeInput, setExcludeInput)}>+</button>
                </div>
                {excludeTags.length > 0 && (
                  <div className="tag-pills exclude-pills">
                    {excludeTags.map(t => <TagPill key={t} label={t} onRemove={() => removeTag(excludeTags, setExcludeTags, t)} />)}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── SOURCES TAB ── */}
          {tab === 'sources' && (
            <div className="filter-section">
              <div className="filter-hint-sub" style={{ marginBottom: 14 }}>
                Toggle sources and drag sliders to weight how often each appears
              </div>
              {sourceWeights.map(s => {
                const def = VIDEO_SOURCES.find(v => v.id === s.id)
                return (
                  <div key={s.id} className={`source-row${s.enabled ? '' : ' source-disabled'}`}>
                    <label className="source-toggle-label">
                      <input
                        type="checkbox" checked={s.enabled}
                        onChange={e => setSourceWeights(prev =>
                          prev.map(x => x.id === s.id ? { ...x, enabled: e.target.checked } : x)
                        )}
                      />
                      <span className="source-check-track" />
                    </label>
                    <div className="source-info">
                      <span className="source-name">{def?.label ?? s.id}</span>
                      <input
                        type="range" className="source-slider"
                        min="1" max="100" value={s.weight}
                        disabled={!s.enabled}
                        onChange={e => setSourceWeights(prev =>
                          prev.map(x => x.id === s.id ? { ...x, weight: Number(e.target.value) } : x)
                        )}
                      />
                      <span className="source-pct">
                        {s.enabled
                          ? `${Math.round(s.weight / sourceWeights.filter(x=>x.enabled).reduce((a,x)=>a+x.weight,0) * 100)}%`
                          : 'OFF'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {(tab === 'custom' || tab === 'sources') && (
          <div className="filter-footer">
            {tab === 'custom' && !isDefault && (
              <button className="filter-reset" onClick={() => {
                setGenreId('any'); setYearEnabled(false)
                setYearFrom(2000); setYearTo(MAX_YEAR)
                setIncludeTags([]); setExcludeTags([])
                setActivePreset(null)
              }}>
                RESET ALL
              </button>
            )}
            {tab === 'sources' && (
              <button className="filter-reset" onClick={() =>
                setSourceWeights(VIDEO_SOURCES.map(s => ({ id: s.id, weight: s.defaultWeight, enabled: true })))
              }>
                RESET
              </button>
            )}
            <button className="filter-apply" onClick={handleApply}>APPLY FILTERS</button>
          </div>
        )}
      </div>
    </div>
  )
}
