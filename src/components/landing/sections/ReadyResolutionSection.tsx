import React from 'react'
import { ArrowRight, Mountain } from 'lucide-react'
import { RouteName } from '../../navbar/TopNav'

interface ReadyResolutionSectionProps {
  go: (r: RouteName) => void
  setDemoMode: () => void
}

export function ReadyResolutionSection({ go, setDemoMode }: ReadyResolutionSectionProps) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between bg-stone-950 text-stone-100">
      {/* Background Clear Mountain Photo (The fog is gone; mountain is clear) */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/ner_mountain_clear.jpg"
          alt="Clear view of North East Indian mountains"
          className="w-full h-full object-cover object-center pointer-events-none filter brightness-[0.72] contrast-[1.04]"
          loading="lazy"
        />
      </div>

      {/* Subtle Natural Vignette */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-stone-950 via-stone-950/30 to-stone-950/60 pointer-events-none" />

      {/* Top spacing */}
      <div className="relative z-20 pt-16" />

      {/* Center Action Climax */}
      <div className="relative z-20 px-6 sm:px-12 max-w-3xl mx-auto text-center my-auto py-16 space-y-6">
        <h2 className="font-editorial text-4xl sm:text-6xl text-stone-100 font-normal tracking-tight leading-[1.1]">
          When the risk rises, <br />
          <span className="italic font-light text-stone-300">be ready.</span>
        </h2>

        {/* 3 Core Sentences */}
        <div className="space-y-1.5 text-xs sm:text-sm font-sans text-stone-300/90 max-w-sm mx-auto">
          <p>Monitor vulnerable terrain.</p>
          <p>Understand changing conditions.</p>
          <p>Act before impact.</p>
        </div>

        {/* One Large CTA */}
        <div className="pt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => go('command-center')}
            className="px-8 py-3.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 font-sans font-semibold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 tracking-wide shadow-lg"
          >
            <span>Enter Sahyog</span>
            <ArrowRight size={15} />
          </button>

          {/* Secondary Tiny Option */}
          <button
            onClick={() => {
              setDemoMode()
              go('command-center')
            }}
            className="text-stone-400 hover:text-stone-200 text-xs font-sans transition cursor-pointer underline underline-offset-4 mt-2"
          >
            View Demo Scenario
          </button>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="relative z-20 pb-8 px-6 sm:px-12 max-w-4xl mx-auto w-full text-center space-y-2 border-t border-stone-800/60 pt-6 text-xs text-stone-400 font-sans">
        <div className="font-editorial text-base text-stone-300 font-semibold tracking-wide">
          SAHYOG
        </div>
        <div className="text-[11px] text-stone-400 tracking-wider">
          AI-POWERED LANDSLIDE EARLY WARNING · NORTH EASTERN REGION
        </div>
      </footer>
    </section>
  )
}