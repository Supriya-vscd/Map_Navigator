import { useState, useCallback } from 'react'
import MapView from './components/MapView'
import SearchPanel from './components/SearchPanel'
import RouteInfo from './components/RouteInfo'
import { useGeolocation } from './hooks/useGeolocation'
import { GeocodeResult, RouteResult, TravelMode, getRoute } from './api/mapApi'

export default function App() {
  const [origin, setOrigin] = useState<GeocodeResult | null>(null)
  const [destination, setDestination] = useState<GeocodeResult | null>(null)
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark')

  const { position: userPosition, loading: locating, locate } = useGeolocation()

  // When user clicks "Use my location" → set as origin and fly there
  const handleLocateMe = useCallback(() => {
    locate()
  }, [locate])

  // Fly map when user location is obtained; also fill origin
  const handleOriginChange = useCallback((r: GeocodeResult | null) => {
    setOrigin(r)
    setRoute(null)
    setRouteError(null)
    if (r) setFlyTarget([r.lat, r.lon])
  }, [])

  const handleDestinationChange = useCallback((r: GeocodeResult | null) => {
    setDestination(r)
    setRoute(null)
    setRouteError(null)
    if (r) setFlyTarget([r.lat, r.lon])
  }, [])

  const handleGetRoute = useCallback(async (mode: TravelMode) => {
    // Use user location as origin if no origin selected
    const start: [number, number] | null = origin
      ? [origin.lat, origin.lon]
      : userPosition
      ? [userPosition.lat, userPosition.lng]
      : null

    const end: [number, number] | null = destination
      ? [destination.lat, destination.lon]
      : null

    if (!start || !end) {
      setRouteError('Please select both an origin and a destination.')
      return
    }

    setRouteLoading(true)
    setRouteError(null)
    setFlyTarget(null) // let FitBounds handle the view

    try {
      const result = await getRoute(start, end, mode)
      setRoute(result)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to calculate route. Please try again.'
      setRouteError(msg)
    } finally {
      setRouteLoading(false)
    }
  }, [origin, destination, userPosition])

  const handleClear = useCallback(() => {
    setRoute(null)
    setRouteError(null)
    setFlyTarget(null)
  }, [])

  // Sync user location → fly map when locate() resolves
  const effectiveFlyTarget: [number, number] | null =
    flyTarget ??
    (userPosition && !origin ? [userPosition.lat, userPosition.lng] : null)

  return (
    <div className="flex h-screen w-screen bg-surface-950 overflow-hidden font-sans">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`relative z-10 flex flex-col h-full bg-surface-950/95 backdrop-blur-xl
          border-r border-white/10 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-[380px] min-w-[380px]' : 'w-0 min-w-0 overflow-hidden'}`}
      >
        <SearchPanel
          onOriginChange={handleOriginChange}
          onDestinationChange={handleDestinationChange}
          onGetRoute={handleGetRoute}
          onLocateMe={handleLocateMe}
          onClear={handleClear}
          loading={routeLoading}
          error={routeError}
          locating={locating}
          hasRoute={!!route}
        />

        {/* Route info — shown below search panel */}
        {route && (
          <div className="px-4 pb-4">
            <RouteInfo route={route} onClear={handleClear} />
          </div>
        )}
      </aside>

      {/* ── Sidebar toggle button ─────────────────────────── */}
      <button
        id="sidebar-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20
          bg-surface-900/90 border border-white/10 text-slate-300 hover:text-white
          hover:bg-surface-800 transition-all duration-200 rounded-r-xl
          px-1.5 py-4 shadow-glass"
        style={{ left: sidebarOpen ? '380px' : '0' }}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      {/* ── Map ──────────────────────────────────────────────── */}
      <main className="flex-1 relative">
        <MapView
          origin={origin ? [origin.lat, origin.lon] : null}
          destination={destination ? [destination.lat, destination.lon] : null}
          originLabel={origin?.display_name ?? ''}
          destinationLabel={destination?.display_name ?? ''}
          userLocation={userPosition ? [userPosition.lat, userPosition.lng] : null}
          route={route}
          flyTarget={effectiveFlyTarget}
          mapTheme={mapTheme}
        />

        {/* ── Map theme toggle ─────────────────────────────── */}
        <button
          id="map-theme-toggle"
          onClick={() => setMapTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          aria-label={mapTheme === 'dark' ? 'Switch to light map' : 'Switch to dark map'}
          title={mapTheme === 'dark' ? 'Switch to light map' : 'Switch to dark map'}
          className="absolute top-3 right-3 z-[500] flex items-center gap-1.5
            bg-surface-900/90 hover:bg-surface-800 border border-white/10
            text-slate-200 hover:text-white text-sm font-medium
            px-3 py-2 rounded-xl shadow-glass backdrop-blur-md
            transition-all duration-200 select-none"
        >
          <span className="text-base leading-none">
            {mapTheme === 'dark' ? '☀️' : '🌙'}
          </span>
          <span>{mapTheme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Map attribution overlay tweak */}
        <div className="absolute bottom-2 left-2 z-10 text-[10px] text-slate-500 select-none pointer-events-none">
          © OpenStreetMap · CARTO · OSRM
        </div>
      </main>
    </div>
  )
}
