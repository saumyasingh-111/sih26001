// SENTINEL NER - Dual Data Pipeline & Scenario Engine
// Live Weather Forecast Telemetry (IMD / OpenWeather API simulation)
// Historical Landslide & Soil Baseline (ISRO Bhuvan / NESDR regional logs)
// Simulated Disaster Scenario (Flash Flood & Debris Flow Emergency)

export interface WeatherTelemetry {
  stationId: string
  district: string
  state: string
  currentRainfallRate: number // mm/hr
  cumulative24h: number // mm
  windSpeed: number // km/h
  windDirection: string
  humidity: number // %
  temperature: number // °C
  soilSaturationIndex: number // % (calculated dynamically)
  porePressureRatio: number
  forecastNext6h: number // mm
  forecast7d: Array<{
    day: string
    rainfall: number // mm
    riskProbability: number // %
    condition: string
  }>
  lastSync: string
}

export interface HistoricalBaseline {
  district: string
  state: string
  historicalEventsCount: number
  meanAnnualRainfall: number // mm
  soilType: string
  criticalSlopeAngle: number // degrees
  bhuvanHazardZone: 'Zone I (Very Low)' | 'Zone II (Low)' | 'Zone III (Moderate)' | 'Zone IV (High)' | 'Zone V (Very High)'
  susceptibilityIndex: number // 0-100
  lastMajorIncident: string
}

export interface RoadBlockage {
  id: string
  route: string
  location: string
  coordinates: [number, number]
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE'
  cause: string
  clearingTimeEst: string
  detourAvailable: boolean
}

export interface FloodInundationZone {
  id: string
  zoneName: string
  centerCoords: [number, number]
  radiusMeters: number
  floodDepthEst: string
  affectedPopulationEst: number
  status: 'SURGING' | 'CRESTING' | 'RECEDING'
}

export interface DispatchRoute {
  id: string
  name: string
  status: 'CLEAR' | 'CAUTION' | 'BLOCKED'
  destination: string
  coordinates: Array<[number, number]>
  transitTimeMin: number
}

export interface DisasterScenario {
  id: string
  name: string
  subtitle: string
  district: string
  state: string
  epicenterCoords: [number, number]
  rainfallSpike: string // "240mm / 6hrs"
  riskScore: number // 94%
  riskLevel: 'CRITICAL'
  status: 'EMERGENCY SCENARIO ACTIVE'
  roadBlockages: RoadBlockage[]
  floodInundationZones: FloodInundationZone[]
  dispatchRoutes: DispatchRoute[]
  voiceTranscripts: Array<{
    id: string
    sender: string
    role: string
    timestamp: string
    transcript: string
    confidence: number
    sentiment: 'URGENT' | 'HIGH' | 'ALERT'
  }>
}

// 1. Historical Baseline Registry (ISRO Bhuvan / NESDR)
export const historicalBaselines: Record<string, HistoricalBaseline> = {
  Churachandpur: {
    district: 'Churachandpur',
    state: 'Manipur',
    historicalEventsCount: 42,
    meanAnnualRainfall: 2180,
    soilType: 'Residual Clayey Silt over Shale',
    criticalSlopeAngle: 34,
    bhuvanHazardZone: 'Zone V (Very High)',
    susceptibilityIndex: 88,
    lastMajorIncident: 'Aug 2024 (Debris flow along NH-102B)',
  },
  'East Khasi Hills': {
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    historicalEventsCount: 68,
    meanAnnualRainfall: 11430, // Cherrapunjee/Mawsynram belt
    soilType: 'Lateritic Sandy Loam over Sandstone',
    criticalSlopeAngle: 38,
    bhuvanHazardZone: 'Zone V (Very High)',
    susceptibilityIndex: 92,
    lastMajorIncident: 'Jul 2025 (Sohra escarpment rotational slip)',
  },
  'Dima Hasao': {
    district: 'Dima Hasao',
    state: 'Assam',
    historicalEventsCount: 51,
    meanAnnualRainfall: 2450,
    soilType: 'Weathered Sandstone & Mudstone',
    criticalSlopeAngle: 32,
    bhuvanHazardZone: 'Zone IV (High)',
    susceptibilityIndex: 84,
    lastMajorIncident: 'May 2022 (New Haflong railway station collapse)',
  },
  'Upper Siang': {
    district: 'Upper Siang',
    state: 'Arunachal Pradesh',
    historicalEventsCount: 39,
    meanAnnualRainfall: 3600,
    soilType: 'Fluvial Colluvium & Phyllite',
    criticalSlopeAngle: 42,
    bhuvanHazardZone: 'Zone V (Very High)',
    susceptibilityIndex: 89,
    lastMajorIncident: 'Jun 2024 (Tuting road breach)',
  },
  Kohima: {
    district: 'Kohima',
    state: 'Nagaland',
    historicalEventsCount: 47,
    meanAnnualRainfall: 1980,
    soilType: 'Disintegrated Disang Shale',
    criticalSlopeAngle: 30,
    bhuvanHazardZone: 'Zone IV (High)',
    susceptibilityIndex: 82,
    lastMajorIncident: 'Aug 2023 (Dzüdza river mudflow)',
  },
  Champhai: {
    district: 'Champhai',
    state: 'Mizoram',
    historicalEventsCount: 33,
    meanAnnualRainfall: 2050,
    soilType: 'Weathered Silty Sandstone',
    criticalSlopeAngle: 36,
    bhuvanHazardZone: 'Zone IV (High)',
    susceptibilityIndex: 79,
    lastMajorIncident: 'Oct 2024 (Zokhawthar border slip)',
  },
  Namchi: {
    district: 'Namchi',
    state: 'Sikkim',
    historicalEventsCount: 56,
    meanAnnualRainfall: 2800,
    soilType: 'Micaceous Gneiss Colluvium',
    criticalSlopeAngle: 40,
    bhuvanHazardZone: 'Zone V (Very High)',
    susceptibilityIndex: 86,
    lastMajorIncident: 'Oct 2023 (Teesta glacial-lake cascade)',
  },
  'West Garo Hills': {
    district: 'West Garo Hills',
    state: 'Meghalaya',
    historicalEventsCount: 29,
    meanAnnualRainfall: 2900,
    soilType: 'Red Loamy Sedimentary Regolith',
    criticalSlopeAngle: 28,
    bhuvanHazardZone: 'Zone III (Moderate)',
    susceptibilityIndex: 68,
    lastMajorIncident: 'Sep 2024 (Tura hillside slumping)',
  },
}

// Helper: Calculate Soil Saturation Index dynamically based on rainfall intensity
export function calculateSoilSaturation(cumulative24hMm: number, baselineCapacity: number = 200): number {
  const saturationRatio = (cumulative24hMm / baselineCapacity) * 100
  return Math.min(99, Math.max(25, Math.round(saturationRatio)))
}

// 2. Real-Time / 7-Day Weather Forecast Telemetry (Live Mode)
export const liveWeatherTelemetry: Record<string, WeatherTelemetry> = {
  Churachandpur: {
    stationId: 'IMD-CCPUR-09',
    district: 'Churachandpur',
    state: 'Manipur',
    currentRainfallRate: 18.4,
    cumulative24h: 142.0,
    windSpeed: 24,
    windDirection: 'SSW',
    humidity: 89,
    temperature: 22.4,
    soilSaturationIndex: calculateSoilSaturation(142.0),
    porePressureRatio: 0.68,
    forecastNext6h: 46.0,
    forecast7d: [
      { day: 'Mon', rainfall: 32, riskProbability: 54, condition: 'Heavy Rain' },
      { day: 'Tue', rainfall: 58, riskProbability: 66, condition: 'Severe Deluge' },
      { day: 'Wed', rainfall: 24, riskProbability: 48, condition: 'Showers' },
      { day: 'Thu', rainfall: 92, riskProbability: 82, condition: 'Thunderstorm' },
      { day: 'Fri', rainfall: 114, riskProbability: 86, condition: 'Torrential Rain' },
      { day: 'Sat', rainfall: 84, riskProbability: 74, condition: 'Heavy Downpour' },
      { day: 'Sun', rainfall: 128, riskProbability: 91, condition: 'Monsoon Spike' },
    ],
    lastSync: 'Live (2m ago)',
  },
  'East Khasi Hills': {
    stationId: 'IMD-EKH-03',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    currentRainfallRate: 26.8,
    cumulative24h: 185.0,
    windSpeed: 32,
    windDirection: 'S',
    humidity: 94,
    temperature: 18.2,
    soilSaturationIndex: calculateSoilSaturation(185.0),
    porePressureRatio: 0.79,
    forecastNext6h: 68.0,
    forecast7d: [
      { day: 'Mon', rainfall: 45, riskProbability: 62, condition: 'Heavy Rain' },
      { day: 'Tue', rainfall: 72, riskProbability: 75, condition: 'Severe Deluge' },
      { day: 'Wed', rainfall: 35, riskProbability: 55, condition: 'Showers' },
      { day: 'Thu', rainfall: 110, riskProbability: 88, condition: 'Thunderstorm' },
      { day: 'Fri', rainfall: 140, riskProbability: 92, condition: 'Torrential Deluge' },
      { day: 'Sat', rainfall: 95, riskProbability: 80, condition: 'Heavy Rain' },
      { day: 'Sun', rainfall: 160, riskProbability: 95, condition: 'Monsoon Cloudburst' },
    ],
    lastSync: 'Live (1m ago)',
  },
}

// Fallback generator for other districts
export function getDistrictWeather(districtName: string): WeatherTelemetry {
  if (liveWeatherTelemetry[districtName]) return liveWeatherTelemetry[districtName]
  const baseRain = 95 + (districtName.length * 11) % 80
  return {
    stationId: `IMD-${districtName.substring(0, 3).toUpperCase()}-01`,
    district: districtName,
    state: 'North Eastern Region',
    currentRainfallRate: 12.5,
    cumulative24h: baseRain,
    windSpeed: 18,
    windDirection: 'SW',
    humidity: 84,
    temperature: 24.1,
    soilSaturationIndex: calculateSoilSaturation(baseRain),
    porePressureRatio: 0.52,
    forecastNext6h: 30.0,
    forecast7d: [
      { day: 'Mon', rainfall: 22, riskProbability: 40, condition: 'Moderate Rain' },
      { day: 'Tue', rainfall: 44, riskProbability: 55, condition: 'Heavy Showers' },
      { day: 'Wed', rainfall: 38, riskProbability: 50, condition: 'Rain' },
      { day: 'Thu', rainfall: 62, riskProbability: 68, condition: 'Thunderstorm' },
      { day: 'Fri', rainfall: 88, riskProbability: 78, condition: 'Heavy Rain' },
      { day: 'Sat', rainfall: 70, riskProbability: 65, condition: 'Showers' },
      { day: 'Sun', rainfall: 95, riskProbability: 82, condition: 'Heavy Downpour' },
    ],
    lastSync: 'Live (4m ago)',
  }
}

// 3. High-Impact Simulated Disaster Scenario (Demo Mode)
export const demoDisasterScenario: DisasterScenario = {
  id: 'SCENARIO-NER-2026-09A',
  name: 'Severe Flash Flood & Debris Flow',
  subtitle: 'Sub-division 04 (Churachandpur / Assam-Meghalaya Border)',
  district: 'Churachandpur',
  state: 'Manipur',
  epicenterCoords: [24.333, 93.674],
  rainfallSpike: '240mm / 6hrs',
  riskScore: 94,
  riskLevel: 'CRITICAL',
  status: 'EMERGENCY SCENARIO ACTIVE',
  roadBlockages: [
    {
      id: 'BLK-01',
      route: 'National Highway 102B',
      location: 'KM-42 Mountain Cutting',
      coordinates: [24.352, 93.688],
      severity: 'CRITICAL',
      cause: 'Mudslide & boulder debris blocking both lanes (150m)',
      clearingTimeEst: '6 - 8 hours',
      detourAvailable: false,
    },
    {
      id: 'BLK-02',
      route: 'Sub-division Road 04',
      location: 'Tuitha River Crossing Bridge',
      coordinates: [24.321, 93.645],
      severity: 'CRITICAL',
      cause: 'Bridge structural compromise from flash flood debris surge',
      clearingTimeEst: '18 - 24 hours',
      detourAvailable: true,
    },
    {
      id: 'BLK-03',
      route: 'Hill Access Trunk Road C',
      location: 'Slope Sector 8 Ridge',
      coordinates: [24.385, 93.712],
      severity: 'HIGH',
      cause: 'Tension cracks and 20m road subsidence',
      clearingTimeEst: '4 hours',
      detourAvailable: true,
    },
  ],
  floodInundationZones: [
    {
      id: 'INUND-01',
      zoneName: 'Tuitha River Basin Lowlands',
      centerCoords: [24.325, 93.652],
      radiusMeters: 3800,
      floodDepthEst: '1.8m - 2.4m Surge',
      affectedPopulationEst: 4200,
      status: 'SURGING',
    },
    {
      id: 'INUND-02',
      zoneName: 'Khuga Valley Agricultural Corridor',
      centerCoords: [24.368, 93.695],
      radiusMeters: 2600,
      floodDepthEst: '1.1m Inundation',
      affectedPopulationEst: 1850,
      status: 'CRESTING',
    },
  ],
  dispatchRoutes: [
    {
      id: 'RTE-CHARLIE',
      name: 'Emergency Evacuation Corridor Charlie',
      status: 'CLEAR',
      destination: 'District Multi-Purpose Relief Center',
      coordinates: [
        [24.31, 93.62],
        [24.325, 93.635],
        [24.34, 93.66],
      ],
      transitTimeMin: 22,
    },
    {
      id: 'RTE-AIR',
      name: 'Helipad Alpha Air-Drop Corridor',
      status: 'CLEAR',
      destination: 'Upper Ridge Landing Zone',
      coordinates: [
        [24.36, 93.72],
        [24.375, 93.735],
      ],
      transitTimeMin: 8,
    },
  ],
  voiceTranscripts: [
    {
      id: 'V-TRANS-01',
      sender: 'SDRF Patrol Unit 03 (Sub-Inspector R. Sharma)',
      role: 'Ground Truth Recon',
      timestamp: 'Just now (Simulated Live)',
      transcript:
        'Bridge at KM-42 compromised, mudslide blocking secondary evacuation route. Water level rising fast in Tuitha stream. Debris flow has breached the northern retaining wall. Requesting immediate traffic diversion and heavy earthmover clearance.',
      confidence: 97.4,
      sentiment: 'URGENT',
    },
    {
      id: 'V-TRANS-02',
      sender: 'District Disaster Management Cell',
      role: 'HQ Coordination',
      timestamp: '3m ago',
      transcript:
        'SDRF Battalion 2 mobilized with inflatable rescue boats towards Sub-division 04. Automated SMS sirens broadcast to 12,000 residents across high-vulnerability riverfront settlements.',
      confidence: 99.1,
      sentiment: 'ALERT',
    },
    {
      id: 'V-TRANS-03',
      sender: 'Community Rain Gauging Post CP-04',
      role: 'Automated Hydro Sensor',
      timestamp: '6m ago',
      transcript:
        'Flash precipitation threshold exceeded: 240mm recorded over past 6-hour operational window. Soil pore pressure sensor reading 0.94 critical failure threshold.',
      confidence: 99.8,
      sentiment: 'URGENT',
    },
  ],
}
