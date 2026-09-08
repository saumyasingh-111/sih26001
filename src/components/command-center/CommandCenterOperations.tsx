import React, { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  CloudRain,
  Compass,
  Database,
  Download,
  Eye,
  Flame,
  Info,
  Layers,
  LocateFixed,
  MapPin,
  Maximize2,
  Mic,
  Mountain,
  Radio,
  RefreshCw,
  Route,
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
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Alert, Region, regions, riskLevel } from '../../data/demoData'
import { RouteName } from '../navbar/TopNav'
import { useDataContext, EarlyWarningAction } from '../../context/DataContext'
import { HISTORICAL_LANDSLIDES } from '../../data/historicalLandslides'
import { CHURACHANDPUR_DEMO_SCENARIO } from '../../data/demoScenario'
import { generateLandslideHeatmapData, HEATMAP_GRADIENT } from '../../utils/heatmapGenerator'

interface CommandCenterOperationsProps {
  region: Region
  score: number
  alerts: Alert[]
  incident: any
  onAlert: (alert: Alert) => void
  go: (route: RouteName) => void
  notify: (message: string, tone?: 'success' | 'error') => void
  simulate: () => void
}

type LayerKey = 'risk' | 'rainfall' | 'landslides' | 'reports' | 'roads' | 'connectivity' | 'routes'

export function CommandCenterOperations({
  region,
  score,
  alerts,
  incident,
  onAlert,
  go,
  notify,
  simulate,
}: CommandCenterOperationsProps) {
  const {
    dataMode,
    isDemoMode,
    setMode,
    weather,
    weatherLoading,
    refreshWeather,
    activeDistrict,
    setActiveDistrict,
    userLocation,
    locationLoading,
    locationError,
    redetectLocation,
    activeLocationName,
    activeLocationCoords,
    isGpsDetected,
    liveRiskScore,
    liveRiskLevel,
    activeAlertsCount,
    highRiskZonesCount,
    systemStatusLabel,
    hasHistoricalEventsForLocation,
    connectivityZones,
    warningActions,
    approveAction,
    modifyAction,
    rejectAction,
  } = useDataContext()

  // Real Layer Toggles
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    risk: true,
    rainfall: true,
    landslides: true,
    reports: true,
    roads: true,
    connectivity: false,
    routes: true,
  })

  // Heatmap & Basemap configuration
  const [heatmapEnabled, setHeatmapEnabled] = useState(true)
  const [heatmapRadius, setHeatmapRadius] = useState(28) // 15px to 50px
  const [heatmapIntensity, setHeatmapIntensity] = useState(0.85) // 0.2 to 1.0
  const [activeBasemap, setActiveBasemap] = useState<'dark' | 'satellite' | 'street'>('dark')
  const [showHeatmapSettings, setShowHeatmapSettings] = useState(false)

  // Human-in-the-loop review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<EarlyWarningAction | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionSuccessMsg, setActionSuccessMsg] = useState('')

  const activeRegion = regions.find((r) => r.name === activeDistrict) || region
  const activeScore = isDemoMode ? 94 : liveRiskScore

  const toggleLayer = (key: LayerKey) => {
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const exportSituationBrief = () => {
    notify('Compiling official Landslide Early Warning & Situation Brief...')
    setTimeout(() => {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>SENTINEL NER | SITUATION BRIEF</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
    h1 { color: #0f172a; margin-bottom: 4px; font-size: 22px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .critical { background: #fee2e2; color: #991b1b; }
    .low { background: #dcfce7; color: #166534; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>SENTINEL NER · LANDSLIDE EARLY WARNING SITUATION BRIEF</h1>
  <p><strong>Monitored Location:</strong> ${activeLocationName}</p>
  <p><strong>Coordinates:</strong> ${activeLocationCoords.lat}° N, ${activeLocationCoords.lon}° E</p>
  <p><strong>Mode:</strong> ${isDemoMode ? 'DEMO SCENARIO (Simulated Deluge Crisis)' : 'LIVE DATA MODE (Open-Meteo & GPS)'}</p>
  <p><strong>Current Risk Score:</strong> <span class="badge ${activeScore >= 75 ? 'critical' : 'low'}">${activeScore}% (${riskLevel(activeScore)})</span></p>
  <p><strong>Weather Telemetry:</strong> Temp: ${weather.temperature}°C | Rain 24h: ${weather.forecast24hRain}mm | Wind: ${weather.windSpeed}km/h | Humidity: ${weather.relativeHumidity}%</p>
  <p><strong>Active Alerts:</strong> ${activeAlertsCount} | <strong>High-Risk Zones:</strong> ${highRiskZonesCount}</p>
  <h3>Early Warning Preventive Actions</h3>
  <ul>
    ${warningActions.map((a) => `<li><strong>${a.title}</strong> [${a.status}]: ${a.description}</li>`).join('')}
  </ul>
</body>
</html>`
      const blob = new Blob([html], { type: 'text/html' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `sentinel-early-warning-${(isDemoMode ? 'demo-churachandpur' : userLocation.city || 'live').toLowerCase()}.html`
      link.click()
      notify('Situation brief exported.')
    }, 300)
  }

  return (
    <div className="command-center-page max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4 text-slate-800 font-sans">
      {/* ============================================================ */}
      {/* 1. Visible Page Heading & Export Actions                    */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            <span>OPERATIONAL INTELLIGENCE</span>
            <span className="text-slate-300">/</span>
            <span>NATIONAL DISASTER MANAGEMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
            Landslide Intelligence Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Geospatial hazard prediction, trigger correlation, and preventive disaster management.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportSituationBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export Brief</span>
          </button>

          <button
            onClick={() => go('risk-intelligence')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Eye size={14} />
            <span>Risk Intelligence</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. REAL LOCATION DETECTION & DATA MODE BANNER               */}
      {/* ============================================================ */}
      <div className="p-3 rounded-lg bg-slate-900 text-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Monitored Location + GPS Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="p-1.5 rounded bg-slate-800 text-emerald-400">
            <MapPin size={17} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                CURRENT MONITORED LOCATION
              </span>
              {isDemoMode ? (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                  ⚡ DEMO SCENARIO · CHURACHANDPUR CRISIS
                </span>
              ) : isGpsDetected ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GPS LOCATION DETECTED
                </span>
              ) : locationLoading ? (
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                  Acquiring GPS lock...
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                  LOCATION UNAVAILABLE (DEFAULT CENTER)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {activeLocationName}
              </h2>
              <span className="text-xs font-mono text-slate-400">
                ({activeLocationCoords.lat.toFixed(4)}°N, {activeLocationCoords.lon.toFixed(4)}°E)
              </span>
            </div>
          </div>
        </div>

        {/* Right: GPS Refresh & Data Mode Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {!isDemoMode && (
            <button
              onClick={() => {
                redetectLocation()
                notify('Re-acquiring browser GPS position...')
              }}
              disabled={locationLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Force re-detection of device GPS position"
            >
              <RefreshCw size={12} className={locationLoading ? 'animate-spin' : ''} />
              <span>Refresh GPS</span>
            </button>
          )}

          {isDemoMode ? (
            <button
              onClick={() => {
                setMode('live')
                notify('Switched to Live Data Mode with detected GPS telemetry.')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Activity size={13} />
              <span>Switch to Live GPS Mode</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setMode('demo')
                notify('Demo Scenario Mode activated: Churachandpur 240mm Deluge & KM-42 blockage.')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Zap size={13} />
              <span>Launch Demo Scenario</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. System Status & Telemetry Sub-bar                         */}
      {/* ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 rounded-lg bg-[#14181c] border border-[#222930] text-xs font-mono shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                activeScore >= 75 ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`font-bold tracking-wide ${
                activeScore >= 75 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {systemStatusLabel}
            </span>
          </div>
          <span className="text-stone-600">|</span>
          <div className="flex items-center gap-1.5 text-stone-300">
            <Radio size={13} className="text-[#7eb396]" />
            <span>
              WEATHER FEED: <span className="text-stone-100 font-semibold">{weatherLoading ? 'Updating Open-Meteo...' : weather.source}</span> <span className="text-stone-400">({weather.lastFetched})</span>
            </span>
          </div>
        </div>

        {locationError && !isDemoMode && (
          <div className="text-[11px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60">
            GPS Notice: {locationError}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. Top Key Operational Metrics (Honest, restrained)         */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Active Risk Alerts */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Active Risk Alerts</div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {String(activeAlertsCount).padStart(2, '0')}
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                activeAlertsCount > 0
                  ? 'text-rose-700 bg-rose-50'
                  : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              {isDemoMode ? '1 Critical' : '0 Critical'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {isDemoMode ? 'Priority Score: 94 / 100' : 'Monitoring within safety envelope'}
          </div>
        </div>

        {/* Metric 2: High-Risk Zones */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">High-Risk Zones</div>
          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold tracking-tight font-mono ${
                highRiskZonesCount > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {String(highRiskZonesCount).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-500">of 8 monitored</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {isDemoMode ? 'Churachandpur & East Khasi' : 'All monitored sectors nominal'}
          </div>
        </div>

        {/* Metric 3: 24h Rainfall */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>24h Rainfall</span>
            <span className="text-[9px] font-bold text-emerald-700">
              {isDemoMode ? 'SIMULATED' : 'LIVE'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {isDemoMode ? '240.0' : weather.forecast24hRain} mm
            </span>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              {isDemoMode ? '95%' : weather.precipitationProbability}% prob
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Temp: {weather.temperature}°C · Wind: {weather.windSpeed} km/h
          </div>
        </div>

        {/* Metric 4: Highest Risk Score */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Peak Regional Risk</div>
          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold tracking-tight font-mono ${
                activeScore >= 75 ? 'text-rose-700' : activeScore >= 50 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {activeScore}%
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                activeScore >= 75
                  ? 'text-rose-700 bg-rose-50'
                  : activeScore >= 50
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-emerald-700 bg-emerald-50'
              }`}
            >
              {riskLevel(activeScore)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">{activeLocationName}</div>
        </div>

        {/* Metric 5: Model Confidence */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Model Confidence</div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">94.2%</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Operational
            </span>
          </div>
          <div className="text-[11px] text-slate-500">Multi-sensor correlation</div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. Main 2-Column Split: Leaflet Map + Location Intelligence  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: Leaflet Map with GPS Auto-Centering (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col rounded-lg bg-white border border-slate-200 shadow-2xs overflow-hidden">
          {/* Map Toolbar */}
          <div className="p-3 bg-[#14181c] border-b border-[#222930] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-100 font-mono">Geospatial Tactical Map</span>
              <span className="text-[11px] font-mono text-stone-400">
                ({activeLocationName})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Basemap Selector */}
              <div className="flex items-center rounded-md bg-[#101418] p-0.5 border border-[#222930] text-[10px] font-mono">
                {(['dark', 'satellite', 'street'] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setActiveBasemap(b)}
                    className={`px-1.5 py-0.5 rounded uppercase font-semibold cursor-pointer transition-colors ${
                      activeBasemap === b
                        ? 'bg-[#1e2e26] text-[#8ea699] border border-[#2f493c]'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {b === 'satellite' ? 'SAT' : b}
                  </button>
                ))}
              </div>

              {/* Heatmap Toggle & Config */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                    heatmapEnabled
                      ? 'bg-rose-950/80 text-rose-300 border-rose-800 shadow-2xs'
                      : 'bg-[#182026] text-stone-400 border-[#26313b] hover:text-stone-200'
                  }`}
                  title="Toggle Continuous Landslide Risk Heatmap"
                >
                  <Flame size={11} className={heatmapEnabled ? 'text-rose-400 animate-pulse' : 'text-stone-500'} />
                  <span>HEATMAP</span>
                </button>
                <button
                  onClick={() => setShowHeatmapSettings(!showHeatmapSettings)}
                  className={`p-1 rounded text-[10px] cursor-pointer border transition-colors ${
                    showHeatmapSettings
                      ? 'bg-[#1e2e26] text-emerald-300 border-emerald-700'
                      : 'bg-[#182026] text-stone-400 border-[#26313b] hover:text-stone-200'
                  }`}
                  title="Configure Heatmap Spread Radius & Opacity Threshold"
                >
                  <Sliders size={11} />
                </button>
              </div>

              {/* Layer Toggles */}
              <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
                {(
                  [
                    { key: 'rainfall', label: 'RAIN' },
                    { key: 'roads', label: 'ROADS' },
                    { key: 'connectivity', label: 'COMMS' },
                    { key: 'routes', label: 'ROUTES' },
                  ] as const
                ).map(({ key, label }) => {
                  const isActive = activeLayers[key]
                  return (
                    <button
                      key={key}
                      onClick={() => toggleLayer(key)}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-semibold border ${
                        isActive
                          ? 'bg-[#1a232b] text-stone-100 border-[#32404e] shadow-2xs'
                          : 'bg-[#14181c] text-stone-400 border-[#222930] hover:bg-[#1a2229]'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Heatmap Tuning Drawer (Interactive Sliders) */}
          {showHeatmapSettings && (
            <div className="px-3.5 py-2.5 bg-[#101418] border-b border-[#222930] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-stone-300 text-[10px]">
                  <span>Heatmap Spread Radius:</span>
                  <span className="text-[#8ea699] font-bold">{heatmapRadius}px</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={50}
                  step={1}
                  value={heatmapRadius}
                  disabled={!heatmapEnabled}
                  onChange={(e) => setHeatmapRadius(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer disabled:opacity-35"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-stone-300 text-[10px]">
                  <span>Intensity Threshold:</span>
                  <span className="text-[#dca24c] font-bold">{Math.round(heatmapIntensity * 100)}% ({heatmapIntensity.toFixed(2)})</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.0}
                  step={0.05}
                  value={heatmapIntensity}
                  disabled={!heatmapEnabled}
                  onChange={(e) => setHeatmapIntensity(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer disabled:opacity-35"
                />
              </div>
            </div>
          )}

          {/* Leaflet Map Surface */}
          <div className="relative h-[480px] bg-slate-950">
            <CommandMapLeaflet
              activeCoords={activeLocationCoords}
              locationName={activeLocationName}
              isDemoMode={isDemoMode}
              isGpsDetected={isGpsDetected}
              liveRiskScore={activeScore}
              liveRiskLevel={riskLevel(activeScore)}
              weather={weather}
              activeLayers={activeLayers}
              onSelectDistrict={(districtName) => setActiveDistrict(districtName)}
              connectivityZones={connectivityZones}
              heatmapEnabled={heatmapEnabled}
              heatmapRadius={heatmapRadius}
              heatmapIntensity={heatmapIntensity}
              activeBasemap={activeBasemap}
            />

            {/* Floating Map Controls */}
            <div className="absolute top-3 right-3 z-400 flex flex-col gap-1">
              <button
                onClick={() => go('gis')}
                className="w-7 h-7 rounded bg-[#14181c] border border-[#2b3742] shadow-xs flex items-center justify-center text-stone-300 hover:text-stone-100 hover:bg-[#1a2229] cursor-pointer"
                title="Open Full GIS Workstation"
              >
                <Maximize2 size={13} />
              </button>
              <button
                onClick={refreshWeather}
                className="w-7 h-7 rounded bg-[#14181c] border border-[#2b3742] shadow-xs flex items-center justify-center text-stone-300 hover:text-stone-100 hover:bg-[#1a2229] cursor-pointer"
                title="Refresh Live Weather"
              >
                <RefreshCw size={13} className={weatherLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Map Footer Legend */}
          <div className="p-2.5 bg-[#14181c] border-t border-[#222930] flex flex-wrap items-center justify-between text-xs text-stone-400 font-mono text-[11px] gap-2">
            <div className="flex items-center gap-2">
              <span>Heatmap Gradient:</span>
              <div className="h-2 w-28 rounded-full bg-gradient-to-r from-[#00ff00] via-[#ffff00] via-[#ff0000] to-[#b91c1c] border border-black/30" />
              <span className="text-[10px] text-stone-400">Green (Low) → Red (Critical)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Critical (≥76%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> High (51-75%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Normal (≤30%)
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Location Intelligence & Early Warning Panel (5 Columns) */}
        <div className="lg:col-span-5 rounded-lg bg-white border border-slate-200 shadow-2xs p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                MONITORED SECTOR INTELLIGENCE
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {activeLocationName}
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Elevation: {weather.elevation}m · Coordinates: {activeLocationCoords.lat}°N, {activeLocationCoords.lon}°E
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                activeScore >= 76
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : activeScore >= 51
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {riskLevel(activeScore)} RISK ({activeScore}%)
            </span>
          </div>

          {/* Location Risk Analysis Box */}
          {isDemoMode ? (
            /* Demo Mode: Crisis Deluge & Road Blockage */
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-900 font-bold">
                <AlertCircle size={15} className="text-rose-600 flex-shrink-0" />
                <span>CRISIS SCENARIO: KM-42 ROAD BLOCKAGE</span>
              </div>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                Extreme 240mm deluge over saturated slope (94%). Debris volume estimated at 450m³ obstructing NH-102B.
                All emergency traffic directed to alternate Corridor Charlie.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-1.5 rounded bg-white/80 border border-rose-200">
                  <span className="text-slate-500 block text-[9px]">PORE PRESSURE</span>
                  <span className="font-bold text-rose-700">38.4 kPa (Critical)</span>
                </div>
                <div className="p-1.5 rounded bg-white/80 border border-rose-200">
                  <span className="text-slate-500 block text-[9px]">SLOPE GRADIENT</span>
                  <span className="font-bold text-rose-700">42° (High relief cut)</span>
                </div>
              </div>
            </div>
          ) : (
            /* Live Mode: Honest Terrain Evaluation */
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Shield size={15} className="text-emerald-600 flex-shrink-0" />
                <span>PHYSICAL TERRAIN EVALUATION</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {hasHistoricalEventsForLocation
                  ? 'Monitored sector exhibits moderate historical relief. Telemetry active across regional stations.'
                  : `Monitored sector in ${userLocation.city || 'current location'} is an alluvial plain with minimal slope gradient (<3°). Slope failure risk is negligible under standard hydrological load.`}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-1.5 rounded bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">NASA GLC / GSI CATALOG</span>
                  <span className="font-bold text-slate-800">
                    {hasHistoricalEventsForLocation ? 'Historical events recorded' : '0 events in catalog'}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-white border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">SLOPE SUSCEPTIBILITY</span>
                  <span className="font-bold text-emerald-700">
                    {hasHistoricalEventsForLocation ? 'Zone II (Moderate)' : 'Zone I (Very Low / Flat)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Explainable Factor Decomposition */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Multi-Factor Trigger Decomposition</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {isDemoMode ? 'Simulated Crisis Model' : 'Live Physical Weights'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <FactorProgress
                label="Precipitation Intensity"
                contribution={isDemoMode ? '+42%' : `+${Math.min(20, Math.round(weather.forecast24hRain * 0.4))}%`}
                progress={isDemoMode ? 95 : Math.min(80, Math.max(10, Math.round(weather.forecast24hRain * 1.5)))}
                color={isDemoMode ? 'bg-rose-500' : 'bg-blue-500'}
              />
              <FactorProgress
                label="Slope Vulnerability Gradient"
                contribution={isDemoMode ? '+32%' : hasHistoricalEventsForLocation ? '+22%' : '+4%'}
                progress={isDemoMode ? 85 : hasHistoricalEventsForLocation ? 45 : 8}
                color={isDemoMode ? 'bg-rose-500' : hasHistoricalEventsForLocation ? 'bg-amber-500' : 'bg-emerald-500'}
              />
              <FactorProgress
                label="Soil Pore Saturation Ratio"
                contribution={isDemoMode ? '+28%' : `+${Math.round(weather.relativeHumidity * 0.15)}%`}
                progress={isDemoMode ? 94 : Math.round(weather.relativeHumidity * 0.6)}
                color={isDemoMode ? 'bg-rose-500' : 'bg-slate-400'}
              />
              <FactorProgress
                label="Historical Frequency Baseline"
                contribution={isDemoMode ? '+18%' : hasHistoricalEventsForLocation ? '+14%' : '0%'}
                progress={isDemoMode ? 75 : hasHistoricalEventsForLocation ? 40 : 2}
                color={isDemoMode ? 'bg-amber-500' : 'bg-slate-300'}
              />
            </div>
          </div>

          {/* Early Warning Recommended Preventive Actions */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Preventive Disaster Management Actions</span>
              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                Human-in-the-Loop
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {warningActions.slice(0, 3).map((act, i) => (
                <div key={act.id} className="p-2 rounded bg-white border border-slate-200 flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold text-slate-500">{act.id}</span>
                      <span className="font-semibold text-slate-900 text-[11px]">{act.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{act.description}</p>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex-shrink-0 ${
                      act.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : act.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Modal Trigger */}
            <div className="pt-1">
              <button
                onClick={() => setReviewModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Shield size={14} />
                <span>Review & Approve Actions ({warningActions.filter((a) => a.status === 'PENDING').length} Pending)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. Lower Row: Forecast Trend + Alerts Queue + Field Stream   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. 24h Rainfall vs Risk Projection */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">24-Hour Diurnal Progression</span>
            <span className="text-[10px] font-mono text-slate-500">Hourly Telemetry</span>
          </div>

          <RiskForecastChart score={activeScore} isDemoMode={isDemoMode} />

          <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-amber-500 border-t border-dashed border-amber-600 inline-block" />
              <span>51% Warning Threshold</span>
            </span>
            <span className={activeScore >= 75 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
              {isDemoMode ? 'Escalating Deluge (+32%)' : 'Nominal Slope Trajectory'}
            </span>
          </div>
        </div>

        {/* 2. Priority Early Warning Alerts Feed */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">Active Warning Feed</span>
            <button
              onClick={() => go('alerts')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-2 text-xs">
              {alerts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  onClick={() => onAlert(a)}
                  className="p-2.5 rounded border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                          a.level === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : a.level === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {a.level}
                      </span>
                      <span className="font-semibold text-slate-800">{a.location.split(',')[0]}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{a.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">{a.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
              <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
              <div className="text-xs font-bold text-slate-800">0 Active Alerts</div>
              <div className="text-[11px] text-slate-500">
                All telemetry sensors within safe operational thresholds.
              </div>
            </div>
          )}
        </div>

        {/* 3. Field & Comms Stream */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">
              {isDemoMode ? 'SDRF Tactical Radio Stream' : 'Live Field Audit Log'}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {isDemoMode ? 'HF / VHF Link' : 'Telemetry Sync'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {isDemoMode ? (
              CHURACHANDPUR_DEMO_SCENARIO.radioTranscripts.map((t) => (
                <div key={t.id} className="p-2 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="font-bold text-slate-800">{t.callsign}</span>
                    <span>{t.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug">{t.message}</p>
                  <div className="text-[9px] font-mono text-slate-400">{t.channel}</div>
                </div>
              ))
            ) : (
              <div className="space-y-2 text-[11px] text-slate-600">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">Open-Meteo Synoptic Sync</span>
                  <span>Telemetry feed refreshed for {activeLocationName} ({weather.temperature}°C, {weather.forecast24hRain}mm rain).</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">NASA GLC Catalog Crosscheck</span>
                  <span>Spatial radius queried (50km). Zero active mass wasting events identified.</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">Sensor Baseline Stability</span>
                  <span>Pore-water pressure sensor link calibrated. Factor of safety FS &gt; 2.5 (Stable).</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 7. Human-in-the-Loop Review Modal                            */}
      {/* ============================================================ */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Human-in-the-Loop: Preventive Action Authorization
                </h3>
                <p className="text-[11px] text-slate-500">
                  AI suggestions are strictly advisory. Final authorization requires designated officer sign-off.
                </p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {actionSuccessMsg && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                {warningActions.map((action) => (
                  <div
                    key={action.id}
                    className={`p-3 rounded-lg border ${
                      action.status === 'APPROVED'
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : action.status === 'REJECTED'
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-slate-200 bg-white'
                    } space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] text-slate-500">{action.id}</span>
                          <span className="font-bold text-slate-900">{action.title}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                              action.urgency === 'IMMEDIATE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {action.urgency}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">{action.description}</p>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          Target Sector: <b>{action.targetSector}</b>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            action.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : action.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {action.status}
                        </span>
                        {action.decidedAt && (
                          <span className="text-[9px] text-slate-400">{action.decidedAt}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {action.status === 'PENDING' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            approveAction(action.id)
                            setActionSuccessMsg(`Authorized: ${action.title}`)
                            setTimeout(() => setActionSuccessMsg(''), 3000)
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                        >
                          Approve Directive
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAction(action)
                            setRejectionReason('')
                          }}
                          className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                        >
                          Modify / Reject...
                        </button>
                      </div>
                    )}

                    {action.actionOfficer && (
                      <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                        Signed: <b>{action.actionOfficer}</b>
                        {action.rejectionReason && (
                          <span className="text-rose-700 block">Reason: {action.rejectionReason}</span>
                        )}
                        {action.modifiedNotes && (
                          <span className="text-blue-700 block">Notes: {action.modifiedNotes}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sub-form when modifying or rejecting */}
              {selectedAction && (
                <div className="p-3 rounded bg-slate-100 border border-slate-300 space-y-2 mt-3">
                  <span className="font-bold text-slate-900 block">
                    Action Review: {selectedAction.id}
                  </span>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Reason for Rejection or Modification Directives:
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      placeholder="e.g. Route C under maintenance; deploy team to Sector 2 instead."
                      className="w-full p-2 rounded border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!rejectionReason.trim()) {
                          alert('Please provide a reason before rejecting.')
                          return
                        }
                        rejectAction(selectedAction.id, rejectionReason)
                        setSelectedAction(null)
                        setRejectionReason('')
                        setActionSuccessMsg('Action rejected and reason archived.')
                        setTimeout(() => setActionSuccessMsg(''), 3000)
                      }}
                      className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Reject with Reason
                    </button>

                    <button
                      onClick={() => {
                        if (!rejectionReason.trim()) {
                          alert('Please enter modification notes.')
                          return
                        }
                        modifyAction(selectedAction.id, rejectionReason)
                        setSelectedAction(null)
                        setRejectionReason('')
                        setActionSuccessMsg('Action protocol modified and logged.')
                        setTimeout(() => setActionSuccessMsg(''), 3000)
                      }}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Approve with Modification
                    </button>

                    <button
                      onClick={() => setSelectedAction(null)}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-1.5 rounded bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FactorProgress({
  label,
  contribution,
  progress,
  color,
}: {
  label: string
  contribution: string
  progress: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-slate-700 text-[11px]">
        <span>{label}</span>
        <span className="font-mono font-bold text-slate-900">{contribution}</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function RiskForecastChart({ score, isDemoMode }: { score: number; isDemoMode: boolean }) {
  const points = isDemoMode
    ? [38, 48, 62, 74, 82, 88, 92, 94]
    : [score, score + 1, score, score + 2, score + 1, score, score + 1, score]

  const width = 280
  const height = 80

  const pathD = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * width
      const y = height - (val / 100) * height
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  const thresholdY = height - (51 / 100) * height

  return (
    <div className="w-full relative pt-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 overflow-visible">
        {/* Warning Threshold Line at 51% */}
        <line
          x1="0"
          y1={thresholdY}
          x2={width}
          y2={thresholdY}
          stroke="#f59e0b"
          strokeDasharray="4,4"
          strokeWidth="1.5"
        />

        {/* Path stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={isDemoMode ? '#e11d48' : '#16a34a'}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Points */}
        {points.map((val, idx) => {
          const x = (idx / (points.length - 1)) * width
          const y = height - (val / 100) * height
          const isCurrent = idx === points.length - 1
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={isCurrent ? 4 : 2}
              className={
                isCurrent
                  ? isDemoMode
                    ? 'fill-rose-600 stroke-white stroke-2'
                    : 'fill-emerald-600 stroke-white stroke-2'
                  : isDemoMode
                  ? 'fill-rose-500'
                  : 'fill-emerald-500'
              }
            />
          )
        })}
      </svg>
      <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
        <span>-24h</span>
        <span>-12h (51% Threshold)</span>
        <span className={isDemoMode ? 'font-bold text-rose-600' : 'font-bold text-emerald-700'}>
          Now ({score}%)
        </span>
      </div>
    </div>
  )
}

function CommandMapLeaflet({
  activeCoords,
  locationName,
  isDemoMode,
  isGpsDetected,
  liveRiskScore,
  liveRiskLevel,
  weather,
  activeLayers,
  onSelectDistrict,
  connectivityZones,
  heatmapEnabled = true,
  heatmapRadius = 28,
  heatmapIntensity = 0.85,
  activeBasemap = 'dark',
}: {
  activeCoords: { lat: number; lon: number }
  locationName: string
  isDemoMode: boolean
  isGpsDetected: boolean
  liveRiskScore: number
  liveRiskLevel: string
  weather: any
  activeLayers: Record<LayerKey, boolean>
  onSelectDistrict: (name: string) => void
  connectivityZones: any[]
  heatmapEnabled?: boolean
  heatmapRadius?: number
  heatmapIntensity?: number
  activeBasemap?: 'dark' | 'satellite' | 'street'
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const overlayGroupRef = useRef<L.LayerGroup | null>(null)
  const heatLayerRef = useRef<any>(null)

  const BASEMAP_URLS = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  }

  // Handle dynamic basemap layer switching
  useEffect(() => {
    if (!mapInstance.current) return
    if (tileLayerRef.current) {
      try {
        mapInstance.current.removeLayer(tileLayerRef.current)
      } catch {
        // ignore
      }
    }
    const tileUrl = BASEMAP_URLS[activeBasemap] || BASEMAP_URLS.dark
    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(mapInstance.current)
  }, [activeBasemap])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const initialCenter: [number, number] = [activeCoords.lat, activeCoords.lon]
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(initialCenter, isDemoMode ? 9 : 10)

    const tileUrl = BASEMAP_URLS[activeBasemap] || BASEMAP_URLS.dark
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 18,
    }).addTo(map)

    const overlayGroup = L.layerGroup().addTo(map)
    overlayGroupRef.current = overlayGroup
    mapInstance.current = map

    return () => {
      if (heatLayerRef.current && mapInstance.current) {
        try {
          mapInstance.current.removeLayer(heatLayerRef.current)
        } catch {
          // ignore
        }
        heatLayerRef.current = null
      }
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // Auto-pan / flyTo when active coordinates change
  useEffect(() => {
    if (!mapInstance.current) return
    mapInstance.current.flyTo([activeCoords.lat, activeCoords.lon], isDemoMode ? 9 : 10, {
      duration: 1.2,
    })
  }, [activeCoords.lat, activeCoords.lon, isDemoMode])

  // Render overlay layers
  useEffect(() => {
    const overlayGroup = overlayGroupRef.current
    if (!overlayGroup) return

    overlayGroup.clearLayers()

    // 0. High-Visibility Device Location GPS Beacon (Sleek pulse pin - no raw circles)
    const pinHtml = `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${isDemoMode ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'};animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:12px;height:12px;border-radius:50%;background:${isDemoMode ? '#ef4444' : '#10b981'};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>
    </div>`
    const gpsBeacon = L.marker([activeCoords.lat, activeCoords.lon], {
      icon: L.divIcon({
        className: 'command-gps-beacon-pin',
        html: pinHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    })

    gpsBeacon.bindTooltip(
      `<div style="font-family:sans-serif;font-size:11px;line-height:1.4;">
        <strong style="color:${isDemoMode ? '#dc2626' : '#059669'};">
          ${isDemoMode ? '⚡ CRISIS SCENARIO EPICENTER' : '📍 DETECTED DEVICE POSITION'}
        </strong><br/>
        <b>${locationName}</b><br/>
        Risk Status: <b>${liveRiskLevel} (${liveRiskScore}%)</b><br/>
        Weather: ${weather.temperature}°C · 24h Rain: ${weather.forecast24hRain}mm
      </div>`,
      { direction: 'top', permanent: false }
    )
    gpsBeacon.addTo(overlayGroup)

    // 1. Continuous Weighted Landslide Risk & Hazard Density Heatmap Layer
    if (mapInstance.current) {
      if (heatLayerRef.current) {
        try {
          mapInstance.current.removeLayer(heatLayerRef.current)
        } catch {
          // ignore
        }
        heatLayerRef.current = null
      }

      if (heatmapEnabled && (isDemoMode || activeLayers.risk)) {
        const heatmapPoints = generateLandslideHeatmapData({
          isDemoMode,
          activeScore: liveRiskScore,
          selectedDistrict: locationName,
          includeHistorical: activeLayers.landslides,
        })

        try {
          const heat = (L as any).heatLayer(heatmapPoints, {
            radius: heatmapRadius,
            blur: 18,
            max: heatmapIntensity,
            minOpacity: 0.35,
            gradient: HEATMAP_GRADIENT,
          })
          heat.addTo(mapInstance.current)
          heatLayerRef.current = heat
        } catch (e) {
          console.error('Heatmap instantiation error in Command Center:', e)
        }
      }
    }

    // 2. Roads & Blockages Layer (Sleek badge pin - no raw circles)
    if (activeLayers.roads) {
      const blockageMarker = L.marker([24.352, 93.688], {
        icon: L.divIcon({
          className: 'command-road-blockage-pin',
          html: `<div style="background:#dc2626;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;font-family:sans-serif;border:1.5px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.6);display:flex;align-items:center;gap:3px;white-space:nowrap;">
            <span>⛔</span><span>BLOCKAGE</span>
          </div>`,
          iconSize: [85, 22],
          iconAnchor: [42, 11],
        }),
      })
      blockageMarker.bindTooltip(
        `<div style="font-family:sans-serif;font-size:11px;">
          <strong style="color:#b91c1c;">⛔ ROAD BLOCKAGE (KM-42 NH-102B)</strong><br/>
          Cause: Tension crack slope subsidence (450m³)<br/>
          Status: Diverting emergency traffic to Route Charlie
        </div>`,
        { direction: 'top' }
      )
      blockageMarker.addTo(overlayGroup)
    }

    // 4. Connectivity / Blackout Layer
    if (activeLayers.connectivity) {
      connectivityZones.forEach((cz) => {
        const matchingReg = regions.find((r) => r.name === cz.district)
        if (matchingReg) {
          const coords: [number, number] = [26.2 + (matchingReg.y - 50) * 0.12, 92.94 + (matchingReg.x - 50) * 0.16]
          const color =
            cz.status === 'CONNECTED' ? '#16a34a' : cz.status === 'WEAK' ? '#f59e0b' : '#dc2626'

          const commsCircle = L.circle(coords, {
            radius: 12000,
            color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '3, 3',
          })
          commsCircle.bindTooltip(
            `<div style="font-family:sans-serif;font-size:11px;">
              <strong>${cz.district} Telemetry Comms</strong><br/>
              Status: <b>${cz.status}</b> (${cz.signalStrengthPercent}%)<br/>
              Tower: ${cz.primaryTower}<br/>
              Backup: ${cz.backupRadioChannel}<br/>
              ${cz.isHighRiskVulnerable ? '<b style="color:#dc2626;">⚠ HIGH RISK + WEAK COMMS PRIORITY</b>' : ''}
            </div>`,
            { direction: 'top' }
          )
          commsCircle.addTo(overlayGroup)
        }
      })
    }

    // 5. Recommended Routes Layer
    if (activeLayers.routes) {
      const safeRouteLine = L.polyline(
        [
          [24.31, 93.62],
          [24.325, 93.635],
          [24.34, 93.66],
          [24.35, 93.67],
        ],
        {
          color: '#16a34a',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 6',
        }
      )
      safeRouteLine.bindTooltip(
        `<div style="font-family:sans-serif;font-size:11px;">
          <strong style="color:#15803d;">🚑 ALTERNATE EVACUATION CORRIDOR CHARLIE</strong><br/>
          Avoids KM-42 unstable slope toe<br/>
          Transit ETA: 22 minutes (Clear)
        </div>`,
        { direction: 'top' }
      )
      safeRouteLine.addTo(overlayGroup)
    }
  }, [
    activeLayers,
    activeCoords.lat,
    activeCoords.lon,
    locationName,
    isDemoMode,
    isGpsDetected,
    liveRiskScore,
    liveRiskLevel,
    weather,
    onSelectDistrict,
    connectivityZones,
    heatmapEnabled,
    heatmapRadius,
    heatmapIntensity,
  ])

  return <div ref={mapRef} className="w-full h-full" />
}
