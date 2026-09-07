import React from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, CloudRain, Mountain, Radio, Waves } from 'lucide-react'

export function SignalsToWarningSection() {
  const inputs = [
    {
      name: 'RAINFALL',
      desc: 'Monsoon intensity & burst rates',
      icon: CloudRain,
    },
    {
      name: 'TERRAIN',
      desc: 'Slope gradients & geological cuts',
      icon: Mountain,
    },
    {
      name: 'SOIL',
      desc: 'Moisture saturation & pore pressure',
      icon: Waves,
    },
    {
      name: 'GROUND REPORTS',
      desc: 'Ranger logs & tension crack sightings',
      icon: Radio,
    },
  ]

  return (
    <section className="relative py-28 px-6 sm:px-12 bg-stone-950 text-stone-100 border-t border-stone-800/80">
      <div className="max-w-4xl mx-auto text-center">
        {/* Section Heading */}
        <div className="mb-14 space-y-3">
          <div className="text-[11px] font-sans tracking-[0.2em] text-stone-400 uppercase">
            HOW IT WORKS
          </div>
          <h2 className="font-editorial text-4xl sm:text-5xl text-stone-100 font-normal tracking-tight">
            From signals to <span className="italic font-light text-stone-300">warning.</span>
          </h2>
          <p className="text-xs sm:text-sm font-sans text-stone-400 max-w-md mx-auto leading-relaxed">
            Sentinel combines environmental signals to identify rising risk before the slope moves.
          </p>
        </div>

        {/* The 4 Environmental Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
          {inputs.map((input) => {
            const Icon = input.icon
            return (
              <div
                key={input.name}
                className="p-5 rounded-lg bg-stone-900/60 border border-stone-800/80 text-center flex flex-col items-center justify-center space-y-2"
              >
                <div className="p-2.5 rounded-md bg-stone-800/80 text-stone-300">
                  <Icon size={18} />
                </div>
                <div className="text-xs font-sans font-bold text-stone-200 tracking-wide">
                  {input.name}
                </div>
                <div className="text-[11px] font-sans text-stone-400 leading-snug">
                  {input.desc}
                </div>
              </div>
            )
          })}
        </div>

        {/* Downward Conduit 1 */}
        <div className="flex justify-center my-3 text-stone-600">
          <ArrowDown size={18} />
        </div>

        {/* Stage 2: Risk Intelligence */}
        <div className="p-6 rounded-xl bg-stone-900/90 border border-stone-800 max-w-md mx-auto space-y-1.5 shadow-sm">
          <div className="text-[10px] font-sans tracking-[0.16em] uppercase text-stone-400">
            CONTINUOUS ANALYSIS
          </div>
          <div className="font-editorial text-2xl text-stone-100 font-normal">
            RISK INTELLIGENCE
          </div>
          <p className="text-xs font-sans text-stone-400">
            Detecting progressive slope instability rather than binary yes/no alerts.
          </p>
        </div>

        {/* Downward Conduit 2 */}
        <div className="flex justify-center my-3 text-stone-600">
          <ArrowDown size={18} />
        </div>

        {/* Stage 3: Early Warning */}
        <div className="p-6 rounded-xl bg-stone-900/40 border border-stone-700/80 max-w-md mx-auto space-y-1.5 shadow-sm">
          <div className="text-[10px] font-sans tracking-[0.16em] uppercase text-stone-400">
            ACTIONABLE FORESIGHT
          </div>
          <div className="font-editorial text-2xl text-stone-100 font-normal">
            EARLY WARNING
          </div>
          <p className="text-xs font-sans text-stone-400">
            12 to 24 hours of operational window to pre-position resources and safeguard lives.
          </p>
        </div>
      </div>
    </section>
  )
}
