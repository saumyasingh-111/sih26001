import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

export function HeroSmogSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // Smooth spring for atmospheric interpolation
  const smooth = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 26,
    restDelta: 0.001,
  })

  // Fog dissolution transforms
  const fogOpacity = useTransform(smooth, [0, 0.45, 0.85], [0.96, 0.4, 0.0])
  const fogDriftY = useTransform(smooth, [0, 0.85], [0, -120])
  const mountainScale = useTransform(smooth, [0, 0.85], [1.08, 1.0])
  const mountainBlur = useTransform(
    smooth,
    [0, 0.4, 0.8],
    ['blur(7px) brightness(0.7)', 'blur(2.5px) brightness(0.85)', 'blur(0px) brightness(0.98)']
  )

  // Title transitions: Initial "SEE THE RISK BEFORE THE LANDSLIDE" -> Transitioning to "LANDSLIDE EARLY WARNING"
  const initialTitleOpacity = useTransform(smooth, [0, 0.35, 0.55], [1, 0.8, 0])
  const clearedTitleOpacity = useTransform(smooth, [0.45, 0.7, 0.95], [0, 1, 1])

  // Scroll cue indicator (fades quickly on scroll)
  const scrollCueOpacity = useTransform(smooth, [0, 0.2], [1, 0])

  return (
    <section ref={containerRef} className="relative h-[200vh] bg-stone-950">
      {/* 100vh Pinned Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between select-none">
        {/* Mountain Photographic Layer */}
        <motion.div
          style={{
            scale: mountainScale,
            filter: mountainBlur,
          }}
          className="absolute inset-0 z-0 will-change-transform"
        >
          <img
            src="/assets/ner_mountain_fog.jpg"
            alt="North-East Indian mountain ridges veiled in mist"
            className="w-full h-full object-cover object-center pointer-events-none"
            loading="eager"
          />
        </motion.div>

        {/* Natural Atmospheric Gradient & Vignette */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-stone-950 via-stone-950/30 to-stone-950/60 pointer-events-none" />

        {/* Physical Fog / Smog Blanket (Evaporates on scroll) */}
        <motion.div
          style={{
            opacity: fogOpacity,
            y: fogDriftY,
          }}
          className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-stone-900/80 via-stone-800/40 to-stone-950/90 mix-blend-screen"
        >
          {/* Subtle natural mist layers */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-300/20 via-stone-600/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-stone-950/90 via-stone-800/30 to-transparent" />
        </motion.div>

        {/* Empty top spacing for minimal navbar */}
        <div className="relative z-30 pt-20" />

        {/* Center Editorial Typography Stage */}
        <div className="relative z-30 px-6 sm:px-12 max-w-4xl mx-auto w-full text-center my-auto">
          {/* Brand Eyebrow */}
          <div className="text-[11px] font-sans tracking-[0.2em] text-stone-400 uppercase mb-4">
            Sahyog
          </div>

          {/* Initial Headline (0% Scroll: Mist Dense) */}
          <motion.div style={{ opacity: initialTitleOpacity }} className="space-y-4">
            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl text-stone-100 font-normal tracking-tight leading-[1.08]">
              See the risk <br />
              <span className="italic font-light text-stone-300">before the landslide.</span>
            </h1>

            <p className="text-xs sm:text-sm font-sans text-stone-400 max-w-md mx-auto leading-relaxed">
              AI-powered early warning for landslide-prone regions of North East India.
            </p>
          </motion.div>

          {/* Cleared Headline (As scroll clears fog: Landscape visible) */}
          <motion.div
            style={{ opacity: clearedTitleOpacity }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none space-y-3"
          >
            <div className="text-[11px] font-sans tracking-[0.2em] text-stone-300 uppercase">
              Sahyog
            </div>
            <h2 className="font-editorial text-4xl sm:text-6xl text-stone-100 font-normal tracking-tight">
              Landslide <span className="italic font-light text-stone-300">Early Warning</span>
            </h2>
            <p className="text-xs sm:text-sm font-sans text-stone-400 max-w-sm mx-auto">
              Environmental intelligence for vulnerable mountain corridors.
            </p>
          </motion.div>
        </div>

        {/* Bottom Scroll Cue Indicator */}
        <motion.div
          style={{ opacity: scrollCueOpacity }}
          className="relative z-30 pb-10 px-6 text-center pointer-events-none"
        >
          <div className="inline-flex flex-col items-center gap-2 text-stone-400">
            <span className="text-[10px] font-sans tracking-[0.18em] uppercase text-stone-400">
              Scroll to clear fog
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <ArrowDown size={14} className="text-stone-300" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}