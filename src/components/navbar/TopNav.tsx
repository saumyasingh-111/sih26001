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
  X,
  Zap,
} from 'lucide-react'

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
  | 'satellite'
  | 'environment'
  | 'incidents'
  | 'settings'

interface TopNavProps {
  route: RouteName
  go: (r: RouteName) => void
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
  demoMode: boolean
  setDemoMode: (v: boolean) => void
  simulate: () => void
  notifications: number
  setModal: (m: string) => void
  setSearch: (s: string) => void
}

const navItems = [
  { label: 'Command Center', icon: Crosshair, route: 'command-center' as RouteName },
  { label: 'Risk Intelligence', icon: BrainCircuit, route: 'risk-intelligence' as RouteName },
  { label: 'Field Reports', icon: FileText, route: 'field-reports' as RouteName },
  { label: 'GIS Layers', icon: Layers3, route: 'gis' as RouteName },
  { label: 'Alert Center', icon: Radio, route: 'alerts' as RouteName },
  { label: 'Response Planning', icon: Route, route: 'response-planning' as RouteName },
  { label: 'Analytics', icon: BarChart3, route: 'analytics' as RouteName },
]

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button
      className="brand-mark brand-button flex items-center gap-2.5 text-slate-900 font-extrabold tracking-wider hover:opacity-90 transition-opacity"
      onClick={onClick}
    >
      <span className="brand-symbol w-8 h-8 rounded-lg grid place-items-center bg-emerald-950 text-emerald-400 border border-emerald-700/60 shadow-inner">
        <Mountain size={18} />
      </span>
      <span className="text-sm tracking-widest text-slate-800 font-bold">
        SENTINEL <b className="text-emerald-700 font-black">NER</b>
      </span>
    </button>
  )
}

export function TopNav({
  route,
  go,
  menuOpen,
  setMenuOpen,
  demoMode,
  setDemoMode,
  simulate,
  notifications,
  setModal,
  setSearch,
}: TopNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // Handle outside-click to cleanly close the "More" dropdown
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
    <nav className={`app-nav sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs ${menuOpen ? 'is-open' : ''}`}>
      <div className="app-nav-inner max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Brand onClick={() => go('home')} />

        {/* Mobile menu toggle */}
        <button
          className="mobile-menu lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open navigation"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Navigation Links */}
        <div className={`app-nav-links flex-1 items-center gap-1 ${menuOpen ? 'flex flex-col lg:flex-row absolute lg:static top-16 left-0 right-0 bg-white lg:bg-transparent border-b lg:border-none border-slate-200 p-4 lg:p-0 shadow-xl lg:shadow-none' : 'hidden lg:flex'}`}>
          {navItems.map(({ label, icon: Icon, route: target }) => {
            const isActive = route === target
            return (
              <button
                key={label}
                className={`nav-item flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
                onClick={() => {
                  go(target)
                  setMenuOpen(false)
                }}
              >
                <Icon size={15} className={isActive ? 'text-emerald-600' : 'text-slate-500'} />
                <span>{label}</span>
                {target === 'command-center' && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                    LIVE
                  </span>
                )}
                {target === 'alerts' && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500 text-white">
                    3
                  </span>
                )}
              </button>
            )
          })}

          {/* "More" Dropdown Menu with relative container, z-50 and outside-click */}
          <div className="relative nav-more" ref={moreMenuRef}>
            <button
              className={`nav-item flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                moreOpen
                  ? 'text-slate-900 bg-slate-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
              onClick={() => setMoreOpen(!moreOpen)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              <span>More</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${moreOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`}
              />
            </button>

            {moreOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 z-50 shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Specialized Modules
                </div>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  onClick={() => {
                    go('satellite')
                    setMoreOpen(false)
                    setMenuOpen(false)
                  }}
                  role="menuitem"
                >
                  <Globe2 size={15} className="text-emerald-600" />
                  <span>Satellite Intelligence</span>
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  onClick={() => {
                    go('environment')
                    setMoreOpen(false)
                    setMenuOpen(false)
                  }}
                  role="menuitem"
                >
                  <CloudSun size={15} className="text-amber-500" />
                  <span>Environmental Monitoring</span>
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  onClick={() => {
                    go('incidents')
                    setMoreOpen(false)
                    setMenuOpen(false)
                  }}
                  role="menuitem"
                >
                  <FileText size={15} className="text-blue-500" />
                  <span>Incident Register</span>
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  onClick={() => {
                    go('settings')
                    setMoreOpen(false)
                    setMenuOpen(false)
                  }}
                  role="menuitem"
                >
                  <Settings size={15} className="text-slate-500" />
                  <span>Settings & Preferences</span>
                </button>

                <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Simulation & Tools
                </div>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                  onClick={() => {
                    simulate()
                    setMoreOpen(false)
                    setMenuOpen(false)
                  }}
                  role="menuitem"
                >
                  <Zap size={15} className="text-amber-500" />
                  <span>Run Emergency Simulation</span>
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                  onClick={() => {
                    setDemoMode(!demoMode)
                    setMoreOpen(false)
                  }}
                  role="menuitem"
                >
                  <Database size={15} className="text-slate-500" />
                  <span>{demoMode ? 'Use Live Connectors' : 'Use Demo Data'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nav Utilities */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/60 transition-colors"
            onClick={() => setModal('sync')}
            title="System status"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
            <span>OPERATIONAL</span>
          </button>

          <button
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => {
              setSearch('')
              setModal('search')
            }}
            aria-label="Open global search (Ctrl + K)"
            title="Search (Ctrl + K)"
          >
            <Search size={16} />
          </button>

          <button
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setModal('notifications')}
            aria-label="Open notifications"
          >
            <Bell size={16} />
            {notifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-white">
                {notifications}
              </span>
            )}
          </button>

          <button
            className="w-8 h-8 rounded-full bg-emerald-800 hover:bg-emerald-900 text-emerald-50 font-bold text-xs flex items-center justify-center ring-2 ring-emerald-200/60 transition-transform active:scale-95"
            onClick={() => setModal('profile')}
            aria-label="Open user profile"
          >
            AS
          </button>
        </div>
      </div>
    </nav>
  )
}
