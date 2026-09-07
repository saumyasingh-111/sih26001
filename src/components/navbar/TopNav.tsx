import React, { useEffect, useRef, useState } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  ChevronDown,
  CloudSun,
  Crosshair,
  Database,
  FileText,
  Globe2,
  Layers3,
  Menu,
  Mountain,
  Radio,
  Route,
  Search,
  Settings,
  Shield,
  X,
  Zap,
} from 'lucide-react'
import { useDataContext } from '../../context/DataContext'

export type RouteName =
  | 'home'
  | 'login'
  | 'command-center'
  | 'risk-intelligence'
  | 'field-reports'
  | 'gis'
  | 'alerts'
  | 'response-planning'
  | 'analytics'
  | 'environment'
  | 'incidents'
  | 'settings'

interface TopNavProps {
  route: RouteName
  go: (r: RouteName) => void
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
  simulate: () => void
  notifications: number
  setModal: (m: string) => void
  setSearch: (s: string) => void
}

// 4 Primary Center Navigation Tabs
const PRIMARY_NAV = [
  { label: 'Command Center', icon: Crosshair, route: 'command-center' as RouteName },
  { label: 'Risk Intelligence', icon: BrainCircuit, route: 'risk-intelligence' as RouteName },
  { label: 'Field Reports', icon: FileText, route: 'field-reports' as RouteName },
  { label: 'GIS Layers', icon: Layers3, route: 'gis' as RouteName },
]

// Secondary modules accessible via clean "More" dropdown
const SECONDARY_NAV = [
  { label: 'Alert Center', icon: Radio, route: 'alerts' as RouteName, tag: 'Active' },
  { label: 'Preparedness Planning', icon: Route, route: 'response-planning' as RouteName },
  { label: 'Analytics & Insights', icon: BarChart3, route: 'analytics' as RouteName },
  { label: 'Environmental Telemetry', icon: CloudSun, route: 'environment' as RouteName },
  { label: 'Incident Register', icon: FileText, route: 'incidents' as RouteName },
  { label: 'System Settings', icon: Settings, route: 'settings' as RouteName },
]

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button
      className="flex items-center gap-2.5 text-left text-stone-100 hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0"
      onClick={onClick}
      aria-label="Sentinel NER Home"
    >
      <span className="w-8 h-8 rounded-md grid place-items-center bg-[#182026] border border-[#2b3742] text-[#8ea699] font-bold shadow-xs">
        <Mountain size={17} />
      </span>
      <div className="flex flex-col">
        <span className="text-xs sm:text-sm tracking-wider font-extrabold text-stone-100 font-mono leading-none">
          SENTINEL <span className="text-[#8ea699]">NER</span>
        </span>
        <span className="text-[9px] text-stone-400 font-medium tracking-tight mt-0.5 leading-none">
          Disaster Early Warning
        </span>
      </div>
    </button>
  )
}

export function TopNav({
  route,
  go,
  menuOpen,
  setMenuOpen,
  simulate,
  notifications,
  setModal,
  setSearch,
}: TopNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const { dataMode, setMode, isDemoMode, userLocation, isNER, activeLocationName } = useDataContext()

  // Clean outside-click listener for "More" dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreOpen(false)
      }
    }

    if (moreOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [moreOpen])

  return (
    <nav className="sticky top-0 z-50 bg-[#0e1215]/95 backdrop-blur-md border-b border-[#222930] font-sans text-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* ============================================================ */}
        {/* LEFT: Sentinel NER Brand Logo                                */}
        {/* ============================================================ */}
        <div className="flex items-center gap-3">
          <Brand onClick={() => go('home')} />

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1.5 text-stone-400 hover:text-stone-100 rounded-md hover:bg-[#181f26] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* ============================================================ */}
        {/* CENTER: 4 Primary Operational Tabs + More Dropdown           */}
        {/* Strictly fits on 1366px laptop screens without wrapping     */}
        {/* ============================================================ */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center max-w-2xl">
          {PRIMARY_NAV.map(({ label, icon: Icon, route: target }) => {
            const isActive = route === target
            return (
              <button
                key={label}
                onClick={() => {
                  go(target)
                  setMenuOpen(false)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1a2229] text-stone-100 border border-[#2b3742] shadow-xs'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-[#151c22]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#8ea699]' : 'text-stone-500'} />
                <span>{label}</span>
              </button>
            )
          })}

          {/* Secondary Modules: Clean More Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                moreOpen || SECONDARY_NAV.some((n) => n.route === route)
                  ? 'bg-[#1a2229] text-stone-100 border border-[#2b3742]'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-[#151c22]'
              }`}
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              <span>More</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-150 ${moreOpen ? 'rotate-180 text-stone-200' : 'text-stone-500'}`}
              />
            </button>

            {moreOpen && (
              <div
                className="absolute left-0 mt-1.5 w-60 z-50 bg-[#12161a] border border-[#252f38] rounded-lg shadow-2xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
                role="menu"
              >
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  Operations & Intelligence
                </div>
                {SECONDARY_NAV.map(({ label, icon: Icon, route: target, tag }) => (
                  <button
                    key={label}
                    onClick={() => {
                      go(target)
                      setMoreOpen(false)
                      setMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      route === target
                        ? 'bg-[#1a2229] text-stone-100 font-bold'
                        : 'text-stone-300 hover:bg-[#181f26] hover:text-stone-100'
                    }`}
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-stone-400" />
                      <span>{label}</span>
                    </div>
                    {tag && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#2f1f21] text-[#e07a70] border border-[#482b2d] font-bold">
                        {tag}
                      </span>
                    )}
                  </button>
                ))}

                <div className="my-1 border-t border-[#222930]" />
                <button
                  onClick={() => {
                    simulate()
                    setMoreOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#dca24c] hover:bg-[#251d14] transition-colors cursor-pointer font-medium"
                >
                  <Zap size={14} className="text-[#dca24c]" />
                  <span>Escalate Scenario Test</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT: Compact Mode Indicator, Search, Alerts, Profile      */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Location Status Indicator Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#12161a] border border-[#222a32] text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isDemoMode ? 'bg-[#c28b38] animate-pulse' : 'bg-[#457c63]'
              }`}
            />
            <span className="font-semibold text-stone-200 max-w-[150px] truncate">
              {isDemoMode ? 'DEMO | Churachandpur' : `LIVE | ${userLocation.city || 'Kanpur'}`}
            </span>
          </div>

          {/* Compact Discreet Data Mode Toggle (Restrained, not giant) */}
          <div className="flex items-center bg-[#12161a] rounded-md p-0.5 border border-[#222a32] text-[11px] font-mono">
            <button
              onClick={() => setMode('live')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-semibold ${
                dataMode === 'live'
                  ? 'bg-[#192720] text-[#7eb396] border border-[#294235] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Live Open-Meteo & NASA Historical Baselines"
            >
              LIVE
            </button>
            <button
              onClick={() => setMode('demo')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-semibold ${
                dataMode === 'demo'
                  ? 'bg-[#2c2014] text-[#dca24c] border border-[#48331e] shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Simulated Landslide Developing Scenario (Churachandpur)"
            >
              DEMO
            </button>
          </div>

          {/* Search trigger */}
          <button
            className="p-1.5 text-stone-400 hover:text-stone-100 rounded-md hover:bg-[#181f26] transition-colors cursor-pointer"
            onClick={() => {
              setSearch('')
              setModal('search')
            }}
            aria-label="Global Search (Ctrl + K)"
            title="Search (Ctrl + K)"
          >
            <Search size={16} />
          </button>

          {/* Notifications */}
          <button
            className="relative p-1.5 text-stone-400 hover:text-stone-100 rounded-md hover:bg-[#181f26] transition-colors cursor-pointer"
            onClick={() => setModal('notifications')}
            aria-label="Active Notifications"
            title="System Alerts"
          >
            <Bell size={16} />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#b84d43] ring-1 ring-[#0e1215]" />
            )}
          </button>

          {/* Avatar / Profile */}
          <button
            className="w-7 h-7 rounded-md bg-[#1a2229] hover:bg-[#242f38] text-stone-200 border border-[#2b3742] font-mono font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer transition-colors"
            onClick={() => setModal('profile')}
            aria-label="User Profile"
            title="Operations Commander"
          >
            AS
          </button>
        </div>
      </div>

      {/* Outside NER Notice Banner for Live Mode */}
      {!isDemoMode && !isNER && (
        <div className="bg-[#12161a] text-stone-300 border-t border-[#222930] px-4 py-1.5 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#7eb396] animate-pulse flex-shrink-0" />
            <span className="font-mono text-[#7eb396] font-semibold text-[11px]">LIVE GPS DETECTED:</span>
            <span className="text-stone-100 font-medium truncate text-xs">{activeLocationName}</span>
            <span className="text-stone-400 hidden md:inline text-[11px]">(Outside NER coverage · flat alluvial relief · zero landslide risk)</span>
          </div>
          <button
            onClick={() => setMode('demo')}
            className="flex-shrink-0 px-2 py-0.5 rounded bg-[#2c2014] hover:bg-[#382a1b] text-[#dca24c] border border-[#48331e] font-bold font-mono text-[10px] sm:text-[11px] transition-colors cursor-pointer flex items-center gap-1"
          >
            <Zap size={11} />
            <span>Explore NER Crisis Demo</span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* Mobile Collapsible Navigation Drawer                         */}
      {/* ============================================================ */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#222930] bg-[#12161a] px-4 py-3 space-y-2 text-xs text-stone-300">
          <div className="text-[10px] font-mono text-stone-400 uppercase">Primary Workspaces</div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRIMARY_NAV.map(({ label, icon: Icon, route: target }) => (
              <button
                key={label}
                onClick={() => {
                  go(target)
                  setMenuOpen(false)
                }}
                className={`flex items-center gap-1.5 p-2 rounded-md font-semibold text-left ${
                  route === target ? 'bg-[#1a2229] text-stone-100 border border-[#2b3742]' : 'bg-[#161c22] text-stone-300 hover:text-stone-100 border border-[#222a32]'
                }`}
              >
                <Icon size={14} className={route === target ? 'text-[#8ea699]' : 'text-stone-400'} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 text-[10px] font-mono text-stone-400 uppercase">Secondary Modules</div>
          <div className="grid grid-cols-2 gap-1.5">
            {SECONDARY_NAV.slice(0, 4).map(({ label, icon: Icon, route: target }) => (
              <button
                key={label}
                onClick={() => {
                  go(target)
                  setMenuOpen(false)
                }}
                className="flex items-center gap-1.5 p-1.5 rounded-md bg-[#161c22] text-stone-300 text-[11px] border border-[#222a32]"
              >
                <Icon size={13} className="text-stone-400" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
