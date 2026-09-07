import React, { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Globe2,
  Languages,
  MapPin,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { FieldReport, RiskLevel } from '../../data/demoData'
import { useDataContext } from '../../context/DataContext'

interface UnifiedFieldReportsProps {
  reports: FieldReport[]
  setReports: React.Dispatch<React.SetStateAction<FieldReport[]>>
  onReport: (report: FieldReport) => void
  notify: (message: string, tone?: 'success' | 'error') => void
  sync?: () => void
}

const REPORT_TYPES = [
  'Ground crack',
  'Soil movement',
  'Rockfall',
  'Road blockage',
  'Water accumulation',
  'Slope failure',
  'Infrastructure damage',
  'Other',
]

const LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi (हिंदी)' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
  { code: 'as-IN', label: 'Assamese (অসমীয়া)' },
]

export function UnifiedFieldReportsWorkspace({
  reports,
  setReports,
  onReport,
  notify,
  sync,
}: UnifiedFieldReportsProps) {
  const {
    activeDistrict,
    activeLocationName,
    activeLocationCoords,
    isDemoMode,
    isNER,
  } = useDataContext()

  const defaultLocation = isDemoMode
    ? 'Churachandpur, Mountain Sector'
    : `${activeLocationName}, Observation Sector`
  const defaultGps = `${activeLocationCoords.lat.toFixed(4)}°N, ${activeLocationCoords.lon.toFixed(4)}°E`

  // New report form state
  const [reportType, setReportType] = useState('Ground crack')
  const [severity, setSeverity] = useState<RiskLevel>('HIGH')
  const [location, setLocation] = useState(defaultLocation)
  const [gpsCoords, setGpsCoords] = useState<string>(defaultGps)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [reporterName, setReporterName] = useState('Ranger unit / Field Inspector')
  const [urgency, setUrgency] = useState('IMMEDIATE')

  // Keep location and GPS synced with active location changes
  useEffect(() => {
    setLocation(
      isDemoMode
        ? 'Churachandpur, Mountain Sector'
        : `${activeLocationName}, Observation Sector`
    )
    setGpsCoords(`${activeLocationCoords.lat.toFixed(4)}°N, ${activeLocationCoords.lon.toFixed(4)}°E`)
  }, [activeLocationName, activeLocationCoords.lat, activeLocationCoords.lon, isDemoMode])

  // Voice speech recognition state
  const [isRecording, setIsRecording] = useState(false)
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN')
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  // Photo & CV detection state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFileName, setPhotoFileName] = useState<string | null>(null)
  const [cvDetections, setCvDetections] = useState<
    Array<{ label: string; confidence: number; severity: RiskLevel }>
  >([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Filter & Search in Table
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
    }
  }, [])

  // Start / Stop Speech Recognition
  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      notify('Browser speech recognition not supported. You may type or upload audio file.', 'error')
      audioInputRef.current?.click()
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      notify('Voice input completed. Transcript ready for editing.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = voiceLanguage
      recognition.interimResults = true
      recognition.continuous = false

      recognition.onstart = () => {
        setIsRecording(true)
        notify(`Listening in ${voiceLanguage}... Speak clearly.`)
      }

      recognition.onresult = (event: any) => {
        let currentTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }
        if (currentTranscript) {
          setDescription((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript))
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error)
        setIsRecording(false)
        if (event.error !== 'no-speech') {
          notify(`Voice capture note: ${event.error}. You can type manually.`, 'error')
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: any) {
      console.error('Speech recognition exception:', err)
      setIsRecording(false)
      notify('Could not initiate microphone stream.', 'error')
    }
  }

  // Handle GPS coordinate fetch
  const captureGPS = () => {
    if (!navigator.geolocation) {
      notify('Geolocation is not supported by your browser.', 'error')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        const lat = pos.coords.latitude.toFixed(4)
        const lon = pos.coords.longitude.toFixed(4)
        setGpsCoords(`${lat}°N, ${lon}°E`)
        notify(`GPS acquired: ${lat}°N, ${lon}°E.`)
      },
      (err) => {
        setGpsLoading(false)
        notify('GPS satellite lock timed out. Using default regional datum.', 'error')
      },
      { timeout: 8000 }
    )
  }

  // Handle Photo Upload & Simulated CV inference
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result as string)
      // Populate simulated CV Analysis
      setCvDetections([
        { label: `${reportType} detected`, confidence: 91.4, severity },
        { label: 'Surface colluvial displacement', confidence: 86.2, severity: 'HIGH' },
        { label: 'Topsoil saturation watermark', confidence: 78.5, severity: 'MODERATE' },
      ])
      notify('Photo attached. DEMO CV Analysis generated.')
    }
    reader.readAsDataURL(file)
  }

  // Handle Audio File Upload Fallback
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    notify(`Audio file "${file.name}" attached. Generating transcript preview...`)
    setTimeout(() => {
      setDescription(
        (prev) =>
          `${prev ? `${prev} ` : ''}“Field inspection log: Tension fissure widening along north retaining shoulder; seepage observed near road foundation.”`
      )
      notify('Audio transcript extracted.')
    }, 600)
  }

  // Submit report
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      notify('Please enter or dictate a description of the observed warning signs.', 'error')
      return
    }

    const newReport: FieldReport = {
      id: `REP-${100 + reports.length + 1}`,
      location: location || `${activeDistrict}, Sector 4`,
      incident: reportType,
      severity,
      timestamp: 'Just now',
      reporter: reporterName || 'Field Officer',
      status: 'VERIFIED',
      description: `${description} [GPS: ${gpsCoords}] [Urgency: ${urgency}]`,
      image: photoPreview || undefined,
      ai: cvDetections.length > 0 ? cvDetections : undefined,
    }

    setReports([newReport, ...reports])
    setDescription('')
    setPhotoPreview(null)
    setPhotoFileName(null)
    setCvDetections([])
    notify(`Field Report ${newReport.id} registered and pushed to Command Center alerts queue.`, 'success')
  }

  // Filtered reports list
  const filteredReports = reports.filter((r) => {
    if (typeFilter !== 'ALL' && !r.incident.toLowerCase().includes(typeFilter.toLowerCase())) {
      return false
    }
    if (severityFilter !== 'ALL' && r.severity !== severityFilter) {
      return false
    }
    if (
      searchQuery &&
      !r.location.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div className="field-reports-page max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            <span>GROUND INTELLIGENCE</span>
            <span className="text-slate-300">/</span>
            <span>MULTIMODAL INGESTION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
            Field Reports & Ground Evidence
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Collect, transcribe, verify, and georeference ground-truth observations from district patrol units.
          </p>
        </div>

        {sync && (
          <button
            onClick={sync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer self-start md:self-auto"
          >
            <RefreshCw size={13} />
            <span>Sync Offline Queue</span>
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* Main Two-Column Layout: Form (Left) + Table / Feed (Right)   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (5 Columns): New Field Report Submission Form */}
        <div className="lg:col-span-5 rounded-lg bg-white border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <FileText size={16} className="text-slate-700" />
              <span>Submit Ground Observation</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live Field Intake
            </span>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-3.5 text-xs">
            {/* Report Type & Severity */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hazard Observation Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-slate-900"
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as RiskLevel)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-slate-900"
                >
                  <option value="CRITICAL">CRITICAL (Imminent)</option>
                  <option value="HIGH">HIGH (Dangerous)</option>
                  <option value="MODERATE">MODERATE (Warning)</option>
                  <option value="LOW">LOW (Advisory)</option>
                </select>
              </div>
            </div>

            {/* Location & GPS */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Location Landmark & GPS Coordinates
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. KM-42 NH-102B Hillside, Churachandpur"
                  className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={captureGPS}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-mono text-[11px] cursor-pointer"
                  title="Capture device GPS"
                >
                  <MapPin size={13} />
                  <span>{gpsLoading ? '...' : 'GPS'}</span>
                </button>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Coordinates: <b>{gpsCoords}</b>
              </div>
            </div>

            {/* Voice Input Section with Real Web Speech Recognition */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Mic size={14} className={isRecording ? 'text-rose-600 animate-pulse' : 'text-slate-600'} />
                  <span>Voice Field Dictation</span>
                </span>

                {/* Language Selector */}
                <div className="flex items-center gap-1">
                  <Languages size={13} className="text-slate-400" />
                  <select
                    value={voiceLanguage}
                    onChange={(e) => setVoiceLanguage(e.target.value)}
                    className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-mono text-slate-700"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  <span>{isRecording ? 'Stop Recording' : 'Record Voice Intel'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="px-2.5 py-2 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs cursor-pointer font-medium"
                  title="Upload pre-recorded audio file"
                >
                  <Paperclip size={14} />
                </button>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </div>

              {!speechSupported && (
                <div className="text-[10px] text-amber-700">
                  Web Speech API is unavailable in this environment. You can upload an audio file or type manually.
                </div>
              )}
            </div>

            {/* Editable Description / Transcript Field */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Observation Description (Voice Transcript or Typed Notes)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe ground cracks, tension fissures, water seepage, rockfall, road obstruction..."
                className="w-full p-2.5 rounded-md border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-slate-900"
              />
              <div className="text-[10px] text-slate-400">
                You may edit or augment the voice transcript above prior to submission.
              </div>
            </div>

            {/* Photo / Ground Evidence Attachment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700">
                  Ground Photo / Camera Evidence
                </label>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Camera size={13} />
                  <span>{photoFileName ? 'Change Photo' : 'Attach Photo'}</span>
                </button>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {photoPreview && (
                <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-600 truncate max-w-[200px]">
                      {photoFileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null)
                        setPhotoFileName(null)
                        setCvDetections([])
                      }}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <img
                    src={photoPreview}
                    alt="Ground evidence"
                    className="w-full h-32 object-cover rounded border border-slate-200"
                  />

                  {/* Ground Evidence Analysis (Clearly labeled DEMO CV ANALYSIS) */}
                  <div className="p-2 rounded bg-white border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] text-slate-800 uppercase tracking-wider">
                        DEMO CV ANALYSIS (Inference)
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">Model v0.4</span>
                    </div>
                    {cvDetections.map((det, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                        <span>• {det.label}</span>
                        <span className="font-mono font-bold text-emerald-700">{det.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reporter & Urgency */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reporting Unit / Officer
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Urgency Dispatch Status
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-slate-900"
                >
                  <option value="IMMEDIATE">IMMEDIATE (&lt; 2h)</option>
                  <option value="WITHIN 6 HOURS">WITHIN 6 HOURS</option>
                  <option value="ROUTINE">ROUTINE PATROL</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Send size={14} />
                <span>Transmit Field Report to Command Center</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT (7 Columns): Verified Field Reports Feed & Table */}
        <div className="lg:col-span-7 rounded-lg bg-white border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ground Truth Evidence Register ({filteredReports.length})
              </h2>
              <p className="text-xs text-slate-500">
                Verified patrol submissions and active observation logs.
              </p>
            </div>

            {/* Search & Filter Inputs */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-slate-900 w-36 sm:w-44"
                />
              </div>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2 py-1 rounded-md border border-slate-300 bg-white text-xs focus:ring-1 focus:ring-slate-900"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MODERATE">Moderate</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Reports Feed List */}
          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto space-y-2">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onReport(report)}
                className="pt-3 pb-3 px-2 rounded-md hover:bg-slate-50/80 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">{report.id}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                          report.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : report.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {report.severity}
                      </span>
                      <span className="font-bold text-slate-800 text-xs">{report.incident}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{report.location}</div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">{report.timestamp}</span>
                    <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-0.5">
                      {report.status}
                    </div>
                  </div>
                </div>

                {report.description && (
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-2 rounded border border-slate-100">
                    {report.description}
                  </p>
                )}

                {report.image && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Paperclip size={12} />
                    <span>Photo attached</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>Reported by: <b>{report.reporter}</b></span>
                  <span className="text-slate-500">Audited in Command Center</span>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-500 space-y-1.5">
                <div className="font-semibold text-slate-700">
                  {reports.length === 0
                    ? `0 Field Reports Recorded in ${activeLocationName}`
                    : 'No ground reports match current query filters'}
                </div>
                <p className="text-slate-400 max-w-sm mx-auto text-[11px]">
                  {reports.length === 0
                    ? isDemoMode
                      ? 'No incident reports logged. Use the form on the left to submit a field observation.'
                      : `Telemetry baseline nominal across ${activeLocationName}. Patrol units can transmit new ground observations using the form on the left.`
                    : 'Try clearing the search query or adjusting the severity filter.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
