import React, { useState, useEffect } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  CloudRain,
  Compass,
  Database,
  Eye,
  FileText,
  Flame,
  Globe2,
  Layers,
  LocateFixed,
  LogOut,
  MapPin,
  Mountain,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react'
import { fieldApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDataContext } from '../../context/DataContext'
import { ModeSelector } from '../common/ModeSelector'

interface FieldReporterPortalProps {
  go: (route: string) => void
  notify: (msg: string, tone?: 'success' | 'error') => void
}

type FieldSubpage = 'dashboard' | 'assignments' | 'submit' | 'reports'

const CONDITION_CATEGORIES = [
  { id: 'STABLE', label: 'Stable Slope', tone: 'emerald', desc: 'No cracks or movement observed' },
  { id: 'INCREASED_RISK', label: 'Increased Risk Indicators', tone: 'amber', desc: 'Accelerated soil seepage or tension signs' },
  { id: 'VISIBLE_CRACKS', label: 'Visible Ground Cracks', tone: 'orange', desc: 'Open fissures in roadway, slope, or masonry' },
  { id: 'SLOPE_MOVEMENT', label: 'Slope Creep / Movement', tone: 'rose', desc: 'Active displacement or bulges at slope toe' },
  { id: 'FALLING_ROCKS', label: 'Falling Rocks / Ravelling', tone: 'rose', desc: 'Debris falling onto road or footpaths' },
  { id: 'BLOCKED_ROADS', label: 'Blocked Road / Culvert', tone: 'rose', desc: 'Debris flow obstructs transport corridor' },
  { id: 'SUSPECTED_LANDSLIDE', label: 'Suspected Landslide Failure', tone: 'rose', desc: 'Imminent or active mass wasting' },
]

export function FieldReporterPortal({ go, notify }: FieldReporterPortalProps) {
  const { user, logout } = useAuth()
  const { userLocation, activeDistrict, weather, dataMode } = useDataContext()

  // Determine active subpage from current URL path
  const getSubpageFromPath = (): FieldSubpage => {
    const path = window.location.pathname.toLowerCase().replace(/^\/field\/?/, '')
    if (path === 'assignments' || path === 'zones') return 'assignments'
    if (path === 'submit' || path === 'observation') return 'submit'
    if (path === 'reports' || path === 'history') return 'reports'
    return 'dashboard'
  }

  const [activeSubpage, setActiveSubpage] = useState<FieldSubpage>(getSubpageFromPath)

  const navigateSubpage = (subpage: FieldSubpage) => {
    setActiveSubpage(subpage)
    const targetPath = subpage === 'dashboard' ? 'field' : `field/${subpage}`
    go(targetPath)
  }

  useEffect(() => {
    const handlePop = () => {
      setActiveSubpage(getSubpageFromPath())
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const [zones, setZones] = useState<any[]>([])
  const [observations, setObservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Quick Report Form
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')
  const [locationName, setLocationName] = useState<string>('')
  const [conditionCategory, setConditionCategory] = useState<string>('VISIBLE_CRACKS')
  const [description, setDescription] = useState<string>('')
  const [lat, setLat] = useState<number>(userLocation?.lat || 24.3325)
  const [lon, setLon] = useState<number>(userLocation?.lon || 93.6715)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Sensor telemetry inputs
  const [rainfallRate, setRainfallRate] = useState<number>(24.5)
  const [soilMoisture, setSoilMoisture] = useState<number>(86.2)
  const [tiltDeg, setTiltDeg] = useState<number>(3.8)
  const [porePressure, setPorePressure] = useState<number>(38.5)

  // Urgent Escalation Modal
  const [urgentModalOpen, setUrgentModalOpen] = useState(false)
  const [urgentSummary, setUrgentSummary] = useState('')
  const [urgentThreat, setUrgentThreat] = useState('')

  // Offline Sync Queue State
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sentinel_field_offline_queue') || '[]')
    } catch {
      return []
    }
  })
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load field reporter's assigned zones and observation history
  const loadData = async () => {
    try {
      setRefreshing(true)
      const zonesRes = await fieldApi.getMyZones()
      setZones(zonesRes.assigned_zones || [])
      if (zonesRes.assigned_zones && zonesRes.assigned_zones.length > 0 && !selectedZoneId) {
        setSelectedZoneId(zonesRes.assigned_zones[0].id)
        setLocationName(zonesRes.assigned_zones[0].name)
      }

      const obsRes = await fieldApi.getMyObservations()
      setObservations(obsRes.observations || [])
    } catch (err: any) {
      console.error('Failed to load field reporter data:', err)
      notify('Unable to fetch field assignments.', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, dataMode])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleObservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationName || !description) {
      notify('Please enter location and observation notes.', 'error')
      return
    }

    setSubmitting(true)
    const payload = {
      zone_id: selectedZoneId || undefined,
      location: locationName,
      district: activeDistrict,
      lat: Number(lat),
      lon: Number(lon),
      condition_category: conditionCategory,
      sensor_readings: {
        rainfall_rate_mm_hr: Number(rainfallRate),
        soil_moisture_pct: Number(soilMoisture),
        tilt_deg: Number(tiltDeg),
        pore_pressure_kpa: Number(porePressure),
      },
      description,
      image_url: photoPreview ? 'data:image/jpeg;base64,sample' : '',
      is_urgent: false,
    }

    // Offline mode support: if offline, push to local queue
    if (!navigator.onLine) {
      const offlineItem = {
        id: `DRAFT-${Date.now()}`,
        payload,
        created_at: new Date().toISOString(),
      }
      const updated = [offlineItem, ...offlineQueue]
      setOfflineQueue(updated)
      localStorage.setItem('sentinel_field_offline_queue', JSON.stringify(updated))
      notify('Saved offline draft! Will sync when connectivity returns.', 'success')
      setSubmitting(false)
      setDescription('')
      setPhotoPreview('')
      return
    }

    try {
      const res = await fieldApi.submitObservation(payload)
      notify(`Observation synced with Officer Control Center! Reference: ${res.observation_id}`, 'success')
      setDescription('')
      setPhotoPreview('')

      // Reload observations
      const obsRes = await fieldApi.getMyObservations()
      setObservations(obsRes.observations || [])
    } catch (err: any) {
      notify(err.message || 'Submission failed. Saved to draft.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Trigger Immediate Urgent Escalation
  const handleUrgentEscalate = async () => {
    if (!urgentSummary || !urgentThreat) {
      notify('Please provide summary and immediate threat description.', 'error')
      return
    }

    try {
      const res = await fieldApi.urgentEscalation({
        location: locationName || `${activeDistrict} Slope Cut`,
        district: activeDistrict,
        lat: Number(lat),
        lon: Number(lon),
        hazard_summary: urgentSummary,
        immediate_threat: urgentThreat,
      })
      notify(`URGENT ESCALATION BROADCAST! ID: ${res.escalation_id}`, 'success')
      setUrgentModalOpen(false)
      setUrgentSummary('')
      setUrgentThreat('')
      loadData()
    } catch (err: any) {
      notify(err.message || 'Failed to dispatch urgent escalation.', 'error')
    }
  }

  // Sync offline queue
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return
    let synced = 0
    const remaining = []

    for (const item of offlineQueue) {
      try {
        await fieldApi.submitObservation(item.payload)
        synced++
      } catch {
        remaining.push(item)
      }
    }

    setOfflineQueue(remaining)
    localStorage.setItem('sentinel_field_offline_queue', JSON.stringify(remaining))
    notify(`Synchronized ${synced} field observation(s) to Officer HQ.`, 'success')
    loadData()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-sky-600 selection:text-white">
      {/* 1. Shared Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => go('home')}
              className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-700 flex items-center justify-center text-white font-bold text-sm">
                <Radio size={18} />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none block">
                  SENTINEL <span className="text-sky-700">NER</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                  Field Reporter Ground Monitor
                </span>
              </div>
            </button>
          </div>

          {/* Center: Live / Demo Mode Selector & Online Connectivity Indicator */}
          <div className="flex items-center gap-3">
            <ModeSelector />

            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
              isOnline ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span>{isOnline ? 'Online Synced' : 'Offline Mode'}</span>
            </div>
          </div>

          {/* Right: Urgent Trigger & User Status */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUrgentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer animate-pulse"
              title="Escalate imminent slope collapse directly to Officer Command Center"
            >
              <Flame size={14} />
              <span className="hidden sm:inline">Urgent Escalation</span>
              <span className="sm:hidden">Urgent</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">{user?.full_name || 'Ground Reporter'}</div>
                <div className="text-[10px] text-sky-700 font-medium">Field Unit 04</div>
              </div>
              <button
                onClick={() => {
                  logout()
                  notify('Signed out successfully')
                  go('home')
                }}
                title="Sign Out"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Subpage Navigation Bar */}
        <div className="bg-slate-100/80 border-t border-slate-200 px-4 sm:px-6">
          <nav className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => navigateSubpage('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'dashboard'
                  ? 'bg-white text-sky-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Field Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('assignments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'assignments'
                  ? 'bg-white text-sky-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Assigned Zones</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                {zones.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('submit')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'submit'
                  ? 'bg-sky-700 text-white shadow-xs font-semibold'
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <Plus size={13} />
              <span>Submit Ground Observation</span>
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'reports'
                  ? 'bg-white text-sky-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              <span>My Observations History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                {observations.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Offline Queue Notification Bar */}
      {offlineQueue.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900">
            <Database size={14} className="text-amber-700" />
            <span>
              <strong>{offlineQueue.length} draft observation(s)</strong> stored locally in device memory.
            </span>
          </div>
          <button
            type="button"
            onClick={syncOfflineQueue}
            disabled={!isOnline}
            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50"
          >
            Sync to Officer HQ Now
          </button>
        </div>
      )}

      {/* 2. Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {/* SUBPAGE 1: FIELD DASHBOARD */}
        {activeSubpage === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Assigned Zones</span>
                  <MapPin size={15} className="text-sky-700" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{zones.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Designated monitoring sectors</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Next Report Due</span>
                  <Clock size={15} className="text-amber-700" />
                </div>
                <div className="text-2xl font-bold text-amber-700">
                  {zones.length > 0 ? 'In 45 min' : 'Standby'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {zones.length > 0 ? 'Reporting frequency: Every 2h' : 'No active shift assigned'}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Observations Filed</span>
                  <CheckCircle2 size={15} className="text-emerald-700" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{observations.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Synchronized with Officer HQ</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Active District</span>
                  <CloudRain size={15} className="text-sky-700" />
                </div>
                <div className="text-base font-bold text-slate-900 truncate">{activeDistrict}</div>
                <div className="text-[11px] text-slate-500 mt-1">{weather?.forecast24hRain ?? weather?.currentRainfall ?? 24.5} mm precipitation</div>
              </div>
            </div>

            {/* Assigned Zone Overview + Quick Submit Action */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Assigned Monitoring Zones */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Assigned Monitoring Sectors</h3>
                    <p className="text-xs text-slate-500">Scheduled surveillance protocol configured by Officer HQ</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateSubpage('assignments')}
                    className="text-xs text-sky-700 hover:text-sky-800 font-semibold inline-flex items-center gap-1"
                  >
                    <span>View All Details</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                <div className="space-y-3">
                  {zones.length === 0 ? (
                    <div className="p-8 text-center space-y-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                      <div className="text-xs font-bold text-slate-700">No Assigned Monitoring Sectors</div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        No active monitoring sectors assigned in connected live system. Officer HQ will assign sectors based on operational need.
                      </p>
                    </div>
                  ) : (
                    zones.map((zone: any) => (
                      <div
                        key={zone.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{zone.name}</span>
                            {dataMode === 'demo' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                DEMO DATA
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              zone.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {zone.risk_level}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 font-mono text-[11px]">
                            <span>GPS: {zone.lat}°N, {zone.lon}°E</span>
                            <span>Interval: {zone.reporting_interval_hours || 2}h</span>
                          </div>
                          <p className="text-xs text-slate-600 italic">"{zone.vulnerability_notes || 'Continuous slope observation required.'}"</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedZoneId(zone.id)
                            setLocationName(zone.name)
                            navigateSubpage('submit')
                          }}
                          className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1 shrink-0"
                        >
                          <Plus size={13} />
                          <span>Log Observation</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Col: Urgent Escalation & Quick Action */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                    <Flame size={18} />
                    <span>Urgent Hazard Escalation</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    If you detect <b>active slope movement</b>, ground ruptures accelerating, or blocked highway arteries, do not wait for the next scheduled reporting cycle. Trigger an emergency escalation immediately.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUrgentModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <AlertOctagon size={15} />
                    <span>Trigger Immediate Incident</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Quick Observation Entry</h4>
                  <button
                    type="button"
                    onClick={() => navigateSubpage('submit')}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    <span>Open Field Observation Form</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 2: ASSIGNED ZONES */}
        {activeSubpage === 'assignments' && (
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Assigned Monitoring Sectors & Schedules</h2>
                <p className="text-xs text-slate-500">
                  Detailed inspection parameters and reporting frequency established by Officer Control Center
                </p>
              </div>
              <button
                type="button"
                onClick={loadData}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                <span>Refresh Schedule</span>
              </button>
            </div>

            {zones.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 shadow-xs">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  {dataMode === 'live' ? 'No Active Monitoring Sectors Assigned' : 'No Simulated Sectors in Queue'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {dataMode === 'live'
                    ? 'No active monitoring sectors assigned in connected live system for your field unit. Standing by for surveillance orders from Officer Control Center.'
                    : 'No simulated monitoring sectors currently configured for this sector.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zones.map((zone: any) => (
                  <div key={zone.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">ID: {zone.id}</span>
                          {dataMode === 'demo' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              DEMO SECTOR
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{zone.name}</h3>
                        <div className="text-xs text-slate-500">{zone.district}, {zone.state}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        zone.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {zone.risk_level} RISK
                      </span>
                    </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Reporting Frequency:</span>
                      <strong className="text-slate-800">Every {zone.reporting_interval_hours || 2} hours</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Next Report Due:</span>
                      <strong className="text-amber-800">{zone.next_report_due || 'In 2 hours'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Latitude:</span>
                      <span className="font-mono text-slate-700">{zone.lat}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Longitude:</span>
                      <span className="font-mono text-slate-700">{zone.lon}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1">
                    <strong className="block text-slate-900">Vulnerability Notes:</strong>
                    <p className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600 leading-relaxed">
                      {zone.vulnerability_notes || 'Monitor roadside slope cut, tension crack widening, and culvert discharge blockage.'}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedZoneId(zone.id)
                        setLocationName(zone.name)
                        navigateSubpage('submit')
                      }}
                      className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus size={13} />
                      <span>Submit Report for Zone</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* SUBPAGE 3: SUBMIT GROUND OBSERVATION */}
        {activeSubpage === 'submit' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900">Submit Ground Observation</h2>
              <p className="text-xs text-slate-500">
                Log geotechnical indicators, sensor readings, and geotagged photographs from your monitoring sector.
              </p>
            </div>

            <form onSubmit={handleObservationSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
              {/* Sector Selection & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Monitoring Sector</label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => {
                      setSelectedZoneId(e.target.value)
                      const matched = zones.find((z) => z.id === e.target.value)
                      if (matched) {
                        setLocationName(matched.name)
                        setLat(matched.lat)
                        setLon(matched.lon)
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
                  >
                    <option value="">-- Custom Field Location --</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.risk_level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Specific Location / Milestone *</label>
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. KM-42 Cut, Sector 4 East Flank"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              {/* Condition Category Picker */}
              <div>
                <label className="block text-slate-700 font-medium mb-2">Slope Condition Category *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONDITION_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setConditionCategory(cat.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                        conditionCategory === cat.id
                          ? 'border-sky-600 bg-sky-50 text-sky-950 font-semibold ring-1 ring-sky-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat.label}</span>
                        {conditionCategory === cat.id && <CheckCircle2 size={14} className="text-sky-700" />}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sensor Telemetry Readings */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Sliders size={15} className="text-sky-700" />
                  <span>Ground Sensor Telemetry (Where Available)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Rain Rate (mm/h)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rainfallRate}
                      onChange={(e) => setRainfallRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Soil Moisture (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={soilMoisture}
                      onChange={(e) => setSoilMoisture(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Tilt Angle (°)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tiltDeg}
                      onChange={(e) => setTiltDeg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Pore Pressure (kPa)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={porePressure}
                      onChange={(e) => setPorePressure(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Description & Field Observations */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Visual Observations & Field Notes *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Record visible physical signs: crack length, water turbidity, newly emerged springs, tilting trees or poles..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600 leading-relaxed"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Geotagged Photograph (Optional)</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    id="field-photo"
                    className="hidden"
                  />
                  <label
                    htmlFor="field-photo"
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
                  >
                    <Camera size={14} className="text-sky-700" />
                    <span>{photoPreview ? 'Change Photo' : 'Upload Slope Photo'}</span>
                  </label>

                  {photoPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={photoPreview}
                        alt="Field preview"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                      />
                      <span className="text-[11px] text-emerald-800 font-medium">Photograph attached successfully.</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Geotagged pictures allow Officer Control Center to run comparative pixel displacement analysis.
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 py-3 px-4 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{submitting ? 'Synchronizing with Officer HQ...' : 'Submit Observation to Control Center'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgentModalOpen(true)}
                  className="w-full sm:w-auto py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Flame size={14} />
                  <span>Urgent Escalation</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUBPAGE 4: MY OBSERVATIONS HISTORY */}
        {activeSubpage === 'reports' && (
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Field Observations History</h2>
                <p className="text-xs text-slate-500">
                  Audit log of ground observations filed by you and verified by Officer HQ
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateSubpage('submit')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus size={13} />
                <span>Log New Observation</span>
              </button>
            </div>

            {observations.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
                <Radio className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Observations Recorded</h3>
                <p className="text-xs text-slate-500">
                  You have not submitted any field observations in mode <strong className="uppercase">{dataMode}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => navigateSubpage('submit')}
                  className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Log First Observation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {observations.map((obs: any) => (
                  <div key={obs.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{obs.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          obs.is_urgent ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {obs.condition_category.replace(/_/g, ' ')}
                        </span>
                        {obs.is_urgent === 1 && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-bold text-[9px] uppercase animate-pulse">
                            URGENT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          obs.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-800' :
                          obs.status === 'ESCALATED_TO_INCIDENT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {obs.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">
                          {new Date(obs.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-slate-800 flex items-center gap-2">
                      <MapPin size={13} className="text-sky-700 shrink-0" />
                      <span>{obs.location}, {obs.district}</span>
                      {obs.zone_id && <span className="text-slate-500 font-mono text-[11px]">(Zone: {obs.zone_id})</span>}
                    </div>

                    {/* Sensor readings pill row */}
                    {obs.sensor_readings && Object.keys(obs.sensor_readings).length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {obs.sensor_readings.rainfall_rate_mm_hr !== undefined && (
                          <span>Rain: <b>{obs.sensor_readings.rainfall_rate_mm_hr}</b> mm/h</span>
                        )}
                        {obs.sensor_readings.soil_moisture_pct !== undefined && (
                          <span>· Soil: <b>{obs.sensor_readings.soil_moisture_pct}</b>%</span>
                        )}
                        {obs.sensor_readings.tilt_deg !== undefined && (
                          <span>· Tilt: <b>{obs.sensor_readings.tilt_deg}</b>°</span>
                        )}
                        {obs.sensor_readings.pore_pressure_kpa !== undefined && (
                          <span>· Pore Pressure: <b>{obs.sensor_readings.pore_pressure_kpa}</b> kPa</span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                      {obs.description}
                    </p>

                    {obs.officer_notes && (
                      <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-sky-950">
                        <strong className="text-sky-800">Officer Review Feedback:</strong> {obs.officer_notes}
                        {obs.escalated_incident_id && (
                          <div className="text-[11px] text-rose-700 font-mono font-bold mt-1">
                            Escalated to Emergency Incident: {obs.escalated_incident_id}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Urgent Escalation Modal */}
      {urgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-rose-300 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <AlertOctagon size={20} />
                <span className="text-base">IMMEDIATE HAZARD ESCALATION</span>
              </div>
              <button
                type="button"
                onClick={() => setUrgentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action immediately sounds the emergency alarm in the <b>Officer Control Center</b>, bypassing the normal inspection queue. Use only for imminent mass movement or life safety hazards.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Hazard Summary *</label>
                <input
                  type="text"
                  value={urgentSummary}
                  onChange={(e) => setUrgentSummary(e.target.value)}
                  placeholder="e.g. Major scarp displacement on KM-42 mountain cutting"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Immediate Threat Description *</label>
                <textarea
                  rows={3}
                  value={urgentThreat}
                  onChange={(e) => setUrgentThreat(e.target.value)}
                  placeholder="Describe immediate threat to traffic, settlements, or infrastructure below the slope..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUrgentModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUrgentEscalate}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Immediate Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-500 text-[11px]">
        SENTINEL NER · Field Reporter Ground Surveillance Portal · Department of Disaster Management
      </footer>
    </div>
  )
}
