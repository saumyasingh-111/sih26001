import React, { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronDown,
  CloudRain,
  Download,
  Layers,
  LocateFixed,
  Maximize2,
  Mic,
  Mountain,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Alert, Incident, Region, regions, riskLevel } from '../../data/demoData'
import { RouteName } from '../navbar/TopNav'

interface CommandCenterOperationsProps {
  region: Region
  score: number
  alerts: Alert[]
  incident: Incident
  onAlert: (alert: Alert) => void
  go: (route: RouteName) => void
  notify: (message: string, tone?: 'success' | 'error') => void
  simulate: () => void
}

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
  const [statusOpen, setStatusOpen] = useState(false)
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    Risk: true,
    Rainfall: true,
    Incidents: true,
    Reports: false,
    Terrain: false,
  })

  const selectAlert = (alert: Alert) => {
    const match = regions.find((item) => alert.location.toLowerCase().startsWith(item.name.toLowerCase()))
    if (match) {
      document.dispatchEvent(new CustomEvent('select-region', { detail: match.name }))
    }
    onAlert(alert)
  }

  const exportBrief = () => {
    notify('Generating comprehensive situation brief...')
    setTimeout(() => {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>SENTINEL NER | SITUATION BRIEF</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
    h1 { color: #065f46; margin-bottom: 4px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    .critical { background: #fee2e2; color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>SENTINEL NER · LANDSLIDE SITUATION BRIEF</h1>
  <p><strong>Date / Time:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>District:</strong> ${region.name}, ${region.state} <span class="badge critical">${score}% ${riskLevel(score)} RISK</span></p>
  <p><strong>Environmental Telemetry:</strong> Rainfall ${region.rain} | Soil Saturation ${region.soil}% | Slope Vulnerability ${region.slope}%</p>
  <h3>Active Alert Queue (${alerts.length})</h3>
  <table>
    <tr><th>Alert ID</th><th>Severity</th><th>Location</th><th>Trigger</th><th>Status</th></tr>
    ${alerts
      .map(
        (a) =>
          `<tr><td>${a.id}</td><td>${a.level}</td><td>${a.location}</td><td>${a.cause}</td><td>${a.status}</td></tr>`
      )
      .join('')}
  </table>
  <p style="margin-top:30px; font-size: 12px; color: #64748b;">Generated automatically by Sentinel NER Disaster Decision Support System.</p>
</body>
</html>`
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      link.download = `sentinel-brief-${region.name.toLowerCase()}.html`
      link.click()
      notify('Situation brief exported successfully.')
    }, 400)
  }

  const dispatchTeam = () => {
    notify(`Emergency response team dispatched to ${region.name}.`, 'success')
  }

  const issueAlert = () => {
    notify(`Priority disaster warning issued for ${region.name} (${score}% risk).`, 'error')
  }

  // Sorted alerts by severity
  const sortedAlerts = [...alerts].sort((a, b) => {
    const weights: Record<string, number> = { CRITICAL: 3, HIGH: 2, MODERATE: 1, LOW: 0 }
    return (weights[b.level] || 0) - (weights[a.level] || 0)
  })

  return (
    <div className="command-center-page max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Operations Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-emerald-700 uppercase">
            <span>LIVE OPERATIONS</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">NORTH EASTERN REGION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            Landslide Intelligence{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time geospatial prediction, hazard triaging, and dispatch coordination.
          </p>
        </div>

        {/* Header Actions & Status Popover */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SYSTEM OPERATIONAL</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {statusOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 z-50 p-3 rounded-xl bg-white border border-slate-200 shadow-xl space-y-2 text-xs">
                <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  Live Sensor Connectors
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Rainfall Doppler Radar</span>
                  <span className="text-emerald-600 font-mono">ONLINE</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Soil Moisture Telemetry</span>
                  <span className="text-emerald-600 font-mono">ONLINE</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>SAR Satellite Interferometry</span>
                  <span className="text-emerald-600 font-mono">SYNCED</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Field Voice Ingestion</span>
                  <span className="text-emerald-600 font-mono">STANDBY</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={exportBrief}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export Brief</span>
          </button>

          <button
            onClick={simulate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-950/20 transition-all cursor-pointer"
          >
            <Zap size={14} />
            <span>Simulate Emergency</span>
          </button>
        </div>
      </header>

      {/* Top Situation Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Active Alerts</div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {String(alerts.filter((a) => a.status !== 'RESOLVED').length).padStart(2, '0')}
          </div>
          <div className="text-[10px] text-rose-600 font-medium">1 Critical Requires Review</div>
        </div>

        <div className="space-y-1 border-l border-slate-200 pl-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase">High-Risk Zones</div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600">
            {String(regions.filter((r) => r.risk >= 51).length).padStart(2, '0')}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Out of 8 Monitored</div>
        </div>

        <div className="space-y-1 border-l border-slate-200 pl-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Field Reports Today</div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">28</div>
          <div className="text-[10px] text-emerald-600 font-medium">+6 In Past 2 Hours</div>
        </div>

        <div className="space-y-1 border-l border-slate-200 pl-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Model Status</div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 font-mono">
            LIVE
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Auto-refreshing (10s)</div>
        </div>
      </div>

      {/* Main 12-Column Responsive Dashboard Grid (7 Cols Map / 5 Cols Quick-View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Map Container (7 Columns) */}
        <section className="lg:col-span-7 flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden min-h-[460px]">
          {/* Map Top Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <span className="text-[10px] font-mono font-semibold tracking-wider text-emerald-700 uppercase">
                SPATIAL OVERVIEW
              </span>
              <h2 className="text-base font-bold text-slate-900">North Eastern Hazard Field</h2>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['Risk', 'Rainfall', 'Incidents', 'Reports'].map((layer) => {
                const active = activeLayers[layer]
                return (
                  <button
                    key={layer}
                    onClick={() => setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {layer.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Map Surface */}
          <div className="relative flex-1 min-h-[360px] bg-slate-100">
            {/* Floating Status Badge */}
            <div className="absolute top-3 left-3 z-400 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-mono font-medium shadow-lg backdrop-blur-sm border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE - North Eastern Region</span>
              </div>
            </div>

            {/* Floating Map Tools */}
            <div className="absolute top-3 right-3 z-400 flex flex-col gap-1.5">
              <button
                onClick={() => go('gis')}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
                title="Full GIS Workstation"
              >
                <Maximize2 size={15} />
              </button>
              <button
                onClick={() => notify(`Focusing on ${region.name}...`)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
                title="Locate selected region"
              >
                <LocateFixed size={15} />
              </button>
            </div>

            {/* Interactive Leaflet Map Component */}
            <LeafletMapWidget
              region={region}
              score={score}
              activeLayers={activeLayers}
              onSelectRegion={(name) => {
                document.dispatchEvent(new CustomEvent('select-region', { detail: name }))
              }}
            />
          </div>

          {/* Map Footer Legend */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span>Click any risk node to inspect regional indicators.</span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> High
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low
              </span>
            </div>
          </div>
        </section>

        {/* Selected Region & Incident Quick-View (5 Columns) */}
        <section className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-white border border-slate-200 shadow-xs p-5 space-y-5">
          {/* Header & Risk Level */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-semibold tracking-wider text-emerald-700 uppercase">
                SELECTED REGION INTELLIGENCE
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                {region.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {region.state} · Prototype Risk Model
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                score >= 76
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : score >= 51
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {riskLevel(score)} RISK
            </span>
          </div>

          {/* Risk Dial Display (Circular Visual) */}
          <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            {/* Circular Risk Dial SVG */}
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={score >= 76 ? 'text-rose-500' : score >= 51 ? 'text-amber-500' : 'text-emerald-500'}
                  strokeDasharray={`${score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                  {score}%
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase">RISK INDEX</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-800">
                {score >= 76
                  ? 'Imminent Danger Level'
                  : score >= 51
                  ? 'Elevated Hazard Watch'
                  : 'Monitoring Normal'}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Precipitation rates and pore water saturation exceed safe thresholds. Immediate
                precautionary measures recommended.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold pt-1">
                Confidence: 87% (Multi-sensor agreement)
              </div>
            </div>
          </div>

          {/* Key Contributing Factors */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Contributing Hazard Factors
            </div>

            <div className="space-y-2">
              <FactorRow label="Rainfall Anomaly" value={`${region.risk}%`} progress={region.risk} color="bg-rose-500" />
              <FactorRow label="Soil Saturation" value={`${region.soil}%`} progress={region.soil} color="bg-rose-500" />
              <FactorRow label="Slope Vulnerability" value={`${region.slope}%`} progress={region.slope} color="bg-amber-500" />
              <FactorRow label="Historical Landslides" value={`${region.historical}%`} progress={region.historical} color="bg-amber-500" />
              <FactorRow label="Satellite Displacements" value={`${region.satellite}%`} progress={region.satellite} color="bg-blue-500" />
            </div>
          </div>

          {/* Immediate Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={dispatchTeam}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <Send size={15} />
              <span>Dispatch Team</span>
            </button>

            <button
              onClick={issueAlert}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-950/20 transition-all cursor-pointer"
            >
              <AlertTriangle size={15} />
              <span>Issue Alert</span>
            </button>
          </div>
        </section>
      </div>

      {/* Bottom Dashboard Cards Row (3-Column Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Live Priority Alerts Queue */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-semibold tracking-wider text-emerald-700 uppercase">
                  ACTIVE QUEUE
                </span>
                <h3 className="text-base font-bold text-slate-900">Priority Alerts</h3>
              </div>
              <button
                onClick={() => go('alerts')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
              >
                <span>View All ({alerts.length})</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {sortedAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => selectAlert(alert)}
                  className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          alert.level === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700'
                            : alert.level === 'HIGH'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {alert.level}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {alert.location.split(',')[0]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{alert.title}</div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono font-bold text-slate-900">{alert.risk}%</div>
                    <div className="text-[10px] text-slate-400">{alert.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Ordered by real-time severity</span>
            <span className="text-emerald-600 font-medium">Automatic triage</span>
          </div>
        </section>

        {/* 2. 24-Hour Risk Trend Sparkline */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-semibold tracking-wider text-emerald-700 uppercase">
                  TRAJECTORY
                </span>
                <h3 className="text-base font-bold text-slate-900">24-Hour Risk Trend</h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-mono text-xs font-bold border border-rose-200">
                {score}% CURRENT
              </span>
            </div>

            {/* Sparkline Graphic */}
            <div className="py-4">
              <RiskTrendSparkline currentScore={score} />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 border-t border-dashed border-amber-500 inline-block" />
              <span>Warning Threshold 51%</span>
            </span>
            <span className="text-emerald-600 font-semibold">Rising +14%</span>
          </div>
        </section>

        {/* 3. Recent Field Intelligence Stream */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-semibold tracking-wider text-emerald-700 uppercase">
                  VERIFIED EVIDENCE
                </span>
                <h3 className="text-base font-bold text-slate-900">Field Intelligence</h3>
              </div>
              <button
                onClick={() => go('field-reports')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
              >
                <span>Reports</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-3 mt-3 text-xs">
              <div className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 flex-shrink-0">
                  <Mic size={14} />
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Voice Intel · Ground Crack</span>
                    <span className="text-[10px] text-slate-400">12m ago</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Field team reports 15m lateral fissure across NH-102 hillside.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="p-1.5 rounded-md bg-blue-100 text-blue-700 flex-shrink-0">
                  <CloudRain size={14} />
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Precipitation Sensor</span>
                    <span className="text-[10px] text-slate-400">34m ago</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Station CP-04 exceeded 128mm / 24h monsoon rainfall threshold.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="p-1.5 rounded-md bg-purple-100 text-purple-700 flex-shrink-0">
                  <Sparkles size={14} />
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">SAR Satellite Anomaly</span>
                    <span className="text-[10px] text-slate-400">1h ago</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Sentinel-1 radar interferometry flagged 3.8cm surface slope deflection.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Multimodal sensory stream</span>
            <span className="text-emerald-600 font-semibold">100% Verified</span>
          </div>
        </section>
      </div>
    </div>
  )
}

function FactorRow({
  label,
  value,
  progress,
  color,
}: {
  label: string
  value: string
  progress: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-700">
        <span className="font-medium">{label}</span>
        <span className="font-mono font-bold text-slate-900">{value}</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function RiskTrendSparkline({ currentScore }: { currentScore: number }) {
  const points = [35, 38, 42, 46, 51, 58, 64, 71, 78, Math.max(50, currentScore)]
  const max = 100
  const min = 0
  const height = 90
  const width = 300

  // SVG coordinates calculation
  const pathD = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * width
      const y = height - ((val - min) / (max - min)) * height
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`
  const thresholdY = height - (51 / 100) * height

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </linearGradient>
        </defs>

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

        {/* Area fill */}
        <path d={areaD} fill="url(#trendGradient)" />

        {/* Line stroke */}
        <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />

        {/* Data points */}
        {points.map((val, idx) => {
          const x = (idx / (points.length - 1)) * width
          const y = height - ((val - min) / (max - min)) * height
          const isCurrent = idx === points.length - 1
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={isCurrent ? 4.5 : 2.5}
              className={isCurrent ? 'fill-rose-500 stroke-white stroke-2' : 'fill-rose-400'}
            />
          )
        })}
      </svg>
      <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
        <span>24h ago (35%)</span>
        <span>12h ago (51%)</span>
        <span>Now ({currentScore}%)</span>
      </div>
    </div>
  )
}

function LeafletMapWidget({
  region,
  score,
  activeLayers,
  onSelectRegion,
}: {
  region: Region
  score: number
  activeLayers: Record<string, boolean>
  onSelectRegion: (name: string) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletInstance = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapRef.current || leafletInstance.current) return

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([26.2, 92.94], 6)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map)

    const layerGroup = L.layerGroup().addTo(map)
    layerGroupRef.current = layerGroup
    leafletInstance.current = map

    return () => {
      map.remove()
      leafletInstance.current = null
    }
  }, [])

  // Update map circles based on selected region and layers
  useEffect(() => {
    const layerGroup = layerGroupRef.current
    if (!layerGroup) return

    layerGroup.clearLayers()

    if (activeLayers.Risk) {
      regions.forEach((item) => {
        const isSelected = item.name === region.name
        const currentRisk = isSelected ? score : item.risk
        const color =
          currentRisk >= 76 ? '#ef4444' : currentRisk >= 51 ? '#f59e0b' : currentRisk >= 31 ? '#eab308' : '#10b981'

        const circle = L.circle([26.2 + (item.y - 50) * 0.12, 92.94 + (item.x - 50) * 0.16], {
          radius: Math.max(8000, currentRisk * 450),
          color,
          fillColor: color,
          fillOpacity: isSelected ? 0.35 : 0.18,
          weight: isSelected ? 3 : 1.5,
        })

        circle.bindTooltip(
          `<div style="font-family:inherit;font-size:11px;padding:2px;">
            <strong>${item.name}</strong><br/>
            ${currentRisk}% ${riskLevel(currentRisk)} Risk
          </div>`,
          { direction: 'top' }
        )

        circle.on('click', () => {
          onSelectRegion(item.name)
        })

        circle.addTo(layerGroup)
      })
    }
  }, [region.name, score, activeLayers, onSelectRegion])

  return <div ref={mapRef} className="w-full h-full min-h-[360px]" />
}
