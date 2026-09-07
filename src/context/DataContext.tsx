import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { LiveWeatherData, getCurrentWeather, getWeatherForCoordinates, getFallbackWeather } from '../services/weatherService'
import { HISTORICAL_LANDSLIDES, HistoricalLandslideEvent } from '../data/historicalLandslides'
import { getDistrictHistoricalSummary } from '../services/landslideService'
import {
  Alert,
  initialAlerts,
  regions,
  Region,
  FieldReport,
  initialReports,
  Incident,
} from '../data/demoData'
import { demoDisasterScenario, DisasterScenario } from '../services/dataEngine'
import {
  UserLocation,
  DEFAULT_FALLBACK_LOCATION,
  detectBrowserLocation,
  forceRedetectLocation,
  checkIsNER,
} from '../services/locationService'
import { CHURACHANDPUR_DEMO_SCENARIO } from '../data/demoScenario'

export type DataMode = 'live' | 'demo'

export interface ConnectivityZone {
  district: string
  status: 'CONNECTED' | 'WEAK' | 'NO CONNECTIVITY'
  signalStrengthPercent: number
  primaryTower: string
  backupRadioChannel: string
  isHighRiskVulnerable: boolean
}

export interface EarlyWarningAction {
  id: string
  title: string
  description: string
  urgency: 'IMMEDIATE' | 'PRIORITY' | 'WATCH'
  targetSector: string
  status: 'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED'
  rejectionReason?: string
  modifiedNotes?: string
  actionOfficer?: string
  decidedAt?: string
}

export interface DataContextType {
  dataMode: DataMode
  isDemoMode: boolean
  setMode: (mode: DataMode) => void
  toggleMode: () => void
  resetDemoState: () => void

  // Real GPS & Location Detection
  userLocation: UserLocation
  isNER: boolean
  locationLoading: boolean
  locationError: string | null
  redetectLocation: () => Promise<void>
  activeLocationName: string
  activeLocationCoords: { lat: number; lon: number }
  isGpsDetected: boolean

  // District & Region
  activeDistrict: string
  setActiveDistrict: (name: string) => void
  activeRegion: Region

  // Live Weather
  weather: LiveWeatherData
  weatherLoading: boolean
  weatherError: string | null
  refreshWeather: () => Promise<void>

  // Risk & Alerts State
  liveRiskScore: number
  liveRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  activeAlertsCount: number
  highRiskZonesCount: number
  systemStatusLabel: string
  hasHistoricalEventsForLocation: boolean

  // Datasets & Operational State
  historicalLandslides: HistoricalLandslideEvent[]
  historicalSummary: ReturnType<typeof getDistrictHistoricalSummary>
  scenario: DisasterScenario
  demoScenario: typeof CHURACHANDPUR_DEMO_SCENARIO
  connectivityZones: ConnectivityZone[]
  alerts: Alert[]
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>
  incident: Incident | null
  setIncident: React.Dispatch<React.SetStateAction<Incident | null>>
  reports: FieldReport[]
  setReports: React.Dispatch<React.SetStateAction<FieldReport[]>>
  warningActions: EarlyWarningAction[]
  approveAction: (actionId: string, notes?: string) => void
  modifyAction: (actionId: string, modifiedNotes: string) => void
  rejectAction: (actionId: string, reason: string) => void
}

const DataContext = createContext<DataContextType | null>(null)

// Connectivity / Blackout Registry across monitored districts
export const INITIAL_CONNECTIVITY_ZONES: ConnectivityZone[] = [
  {
    district: 'Churachandpur',
    status: 'WEAK',
    signalStrengthPercent: 28,
    primaryTower: 'BSNL Hill Mast CP-04 (Degraded)',
    backupRadioChannel: 'HF Channel 4 (14.225 MHz)',
    isHighRiskVulnerable: true,
  },
  {
    district: 'East Khasi Hills',
    status: 'CONNECTED',
    signalStrengthPercent: 88,
    primaryTower: 'Shillong Telecom Hub S-1',
    backupRadioChannel: 'VHF Emergency Net 1',
    isHighRiskVulnerable: false,
  },
  {
    district: 'Tawang',
    status: 'NO CONNECTIVITY',
    signalStrengthPercent: 0,
    primaryTower: 'Pass Relay Tower 02 (Down / Power Cut)',
    backupRadioChannel: 'Satellite Iridium Channel Bravo',
    isHighRiskVulnerable: true,
  },
  {
    district: 'Gangtok',
    status: 'CONNECTED',
    signalStrengthPercent: 92,
    primaryTower: 'Gangtok Metro Cell Tower',
    backupRadioChannel: 'SDRF UHF Link 3',
    isHighRiskVulnerable: false,
  },
  {
    district: 'Kohima',
    status: 'WEAK',
    signalStrengthPercent: 35,
    primaryTower: 'Dzüdza Valley Node',
    backupRadioChannel: 'VHF Police Link 2',
    isHighRiskVulnerable: false,
  },
  {
    district: 'Aizawl',
    status: 'CONNECTED',
    signalStrengthPercent: 78,
    primaryTower: 'Aizawl Central Mast',
    backupRadioChannel: 'HF Net Mizoram 1',
    isHighRiskVulnerable: false,
  },
  {
    district: 'Dibrugarh',
    status: 'CONNECTED',
    signalStrengthPercent: 95,
    primaryTower: 'Brahmaputra Regional Gateway',
    backupRadioChannel: 'Civil Defense Link',
    isHighRiskVulnerable: false,
  },
  {
    district: 'Agartala',
    status: 'CONNECTED',
    signalStrengthPercent: 90,
    primaryTower: 'Agartala Main Station',
    backupRadioChannel: 'Emergency Net 4',
    isHighRiskVulnerable: false,
  },
]

// Professional Early Warning Preventive Actions with Human-in-the-Loop workflow
export const INITIAL_WARNING_ACTIONS: EarlyWarningAction[] = [
  {
    id: 'ACT-01',
    title: 'Inspect Vulnerable Road Cutting at KM-42',
    description: 'Dispatch PWD Highway inspection unit to verify tension cracks and install temporary drainage diversions along NH-102B.',
    urgency: 'IMMEDIATE',
    targetSector: 'KM-42 Mountain Cutting, Churachandpur',
    status: 'PENDING',
  },
  {
    id: 'ACT-02',
    title: 'Pre-Position SDRF Response Unit on Standby',
    description: 'Move Quick Response Team 2 with hydraulic rescue equipment and high-clearance 4x4 vehicles to Ridge Sub-base 2.',
    urgency: 'PRIORITY',
    targetSector: 'Sub-division 04 Tactical Staging Ground',
    status: 'PENDING',
  },
  {
    id: 'ACT-03',
    title: 'Prepare Alternate Evacuation Corridor Charlie',
    description: 'Alert district traffic police to clear secondary ridge route via Tuitha Valley avoiding unstable slopes.',
    urgency: 'PRIORITY',
    targetSector: 'Corridor Charlie Arterial Link',
    status: 'APPROVED',
    decidedAt: '35m ago',
    actionOfficer: 'District Magistrate / Incident Commander',
  },
  {
    id: 'ACT-04',
    title: 'Issue Targeted Early Warning to Riverfront Settlements',
    description: 'Transmit automated CAP localized SMS warning to 1,200 registered residents living beneath vulnerable slope toe.',
    urgency: 'WATCH',
    targetSector: 'Tuitha Lowland Riverfront Villages',
    status: 'PENDING',
  },
]

// Baseline Actions for Live Mode outside crisis
export const LIVE_BASELINE_WARNING_ACTIONS: EarlyWarningAction[] = [
  {
    id: 'ACT-SYS-01',
    title: 'Routine Synoptic Weather & Drainage Telemetry',
    description: 'Continuous ingestion of Open-Meteo precipitation feeds and municipal storm runoff monitors.',
    urgency: 'WATCH',
    targetSector: 'Regional Hydrological Baseline',
    status: 'APPROVED',
    decidedAt: 'Automated Continuous Link',
    actionOfficer: 'Sentinel NER Operational Pipeline',
  },
]

// Cohesive Demo Crisis Incident for Churachandpur
export const DEMO_INCIDENT: Incident = {
  id: 'SNR-2026-00482',
  location: 'KM-42 Mountain Cutting, NH-102B, Churachandpur',
  district: 'Churachandpur',
  coordinates: [24.33, 93.67],
  severity: 'CRITICAL',
  riskScore: 94,
  priorityScore: 94,
  confidence: 94,
  connectivity: 'BLACKOUT',
  lastSignal: '12 minutes ago',
  affectedArea: '14.2 km²',
  officerDecision: 'PENDING',
  responseStatus: 'AWAITING APPROVAL',
  timeline: [
    { id: 'detected', time: '08:15', label: 'Detected', detail: '240mm extreme deluge detected by Open-Meteo radar', tone: 'detected' },
    { id: 'risk', time: '08:42', label: 'Prioritized', detail: 'Pore pressure exceeded 38.4 kPa (Critical threshold)', tone: 'prioritized' },
    { id: 'satellite', time: '09:08', label: 'Verified', detail: 'Sentinel-1 InSAR: 3.8cm tension displacement on scarp', tone: 'verified' },
    { id: 'report', time: '09:23', label: 'Reported', detail: 'Ranger report: KM-42 dual lanes blocked by 450m³ debris slump', tone: 'reported' },
    { id: 'officer', time: '09:45', label: 'Reported', detail: 'District Magistrate / Incident Commander notified', tone: 'reported' },
    { id: 'plan', time: '09:52', label: 'Detected', detail: 'Evacuation corridor Charlie prepared for authorization', tone: 'detected' },
  ],
  resources: [
    { id: 'clearance', name: 'Heavy road clearance backhoe unit', recommended: 2, available: 3, assigned: 0, unit: 'units' },
    { id: 'sdrf', name: 'SDRF Quick Response Team 2', recommended: 2, available: 4, assigned: 0, unit: 'teams' },
    { id: 'medical', name: 'District Trauma & Medical Team', recommended: 1, available: 2, assigned: 0, unit: 'team' },
    { id: 'police', name: 'Highways Traffic Control Detachment', recommended: 3, available: 6, assigned: 0, unit: 'detachments' },
  ],
  routes: [
    { id: 'route-a', name: 'NH-102B Mountain Highway', status: 'BLOCKED', distance: '18.2 km', travelTime: 'Impassable', risk: 'Extreme', reason: 'Active debris slump at KM-42 blocks both carriageways.' },
    { id: 'route-b', name: 'Tuitha Lowland River Road', status: 'HIGH RISK', distance: '21.7 km', travelTime: '55 min', risk: 'High', reason: 'River level 0.4m below culvert deck; active inundation risk.' },
    { id: 'route-c', name: 'Corridor Charlie (Upper Ridge Bypass)', status: 'RECOMMENDED', distance: '24.6 km', travelTime: '45 min', risk: 'Low', reason: 'Ridge crest bedrock alignment; clear of unstable slopes.' },
  ],
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [dataMode, setDataMode] = useState<DataMode>('live')
  const [activeDistrict, setActiveDistrict] = useState<string>('Churachandpur')

  // Real GPS & Location State
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_FALLBACK_LOCATION)
  const [locationLoading, setLocationLoading] = useState<boolean>(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Live weather state from Open-Meteo
  const [weather, setWeather] = useState<LiveWeatherData>(() => getFallbackWeather('Churachandpur'))
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  // Demo state vs Live state
  const [demoAlerts, setDemoAlerts] = useState<Alert[]>(initialAlerts)
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([])

  const [demoIncident, setDemoIncident] = useState<Incident | null>(DEMO_INCIDENT)
  const [liveIncident, setLiveIncident] = useState<Incident | null>(null)

  const [demoReports, setDemoReports] = useState<FieldReport[]>(initialReports)
  const [liveReports, setLiveReports] = useState<FieldReport[]>([])

  const [demoWarningActions, setDemoWarningActions] = useState<EarlyWarningAction[]>(INITIAL_WARNING_ACTIONS)
  const [liveWarningActions, setLiveWarningActions] = useState<EarlyWarningAction[]>(LIVE_BASELINE_WARNING_ACTIONS)

  const isDemoMode = dataMode === 'demo'

  // Trigger GPS detection on mount
  const runLocationDetection = useCallback(async (force: boolean = false) => {
    setLocationLoading(true)
    setLocationError(null)
    try {
      const loc = force ? await forceRedetectLocation() : await detectBrowserLocation()
      setUserLocation(loc)
      if (loc.error) {
        setLocationError(loc.error)
      }
    } catch (err: any) {
      setLocationError(err.message || 'Location detection error')
    } finally {
      setLocationLoading(false)
    }
  }, [])

  useEffect(() => {
    runLocationDetection()
  }, [runLocationDetection])

  const redetectLocation = async () => {
    await runLocationDetection(true)
  }

  // Active coordinates & location name based on mode
  const activeLocationCoords = useMemo(() => {
    if (isDemoMode) {
      return { lat: 24.33, lon: 93.67 } // Churachandpur, Manipur
    }
    if (userLocation.isDetected) {
      return { lat: userLocation.lat, lon: userLocation.lon }
    }
    return { lat: 24.33, lon: 93.67 }
  }, [isDemoMode, userLocation])

  const activeLocationName = useMemo(() => {
    if (isDemoMode) {
      return 'Churachandpur, Manipur'
    }
    if (userLocation.isDetected) {
      return userLocation.displayName
    }
    return 'Churachandpur, Manipur (Default Center)'
  }, [isDemoMode, userLocation])

  // Fetch real Open-Meteo weather whenever mode, coords or active district change
  const loadWeather = useCallback(async () => {
    setWeatherLoading(true)
    setWeatherError(null)
    try {
      if (isDemoMode) {
        const data = await getCurrentWeather('Churachandpur')
        setWeather(data)
      } else if (userLocation.isDetected) {
        const data = await getWeatherForCoordinates(
          userLocation.lat,
          userLocation.lon,
          userLocation.city,
          userLocation.state
        )
        setWeather(data)
      } else {
        const data = await getCurrentWeather(activeDistrict)
        setWeather(data)
      }
    } catch (err: any) {
      setWeatherError(err.message || 'Failed to fetch weather')
    } finally {
      setWeatherLoading(false)
    }
  }, [isDemoMode, userLocation, activeDistrict])

  useEffect(() => {
    loadWeather()
  }, [loadWeather])

  const refreshWeather = async () => {
    await loadWeather()
  }

  const setMode = (mode: DataMode) => {
    setDataMode(mode)
  }

  const toggleMode = () => {
    setDataMode((prev) => (prev === 'live' ? 'demo' : 'live'))
  }

  const resetDemoState = () => {
    setDemoAlerts(initialAlerts)
    setDemoIncident(DEMO_INCIDENT)
    setDemoReports(initialReports)
    setDemoWarningActions(INITIAL_WARNING_ACTIONS)
    setDataMode('live')
  }

  // Is active location in NER?
  const isNER = useMemo(() => {
    if (isDemoMode) return true
    return userLocation.isNER ?? checkIsNER(userLocation.state, userLocation.district)
  }, [isDemoMode, userLocation])

  // Check if detected state/district is known mountainous landslide terrain
  const isMountainousRelief = useMemo(() => {
    if (isDemoMode) return true
    const state = (userLocation.state || '').toLowerCase()
    const district = (userLocation.district || '').toLowerCase()
    const city = (userLocation.city || '').toLowerCase()

    const hillStates = [
      'sikkim',
      'arunachal',
      'meghalaya',
      'manipur',
      'mizoram',
      'nagaland',
      'assam',
      'tripura',
      'uttarakhand',
      'himachal',
      'jammu',
      'kashmir',
      'ladakh',
      'kerala',
      'goa',
    ]

    return hillStates.some((s) => state.includes(s) || district.includes(s) || city.includes(s))
  }, [isDemoMode, userLocation])

  // Check if historical landslide events exist for the current monitored location
  const hasHistoricalEventsForLocation = useMemo(() => {
    if (isDemoMode) return true
    const locName = (userLocation.district || userLocation.city || '').toLowerCase()
    const locState = (userLocation.state || '').toLowerCase()

    return HISTORICAL_LANDSLIDES.some(
      (ev) =>
        ev.district.toLowerCase().includes(locName) ||
        locName.includes(ev.district.toLowerCase()) ||
        ev.state.toLowerCase().includes(locState)
    )
  }, [isDemoMode, userLocation])

  // Calculate honest risk level & alerts based on real physics & location
  const { liveRiskScore, liveRiskLevel, highRiskZonesCount, systemStatusLabel } =
    useMemo(() => {
      if (isDemoMode) {
        return {
          liveRiskScore: 94,
          liveRiskLevel: 'CRITICAL' as const,
          highRiskZonesCount: 2,
          systemStatusLabel: 'CRISIS ESCALATION · LEVEL 3 SEVERE DELUGE (KM-42 NH-102B)',
        }
      }

      // Live Mode: Honest evaluation
      if (!isMountainousRelief) {
        // Flat Alluvial Plains (e.g. Kanpur, UP, Delhi, Bihar, Lucknow)
        // Landslide physical risk is virtually absent (slope < 3°)
        const rainFactor = Math.min(6, (weather.forecast24hRain || 0) * 0.1)
        const plainRisk = Math.min(12, Math.max(4, Math.round(plainRiskCalc(rainFactor))))

        return {
          liveRiskScore: plainRisk,
          liveRiskLevel: 'LOW' as const,
          highRiskZonesCount: 0,
          systemStatusLabel: 'OPERATIONAL · ALL CLEAR (0 ACTIVE HAZARDS)',
        }
      }

      // Mountainous / NER region in Live Mode
      const rainVal = weather.forecast24hRain || 0
      let computedScore = Math.min(88, Math.max(14, Math.round(rainVal * 0.65 + 18)))
      let level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW'
      let highZones = 0

      if (computedScore >= 75) {
        level = 'CRITICAL'
        highZones = 2
      } else if (computedScore >= 50) {
        level = 'HIGH'
        highZones = 1
      } else if (computedScore >= 30) {
        level = 'MODERATE'
        highZones = 0
      }

      return {
        liveRiskScore: computedScore,
        liveRiskLevel: level,
        highRiskZonesCount: highZones,
        systemStatusLabel:
          liveAlerts.length > 0
            ? `ELEVATED PRECIPITATION MONITORING · ${liveAlerts.length} WATCH NOTICE`
            : 'OPERATIONAL · ALL CLEAR (0 ACTIVE HAZARDS)',
      }
    }, [isDemoMode, isMountainousRelief, weather.forecast24hRain, liveAlerts.length])

  const activeAlertsCount = isDemoMode ? demoAlerts.length : liveAlerts.length

  // Stateful getters and setters for Alerts, Incidents, Reports, and Actions
  const alerts = isDemoMode ? demoAlerts : liveAlerts
  const setAlerts: React.Dispatch<React.SetStateAction<Alert[]>> = useCallback(
    (updater) => {
      if (dataMode === 'demo') {
        setDemoAlerts(updater)
      } else {
        setLiveAlerts(updater)
      }
    },
    [dataMode]
  )

  const incident = isDemoMode ? demoIncident : liveIncident
  const setIncident: React.Dispatch<React.SetStateAction<Incident | null>> = useCallback(
    (updater) => {
      if (dataMode === 'demo') {
        setDemoIncident(updater)
      } else {
        setLiveIncident(updater)
      }
    },
    [dataMode]
  )

  const reports = isDemoMode ? demoReports : liveReports
  const setReports: React.Dispatch<React.SetStateAction<FieldReport[]>> = useCallback(
    (updater) => {
      if (dataMode === 'demo') {
        setDemoReports(updater)
      } else {
        setLiveReports(updater)
      }
    },
    [dataMode]
  )

  const warningActions = isDemoMode ? demoWarningActions : liveWarningActions

  // Human-in-the-loop actions
  const approveAction = (actionId: string, notes?: string) => {
    const updater = (prev: EarlyWarningAction[]) =>
      prev.map((action) =>
        action.id === actionId
          ? {
              ...action,
              status: 'APPROVED' as const,
              modifiedNotes: notes,
              decidedAt: 'Just now',
              actionOfficer: 'Disaster Operations Officer (Verified)',
            }
          : action
      )
    if (isDemoMode) {
      setDemoWarningActions(updater)
    } else {
      setLiveWarningActions(updater)
    }
  }

  const modifyAction = (actionId: string, modifiedNotes: string) => {
    const updater = (prev: EarlyWarningAction[]) =>
      prev.map((action) =>
        action.id === actionId
          ? {
              ...action,
              status: 'MODIFIED' as const,
              modifiedNotes,
              decidedAt: 'Just now',
              actionOfficer: 'Disaster Operations Officer (Modified Protocol)',
            }
          : action
      )
    if (isDemoMode) {
      setDemoWarningActions(updater)
    } else {
      setLiveWarningActions(updater)
    }
  }

  const rejectAction = (actionId: string, reason: string) => {
    const updater = (prev: EarlyWarningAction[]) =>
      prev.map((action) =>
        action.id === actionId
          ? {
              ...action,
              status: 'REJECTED' as const,
              rejectionReason: reason,
              decidedAt: 'Just now',
              actionOfficer: 'Disaster Operations Officer',
            }
          : action
      )
    if (isDemoMode) {
      setDemoWarningActions(updater)
    } else {
      setLiveWarningActions(updater)
    }
  }

  const activeRegion = regions.find((r) => r.name === activeDistrict) || regions[0]
  const historicalSummary = getDistrictHistoricalSummary(activeDistrict)

  return (
    <DataContext.Provider
      value={{
        dataMode,
        isDemoMode,
        setMode,
        toggleMode,
        resetDemoState,

        // Real Location
        userLocation,
        isNER,
        locationLoading,
        locationError,
        redetectLocation,
        activeLocationName,
        activeLocationCoords,
        isGpsDetected: userLocation.isDetected,

        activeDistrict,
        setActiveDistrict,
        activeRegion,

        weather,
        weatherLoading,
        weatherError,
        refreshWeather,

        liveRiskScore,
        liveRiskLevel,
        activeAlertsCount,
        highRiskZonesCount,
        systemStatusLabel,
        hasHistoricalEventsForLocation,

        historicalLandslides: HISTORICAL_LANDSLIDES,
        historicalSummary,
        scenario: demoDisasterScenario,
        demoScenario: CHURACHANDPUR_DEMO_SCENARIO,
        connectivityZones: INITIAL_CONNECTIVITY_ZONES,
        alerts,
        setAlerts,
        incident,
        setIncident,
        reports,
        setReports,
        warningActions,
        approveAction,
        modifyAction,
        rejectAction,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

function plainRiskCalc(rainFactor: number): number {
  return 4 + rainFactor
}

export function useDataContext() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider')
  }
  return context
}
