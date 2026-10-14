import React from 'react'
import { ArrowRight, Globe2, Radio, ShieldCheck, Truck } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

interface ReadyResolutionSectionProps {
  go: (r: string) => void
  setDemoMode: () => void
}

export function ReadyResolutionSection({ go }: ReadyResolutionSectionProps) {
  const { user, switchDemoRole } = useAuth()

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between bg-stone-950 text-stone-100">
      {/* Background Clear Mountain Photo */}
      <div className="absolute inset-0 z-0">
        <img
          src="./public/assets/ner_mountain_clear.jpg"
          alt="Clear view of North East Indian mountains"
          className="w-full h-full object-cover object-center pointer-events-none filter brightness-[0.72] contrast-[1.04]"
          loading="lazy"
        />
      </div>

      {/* Subtle Natural Vignette */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/70 pointer-events-none" />

      {/* Top spacing */}
      <div className="relative z-20 pt-20" />

      {/* Center Action & Role Portals Grid */}
      <div className="relative z-20 px-6 sm:px-12 max-w-5xl mx-auto text-center my-auto py-12 space-y-8">
        <div className="space-y-3">
          <h2 className="font-editorial text-4xl sm:text-6xl text-stone-100 font-normal tracking-tight leading-[1.1]">
            When the risk rises, <br />
            <span className="italic font-light text-emerald-400">coordinate together.</span>
          </h2>

          <p className="text-xs sm:text-sm font-sans text-stone-300/90 max-w-xl mx-auto leading-relaxed">
            One shared disaster intelligence backbone powering four role-protected interfaces for citizens, field monitors, disaster officers, and emergency rescue units.
          </p>
        </div>

        {/* 4 Dedicated Portal Entry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* 1. Citizen Portal */}
          <div
            onClick={() => go('citizen')}
            className="p-5 rounded-xl bg-stone-900/80 hover:bg-stone-900 border border-stone-800 hover:border-emerald-500/60 transition-all cursor-pointer shadow-lg group backdrop-blur-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 flex items-center justify-center mb-2.5">
                <Globe2 size={18} />
              </div>
              <h3 className="font-bold text-sm text-stone-100 group-hover:text-emerald-300 transition-colors">
                Citizen Portal
              </h3>
              <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                Public risk maps, location warnings, evacuation guidance & community reporting.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
              <span>Enter Portal</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Field Reporter Portal */}
          <div
            onClick={() => {
              if (user?.role === 'field_reporter' || user?.role === 'officer') {
                go('field')
              } else {
                go('login')
              }
            }}
            className="p-5 rounded-xl bg-stone-900/80 hover:bg-stone-900 border border-stone-800 hover:border-sky-500/60 transition-all cursor-pointer shadow-lg group backdrop-blur-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-sky-950/80 border border-sky-600/40 text-sky-400 flex items-center justify-center mb-2.5">
                <Radio size={18} />
              </div>
              <h3 className="font-bold text-sm text-stone-100 group-hover:text-sky-300 transition-colors">
                Field Reporter Portal
              </h3>
              <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                Assigned monitoring zones, scheduled observations, sensor telemetry & urgent alerts.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-800 text-[11px] font-mono text-sky-400 flex items-center justify-between">
              <span>{user?.role === 'field_reporter' ? 'Enter Portal' : 'Authorized Access'}</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Officer Control Center */}
          <div
            onClick={() => {
              if (user?.role === 'officer') {
                go('officer')
              } else {
                go('login')
              }
            }}
            className="p-5 rounded-xl bg-stone-900/80 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/60 transition-all cursor-pointer shadow-lg group backdrop-blur-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-600/40 text-amber-400 flex items-center justify-center mb-2.5">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-bold text-sm text-stone-100 group-hover:text-amber-300 transition-colors">
                Officer Control Center
              </h3>
              <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                Regional GIS, risk forecasting, incident verification, alert publishing & audit trail.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-800 text-[11px] font-mono text-amber-400 flex items-center justify-between">
              <span>{user?.role === 'officer' ? 'Enter Portal' : 'Authorized Access'}</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Rescue Operations Portal */}
          <div
            onClick={() => {
              if (user?.role === 'rescue_team' || user?.role === 'officer') {
                go('rescue')
              } else {
                go('login')
              }
            }}
            className="p-5 rounded-xl bg-stone-900/80 hover:bg-stone-900 border border-stone-800 hover:border-rose-500/60 transition-all cursor-pointer shadow-lg group backdrop-blur-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-600/40 text-rose-400 flex items-center justify-center mb-2.5">
                <Truck size={18} />
              </div>
              <h3 className="font-bold text-sm text-stone-100 group-hover:text-rose-300 transition-colors">
                Rescue Operations Portal
              </h3>
              <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                Assigned incidents, response workflow progression, hazard clearance & support requests.
              </p>
            </div>
            <div className="pt-2 border-t border-stone-800 text-[11px] font-mono text-rose-400 flex items-center justify-between">
              <span>{user?.role === 'rescue_team' ? 'Enter Portal' : 'Authorized Access'}</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Quick Sign In Prompt */}
        {!user && (
          <div className="pt-2">
            <button
              onClick={() => go('login')}
              className="px-6 py-2.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 font-sans font-semibold text-xs tracking-wide shadow-md transition cursor-pointer"
            >
              Sign In to Role Interface
            </button>
          </div>
        )}
      </div>

      {/* Minimal Footer */}
      <footer className="relative z-20 pb-8 px-6 sm:px-12 max-w-4xl mx-auto w-full text-center space-y-2 border-t border-stone-800/60 pt-6 text-xs text-stone-400 font-sans">
        <div className="font-editorial text-base text-stone-300 font-semibold tracking-wide">
          SENTINEL NER
        </div>
        <p className="text-[11px] text-stone-500">
          Landslide Risk Intelligence & Coordinated Multi-Role Disaster Management System
        </p>
      </footer>
    </section>
  )
}
