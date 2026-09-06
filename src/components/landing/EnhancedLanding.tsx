import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  ChevronRight,
  CloudRain,
  Database,
  Layers,
  Mountain,
  Radio,
  Shield,
  ShieldCheck,
  Waves,
} from 'lucide-react'
import { Brand, RouteName } from '../navbar/TopNav'
import { RadarWidget } from './RadarWidget'
import { FeatureShowcase } from './FeatureShowcase'
import { ScrollReveal } from './ScrollReveal'

interface EnhancedLandingProps {
  go: (r: RouteName) => void
}

export function EnhancedLanding({ go }: EnhancedLandingProps) {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      num: '01',
      title: 'DATA',
      headline: 'Multi-Sensor Ingestion',
      detail:
        'Rainfall gauges, Synthetic Aperture Radar (SAR), soil moisture sensors, and field officer voice reports are continuously ingested into an edge-ready operational databus.',
    },
    {
      num: '02',
      title: 'AI',
      headline: 'Deterministic Physics & ML',
      detail:
        'Raw telemetry is cleaned, normalized, and evaluated through coupled geotechnical slope stability models and computer vision defect recognition.',
    },
    {
      num: '03',
      title: 'RISK',
      headline: 'Explainable Hazard Scoring',
      detail:
        'Dynamic multi-factor risk dials clearly explain which underlying physical indicators (e.g. soil pore pressure vs. precipitation anomaly) moved the score.',
    },
    {
      num: '04',
      title: 'WARNING',
      headline: 'Automated Triaged Alerts',
      detail:
        'District command receives priority-ranked alerts with auditable confidence metrics, unaffected alternative routes, and suggested response resources.',
    },
    {
      num: '05',
      title: 'RESPONSE',
      headline: 'Human-in-the-Loop Dispatch',
      detail:
        'District magistrate or designated incident commander authorizes clearance, dispatches verified response teams, and monitors real-time incident progression.',
    },
  ]

  const challengeFactors = [
    {
      icon: Mountain,
      title: 'Steep Mountainous Terrain',
      description:
        'High elevation gradients across the Eastern Himalayas accelerate slope shear failure under heavy gravitational load.',
    },
    {
      icon: CloudRain,
      title: 'Intense Monsoon Rainfall',
      description:
        'Cloudbursts and sustained monsoon precipitation saturate fragile topsoil layers far past equilibrium limits.',
    },
    {
      icon: Waves,
      title: 'High Soil Saturation',
      description:
        'Water accumulation increases pore pressure, triggering sudden liquefaction and rapid debris flows with zero warning.',
    },
    {
      icon: Activity,
      title: 'Geological Instability',
      description:
        'Active seismic tectonic plates and expanding infrastructure corridors induce subsurface fractures and fault slips.',
    },
  ]

  return (
    <div className="landing cinematic-landing min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Brand onClick={() => go('home')} />

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-slate-300">
            <a href="#hero" className="hover:text-emerald-400 transition-colors">
              OVERVIEW
            </a>
            <a href="#challenge" className="hover:text-emerald-400 transition-colors">
              THE CHALLENGE
            </a>
            <a href="#approach" className="hover:text-emerald-400 transition-colors">
              OUR APPROACH
            </a>
            <a href="#showcase" className="hover:text-emerald-400 transition-colors">
              PLATFORM TOUR
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer"
              onClick={() => go('login')}
            >
              Sign In
            </button>
            <button
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-950/40 transition-all cursor-pointer hidden sm:block"
              onClick={() => go('command-center')}
            >
              Command Center
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-20 md:py-24 overflow-hidden">
        {/* Background ambient gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-radial from-emerald-900/20 via-slate-900/10 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-400 text-xs font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SYSTEM OPERATIONAL</span>
                <span className="text-emerald-700">|</span>
                <span className="text-slate-300">MONITORING 24/7 NER</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
                Predict.{' '}
                <span className="bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                  Prepare.
                </span>{' '}
                <br />
                Protect.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                AI-powered landslide intelligence for earlier warnings, faster field verification, and
                auditable disaster response operations across India's North Eastern Region.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer group"
                  onClick={() => go('command-center')}
                >
                  <span>Launch Risk Monitor</span>
                  <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#approach"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold transition-all"
                >
                  <span>Explore How It Works</span>
                  <ChevronRight size={16} />
                </a>
              </div>

              {/* Trust Badge */}
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Designed for District Disaster Management Authorities (DDMA) & Emergency Responders</span>
              </div>

              {/* Hero Key Metrics Banner (3-Column Stats) */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/90 max-w-lg">
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                    98.2%
                  </div>
                  <div className="text-[11px] font-mono uppercase text-slate-400">
                    Prediction Accuracy
                  </div>
                </div>

                <div className="space-y-1 border-l border-slate-800/90 pl-4">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 font-mono">
                    &lt; 120s
                  </div>
                  <div className="text-[11px] font-mono uppercase text-slate-400">
                    Voice-to-Dispatch Latency
                  </div>
                </div>

                <div className="space-y-1 border-l border-slate-800/90 pl-4">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                    8
                  </div>
                  <div className="text-[11px] font-mono uppercase text-slate-400">
                    Districts Monitored
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Right Content: Animated Radar Widget */}
            <div className="lg:col-span-5 flex justify-center">
              <RadarWidget />
            </div>
          </div>
        </div>
      </section>

      {/* "The Challenge" Section */}
      <section
        id="challenge"
        className="relative py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 border-t border-slate-800/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                THE CHALLENGE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
                When the mountain gives a warning, will we hear it?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
                The North Eastern Region is among the planet's most vulnerable landslide zones. Intense
                monsoon deluges and complex mountainous terrain generate hazard cascades too fast for
                isolated, manual reporting.
              </p>
            </div>
          </ScrollReveal>

          {/* Interactive Hover Elevation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {challengeFactors.map((factor, index) => {
              const Icon = factor.icon
              return (
                <ScrollReveal key={factor.title} delay={index * 0.1}>
                  <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/30 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-800/60 group-hover:scale-105 group-hover:bg-emerald-900 transition-all">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                      {factor.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {factor.description}
                    </p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* "The Sentinel Approach" Pipeline Component */}
      <section
        id="approach"
        className="relative py-24 bg-slate-950 border-t border-slate-850"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                THE SENTINEL APPROACH
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
                From scattered signals to early action.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-3">
                A connected, multi-stage operational pipeline turning satellite and field evidence into
                verified life-saving interventions.
              </p>
            </div>
          </ScrollReveal>

          {/* Interactive Pipeline Sequence with Animated Progress Line */}
          <div className="relative">
            {/* Connecting Horizontal Line (desktop) */}
            <div className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-0.5 bg-slate-800 z-0">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </div>

            {/* Pipeline Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
              {steps.map((step, index) => {
                const isActive = activeStep === index
                return (
                  <button
                    key={step.title}
                    onClick={() => setActiveStep(index)}
                    className={`p-5 rounded-2xl text-left transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-slate-900/95 border-emerald-500 shadow-xl shadow-emerald-950/40 -translate-y-1'
                        : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {step.num}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        STAGE {index + 1}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-xs font-semibold text-emerald-300 mb-2">
                      {step.headline}
                    </p>

                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      {isActive ? (
                        <span className="text-slate-200">{step.detail}</span>
                      ) : (
                        <span className="text-slate-400 line-clamp-2">
                          Click to expand source details...
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Platform Feature Showcase */}
      <section
        id="showcase"
        className="relative py-24 bg-slate-900/90 border-t border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                ONE PLATFORM. EVERY SIGNAL.
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
                Operational clarity when minutes matter most.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-3">
                Experience the interactive capabilities designed specifically for high-stress disaster
                decision environments.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <FeatureShowcase go={go} />
          </ScrollReveal>
        </div>
      </section>

      {/* Call To Action (CTA) Banner */}
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden border-t border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <ScrollReveal>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 text-xs font-mono font-semibold">
              OPERATIONAL READINESS 2026
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-4 max-w-3xl mx-auto leading-tight">
              Deploy Sentinel NER for your operational district.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mt-4">
              Real-time landslide predictions, automated hazard alerts, and offline voice reporting
              for emergency management teams across Manipur, Meghalaya, Sikkim, and Arunachal Pradesh.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              <button
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-xl shadow-emerald-950/60 transition-all cursor-pointer group"
                onClick={() => go('command-center')}
              >
                <span>Launch Risk Monitor</span>
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold transition-all cursor-pointer"
                onClick={() => go('field-reports')}
              >
                <span>Request Field Access</span>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 bg-slate-950 border-t border-slate-850 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Brand onClick={() => go('home')} />
          <div className="flex items-center gap-6 text-slate-400">
            <span>SIH26001 PROTOCOL</span>
            <span>NORTH EASTERN REGION</span>
            <span>PROTOTYPE V0.2</span>
          </div>
          <p className="text-slate-400">
            © 2026 Sentinel NER · Autonomous Landslide Intelligence System
          </p>
        </div>
      </footer>
    </div>
  )
}
