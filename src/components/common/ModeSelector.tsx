import React from 'react'
import { useDataContext } from '../../context/DataContext'
import { Radio, Database, Activity, HelpCircle } from 'lucide-react'

export interface ModeSelectorProps {
  className?: string
  compact?: boolean
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ className = '', compact = false }) => {
  const { dataMode, setMode } = useDataContext()

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Segmented Control */}
      <div
        className="inline-flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200"
        role="group"
        aria-label="Platform Data Mode Selector"
      >
        <button
          type="button"
          onClick={() => setMode('live')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
            dataMode === 'live'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Live Mode: Connected to operational environmental sensors, Open-Meteo feeds, and active verified records"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dataMode === 'live' ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
          <span>Live</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('demo')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
            dataMode === 'demo'
              ? 'bg-white text-amber-800 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Demo Mode: Isolated simulation environment with Churachandpur crisis scenario dataset"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dataMode === 'demo' ? 'bg-amber-600' : 'bg-slate-400'}`} />
          <span>Demo</span>
        </button>
      </div>

      {!compact && (
        <span className="hidden sm:inline-flex text-[11px] font-medium text-slate-500">
          {dataMode === 'live' ? 'Operational Telemetry' : 'Simulated Data'}
        </span>
      )}
    </div>
  )
}
