import { useEffect, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  ZoomControl,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RouteResult } from '../api/mapApi'

// ── Fix Leaflet's broken default icon URLs when bundled ─────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom colored markers
const makeIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

const originIcon = makeIcon('blue')
const destIcon = makeIcon('red')
const userIcon = makeIcon('green')

// ── FlyTo controller ────────────────────────────────────────────
interface FlyToProps {
  target: [number, number] | null
  zoom?: number
}
function FlyTo({ target, zoom = 14 }: FlyToProps) {
  const map = useMap()
  const prevTarget = useRef<[number, number] | null>(null)
  useEffect(() => {
    if (target && target !== prevTarget.current) {
      map.flyTo(target, zoom, { duration: 1.2 })
      prevTarget.current = target
    }
  }, [map, target, zoom])
  return null
}

// ── FitBounds controller ─────────────────────────────────────────
interface FitBoundsProps {
  route: RouteResult | null
}
function FitBoundsOnRoute({ route }: FitBoundsProps) {
  const map = useMap()
  useEffect(() => {
    if (!route) return
    const coords = route.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    )
    if (coords.length >= 2) {
      map.fitBounds(coords, { padding: [60, 60], duration: 1 })
    }
  }, [map, route])
  return null
}

// ── Props ────────────────────────────────────────────────────────
interface MapViewProps {
  origin: [number, number] | null
  destination: [number, number] | null
  originLabel: string
  destinationLabel: string
  userLocation: [number, number] | null
  route: RouteResult | null
  flyTarget: [number, number] | null
  mapTheme: 'dark' | 'light'
}

const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const

export default function MapView({
  origin,
  destination,
  originLabel,
  destinationLabel,
  userLocation,
  route,
  flyTarget,
  mapTheme,
}: MapViewProps) {
  const tile = TILE_LAYERS[mapTheme]
  const routeColor = mapTheme === 'dark' ? '#28a4fc' : '#1a73e8'
  const routeGlow  = mapTheme === 'dark' ? '#1285f1' : '#1a73e8'
  // Derive polyline coordinates from GeoJSON (lng,lat → lat,lng)
  const polylinePositions: [number, number][] = route
    ? route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    : []

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      zoomControl={false}
      className="h-full w-full"
    >
      {/* Tile layer — switches with mapTheme */}
      <TileLayer
        key={mapTheme}
        url={tile.url}
        attribution={tile.attribution}
        maxZoom={19}
      />

      <ZoomControl position="bottomright" />

      {/* Fly & fit controllers */}
      <FlyTo target={flyTarget} zoom={13} />
      <FitBoundsOnRoute route={route} />

      {/* User location marker */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup className="rounded-xl">
            <span className="font-semibold text-slate-800">📍 Your Location</span>
          </Popup>
        </Marker>
      )}

      {/* Origin marker */}
      {origin && (
        <Marker position={origin} icon={originIcon}>
          <Popup>
            <span className="font-semibold text-slate-800">🟢 {originLabel || 'Origin'}</span>
          </Popup>
        </Marker>
      )}

      {/* Destination marker */}
      {destination && (
        <Marker position={destination} icon={destIcon}>
          <Popup>
            <span className="font-semibold text-slate-800">🔴 {destinationLabel || 'Destination'}</span>
          </Popup>
        </Marker>
      )}

      {/* Route polyline */}
      {polylinePositions.length > 1 && (
        <>
          {/* Glowing shadow */}
          <Polyline
            positions={polylinePositions}
            pathOptions={{ color: routeGlow, weight: 8, opacity: 0.25 }}
          />
          {/* Main line */}
          <Polyline
            positions={polylinePositions}
            pathOptions={{ color: routeColor, weight: 4, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
          />
        </>
      )}
    </MapContainer>
  )
}
