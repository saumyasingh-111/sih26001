import { Alert, Detection, FieldReport, Region, calculateRisk, riskLevel } from '../data/demoData'

export type ReportDraft = {
  incident: string
  severity: FieldReport['severity']
  location: string
  description: string
  reporter: string
  image?: string
  ai?: Detection[]
}

export type RiskAssessment = {
  score: number
  level: ReturnType<typeof riskLevel>
  confidence: number
  explanation: string
}

export function assessRegion(region: Region, sources: Record<string, boolean>): RiskAssessment {
  const score = calculateRisk(region, sources)
  const confidence = Math.min(96, 70 + Object.values(sources).filter(Boolean).length * 2)
  return {
    score,
    level: riskLevel(score),
    confidence,
    explanation: score >= 76
      ? 'Multiple environmental and visual signals exceed the prototype warning threshold.'
      : score >= 51
        ? 'Rainfall, soil saturation and terrain susceptibility are converging.'
        : 'Conditions remain monitorable, with no single signal dominating the assessment.',
  }
}

export function createFieldReport(draft: ReportDraft, existingCount: number): FieldReport {
  return {
    id: `SNR-${new Date().getFullYear()}-${String(existingCount + 483).padStart(5, '0')}`,
    location: draft.location,
    incident: draft.incident,
    severity: draft.severity,
    timestamp: new Date().toLocaleString(),
    reporter: draft.reporter,
    status: 'Pending Verification',
    image: draft.image,
    description: draft.description,
    ai: draft.ai,
  }
}

export function prioritiseAlert(alert: Alert, region?: Region): number {
  const exposure = region ? Math.max(1, Math.round((region.soil + region.slope) / 2)) : alert.risk
  const confidence = region ? Math.max(region.visual, region.satellite) : alert.risk
  return Math.round((alert.risk * exposure * confidence) / 10000)
}

export function buildSituationBrief(region: Region, score: number, alerts: Alert[], reports: FieldReport[]): string {
  const lines = [
    'SENTINEL NER | INCIDENT INTELLIGENCE BRIEF',
    `Generated: ${new Date().toLocaleString()}`,
    `Region: ${region.name}, ${region.state}`,
    `Prototype risk: ${score}% (${riskLevel(score)})`,
    `Rainfall: ${region.rain} | Soil saturation: ${region.soil}% | Slope: ${region.slope}%`,
    `Active alerts: ${alerts.filter(alert => alert.status !== 'RESOLVED').length}`,
    `Recent field reports: ${reports.length}`,
    '',
    'Recommended action: Field verification before operational escalation.',
    'Data boundary: prototype prediction and simulated intelligence feeds.',
  ]
  return lines.join('\n')
}
