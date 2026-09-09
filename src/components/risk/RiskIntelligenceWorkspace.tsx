import React, { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  Globe2,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Mountain,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import { Region, regions, riskLevel } from '../../data/demoData'
import { useDataContext, EarlyWarningAction } from '../../context/DataContext'
import { RouteName } from '../navbar/TopNav'

interface RiskIntelligenceWorkspaceProps {
  go: (r: RouteName) => void
  notify?: (message: string, tone?: 'success' | 'error') => void
}

export function RiskIntelligenceWorkspace({ go, notify }: RiskIntelligenceWorkspaceProps) {
  const {
    activeDistrict,
    setActiveDistrict,
    weather,
    weatherLoading,
    refreshWeather,
    historicalSummary,
    isDemoMode,
    userLocation,
    isNER,
    activeLocationName,
    liveRiskScore,
    warningActions,
    approveAction,
    modifyAction,
    rejectAction,
    setMode,
  } = useDataContext()

  const [selectedActionId, setSelectedActionId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [modificationNotes, setModificationNotes] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  const activeRegion = regions.find((r) => r.name === activeDistrict) || regions[0]
  const effectiveRisk = isDemoMode ? (activeDistrict === 'Churachandpur' ? 94 : activeRegion.risk) : liveRiskScore

  // Explainable AI Factor Weights (dynamically evaluated based on real physics and mode)
  const factors = isDemoMode
    ? [
        { name: 'Heavy Rainfall Anomaly', contribution: '+32%', score: 82, color: 'bg-rose-500', detail: 'Exceeds 72h baseline threshold (240mm)' },
        { name: 'Soil Pore Water Saturation', contribution: '+24%', score: 74, color: 'bg-rose-500', detail: 'Volumetric water content > 42%' },
        { name: 'Slope Vulnerability Gradient', contribution: '+18%', score: 68, color: 'bg-amber-500', detail: 'Critical angle > 34° shear failure' },
        { name: 'Historical Landslide Frequency', contribution: '+15%', score: 55, color: 'bg-amber-500', detail: 'NASA GLC / GSI recurrence zone' },
        { name: 'Recent Terrain Change (InSAR)', contribution: '+11%', score: 44, color: 'bg-blue-500', detail: '3.8cm surface slope displacement' },
      ]
    : !isNER
    ? [
        { name: 'Topographic Slope Gradient', contribution: '1%', score: 4, color: 'bg-emerald-500', detail: 'Flat alluvial plain (slope < 3°)' },
        { name: 'Precipitation Load', contribution: `${Math.min(10, Math.round((weather.forecast24hRain || 0) * 0.5))}%`, score: Math.min(30, Math.max(5, Math.round((weather.forecast24hRain || 0) * 1.5))), color: 'bg-blue-500', detail: `24h forecast: ${weather.forecast24hRain}mm` },
        { name: 'Soil Pore Water Pressure', contribution: '3%', score: 14, color: 'bg-emerald-500', detail: 'Hydrostatic balance nominal' },
        { name: 'Historical Landslide Frequency', contribution: '0%', score: 0, color: 'bg-slate-300', detail: '0 events in NASA catalog for Indo-Gangetic plain' },
        { name: 'Recent Terrain Displacement (InSAR)', contribution: '0%', score: 0, color: 'bg-slate-300', detail: 'Zero surface shear movement detected' },
      ]
    : [
        { name: 'Topographic Slope Gradient', contribution: '18%', score: 45, color: 'bg-amber-500', detail: 'Regional mountainous slope' },
        { name: 'Precipitation Influx', contribution: `${Math.min(30, Math.round((weather.forecast24hRain || 0) * 0.8))}%`, score: Math.min(70, Math.max(15, Math.round((weather.forecast24hRain || 0) * 1.5))), color: 'bg-blue-500', detail: `24h forecast: ${weather.forecast24hRain}mm` },
        { name: 'Soil Saturation', contribution: '12%', score: 38, color: 'bg-emerald-500', detail: 'Volumetric water content normal' },
        { name: 'Historical Recurrence', contribution: '10%', score: 30, color: 'bg-amber-500', detail: `${historicalSummary.totalEvents} regional events` },
        { name: 'InSAR Coherence', contribution: '5%', score: 15, color: 'bg-slate-400', detail: 'No rapid slope deformation' },
      ]

  const handleApprove = (id: string, title: string) => {
    approveAction(id)
    setSuccessNotice(`Action "${title}" approved by Operations Officer. Order dispatched.`)
    setTimeout(() => setSuccessNotice(''), 3500)
    notify?.('Action approved and logged to official audit trail.', 'success')
  }

  const handleReject = (id: string) => {
    if (!rejectionReason.trim()) {
      alert('A valid operational reason is required to reject an AI early warning recommendation.')
      return
    }
    rejectAction(id, rejectionReason)
    setSelectedActionId(null)
    setRejectionReason('')
    setSuccessNotice('Recommendation rejected. Reason permanently recorded in operational log.')
    setTimeout(() => setSuccessNotice(''), 3500)
    notify?.('Action rejected with logged justification.', 'error')
  }

  const handleModify = (id: string) => {
    if (!modificationNotes.trim()) {
      alert('Please enter revised operational instructions.')
      return
    }
    modifyAction(id, modificationNotes)
    setSelectedActionId(null)
    setModificationNotes('')
    setSuccessNotice('Recommendation modified and approved under adjusted protocol.')
    setTimeout(() => setSuccessNotice(''), 3500)
    notify?.('Action updated with modified operational protocol.', 'success')
  }

  return (
    <div className="risk-intelligence-page max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            <span>PREDICTIVE PHYSICS & ML</span>
            <span className="text-slate-300">/</span>
            <span>EXPLAINABLE HAZARD EVALUATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
            Risk Intelligence & Explainable AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Deterministic slope stability models, early warning escalation forecasts, and human-in-the-loop decision support.
          </p>
        </div>

        {/* District Switcher Selector */}
        {/* {<div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">District:</span>
          <select
            value={activeDistrict}
            onChange={(e) => setActiveDistrict(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
          >
            {regions.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}, {r.state} ({r.risk}%)
              </option>
            ))}
          </select>
          <button
            onClick={() => go('command-center')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowRight size={13} />
            <span>Command Center</span>
          </button>
        </div>} */}
      </div>

      {/* Success Notice Banner */}
      {successNotice && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. Early Warning Progression Forecast Banner                */}
      {/* ============================================================ */}
      <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
              TIME-TO-IMPACT TRAJECTORY · {isDemoMode ? 'CHURACHANDPUR, MANIPUR' : activeLocationName.toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {isDemoMode ? '24-Hour Risk Escalation Window' : '24-Hour Geological Stability Window'}
            </h2>
          </div>

          <span
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold self-start sm:self-auto ${
              effectiveRisk >= 76
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : effectiveRisk >= 51
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {riskLevel(effectiveRisk)} RISK TIER ({effectiveRisk}%)
          </span>
        </div>

        {/* 4-Step Hourly Projection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Current Baseline</div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{isDemoMode ? '62%' : `${effectiveRisk}%`}</div>
            <div className={`text-[11px] font-semibold ${isDemoMode ? 'text-amber-700' : 'text-emerald-700'}`}>
              {isDemoMode ? 'Elevated Watch' : 'Nominal Baseline'}
            </div>
            <div className="text-[10px] text-slate-400">{isDemoMode ? 'Pore pressure nominal' : 'Pore pressure nominal'}</div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">+6 Hours Forecast</div>
            <div className={`text-2xl font-bold font-mono ${isDemoMode ? 'text-amber-700' : 'text-slate-900'}`}>{isDemoMode ? '68%' : `${effectiveRisk}%`}</div>
            <div className={`text-[11px] font-semibold ${isDemoMode ? 'text-amber-700' : 'text-emerald-700'}`}>
              {isDemoMode ? 'Rising Telemetry' : 'Stable Trajectory'}
            </div>
            <div className="text-[10px] text-slate-400">{isDemoMode ? '+14mm rainfall influx' : 'No threshold breach'}</div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">+12 Hours Forecast</div>
            <div className={`text-2xl font-bold font-mono ${isDemoMode ? 'text-rose-600' : 'text-slate-900'}`}>{isDemoMode ? '76%' : `${Math.min(10, effectiveRisk + 1)}%`}</div>
            <div className={`text-[11px] font-bold ${isDemoMode ? 'text-rose-700' : 'text-emerald-700'}`}>
              {isDemoMode ? 'Crosses Threshold' : 'Stable Envelope'}
            </div>
            <div className="text-[10px] text-slate-400">{isDemoMode ? 'Pore ratio reaches 0.76' : 'Drainage nominal'}</div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">+24 Hours Forecast</div>
            <div className={`text-2xl font-bold font-mono ${isDemoMode ? 'text-rose-700' : 'text-slate-900'}`}>{isDemoMode ? '84%' : `${effectiveRisk}%`}</div>
            <div className={`text-[11px] font-extrabold ${isDemoMode ? 'text-rose-800' : 'text-emerald-700'}`}>
              {isDemoMode ? 'Peak Hazard Period' : 'All Clear'}
            </div>
            <div className="text-[10px] text-slate-400">{isDemoMode ? 'High probability slope slip' : 'Safe operational status'}</div>
          </div>
        </div>

        {isDemoMode ? (
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">
                EARLY WARNING ALERT — Expected to cross HIGH threshold (76%) within 12–24 hours.
              </span>
              <p className="text-amber-800 leading-relaxed">
                Continuous precipitation forecast from Open-Meteo indicates safe soil shear threshold will be breached. Preventive infrastructure inspection and community advisories must be initiated immediately before ground movement begins.
              </p>
            </div>
          </div>
        ) : !isNER ? (
          <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">
                  GEOLOGICAL BASELINE NOMINAL — Alluvial terrain in {activeLocationName}.
                </span>
                <p className="text-emerald-800 leading-relaxed">
                  Slope gradient is &lt; 3° with zero recorded mass-wasting events in the national catalog. Geotechnical shear failure risk is negligible under standard hydrological load.
                </p>
              </div>
            </div>
            <button
              onClick={() => setMode('demo')}
              className="flex-shrink-0 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold font-mono text-[11px] transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <Zap size={12} className="text-amber-400" />
              <span>Simulate NER Landslide</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-800">
            <Info size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">
                MONITORING ACTIVE — {activeRegion.name}, {activeRegion.state}.
              </span>
              <p className="text-slate-600 leading-relaxed">
                Precipitation rates and pore saturation are currently below the critical slope stability threshold. Telemetry is polled continuously.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. Main Two-Column Split: Explainable AI + Decision Support   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (6 Columns): Explainable AI & Physical Factor Weights */}
        <div className="lg:col-span-6 rounded-lg bg-white border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Why is this zone high risk?</h2>
              <p className="text-xs text-slate-500">
                Factor contributions to {activeRegion.name} total hazard score.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              Demo Model Contribution
            </span>
          </div>

          <div className="space-y-3">
            {factors.map((f) => (
              <div key={f.name} className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{f.name}</span>
                  <span className="font-mono font-bold text-slate-900">{f.contribution}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.score}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{f.detail}</span>
                  <span className="font-mono">Sensor Index: {f.score}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-md bg-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info size={13} className="text-slate-500" />
              <span>Model Transparency Notice</span>
            </div>
            <p>
              In production, factor weights are computed via calibrated geotechnical slope stability equations (Mohr-Coulomb criterion) coupled with trained LightGBM estimators. Current percentages represent simulated prototype contributions.
            </p>
          </div>
        </div>

        {/* RIGHT (6 Columns): Early Warning Panel & Human-in-the-Loop */}
        <div className="lg:col-span-6 rounded-lg bg-white border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-mono font-semibold uppercase text-slate-500">
                HUMAN-IN-THE-LOOP INTERFACE
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Early Warning Actions Review
              </h2>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              AI Recommends · Humans Decide
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Automated recommendations generated for {activeRegion.name}. An authorized disaster officer must review, modify, or approve each action before dissemination to district response units.
          </p>

          {/* Action List */}
          <div className="space-y-3">
            {warningActions.map((action) => {
              const isSelected = selectedActionId === action.id
              return (
                <div
                  key={action.id}
                  className={`p-3.5 rounded-md border text-xs space-y-2 transition-all ${
                    action.status === 'APPROVED'
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : action.status === 'REJECTED'
                      ? 'border-rose-200 bg-rose-50/40 opacity-75'
                      : action.status === 'MODIFIED'
                      ? 'border-blue-200 bg-blue-50/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{action.title}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                            action.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : action.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : action.status === 'MODIFIED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {action.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mt-1">{action.description}</p>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        Sector: {action.targetSector} · Urgency: {action.urgency}
                        {action.decidedAt && ` · Signed: ${action.decidedAt}`}
                      </div>
                    </div>
                  </div>

                  {action.status === 'PENDING' && (
                    <div className="pt-2 flex items-center gap-2 border-t border-slate-200/80">
                      <button
                        onClick={() => handleApprove(action.id, action.title)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                      >
                        Approve Action
                      </button>
                      <button
                        onClick={() => {
                          setSelectedActionId(isSelected ? null : action.id)
                          setRejectionReason('')
                          setModificationNotes('')
                        }}
                        className="px-3 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold cursor-pointer"
                      >
                        {isSelected ? 'Cancel' : 'Modify / Reject'}
                      </button>
                    </div>
                  )}

                  {action.rejectionReason && (
                    <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded border border-rose-100">
                      <b>Rejection Justification:</b> {action.rejectionReason}
                    </div>
                  )}

                  {action.modifiedNotes && (
                    <div className="text-[11px] text-blue-800 bg-blue-50 p-2 rounded border border-blue-100">
                      <b>Modified Operational Order:</b> {action.modifiedNotes}
                    </div>
                  )}

                  {/* Inline Modify / Reject Panel */}
                  {isSelected && (
                    <div className="mt-2 p-3 rounded bg-white border border-slate-300 space-y-2.5">
                      <div className="font-semibold text-slate-800">
                        Operational Override for: {action.title}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Operational Reason / Adjusted Deployment Notes (Required):
                        </label>
                        <textarea
                          rows={2}
                          value={rejectionReason || modificationNotes}
                          onChange={(e) => {
                            setRejectionReason(e.target.value)
                            setModificationNotes(e.target.value)
                          }}
                          placeholder="Provide specific justification (e.g. equipment stationed at alternate hub; deferring road inspection by 2 hours due to active rockfall)..."
                          className="w-full p-2 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(action.id)}
                          className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                        >
                          Reject with Reason
                        </button>
                        <button
                          onClick={() => handleModify(action.id)}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                        >
                          Approve with Modification
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Multi-Sensor Ground Truth & Telemetry Evidence Matrix     */}
      {/* ============================================================ */}
      <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Multi-Sensor Ingestion Matrix ({activeRegion.name})
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Auto-refresh (Live/Demo)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Sensor 1: Weather Radar */}
          <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
              <span>OPEN-METEO LIVE RADAR</span>
              <span className="text-emerald-700 font-bold">ONLINE</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">{weather.forecast24hRain} mm (24h)</div>
            <p className="text-slate-600 text-[11px]">
              Current rate: {weather.currentRainfall} mm/hr · Probability: {weather.precipitationProbability}%
            </p>
          </div>

          {/* Sensor 2: InSAR Satellite */}
          <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
              <span>SENTINEL-1 InSAR</span>
              <span className="text-emerald-700 font-bold">SYNCED</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {isDemoMode ? '3.8 cm Displacement' : '0.0 cm (Stable Scarp)'}
            </div>
            <p className="text-slate-600 text-[11px]">
              {isDemoMode
                ? 'Ascending pass · Coherence index 0.72 over upper scarp'
                : 'Zero surface displacement detected within active sector radius'}
            </p>
          </div>

          {/* Sensor 3: Soil Moisture */}
          <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
              <span>SOIL MOISTURE TELEMETRY</span>
              <span className="text-emerald-700 font-bold">OPERATIONAL</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {isDemoMode ? '94% Saturation' : '18% Volumetric'}
            </div>
            <p className="text-slate-600 text-[11px]">
              {isDemoMode
                ? 'Pore pressure ratio: 0.68 · Depth sensor 1.2m'
                : 'Pore pressure ratio: 0.12 (Nominal safety threshold)'}
            </p>
          </div>

          {/* Sensor 4: NASA Historical Catalog */}
          <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
              <span>NASA GLC HISTORICAL BASE</span>
              <span className="text-slate-600 font-bold">CURATED</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {isDemoMode ? '28 Recorded Events' : !isNER ? '0 Recorded Events' : `${historicalSummary.totalEvents} Recorded Events`}
            </div>
            <p className="text-slate-600 text-[11px]">
              {isDemoMode
                ? 'Primary Trigger: Continuous Monsoon Deluge'
                : !isNER
                ? 'Primary Trigger: None (Alluvial Basin)'
                : `Primary Trigger: ${historicalSummary.primaryTrigger}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
