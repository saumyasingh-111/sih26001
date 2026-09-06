import React, { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Compass,
  Crosshair,
  Download,
  Eye,
  EyeOff,
  Globe2,
  Layers3,
  MapPin,
  Sliders,
  Sparkles,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Incident, Region, regions, riskLevel } from '../../data/demoData'

interface GISWorkstationProps {
  region: Region
  score: number
  incident: Incident
  notify?: (message: string, tone?: 'success' | 'error') => void
}

type BasemapType = 'osm' | 'terrain' | 'satellite' | 'dark'

export function GISWorkstation({ region, score, incident, notify }: GISWorkstationProps) {
  // Collapsible accordion categories
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    environmental: true,
    infrastructure: true,
    field: true,
  })

  // Dynamic opacity values for layers (0 = disabled, 1-100 = opacity)
  const [layers, setLayers] = useState<Record<string, number>>({
    Rainfall: 85,
    'Soil Saturation': 75,
    Slope: 65,
    'Road Networks': 90,
    'Power Outages': 70,
    'Voice Reports': 95,
    'Team Locations': 80,
  })

  // Spatial Filter Controls
  const [dateRange, setDateRange] = useState('2026-09-05')
  const [elevationThreshold, setElevationThreshold] = useState(1800)
  const [riskFilter, setRiskFilter] = useState('All risks')

  // Basemap & Tool State
  const [currentBasemap, setCurrentBasemap] = useState<BasemapType>('osm')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: 26.2006,
    lng: 92.9376,
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
      color: 'text-emerald-700 dark:text-emerald-400',
      items: ['Rainfall', 'Soil Saturation', 'Slope'],
    },
    {
      id: 'infrastructure',
      title: 'Infrastructure',
      color: 'text-amber-700 dark:text-amber-400',
      items: ['Road Networks', 'Power Outages'],
    },
    {
      id: 'field',
      title: 'Field Intelligence',
      color: 'text-blue-700 dark:text-blue-400',
      items: ['Voice Reports', 'Team Locations'],
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
      name: 'Satellite View',
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

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([26.2, 92.94], 7)

    const initialBasemap = basemaps[currentBasemap]
    const tileLayer = L.tileLayer(initialBasemap.url, {
      maxZoom: 18,
      attribution: initialBasemap.attribution,
    }).addTo(map)
    tileLayerRef.current = tileLayer

    // Add zoom control in top left
    L.control.zoom({ position: 'topleft' }).addTo(map)

    const overlayGroup = L.layerGroup().addTo(map)
    overlayGroupRef.current = overlayGroup

    // Mouse move coordinate tracking
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4)),
      })
    })

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // Handle Basemap Switcher
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    const newConfig = basemaps[currentBasemap]
    const newTileLayer = L.tileLayer(newConfig.url, {
      maxZoom: 18,
      attribution: newConfig.attribution,
    }).addTo(map)
    tileLayerRef.current = newTileLayer
  }, [currentBasemap])

  // Update GIS Overlays
  useEffect(() => {
    const overlayGroup = overlayGroupRef.current
    if (!overlayGroup) return

    overlayGroup.clearLayers()

    // Overlay regions
    regions.forEach((item) => {
      const isSelected = item.name === region.name
      const currentRisk = isSelected ? score : item.risk

      // Filter check
      if (riskFilter === 'Critical only' && currentRisk < 76) return
      if (riskFilter === 'High and critical' && currentRisk < 51) return

      const rainfallOpacity = (layers['Rainfall'] || 0) / 100
      const soilOpacity = (layers['Soil Saturation'] || 0) / 100

      const color =
        currentRisk >= 76 ? '#ef4444' : currentRisk >= 51 ? '#f59e0b' : currentRisk >= 31 ? '#eab308' : '#10b981'

      if (rainfallOpacity > 0) {
        const circle = L.circle([26.2 + (item.y - 50) * 0.12, 92.94 + (item.x - 50) * 0.16], {
          radius: Math.max(9000, currentRisk * 400),
          color,
          fillColor: color,
          fillOpacity: rainfallOpacity * (isSelected ? 0.45 : 0.25),
          weight: isSelected ? 3 : 1.5,
        })

        circle.bindTooltip(
          `<div style="font-family:inherit;font-size:11px;padding:3px;">
            <strong>${item.name} (${item.state})</strong><br/>
            Risk: <b>${currentRisk}%</b> · Rain: ${item.rain}<br/>
            Soil Moisture: ${item.soil}% · Saturation: ${(soilOpacity * 100).toFixed(0)}%
          </div>`
        )

        circle.addTo(overlayGroup)
      }

      // Add marker pin for team locations if layer enabled
      if ((layers['Team Locations'] || 0) > 0) {
        const teamMarker = L.circleMarker([26.2 + (item.y - 50) * 0.12 + 0.05, 92.94 + (item.x - 50) * 0.16 - 0.05], {
          radius: 5,
          color: '#3b82f6',
          fillColor: '#60a5fa',
          fillOpacity: (layers['Team Locations'] / 100),
          weight: 2,
        })
        teamMarker.bindTooltip(`Field Team Station: ${item.name} Sector`, { direction: 'right' })
        teamMarker.addTo(overlayGroup)
      }
    })
  }, [layers, riskFilter, region.name, score])

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const exportData = (format: 'GeoJSON' | 'KML') => {
    const data = {
      type: 'FeatureCollection',
      name: `SENTINEL_NER_${region.name}_${format}`,
      incident: incident.id,
      timestamp: new Date().toISOString(),
      filters: { dateRange, elevationThreshold, riskFilter },
      layersActive: Object.entries(layers)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ layer: k, opacity: v })),
      features: regions.map((r) => ({
        type: 'Feature',
        properties: {
          name: r.name,
          state: r.state,
          risk: r.risk,
          rainfall: r.rain,
          soil: r.soil,
        },
        geometry: {
          type: 'Point',
          coordinates: [92.94 + (r.x - 50) * 0.16, 26.2 + (r.y - 50) * 0.12],
        },
      })),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: format === 'GeoJSON' ? 'application/geo+json' : 'application/vnd.google-earth.kml+xml',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sentinel-ner-${region.name.toLowerCase()}-spatial.${format.toLowerCase()}`
    link.click()
    notify?.(`${format} spatial data package exported.`, 'success')
  }

  const activeCount = Object.values(layers).filter((v) => v > 0).length

  return (
    <div className="gis-workstation-page max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-700 uppercase">
            GEOSPATIAL INTELLIGENCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
            GIS Spatial Workstation
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Multi-layer raster and vector terrain analysis with dynamic opacity control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {activeCount} Active Overlays
          </span>
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Datum: WGS84
          </span>
        </div>
      </div>

      {/* Main Split-View Workstation Container */}
      <div className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col lg:flex-row min-h-[720px] relative">
        {/* Left Control Panel (Fixed 300px Sidebar) */}
        <aside className="w-full lg:w-[320px] flex-shrink-0 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 space-y-5 overflow-y-auto max-h-[780px]">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              LAYER CONTROL & OPACITY
            </span>
            <h3 className="text-sm font-bold text-slate-800 mt-0.5">Active Thematic Layers</h3>
          </div>

          {/* Accordion Categories */}
          <div className="space-y-3">
            {categories.map((cat) => {
              const isOpen = openAccordions[cat.id]
              return (
                <div key={cat.id} className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(cat.id)}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className={cat.color}>{cat.title}</span>
                    <ChevronDown
                      size={15}
                      className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-3 pt-1 space-y-3 border-t border-slate-100 bg-slate-50/50">
                      {cat.items.map((name) => {
                        const opacity = layers[name] ?? 0
                        const isEnabled = opacity > 0
                        return (
                          <div key={name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={(e) =>
                                    setLayers((prev) => ({
                                      ...prev,
                                      [name]: e.target.checked ? 80 : 0,
                                    }))
                                  }
                                  className="rounded text-emerald-600 focus:ring-emerald-500/20"
                                />
                                <span>{name}</span>
                              </label>
                              <span className="font-mono text-[10px] font-semibold text-slate-500">
                                {opacity}%
                              </span>
                            </div>

                            {/* Dynamic Opacity Slider */}
                            <div className="flex items-center gap-2 pl-5">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={opacity}
                                onChange={(e) =>
                                  setLayers((prev) => ({
                                    ...prev,
                                    [name]: Number(e.target.value),
                                  }))
                                }
                                disabled={!isEnabled}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-30"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Spatial Filter Controls */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              SPATIAL FILTER CONTROLS
            </div>

            {/* Date Range Picker */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Observation Date</label>
              <input
                type="date"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Elevation Threshold */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-700 font-semibold">
                <span>Elevation Threshold</span>
                <span className="font-mono text-emerald-700">{elevationThreshold}m MSL</span>
              </div>
              <input
                type="range"
                min="0"
                max="4500"
                step="100"
                value={elevationThreshold}
                onChange={(e) => setElevationThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0m (Valleys)</span>
                <span>4500m (Peaks)</span>
              </div>
            </div>

            {/* Risk Score Filter */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Risk Score Filter</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option>All risks</option>
                <option>High and critical</option>
                <option>Critical only</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Map Area (Remaining Width) */}
        <div className="flex-1 relative flex flex-col min-h-[500px]">
          {/* Floating Map Control Tools (Top Right) */}
          <div className="absolute top-4 right-4 z-400 flex items-center gap-1.5 bg-white/95 p-1.5 rounded-xl border border-slate-200 shadow-lg backdrop-blur-xs">
            <button
              onClick={() => {
                setActiveTool(activeTool === 'measure' ? null : 'measure')
                notify?.('Measure tool active. Click two points on map to calculate Euclidean distance.')
              }}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                activeTool === 'measure' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Measure Tool"
            >
              <Crosshair size={16} />
            </button>

            <button
              onClick={() => {
                setActiveTool(activeTool === 'buffer' ? null : 'buffer')
                notify?.('Buffer radius tool: 5km hazard containment zone visualized.')
              }}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                activeTool === 'buffer' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Buffer Radius Tool"
            >
              <Compass size={16} />
            </button>

            <button
              onClick={() => {
                setActiveTool(activeTool === 'polygon' ? null : 'polygon')
                notify?.('Polygon area selection enabled.')
              }}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                activeTool === 'polygon' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Polygon Select"
            >
              <Layers3 size={16} />
            </button>

            {/* Basemap Switcher Dropdown */}
            <div className="h-5 w-px bg-slate-200 mx-0.5" />

            <div className="relative group">
              <button
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                title="Basemap Switcher"
              >
                <Globe2 size={16} className="text-emerald-600" />
                <span className="hidden sm:inline">{basemaps[currentBasemap].name}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 hidden group-hover:block z-50 text-xs">
                {(Object.keys(basemaps) as BasemapType[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setCurrentBasemap(key)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      currentBasemap === key ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {basemaps[key].name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Map Status on Top Left */}
          <div className="absolute top-4 left-14 z-400 pointer-events-none hidden sm:block">
            <div className="px-3 py-1.5 rounded-full bg-slate-900/85 text-slate-100 text-xs font-mono font-medium shadow-md backdrop-blur-xs border border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SPATIAL WORKSTATION · REAL-TIME NER</span>
            </div>
          </div>

          {/* Leaflet Host */}
          <div ref={mapContainerRef} className="w-full flex-1 min-h-[520px] z-0" />

          {/* Retractable Bottom Spatial Summary Panel */}
          <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md z-30 transition-all">
            {/* Toggle Bar */}
            <div
              onClick={() => setShelfExpanded(!shelfExpanded)}
              className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-700"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Spatial Summary & Coordinates</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {cursorCoords.lat}° N, {cursorCoords.lng}° E
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 hover:text-slate-700">
                <span className="text-[10px] font-mono uppercase">
                  {shelfExpanded ? 'Collapse' : 'Expand'}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${shelfExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {/* Shelf Contents */}
            {shelfExpanded && (
              <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Active Layer Legend */}
                <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 font-mono text-[11px] uppercase">
                    Active Legend:
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical Risk (&gt;75%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High Risk (51-75%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Field Team Station
                  </span>
                </div>

                {/* Spatial Export Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportData('GeoJSON')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Export GeoJSON</span>
                  </button>

                  <button
                    onClick={() => exportData('KML')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Export KML</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
