import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Crosshair,
  Layers3,
  Maximize2,
  ShieldAlert,
} from 'lucide-react'
import { RouteName } from '../navbar/TopNav'

interface FeatureShowcaseProps {
  go: (r: RouteName) => void
}

type FeatureTab = 'Command Center' | 'GIS Layers' | 'Risk Intelligence' | 'Analytics'

export function FeatureShowcase({ go }: FeatureShowcaseProps) {
  const [activeTab, setActiveTab] = useState<FeatureTab>('Command Center')

  const tabs: { id: FeatureTab; icon: React.ComponentType<{ size?: number; className?: string }>; route: RouteName }[] = [
    { id: 'Command Center', icon: Crosshair, route: 'command-center' },
    { id: 'GIS Layers', icon: Layers3, route: 'gis' },
    { id: 'Risk Intelligence', icon: BrainCircuit, route: 'risk-intelligence' },
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
      mockType: string
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
      mockType: 'command',
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
      mockType: 'gis',
    },
    'Risk Intelligence': {
      title: 'Explainable AI Hazard Engine',
      subtitle: 'Understand the multi-factor physical causes behind every prediction.',
      badge: '87% CONFIDENCE',
      description:
        'Deterministic neural evaluation combines rainfall anomalies, SAR satellite changes, and ground-truth evidence with auditable factor scoring.',
      stat1: { label: 'CORRELATION', value: '0.82 Pearson' },
      stat2: { label: 'SENSORS', value: '8 Data Feeds' },
      stat3: { label: 'MODEL DRIFT', value: '< 1.4%' },
      mockType: 'risk',
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
      mockType: 'analytics',
    },
  }

  const current = featureData[activeTab]

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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 scale-102'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/50'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{id}</span>
            </button>
          )
        })}
      </div>

      {/* Dark Desktop Viewport Browser Mockup Frame */}
      <div className="rounded-2xl overflow-hidden border border-slate-750 bg-slate-950 shadow-2xl shadow-black/80">
        {/* Browser Top Chrome / Window Bar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-3 px-3 py-1 rounded-md bg-slate-800 text-[11px] font-mono text-slate-400 border border-slate-700/60 hidden sm:inline-block">
              https://sentinel.ner.gov.in/{activeTab.toLowerCase().replace(' ', '-')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              {current.badge}
            </span>
            <Maximize2 size={13} className="text-slate-500 hidden sm:block" />
          </div>
        </div>

        {/* Browser Inner Viewport with AnimatePresence */}
        <div className="p-6 sm:p-8 min-h-[380px] sm:min-h-[440px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Feature Details */}
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Interactive Preview</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {current.title}
                </h3>

                <p className="text-sm font-medium text-emerald-200/80">
                  {current.subtitle}
                </p>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {current.description}
                </p>

                {/* Micro Stats Row */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                      {current.stat1.label}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-white mt-1">
                      {current.stat1.value}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                      {current.stat2.label}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-emerald-400 mt-1">
                      {current.stat2.value}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                      {current.stat3.label}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-white mt-1">
                      {current.stat3.value}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      const tabObj = tabs.find((t) => t.id === activeTab)
                      if (tabObj) go(tabObj.route)
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-950/50 transition-all cursor-pointer group"
                  >
                    <span>Launch {activeTab}</span>
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
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{activeTab.toUpperCase()} / LIVE VIEW</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      SECURE SESSION
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

                    {activeTab === 'Risk Intelligence' && (
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-mono text-slate-400">PREDICTIVE SCORE</span>
                          <span className="text-2xl font-black text-rose-400 font-mono">87.4%</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between text-slate-300">
                            <span>Rainfall anomaly weight</span>
                            <span className="font-mono text-emerald-400">35%</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Slope vulnerability weight</span>
                            <span className="font-mono text-emerald-400">25%</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Field voice report correlation</span>
                            <span className="font-mono text-emerald-400">20%</span>
                          </div>
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
                          <span>Correlation coefficient: r = 0.82</span>
                          <span className="text-emerald-400">Optimal</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer status bar in preview */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                    <span>STATUS: ALL ENGINES OPERATIONAL</span>
                    <span className="text-emerald-400">REFRESH: 1s</span>
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
