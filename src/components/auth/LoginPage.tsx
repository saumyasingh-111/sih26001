import React, { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Lock,
  Mountain,
  Radio,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  Users,
} from 'lucide-react'
import { useAuth, DEMO_CREDENTIALS, UserRole } from '../../context/AuthContext'

interface LoginPageProps {
  go: (route: string) => void
  notify: (msg: string, tone?: 'success' | 'error') => void
  initialRedirect?: string
}

export function LoginPage({ go, notify, initialRedirect }: LoginPageProps) {
  const { login, register, switchDemoRole } = useAuth()

  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const redirectUserByRole = (role: UserRole) => {
    if (initialRedirect) {
      go(initialRedirect)
      return
    }
    switch (role) {
      case 'officer':
        go('officer')
        break
      case 'field_reporter':
        go('field')
        break
      case 'rescue_team':
        go('rescue')
        break
      case 'citizen':
      default:
        go('citizen')
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (isRegistering) {
        if (!username || !email || !password || !fullName) {
          setErrorMsg('All fields are required.')
          setLoading(false)
          return
        }
        const user = await register({
          username,
          email,
          password,
          full_name: fullName,
        })
        notify(`Citizen account created! Welcome ${user.full_name}.`, 'success')
        redirectUserByRole(user.role)
      } else {
        if (!username || !password) {
          setErrorMsg('Username/email and password required.')
          setLoading(false)
          return
        }
        const user = await login(username, password)
        notify(`Signed in as ${user.full_name} (${user.role})`, 'success')
        redirectUserByRole(user.role)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemoLogin = async (targetRole: UserRole) => {
    setErrorMsg('')
    setLoading(true)
    try {
      const user = await switchDemoRole(targetRole)
      notify(`Signed in as ${user.full_name}`, 'success')
      redirectUserByRole(user.role)
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => go('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <Mountain size={18} />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none block">
                SENTINEL <span className="text-emerald-700">NER</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                Disaster Early Warning Platform
              </span>
            </div>
          </button>

          <button
            onClick={() => go('citizen')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors cursor-pointer"
          >
            <Globe2 size={13} className="text-emerald-700" />
            <span>Public Safety Portal</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 py-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Information Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-semibold">
            <Mountain size={13} />
            <span>ROLE-BASED DISASTER PLATFORM</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Integrated Landslide Risk & Operations Command
          </h1>

          <p className="text-xs text-slate-600 leading-relaxed">
            Sentinel NER coordinates disaster management across four dedicated, authenticated interfaces connected to a shared intelligence backbone.
          </p>

          <div className="space-y-2.5 pt-2 text-xs">
            <div className="flex items-start gap-2.5 text-slate-700 p-2.5 bg-white border border-slate-200 rounded-lg">
              <ShieldCheck size={16} className="text-emerald-700 mt-0.5 flex-shrink-0" />
              <div>
                <b className="text-slate-900">Officer HQ:</b>
                <span className="text-slate-600 block text-[11px]">Regional GIS, risk forecasting, incident verification & alert publishing.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700 p-2.5 bg-white border border-slate-200 rounded-lg">
              <Radio size={16} className="text-sky-700 mt-0.5 flex-shrink-0" />
              <div>
                <b className="text-slate-900">Field Reporter Portal:</b>
                <span className="text-slate-600 block text-[11px]">Mobile geotagged observations, sensor telemetry & urgent escalation.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700 p-2.5 bg-white border border-slate-200 rounded-lg">
              <Truck size={16} className="text-rose-700 mt-0.5 flex-shrink-0" />
              <div>
                <b className="text-slate-900">Rescue Operations:</b>
                <span className="text-slate-600 block text-[11px]">Task dispatch, tactical response workflow & hazard corridor updates.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700 p-2.5 bg-white border border-slate-200 rounded-lg">
              <Globe2 size={16} className="text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <b className="text-slate-900">Citizen Portal:</b>
                <span className="text-slate-600 block text-[11px]">Public risk maps, evacuation guidance & voice reporting.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Column */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isRegistering ? 'Register Citizen Account' : 'Authorized Access'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isRegistering ? 'Sign up to submit and track community landslide warnings' : 'Sign in to access your authorized role interface'}
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              SECURE RBAC
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle size={15} className="text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            {isRegistering && (
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                {isRegistering ? 'Username' : 'Username or Official Email'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegistering ? 'citizen_priya' : 'officer@sentinel.ner'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none font-mono"
              />
            </div>

            {isRegistering && (
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <Lock size={13} />
              <span>{loading ? 'Authenticating...' : isRegistering ? 'Create Citizen Account' : 'Sign In to Portal'}</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering)
                setErrorMsg('')
              }}
              className="text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register as Citizen"}
            </button>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>One-Click Role Authentication (Demo)</span>
              <span className="text-emerald-700">Pre-seeded Accounts</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('officer')}
                disabled={loading}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-left text-slate-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck size={16} className="text-emerald-700 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-900">Officer HQ</div>
                  <div className="text-[10px] text-slate-500">Control Center</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('field_reporter')}
                disabled={loading}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-left text-slate-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Radio size={16} className="text-sky-700 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-900">Field Monitor</div>
                  <div className="text-[10px] text-slate-500">Ground Reporter</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('rescue_team')}
                disabled={loading}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-left text-slate-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Truck size={16} className="text-rose-700 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-900">Rescue Unit</div>
                  <div className="text-[10px] text-slate-500">NDRF Response</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('citizen')}
                disabled={loading}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-left text-slate-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Globe2 size={16} className="text-amber-700 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-900">Local Citizen</div>
                  <div className="text-[10px] text-slate-500">Community Safety</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-500 text-[11px]">
        SENTINEL NER · AI-Powered Landslide Risk & Operations Platform · India North Eastern Region
      </footer>
    </div>
  )
}
