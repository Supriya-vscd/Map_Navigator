import { useState, useCallback } from 'react'

export interface GeoPosition {
  lat: number
  lng: number
}

interface UseGeolocationReturn {
  position: GeoPosition | null
  loading: boolean
  error: string | null
  locate: () => void
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Location permission denied. Please allow access.'
            : 'Unable to determine your location.'
        )
        setLoading(false)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [])

  return { position, loading, error, locate }
}
