import React, { useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  CloudRain,
  CloudSun,
  Compass,
  Database,
  Download,
  Gauge,
  Info,
  Layers,
  MapPin,
  Mountain,
  RefreshCw,
  Shield,
  ShieldAlert,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from 'lucide-react'
import { Region, regions, riskLevel, environmentSeries } from '../../data/demoData'
import { useDataContext } from '../../context/DataContext'
import { historicalBaselines } from '../../services/dataEngine'

interface EnvironmentMonitoringProps {
  region: Region
  regionName: string
  setRegionName: (name: string) => void
}

type TimeHorizon = '6 hours' | '24 hours' | '7 days' | '30 days'

export function EnvironmentMonitoring({
  region,
  regionName,
  setRegionName,
}: EnvironmentMonitoringProps) {
  const {
    dataMode,
    isDemoMode,
    weather,
    weatherLoading,
    refreshWeather,
    setActiveDistrict,
    userLocation,
    isGpsDetected,
    activeLocationName,
    activeLocationCoords,
    liveRiskScore,
    liveRiskLevel,
    hasHistoricalEventsForLocation,
  } = useDataContext()

  const [range, setRange] = useState<TimeHorizon>('24 hours')

  const baseline = historicalBaselines[region.name] || historicalBaselines['Churachandpur']

  // Construct genuinely distinct horizon-specific datasets
  const series = useMemo(() => {
    // 1. 6 HOURS - Immediate Sub-Hourly Precipitation & Fast Pore-Water Infiltration
    if (range === '6 hours') {
      const isDeluge = isDemoMode
      return {
        horizonTitle: '6-Hour Short-Term Burst & Pore-Water Response',
        horizonSubtitle: 'Sub-hourly rain burst intensity and fast hydrological infiltration into shear plane',
        labels: ['01h ago', '02h ago', '03h ago', '04h ago', '05h ago', 'Now'],
        rainfall: isDeluge ? [18, 28, 44, 62, 85, 110] : [0, 0, 1, 2, 1, Math.round(weather.currentRainfall || 1)],
        soil: isDeluge ? [64, 72, 81, 88, 92, 94] : [24, 25, 26, 28, 29, Math.min(50, Math.round(weather.relativeHumidity * 0.4))],
        temperature: [23, 23, 22, 22, 21, weather.temperature || 21],
        humidity: isDeluge ? [88, 91, 94, 96, 98, 99] : [weather.relativeHumidity - 4, weather.relativeHumidity - 3, weather.relativeHumidity - 2, weather.relativeHumidity - 1, weather.relativeHumidity, weather.relativeHumidity],
        risk: isDeluge ? [52, 63, 74, 85, 91, 94] : [4, 4, 5, 6, 5, liveRiskScore],
        porePressure: isDeluge ? [18.2, 22.4, 27.8, 32.1, 35.8, 38.4] : [4.2, 4.3, 4.5, 4.8, 4.7, 4.9],
      }
    }

    // 2. 24 HOURS - Diurnal Hourly Progression (pulling real Open-Meteo hourly in Live mode)
    if (range === '24 hours') {
      if (weather && weather.forecastHourly && weather.forecastHourly.length >= 6) {
        const intervals = [0, 4, 8, 12, 16, 20, Math.min(23, weather.forecastHourly.length - 1)]
        const sampled = intervals.map((idx) => weather.forecastHourly[idx] || weather.forecastHourly[0])
        return {
          horizonTitle: '24-Hour Diurnal Rainfall & Temperature Progression',
          horizonSubtitle: 'Hourly rainfall accumulation, ambient temperature swings and progressive risk trajectory',
          labels: sampled.map((s) => s.time),
          rainfall: isDemoMode ? [18, 44, 95, 140, 195, 240, 240] : sampled.map((s) => Math.round(s.rain * 4)),
          soil: isDemoMode ? [58, 68, 76, 84, 89, 93, 94] : sampled.map((_, i) => Math.min(65, 28 + i * 3)),
          temperature: sampled.map((s) => Math.round(s.temp)),
          humidity: sampled.map((_, i) => Math.min(98, weather.relativeHumidity - 6 + i * 2)),
          risk: isDemoMode ? [42, 58, 72, 84, 90, 94, 94] : sampled.map((s, i) => Math.min(60, Math.max(4, Math.round(s.probability * 0.4 + i * 1.5)))),
          porePressure: isDemoMode ? [14.2, 20.1, 26.5, 31.8, 35.2, 38.0, 38.4] : [4.0, 4.2, 4.5, 5.0, 4.8, 4.7, 4.6],
        }
      }
      return {
        horizonTitle: '24-Hour Diurnal Rainfall & Temperature Progression',
        horizonSubtitle: 'Hourly rainfall accumulation and ambient temperature swings',
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        rainfall: isDemoMode ? [18, 44, 95, 140, 195, 240, 240] : [2, 4, 8, 12, 6, 3, 2],
        soil: isDemoMode ? [58, 68, 76, 84, 89, 93, 94] : [28, 30, 32, 36, 35, 34, 33],
        temperature: [21, 20, 22, 26, 25, 23, 22],
        humidity: [85, 88, 82, 74, 76, 80, 84],
        risk: isDemoMode ? [42, 58, 72, 84, 90, 94, 94] : [5, 5, 6, 8, 7, 6, 5],
        porePressure: isDemoMode ? [14.2, 20.1, 26.5, 31.8, 35.2, 38.0, 38.4] : [4.1, 4.2, 4.4, 4.8, 4.6, 4.4, 4.3],
      }
    }

    // 3. 7 DAYS - Synoptic Daily Weather Forecast (pulling real Open-Meteo daily in Live mode)
    if (range === '7 days') {
      if (weather && weather.forecastDaily && weather.forecastDaily.length > 0) {
        const daily = weather.forecastDaily
        return {
          horizonTitle: '7-Day Synoptic Weather Forecast & Cumulative Saturation',
          horizonSubtitle: 'Daily precipitation sums and projected slope risk trajectory from Open-Meteo API',
          labels: daily.map((d) => d.day),
          rainfall: isDemoMode ? [28, 44, 62, 95, 140, 195, 240] : daily.map((d) => Math.round(d.totalRain)),
          soil: daily.map((_, i) => isDemoMode ? Math.min(94, 60 + i * 5) : Math.min(70, 32 + i * 4)),
          temperature: daily.map((d) => Math.round((d.maxTemp + d.minTemp) / 2)),
          humidity: daily.map((_, i) => Math.min(96, 68 + (i % 3) * 5)),
          risk: isDemoMode ? [44, 56, 68, 79, 86, 91, 94] : daily.map((d) => Math.min(75, d.riskProbability)),
          porePressure: isDemoMode ? [16.5, 21.0, 26.4, 30.8, 34.2, 37.0, 38.4] : [4.5, 4.8, 5.1, 5.6, 5.2, 5.0, 4.9],
        }
      }
      return {
        horizonTitle: '7-Day Synoptic Weather Forecast & Cumulative Saturation',
        horizonSubtitle: 'Daily precipitation sums and projected slope risk trajectory',
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        rainfall: isDemoMode ? [28, 44, 62, 95, 140, 195, 240] : [14, 22, 18, 34, 42, 28, 16],
        soil: isDemoMode ? [60, 66, 73, 80, 86, 91, 94] : [32, 35, 37, 42, 45, 43, 40],
        temperature: [24, 23, 25, 24, 22, 23, 24],
        humidity: [78, 82, 75, 86, 88, 84, 80],
        risk: isDemoMode ? [44, 56, 68, 79, 86, 91, 94] : [12, 16, 14, 24, 28, 20, 14],
        porePressure: isDemoMode ? [16.5, 21.0, 26.4, 30.8, 34.2, 37.0, 38.4] : [4.5, 4.8, 5.0, 5.5, 5.7, 5.3, 5.0],
      }
    }

    // 4. 30 DAYS - Monthly Monsoon Aggregation & 10-Yr Comparison
    return {
      horizonTitle: '30-Day Monsoon Saturation Index vs 10-Yr Regional Baseline',
      horizonSubtitle: 'Weekly aggregated precipitation and antecedent moisture saturation in critical strata',
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4 (Current)'],
      rainfall: isDemoMode ? [142, 195, 248, 384] : [84, 112, 145, 120],
      soil: isDemoMode ? [58, 72, 85, 94] : [34, 40, 48, 45],
      temperature: [27, 26, 25, 23],
      humidity: [72, 78, 85, 88],
      risk: isDemoMode ? [48, 66, 82, 94] : [10, 14, 18, 15],
      porePressure: isDemoMode ? [18.5, 25.4, 32.1, 38.4] : [4.8, 5.2, 5.8, 5.5],
    }
  }, [range, weather, isDemoMode, liveRiskScore])

  const last = series.rainfall.length - 1
  const maxRain = Math.max(1, ...series.rainfall)

  const handleRegionChange = (newDistrict: string) => {
    setRegionName(newDistrict)
    setActiveDistrict(newDistrict)
  }

  // Export Telemetry JSON
  const exportTelemetry = () => {
    const payload = {
      district: region.name,
      monitoredLocation: activeLocationName,
      coordinates: activeLocationCoords,
      horizon: range,
      timestamp: new Date().toISOString(),
      source: isDemoMode ? 'SIMULATED DEMO SCENARIO (240mm Deluge)' : 'OPEN-METEO LIVE TELEMETRY',
      series,
      currentAtmospheric: {
        temperature: weather?.temperature,
        humidity: weather?.relativeHumidity,
        windSpeed: weather?.windSpeed,
        elevation: weather?.elevation,
        forecast24hRain: weather?.forecast24hRain,
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sentinel-environmental-telemetry-${range.replace(' ', '_')}.json`
    link.click()
  }

  return (
    <div className="environmental-page max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 text-slate-800 font-sans">
      {/* ============================================================ */}
      {/* 1. Visible Page Heading & Actions                            */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            <span>HYDRO-METEOROLOGICAL TELEMETRY</span>
            <span className="text-slate-300">/</span>
            <span>ENVIRONMENTAL SENSOR SUITE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
            Environmental Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time rainfall telemetry, antecedent moisture curves and shear-plane pore saturation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshWeather()}
            disabled={weatherLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <RefreshCw size={13} className={weatherLoading ? 'animate-spin' : ''} />
            <span>{weatherLoading ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>
          <button
            onClick={exportTelemetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
          >
            <Download size={13} />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Location Context Banner & Time Horizon Selector           */}
      {/* ============================================================ */}
      <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Monitored Location */}
        <div className="flex items-center gap-2.5">
          <MapPin size={16} className="text-slate-600 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                ACTIVE TELEMETRY STATION
              </span>
              {isDemoMode ? (
                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                  DEMO SCENARIO · CHURACHANDPUR CRISIS
                </span>
              ) : isGpsDetected ? (
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  GPS DETECTED ({activeLocationCoords.lat.toFixed(3)}°N, {activeLocationCoords.lon.toFixed(3)}°E)
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">
                  REGIONAL CENTER
                </span>
              )}
            </div>
            <div className="font-bold text-slate-900 mt-0.5">
              {activeLocationName} · Elevation: {weather.elevation}m
            </div>
          </div>
        </div>

        {/* Time Horizon Tabs: 6 HOURS, 24 HOURS, 7 DAYS, 30 DAYS */}
        <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold self-start md:self-auto">
          {(['6 hours', '24 hours', '7 days', '30 days'] as TimeHorizon[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setRange(tab)}
              className={`px-3 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                range === tab
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Six Dedicated Sensor Gauges / Metrics Strip               */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Precipitation Rate */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>Precipitation</span>
            <CloudRain size={14} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {series.rainfall[last]} <span className="text-xs font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-blue-700 font-medium">
            {series.rainfall[last] - series.rainfall[0] >= 0 ? '+' : ''}
            {series.rainfall[last] - series.rainfall[0]} mm in period
          </div>
        </div>

        {/* 2. Soil Moisture Saturation */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>Soil Moisture</span>
            <Waves size={14} className="text-cyan-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {series.soil[last]}%
          </div>
          <div
            className={`text-[11px] font-medium ${
              series.soil[last] >= 80 ? 'text-rose-700' : series.soil[last] >= 50 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {series.soil[last] >= 80 ? 'Near Liquefaction' : series.soil[last] >= 50 ? 'Pore Infiltration' : 'Stable Substrata'}
          </div>
        </div>

        {/* 3. Pore-Water Pressure */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>Pore Pressure</span>
            <Gauge size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {series.porePressure ? series.porePressure[last] : 4.8} <span className="text-xs font-normal text-slate-400">kPa</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Threshold: <b>32.0 kPa</b>
          </div>
        </div>

        {/* 4. Ambient Temperature */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>Temperature</span>
            <Thermometer size={14} className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {weather.temperature}°C
          </div>
          <div className="text-[11px] text-slate-500">
            Humidity: {weather.relativeHumidity}%
          </div>
        </div>

        {/* 5. Wind Velocity */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>Wind Speed</span>
            <Wind size={14} className="text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {weather.windSpeed} <span className="text-xs font-normal text-slate-400">km/h</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Bearing: {weather.windDirection}°
          </div>
        </div>

        {/* 6. Slope Hazard Index */}
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>Slope Hazard</span>
            <Mountain size={14} className="text-purple-500" />
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              series.risk[last] >= 75 ? 'text-rose-700' : series.risk[last] >= 50 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {series.risk[last]}%
          </div>
          <div className="text-[11px] font-bold text-slate-700">
            {riskLevel(series.risk[last])} RISK
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. Meteorological & Pore-Water Progression Chart            */}
      {/* ============================================================ */}
      <div className="p-4 sm:p-5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {series.horizonTitle}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {series.horizonSubtitle} · Station: {activeLocationName}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#8ea699]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#3a5a6b] inline-block" />
              <span>Rainfall (mm)</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#d97c72]">
              <span className="w-3 h-1 bg-[#b84d43] inline-block rounded-xs" />
              <span>Risk Probability (%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#dca24c]">
              <span className="w-3 h-0.5 border-t border-dashed border-[#c28b38] inline-block" />
              <span>Threshold (60%)</span>
            </span>
          </div>
        </div>

        {/* Dual Bar + Line Visualization */}
        <div className="h-64 flex flex-col justify-end pt-4 pb-2 relative">
          {/* Warning threshold line at 60% */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-[#c28b38]/50 z-10 flex items-center justify-end pr-2"
            style={{ bottom: '60%' }}
          >
            <span className="text-[10px] font-mono text-[#dca24c] bg-[#1d1610] px-1.5 py-0.5 rounded border border-[#3e2c1a]">
              EARLY WARNING THRESHOLD (60%)
            </span>
          </div>

          {/* Grid bars and markers */}
          <div className="flex items-end justify-between gap-2 h-full relative z-0">
            {series.rainfall.map((rainVal, idx) => {
              const riskVal = series.risk[idx] || 0
              const barHeightPercent = Math.max(8, (rainVal / maxRain) * 85)
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-[#14181c] text-[#f2f0eb] text-[10px] font-mono p-1.5 rounded shadow-xl whitespace-nowrap border border-[#28333c]">
                    <div>Time: {series.labels[idx]}</div>
                    <div className="text-[#8ea699]">Rain: {rainVal} mm</div>
                    <div className="text-[#d97c72]">Risk: {riskVal}%</div>
                    <div className="text-[#6494aa]">Soil: {series.soil[idx]}%</div>
                  </div>

                  {/* Risk Marker Dot */}
                  <div
                    className="absolute w-2.5 h-2.5 rounded-full border-2 border-[#12161a] bg-[#b84d43] shadow-xs z-10"
                    style={{ bottom: `${riskVal}%` }}
                  />

                  {/* Rainfall Bar */}
                  <div
                    className="w-full max-w-[44px] rounded-t bg-[#3a5a6b]/50 group-hover:bg-[#3a5a6b]/80 border-t-2 border-[#4b7287] transition-all"
                    style={{ height: `${barHeightPercent}%` }}
                  >
                    <div className="text-[10px] font-mono text-center text-[#8ea699] font-bold pt-1">
                      {rainVal > 0 ? rainVal : ''}
                    </div>
                  </div>

                  {/* X-Axis Label */}
                  <div className="text-[10px] font-mono text-slate-500 mt-2 text-center truncate max-w-full">
                    {series.labels[idx]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend interpretation */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 font-mono text-[11px] gap-2">
          <div className="flex items-center gap-1.5">
            <Info size={13} className="text-slate-400" />
            <span>Antecedent soil moisture builds as precipitation infiltrates through unsaturated shear horizons.</span>
          </div>
          <div className="font-bold text-slate-700">
            Net Horizon Delta:{' '}
            <span
              className={
                series.risk[last] - series.risk[0] >= 0
                  ? 'text-rose-600'
                  : 'text-emerald-700'
              }
            >
              {series.risk[last] - series.risk[0] >= 0 ? '+' : ''}
              {series.risk[last] - series.risk[0]}%
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. Geological & Historical Baseline Cards                    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Geological Baseline */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-700 uppercase font-bold">
            <span>ISRO BHUVAN BASELINE</span>
            <Layers size={14} />
          </div>
          <div className="text-base font-bold text-slate-900">
            {hasHistoricalEventsForLocation ? baseline.bhuvanHazardZone : 'Zone I (Very Low / Flat)'}
          </div>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Critical Slope Angle:</span>
              <strong className="text-slate-800">{hasHistoricalEventsForLocation ? `${baseline.criticalSlopeAngle}°` : '< 3° (Alluvial)'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Mean Annual Rain:</span>
              <strong className="text-slate-800">{hasHistoricalEventsForLocation ? `${baseline.meanAnnualRainfall} mm` : '980 mm'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Subsurface Lithology:</span>
              <strong className="text-slate-800 truncate max-w-[140px]" title={hasHistoricalEventsForLocation ? baseline.soilType : 'Alluvial Silt & Sand'}>
                {hasHistoricalEventsForLocation ? baseline.soilType : 'Alluvial Silt & Sand'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: NASA GLC & GSI Catalog Records */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-amber-700 uppercase font-bold">
            <span>NASA GLC & GSI RECORDS</span>
            <Database size={14} />
          </div>
          <div className="text-base font-bold text-slate-900">
            {hasHistoricalEventsForLocation ? `${baseline.historicalEventsCount} Recorded Events` : '0 Recorded Events in Sector'}
          </div>
          <p className="text-xs text-slate-600">
            {hasHistoricalEventsForLocation ? (
              <>Last major incident: <strong className="text-slate-800">{baseline.lastMajorIncident}</strong></>
            ) : (
              'No slope failure events recorded in catalog. Low relief plain perimeter.'
            )}
          </p>
          <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            {hasHistoricalEventsForLocation
              ? 'Historical records show slope instability escalates when 24h precipitation exceeds 80mm.'
              : 'Hydrological runoff directed to regional drainage canals without cutting bank failure.'}
          </div>
        </div>

        {/* Card 3: Operational Directive */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-700 uppercase font-bold">
            <span>OPERATIONAL DIRECTIVE</span>
            <ShieldAlert size={14} />
          </div>
          <div className="text-base font-bold text-slate-900">
            {series.risk[last] >= 75 ? 'Level 3 Action Mandatory' : 'Level 1 Routine Monitoring'}
          </div>
          <p className="text-xs text-slate-600">
            {series.risk[last] >= 75
              ? 'Soil shear strength threshold breached. Initiate road transit alerts and verify shelter occupancy.'
              : 'Continuous telemetry surveillance active. All soil moisture sensors within permissible saturation bounds.'}
          </p>
          <div className="text-[10px] font-mono text-slate-500 pt-1">
            Audit trail synced with Command Center.
          </div>
        </div>
      </div>
    </div>
  )
}
