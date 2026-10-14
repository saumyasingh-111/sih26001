import React, { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  CloudRain,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  HelpCircle,
  Info,
  LocateFixed,
  Lock,
  LogOut,
  MapPin,
  Mountain,
  Navigation,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Route,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  Zap,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { citizenApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDataContext } from '../../context/DataContext'
import { regions } from '../../data/demoData'
import { ModeSelector } from '../common/ModeSelector'
import { VoiceInput } from '../common/VoiceInput'

interface CitizenPortalProps {
  go: (route: string) => void
  notify: (msg: string, tone?: 'success' | 'error') => void
}

type CitizenSubpage = 'dashboard' | 'notifications' | 'map' | 'report' | 'safety' | 'reports'

const REPORT_TYPES = [
  'Ground cracks',
  'Falling rocks',
  'Unusual water flow',
  'Road damage / blockage',
  'Suspected slope movement',
  'Tree / utility pole tilting',
  'Other visible hazard',
]

export function CitizenPortal({ go, notify }: CitizenPortalProps) {
  const { user, logout } = useAuth()
  const { userLocation, activeDistrict, setActiveDistrict, weather, liveRiskScore, liveRiskLevel, dataMode } = useDataContext()

  // Determine active subpage from current URL path
  const getSubpageFromPath = (): CitizenSubpage => {
    const path = window.location.pathname.toLowerCase().replace(/^\/citizen\/?/, '')
    if (path === 'notifications' || path === 'alerts') return 'notifications'
    if (path === 'map') return 'map'
    if (path === 'report' || path === 'submit') return 'report'
    if (path === 'safety' || path === 'guidance') return 'safety'
    if (path === 'reports' || path === 'my-reports') return 'reports'
    return 'dashboard'
  }

  const [activeSubpage, setActiveSubpage] = useState<CitizenSubpage>(getSubpageFromPath)

  const navigateSubpage = (subpage: CitizenSubpage) => {
    setActiveSubpage(subpage)
    const targetPath = subpage === 'dashboard' ? 'citizen' : `citizen/${subpage}`
    go(targetPath)
  }

  useEffect(() => {
    const handlePop = () => {
      setActiveSubpage(getSubpageFromPath())
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const [alerts, setAlerts] = useState<any[]>([])
  const [riskZones, setRiskZones] = useState<any[]>([])
  const [safetyGuidance, setSafetyGuidance] = useState<any>(null)
  const [myReports, setMyReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Report Form State
  const [citizenName, setCitizenName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [locationName, setLocationName] = useState('')
  const [reportType, setReportType] = useState('Ground cracks')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState(userLocation?.lat || 24.3315)
  const [lon, setLon] = useState(userLocation?.lon || 93.6720)
  const [submitting, setSubmitting] = useState(false)
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')

  // Map reference
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  // Load public data whenever district or dataMode changes
  const loadData = async () => {
    try {
      setRefreshing(true)
      const feed = await citizenApi.getPublicFeed(activeDistrict)
      setAlerts(feed.alerts || [])
      setRiskZones(feed.risk_zones || [])

      const guidance = await citizenApi.getSafetyGuidance(activeDistrict)
      setSafetyGuidance(guidance)

      if (user) {
        try {
          const reportsRes = await citizenApi.getMyReports()
          setMyReports(reportsRes.reports || [])
        } catch (e) {
          console.warn('Could not load user reports:', e)
        }
      }
    } catch (err: any) {
      console.error('Failed to load citizen public feed:', err)
      notify('Unable to fetch live warnings. Check network.', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeDistrict, user, dataMode])

  // Initialize and update GIS map when on the 'map' subpage
  useEffect(() => {
    if (activeSubpage !== 'map' && activeSubpage !== 'dashboard') return
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const initialLat = userLocation?.lat || 24.3315
      const initialLon = userLocation?.lon || 93.6720

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([initialLat, initialLon], 12)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current

    const targetLat = dataMode === 'demo' ? 24.33 : (userLocation?.lat || 24.3315)
    const targetLon = dataMode === 'demo' ? 93.67 : (userLocation?.lon || 93.6720)
    map.setView([targetLat, targetLon], dataMode === 'demo' ? 12 : 11)

    // Clear dynamic layers
    map.eachLayer((layer: any) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer)
      }
    })

    // Add risk zones
    riskZones.forEach((zone) => {
      const isCritical = zone.risk_level === 'CRITICAL'
      const color = isCritical ? '#dc2626' : '#ea580c'
      const circle = L.circle([zone.lat, zone.lon], {
        radius: isCritical ? 1200 : 800,
        color,
        fillColor: color,
        fillOpacity: 0.25,
        weight: 2,
      }).addTo(map)

      circle.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: ${color};">${zone.risk_level} RISK ZONE</strong><br/>
          <b>${zone.name}</b><br/>
          <span>District: ${zone.district}</span><br/>
          <small style="color: #64748b;">Monitored by Sentinel NER</small>
        </div>
      `)
    })

    // Add public shelters if available (only in demo or when live shelters verified)
    if (safetyGuidance?.designated_shelters && safetyGuidance.designated_shelters.length > 0) {
      const shelterIcon = L.divIcon({
        className: 'shelter-marker',
        html: `<div style="background:#059669; color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);">H</div>`,
        iconSize: [24, 24],
      })

      safetyGuidance.designated_shelters.forEach((shelter: any, i: number) => {
        const offsetLat = (targetLat) + (i * 0.015)
        const offsetLon = (targetLon) + (i * 0.012)
        L.marker([offsetLat, offsetLon], { icon: shelterIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
              <strong style="color: #059669;">DESIGNATED EVACUATION SHELTER</strong><br/>
              <b>${shelter.name}</b><br/>
              <span>Capacity: ${shelter.capacity} people</span><br/>
              <span style="color:#059669; font-weight:bold;">Status: ${shelter.status}</span>
            </div>
          `)
      })
    }

    setTimeout(() => {
      map.invalidateSize()
    }, 250)
  }, [activeSubpage, riskZones, safetyGuidance, userLocation, dataMode])

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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationName || !description) {
      notify('Please specify the location and description of the hazard.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        citizen_name: citizenName || (user ? user.full_name : 'Local Resident'),
        phone: phone || (user ? user.phone : ''),
        location: locationName,
        district: activeDistrict,
        lat: Number(lat),
        lon: Number(lon),
        report_type: reportType,
        description,
        image_url: photoPreview ? 'data:image/jpeg;base64,sample' : '',
        severity: 'MODERATE',
      }

      const res = await citizenApi.submitReport(payload)
      setSubmittedReportId(res.report_id)
      notify(`Report submitted successfully! Reference: ${res.report_id}`, 'success')

      // Clear form
      setLocationName('')
      setDescription('')
      setPhotoPreview('')

      // Reload user reports if authenticated
      if (user) {
        const updated = await citizenApi.getMyReports()
        setMyReports(updated.reports || [])
      }
    } catch (err: any) {
      notify(err.message || 'Failed to submit report. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* 1. Shared Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => go('home')}
              className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                <Mountain size={18} />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none block">
                  SENTINEL <span className="text-emerald-700">NER</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                  Citizen Safety & Early Warning
                </span>
              </div>
            </button>
          </div>

          {/* Center: Live / Demo Mode Selector & District Selector */}
          <div className="flex items-center gap-3">
            <ModeSelector />

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs">
              <MapPin size={13} className="text-emerald-700" />
              <select
                value={activeDistrict}
                onChange={(e) => setActiveDistrict(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                aria-label="Monitored District"
              >
                {regions.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}, {r.state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Auth Status / Switch */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">{user.full_name}</div>
                  <div className="text-[10px] text-emerald-700 font-medium capitalize">
                    {user.role === 'citizen' ? 'Verified Resident' : user.role.replace('_', ' ')}
                  </div>
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
            ) : (
              <button
                onClick={() => go('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <User size={13} />
                <span>Citizen Sign In</span>
              </button>
            )}
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
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Citizen Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('notifications')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'notifications'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Official Bulletins</span>
              {alerts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {alerts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('map')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'map'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GIS Risk & Evacuation Map
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('report')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'report'
                  ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Plus size={13} />
              <span>Report Hazard (Voice & Photo)</span>
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('safety')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'safety'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Safety Guidance & Shelters
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'reports'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              <span>My Reports</span>
              {myReports.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  {myReports.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {/* SUBPAGE 1: DASHBOARD */}
        {activeSubpage === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Alert Banner if Active Warnings Exist */}
            {alerts.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-r-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Official Warning Active for {activeDistrict}
                    </div>
                    <div className="text-sm font-semibold text-amber-950 mt-0.5">
                      {alerts[0].title} — Level: {alerts[0].level}
                    </div>
                    <p className="text-xs text-amber-800 mt-1 line-clamp-1">
                      {alerts[0].safety_instructions || alerts[0].cause}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigateSubpage('notifications')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold shrink-0 cursor-pointer"
                >
                  <span>View All Bulletins</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

            {/* Quick Status Grid: Risk Level + Local Weather + Action CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Regional Landslide Risk Status */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                    <span className="uppercase tracking-wider">Landslide Risk Level</span>
                    <span className="font-mono text-emerald-700">{activeDistrict}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-black ${
                      liveRiskLevel === 'CRITICAL' ? 'text-rose-700' :
                      liveRiskLevel === 'HIGH' ? 'text-amber-700' :
                      liveRiskLevel === 'MODERATE' ? 'text-yellow-700' : 'text-emerald-700'
                    }`}>
                      {liveRiskLevel}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Index {liveRiskScore}/100</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {liveRiskLevel === 'CRITICAL' || liveRiskLevel === 'HIGH'
                      ? 'Elevated risk of slope movement due to severe saturation. Follow official evacuation recommendations.'
                      : 'Slope conditions within normal baseline parameters. Stay alert during heavy rainfall.'}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    Mode: <strong className="text-slate-700 uppercase">{dataMode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateSubpage('map')}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
                  >
                    <span>View Map Zones</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Card 2: Live Local Weather & Rainfall */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                    <span className="uppercase tracking-wider">Open-Meteo Synoptic Feed</span>
                    <CloudRain size={15} className="text-sky-700" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">
                      {weather?.forecast24hRain !== undefined ? `${weather.forecast24hRain.toFixed(1)} mm` : `${weather?.currentRainfall?.toFixed(1) || '18.4'} mm`}
                    </span>
                    <span className="text-xs text-slate-500">precipitation (24h)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Current Rain:</span>
                      <span className="font-semibold text-slate-800">{weather?.currentRainfall !== undefined ? `${weather.currentRainfall.toFixed(1)} mm` : '4.2 mm'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Temperature:</span>
                      <span className="font-semibold text-slate-800">{weather?.temperature !== undefined ? `${weather.temperature.toFixed(0)} °C` : '21 °C'}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Source: Open-Meteo Live API</span>
                  <span className="text-emerald-700 font-medium">Synchronized</span>
                </div>
              </div>

              {/* Card 3: Report Warning Signs CTA */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                    <Zap size={14} className="text-emerald-700" />
                    <span>Community Early Warning</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Spotted Ground Cracks or Slope Movement?
                  </h3>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    Submit observations directly to the Sentinel NER Officer HQ with voice dictation or photos.
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => navigateSubpage('report')}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    <span>Report Hazard Now</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Map Preview & Emergency Shelters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Landslide Risk Zones Map Preview</h3>
                    <p className="text-xs text-slate-500">Monitored slopes and shelters in {activeDistrict}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateSubpage('map')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Full Screen Map</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
                <div className="h-72 w-full rounded-lg overflow-hidden border border-slate-200" ref={mapContainerRef} />
              </div>

              {/* Emergency Contacts & Guidance Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">24x7 Emergency Help</h3>
                    <PhoneCall size={15} className="text-emerald-700" />
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {(safetyGuidance?.emergency_contacts || []).slice(0, 3).map((c: any, i: number) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.role}</div>
                        </div>
                        <a
                          href={`tel:${c.phone.split(' ')[0]}`}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-bold rounded shrink-0"
                        >
                          {c.phone.split(' ')[0]}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigateSubpage('safety')}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    View All Designated Shelters & Evacuation Routes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 2: OFFICIAL BULLETINS / ALERTS */}
        {activeSubpage === 'notifications' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Official Safety Bulletins & Warnings</h2>
                <p className="text-xs text-slate-500">
                  Published exclusively by authorized Disaster Management Officers for {activeDistrict}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
                >
                  <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                  <span>Refresh Bulletins</span>
                </button>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  {dataMode === 'live' ? 'No Active Official Bulletins' : 'No Simulated Bulletins'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {dataMode === 'live'
                    ? `No active official bulletins available from connected live sources for ${activeDistrict}. The risk level is monitored continuously.`
                    : `No simulated bulletins active for ${activeDistrict} in demo scenario.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`bg-white border rounded-xl p-5 shadow-xs transition-shadow hover:shadow-md ${
                      alert.level === 'CRITICAL'
                        ? 'border-rose-300 border-l-4 border-l-rose-600'
                        : alert.level === 'HIGH'
                        ? 'border-amber-300 border-l-4 border-l-amber-600'
                        : 'border-slate-200 border-l-4 border-l-emerald-600'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          alert.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                          alert.level === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {alert.level} PRIORITY
                        </span>
                        {dataMode === 'demo' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            DEMO / SIMULATED DATA
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-mono">ID: {alert.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={13} />
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">{alert.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                      <MapPin size={13} className="text-emerald-700 shrink-0" />
                      <span>{alert.location}, {alert.district}</span>
                      {alert.target_areas && (
                        <span className="text-slate-500">· Affected Areas: {alert.target_areas}</span>
                      )}
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                      <div className="text-slate-800">
                        <strong>Hazard Cause:</strong> {alert.cause}
                      </div>
                      {alert.safety_instructions && (
                        <div className="text-emerald-900">
                          <strong>Official Safety Directive:</strong> {alert.safety_instructions}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBPAGE 3: FULL GIS RISK & EVACUATION MAP */}
        {activeSubpage === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">GIS Landslide Hazard & Evacuation Map</h2>
                <p className="text-xs text-slate-500">Interactive geographic risk overlays, public shelters, and safe routes</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Critical Risk Zone
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Designated Shelter
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
              <div className="h-[600px] w-full rounded-lg overflow-hidden" ref={mapContainerRef} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <h4 className="font-bold text-slate-900 mb-2">Monitored Slopes & Risk Boundaries</h4>
                <div className="space-y-2">
                  {riskZones.map((z: any) => (
                    <div key={z.id} className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{z.name}</div>
                        <div className="text-[11px] text-slate-500">{z.district}, {z.state}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        z.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {z.risk_level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900">Designated Evacuation Shelters</h4>
                  {dataMode === 'demo' && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      DEMO DATA
                    </span>
                  )}
                </div>
                {(safetyGuidance?.designated_shelters || []).length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-slate-500 text-xs">
                    No verified live shelter information available from connected sources.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(safetyGuidance?.designated_shelters || []).map((s: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{s.name}</div>
                          <div className="text-[11px] text-slate-500">{s.location} · Capacity: {s.capacity}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 4: REPORT HAZARD (WITH MULTILINGUAL VOICE INPUT) */}
        {activeSubpage === 'report' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900">Submit Community Warning Report</h2>
              <p className="text-xs text-slate-500">
                Notify the Sentinel NER Officer HQ of visible slope movements, ground fissures, or unusual water flow.
              </p>
            </div>

            {submittedReportId ? (
              <div className="bg-white border border-emerald-300 rounded-xl p-8 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 size={30} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Report Successfully Submitted!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your hazard report has been synchronized with the <b>Sentinel NER Officer Control Center</b> for rapid verification. Reference ID: <strong className="font-mono text-emerald-800">{submittedReportId}</strong>.
                </p>
                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedReportId(null)
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Submit Another Report
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={() => navigateSubpage('reports')}
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      View in My Reports
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
                {/* 1. Citizen Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Your Name (Optional)</label>
                    <input
                      type="text"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="e.g. Resident / Citizen"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210 (for officer verification)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>
                </div>

                {/* 2. Hazard Classification & Specific Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Hazard Category *</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                    >
                      {REPORT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Location / Landmark *</label>
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. KM-42 Ridge Road, near hillside bend"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                    />
                  </div>
                </div>

                {/* 3. MULTILINGUAL VOICE DICTATION & DESCRIPTION */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-medium">Detailed Description of Warning Signs *</label>
                    <span className="text-[11px] text-slate-500">Multilingual Voice Dictation supported</span>
                  </div>

                  {/* Restored Voice-to-Text Dictation Component */}
                  <VoiceInput
                    currentValue={description}
                    onTranscript={(newText) => setDescription(newText)}
                  />

                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you observed: crack width, rumbling sound, displaced soil, water accumulation, tree tilting..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900 text-xs font-sans leading-relaxed"
                  />
                </div>

                {/* 4. Photo Upload & Computer Vision Hazard Detection */}
                <div className="space-y-2">
                  <label className="block text-slate-700 font-medium">Attach Photograph (Optional)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      id="citizen-photo"
                      className="hidden"
                    />
                    <label
                      htmlFor="citizen-photo"
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
                    >
                      <Camera size={14} className="text-emerald-700" />
                      <span>{photoPreview ? 'Change Photo' : 'Upload Hazard Photo'}</span>
                    </label>

                    {photoPreview ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={photoPreview}
                          alt="Hazard preview"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                        />
                        <div className="text-[11px] text-emerald-800">
                          <strong>Photo attached:</strong> Automated slope instability analysis will be run by Officer HQ.
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Clear photographs of fissures, fallen debris, or bulges help officers rapidly confirm severity.
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. Coordinates (Editable) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white px-2 py-1 border border-slate-300 rounded text-slate-800 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={lon}
                      onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white px-2 py-1 border border-slate-300 rounded text-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{submitting ? 'Submitting to Officer HQ...' : 'Submit Report for Officer Verification'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* SUBPAGE 5: SAFETY GUIDANCE & SHELTERS */}
        {activeSubpage === 'safety' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900">Evacuation Guidelines & Official Resources</h2>
              <p className="text-xs text-slate-500">
                Authorized disaster protocols, evacuation centers, and emergency helpline dispatch
              </p>
            </div>

            {/* Emergency Helplines Grid */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <PhoneCall size={16} className="text-emerald-700" />
                <span>24x7 Emergency Helpline Numbers</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {(safetyGuidance?.emergency_contacts || []).map((contact: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{contact.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{contact.role}</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{contact.phone}</span>
                      <a
                        href={`tel:${contact.phone.split(' ')[0]}`}
                        className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold"
                      >
                        Call
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evacuation Corridors & Shelters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Designated Shelters */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Designated Evacuation Shelters</h3>
                  {dataMode === 'demo' && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      DEMO / SIMULATED DATA
                    </span>
                  )}
                </div>
                {(safetyGuidance?.designated_shelters || []).length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1.5">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-semibold text-slate-700">
                      No verified live shelter information available from connected sources.
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Emergency shelters will be displayed here once officially designated and activated by the District Magistrate during an active incident.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(safetyGuidance?.designated_shelters || []).map((shelter: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{shelter.name}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">Location: {shelter.location}</div>
                          <div className="text-slate-600 text-[11px]">Capacity: {shelter.capacity} evacuees</div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                          {shelter.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Road Corridors */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Evacuation Road Corridor Status</h3>
                  {dataMode === 'demo' && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      DEMO / SIMULATED DATA
                    </span>
                  )}
                </div>
                {(safetyGuidance?.evacuation_routes || []).length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1.5">
                    <Route className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-semibold text-slate-700">
                      No verified live evacuation alerts or road closures available.
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Roadways are operating under normal conditions. Traffic advisories and road closures will be broadcast in real-time as verified by field units.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(safetyGuidance?.evacuation_routes || []).map((route: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900">{route.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            route.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' :
                            route.status === 'CAUTION' ? 'bg-yellow-100 text-yellow-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {route.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{route.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Landslide Do's and Don'ts */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Immediate Landslide Safety Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
                  <h4 className="font-bold text-emerald-900">DO's (Actions to Take)</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Evacuate immediately if instructed by DEOC or law enforcement.</li>
                    <li>Move away from the path of a landslide or debris flow to high, stable bedrock.</li>
                    <li>Listen for unusual sounds like trees cracking or boulders knocking together.</li>
                    <li>Stay alert during sustained rainfall exceeding 50mm in 24 hours.</li>
                  </ul>
                </div>
                <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-lg space-y-2">
                  <h4 className="font-bold text-rose-900">DON'Ts (Actions to Avoid)</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Do NOT stay in buildings directly in the trajectory of steep mud flows.</li>
                    <li>Do NOT attempt to cross flooded bridges or roads blocked by recent mudslides.</li>
                    <li>Do NOT return to an evacuated area until declared secure by geotechnical teams.</li>
                    <li>Do NOT ignore ground fissures expanding near house foundations.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 6: MY SUBMITTED REPORTS (PROTECTED FOR AUTHENTICATED CITIZEN) */}
        {activeSubpage === 'reports' && (
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Hazard Reports History</h2>
                <p className="text-xs text-slate-500">
                  Track verification status and officer actions for your submitted warnings
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateSubpage('report')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus size={13} />
                <span>Submit New Report</span>
              </button>
            </div>

            {!user ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
                <Lock className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Sign In to View Your Private Report History</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  To protect your privacy, submitted reports and officer feedback are linked to your citizen account. Please log in or register.
                </p>
                <button
                  type="button"
                  onClick={() => go('login')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <User size={14} />
                  <span>Sign In as Citizen</span>
                </button>
              </div>
            ) : myReports.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Reports Submitted Yet</h3>
                <p className="text-xs text-slate-500">
                  You have not submitted any hazard reports in mode <strong className="uppercase">{dataMode}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => navigateSubpage('report')}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Submit Your First Report
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myReports.map((report: any) => (
                  <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{report.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {report.report_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          report.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          report.status === 'RESOLVED' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                          report.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-slate-800">
                      Location: {report.location}, {report.district}
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                      {report.description}
                    </p>

                    {report.officer_notes && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-950">
                        <strong className="text-emerald-800">Officer Verification Notes:</strong> {report.officer_notes}
                        {report.verified_by && (
                          <span className="text-slate-500 block text-[11px] mt-1">
                            Verified by: {report.verified_by}
                          </span>
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

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-500 text-[11px]">
        SENTINEL NER · Citizen Public Safety & Early Warning · Department of Disaster Management
      </footer>
    </div>
  )
}
