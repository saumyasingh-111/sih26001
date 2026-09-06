export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED'

export type Region = { name: string; state: string; risk: number; rain: string; soil: number; slope: number; historical: number; satellite: number; visual: number; x: number; y: number }
export type Alert = { id: string; level: RiskLevel; title: string; location: string; risk: number; cause: string; status: AlertStatus; time: string }
export type FieldReport = { id: string; location: string; incident: string; severity: RiskLevel; timestamp: string; reporter: string; status: string; image?: string; description?: string; ai?: Detection[] }
export type Detection = { label: string; confidence: number; severity: RiskLevel }
export type EnvironmentSeries = { labels: string[]; rainfall: number[]; soil: number[]; temperature: number[]; humidity: number[]; risk: number[] }

export const regions: Region[] = [
  { name: 'Churachandpur', state: 'Manipur', risk: 91, rain: '128 mm', soil: 92, slope: 78, historical: 81, satellite: 73, visual: 88, x: 63, y: 55 },
  { name: 'East Khasi Hills', state: 'Meghalaya', risk: 74, rain: '96 mm', soil: 81, slope: 72, historical: 69, satellite: 64, visual: 52, x: 54, y: 48 },
  { name: 'Tawang', state: 'Arunachal Pradesh', risk: 58, rain: '72 mm', soil: 62, slope: 89, historical: 54, satellite: 46, visual: 32, x: 45, y: 27 },
  { name: 'Gangtok', state: 'Sikkim', risk: 42, rain: '48 mm', soil: 44, slope: 76, historical: 38, satellite: 34, visual: 18, x: 28, y: 43 },
  { name: 'Aizawl', state: 'Mizoram', risk: 34, rain: '32 mm', soil: 36, slope: 61, historical: 29, satellite: 26, visual: 12, x: 66, y: 72 },
  { name: 'Kohima', state: 'Nagaland', risk: 27, rain: '28 mm', soil: 31, slope: 65, historical: 24, satellite: 21, visual: 8, x: 75, y: 37 },
  { name: 'Dibrugarh', state: 'Assam', risk: 22, rain: '21 mm', soil: 26, slope: 34, historical: 18, satellite: 22, visual: 5, x: 38, y: 18 },
  { name: 'Agartala', state: 'Tripura', risk: 19, rain: '18 mm', soil: 22, slope: 28, historical: 17, satellite: 20, visual: 4, x: 72, y: 84 },
]

export const environmentSeries: Record<string, EnvironmentSeries> = {
  '6 hours': { labels: ['02:00','03:00','04:00','05:00','06:00','07:00'], rainfall: [4,8,12,19,27,34], soil: [48,50,53,56,59,62], temperature: [22,22,21,22,23,23], humidity: [79,81,83,85,87,88], risk: [42,45,49,53,57,59] },
  '24 hours': { labels: ['08:00 start','12:00','16:00','20:00','00:00','04:00','08:00 now'], rainfall: [8,14,19,31,44,61,72], soil: [39,43,47,52,57,60,62], temperature: [27,28,26,24,23,22,23], humidity: [68,71,75,79,84,87,88], risk: [35,38,41,46,51,56,59] },
  '7 days': { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], rainfall: [18,34,11,52,41,67,72], soil: [34,39,37,45,51,58,62], temperature: [26,27,28,25,24,23,23], humidity: [63,69,66,77,81,86,88], risk: [28,34,31,42,49,55,59] },
  '30 days': { labels: ['W1','W2','W3','W4'], rainfall: [146,188,231,284], soil: [38,44,53,62], temperature: [28,27,25,23], humidity: [65,72,81,88], risk: [31,39,48,59] },
}

export const detections: Detection[] = [
  { label: 'Ground crack', confidence: 93, severity: 'HIGH' },
  { label: 'Road blockage', confidence: 89, severity: 'CRITICAL' },
  { label: 'Debris', confidence: 95, severity: 'MODERATE' },
  { label: 'Slope failure', confidence: 84, severity: 'HIGH' },
]

export const initialAlerts: Alert[] = [
  { id: 'ALT-032', level: 'CRITICAL', title: 'Landslide risk escalation', location: 'Churachandpur, Manipur', risk: 91, cause: 'Heavy rainfall + saturated soil + visual evidence', status: 'NEW', time: '08 min ago' },
  { id: 'ALT-031', level: 'HIGH', title: 'Rainfall threshold exceeded', location: 'East Khasi Hills, Meghalaya', risk: 74, cause: '96 mm rainfall in the last 24 hours', status: 'ACKNOWLEDGED', time: '24 min ago' },
  { id: 'ALT-030', level: 'MODERATE', title: 'Field report awaiting review', location: 'Tawang, Arunachal Pradesh', risk: 58, cause: 'Slope crack reported by field officer', status: 'NEW', time: '41 min ago' },
]

export const initialReports: FieldReport[] = [
  { id: 'FR-028', location: 'Churachandpur', incident: 'Road blockage', severity: 'HIGH', timestamp: '05 Sep 2026, 08:56', reporter: 'R. Singh', status: 'Pending Sync', ai: detections.slice(1, 3) },
  { id: 'FR-027', location: 'NH-102', incident: 'Ground crack', severity: 'MODERATE', timestamp: '05 Sep 2026, 08:42', reporter: 'M. Devi', status: 'Verified', ai: detections.slice(0, 1) },
]

export const sourceNames = ['Rainfall', 'Soil Moisture', 'Terrain', 'Historical Landslides', 'Satellite Imagery', 'Field Reports', 'Computer Vision', 'Weather Forecast']

export function riskLevel(score: number): RiskLevel { return score >= 76 ? 'CRITICAL' : score >= 51 ? 'HIGH' : score >= 31 ? 'MODERATE' : 'LOW' }
export function calculateRisk(region: Region, enabled: Record<string, boolean>): number {
  const factors: [string, number, number][] = [['Rainfall', region.risk, 30], ['Soil Moisture', region.soil, 20], ['Terrain', region.slope, 15], ['Historical Landslides', region.historical, 15], ['Satellite Imagery', region.satellite, 10], ['Computer Vision', region.visual, 10]]
  const active = factors.filter(([name]) => enabled[name] !== false)
  const total = active.reduce((sum, [, value, weight]) => sum + value * weight, 0)
  const weights = active.reduce((sum, [, , weight]) => sum + weight, 0)
  return Math.round(total / weights)
}

export function saveState<T>(key: string, value: T) { localStorage.setItem(`sentinel:${key}`, JSON.stringify(value)) }
export function loadState<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(`sentinel:${key}`); return value ? JSON.parse(value) as T : fallback } catch { return fallback } }