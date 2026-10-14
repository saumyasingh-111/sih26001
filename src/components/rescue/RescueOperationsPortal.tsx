import React, { useState, useEffect } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Flame,
  Globe2,
  HelpCircle,
  LifeBuoy,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  PhoneCall,
  Plus,
  Radio,
  RefreshCw,
  Route,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { rescueApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useDataContext } from '../../context/DataContext'
import { ModeSelector } from '../common/ModeSelector'

interface RescueOperationsPortalProps {
  go: (route: string) => void
  notify: (msg: string, tone?: 'success' | 'error') => void
}

type RescueSubpage = 'dashboard' | 'missions' | 'updates' | 'routes' | 'history'

const WORKFLOW_STEPS = [
  { id: 'ASSIGNED', label: '1. Assigned', color: 'slate' },
  { id: 'ACKNOWLEDGED', label: '2. Acknowledged', color: 'blue' },
  { id: 'MOBILIZED', label: '3. Mobilized', color: 'amber' },
  { id: 'ON_SITE', label: '4. On Site', color: 'indigo' },
  { id: 'ASSISTANCE_REQUIRED', label: 'Assistance Needed', color: 'rose' },
  { id: 'COMPLETED', label: '5. Mission Completed', color: 'emerald' },
]

export function RescueOperationsPortal({ go, notify }: RescueOperationsPortalProps) {
  const { user, logout } = useAuth()
  const { activeDistrict, dataMode } = useDataContext()

  // Determine active subpage from URL
  const getSubpageFromPath = (): RescueSubpage => {
    const path = window.location.pathname.toLowerCase().replace(/^\/rescue\/?/, '')
    if (path === 'missions' || path === 'tasks') return 'missions'
    if (path === 'updates' || path === 'progress') return 'updates'
    if (path === 'routes' || path === 'corridors') return 'routes'
    if (path === 'history' || path === 'completed') return 'history'
    return 'dashboard'
  }

  const [activeSubpage, setActiveSubpage] = useState<RescueSubpage>(getSubpageFromPath)

  const navigateSubpage = (subpage: RescueSubpage) => {
    setActiveSubpage(subpage)
    const targetPath = subpage === 'dashboard' ? 'rescue' : `rescue/${subpage}`
    go(targetPath)
  }

  useEffect(() => {
    const handlePop = () => {
      setActiveSubpage(getSubpageFromPath())
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const [tasks, setTasks] = useState<any[]>([])
  const [completedTasks, setCompletedTasks] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Progress update modal / form state
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateNotes, setUpdateNotes] = useState('')
  const [casualties, setCasualties] = useState(0)
  const [affectedPeople, setAffectedPeople] = useState(0)
  const [roadStatus, setRoadStatus] = useState('Blocked with debris')
  const [photoPreview, setPhotoPreview] = useState('')
  const [requestSupport, setRequestSupport] = useState(false)
  const [supportDetails, setSupportDetails] = useState('')
  const [submittingUpdate, setSubmittingUpdate] = useState(false)

  const loadData = async () => {
    try {
      setRefreshing(true)
      const [tasksRes, histRes] = await Promise.all([
        rescueApi.getMyTasks(),
        rescueApi.getMyHistory(),
      ])
      setTasks(tasksRes.tasks || [])
      setCompletedTasks(histRes.completed_tasks || [])
      if (tasksRes.tasks?.length) {
        if (!selectedTask) {
          setSelectedTask(tasksRes.tasks[0])
        } else {
          const fresh = tasksRes.tasks.find((t: any) => t.id === selectedTask.id)
          if (fresh) setSelectedTask(fresh)
        }
      }
    } catch (err: any) {
      console.error('Failed to load rescue operations data:', err)
      notify(err.message || 'Error loading rescue tasks', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, dataMode])

  // Workflow transition handler
  const handleTransitionStatus = async (taskId: string, nextStatus: string) => {
    try {
      await rescueApi.updateTaskStatus(taskId, nextStatus, `Unit transitioned status to ${nextStatus}`)
      notify(`Status transitioned to ${nextStatus}. Officer HQ notified!`, 'success')
      loadData()
    } catch (err: any) {
      notify(err.message || 'Status update failed', 'error')
    }
  }

  // Progress update submit handler
  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask) return
    if (!updateNotes.trim()) {
      notify('Please provide mission progress notes.', 'error')
      return
    }

    setSubmittingUpdate(true)
    try {
      await rescueApi.submitProgressUpdate(selectedTask.id, {
        status: requestSupport ? 'ASSISTANCE_REQUIRED' : selectedTask.status,
        notes: updateNotes.trim(),
        casualties,
        affected_people: affectedPeople,
        road_status: roadStatus,
        photo_url: photoPreview,
        request_additional_support: requestSupport,
        additional_support_details: supportDetails.trim(),
      })
      notify('Mission update transmitted to Officer Control Center!', 'success')
      setUpdateModalOpen(false)
      setUpdateNotes('')
      setSupportDetails('')
      setRequestSupport(false)
      setPhotoPreview('')
      loadData()
    } catch (err: any) {
      notify(err.message || 'Failed to submit update', 'error')
    } finally {
      setSubmittingUpdate(false)
    }
  }

  const activeMissions = tasks.filter((t) => t.status !== 'COMPLETED')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-rose-600 selection:text-white">
      {/* 1. Shared Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => go('home')}
              className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-700 flex items-center justify-center text-white font-bold text-sm">
                <Truck size={18} />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none block">
                  SENTINEL <span className="text-rose-700">NER</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                  Rescue Operations & NDRF Dispatch
                </span>
              </div>
            </button>
          </div>

          {/* Center: Live / Demo Mode Selector */}
          <div className="flex items-center gap-3">
            <ModeSelector />

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
              <LifeBuoy size={13} />
              <span>Response Readiness: ACTIVE</span>
            </div>
          </div>

          {/* Right: Team Profile & Sign Out */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.full_name || 'NDRF Quick Response Team'}
                </div>
                <div className="text-[10px] text-rose-700 font-medium font-mono">
                  {user?.badge_or_unit || 'NDRF-SDRF-01'}
                </div>
              </div>
              <button
                onClick={() => {
                  logout()
                  notify('Signed out successfully')
                  go('home')
                }}
                title="Sign Out"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Subpage Navigation Bar */}
        <div className="bg-slate-100/80 border-t border-slate-200 px-4 sm:px-6">
          <nav className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => navigateSubpage('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'dashboard'
                  ? 'bg-white text-rose-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rescue Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('missions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'missions'
                  ? 'bg-white text-rose-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Assigned Missions</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                {activeMissions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('updates')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'updates'
                  ? 'bg-white text-rose-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mission Updates & Telemetry
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('routes')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'routes'
                  ? 'bg-white text-rose-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Road Clearance & Corridors
            </button>

            <button
              type="button"
              onClick={() => navigateSubpage('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSubpage === 'history'
                  ? 'bg-white text-rose-800 shadow-xs border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              <span>Completed Log</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                {completedTasks.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {/* SUBPAGE 1: RESCUE DASHBOARD */}
        {activeSubpage === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Active Missions</span>
                  <Truck size={15} className="text-rose-700" />
                </div>
                <div className="text-2xl font-bold text-rose-700">{activeMissions.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Dispatched by Officer HQ</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Unit Readiness</span>
                  <CheckCircle2 size={15} className="text-emerald-700" />
                </div>
                <div className="text-2xl font-bold text-emerald-700">DEPLOYED</div>
                <div className="text-[11px] text-slate-500 mt-1">Equipped with heavy gear</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Evacuees Supported</span>
                  <Users size={15} className="text-sky-700" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {selectedTask?.affected_people_count || (dataMode === 'demo' ? 14 : 0)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Directly assisted on site</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Operational Mode</span>
                  <Activity size={15} className="text-slate-500" />
                </div>
                <div className="text-base font-bold text-slate-900 uppercase">{dataMode}</div>
                <div className="text-[11px] text-slate-500 mt-1">Telemetry stream synchronized</div>
              </div>
            </div>

            {/* Current Active Mission Highlight */}
            {selectedTask ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        {selectedTask.severity} EMERGENCY
                      </span>
                      {dataMode === 'demo' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          DEMO / SIMULATED MISSION
                        </span>
                      )}
                      <span className="font-mono text-xs text-slate-400">ID: {selectedTask.id}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedTask.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin size={13} className="text-rose-700" />
                      <span>{selectedTask.location}, {selectedTask.district}</span>
                      <span className="text-slate-400 font-mono">({selectedTask.lat}°N, {selectedTask.lon}°E)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUpdateModalOpen(true)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Post Mission Update</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateSubpage('missions')}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Workflow Progress Bar */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 block">Current Response Stage:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                    {WORKFLOW_STEPS.map((step) => {
                      const isCurrent = selectedTask.status === step.id
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => handleTransitionStatus(selectedTask.id, step.id)}
                          className={`py-2 px-2.5 rounded-lg border text-center transition-colors cursor-pointer text-xs font-semibold ${
                            isCurrent
                              ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {step.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Directives from Officer */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-slate-900">Officer HQ Dispatch Directives:</div>
                  <p className="text-slate-700 leading-relaxed">{selectedTask.instructions}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
                <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Live Missions Dispatched</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No live mission data available from the connected system. Tactical response units remain on standby readiness in {activeDistrict}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SUBPAGE 2: ASSIGNED MISSIONS */}
        {activeSubpage === 'missions' && (
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Assigned Response Missions</h2>
                <p className="text-xs text-slate-500">
                  Search and manage tasks dispatched directly to your unit by Officer Command
                </p>
              </div>
              <button
                type="button"
                onClick={loadData}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                <span>Refresh Missions</span>
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 shadow-xs">
                <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  {dataMode === 'live' ? 'No Live Missions Dispatched' : 'No Simulated Missions in Queue'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {dataMode === 'live'
                    ? 'No live mission data available from the connected system. All tactical response units remain on active standby.'
                    : 'No simulated rescue missions currently active for this sector.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className={`bg-white border rounded-xl p-5 shadow-xs space-y-3 ${
                      selectedTask?.id === task.id ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{task.id}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            {task.severity}
                          </span>
                          {dataMode === 'demo' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              DEMO MISSION
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            Status: {task.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <MapPin size={13} className="text-rose-700" />
                        <span>{task.location}, {task.district}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task)
                          setUpdateModalOpen(true)
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Update Mission</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-slate-900">Operational Directives:</div>
                    <p className="text-slate-700 leading-relaxed">{task.instructions}</p>
                    {task.hazard_details && (
                      <p className="text-slate-600 text-[11px] pt-1">
                        <strong>Hazard Details:</strong> {task.hazard_details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* SUBPAGE 3: MISSION UPDATES */}
        {activeSubpage === 'updates' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900">Post Mission Update & Telemetry</h2>
              <p className="text-xs text-slate-500">
                Transmit field progress, casualties, evacuated population count, and road conditions back to Officer HQ
              </p>
            </div>

            {selectedTask ? (
              <form onSubmit={handleSubmitProgress} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">ACTIVE TARGET:</span>
                  <div className="text-base font-bold text-slate-900">{selectedTask.title} ({selectedTask.id})</div>
                  <div className="text-xs text-slate-500">{selectedTask.location}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Casualties Count</label>
                    <input
                      type="number"
                      min={0}
                      value={casualties}
                      onChange={(e) => setCasualties(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Evacuated / Affected Citizens</label>
                    <input
                      type="number"
                      min={0}
                      value={affectedPeople}
                      onChange={(e) => setAffectedPeople(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Road & Corridor Access Status</label>
                  <select
                    value={roadStatus}
                    onChange={(e) => setRoadStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600"
                  >
                    <option value="Open and clear">Open and clear</option>
                    <option value="Partially blocked (Single lane clear)">Partially blocked (Single lane clear)</option>
                    <option value="Blocked with debris / Impassable">Blocked with debris / Impassable</option>
                    <option value="Active mudflow across carriageway">Active mudflow across carriageway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Progress Notes & Observations *</label>
                  <textarea
                    required
                    rows={4}
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Document search and rescue activities, heavy equipment status, barrier construction, evacuation progress..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 leading-relaxed"
                  />
                </div>

                {/* Additional Support Needed Checkbox */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-900">
                    <input
                      type="checkbox"
                      checked={requestSupport}
                      onChange={(e) => setRequestSupport(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>Request Urgent Reinforcements / Specialized Heavy Machinery</span>
                  </label>
                  {requestSupport && (
                    <input
                      type="text"
                      value={supportDetails}
                      onChange={(e) => setSupportDetails(e.target.value)}
                      placeholder="Specify requirements: e.g. 2x excavators, trauma medical units, rescue boats..."
                      className="w-full px-3 py-2 border border-rose-300 bg-white rounded-lg text-slate-900 text-xs mt-2"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="w-full py-3 px-4 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{submittingUpdate ? 'Transmitting to Officer HQ...' : 'Transmit Mission Progress to Officer HQ'}</span>
                </button>
              </form>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
                <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Select a Mission to Update</h3>
                <p className="text-xs text-slate-500">Pick an active task from the Assigned Missions tab first.</p>
                <button
                  type="button"
                  onClick={() => navigateSubpage('missions')}
                  className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Go to Missions
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBPAGE 4: ROAD CLEARANCE & CORRIDORS */}
        {activeSubpage === 'routes' && (
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900">Road Corridors & Clearance Assessment</h2>
              <p className="text-xs text-slate-500">
                Safe access routes, active blockages, and bypass advisories for disaster response fleets
              </p>
            </div>

            {dataMode === 'live' ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 shadow-xs">
                <Route className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Active Road Blockages or Tactical Corridors</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No verified live road closures or emergency corridors reported from connected sources. All primary arterial routes in {activeDistrict} are operating normally.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <Route size={16} className="text-rose-700" />
                      <span>Corridor Charlie (Upper Ridge Bypass)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        DEMO DATA
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        RECOMMENDED
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div><strong>Distance:</strong> 24.6 km · <strong>Estimated Transit:</strong> 45 min</div>
                    <div><strong>Risk Assessment:</strong> Low (Stable bedrock ridge alignment)</div>
                    <p className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-700 leading-relaxed">
                      Recommended for all emergency convoys and civilian evacuation. Completely clear of unstable scree slopes.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <Route size={16} className="text-rose-700" />
                      <span>NH-102B Mountain Highway</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        DEMO DATA
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        IMPASSABLE / BLOCKED
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div><strong>Distance:</strong> 18.2 km · <strong>Estimated Transit:</strong> Closed</div>
                    <div><strong>Risk Assessment:</strong> Extreme</div>
                    <p className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-900 leading-relaxed">
                      Active debris slump at KM-42 blocks both carriageways. Heavy earthmoving equipment currently deployed for clearance.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBPAGE 5: COMPLETED MISSIONS LOG */}
        {activeSubpage === 'history' && (
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Completed Operations Archive</h2>
                <p className="text-xs text-slate-500">
                  Archived missions resolved and signed off by Officer Control Center
                </p>
              </div>
            </div>

            {completedTasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Resolved Tasks in Current Mode</h3>
                <p className="text-xs text-slate-500">Completed response operations will appear in this audit log.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((t: any) => (
                  <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{t.id}</span>
                        <h4 className="font-bold text-slate-900">{t.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        COMPLETED
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">Location: {t.location}, {t.district}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Progress Update Modal */}
      {updateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-start justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Post Mission Update</h3>
                <p className="text-[11px] text-slate-500">{selectedTask?.title || 'Selected Mission'}</p>
              </div>
              <button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitProgress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Casualties</label>
                  <input
                    type="number"
                    min={0}
                    value={casualties}
                    onChange={(e) => setCasualties(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Evacuated People</label>
                  <input
                    type="number"
                    min={0}
                    value={affectedPeople}
                    onChange={(e) => setAffectedPeople(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Road Condition</label>
                <select
                  value={roadStatus}
                  onChange={(e) => setRoadStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                >
                  <option value="Open and clear">Open and clear</option>
                  <option value="Partially blocked (Single lane clear)">Partially blocked (Single lane clear)</option>
                  <option value="Blocked with debris / Impassable">Blocked with debris / Impassable</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Progress Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Record tactical details, cleared lanes, evacuees sheltered..."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingUpdate ? 'Transmitting...' : 'Post Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-500 text-[11px]">
        SENTINEL NER · Rescue Operations Portal · Department of Disaster Management & NDRF
      </footer>
    </div>
  )
}
