// src/components/ControlBar.jsx
import { useState, useEffect } from 'react'
import '../styles/controlbar.css'

const VOL_SEGMENTS = 16

export function ControlBar({
  volume, onVolumeChange,
  filterConfig, onFilterOpen,
  isPlaying, onPlayPause,
  isFullscreen, onFullscreen,
}) {
  const isMuted    = volume === 0
  const hasFilters = filterConfig.genreId !== 'any'
    || filterConfig.yearEnabled
    || (filterConfig.includeTags?.length ?? 0) > 0
    || (filterConfig.excludeTags?.length ?? 0) > 0

  const litCount = Math.round((volume / 100) * VOL_SEGMENTS)

  return (
    <div className="control-bar">

      {/* Filter */}
      <button
        className={`ctrl-btn${hasFilters ? ' ctrl-active' : ''}`}
        onClick={onFilterOpen}
        title="Filter channels (F)"
      >
        <span className="ctrl-icon">▤</span>
        <span className="ctrl-label">{hasFilters ? 'FILTERED' : 'FILTER'}</span>
      </button>

      {/* Volume — phosphor segmented bar */}
      <div className="ctrl-volume" title={isMuted ? 'Muted' : `Volume ${volume}%`}>
        <button
          className="ctrl-mute-btn"
          onClick={() => onVolumeChange(isMuted ? 60 : 0)}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <svg className="vol-icon" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
            {isMuted ? (
              <>
                <polygon points="1,4 5,4 9,1 9,13 5,10 1,10" />
                <line x1="11" y1="4" x2="14" y2="10" />
                <line x1="14" y1="4" x2="11" y2="10" />
              </>
            ) : volume < 40 ? (
              <>
                <polygon points="1,4 5,4 9,1 9,13 5,10 1,10" />
                <path d="M11,5 Q12.5,7 11,9" fill="none" strokeWidth="1.2"/>
              </>
            ) : (
              <>
                <polygon points="1,4 5,4 9,1 9,13 5,10 1,10" />
                <path d="M11,4 Q13.5,7 11,10" fill="none" strokeWidth="1.2"/>
                <path d="M12.2,2 Q15.5,7 12.2,12" fill="none" strokeWidth="1.2"/>
              </>
            )}
          </svg>
        </button>

        <div className="vol-bar" role="slider" aria-valuenow={volume} aria-valuemin={0} aria-valuemax={100}>
          {Array.from({ length: VOL_SEGMENTS }).map((_, i) => {
            const segVol = Math.round(((i + 1) / VOL_SEGMENTS) * 100)
            const isLit  = i < litCount
            const zone   = i < 10 ? 'green' : i < 13 ? 'yellow' : 'red'
            return (
              <button
                key={i}
                className={`vol-seg vol-seg-${zone}${isLit ? ' lit' : ''}`}
                onClick={() => onVolumeChange(segVol)}
                aria-label={`Set volume to ${segVol}%`}
              />
            )
          })}
        </div>

        <span className="vol-label">{isMuted ? 'MUTE' : `${volume}%`}</span>
      </div>

      {/* Play / Pause */}
      <button
        className="ctrl-btn ctrl-playpause"
        onClick={onPlayPause}
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      >
        <span className="ctrl-pp-icon">
          {isPlaying
            ? <svg viewBox="0 0 12 14" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="3.5" height="12" rx="0.5"/><rect x="7.5" y="1" width="3.5" height="12" rx="0.5"/></svg>
            : <svg viewBox="0 0 12 14" xmlns="http://www.w3.org/2000/svg"><polygon points="1,1 11,7 1,13"/></svg>
          }
        </span>
      </button>

      {/* Fullscreen */}
      <button
        className={`ctrl-btn ctrl-fullscreen${isFullscreen ? ' ctrl-active' : ''}`}
        onClick={onFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        <svg className="fs-icon" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
          {isFullscreen ? (
            /* compress arrows */
            <>
              <polyline points="4,1 4,4 1,4" />
              <polyline points="10,1 10,4 13,4" />
              <polyline points="4,13 4,10 1,10" />
              <polyline points="10,13 10,10 13,10" />
            </>
          ) : (
            /* expand arrows */
            <>
              <polyline points="1,4 1,1 4,1" />
              <polyline points="13,4 13,1 10,1" />
              <polyline points="1,10 1,13 4,13" />
              <polyline points="13,10 13,13 10,13" />
            </>
          )}
        </svg>
      </button>

    </div>
  )
}
