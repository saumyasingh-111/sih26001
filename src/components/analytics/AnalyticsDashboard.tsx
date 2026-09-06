import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Cell,
  Legend,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { regions } from '../../data/demoData'

interface AnalyticsDashboardProps {
  notify?: (message: string, tone?: 'success' | 'error') => void
}

export function AnalyticsDashboard({ notify }: AnalyticsDashboardProps) {
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d'>('30d')

  // Correlation Dataset for 7d, 30d, 90d
  const correlationData = {
    '7d': [
      { name: 'Mon', rainfall: 28, risk: 42, threshold: 51 },
      { name: 'Tue', rainfall: 54, risk: 58, threshold: 51 },
      { name: 'Wed', rainfall: 18, risk: 46, threshold: 51 },
      { name: 'Thu', rainfall: 92, risk: 78, threshold: 51 },
      { name: 'Fri', rainfall: 114, risk: 86, threshold: 51 },
      { name: 'Sat', rainfall: 84, risk: 74, threshold: 51 },
      { name: 'Sun', rainfall: 128, risk: 91, threshold: 51 },
    ],
    '30d': [
      { name: 'Week 1', rainfall: 142, risk: 48, threshold: 51 },
      { name: 'Week 2', rainfall: 188, risk: 62, threshold: 51 },
      { name: 'Week 3', rainfall: 234, risk: 76, threshold: 51 },
      { name: 'Week 4', rainfall: 312, risk: 88, threshold: 51 },
    ],
    '90d': [
      { name: 'Jul W1', rainfall: 110, risk: 38, threshold: 51 },
      { name: 'Jul W3', rainfall: 145, risk: 46, threshold: 51 },
      { name: 'Aug W1', rainfall: 220, risk: 64, threshold: 51 },
      { name: 'Aug W3', rainfall: 295, risk: 78, threshold: 51 },
      { name: 'Sep W1', rainfall: 380, risk: 91, threshold: 51 },
    ],
  }[timeFilter]

  // District Risk Distribution Data
  const districtData = regions.map((r) => ({
    name: r.name,
    state: r.state,
    risk: r.risk,
    rain: parseInt(r.rain) || 40,
    soil: r.soil,
    color: r.risk >= 76 ? '#ef4444' : r.risk >= 51 ? '#f59e0b' : r.risk >= 31 ? '#eab308' : '#10b981',
  }))

  const exportReport = (format: 'CSV' | 'PDF') => {
    if (format === 'CSV') {
      const csvHeader = 'District,State,RiskScore,Rainfall,SoilSaturation\n'
      const csvRows = regions
        .map((r) => `"${r.name}","${r.state}",${r.risk},"${r.rain}",${r.soil}%`)
        .join('\n')
      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `sentinel-ner-analytics-${timeFilter}.csv`
      link.click()
      notify?.('Analytics dataset exported as CSV.', 'success')
    } else {
      notify?.('Generating executive BI analytics report (PDF)...', 'success')
      setTimeout(() => {
        const html = `<!DOCTYPE html><html><head><title>SENTINEL NER ANALYTICS REPORT</title><style>body{font-family:sans-serif;padding:30px;line-height:1.6;}h1{color:#065f46;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;}th{background:#f1f5f9;}</style></head><body><h1>SENTINEL NER · BI ANALYTICS & INSIGHTS REPORT</h1><p><strong>Generated:</strong> ${new Date().toLocaleString()}</p><p><strong>Active Window:</strong> ${timeFilter.toUpperCase()} Analysis</p><h3>District Risk Summary</h3><table><tr><th>District</th><th>State</th><th>Risk Score</th><th>Rainfall</th><th>Soil Saturation</th></tr>${regions.map(r => `<tr><td>${r.name}</td><td>${r.state}</td><td>${r.risk}%</td><td>${r.rain}</td><td>${r.soil}%</td></tr>`).join('')}</table></body></html>`
        const blob = new Blob([html], { type: 'text/html' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `sentinel-ner-analytics-report.html`
        link.click()
        notify?.('Executive report downloaded.', 'success')
      }, 500)
    }
  }

  return (
    <div className="analytics-page max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-700 uppercase">
            DECISION SUPPORT & BUSINESS INTELLIGENCE
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Multi-sensor hazard correlation, regional risk distributions, and automated operational findings.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['7d', '30d', '90d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeFilter === t
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Export Actions */}
          <button
            onClick={() => exportReport('CSV')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportReport('PDF')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards Row (4 Metric Cards with Micro Sparklines & Trends) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Critical Risk Zones */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Critical Risk Zones</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle size={15} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              03
            </div>
            <div className="flex items-center text-xs font-semibold text-rose-600 gap-0.5">
              <ArrowUpRight size={14} />
              <span>+12% vs last week</span>
            </div>
          </div>
          {/* Micro sparkline visual */}
          <div className="flex items-end gap-1 h-6 pt-1">
            {[30, 45, 40, 60, 55, 75, 90].map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-rose-400 rounded-xs"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
        </div>

        {/* KPI 2: Field Verified Reports */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Field Verified Reports</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              86%
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 gap-0.5">
              <ArrowUpRight size={14} />
              <span>+8% verification speed</span>
            </div>
          </div>
          {/* Micro sparkline visual */}
          <div className="flex items-end gap-1 h-6 pt-1">
            {[50, 60, 65, 70, 75, 80, 86].map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-emerald-400 rounded-xs"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
        </div>

        {/* KPI 3: Avg Response Time */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg Response Time</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock size={15} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              18m
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 gap-0.5">
              <ArrowDownRight size={14} />
              <span>-4m vs last week</span>
            </div>
          </div>
          {/* Micro sparkline visual */}
          <div className="flex items-end gap-1 h-6 pt-1">
            {[80, 75, 70, 60, 50, 40, 30].map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-400 rounded-xs"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
        </div>

        {/* KPI 4: Model Correlation Score */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Model Correlation Score</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles size={15} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold tracking-tight text-purple-700 font-mono">
              0.82
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 gap-0.5">
              <TrendingUp size={14} />
              <span>r = 0.82 (High)</span>
            </div>
          </div>
          {/* Micro sparkline visual */}
          <div className="flex items-end gap-1 h-6 pt-1">
            {[65, 68, 72, 75, 79, 81, 82].map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-purple-400 rounded-xs"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Grid (2-Column Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Interactive Risk & Rainfall Correlation Chart (7 Cols) */}
        <section className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-700 uppercase">
                COUPLED TELEMETRY CORRELATION
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Risk & Rainfall Correlation Chart
              </h2>
              <p className="text-xs text-slate-500">
                Multi-axis view showing precipitation volume (mm) against predicted hazard score (%).
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Rainfall (mm)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-rose-500 inline-block" /> Risk Score (%)
              </span>
            </div>
          </div>

          {/* Recharts Multi-Axis Container */}
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={correlationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#ef4444' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar yAxisId="left" dataKey="rainfall" name="Rainfall (mm)" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Line yAxisId="right" type="monotone" dataKey="risk" name="Risk Score (%)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} />
                <Line yAxisId="right" type="monotone" dataKey="threshold" name="Warning Threshold (51%)" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Statistical Confidence: <b>94.6%</b></span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Pearson Coefficient: r = 0.82
            </span>
          </div>
        </section>

        {/* Right Column: District Risk Distribution Bar Chart (5 Cols) */}
        <section className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-700 uppercase">
                GEOGRAPHIC TRIAGE
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                District Risk Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Comparative hazard ranking across 8 monitored North Eastern districts.
              </p>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs shadow-xl space-y-1">
                          <div className="font-bold">{data.name} ({data.state})</div>
                          <div className="text-rose-400 font-mono font-bold">Risk Score: {data.risk}%</div>
                          <div className="text-slate-300">Rainfall: {data.rain}mm</div>
                          <div className="text-slate-300">Soil Saturation: {data.soil}%</div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="risk" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {districtData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Hover bars for soil & rainfall breakdown</span>
            <span className="text-emerald-700 font-medium">8 Districts Total</span>
          </div>
        </section>
      </div>

      {/* Operational Insights & Recommendations Panel */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Lightbulb size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Operational Insights & AI Recommendations
              </h3>
              <p className="text-xs text-slate-500">
                Automated heuristic deductions generated by Sentinel's multi-sensor evaluation engine.
              </p>
            </div>
          </div>

          <button
            onClick={() => exportReport('PDF')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1.5"
          >
            <span>Export Executive Insights (PDF)</span>
            <Download size={13} />
          </button>
        </div>

        {/* Insights 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Rainfall Anomaly in Churachandpur</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Precipitation volume has exceeded historical baseline by 31%. Soil saturation is currently at 92%, making slope failure along arterial transit routes imminent without intervention.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              Priority: CRITICAL · Immediate inspection advised
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Field Verification Speeds Improved by 24%</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              District response officers verified 86% of voice and camera reports within 18 minutes of arrival, reducing warning verification lag across East Khasi Hills and Tawang.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              Performance: +8% over previous 30-day baseline
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Evacuation Corridor NH-102 Vulnerability</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Satellite radar interferometry detected 3.8cm surface subsidence along slope cut NH-102. Automated recommendation redirects heavy disaster vehicles to Route C.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              Safety Routing: Route C recommended (44m travel time)
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
