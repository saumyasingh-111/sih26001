// SENTINEL NER - Live Weather Telemetry Service (Open-Meteo Integration)
// Public Open API (Zero API key required, highly reliable)

export interface LiveWeatherData {
  district: string
  state: string
  coordinates: { lat: number; lon: number }
  temperature: number // °C
  relativeHumidity: number // %
  currentRainfall: number // mm
  precipitationProbability: number // %
  windSpeed: number // km/h
  windDirection: number // degrees
  elevation: number // meters
  forecast24hRain: number // mm
  forecastHourly: Array<{
    time: string
    rain: number
    probability: number
    temp: number
  }>
  forecastDaily: Array<{
    day: string
    date: string
    maxTemp: number
    minTemp: number
    totalRain: number
    riskProbability: number
  }>
  isLive: boolean
  lastFetched: string
  source: string
}

// District Geographic Coordinates across the North Eastern Region
export const DISTRICT_COORDINATES: Record<string, { lat: number; lon: number; state: string; fallbackElevation: number }> = {
  Churachandpur: { lat: 24.33, lon: 93.67, state: 'Manipur', fallbackElevation: 920 },
  'East Khasi Hills': { lat: 25.57, lon: 91.88, state: 'Meghalaya', fallbackElevation: 1496 },
  Tawang: { lat: 27.58, lon: 91.87, state: 'Arunachal Pradesh', fallbackElevation: 3048 },
  Gangtok: { lat: 27.33, lon: 88.62, state: 'Sikkim', fallbackElevation: 1650 },
  Aizawl: { lat: 23.73, lon: 92.71, state: 'Mizoram', fallbackElevation: 1132 },
  Kohima: { lat: 25.67, lon: 94.11, state: 'Nagaland', fallbackElevation: 1444 },
  Dibrugarh: { lat: 27.47, lon: 94.91, state: 'Assam', fallbackElevation: 108 },
  Agartala: { lat: 23.83, lon: 91.28, state: 'Tripura', fallbackElevation: 15 },
  'Dima Hasao': { lat: 25.17, lon: 93.02, state: 'Assam', fallbackElevation: 513 },
  'Upper Siang': { lat: 28.61, lon: 94.95, state: 'Arunachal Pradesh', fallbackElevation: 660 },
  Namchi: { lat: 27.17, lon: 88.35, state: 'Sikkim', fallbackElevation: 1315 },
  'West Garo Hills': { lat: 25.52, lon: 90.22, state: 'Meghalaya', fallbackElevation: 340 },
}

// In-memory cache for Open-Meteo responses (10-minute TTL)
const weatherCache = new Map<string, { data: LiveWeatherData; timestamp: number }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export async function getWeatherForCoordinates(
  lat: number,
  lon: number,
  locationName: string,
  stateName: string = 'India',
  fallbackElevation: number = 350
): Promise<LiveWeatherData> {
  const roundedLat = Number(lat.toFixed(4))
  const roundedLon = Number(lon.toFixed(4))
  const cacheKey = `${roundedLat}_${roundedLon}`

  const cached = weatherCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m&hourly=precipitation_probability,rain,temperature_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FKolkata&forecast_days=7`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`)
    }

    const json = await response.json()
    const current = json.current || {}
    const hourly = json.hourly || {}
    const daily = json.daily || {}

    // Parse hourly forecast for the next 24 hours
    const hourlyPoints: LiveWeatherData['forecastHourly'] = []
    const times = hourly.time || []
    const rains = hourly.rain || []
    const probs = hourly.precipitation_probability || []
    const temps = hourly.temperature_2m || []

    let forecast24hTotal = 0
    for (let i = 0; i < Math.min(24, times.length); i++) {
      const rainVal = Number(rains[i] || 0)
      forecast24hTotal += rainVal
      hourlyPoints.push({
        time: times[i] ? times[i].split('T')[1]?.slice(0, 5) || `${i}:00` : `${i}:00`,
        rain: rainVal,
        probability: Number(probs[i] || 0),
        temp: Number(temps[i] || 20),
      })
    }

    // Parse 7-day daily forecast
    const dailyPoints: LiveWeatherData['forecastDaily'] = []
    const dailyDates = daily.time || []
    const dailyMax = daily.temperature_2m_max || []
    const dailyMin = daily.temperature_2m_min || []
    const dailyRain = daily.precipitation_sum || []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 0; i < dailyDates.length; i++) {
      const d = new Date(dailyDates[i])
      const totalR = Number(dailyRain[i] || 0)
      dailyPoints.push({
        day: isNaN(d.getDay()) ? `Day ${i + 1}` : dayNames[d.getDay()],
        date: dailyDates[i],
        maxTemp: Math.round(Number(dailyMax[i] || 25)),
        minTemp: Math.round(Number(dailyMin[i] || 18)),
        totalRain: Math.round(totalR * 10) / 10,
        riskProbability: Math.min(95, Math.max(10, Math.round(totalR * 1.8 + 20))),
      })
    }

    const liveData: LiveWeatherData = {
      district: locationName,
      state: stateName,
      coordinates: { lat: roundedLat, lon: roundedLon },
      temperature: Math.round(Number(current.temperature_2m ?? 22)),
      relativeHumidity: Math.round(Number(current.relative_humidity_2m ?? 85)),
      currentRainfall: Number(current.rain ?? current.precipitation ?? 0),
      precipitationProbability: Number(probs[0] ?? 45),
      windSpeed: Math.round(Number(current.wind_speed_10m ?? 8)),
      windDirection: Math.round(Number(current.wind_direction_10m ?? 180)),
      elevation: json.elevation || fallbackElevation,
      forecast24hRain: Math.round(forecast24hTotal * 10) / 10,
      forecastHourly: hourlyPoints,
      forecastDaily: dailyPoints,
      isLive: true,
      lastFetched: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'Open-Meteo API (Live Telemetry)',
    }

    weatherCache.set(cacheKey, { data: liveData, timestamp: Date.now() })
    return liveData
  } catch (error) {
    console.warn(`[weatherService] Live fetch failed for ${locationName} (${lat}, ${lon}), using baseline:`, error)
    return getFallbackWeather(locationName, { lat: roundedLat, lon: roundedLon, state: stateName, fallbackElevation })
  }
}

export async function getCurrentWeather(districtName: string): Promise<LiveWeatherData> {
  const geo = DISTRICT_COORDINATES[districtName] || DISTRICT_COORDINATES['Churachandpur']
  return getWeatherForCoordinates(geo.lat, geo.lon, districtName, geo.state, geo.fallbackElevation)
}

// Resilient Offline / Fallback Data Provider
export function getFallbackWeather(
  districtName: string,
  geo = DISTRICT_COORDINATES[districtName] || DISTRICT_COORDINATES['Churachandpur']
): LiveWeatherData {
  return {
    district: districtName,
    state: geo.state,
    coordinates: { lat: geo.lat, lon: geo.lon },
    temperature: 22,
    relativeHumidity: 88,
    currentRainfall: 1.4,
    precipitationProbability: 65,
    windSpeed: 12,
    windDirection: 190,
    elevation: geo.fallbackElevation,
    forecast24hRain: 48.5,
    forecastHourly: [
      { time: '00:00', rain: 0.8, probability: 40, temp: 20 },
      { time: '04:00', rain: 1.2, probability: 55, temp: 19 },
      { time: '08:00', rain: 3.4, probability: 70, temp: 22 },
      { time: '12:00', rain: 6.8, probability: 85, temp: 24 },
      { time: '16:00', rain: 4.2, probability: 75, temp: 23 },
      { time: '20:00', rain: 2.1, probability: 60, temp: 21 },
    ],
    forecastDaily: [
      { day: 'Mon', date: '2026-09-07', maxTemp: 25, minTemp: 19, totalRain: 28, riskProbability: 52 },
      { day: 'Tue', date: '2026-09-08', maxTemp: 24, minTemp: 18, totalRain: 44, riskProbability: 66 },
      { day: 'Wed', date: '2026-09-09', maxTemp: 26, minTemp: 19, totalRain: 18, riskProbability: 42 },
      { day: 'Thu', date: '2026-09-10', maxTemp: 23, minTemp: 18, totalRain: 62, riskProbability: 78 },
      { day: 'Fri', date: '2026-09-11', maxTemp: 22, minTemp: 17, totalRain: 78, riskProbability: 86 },
      { day: 'Sat', date: '2026-09-12', maxTemp: 24, minTemp: 18, totalRain: 52, riskProbability: 72 },
      { day: 'Sun', date: '2026-09-13', maxTemp: 25, minTemp: 19, totalRain: 36, riskProbability: 58 },
    ],
    isLive: false,
    lastFetched: 'Offline Fallback Baseline',
    source: 'Regional Baseline Model (Offline Cache)',
  }
}
