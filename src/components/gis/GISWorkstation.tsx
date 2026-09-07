import React, { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Download,
  Eye,
  EyeOff,
  Globe2,
  Layers3,
  LocateFixed,
  MapPin,
  Maximize2,
  RotateCcw,
  Ruler,
  ShieldAlert,
  Sliders,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Incident, Region, regions, riskLevel } from '../../data/demoData'
import { useDataContext } from '../../context/DataContext'
import { historicalBaselines } from '../../services/dataEngine'
import { HISTORICAL_LANDSLIDES } from '../../data/historicalLandslides'
import { DISTRICT_COORDINATES } from '../../services/weatherService'

interface GISWorkstationProps {
  region: Region
  score: number
  incident: Incident
  notify?: (message: string, tone?: 'success' | 'error') => void
}

type BasemapType = 'osm' | 'terrain' | 'satellite' | 'dark'

export function GISWorkstation({ region, score, incident, notify }: GISWorkstationProps) {
  const {
    dataMode,
    isDemoMode,
    weather,
    scenario,
    connectivityZones,
    historicalLandslides,
    userLocation,
    activeLocationCoords,
    isNER,
    activeLocationName,
    setMode,
  } = useDataContext()

  const historicalBaseline = historicalBaselines[region.name] || historicalBaselines['Churachandpur']
  const roadBlockages = scenario?.roadBlockages || []
  const floodInundationZones = scenario?.floodInundationZones || []
  const dispatchRoutes = scenario?.dispatchRoutes || []

  // Collapsible accordion categories
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    environmental: true,
    infrastructure: true,
    field: true,
  })

  // Dynamic opacity values for layers (0 = disabled, 1-100 = opacity)
  const [layers, setLayers] = useState<Record<string, number>>({
    'Historical Landslides (ISRO)': 85,
    'Forecast Rainfall (IMD)': 80,
    'Soil Saturation Index': 75,
    'Slope Vulnerability': 70,
    'Evacuation Routes': 90,
    'Power Grid': 60,
    'Emergency Shelters': 85,
    'Connectivity Zones': 80,
    'Road Blockages': 95,
    'Flood Inundation': 85,
    'Field Voice Transcripts': 90,
  })

  // Spatial Filter Controls
  const [dateRange, setDateRange] = useState('2026-09-05')
  const [elevationThreshold, setElevationThreshold] = useState(1800)
  const [riskFilter, setRiskFilter] = useState('All risks')
  const [bufferRadiusKm, setBufferRadiusKm] = useState<number>(5)

  // Basemap & Tool State
  const [currentBasemap, setCurrentBasemap] = useState<BasemapType>('osm')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: 24.333,
    lng: 93.674,
  })
  const [shelfExpanded, setShelfExpanded] = useState(true)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const overlayGroupRef = useRef<L.LayerGroup | null>(null)

  // Layer category definitions
  const categories = [
    {
      id: 'environmental',
      title: 'Environmental Data',
      color: 'text-[#8ea699]',
      items: [
        'Historical Landslides (ISRO)',
        'Forecast Rainfall (IMD)',
        'Soil Saturation Index',
        'Slope Vulnerability',
      ],
    },
    {
      id: 'infrastructure',
      title: 'Infrastructure',
      color: 'text-[#dca24c]',
      items: ['Evacuation Routes', 'Power Grid', 'Emergency Shelters', 'Connectivity Zones'],
    },
    {
      id: 'field',
      title: 'Field & Disaster Hazards',
      color: 'text-[#d97c72]',
      items: ['Road Blockages', 'Flood Inundation', 'Field Voice Transcripts'],
    },
  ]

  const basemaps: Record<BasemapType, { name: string; url: string; attribution: string }> = {
    osm: {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
    },
    terrain: {
      name: 'Terrain (USGS/Topo)',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap contributors',
    },
    satellite: {
      name: 'Satellite Imagery',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, Maxar, Earthstar Geographics',
    },
    dark: {
      name: 'Dark Vector',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO',
    },
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return

    const initialCenter: [number, number] = isDemoMode
      ? [24.33, 93.67]
      : [activeLocationCoords.lat, activeLocationCoords.lon]
    const initialZoom = isDemoMode ? 9 : 11

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(initialCenter, initialZoom)

    const initialBasemap = basemaps[currentBasemap]
    tileLayerRef.current = L.tileLayer(initialBasemap.url, {
      maxZoom: 18,
    }).addTo(map)

    const overlayGroup = L.layerGroup().addTo(map)
    overlayGroupRef.current = overlayGroup
    mapInstance.current = map

    // Track mouse coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4)),
      })
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // Auto-pan / flyTo when active coordinates or mode change
  useEffect(() => {
    if (!mapInstance.current) return
    const targetCenter: [number, number] = isDemoMode
      ? [24.33, 93.67]
      : [activeLocationCoords.lat, activeLocationCoords.lon]
    mapInstance.current.flyTo(targetCenter, isDemoMode ? 9 : 11, { duration: 1.2 })
  }, [activeLocationCoords.lat, activeLocationCoords.lon, isDemoMode])

  // Switch basemap layer dynamically
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !tileLayerRef.current) return

    map.removeLayer(tileLayerRef.current)
    const newBasemap = basemaps[currentBasemap]
    tileLayerRef.current = L.tileLayer(newBasemap.url, {
      maxZoom: 18,
    }).addTo(map)
  }, [currentBasemap])

  // Render Overlays according to opacity sliders and active data mode
  useEffect(() => {
    const overlayGroup = overlayGroupRef.current
    if (!overlayGroup) return

    overlayGroup.clearLayers()

    // 0. High-Visibility User GPS Beacon
    const userBeacon = L.circleMarker([activeLocationCoords.lat, activeLocationCoords.lon], {
      radius: 9,
      color: isDemoMode ? '#dc2626' : '#059669',
      fillColor: isDemoMode ? '#ef4444' : '#10b981',
      fillOpacity: 0.95,
      weight: 3,
    })

    const pulseRing = L.circle([activeLocationCoords.lat, activeLocationCoords.lon], {
      radius: isDemoMode ? 5000 : 2500,
      color: isDemoMode ? '#ef4444' : '#10b981',
      fillColor: isDemoMode ? '#ef4444' : '#10b981',
      fillOpacity: 0.15,
      weight: 1.5,
    })
    pulseRing.addTo(overlayGroup)

    userBeacon.bindTooltip(
      `<div style="font-family:inherit;font-size:11px;line-height:1.4;">
        <strong style="color:${isDemoMode ? '#dc2626' : '#059669'};">
          ${isDemoMode ? '⚡ DEMO SCENARIO EPICENTER' : '📍 YOU ARE HERE (GPS)'}
        </strong><br/>
        <b>${activeLocationName}</b><br/>
        Risk Status: <b>${isDemoMode ? '94% (CRITICAL)' : 'LOW / NOMINAL'}</b><br/>
        Lat: ${activeLocationCoords.lat}°N, Lon: ${activeLocationCoords.lon}°E
      </div>`,
      { direction: 'top', permanent: false }
    )
    userBeacon.addTo(overlayGroup)

    // 1. Regional Risk Nodes (Historical Landslides / Regional Centers) - Only active in Demo or when in NER
    if (layers['Historical Landslides (ISRO)'] > 0 && (isDemoMode || isNER)) {
      const opacity = layers['Historical Landslides (ISRO)'] / 100
      // Regional susceptibility circles
      regions.forEach((r) => {
        const isFocus = r.name === region.name
        const effectiveScore = isDemoMode && r.name === 'Churachandpur' ? 94 : isFocus ? score : r.risk
        const color =
          effectiveScore >= 76 ? '#ef4444' : effectiveScore >= 51 ? '#f59e0b' : '#10b981'

        const baseline = historicalBaselines[r.name] || historicalBaselines['Churachandpur']
        const circle = L.circle([26.2 + (r.y - 50) * 0.12, 92.94 + (r.x - 50) * 0.16], {
          radius: Math.max(7000, effectiveScore * 400),
          color,
          fillColor: color,
          fillOpacity: opacity * (isFocus ? 0.4 : 0.2),
          weight: isFocus ? 3 : 1,
        })
        circle.bindTooltip(
          `<div style="font-family:inherit;font-size:11px;">
            <strong>${r.name}</strong> (${r.state})<br/>
            ${effectiveScore}% Risk · Susceptibility: ${baseline.susceptibilityIndex}%<br/>
            ISRO Bhuvan: ${baseline.bhuvanHazardZone}
          </div>`,
          { direction: 'top' }
        )
        circle.addTo(overlayGroup)
      })

      // Verified Historical Landslide Records (NASA GLC & GSI)
      const eventsToPlot = historicalLandslides && historicalLandslides.length > 0 ? historicalLandslides : HISTORICAL_LANDSLIDES
      eventsToPlot.forEach((ev) => {
        const markerColor = ev.severity === 'CRITICAL' ? '#dc2626' : ev.severity === 'HIGH' ? '#ea580c' : '#d97706'
        const marker = L.circleMarker(ev.coordinates, {
          radius: ev.severity === 'CRITICAL' ? 7 : 5,
          color: '#ffffff',
          fillColor: markerColor,
          fillOpacity: opacity * 0.9,
          weight: 1.5,
        })
        marker.bindTooltip(
          `<div style="font-family:inherit;font-size:11px;max-width:240px;">
            <span style="display:inline-block;padding:1px 5px;border-radius:3px;background:${markerColor};color:white;font-size:9px;font-weight:bold;">${ev.severity} LANDSLIDE</span>
            <div style="font-weight:bold;margin-top:2px;">${ev.location}</div>
            <div style="color:#64748b;font-size:10px;">${ev.date} · ${ev.trigger}</div>
            <div style="margin-top:2px;">24h Rain: <strong>${ev.rainfall24hMm} mm</strong> · Fatalities: ${ev.fatalities}</div>
            <div style="font-size:10px;color:#059669;margin-top:1px;">${ev.source}</div>
          </div>`,
          { direction: 'top' }
        )
        marker.addTo(overlayGroup)
      })
    }

    // 2. Buffer Radius Selector Tool
    if (activeTool === 'buffer') {
      const bufferCircle = L.circle([cursorCoords.lat, cursorCoords.lng], {
        radius: bufferRadiusKm * 1000,
        color: '#6366f1',
        fillColor: '#818cf8',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '5,5',
      })
      bufferCircle.bindTooltip(
        `<div style="font-family:inherit;font-size:11px;">
          <strong>Buffer Analysis: ${bufferRadiusKm} km</strong><br/>
          Area: ${(Math.PI * bufferRadiusKm * bufferRadiusKm).toFixed(1)} sq km
        </div>`,
        { direction: 'top' }
      )
      bufferCircle.addTo(overlayGroup)
    }

    // 3. Flood Inundation Zones (in demo mode or layer enabled)
    if (layers['Flood Inundation'] > 0 && isDemoMode) {
      const opacity = layers['Flood Inundation'] / 100
      floodInundationZones.forEach((zone: any) => {
        const floodCircle = L.circle(zone.centerCoords, {
          radius: zone.radiusMeters,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: opacity * 0.45,
          weight: 2,
        })
        floodCircle.bindTooltip(
          `<div style="font-family:inherit;font-size:11px;">
            <strong style="color:#1d4ed8;">🌊 ${zone.zoneName}</strong><br/>
            Depth: ${zone.floodDepthEst} | Pop: ${zone.affectedPopulationEst.toLocaleString()}<br/>
            Status: ${zone.status}
          </div>`,
          { direction: 'top' }
        )
        floodCircle.addTo(overlayGroup)
      })
    }

    // 4. Road Blockage Markers
    if (layers['Road Blockages'] > 0 && isDemoMode) {
      roadBlockages.forEach((blockage: any) => {
        const marker = L.circleMarker(blockage.coordinates, {
          radius: 9,
          color: '#991b1b',
          fillColor: '#ef4444',
          fillOpacity: 0.95,
          weight: 2,
        })
        marker.bindTooltip(
          `<div style="font-family:inherit;font-size:11px;">
            <strong style="color:#b91c1c;">⛔ ${blockage.route}</strong><br/>
            Location: ${blockage.location}<br/>
            Cause: ${blockage.cause}<br/>
            Clearance ETA: ${blockage.clearingTimeEst}
          </div>`,
          { direction: 'top' }
        )
        marker.addTo(overlayGroup)
      })
    }

    // 5. Evacuation Routes
    if (layers['Evacuation Routes'] > 0 && isDemoMode) {
      dispatchRoutes.forEach((route: any) => {
        const line = L.polyline(route.coordinates, {
          color: '#10b981',
          weight: 4,
          opacity: (layers['Evacuation Routes'] / 100) * 0.9,
          dashArray: '6, 6',
        })
        line.bindTooltip(
          `<div style="font-family:inherit;font-size:11px;">
            <strong style="color:#059669;">🚑 ${route.name}</strong><br/>
            Status: ${route.status} · ETA: ${route.transitTimeMin}m
          </div>`,
          { direction: 'top' }
        )
        line.addTo(overlayGroup)
      })
    }

    // 6. Connectivity & Blackout Zones
    if (layers['Connectivity Zones'] > 0 && connectivityZones) {
      const opacity = layers['Connectivity Zones'] / 100
      connectivityZones.forEach((cz) => {
        const geo = DISTRICT_COORDINATES[cz.district]
        if (!geo) return
        const isBlackout = cz.status === 'NO CONNECTIVITY'
        const isWeak = cz.status === 'WEAK'
        const color = isBlackout ? '#9333ea' : isWeak ? '#d97706' : '#10b981'
        const circle = L.circle([geo.lat, geo.lon], {
          radius: 11000,
          color,
          fillColor: color,
          fillOpacity: opacity * (isBlackout ? 0.35 : 0.15),
          weight: 2,
          dashArray: isBlackout ? '4,4' : undefined,
        })
        circle.bindTooltip(
          `<div style="font-family:inherit;font-size:11px;">
            <strong>📶 ${cz.district} Telemetry Comms</strong><br/>
            Status: <b style="color:${color}">${cz.status}</b> (${cz.signalStrengthPercent}%)<br/>
            Tower: ${cz.primaryTower}<br/>
            Backup: ${cz.backupRadioChannel}
          </div>`,
          { direction: 'top' }
        )
        circle.addTo(overlayGroup)
      })
    }
  }, [
    layers,
    currentBasemap,
    activeTool,
    bufferRadiusKm,
    cursorCoords,
    region,
    score,
    isDemoMode,
    historicalBaseline,
    floodInundationZones,
    roadBlockages,
    dispatchRoutes,
    connectivityZones,
    historicalLandslides,
  ])

  // Toggle Accordion Category
  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Toggle Layer Visibility
  const toggleLayerVisibility = (layerName: string) => {
    setLayers((prev) => ({
      ...prev,
      [layerName]: prev[layerName] > 0 ? 0 : 80,
    }))
  }

  // Update Layer Opacity Slider
  const updateLayerOpacity = (layerName: string, value: number) => {
    setLayers((prev) => ({ ...prev, [layerName]: value }))
  }

  // Export GeoJSON Dataset
  const exportGeoJSON = () => {
    const geojsonData = {
      type: 'FeatureCollection',
      name: `SENTINEL_NER_${region.name}_SPATIAL_INTELLIGENCE`,
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      features: regions.map((r) => ({
        type: 'Feature',
        properties: {
          name: r.name,
          state: r.state,
          risk: r.name === 'Churachandpur' && isDemoMode ? 94 : r.risk,
          soil: r.soil,
          slope: r.slope,
          rainfall: r.rain,
        },
        geometry: {
          type: 'Point',
          coordinates: [92.94 + (r.x - 50) * 0.16, 26.2 + (r.y - 50) * 0.12],
        },
      })),
    }

    const blob = new Blob([JSON.stringify(geojsonData, null, 2)], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sentinel-ner-${region.name.toLowerCase()}-spatial.geojson`
    link.click()
    notify?.('GeoJSON spatial dataset exported successfully.', 'success')
  }

  // Export Spatial Report
  const exportSpatialReport = () => {
    notify?.('Compiling comprehensive spatial intelligence report...', 'success')
    setTimeout(() => {
      const html = `<!DOCTYPE html><html><head><title>SENTINEL NER SPATIAL REPORT</title><style>body{font-family:sans-serif;padding:30px;}h1{color:#065f46;}</style></head><body><h1>SENTINEL NER · GEOSPATIAL INTELLIGENCE REPORT</h1><p><strong>District:</strong> ${region.name}, ${region.state}</p><p><strong>Mode:</strong> ${isDemoMode ? 'DEMO SCENARIO MODE (240mm Deluge)' : 'LIVE DATA MODE'}</p><p><strong>ISRO Bhuvan Zone:</strong> ${historicalBaseline.bhuvanHazardZone}</p><p><strong>Active Coordinate:</strong> EPSG:4326 [${cursorCoords.lat}, ${cursorCoords.lng}]</p></body></html>`
      const blob = new Blob([html], { type: 'text/html' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `sentinel-spatial-report-${region.name.toLowerCase()}.html`
      link.click()
      notify?.('Spatial intelligence report exported.', 'success')
    }, 400)
  }

  return (
    <div className="gis-workstation flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0e1215] text-stone-100">
      {/* Workstation Top Bar */}
      <div className="h-12 border-b border-[#222930] bg-[#0e1215] px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#8ea699]">
            <Layers3 size={15} />
            <span>GIS WORKSPACE / SPATIAL ANALYZER</span>
          </span>
          <span className="text-[#323d47]">|</span>
          <span className="text-xs text-stone-400 font-mono">
            {region.name}, {region.state}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isDemoMode ? 'bg-[#2c2014] text-[#dca24c] border border-[#48331e] animate-pulse' : 'bg-[#192720] text-[#7eb396] border border-[#294235]'
            }`}
          >
            {isDemoMode ? '⚡ DEMO HAZARDS ACTIVE' : '● LIVE GIS FEEDS'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Basemap Switcher Selector */}
          <div className="flex items-center bg-[#12161a] rounded-lg p-0.5 border border-[#222a32] text-[11px] font-mono">
            {(['osm', 'terrain', 'satellite', 'dark'] as BasemapType[]).map((type) => (
              <button
                key={type}
                onClick={() => setCurrentBasemap(type)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  currentBasemap === type
                    ? 'bg-[#1e2e26] text-[#8ea699] border border-[#2f493c] font-bold'
                    : 'text-stone-400 hover:text-stone-100'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={exportGeoJSON}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1e2e26] hover:bg-[#253930] text-stone-200 border border-[#2f493c] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Main Split View Workstation Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Control Panel: 300px Fixed Sidebar */}
        <aside className="w-[300px] flex-shrink-0 bg-[#101417] border-r border-[#222930] flex flex-col h-full z-20 overflow-y-auto">
          {/* Spatial Filters Section */}
          <div className="p-4 border-b border-[#222930] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#8ea699] uppercase">
              <span className="flex items-center gap-1.5">
                <Sliders size={13} />
                <span>Spatial Filters</span>
              </span>
              <span className="text-stone-400 text-[10px]">REAL-TIME</span>
            </div>

            {/* Date Slider */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-300 text-[11px] font-mono">
                <span>Date Baseline:</span>
                <span className="text-[#8ea699] font-bold">{dateRange}</span>
              </div>
              <input
                type="date"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-2 py-1 rounded bg-[#14181c] border border-[#252f38] text-xs text-stone-200 focus:ring-1 focus:ring-[#457c63]"
              />
            </div>

            {/* Elevation Filter */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-300 text-[11px] font-mono">
                <span>Elevation Cutoff:</span>
                <span className="text-[#dca24c] font-bold">&gt; {elevationThreshold}m</span>
              </div>
              <input
                type="range"
                min={500}
                max={4000}
                step={100}
                value={elevationThreshold}
                onChange={(e) => setElevationThreshold(Number(e.target.value))}
                className="w-full accent-[#457c63] cursor-pointer"
              />
            </div>

            {/* Risk Severity Threshold */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-300 text-[11px] font-mono">
                <span>Risk Severity:</span>
                <span className="text-[#d97c72] font-bold">{riskFilter}</span>
              </div>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full px-2 py-1 rounded bg-[#14181c] border border-[#252f38] text-xs text-stone-200 focus:ring-1 focus:ring-[#457c63]"
              >
                <option value="All risks">All Risk Levels</option>
                <option value="Critical only">Critical Only (≥76%)</option>
                <option value="High and above">High & Above (≥51%)</option>
                <option value="Moderate and above">Moderate & Above (≥31%)</option>
              </select>
            </div>
          </div>

          {/* Layer Categories: Collapsible Accordion Sections */}
          <div className="p-4 space-y-4 flex-1">
            <div className="text-xs font-mono font-semibold text-stone-400 uppercase tracking-wider">
              Layer Hierarchy & Opacity
            </div>

            {categories.map((category) => {
              const isOpen = openAccordions[category.id]
              return (
                <div key={category.id} className="border border-[#222930] rounded-xl overflow-hidden bg-[#14181c]/60">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleAccordion(category.id)}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold hover:bg-[#182026] transition-colors cursor-pointer"
                  >
                    <span className={category.color}>{category.title}</span>
                    {isOpen ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                  </button>

                  {/* Accordion Items & Opacity Sliders */}
                  {isOpen && (
                    <div className="p-3 space-y-3 border-t border-[#222930] bg-[#101417]">
                      {category.items.map((item) => {
                        const opacity = layers[item] || 0
                        const isVisible = opacity > 0

                        return (
                          <div key={item} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-300 font-medium truncate pr-2">
                                {item}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-slate-400">
                                  {opacity}%
                                </span>
                                <button
                                  onClick={() => toggleLayerVisibility(item)}
                                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                  title={isVisible ? 'Hide layer' : 'Show layer'}
                                >
                                  {isVisible ? <Eye size={13} className="text-emerald-400" /> : <EyeOff size={13} />}
                                </button>
                              </div>
                            </div>

                            {/* 0-100% Dynamic Opacity Slider */}
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={opacity}
                              onChange={(e) => updateLayerOpacity(item, Number(e.target.value))}
                              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
            <span>Projection: EPSG:4326</span>
            <div className="text-slate-400">North Eastern Regional Datum</div>
          </div>
        </aside>

        {/* Map Area: Remaining Width */}
        <main className="flex-1 relative h-full">
          {/* Floating Spatial Utility Tools Palette */}
          <div className="absolute top-4 right-4 z-400 flex flex-col gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md">
            <button
              onClick={() => {
                if (mapInstance.current) {
                  mapInstance.current.flyTo(
                    [activeLocationCoords.lat, activeLocationCoords.lon],
                    12,
                    { duration: 1.2 }
                  )
                  notify?.(
                    `Centering GPS on ${activeLocationName} (${activeLocationCoords.lat.toFixed(2)}°N, ${activeLocationCoords.lon.toFixed(2)}°E)`
                  )
                }
              }}
              className="p-2 rounded-lg transition-colors cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
              title="Locate Current Position (GPS)"
            >
              <LocateFixed size={16} />
            </button>

            <button
              onClick={() => {
                const next = activeTool === 'measure' ? null : 'measure'
                setActiveTool(next)
                notify?.(next ? 'Measurement Tool Activated. Click points on map.' : 'Measure tool deactivated.')
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'measure'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Measure Tool (Distance / Slope)"
            >
              <Ruler size={16} />
            </button>

            <button
              onClick={() => {
                const next = activeTool === 'buffer' ? null : 'buffer'
                setActiveTool(next)
                notify?.(next ? 'Buffer Radius Selector Active. Showing buffer ring.' : 'Buffer selector closed.')
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'buffer'
                  ? 'bg-indigo-500 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Buffer Radius Selector"
            >
              <Compass size={16} />
            </button>

            <button
              onClick={() => {
                const next = activeTool === 'polygon' ? null : 'polygon'
                setActiveTool(next)
                notify?.(next ? 'Polygon Area Select Enabled. Drag to select region.' : 'Polygon tool deactivated.')
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'polygon'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Polygon Area Select"
            >
              <Crosshair size={16} />
            </button>
          </div>

          {/* Buffer Radius Control Popover when buffer tool active */}
          {activeTool === 'buffer' && (
            <div className="absolute top-4 right-16 z-400 bg-[#12161a]/95 border border-[#2d3a46] p-3 rounded-xl shadow-2xl text-xs space-y-2 font-mono">
              <div className="text-stone-200 font-bold flex items-center justify-between">
                <span>BUFFER RADIUS</span>
                <span className="text-[#8ea699]">{bufferRadiusKm} KM</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 3, 5, 10, 20].map((km) => (
                  <button
                    key={km}
                    onClick={() => setBufferRadiusKm(km)}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      bufferRadiusKm === km
                        ? 'bg-[#1e2e26] text-[#8ea699] border border-[#2f493c]'
                        : 'bg-[#161c22] text-stone-300 hover:bg-[#1a2229] border border-[#222a32]'
                    }`}
                  >
                    {km}km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Outside NER Notice Card (Live Mode) */}
          {!isDemoMode && !isNER && (
            <div className="absolute top-4 left-4 z-400 max-w-md bg-[#12161a]/95 border border-[#48331e] rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#2c2014] text-[#dca24c] mt-0.5 border border-[#48331e]">
                  <MapPin size={16} />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-[#dca24c] flex items-center justify-between">
                    <span>LIVE GPS: OUTSIDE NER COVERAGE</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2c2014] text-[#dca24c] font-mono font-bold border border-[#48331e]">
                      ALLUVIAL PLAIN
                    </span>
                  </div>
                  <p className="text-stone-300 mt-1 leading-relaxed text-[11px]">
                    Current position is <strong>{activeLocationName}</strong> ({activeLocationCoords.lat.toFixed(2)}°N, {activeLocationCoords.lon.toFixed(2)}°E). Terrain slope is nominal (&lt;3°) with zero landslide risk.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => {
                        mapInstance.current?.flyTo([25.2, 93.2], 8, { duration: 1.5 })
                        notify?.('Panned map viewport to North Eastern Region (NER)')
                      }}
                      className="px-2.5 py-1 rounded bg-[#182026] hover:bg-[#202b33] text-stone-200 text-[10px] font-medium border border-[#2b3742] transition cursor-pointer"
                    >
                      Fly to NER Zone
                    </button>
                    <button
                      onClick={() => setMode('demo')}
                      className="px-2.5 py-1 rounded bg-[#2c2014] hover:bg-[#382a1b] text-[#dca24c] border border-[#48331e] text-[10px] font-bold transition cursor-pointer"
                    >
                      Launch NER Crisis Demo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaflet Map Host */}
          <div ref={mapContainerRef} className="w-full h-full bg-[#0e1215]" />

          {/* Bottom Retractable Spatial Summary Panel */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-400 bg-[#0e1215]/95 border-t border-[#222930] transition-all duration-300 backdrop-blur-md ${
              shelfExpanded ? 'h-36' : 'h-10'
            }`}
          >
            {/* Shelf Toggle Bar */}
            <div className="h-10 px-4 flex items-center justify-between border-b border-[#222930] text-xs font-mono text-stone-400">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShelfExpanded(!shelfExpanded)}
                  className="flex items-center gap-1.5 font-bold text-[#8ea699] hover:text-[#a5c2b2] cursor-pointer"
                >
                  {shelfExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  <span>SPATIAL SUMMARY SHELF</span>
                </button>
                <span>|</span>
                <span className="text-stone-300">
                  LAT: <b>{cursorCoords.lat}°N</b> LNG: <b>{cursorCoords.lng}°E</b>
                </span>
                <span className="hidden md:inline text-stone-500">ZOOM: 7x · EPSG:4326</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={exportSpatialReport}
                  className="flex items-center gap-1 text-[#8ea699] hover:text-[#a5c2b2] cursor-pointer"
                >
                  <Download size={12} />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Shelf Content */}
            {shelfExpanded && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <div className="text-slate-400 text-[10px]">HISTORICAL BHUVAN ZONE</div>
                  <div className="font-bold text-amber-400">
                    {historicalBaseline.bhuvanHazardZone}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Susceptibility: {historicalBaseline.susceptibilityIndex}%
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400 text-[10px]">SOIL & TOPOGRAPHY</div>
                  <div className="font-bold text-slate-200">
                    {historicalBaseline.soilType}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Critical Slope: {historicalBaseline.criticalSlopeAngle}°
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400 text-[10px]">ACTIVE SCENARIO HAZARDS</div>
                  <div className="font-bold text-rose-400">
                    {isDemoMode ? '3 Road Cuts · 2 Flood Zones' : 'Nominal Infrastructure'}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    {isDemoMode ? 'KM-42 NH-102B Compromised' : 'No active blockages'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400 text-[10px]">ATMOSPHERIC TELEMETRY</div>
                  <div className="font-bold text-emerald-400">
                    {weather?.relativeHumidity || 78}% Rel Humidity
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Rain: {weather?.currentRainfall || 0} mm · Wind: {weather?.windSpeed || 12} km/h
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
