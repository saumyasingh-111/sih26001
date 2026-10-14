// @ts-nocheck
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Globe2,
  Lock,
  LogOut,
  Mountain,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  Users,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { DataProvider, useDataContext } from './context/DataContext'
import { AuthProvider, useAuth, UserRole } from './context/AuthContext'
import { EnhancedLanding } from './components/landing/EnhancedLanding'
import { LoginPage } from './components/auth/LoginPage'
import { CitizenPortal } from './components/citizen/CitizenPortal'
import { FieldReporterPortal } from './components/field/FieldReporterPortal'
import { OfficerControlCenter } from './components/officer/OfficerControlCenter'
import { RescueOperationsPortal } from './components/rescue/RescueOperationsPortal'

export type AppRoute =
  | 'home'
  | 'login'
  | 'citizen'
  | 'field'
  | 'officer'
  | 'rescue'

type Toast = { message: string; tone?: 'success' | 'error' }

const parseRouteFromPath = (): AppRoute => {
  const path = window.location.pathname.replace(/^\//, '').toLowerCase() || 'home'
  if (path === '' || path === 'home') return 'home'
  if (path === 'login') return 'login'
  if (path === 'citizen' || path.startsWith('citizen/')) return 'citizen'
  if (path === 'field' || path.startsWith('field/') || path === 'field-reports') return 'field'
  if (path === 'rescue' || path.startsWith('rescue/') || path === 'response-planning') return 'rescue'
  if (
    path === 'officer' ||
    path.startsWith('officer/') ||
    path === 'command-center' ||
    path === 'gis' ||
    path === 'risk-intelligence' ||
    path === 'alerts' ||
    path === 'analytics' ||
    path === 'incidents'
  ) {
    return 'officer'
  }
  return 'home'
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  )
}

function AppContent() {
  const [route, setRoute] = useState<AppRoute>(parseRouteFromPath)
  const [toast, setToast] = useState<Toast | null>(null)
  const { user, loading: authLoading } = useAuth()
  const { alerts, setAlerts, incident, setIncident, activeDistrict, userLocation } = useDataContext()

  const go = (next: string) => {
    let cleanNext = next.replace(/^\//, '')
    if (cleanNext === '') cleanNext = 'home'
    window.history.pushState({}, '', cleanNext === 'home' ? '/' : `/${cleanNext}`)
    setRoute(parseRouteFromPath())
    window.scrollTo(0, 0)
  }

  const notify = (message: string, tone: Toast['tone'] = 'success') => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => {
    const handlePop = () => setRoute(parseRouteFromPath())
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  // Emergency simulation trigger (for Officer Portal)
  const simulateCrisis = () => {
    const loc = incident?.location || `${activeDistrict} KM-42 Ridge Corridor`
    const newAlert = {
      id: `ALT-SIM-${Date.now() % 1000}`,
      level: 'CRITICAL',
      title: 'Monsoon Deluge Emergency Escalation',
      location: loc,
      risk: 94,
      cause: 'Intense 240mm Deluge + active tension crack propagation + blocked bypass',
      status: 'PUBLISHED',
      time: 'Just now',
    }
    const nextIncident = {
      ...incident,
      responseStatus: 'RESPONDING',
      officerDecision: 'APPROVED',
      severity: 'CRITICAL',
      riskScore: 94,
      priorityScore: 96,
      timeline: [
        ...(incident?.timeline || []),
        {
          id: `sim-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          label: 'Crisis Escalation',
          detail: 'Officer simulated extreme monsoon deluge in Churachandpur sector.',
          tone: 'approved',
        },
      ],
    }
    setIncident(nextIncident)
    setAlerts([newAlert, ...(alerts || [])])
    notify('Crisis scenario simulation executed! Updated operational telemetry.', 'success')
  }

  // 1. Landing / Entry Page (Public)
  if (route === 'home') {
    return <EnhancedLanding go={go} />
  }

  // 2. Login Page
  if (route === 'login') {
    return <LoginPage go={go} notify={notify} />
  }

  // 3. Citizen Portal (Publicly accessible, auth optional for personal tracking)
  if (route === 'citizen') {
    return (
      <div className="relative">
        <CitizenPortal go={go} notify={notify} />
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-xs font-mono font-bold text-white ${
            toast.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}>
            <Check size={14} />
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    )
  }

  // 4. Role Guard: Field Reporter Portal
  if (route === 'field') {
    if (authLoading) {
      return <LoadingScreen />
    }
    if (!user) {
      return (
        <RequireAuthScreen
          targetRole="field_reporter"
          portalName="Field Reporter Portal"
          go={go}
        />
      )
    }
    if (user.role !== 'field_reporter' && user.role !== 'officer') {
      return (
        <AccessDeniedScreen
          requiredRole="field_reporter"
          currentRole={user.role}
          userName={user.full_name}
          portalName="Field Reporter Portal"
          go={go}
        />
      )
    }
    return (
      <div className="relative">
        <FieldReporterPortal go={go} notify={notify} />
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-xs font-mono font-bold text-white ${
            toast.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}>
            <Check size={14} />
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    )
  }

  // 5. Role Guard: Officer Control Center
  if (route === 'officer') {
    if (authLoading) {
      return <LoadingScreen />
    }
    if (!user) {
      return (
        <RequireAuthScreen
          targetRole="officer"
          portalName="Officer Control Center"
          go={go}
        />
      )
    }
    if (user.role !== 'officer') {
      return (
        <AccessDeniedScreen
          requiredRole="officer"
          currentRole={user.role}
          userName={user.full_name}
          portalName="Officer Control Center"
          go={go}
        />
      )
    }
    return (
      <div className="relative">
        <OfficerControlCenter go={go} notify={notify} simulate={simulateCrisis} />
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-xs font-mono font-bold text-white ${
            toast.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}>
            <Check size={14} />
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    )
  }

  // 6. Role Guard: Rescue Operations Portal
  if (route === 'rescue') {
    if (authLoading) {
      return <LoadingScreen />
    }
    if (!user) {
      return (
        <RequireAuthScreen
          targetRole="rescue_team"
          portalName="Rescue Operations Portal"
          go={go}
        />
      )
    }
    if (user.role !== 'rescue_team' && user.role !== 'officer') {
      return (
        <AccessDeniedScreen
          requiredRole="rescue_team"
          currentRole={user.role}
          userName={user.full_name}
          portalName="Rescue Operations Portal"
          go={go}
        />
      )
    }
    return (
      <div className="relative">
        <RescueOperationsPortal go={go} notify={notify} />
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-xs font-mono font-bold text-white ${
            toast.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'
          }`}>
            <Check size={14} />
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    )
  }

  return <EnhancedLanding go={go} />
}

// ---------------------------------------------------------------------------
// Security & Access Denied Views
// ---------------------------------------------------------------------------

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 font-mono text-xs space-y-3">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <span className="font-semibold text-slate-700">VERIFYING SENTINEL NER CREDENTIALS...</span>
    </div>
  )
}

function RequireAuthScreen({
  targetRole,
  portalName,
  go,
}: {
  targetRole: UserRole
  portalName: string
  go: (r: string) => void
}) {
  const { switchDemoRole } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <Lock size={22} />
        </div>

        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          Authentication Required
        </h1>

        <p className="text-xs text-slate-600 leading-relaxed">
          The <b>{portalName}</b> contains protected disaster operations and telemetry. Please authenticate with an authorized account to enter.
        </p>

        <div className="pt-2 space-y-2">
          <button
            onClick={() => go('login')}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            Sign In to Sentinel NER
          </button>

          <button
            onClick={() => switchDemoRole(targetRole).then(() => go(targetRole === 'field_reporter' ? 'field' : targetRole === 'rescue_team' ? 'rescue' : 'officer'))}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-medium text-xs transition-colors cursor-pointer"
          >
            Authenticate with Demo {portalName.split(' ')[0]} Account
          </button>

          <button
            onClick={() => go('citizen')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium block mx-auto pt-2 cursor-pointer"
          >
            Return to Public Safety Portal
          </button>

          <button
            onClick={() => go('home')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium block mx-auto cursor-pointer"
          >
            ← Return to Sentinel NER Home
          </button>
        </div>
      </div>
    </div>
  )
}

function AccessDeniedScreen({
  requiredRole,
  currentRole,
  userName,
  portalName,
  go,
}: {
  requiredRole: string
  currentRole: string
  userName: string
  portalName: string
  go: (r: string) => void
}) {
  const { logout } = useAuth()

  const getAuthorizedPortal = () => {
    switch (currentRole) {
      case 'citizen':
        return 'citizen'
      case 'field_reporter':
        return 'field'
      case 'rescue_team':
        return 'rescue'
      case 'officer':
        return 'officer'
      default:
        return 'citizen'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
          <ShieldAlert size={22} />
        </div>

        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-semibold uppercase">
            HTTP 403 · Access Denied
          </span>
          <h1 className="text-base font-bold text-slate-900 mt-2">
            Role Boundary Protection Active
          </h1>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          You are currently signed in as <b>{userName}</b> with role{' '}
          <span className="font-mono text-amber-800 uppercase font-semibold">'{currentRole}'</span>. The <b>{portalName}</b> is strictly restricted to accounts with role{' '}
          <span className="font-mono text-emerald-800 uppercase font-semibold">'{requiredRole}'</span>.
        </p>

        <div className="pt-2 space-y-2">
          <button
            onClick={() => go(getAuthorizedPortal())}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            Go to Your Authorized {currentRole.replace('_', ' ').toUpperCase()} Portal
          </button>

          <button
            onClick={() => {
              logout()
              go('home')
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-medium text-xs transition-colors cursor-pointer"
          >
            Sign Out to Sentinel NER Home
          </button>

          <button
            onClick={() => go('citizen')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium block mx-auto pt-2 cursor-pointer"
          >
            Return to Public Safety Portal
          </button>

          <button
            onClick={() => go('home')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium block mx-auto cursor-pointer"
          >
            ← Return to Sentinel NER Home
          </button>
        </div>
      </div>
    </div>
  )
}
