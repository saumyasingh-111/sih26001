import React from 'react'
import { RouteName } from '../navbar/TopNav'
import { useDataContext } from '../../context/DataContext'
import { MinimalLandingNav } from './MinimalLandingNav'
import { HeroSmogSection } from './sections/HeroSmogSection'
import { SignalsToWarningSection } from './sections/SignalsToWarningSection'
import { ReadyResolutionSection } from './sections/ReadyResolutionSection'

interface CinematicLandingProps {
  go: (r: RouteName) => void
}

export function CinematicLanding({ go }: CinematicLandingProps) {
  const { setMode } = useDataContext()

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-stone-700 selection:text-stone-100">
      {/* 1. Minimal Transparent Topbar: Brand on Left, Enter Platform on Right */}
      <MinimalLandingNav go={go} />

      {/* 2. Hero Section: Mountains hidden in mist, scroll clears the fog */}
      <HeroSmogSection />

      {/* 3. Short Concept Section: From Signals to Warning (Rainfall, Terrain, Soil, Reports -> Risk -> Warning) */}
      <SignalsToWarningSection />

      {/* 4. Final Section: Clear mountain landscape, "When the risk rises, be ready", CTA & minimal footer */}
      <ReadyResolutionSection go={go} setDemoMode={() => setMode('demo')} />
    </div>
  )
}
