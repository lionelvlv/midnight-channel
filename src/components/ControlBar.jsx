// src/components/ControlBar.jsx
import '../styles/controlbar.css'

export function ControlBar({ volume, onVolumeChange, filterConfig, onFilterOpen }) {
  const isMuted    = volume === 0
  const hasFilters = filterConfig.genreId !== 'any'
    || filterConfig.yearEnabled
    || (filterConfig.includeTags?.length ?? 0) > 0
    || (filterConfig.excludeTags?.length ?? 0) > 0

  return (
    <div className="control-bar">

      <button
        className={`ctrl-btn${hasFilters ? ' ctrl-active' : ''}`}
        onClick={onFilterOpen}
        title="Filter channels (F)"
      >
        <span className="ctrl-icon">▤</span>
        <span className="ctrl-label">{hasFilters ? 'FILTERED' : 'FILTER'}</span>
      </button>

      <div className="ctrl-volume">
        <button
          className="ctrl-mute-btn"
          onClick={() => onVolumeChange(isMuted ? 60 : 0)}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <span className="ctrl-icon">{isMuted ? '🔇' : volume < 40 ? '🔈' : '🔊'}</span>
        </button>
        <input
          type="range" className="vol-slider"
          min="0" max="100" step="2"
          value={volume}
          onChange={e => onVolumeChange(Number(e.target.value))}
        />
        <span className="vol-label">{isMuted ? 'MUTE' : `${volume}%`}</span>
      </div>

    </div>
  )
}
