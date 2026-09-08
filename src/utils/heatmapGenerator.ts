// SENTINEL NER - Landslide Risk & Hazard Density Heatmap Engine
import L from 'leaflet'
// Ensure window.L is available before leaflet.heat evaluates
if (typeof window !== 'undefined') {
  ;(window as any).L = L
}
import 'leaflet.heat'
import { HISTORICAL_LANDSLIDES } from '../data/historicalLandslides'
import { DISTRICT_COORDINATES } from '../services/weatherService'
import { regions } from '../data/demoData'

export type HeatmapPoint = [number, number, number] // [lat, lng, intensity]

export interface HeatmapConfig {
  radius: number
  blur: number
  max: number
  minOpacity: number
  enabled: boolean
}

export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  radius: 28,
  blur: 18,
  max: 1.0,
  minOpacity: 0.35,
  enabled: true,
}

export const HEATMAP_GRADIENT = {
  0.2: '#00ff00', // Low Risk / Low Density (Green)
  0.5: '#ffff00', // Moderate Risk (Yellow)
  0.8: '#ff0000', // High / Critical Hazard (Red)
  1.0: '#b91c1c', // Severe Core (Dark Red)
}

/**
 * Deterministic pseudo-random generator for organic clustering
 */
function seededOffset(seed: number, index: number, scale: number): number {
  const x = Math.sin(seed * 997 + index * 1337) * 10000
  return (x - Math.floor(x) - 0.5) * scale
}

/**
 * Transforms discrete regional risk nodes and historical landslide catalogs
 * into continuous, weighted coordinates [lat, lon, intensity] with clustered secondary hotspots.
 */
export function generateLandslideHeatmapData({
  isDemoMode = false,
  activeScore = 50,
  selectedDistrict,
  includeHistorical = true,
}: {
  isDemoMode?: boolean
  activeScore?: number
  selectedDistrict?: string
  includeHistorical?: boolean
} = {}): HeatmapPoint[] {
  const points: HeatmapPoint[] = []

  // 1. Regional Risk Nodes (Current Situational Assessment)
  regions.forEach((item, rIdx) => {
    const isEpicenter = item.name === 'Churachandpur' && isDemoMode
    const currentRisk = isEpicenter ? 94 : item.name === selectedDistrict ? activeScore : item.risk

    // Scale intensity strictly from 0.1 to 1.0
    const baseIntensity = Math.max(0.15, Math.min(1.0, currentRisk / 100))

    // Real district coordinates or mapped fallback
    const coords = DISTRICT_COORDINATES[item.name] || {
      lat: 26.2 + (item.y - 50) * 0.12,
      lon: 92.94 + (item.x - 50) * 0.16,
    }

    // Core point
    points.push([coords.lat, coords.lon, baseIntensity])

    // Generate clustered secondary coordinates around high-risk zones
    if (baseIntensity >= 0.7 || isEpicenter) {
      // Dense organic cluster for critical hazard zones (12-16 surrounding micro-nodes)
      const clusterCount = isEpicenter ? 18 : 12
      const spreadScale = isEpicenter ? 0.08 : 0.05 // ~5-8km radius

      for (let i = 0; i < clusterCount; i++) {
        const dLat = seededOffset(rIdx + 11, i * 2, spreadScale)
        const dLon = seededOffset(rIdx + 43, i * 2 + 1, spreadScale)
        const distRatio = Math.sqrt(dLat * dLat + dLon * dLon) / (spreadScale * 0.5)
        // Taper intensity outward from core
        const subIntensity = Math.max(
          0.35,
          Math.min(1.0, baseIntensity * (1 - distRatio * 0.45))
        )
        points.push([coords.lat + dLat, coords.lon + dLon, Number(subIntensity.toFixed(2))])
      }
    } else if (baseIntensity >= 0.45) {
      // Moderate cluster (5-6 micro-nodes)
      const clusterCount = 6
      const spreadScale = 0.04
      for (let i = 0; i < clusterCount; i++) {
        const dLat = seededOffset(rIdx + 77, i * 3, spreadScale)
        const dLon = seededOffset(rIdx + 91, i * 3 + 1, spreadScale)
        const subIntensity = Math.max(0.2, baseIntensity * 0.8)
        points.push([coords.lat + dLat, coords.lon + dLon, Number(subIntensity.toFixed(2))])
      }
    } else {
      // Low risk nominal halo (2 micro-nodes)
      points.push([coords.lat + 0.015, coords.lon - 0.01, 0.2])
      points.push([coords.lat - 0.012, coords.lon + 0.015, 0.18])
    }
  })

  // 2. NASA GLC & Geological Survey of India (GSI) Historical Landslide Records
  if (includeHistorical && HISTORICAL_LANDSLIDES.length > 0) {
    HISTORICAL_LANDSLIDES.forEach((event, idx) => {
      let eventIntensity = 0.5
      let clusterCount = 3

      if (event.severity === 'CRITICAL') {
        eventIntensity = 0.95
        clusterCount = 8
      } else if (event.severity === 'HIGH') {
        eventIntensity = 0.75
        clusterCount = 5
      } else if (event.severity === 'MODERATE') {
        eventIntensity = 0.5
        clusterCount = 3
      } else {
        eventIntensity = 0.25
        clusterCount = 1
      }

      // If in demo mode and near Churachandpur (KM-42), amplify intensity
      if (isDemoMode && event.district === 'Churachandpur') {
        eventIntensity = 1.0
        clusterCount = 10
      }

      // Add historical origin point
      points.push([event.coordinates[0], event.coordinates[1], eventIntensity])

      // Clustered fault-line secondary coordinates
      for (let c = 0; c < clusterCount; c++) {
        const dLat = seededOffset(idx + 101, c, 0.025)
        const dLon = seededOffset(idx + 313, c + 1, 0.025)
        const subIntensity = Math.max(0.25, eventIntensity * 0.85)
        points.push([
          event.coordinates[0] + dLat,
          event.coordinates[1] + dLon,
          Number(subIntensity.toFixed(2)),
        ])
      }
    })
  }

  return points
}

/**
 * Creates and attaches an L.heatLayer instance to a given Leaflet map.
 */
export function attachHeatmapLayer(
  map: L.Map,
  points: HeatmapPoint[],
  config: Partial<HeatmapConfig> = {}
): L.Layer | null {
  if (!map || typeof (L as any).heatLayer !== 'function') {
    console.warn('Leaflet.heatLayer is not loaded on L object')
    return null
  }

  const merged = { ...DEFAULT_HEATMAP_CONFIG, ...config }

  try {
    const heatLayer = (L as any).heatLayer(points, {
      radius: merged.radius,
      blur: merged.blur,
      max: merged.max,
      minOpacity: merged.minOpacity,
      gradient: HEATMAP_GRADIENT,
    })

    heatLayer.addTo(map)
    return heatLayer
  } catch (err) {
    console.error('Failed to instantiate Leaflet heatLayer:', err)
    return null
  }
}
