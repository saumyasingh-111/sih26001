// SENTINEL NER - Historical Landslide Dataset
// Curated from NASA Global Landslide Catalog (GLC) & Geological Survey of India (GSI)
// Covers verifiable landslide events across the North Eastern Region of India

export interface HistoricalLandslideEvent {
  id: string
  date: string
  location: string
  district: string
  state: string
  coordinates: [number, number] // [lat, lon]
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  trigger: 'Continuous Monsoon Rain' | 'Cloudburst Deluge' | 'Tropical Depression' | 'Slope Cut Excavation + Rain'
  rainfall24hMm: number
  fatalities: number
  infrastructureImpact: string
  source: 'NASA Global Landslide Catalog (GLC)' | 'Geological Survey of India (GSI)' | 'NESDR Archives'
}

export const HISTORICAL_LANDSLIDES: HistoricalLandslideEvent[] = [
  {
    id: 'NASA-GLC-NER-2024-08',
    date: '2024-08-14',
    location: 'KM-42 National Highway 102B Cutting, Churachandpur',
    district: 'Churachandpur',
    state: 'Manipur',
    coordinates: [24.352, 93.688],
    severity: 'CRITICAL',
    trigger: 'Continuous Monsoon Rain',
    rainfall24hMm: 164.2,
    fatalities: 3,
    infrastructureImpact: 'Highway blocked for 5 days; secondary bridge damaged by mudflow surge',
    source: 'NASA Global Landslide Catalog (GLC)',
  },
  {
    id: 'GSI-MEGH-2023-07',
    date: '2023-07-22',
    location: 'Sohra-Shella Escarpment Edge, East Khasi Hills',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    coordinates: [25.285, 91.732],
    severity: 'CRITICAL',
    trigger: 'Cloudburst Deluge',
    rainfall24hMm: 312.0,
    fatalities: 2,
    infrastructureImpact: '180m rotational slip; 4 village access tracks severed',
    source: 'Geological Survey of India (GSI)',
  },
  {
    id: 'NASA-GLC-NER-2022-05',
    date: '2022-05-18',
    location: 'New Haflong Railway Station Cutting, Dima Hasao',
    district: 'Dima Hasao',
    state: 'Assam',
    coordinates: [25.176, 93.024],
    severity: 'CRITICAL',
    trigger: 'Continuous Monsoon Rain',
    rainfall24hMm: 245.5,
    fatalities: 4,
    infrastructureImpact: 'Lumding-Badarpur railway tracks submerged in debris; station platform crushed',
    source: 'NASA Global Landslide Catalog (GLC)',
  },
  {
    id: 'NESDR-SIKK-2023-10',
    date: '2023-10-04',
    location: 'Lachen-Chungthang Valley Highway, North Sikkim',
    district: 'Gangtok',
    state: 'Sikkim',
    coordinates: [27.602, 88.645],
    severity: 'CRITICAL',
    trigger: 'Cloudburst Deluge',
    rainfall24hMm: 198.0,
    fatalities: 14,
    infrastructureImpact: 'Teesta basin flash-flood induced 12 major slope toe failures',
    source: 'NESDR Archives',
  },
  {
    id: 'NASA-GLC-NER-2023-08',
    date: '2023-08-28',
    location: 'Dzüdza River Gorge, NH-29 Kohima Bypass',
    district: 'Kohima',
    state: 'Nagaland',
    coordinates: [25.682, 94.095],
    severity: 'HIGH',
    trigger: 'Continuous Monsoon Rain',
    rainfall24hMm: 118.4,
    fatalities: 0,
    infrastructureImpact: 'National highway lifeline cut off for 72 hours; fuel tankers stranded',
    source: 'NASA Global Landslide Catalog (GLC)',
  },
  {
    id: 'GSI-ARUN-2024-06',
    date: '2024-06-19',
    location: 'Tuting-Yingkiong Border Road Sector 4, Upper Siang',
    district: 'Upper Siang',
    state: 'Arunachal Pradesh',
    coordinates: [28.988, 94.902],
    severity: 'HIGH',
    trigger: 'Continuous Monsoon Rain',
    rainfall24hMm: 142.8,
    fatalities: 1,
    infrastructureImpact: 'Phyllite slope failure covered 90m of arterial defense road',
    source: 'Geological Survey of India (GSI)',
  },
  {
    id: 'NASA-GLC-NER-2024-09',
    date: '2024-09-02',
    location: 'Zokhawthar Border Trade Road, Champhai',
    district: 'Aizawl',
    state: 'Mizoram',
    coordinates: [23.364, 93.332],
    severity: 'MODERATE',
    trigger: 'Tropical Depression',
    rainfall24hMm: 92.6,
    fatalities: 0,
    infrastructureImpact: 'Retaining wall breached; single-lane alternating traffic allowed',
    source: 'NASA Global Landslide Catalog (GLC)',
  },
  {
    id: 'NESDR-TAW-2023-09',
    date: '2023-09-11',
    location: 'Sela Tunnel Approach Road, Tawang',
    district: 'Tawang',
    state: 'Arunachal Pradesh',
    coordinates: [27.502, 92.098],
    severity: 'HIGH',
    trigger: 'Slope Cut Excavation + Rain',
    rainfall24hMm: 86.4,
    fatalities: 0,
    infrastructureImpact: 'Rockfall and colluvial slide blocked military convoy movement',
    source: 'NESDR Archives',
  },
  {
    id: 'GSI-MEGH-2022-06',
    date: '2022-06-17',
    location: 'Tura-Dalu Road NH-51, West Garo Hills',
    district: 'West Garo Hills',
    state: 'Meghalaya',
    coordinates: [25.485, 90.198],
    severity: 'MODERATE',
    trigger: 'Continuous Monsoon Rain',
    rainfall24hMm: 178.0,
    fatalities: 2,
    infrastructureImpact: 'Culvert blockage caused water logging and road shoulder collapse',
    source: 'Geological Survey of India (GSI)',
  },
]
