// SENTINEL NER - Geolocation & Reverse Geocoding Service
// Uses Browser Geolocation API + OpenStreetMap Nominatim for real location detection

export interface UserLocation {
  lat: number
  lon: number
  city: string
  district: string
  state: string
  country: string
  displayName: string
  isDetected: boolean
  isFallback?: boolean
  isNER?: boolean
  error?: string | null
  detectedAt?: string
}

export const NER_STATES = [
  'arunachal pradesh',
  'assam',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'sikkim',
  'tripura',
]

export function checkIsNER(stateName?: string, districtName?: string): boolean {
  const s = (stateName || '').toLowerCase()
  const d = (districtName || '').toLowerCase()
  return NER_STATES.some((ner) => s.includes(ner) || d.includes(ner))
}

// Fallback regional center when GPS is denied or unavailable
export const DEFAULT_FALLBACK_LOCATION: UserLocation = {
  lat: 24.33,
  lon: 93.67,
  city: 'Churachandpur',
  district: 'Churachandpur',
  state: 'Manipur',
  country: 'India',
  displayName: 'Churachandpur, Manipur',
  isDetected: false,
  isFallback: true,
  isNER: true,
  error: null,
  detectedAt: 'Default Regional Baseline',
}

const STORAGE_KEY = 'sentinel_user_location'

/**
 * Reverse geocodes latitude and longitude into human-readable address
 * using OpenStreetMap Nominatim (public open service).
 */
export async function reverseGeocode(lat: number, lon: number): Promise<UserLocation> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 7000)

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`)
    }

    const data = await response.json()
    const addr = data.address || {}

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.suburb ||
      addr.county ||
      addr.state_district ||
      'Monitored Location'

    const district = addr.state_district || addr.county || city
    const state = addr.state || 'India'
    const country = addr.country || 'India'

    const displayName = `${city}, ${state}`
    const isNER = checkIsNER(state, district)

    const locationResult: UserLocation = {
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      city,
      district,
      state,
      country,
      displayName,
      isDetected: true,
      isFallback: false,
      isNER,
      error: null,
      detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    // Cache in sessionStorage
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(locationResult))
    } catch (_) {
      // storage unavailable or full
    }

    return locationResult
  } catch (err: any) {
    console.warn('[locationService] Reverse geocoding failed, using coordinate label:', err)
    return {
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      city: `Coord (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
      district: 'Monitored Sector',
      state: 'India',
      country: 'India',
      displayName: `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
      isDetected: true,
      isFallback: false,
      error: null,
      detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  }
}

/**
 * Triggers browser GPS location prompt, retrieves device coordinates,
 * and calls reverse geocoding to resolve city/district/state.
 */
export async function detectBrowserLocation(): Promise<UserLocation> {
  // Check cached location in sessionStorage first for instant load
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed && parsed.isDetected && parsed.lat && parsed.lon) {
        return parsed
      }
    }
  } catch (_) {}

  if (!navigator.geolocation) {
    return {
      ...DEFAULT_FALLBACK_LOCATION,
      error: 'Geolocation API not supported by browser',
    }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const resolvedLocation = await reverseGeocode(latitude, longitude)
        resolve(resolvedLocation)
      },
      (error) => {
        let msg = 'Location detection unavailable'
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'GPS permission denied by user'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS position unavailable'
        } else if (error.code === error.TIMEOUT) {
          msg = 'GPS satellite lock timed out'
        }
        console.warn(`[locationService] ${msg}:`, error.message)
        resolve({
          ...DEFAULT_FALLBACK_LOCATION,
          error: msg,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 120000,
      }
    )
  })
}

/**
 * Clears cached location from sessionStorage and forces a fresh GPS lock
 */
export async function forceRedetectLocation(): Promise<UserLocation> {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch (_) {}
  return detectBrowserLocation()
}
