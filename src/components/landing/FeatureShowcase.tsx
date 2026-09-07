import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Crosshair,
  Layers3,
  Maximize2,
  Mic,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { RouteName } from '../navbar/TopNav'
import { useDataContext } from '../../context/DataContext'

interface FeatureShowcaseProps {
  go: (r: RouteName) => void
}

type FeatureTab = 'Command Center' | 'GIS Layers' | 'Demo Mode' | 'Analytics'

export function FeatureShowcase({ go }: FeatureShowcaseProps) {
  const [activeTab, setActiveTab] = useState<FeatureTab>('Command Center')
  const { setMode } = useDataContext()

  const tabs: { id: FeatureTab; icon: React.ComponentType<{ size?: number; className?: string }>; route: RouteName }[] = [
    { id: 'Command Center', icon: Crosshair, route: 'command-center' },
    { id: 'GIS Layers', icon: Layers3, route: 'gis' },
    { id: 'Demo Mode', icon: Zap, route: 'command-center' },
    { id: 'Analytics', icon: BarChart3, route: 'analytics' },
  ]

  const featureData: Record<
    FeatureTab,
    {
      title: string
      subtitle: string
      badge: string
      description: string
      stat1: { label: string; value: string }
      stat2: { label: string; value: string }
      stat3: { label: string; value: string }
      actionLabel: string
    }
  > = {
    'Command Center': {
      title: 'Unified Operational Command',
      subtitle: 'Real-time multi-hazard situational awareness for disaster officers.',
      badge: 'LIVE FEEDS · ACTIVE',
      description:
        'Coordinate emergency response with an integrated 12-column map grid, live priority alert stream, and immediate dispatch triggers.',
      stat1: { label: 'CRITICAL RISKS', value: '3 Active' },
      stat2: { label: 'PEAK DIAL', value: '86% Churachandpur' },
      stat3: { label: 'LATENCY', value: '<120s' },
      actionLabel: 'Launch Command Center',
    },
    'GIS Layers': {
      title: 'Deep Geospatial Workstation',
      subtitle: 'Interactive multi-tier GIS analysis on high-precision terrain maps.',
      badge: '11 SPATIAL LAYERS',
      description:
        'Overlay environmental datasets (Rainfall, Soil Saturation, Slope), infrastructure routes, and field team beacons with dynamic opacity control.',
      stat1: { label: 'LAYERS ACTIVE', value: '7 / 11' },
      stat2: { label: 'BASEMAPS', value: '4 Available' },
      stat3: { label: 'FORMATS', value: 'GeoJSON / KML' },
      actionLabel: 'Open GIS Workstation',
    },
    'Demo Mode': {
      title: 'Interactive Disaster Simulation Engine',
      subtitle: 'Experience live flash flood & debris flow emergencies with pre-scripted state changes.',
      badge: '⚡ 240MM RAINFALL DELUGE',
      description:
        'Test operational responses under crisis conditions: risk dial escalation to 94%, simulated road blockages at KM-42, surging flood inundation zones, and live voice transcripts.',
      stat1: { label: 'RAINFALL SPIKE', value: '240mm / 6h' },
      stat2: { label: 'ESCALATION DIAL', value: '94% Danger' },
      stat3: { label: 'VOICE INTEL', value: 'SDRF KM-42' },
      actionLabel: 'Simulate Demo Scenario',
    },
    Analytics: {
      title: 'Strategic BI & District Insights',
      subtitle: 'Identify systemic risks and optimize emergency preparedness over time.',
      badge: '8 DISTRICTS TRACKED',
      description:
        'Correlate historical precipitation against slope failures, monitor officer response times, and export compliance reports in CSV and PDF formats.',
      stat1: { label: 'VERIFIED RATE', value: '86%' },
      stat2: { label: 'AVG RESPONSE', value: '18m (-4m)' },
      stat3: { label: 'MONITORED', value: '12.4M People' },
      actionLabel: 'Explore Analytics BI',
    },
  }

  const current = featureData[activeTab]

  const handleLaunch = () => {
    if (activeTab === 'Demo Mode') {
      setMode('demo')
      go('command-center')
    } else if (activeTab === 'Command Center') {
      go('command-center')
    } else if (activeTab === 'GIS Layers') {
      go('gis')
    } else {
      go('analytics')
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      {/* Tab Selector Buttons */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-8">
        {tabs.map(({ id, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-950/40 font-bold'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-slate-950' : 'text-emerald-400'} />
              <span>{id}</span>
            </button>
          )
        })}
      </div>

      {/* Dark Browser Frame Mockup */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden shadow-emerald-950/20">
        {/* Browser Top Window Bar */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>

          <div className="px-4 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>https://sentinel-ner.gov.in/{activeTab.toLowerCase().replace(' ', '-')}</span>
          </div>

          <div className="text-[10px] font-mono text-slate-400">SIH-26001 PROTOCOL</div>
        </div>

        {/* Browser Content Area with Framer Motion Animated Transitions */}
        <div className="p-6 sm:p-8 bg-slate-950 min-h-[380px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Feature Information */}
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 text-xs font-mono font-semibold">
                  {current.badge}
                </span>

                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {current.title}
                </h3>

                <p className="text-xs sm:text-sm font-medium text-emerald-300">
                  {current.subtitle}
                </p>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {current.description}
                </p>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <div className="text-sm font-bold text-white font-mono">{current.stat1.value}</div>
                    <div className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">
                      {current.stat1.label}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      {current.stat2.value}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">
                      {current.stat2.label}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <div className="text-sm font-bold text-white font-mono">{current.stat3.value}</div>
                    <div className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">
                      {current.stat3.label}
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleLaunch}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-950/50 transition-all cursor-pointer group"
                  >
                    <span>{current.actionLabel}</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Mock UI Preview */}
              <div className="lg:col-span-6">
                <div className="relative rounded-xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl overflow-hidden min-h-[260px] flex flex-col justify-between">
                  {/* Subtle Grid Pattern Overlay */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* Header within Preview */}
                  <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <span className={`w-2 h-2 rounded-full ${activeTab === 'Demo Mode' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                      <span>{activeTab.toUpperCase()} / PREVIEW</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      {activeTab === 'Demo Mode' ? 'SIMULATION' : 'LIVE TELEMETRY'}
                    </span>
                  </div>

                  {/* Mock Visual Content based on active tab */}
                  <div className="relative z-10 py-6">
                    {activeTab === 'Command Center' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 border border-slate-700">
                          <div className="flex items-center gap-3">
                            <span className="p-2 rounded bg-rose-500/20 text-rose-400">
                              <ShieldAlert size={16} />
                            </span>
                            <div>
                              <div className="text-xs font-bold text-white">Churachandpur District</div>
                              <div className="text-[10px] text-slate-400">Ground fissure + 128mm rainfall</div>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-bold font-mono">
                            86% RISK
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 border border-slate-700">
                          <div className="flex items-center gap-3">
                            <span className="p-2 rounded bg-amber-500/20 text-amber-400">
                              <AlertTriangle size={16} />
                            </span>
                            <div>
                              <div className="text-xs font-bold text-white">East Khasi Hills</div>
                              <div className="text-[10px] text-slate-400">Soil moisture at 81% saturation</div>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold font-mono">
                            74% RISK
                          </span>
                        </div>
                      </div>
                    )}

                    {activeTab === 'GIS Layers' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-lg bg-slate-800 border border-emerald-500/40 text-xs">
                            <span className="text-emerald-400 font-mono">✓ Precipitation</span>
                            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[80%]" />
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-800 border border-emerald-500/40 text-xs">
                            <span className="text-emerald-400 font-mono">✓ Soil Moisture</span>
                            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[70%]" />
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700 text-xs flex items-center justify-between">
                          <span className="text-slate-300 font-mono">Evacuation Corridor NH-102</span>
                          <span className="text-emerald-400 text-[10px] font-mono">CLEAR</span>
                        </div>
                      </div>
                    )}

                    {activeTab === 'Demo Mode' && (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                              <Zap size={14} className="text-rose-400" />
                              240mm Deluge Trigger Injected
                            </span>
                            <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-mono font-bold text-[10px]">
                              94% CRITICAL
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-200">
                            Road blockage: KM-42 NH-102B compromised. Tuitha river flooding lowlands.
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mic size={14} className="text-rose-400" />
                            <span className="text-slate-200 font-mono text-[11px]">SDRF Voice: Bridge collapsed at KM-42</span>
                          </div>
                          <span className="text-emerald-400 font-mono text-[10px]">VERIFIED</span>
                        </div>
                      </div>
                    )}

                    {activeTab === 'Analytics' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                            <div className="text-[10px] text-slate-400 font-mono">ACCURACY</div>
                            <div className="text-lg font-bold text-white font-mono">98.2%</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                            <div className="text-[10px] text-slate-400 font-mono">DISPATCH SPEED</div>
                            <div className="text-lg font-bold text-emerald-400 font-mono">&lt; 120s</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                          <span>Correlation coefficient: r = 0.89</span>
                          <span className="text-emerald-400 font-bold">Optimal</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer status bar in preview */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                    <span>STATUS: ALL ENGINES READY</span>
                    <span className="text-emerald-400">READY TO LAUNCH</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
