// SENTINEL NER - Historical Landslide Data Service
import { HISTORICAL_LANDSLIDES, HistoricalLandslideEvent } from '../data/historicalLandslides'

export interface HistoricalFilterOptions {
  district?: string
  severity?: string
  trigger?: string
  startDate?: string
  endDate?: string
}

export function getHistoricalLandslides(options: HistoricalFilterOptions = {}): HistoricalLandslideEvent[] {
  return HISTORICAL_LANDSLIDES.filter((event) => {
    if (options.district && options.district !== 'ALL' && event.district !== options.district) {
      return false
    }
    if (options.severity && options.severity !== 'ALL' && event.severity !== options.severity) {
      return false
    }
    if (options.trigger && options.trigger !== 'ALL' && event.trigger !== options.trigger) {
      return false
    }
    if (options.startDate && event.date < options.startDate) {
      return false
    }
    if (options.endDate && event.date > options.endDate) {
      return false
    }
    return true
  })
}

export function getDistrictHistoricalSummary(districtName: string) {
  const events = HISTORICAL_LANDSLIDES.filter((e) => e.district === districtName)
  const totalEvents = events.length
  const totalFatalities = events.reduce((sum, e) => sum + e.fatalities, 0)
  const maxRainfall = events.reduce((max, e) => Math.max(max, e.rainfall24hMm), 0)

  // Primary trigger identification
  const triggerCounts: Record<string, number> = {}
  events.forEach((e) => {
    triggerCounts[e.trigger] = (triggerCounts[e.trigger] || 0) + 1
  })
  const primaryTrigger =
    Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Continuous Monsoon Rain'

  return {
    district: districtName,
    totalEvents,
    totalFatalities,
    maxRecorded24hRainfall: maxRainfall,
    primaryTrigger,
    events,
  }
}
