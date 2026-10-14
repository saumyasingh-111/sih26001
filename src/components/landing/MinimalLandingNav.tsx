import React, { useEffect, useState } from 'react'
import { ArrowRight, Globe2, Lock, LogIn, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface MinimalLandingNavProps {
  go: (r: string) => void
}

export function MinimalLandingNav({ go }: MinimalLandingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const getPortalRouteForUser = () => {
    if (!user) return 'login'
    switch (user.role) {
      case 'officer':
        return 'officer'
      case 'field_reporter':
        return 'field'
      case 'rescue_team':
        return 'rescue'
      case 'citizen':
      default:
        return 'citizen'
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-stone-950/90 backdrop-blur-md border-b border-stone-800/60 py-3 shadow-md'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Sentinel NER Brand Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <img
            src="./public/assets/favicon.svg"
            alt="Sentinel NER"
            className="w-7 h-7 flex-shrink-0"
          />
          <span className="font-editorial text-lg tracking-wider font-semibold text-stone-100">
            SENTINEL <span className="font-light italic text-emerald-400">NER</span>
          </span>
        </button>

        {/* Right Navigation & Entry Points */}
        <div className="flex items-center gap-3">
          {/* Public Entry Point */}
          <button
            onClick={() => go('citizen')}
            className="px-3.5 py-1.5 rounded-md text-xs font-sans font-semibold text-stone-200 hover:text-white hover:bg-stone-800/60 transition cursor-pointer flex items-center gap-1.5"
          >
            <Globe2 size={13} className="text-emerald-400" />
            <span>Public Safety Portal</span>
          </button>

          {/* Sign In / Enter Authorized Portal */}
          {user ? (
            <button
              onClick={() => go(getPortalRouteForUser())}
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 tracking-wide shadow-md"
            >
              <User size={13} />
              <span>Enter {user.role.replace('_', ' ').toUpperCase()} Portal</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={() => go('login')}
              className="px-4 py-2 rounded-md bg-stone-100 hover:bg-white text-stone-950 text-xs font-sans font-semibold transition cursor-pointer flex items-center gap-1.5 tracking-wide shadow-sm"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
