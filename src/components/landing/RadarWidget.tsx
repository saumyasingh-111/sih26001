import React from 'react'
import { motion } from 'framer-motion'
import { Compass, Radio } from 'lucide-react'

export function RadarWidget() {
  const pings = [
    { id: 1, x: '28%', y: '34%', label: 'Churachandpur (91%)', color: '#ef4444', pulseDelay: 0 },
    { id: 2, x: '63%', y: '52%', label: 'East Khasi Hills (74%)', color: '#f59e0b', pulseDelay: 0.8 },
    { id: 3, x: '46%', y: '68%', label: 'Tawang (58%)', color: '#10b981', pulseDelay: 1.6 },
  ]

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Floating Status Pill */}
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4 z-20 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium shadow-lg shadow-emerald-950/40 backdrop-blur-md"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="w-2 h-2 -ml-3 rounded-full bg-emerald-400" />
        <span>● LIVE SENSOR STREAM - Active</span>
      </motion.div>

      {/* Circular Radar Container */}
      <div className="relative w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-full border border-emerald-800/60 bg-radial from-emerald-950/60 via-slate-950/90 to-slate-950 overflow-hidden shadow-2xl shadow-black/80 flex items-center justify-center">
        {/* Radar Crosshairs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-emerald-800/40 -translate-x-1/2" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-emerald-800/40 -translate-y-1/2" />
        </div>

        {/* Concentric Radar Rings with ripple pulse */}
        <div className="absolute inset-4 rounded-full border border-emerald-700/30" />
        <div className="absolute inset-12 rounded-full border border-emerald-700/40" />
        <div className="absolute inset-24 rounded-full border border-emerald-600/50" />
        <div className="absolute inset-36 rounded-full border border-emerald-500/60" />

        {/* Pulsing ripple animations */}
        <motion.div
          animate={{ scale: [0.6, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-40 h-40 rounded-full border border-emerald-400/30 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [0.4, 1.3], opacity: [0.7, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1.2 }}
          className="absolute w-48 h-48 rounded-full border border-emerald-400/40 pointer-events-none"
        />

        {/* Revolving Emerald Sweep Beam */}
        <div
          className="absolute inset-0 pointer-events-none animate-[spin_4s_linear_infinite]"
          style={{ transformOrigin: 'center' }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(16, 185, 129, 0.45) 0deg, rgba(16, 185, 129, 0.08) 35deg, transparent 65deg)',
            }}
          />
        </div>

        {/* Radar Ping Dots Marking Active Hazard Regions */}
        {pings.map((ping) => (
          <div
            key={ping.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: ping.x, top: ping.y }}
          >
            {/* Pulsing halo */}
            <motion.span
              animate={{ scale: [1, 2.4], opacity: [0.8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: ping.pulseDelay }}
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{ backgroundColor: `${ping.color}40`, border: `1px solid ${ping.color}` }}
            />
            {/* Core dot */}
            <span
              className="relative block w-3.5 h-3.5 rounded-full ring-2 ring-white/80 shadow-lg"
              style={{ backgroundColor: ping.color }}
            />
            {/* Tooltip on hover */}
            <div className="absolute left-1/2 -top-8 -translate-x-1/2 hidden group-hover:block bg-slate-900/90 text-slate-100 text-[10px] font-mono px-2 py-1 rounded shadow-md border border-slate-700 whitespace-nowrap z-30">
              {ping.label}
            </div>
          </div>
        ))}

        {/* Center compass node */}
        <div className="relative z-10 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20 shadow-md" />
      </div>

      {/* Radar Legend Footer */}
      <div className="mt-4 flex items-center justify-between w-full max-w-xs text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <Radio size={12} className="text-emerald-400 animate-pulse" />
          <span>NER / 24°N - 28°N</span>
        </span>
        <span className="text-emerald-400 font-semibold">3 ACTIVE HAZARDS</span>
      </div>
    </div>
  )
}
