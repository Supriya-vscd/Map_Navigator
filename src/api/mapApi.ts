import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// ── Types ──────────────────────────────────────────────────────────
export interface GeocodeResult {
  place_id: number
  display_name: string
  lat: number
  lon: number
  type: string
  importance: number
}

export interface RouteStep {
  instruction: string
  modifier: string | null
  name: string
  distance_m: number
  duration_s: number
}

export interface RouteResult {
  distance_m: number
  duration_s: number
  geometry: GeoJSON.LineString
  steps: RouteStep[]
}

export type TravelMode = 'driving' | 'walking' | 'cycling'

// ── API calls ──────────────────────────────────────────────────────

/** Search for a place by name or address. */
export async function geocode(query: string): Promise<GeocodeResult[]> {
  const { data } = await api.get<GeocodeResult[]>('/geocode', {
    params: { q: query },
  })
  return data
}

/** Calculate a route between two coordinates. */
export async function getRoute(
  start: [number, number],
  end: [number, number],
  mode: TravelMode = 'driving'
): Promise<RouteResult> {
  const { data } = await api.get<RouteResult>('/route', {
    params: {
      start: `${start[0]},${start[1]}`,
      end: `${end[0]},${end[1]}`,
      mode,
    },
  })
  return data
}

// ── Formatting helpers ─────────────────────────────────────────────

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} hr ${m} min`
  if (m > 0) return `${m} min`
  return `${seconds} sec`
}

export function maneuverIcon(type: string, modifier?: string | null): string {
  if (type === 'arrive') return '🏁'
  if (type === 'depart') return '🚀'
  if (type === 'roundabout' || type === 'rotary') return '🔄'
  if (modifier === 'left' || modifier === 'sharp left' || modifier === 'slight left') return '⬅️'
  if (modifier === 'right' || modifier === 'sharp right' || modifier === 'slight right') return '➡️'
  if (modifier === 'uturn') return '↩️'
  if (type === 'merge') return '🔀'
  return '⬆️'
}
