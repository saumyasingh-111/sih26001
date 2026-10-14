import React from 'react'
import { CinematicLanding } from './CinematicLanding'
import { RouteName } from '../navbar/TopNav'

interface EnhancedLandingProps {
  go: (r: string) => void
}

export function EnhancedLanding({ go }: EnhancedLandingProps) {
  return <CinematicLanding go={go} />
}
