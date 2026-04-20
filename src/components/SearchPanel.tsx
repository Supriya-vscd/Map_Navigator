import { useState, useEffect, useRef, useCallback } from 'react'
import { geocode, GeocodeResult, TravelMode } from '../api/mapApi'
import LoadingSpinner from './LoadingSpinner'

interface LocationField {
  query: string
  selected: GeocodeResult | null
}

interface Props {
  onOriginChange: (r: GeocodeResult | null) => void
  onDestinationChange: (r: GeocodeResult | null) => void
  onGetRoute: (mode: TravelMode) => void
  onLocateMe: () => void
  onClear: () => void
  loading: boolean
  error: string | null
  locating: boolean
  hasRoute: boolean
}

const MODES: { value: TravelMode; label: string; icon: string }[] = [
  { value: 'driving',  label: 'Drive',  icon: '🚗' },
  { value: 'walking',  label: 'Walk',   icon: '🚶' },
  { value: 'cycling',  label: 'Cycle',  icon: '🚴' },
]

// ── Autocomplete input ──────────────────────────────────────────────────────
function AutocompleteInput({
  id,
  placeholder,
  value,
  icon,
  accentColor,
  onChange,
  onSelect,
}: {
  id: string
  placeholder: string
  value: string
  icon: string
  accentColor: string
  onChange: (val: string) => void
  onSelect: (result: GeocodeResult) => void
}) {
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (val: string) => {
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 3) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await geocode(val)
        setResults(data)
        setOpen(data.length > 0)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 400)
  }

  const handleSelect = (r: GeocodeResult) => {
    onChange(r.display_name.split(',').slice(0, 2).join(','))
    onSelect(r)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative flex items-center">
        <span className={`absolute left-3 text-base ${accentColor}`}>{icon}</span>
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="input-field pl-9 pr-9"
          autoComplete="off"
        />
        {searching && (
          <span className="absolute right-3">
            <LoadingSpinner size="sm" />
          </span>
        )}
        {!searching && value && (
          <button
            onClick={() => { onChange(''); setResults([]); setOpen(false); onSelect(null as unknown as GeocodeResult) }}
            className="absolute right-3 text-slate-500 hover:text-white transition-colors text-xs"
            aria-label="Clear field"
          >✕</button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-[9999] mt-1.5 w-full glass-card overflow-hidden shadow-glass">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                onMouseDown={() => handleSelect(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors"
              >
                <p className="text-sm text-slate-100 truncate">{r.display_name.split(',').slice(0, 2).join(',')}</p>
                <p className="text-xs text-slate-500 truncate">{r.display_name}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Main SearchPanel ────────────────────────────────────────────────────────
export default function SearchPanel({
  onOriginChange,
  onDestinationChange,
  onGetRoute,
  onLocateMe,
  onClear,
  loading,
  error,
  locating,
  hasRoute,
}: Props) {
  const [origin, setOrigin] = useState<LocationField>({ query: '', selected: null })
  const [dest, setDest] = useState<LocationField>({ query: '', selected: null })
  const [mode, setMode] = useState<TravelMode>('driving')

  const handleOriginSelect = useCallback((r: GeocodeResult | null) => {
    setOrigin(prev => ({ ...prev, selected: r }))
    onOriginChange(r)
  }, [onOriginChange])

  const handleDestSelect = useCallback((r: GeocodeResult | null) => {
    setDest(prev => ({ ...prev, selected: r }))
    onDestinationChange(r)
  }, [onDestinationChange])

  const handleClear = () => {
    setOrigin({ query: '', selected: null })
    setDest({ query: '', selected: null })
    onOriginChange(null)
    onDestinationChange(null)
    onClear()
  }

  // Swap origin ↔ destination
  const handleSwap = () => {
    const oldOrigin = origin
    const oldDest = dest
    setOrigin({ query: dest.query, selected: dest.selected })
    setDest({ query: origin.query, selected: origin.selected })
    onOriginChange(oldDest.selected)
    onDestinationChange(oldOrigin.selected)
  }

  const canRoute = origin.selected && dest.selected && !loading

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2">
        <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-lg">
          🗺️
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Map Navigator</h1>
          <p className="text-xs text-slate-500">Powered by OpenStreetMap</p>
        </div>
        {(origin.selected || dest.selected || hasRoute) && (
          <button onClick={handleClear} className="ml-auto btn-ghost text-xs text-red-400 hover:text-red-300" aria-label="Reset">
            Reset
          </button>
        )}
      </div>

      {/* Location inputs */}
      <div className="relative flex flex-col gap-2">
        <AutocompleteInput
          id="origin-input"
          placeholder="Origin — search a place..."
          value={origin.query}
          icon="🟢"
          accentColor="text-emerald-400"
          onChange={(v) => setOrigin(prev => ({ ...prev, query: v }))}
          onSelect={handleOriginSelect}
        />

        {/* Swap button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <button
            onClick={handleSwap}
            disabled={!origin.selected && !dest.selected}
            className="btn-ghost disabled:opacity-30 text-base"
            aria-label="Swap origin and destination"
            title="Swap"
          >⇅</button>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <AutocompleteInput
          id="destination-input"
          placeholder="Destination — search a place..."
          value={dest.query}
          icon="🔴"
          accentColor="text-red-400"
          onChange={(v) => setDest(prev => ({ ...prev, query: v }))}
          onSelect={handleDestSelect}
        />
      </div>

      {/* Locate Me */}
      <button
        onClick={onLocateMe}
        disabled={locating}
        className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 
                   disabled:opacity-50 transition-colors font-medium"
        id="locate-me-btn"
      >
        {locating ? <LoadingSpinner size="sm" /> : <span>📍</span>}
        {locating ? 'Locating...' : 'Use my current location as origin'}
      </button>

      {/* Travel mode */}
      <div className="glass-card p-1.5 flex gap-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            id={`mode-${m.value}`}
            onClick={() => setMode(m.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${mode === m.value
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Get Route button */}
      <button
        id="get-route-btn"
        onClick={() => onGetRoute(mode)}
        disabled={!canRoute}
        className="btn-primary"
      >
        {loading ? (
          <><LoadingSpinner size="sm" /> Calculating route...</>
        ) : (
          <><span>🧭</span> Get Directions</>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="glass-card p-3 border-red-500/30 bg-red-500/10 animate-fade-in-up">
          <p className="text-sm text-red-300 flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <span>{error}</span>
          </p>
        </div>
      )}
    </div>
  )
}
