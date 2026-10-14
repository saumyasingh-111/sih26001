import React, { useState, useEffect } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Crosshair,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe2,
  HelpCircle,
  History,
  Layers,
  Layers3,
  LocateFixed,
  LogOut,
  MapPin,
  Mountain,
  Plus,
  Radio,
  RefreshCw,
  Route,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react'
import { officerApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDataContext } from '../../context/DataContext'
import { GISWorkstation } from '../gis/GISWorkstation'
import { RiskIntelligenceWorkspace } from '../risk/RiskIntelligenceWorkspace'
import { ModeSelector } from '../common/ModeSelector'

interface OfficerControlCenterProps {
  go: (route: string) => void
  notify: (msg: string, tone?: 'success' | 'error') => void
  simulate: () => void
}

type OfficerTab = 'overview' | 'gis' | 'risk_intel' | 'citizen_reports' | 'field_obs' | 'alerts' | 'rescue' | 'reporters' | 'audit'

export function OfficerControlCenter({ go, notify, simulate }: OfficerControlCenterProps) {
  const { user, logout } = useAuth()
  const { activeDistrict, setActiveDistrict, activeRegion, liveRiskScore, incident, setIncident, dataMode } = useDataContext()

  // Determine active tab from URL subpath
  const getTabFromPath = (): OfficerTab => {
    const path = window.location.pathname.toLowerCase().replace(/^\/officer\/?/, '')
    if (path === 'citizen-reports' || path === 'citizen') return 'citizen_reports'
    if (path === 'field-reports' || path === 'field') return 'field_obs'
    if (path === 'risk-monitoring' || path === 'gis') return 'gis'
    if (path === 'risk-intelligence' || path === 'risk_intel') return 'risk_intel'
    if (path === 'alerts') return 'alerts'
    if (path === 'rescue') return 'rescue'
    if (path === 'management' || path === 'reporters') return 'reporters'
    if (path === 'audit') return 'audit'
    return 'overview'
  }

  const [currentTab, setCurrentTab] = useState<OfficerTab>(getTabFromPath)

  const navigateTab = (tab: OfficerTab) => {
    setCurrentTab(tab)
    let sub = 'officer'
    if (tab === 'citizen_reports') sub = 'officer/citizen-reports'
    else if (tab === 'field_obs') sub = 'officer/field-reports'
    else if (tab === 'gis') sub = 'officer/risk-monitoring'
    else if (tab === 'risk_intel') sub = 'officer/risk-intelligence'
    else if (tab === 'alerts') sub = 'officer/alerts'
    else if (tab === 'rescue') sub = 'officer/rescue'
    else if (tab === 'reporters') sub = 'officer/management'
    else if (tab === 'audit') sub = 'officer/audit'
    go(sub)
  }

  useEffect(() => {
    const handlePop = () => {
      setCurrentTab(getTabFromPath())
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null)
  const [citizenReports, setCitizenReports] = useState<any[]>([])
  const [fieldObservations, setFieldObservations] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [rescueTasks, setRescueTasks] = useState<any[]>([])
  const [rescueTeams, setRescueTeams] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [reporters, setReporters] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Modals & form state
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reportSeverity, setReportSeverity] = useState('HIGH')
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  const [selectedObs, setSelectedObs] = useState<any>(null)
  const [obsReviewNotes, setObsReviewNotes] = useState('')
  const [createIncidentFromObs, setCreateIncidentFromObs] = useState(false)
  const [obsModalOpen, setObsModalOpen] = useState(false)

  // New Alert Form
  const [newAlertModal, setNewAlertModal] = useState(false)
  const [alertTitle, setAlertTitle] = useState('Landslide Threat Escalation Warning')
  const [alertLevel, setAlertLevel] = useState('CRITICAL')
  const [alertLocation, setAlertLocation] = useState(activeDistrict)
  const [alertCause, setAlertCause] = useState('Continuous rainfall exceeding 110mm threshold + confirmed slope tension crack')
  const [alertIsPublic, setAlertIsPublic] = useState(true)
  const [alertTargetAreas, setAlertTargetAreas] = useState('All low-lying slopes & road corridors')
  const [alertInstructions, setAlertInstructions] = useState('Prepare evacuation kits and move along Corridor Charlie to Sector 4 shelter.')

  // Assign Rescue Task Form
  const [assignRescueModal, setAssignRescueModal] = useState(false)
  const [taskTeamId, setTaskTeamId] = useState<number>(0)
  const [taskTitle, setTaskTitle] = useState('Cordon & Secure Sector 4 Ridge Pathway')
  const [taskLocation, setTaskLocation] = useState('Sector 4 Crest, Churachandpur')
  const [taskInstructions, setTaskInstructions] = useState('Establish safety perimeter, clear small vehicle blockages, assist hillside residents with relocation.')

  const loadData = async () => {
    try {
      setRefreshing(true)
      const [
        overviewRes,
        citRes,
        fieldRes,
        altRes,
        rescueRes,
        teamsRes,
        zonesRes,
        reportersRes,
        auditRes,
        incRes,
      ] = await Promise.all([
        officerApi.getOverview(),
        officerApi.getCitizenReports(),
        officerApi.getFieldObservations(),
        officerApi.getAlerts(),
        officerApi.getRescueTasks(),
        officerApi.getRescueTeams(),
        officerApi.getZones(),
        officerApi.getFieldReporters(),
        officerApi.getAuditLogs(),
        officerApi.getIncidents(),
      ])

      setOverviewMetrics(overviewRes.metrics || {})
      setCitizenReports(citRes.reports || [])
      setFieldObservations(fieldRes.observations || [])
      setAlerts(altRes.alerts || [])
      setRescueTasks(rescueRes.rescue_tasks || [])
      setRescueTeams(teamsRes.rescue_teams || [])
      setZones(zonesRes.zones || [])
      setReporters(reportersRes.reporters || [])
      setAuditLogs(auditRes.audit_logs || [])
      setIncidents(incRes.incidents || [])

      if (teamsRes.rescue_teams?.length && !taskTeamId) {
        setTaskTeamId(teamsRes.rescue_teams[0].id)
      }
    } catch (err: any) {
      console.error('Error fetching officer data:', err)
      notify('Failed to refresh operational data', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeDistrict, dataMode])

  // Citizen Report Review Action
  const handleReviewCitizenReport = async (status: 'VERIFIED' | 'REJECTED' | 'RESOLVED') => {
    if (!selectedReport) return
    try {
      await officerApi.reviewCitizenReport(selectedReport.id, status, reviewNotes || `Report ${status} by officer`, reportSeverity)
      notify(`Report ${selectedReport.id} marked as ${status}. Citizen status updated.`, 'success')
      setReviewModalOpen(false)
      setSelectedReport(null)
      setReviewNotes('')
      loadData()
    } catch (err: any) {
      notify(err.message || 'Action failed', 'error')
    }
  }

  // Field Observation Review Action
  const handleReviewFieldObs = async (status: 'REVIEWED' | 'ESCALATED_TO_INCIDENT' | 'RESOLVED') => {
    if (!selectedObs) return
    try {
      const res = await officerApi.reviewFieldObservation(selectedObs.id, status, obsReviewNotes || `Observation verified`, createIncidentFromObs)
      notify(`Observation ${selectedObs.id} reviewed. ${res.escalated_incident_id ? `Incident ${res.escalated_incident_id} created!` : ''}`, 'success')
      setObsModalOpen(false)
      setSelectedObs(null)
      setObsReviewNotes('')
      setCreateIncidentFromObs(false)
      loadData()
    } catch (err: any) {
      notify(err.message || 'Action failed', 'error')
    }
  }

  // Alert Creation
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await officerApi.createAlert({
        title: alertTitle,
        level: alertLevel,
        location: alertLocation,
        district: activeDistrict,
        cause: alertCause,
        risk_score: 91,
        is_public: alertIsPublic,
        target_areas: alertTargetAreas,
        safety_instructions: alertInstructions,
      })
      notify(`Alert published! ${alertIsPublic ? 'Now visible on Citizen Portal.' : 'Internal officer alert.'}`, 'success')
      setNewAlertModal(false)
      loadData()
    } catch (err: any) {
      notify(err.message || 'Failed to create alert', 'error')
    }
  }

  // Toggle Alert Public Distribution
  const handleToggleAlertPublish = async (alertId: string, currentPublic: boolean) => {
    try {
      const nextPublic = !currentPublic
      await officerApi.toggleAlertPublish(alertId, nextPublic)
      notify(`Alert ${alertId} ${nextPublic ? 'published to Citizen Portal' : 'retracted from Citizen Portal'}.`, 'success')
      loadData()
    } catch (err: any) {
      notify(err.message || 'Action failed', 'error')
    }
  }

  // Assign Rescue Task
  const handleAssignRescueTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTeamId) {
      notify('Select a rescue team', 'error')
      return
    }
    try {
      await officerApi.assignRescueTask({
        team_id: taskTeamId,
        title: taskTitle,
        district: activeDistrict,
        location: taskLocation,
        lat: 24.332,
        lon: 93.671,
        severity: 'CRITICAL',
        hazard_details: 'Active ground crack and potential road blockage threatening hillside households.',
        instructions: taskInstructions,
        safe_routes: [
          { name: 'Corridor Charlie (Ridge Crest Bypass)', status: 'RECOMMENDED', distance: '24.6 km', travelTime: '45 min', risk: 'Low', reason: 'Clear ridge bypass' },
          { name: 'Highway NH-102', status: 'BLOCKED', distance: '14.0 km', travelTime: 'Closed', risk: 'Extreme', reason: 'Active debris' },
        ],
      })
      notify('Rescue task assigned! Sent to Rescue Operations Portal.', 'success')
      setAssignRescueModal(false)
      loadData()
    } catch (err: any) {
      notify(err.message || 'Failed to assign task', 'error')
    }
  }

  // Resolve Incident Action
  const handleResolveIncident = async (incId: string) => {
    try {
      await officerApi.resolveIncident(incId, 'All field operations completed and debris cleared.')
      notify(`Incident ${incId} formally closed and resolved!`, 'success')
      loadData()
    } catch (err: any) {
      notify(err.message || 'Failed to resolve incident', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* ============================================================ */}
      {/* 1. OFFICER CONTROL TOPBAR                                    */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => go('home')}
              className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                <ShieldCheck size={18} />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none block">
                  SENTINEL <span className="text-emerald-700">NER</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                  Officer Control Center & Incident HQ
                </span>
              </div>
            </button>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              DISASTER HQ
            </span>
          </div>

          {/* Mode Selector & Officer Status */}
          <div className="flex items-center gap-3 text-xs">
            <ModeSelector />

            <button
              onClick={simulate}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold transition-colors cursor-pointer text-xs"
              title="Trigger emergency escalation simulation"
            >
              <Zap size={13} className="text-amber-600" />
              <span>Simulate Crisis</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <ShieldCheck size={14} className="text-emerald-700" />
              <span className="font-semibold text-slate-900 hidden md:inline">
                {user?.full_name || 'Officer Ananya Sharma'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">HQ Lead</span>
              <button
                onClick={() => {
                  logout()
                  notify('Signed out successfully')
                  go('home')
                }}
                className="text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                title="Log out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="bg-slate-100/80 border-t border-slate-200 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none text-xs font-medium">
            {[
              { id: 'overview', label: 'Operations Overview', icon: Crosshair },
              { id: 'citizen_reports', label: `Citizen Queue (${overviewMetrics?.unverified_citizen_reports || 0})`, icon: UserCheck },
              { id: 'field_obs', label: `Field Queue (${overviewMetrics?.unverified_field_observations || 0})`, icon: FileText },
              { id: 'gis', label: 'Regional GIS Workstation', icon: Layers3 },
              { id: 'risk_intel', label: 'Risk Intelligence', icon: BrainCircuit },
              { id: 'alerts', label: `Alert Center (${alerts.length})`, icon: Radio },
              { id: 'rescue', label: `Rescue Coordination (${rescueTasks.length})`, icon: Truck },
              { id: 'reporters', label: 'Field Management', icon: Users },
              { id: 'audit', label: 'Audit Trail', icon: History },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = currentTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTab(tab.id as OfficerTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-emerald-700' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* ============================================================ */}
        {/* TAB 1: OPERATIONS OVERVIEW & CLEAR 6-CATEGORY MONITORING     */}
        {/* ============================================================ */}
        {currentTab === 'overview' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-emerald-700" />
                  <span>Disaster Coordination Command · Regional Headquarters</span>
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 mt-1">
                  Sentinel NER Operational Status & Incident Categorization
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Strict distinction between AI predictions, incoming evidence, officer-verified incidents, and active rescue dispatches.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewAlertModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio size={14} />
                  <span>Publish Alert</span>
                </button>
                <button
                  onClick={() => setAssignRescueModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck size={14} />
                  <span>Dispatch Rescue</span>
                </button>
                <button
                  onClick={loadData}
                  disabled={refreshing}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* 6 Clear Operational Categories (Requirement #4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Category 1: AI-Predicted Risk */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  1. AI PREDICTED RISK
                </div>
                <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                  {liveRiskScore}
                  <span className="text-xs text-slate-400">/100</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Advisory baseline; requires human officer validation before public action.
                </p>
              </div>

              {/* Category 2: Unverified Citizen Reports */}
              <div
                onClick={() => setCurrentTab('citizen_reports')}
                className="p-4 rounded-xl bg-white border border-amber-300 shadow-xs cursor-pointer hover:bg-amber-50/50 transition-colors"
              >
                <div className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider">
                  2. UNVERIFIED CITIZEN
                </div>
                <div className="text-2xl font-black text-amber-800 font-mono mt-1">
                  {overviewMetrics?.unverified_citizen_reports || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Awaiting review in queue. Click to verify or reject.
                </p>
              </div>

              {/* Category 3: Unverified Field Observations */}
              <div
                onClick={() => setCurrentTab('field_obs')}
                className="p-4 rounded-xl bg-white border border-sky-300 shadow-xs cursor-pointer hover:bg-sky-50/50 transition-colors"
              >
                <div className="text-[10px] font-mono font-bold text-sky-700 uppercase tracking-wider">
                  3. UNVERIFIED FIELD
                </div>
                <div className="text-2xl font-black text-sky-800 font-mono mt-1">
                  {overviewMetrics?.unverified_field_observations || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Geotagged observations from field reporters.
                </p>
              </div>

              {/* Category 4: Officer-Verified Incidents */}
              <div className="p-4 rounded-xl bg-white border border-rose-300 shadow-xs">
                <div className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider">
                  4. VERIFIED INCIDENTS
                </div>
                <div className="text-2xl font-black text-rose-800 font-mono mt-1">
                  {overviewMetrics?.active_verified_incidents || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ground truth verified by officer; active hazard footprint.
                </p>
              </div>

              {/* Category 5: Active Response Operations */}
              <div
                onClick={() => setCurrentTab('rescue')}
                className="p-4 rounded-xl bg-white border border-indigo-300 shadow-xs cursor-pointer hover:bg-indigo-50/50 transition-colors"
              >
                <div className="text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-wider">
                  5. ACTIVE RESCUE
                </div>
                <div className="text-2xl font-black text-indigo-800 font-mono mt-1">
                  {overviewMetrics?.active_rescue_deployments || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  NDRF / SDRF tactical teams mobilized on ground.
                </p>
              </div>

              {/* Category 6: Resolved Incidents */}
              <div className="p-4 rounded-xl bg-white border border-emerald-300 shadow-xs">
                <div className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
                  6. RESOLVED INCIDENTS
                </div>
                <div className="text-2xl font-black text-emerald-800 font-mono mt-1">
                  {overviewMetrics?.resolved_incidents || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Formally closed; road cleared and audit trail preserved.
                </p>
              </div>
            </div>

            {/* Central Unified Incident & Decision Support */}
            {incidents.length === 0 ? (
              <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-800">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>OPERATIONAL MONITORING · NO ACTIVE GROUND DISASTER INCIDENTS</span>
                </div>
                <p className="text-xs text-slate-500">
                  There are currently no verified active landslide disasters reported in the connected system for {activeDistrict}. AI risk monitoring and sensor ingestion remain continuous.
                </p>
              </section>
            ) : (
              <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        INCIDENT OF RECORD · {incidents[0].id}
                      </span>
                      {dataMode === 'demo' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          DEMO / SIMULATED SCENARIO
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1">{incidents[0].title}</h2>
                    <p className="text-xs text-slate-500">
                      Location: {incidents[0].location} ({incidents[0].district}) · Priority Score: {incidents[0].priorityScore}/100
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-100 text-amber-800">
                      Status: {incidents[0].responseStatus}
                    </span>
                    {incidents[0].responseStatus !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveIncident(incidents[0].id)}
                        className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        Formally Resolve Incident
                      </button>
                    )}
                  </div>
                </div>

                {/* Incident Timeline */}
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">
                    Incident Audit & Action Timeline
                  </h3>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-52 overflow-y-auto">
                    {incidents[0].timeline?.map((item: any, i: number) => (
                      <div key={item.id || i} className="p-3 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {item.time}
                          </span>
                          <strong className="text-slate-900">{item.label}:</strong>
                          <span className="text-slate-600">{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Side-by-Side Review Queues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Citizen Review Queue Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                      <UserCheck size={15} className="text-amber-600" />
                      <span>Incoming Citizen Reports Queue</span>
                    </h3>
                    <button
                      onClick={() => setCurrentTab('citizen_reports')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <span>View All ({citizenReports.length})</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {citizenReports.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-500 text-xs">
                        No incoming citizen reports in the current queue.
                      </div>
                    ) : (
                      citizenReports.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{r.id} · {r.report_type}</span>
                              {dataMode === 'demo' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  DEMO
                                </span>
                              )}
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                r.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{r.location} · By {r.citizen_name}</div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedReport(r)
                              setReviewNotes(r.officer_notes || '')
                              setReviewModalOpen(true)
                            }}
                            className="px-2.5 py-1.5 rounded bg-slate-900 text-white font-mono text-[11px] font-bold hover:bg-slate-800 cursor-pointer"
                          >
                            Review
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Field Observation Queue Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                      <FileText size={15} className="text-sky-600" />
                      <span>Incoming Field Observations Queue</span>
                    </h3>
                    <button
                      onClick={() => setCurrentTab('field_obs')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <span>View All ({fieldObservations.length})</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {fieldObservations.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-500 text-xs">
                        No incoming field observations in the current queue.
                      </div>
                    ) : (
                      fieldObservations.slice(0, 3).map((obs) => (
                        <div
                          key={obs.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{obs.id} · {obs.condition_category}</span>
                              {dataMode === 'demo' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  DEMO
                                </span>
                              )}
                              {obs.is_urgent === 1 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                                  URGENT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{obs.location} · Reporter: {obs.reporter_name}</div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedObs(obs)
                              setObsReviewNotes(obs.officer_notes || '')
                              setObsModalOpen(true)
                            }}
                            className="px-2.5 py-1.5 rounded bg-slate-900 text-white font-mono text-[11px] font-bold hover:bg-slate-800 cursor-pointer"
                          >
                            Assess
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CITIZEN REPORTS VERIFICATION QUEUE                    */}
        {/* ============================================================ */}
        {currentTab === 'citizen_reports' && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                  <UserCheck size={15} className="text-emerald-700" />
                  <span>Citizen Early Warning Reports Queue ({citizenReports.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Verify or reject warnings submitted by local residents. Verified reports become official incidents.
                </p>
              </div>
            </div>

            {citizenReports.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">
                  {dataMode === 'live' ? 'No Citizen Reports in Queue' : 'No Simulated Citizen Reports'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {dataMode === 'live'
                    ? 'No citizen warning reports have been submitted in the live system. Incoming community hazard reports will appear here for officer verification.'
                    : 'No simulated citizen reports active in this demo scenario.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {citizenReports.map((r) => (
                  <div key={r.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{r.id} · {r.report_type}</span>
                        {dataMode === 'demo' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            DEMO REPORT
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          r.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Severity: <b>{r.severity}</b>
                      </span>
                    </div>
                    <div className="text-slate-800 font-semibold">{r.location} ({r.district})</div>
                    <p className="text-slate-600">{r.description}</p>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Reported by: {r.citizen_name} ({r.phone || 'No phone'}) · Submitted: {new Date(r.created_at).toLocaleString()}
                    </div>
                    {r.officer_notes && (
                      <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 mt-1">
                        <b>Officer Feedback:</b> {r.officer_notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        setSelectedReport(r)
                        setReviewNotes(r.officer_notes || '')
                        setReportSeverity(r.severity || 'HIGH')
                        setReviewModalOpen(true)
                      }}
                      className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs cursor-pointer"
                    >
                      Verify / Action
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 3: FIELD OBSERVATIONS QUEUE                              */}
        {/* ============================================================ */}
        {currentTab === 'field_obs' && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                  <FileText size={15} className="text-sky-600" />
                  <span>Field Reporter Scheduled Observations ({fieldObservations.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Periodic ground observations, sensor telemetry, and urgent escalations from deployed monitors.
                </p>
              </div>
            </div>

            {fieldObservations.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">
                  {dataMode === 'live' ? 'No Field Observations in Queue' : 'No Simulated Field Observations'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {dataMode === 'live'
                    ? 'No ground observations have been filed by field reporters in the live database.'
                    : 'No simulated field observations active in this demo scenario.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {fieldObservations.map((obs) => (
                  <div key={obs.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{obs.id} · {obs.condition_category}</span>
                        {dataMode === 'demo' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            DEMO OBSERVATION
                          </span>
                        )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        obs.status === 'ESCALATED_TO_INCIDENT' ? 'bg-rose-100 text-rose-800' : obs.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {obs.status}
                      </span>
                      {obs.is_urgent === 1 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                          CRITICAL ESCALATION
                        </span>
                      )}
                    </div>
                    <div className="text-slate-800 font-semibold">{obs.location} ({obs.district}) · Reporter: {obs.reporter_name}</div>
                    <p className="text-slate-600">{obs.description}</p>
                    {obs.sensor_readings && Object.keys(obs.sensor_readings).length > 0 && (
                      <div className="flex flex-wrap gap-3 p-2 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 mt-1">
                        {obs.sensor_readings.rainfall_rate_mm_hr != null && <span>Rain: <b>{obs.sensor_readings.rainfall_rate_mm_hr} mm/h</b></span>}
                        {obs.sensor_readings.soil_moisture_pct != null && <span>Soil: <b>{obs.sensor_readings.soil_moisture_pct}%</b></span>}
                        {obs.sensor_readings.tilt_deg != null && <span>Tilt: <b>{obs.sensor_readings.tilt_deg}°</b></span>}
                        {obs.sensor_readings.pore_pressure_kpa != null && <span>Pore Press: <b>{obs.sensor_readings.pore_pressure_kpa} kPa</b></span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        setSelectedObs(obs)
                        setObsReviewNotes(obs.officer_notes || '')
                        setObsModalOpen(true)
                      }}
                      className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs cursor-pointer"
                    >
                      Review & Escalate
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 4: REGIONAL GIS WORKSTATION (PRESERVED)                   */}
        {/* ============================================================ */}
        {currentTab === 'gis' && (
          <GISWorkstation region={activeRegion} score={liveRiskScore} incident={incident} notify={notify} />
        )}

        {/* ============================================================ */}
        {/* TAB 5: AI RISK INTELLIGENCE WORKSPACE (PRESERVED)             */}
        {/* ============================================================ */}
        {currentTab === 'risk_intel' && (
          <RiskIntelligenceWorkspace go={go} notify={notify} />
        )}

        {/* ============================================================ */}
        {/* TAB 6: ALERT CENTER & PUBLIC DISTRIBUTION MANAGEMENT         */}
        {/* ============================================================ */}
        {currentTab === 'alerts' && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                  <Radio size={15} className="text-emerald-700" />
                  <span>Public & Internal Alert Management ({alerts.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Control alert publication. When marked 'Public', warnings immediately broadcast to citizens in the affected zone.
                </p>
              </div>

              <button
                onClick={() => setNewAlertModal(true)}
                className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Create New Alert</span>
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Radio className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">
                  {dataMode === 'live' ? 'No Active Official Bulletins' : 'No Simulated Bulletins'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {dataMode === 'live'
                    ? 'No active official bulletins available from connected live sources. Officers can create and publish emergency warnings using the button above.'
                    : 'No simulated bulletins active in this demo scenario.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.map((alt) => (
                  <div key={alt.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{alt.id} · {alt.title}</span>
                        {dataMode === 'demo' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            DEMO ALERT
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          alt.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {alt.level}
                        </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        alt.is_public === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {alt.is_public === 1 ? 'PUBLIC CITIZEN BROADCAST' : 'INTERNAL HQ ONLY'}
                      </span>
                    </div>
                    <div className="text-slate-800 font-semibold">{alt.location} ({alt.district})</div>
                    <p className="text-slate-600">{alt.cause}</p>
                    {alt.safety_instructions && (
                      <div className="text-[11px] text-rose-900 font-semibold">
                        Advisory: {alt.safety_instructions}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAlertPublish(alt.id, alt.is_public === 1)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                        alt.is_public === 1
                          ? 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      {alt.is_public === 1 ? 'Retract from Public' : 'Publish to Citizens'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 7: RESCUE COORDINATION                                   */}
        {/* ============================================================ */}
        {currentTab === 'rescue' && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                  <Truck size={15} className="text-rose-600" />
                  <span>Rescue Team Deployment & Task Tracking ({rescueTasks.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Assign verified incidents to authorized NDRF/SDRF units and track mobilization through completion.
                </p>
              </div>

              <button
                onClick={() => setAssignRescueModal(true)}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Dispatch Response Unit</span>
              </button>
            </div>

            {rescueTasks.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">
                  {dataMode === 'live' ? 'No Live Missions Dispatched' : 'No Simulated Missions in Queue'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {dataMode === 'live'
                    ? 'No live mission data available from the connected system. Tactical units are in standby readiness.'
                    : 'No simulated rescue missions active in this demo scenario.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rescueTasks.map((t) => (
                  <div key={t.id} className="py-4 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{t.id} · {t.title}</span>
                        {dataMode === 'demo' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            DEMO MISSION
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                          Assigned to: {t.team_name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Assigned by: {t.assigned_by}
                    </span>
                  </div>

                  <p className="text-slate-600">{t.instructions}</p>

                  <div className="flex flex-wrap gap-4 text-[11px] font-mono text-slate-500 pt-1">
                    <span>Location: <b>{t.location}</b></span>
                    <span>Casualties: <b>{t.casualties_count}</b></span>
                    <span>Evacuated: <b>{t.affected_people_count}</b></span>
                    <span>Road: <b>{t.road_blocked ? 'Blocked' : 'Clear'}</b></span>
                  </div>

                  {t.assistance_notes && (
                    <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
                      ⚠️ Rescue Team Requested Assistance: {t.assistance_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 8: FIELD REPORTER MANAGEMENT                             */}
        {/* ============================================================ */}
        {currentTab === 'reporters' && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                  <Users size={15} className="text-emerald-700" />
                  <span>Monitoring Zones & Field Reporter Schedules</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Configure monitoring frequency (every 1–2 hours) and assign reporters to high-vulnerability hill zones.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map((z) => (
                <div key={z.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-sm">{z.id} · {z.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">
                      {z.risk_level}
                    </span>
                  </div>

                  <div className="text-slate-600">{z.vulnerability_notes || 'Continuous hill slope surveillance zone.'}</div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <span>Assigned Monitor: <b>{z.assigned_reporter_name || 'Unassigned'}</b></span>
                    <span>Interval: <b>Every {z.reporting_interval_hours}h</b></span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-800 font-semibold">
                    Next Due: {z.next_report_due || 'On Schedule'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* TAB 9: AUDIT TRAIL                                           */}
        {/* ============================================================ */}
        {currentTab === 'audit' && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold font-mono uppercase text-slate-800 flex items-center gap-2">
                  <History size={15} className="text-emerald-700" />
                  <span>System Audit Trail & Incident Verification Log</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Immutable record of alert publications, incident verifications, and tactical rescue dispatches.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-3 font-bold text-slate-800">{log.username}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-emerald-800">{log.action}</td>
                      <td className="p-3 text-slate-600">{log.target_type}: {log.target_id}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* ============================================================ */}
      {/* CITIZEN REPORT REVIEW MODAL                                  */}
      {/* ============================================================ */}
      {reviewModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-slate-500">
                  REVIEW CITIZEN REPORT · {selectedReport.id}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedReport.report_type}</h3>
              </div>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 text-xs space-y-1">
              <div><strong>Location:</strong> {selectedReport.location} ({selectedReport.district})</div>
              <div><strong>Reported by:</strong> {selectedReport.citizen_name} ({selectedReport.phone || 'No phone'})</div>
              <div><strong>Description:</strong> {selectedReport.description}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Assessed Severity</label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 font-mono"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MODERATE">MODERATE</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Officer Verification Notes (Visible to Citizen) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Officer verified ground movement via local patrol. Slope cordon placed. Public advised to avoid pathway."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleReviewCitizenReport('REJECTED')}
                className="px-3 py-2 rounded-md text-xs font-mono font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 cursor-pointer"
              >
                Reject / Spurious
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-3 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewCitizenReport('VERIFIED')}
                  className="px-4 py-2 rounded-md text-xs font-mono font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
                >
                  Verify Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FIELD OBSERVATION REVIEW & ESCALATION MODAL                  */}
      {/* ============================================================ */}
      {obsModalOpen && selectedObs && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-slate-500">
                  ASSESS FIELD OBSERVATION · {selectedObs.id}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedObs.condition_category}</h3>
              </div>
              <button onClick={() => setObsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 text-xs space-y-1">
              <div><strong>Location:</strong> {selectedObs.location} ({selectedObs.district})</div>
              <div><strong>Field Reporter:</strong> {selectedObs.reporter_name}</div>
              <div><strong>Observation:</strong> {selectedObs.description}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Officer Assessment Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record verification decision, risk reassessment, or dispatch trigger..."
                  value={obsReviewNotes}
                  onChange={(e) => setObsReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                  <input
                    type="checkbox"
                    checked={createIncidentFromObs}
                    onChange={(e) => setCreateIncidentFromObs(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Escalate to Central Incident & Prepare Response Task</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setObsModalOpen(false)}
                className="px-3 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReviewFieldObs(createIncidentFromObs ? 'ESCALATED_TO_INCIDENT' : 'REVIEWED')}
                className="px-4 py-2 rounded-md text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PUBLISH ALERT MODAL                                          */}
      {/* ============================================================ */}
      {newAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-slate-500">OFFICIAL WARNING BULLETIN</div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Publish Landslide Alert</h3>
              </div>
              <button onClick={() => setNewAlertModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Alert Title *</label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Level *</label>
                  <select
                    value={alertLevel}
                    onChange={(e) => setAlertLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 font-mono"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MODERATE">MODERATE</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={alertLocation}
                    onChange={(e) => setAlertLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Trigger / Cause *</label>
                <input
                  type="text"
                  required
                  value={alertCause}
                  onChange={(e) => setAlertCause(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Sectors</label>
                <input
                  type="text"
                  value={alertTargetAreas}
                  onChange={(e) => setAlertTargetAreas(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Public Safety Advisory</label>
                <textarea
                  rows={2}
                  value={alertInstructions}
                  onChange={(e) => setAlertInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900">
                  <input
                    type="checkbox"
                    checked={alertIsPublic}
                    onChange={(e) => setAlertIsPublic(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Publish Immediately to Citizen Public Safety Portal</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewAlertModal(false)}
                  className="px-3 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-mono font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
                >
                  Confirm & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DISPATCH RESCUE MODAL                                        */}
      {/* ============================================================ */}
      {assignRescueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-slate-500">TACTICAL DISPATCH</div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Assign Rescue Mission</h3>
              </div>
              <button onClick={() => setAssignRescueModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignRescueTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Rescue Team *</label>
                <select
                  value={taskTeamId}
                  onChange={(e) => setTaskTeamId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                >
                  {rescueTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.badge_or_unit || t.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mission Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Location *</label>
                <input
                  type="text"
                  required
                  value={taskLocation}
                  onChange={(e) => setTaskLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Operational Instructions *</label>
                <textarea
                  rows={3}
                  required
                  value={taskInstructions}
                  onChange={(e) => setTaskInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignRescueModal(false)}
                  className="px-3 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                >
                  Dispatch Rescue Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
