import React, { useEffect, useState } from 'react'
import { ArrowRight, Mountain } from 'lucide-react'
import { RouteName } from '../navbar/TopNav'

interface MinimalLandingNavProps {
  go: (r: RouteName) => void
}

export function MinimalLandingNav({ go }: MinimalLandingNavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-stone-950/80 backdrop-blur-md border-b border-stone-800/60 py-3.5 shadow-sm'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-10 flex items-center justify-between">
        {/* Left: Sentinel NER Brand Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <span className="w-7 h-7 rounded-md bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300 group-hover:text-white transition">
            <Mountain size={15} />
          </span>
          <span className="font-editorial text-lg tracking-wider font-semibold text-stone-100">
            SENTINEL <span className="font-light italic text-stone-300">NER</span>
          </span>
        </button>

        {/* Right: Enter Platform CTA */}
        <button
          onClick={() => go('command-center')}
          className="px-4 py-2 rounded-md bg-stone-100/90 hover:bg-white text-stone-950 text-xs font-sans font-medium transition cursor-pointer flex items-center gap-1.5 tracking-wide shadow-sm"
        >
          <span>Enter Platform</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </header>
  )
}
