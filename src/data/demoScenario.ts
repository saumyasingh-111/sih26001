// SENTINEL NER - Centralized Demo Scenario: Churachandpur Extreme Deluge & Landslide Crisis
// Strictly active ONLY in 'demo' Mode to ensure Live Data Mode remains 100% genuine and honest.

export interface DemoCrisisAlert {
  id: string
  level: 'CRITICAL' | 'HIGH' | 'WARNING'
  title: string
  location: string
  risk: number
  cause: string
  status: 'NEW' | 'ESCALATED' | 'DISPATCHED' | 'MONITORING'
  time: string
  details: string
}

export interface DemoEvacuationRoute {
  id: string
  name: string
  status: 'CLEAR / RECOMMENDED' | 'BLOCKED' | 'HIGH HAZARD'
  distance: string
  travelTime: string
  riskLevel: 'LOW' | 'HIGH' | 'CRITICAL'
  reason: string
}

export interface DemoRadioTranscript {
  id: string
  time: string
  callsign: string
  channel: string
  message: string
  priority: 'CRITICAL' | 'OPERATIONAL' | 'ROUTINE'
}

export const CHURACHANDPUR_DEMO_SCENARIO = {
  name: 'Churachandpur Monsoon Deluge & Debris Slump',
  targetDistrict: 'Churachandpur',
  targetState: 'Manipur',
  coordinates: { lat: 24.33, lon: 93.67 },
  elevation: 920, // meters
  simulatedRiskScore: 94,
  simulatedRiskLevel: 'CRITICAL',
  rainfall24h: 240, // mm
  currentPrecipRate: 48.5, // mm/h
  soilSaturationPercent: 94,
  poreWaterPressureKPa: 38.4,
  slopeAngleDeg: 42,
  roadBlockageLocation: 'KM-42 NH-102B Mountain Cutting',
  debrisVolumeEstimate: '450 m³',
  monitoredZonesCount: 8,
  highRiskZonesCount: 2, // Churachandpur & East Khasi Hills

  alerts: [
    {
      id: 'ALT-CRISIS-01',
      level: 'CRITICAL',
      title: 'Active Debris Slump & Tension Cracking at KM-42',
      location: 'KM-42 Mountain Cutting, NH-102B, Churachandpur',
      risk: 94,
      cause: 'Intense 240mm rain burst exceeding pore-pressure threshold of 32 kPa',
      status: 'ESCALATED',
      time: '12 min ago',
      details: 'Oversteepened road cut failure with continuous raveling. Both lanes obstructed.',
    },
    {
      id: 'ALT-CRISIS-02',
      level: 'HIGH',
      title: 'Runoff Surge & Culvert Choking at Tuitha River Bridge',
      location: 'Tuitha Lowland Bridge Approach, Churachandpur',
      risk: 86,
      cause: 'Sediment-laden torrent threatening bridge pier stability',
      status: 'DISPATCHED',
      time: '34 min ago',
      details: 'Water level 0.4m below deck. SDRF staging heavy clearing backhoes.',
    },
    {
      id: 'ALT-CRISIS-03',
      level: 'HIGH',
      title: 'Perimeter Slope Creep near Settlement Ridge B',
      location: 'Upper Tuitha Sector, Churachandpur',
      risk: 79,
      cause: 'Prolonged soil saturation (94%) inducing toe displacement',
      status: 'NEW',
      time: '52 min ago',
      details: 'Automated inclinometer node S-04 registered 18mm tilt over 3 hours.',
    },
  ] as DemoCrisisAlert[],

  routes: [
    {
      id: 'ROUTE-C',
      name: 'Corridor Charlie (Upper Ridge Bypass)',
      status: 'CLEAR / RECOMMENDED',
      distance: '24.6 km',
      travelTime: '45 mins',
      riskLevel: 'LOW',
      reason: 'Ridge crest alignment; stable bedrock profile away from runoff chutes.',
    },
    {
      id: 'ROUTE-A',
      name: 'Highway NH-102B Primary Arterial',
      status: 'BLOCKED',
      distance: '18.2 km',
      travelTime: 'Impasse (Blocked)',
      riskLevel: 'CRITICAL',
      reason: '450 m³ active debris pile spanning both lanes at KM-42.',
    },
    {
      id: 'ROUTE-B',
      name: 'Old Valley Link Road',
      status: 'HIGH HAZARD',
      distance: '29.0 km',
      travelTime: '1 hr 20 mins',
      riskLevel: 'HIGH',
      reason: 'Culvert flash-flooding and high rockfall hazard between KM-11 and KM-15.',
    },
  ] as DemoEvacuationRoute[],

  radioTranscripts: [
    {
      id: 'RADIO-01',
      time: '11:42',
      callsign: 'SDRF QRT-2 Leader',
      channel: 'HF 14.225 MHz / VHF Net 1',
      message: 'On site KM-42. Major toe slumping confirmed. NH-102B blocked. Traffic diverted to Corridor Charlie.',
      priority: 'CRITICAL',
    },
    {
      id: 'RADIO-02',
      time: '11:30',
      callsign: 'PWD Highway Engineer',
      channel: 'HF 14.225 MHz',
      message: 'Earthmoving JCB and two tipper trucks dispatched from Sub-division 04 depot. ETA 25 minutes.',
      priority: 'OPERATIONAL',
    },
    {
      id: 'RADIO-03',
      time: '11:15',
      callsign: 'District Emergency Operations',
      channel: 'VHF Emergency Channel 3',
      message: 'CAP Alert SMS broadcast completed to 1,200 downstream mobile handsets in Tuitha riverfront grid.',
      priority: 'ROUTINE',
    },
  ] as DemoRadioTranscript[],

  timeProgression: [
    { hour: '-06h', rain: 18, risk: 42, porePressure: 14.2 },
    { hour: '-04h', rain: 44, risk: 62, porePressure: 22.0 },
    { hour: '-02h', rain: 95, risk: 78, porePressure: 29.5 },
    { hour: '-01h', rain: 160, risk: 88, porePressure: 34.1 },
    { hour: 'Peak (Now)', rain: 240, risk: 94, porePressure: 38.4 },
  ],
}
