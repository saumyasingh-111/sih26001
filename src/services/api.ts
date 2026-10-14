/**
 * Sentinel NER - Shared API Service
 * Connects all four role-protected portals to the central FastAPI backend & SQLite database.
 */

const API_BASE = '/api'

export function getAuthToken(): string | null {
  return localStorage.getItem('sentinel_token')
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('sentinel_token', token)
  } else {
    localStorage.removeItem('sentinel_token')
  }
}

export function getDataMode(): 'live' | 'demo' {
  return (localStorage.getItem('sentinel_data_mode') as 'live' | 'demo') || 'live'
}

export function setDataMode(mode: 'live' | 'demo') {
  localStorage.setItem('sentinel_data_mode', mode)
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const dataMode = getDataMode()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Sentinel-Mode': dataMode,
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorDetail = 'Request failed'
    try {
      const errorJson = await response.json()
      errorDetail = errorJson.detail || JSON.stringify(errorJson)
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`
    }
    const error: any = new Error(errorDetail)
    error.status = response.status
    throw error
  }

  return response.json()
}

// ---------------------------------------------------------------------------
// Authentication API
// ---------------------------------------------------------------------------
export const authApi = {
  login: (username_or_email: string, password: string) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email, password }),
    }),

  register: (payload: { username: string; email: string; password: string; full_name: string; district?: string; phone?: string }) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),
}

// ---------------------------------------------------------------------------
// Citizen Portal API (/citizen)
// ---------------------------------------------------------------------------
export const citizenApi = {
  getPublicFeed: (district?: string) =>
    request<{ alerts: any[]; risk_zones: any[]; timestamp: string }>(
      `/citizen/public-feed${district ? `?district=${encodeURIComponent(district)}` : ''}`
    ),

  getSafetyGuidance: (district?: string) =>
    request<{
      district: string
      emergency_contacts: any[]
      designated_shelters: any[]
      evacuation_routes: any[]
    }>(`/citizen/safety-guidance${district ? `?district=${encodeURIComponent(district)}` : ''}`),

  submitReport: (payload: {
    citizen_name: string
    phone?: string
    location: string
    district: string
    lat: number
    lon: number
    report_type: string
    description: string
    image_url?: string
    severity?: string
  }) =>
    request<{ success: boolean; report_id: string; message: string; status: string; created_at: string }>(
      '/citizen/reports',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  getMyReports: () =>
    request<{ citizen_name: string; count: number; reports: any[] }>('/citizen/my-reports'),
}

// ---------------------------------------------------------------------------
// Field Reporter Portal API (/field)
// ---------------------------------------------------------------------------
export const fieldApi = {
  getMyZones: () =>
    request<{ reporter_id: number; reporter_name: string; assigned_zones: any[] }>('/field/my-zones'),

  submitObservation: (payload: {
    zone_id?: string
    location: string
    district: string
    lat: number
    lon: number
    condition_category: string
    sensor_readings?: Record<string, any>
    description: string
    image_url?: string
    is_urgent?: boolean
  }) =>
    request<{ success: boolean; observation_id: string; status: string; is_urgent: boolean; timestamp: string; message: string }>(
      '/field/observations',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  getMyObservations: () =>
    request<{ count: number; observations: any[] }>('/field/my-observations'),

  urgentEscalation: (payload: {
    location: string
    district: string
    lat: number
    lon: number
    hazard_summary: string
    immediate_threat: string
  }) =>
    request<{ success: boolean; escalation_id: string; message: string; status: string; timestamp: string }>(
      '/field/urgent-escalation',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
}

// ---------------------------------------------------------------------------
// Officer Control Center API (/officer)
// ---------------------------------------------------------------------------
export const officerApi = {
  getOverview: () =>
    request<{ metrics: Record<string, number>; system_status: string; timestamp: string }>('/officer/overview'),

  getCitizenReports: (district?: string, status_filter?: string) => {
    const params = new URLSearchParams()
    if (district) params.append('district', district)
    if (status_filter) params.append('status_filter', status_filter)
    return request<{ reports: any[] }>(`/officer/citizen-reports?${params.toString()}`)
  },

  reviewCitizenReport: (reportId: string, status: string, officer_notes: string, severity?: string) =>
    request<{ success: boolean; report_id: string; status: string }>(`/officer/citizen-reports/${reportId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, officer_notes, severity }),
    }),

  getFieldObservations: (district?: string) =>
    request<{ observations: any[] }>(`/officer/field-observations${district ? `?district=${encodeURIComponent(district)}` : ''}`),

  reviewFieldObservation: (obsId: string, status: string, officer_notes: string, create_incident = false) =>
    request<{ success: boolean; observation_id: string; status: string; escalated_incident_id?: string }>(
      `/officer/field-observations/${obsId}/review`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, officer_notes, create_incident }),
      }
    ),

  getZones: () => request<{ zones: any[] }>('/officer/zones'),

  getFieldReporters: () => request<{ reporters: any[] }>('/officer/field-reporters'),

  assignZoneReporter: (zone_id: string, reporter_id: number, reporting_interval_hours: number, vulnerability_notes?: string) =>
    request<{ success: boolean; zone_id: string; assigned_to: string }>('/officer/zones/assign', {
      method: 'POST',
      body: JSON.stringify({ zone_id, reporter_id, reporting_interval_hours, vulnerability_notes }),
    }),

  getAlerts: () => request<{ alerts: any[] }>('/officer/alerts'),

  createAlert: (payload: {
    title: string
    level: string
    location: string
    district: string
    cause: string
    risk_score: number
    is_public: boolean
    target_areas: string
    safety_instructions: string
  }) =>
    request<{ success: boolean; alert_id: string; is_public: boolean; status: string }>('/officer/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleAlertPublish: (alertId: string, is_public: boolean, status = 'PUBLISHED') =>
    request<{ success: boolean; alert_id: string; is_public: boolean; status: string }>(
      `/officer/alerts/${alertId}/publish`,
      {
        method: 'PUT',
        body: JSON.stringify({ is_public, status }),
      }
    ),

  getRescueTeams: () => request<{ rescue_teams: any[] }>('/officer/rescue-teams'),

  getRescueTasks: () => request<{ rescue_tasks: any[] }>('/officer/rescue-tasks'),

  assignRescueTask: (payload: {
    incident_id?: string
    alert_id?: string
    team_id: number
    title: string
    district: string
    location: string
    lat: number
    lon: number
    severity: string
    hazard_details: string
    instructions: string
    safe_routes?: any[]
  }) =>
    request<{ success: boolean; task_id: string; assigned_to: string; status: string }>('/officer/rescue-tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getIncidents: () => request<{ incidents: any[] }>('/officer/incidents'),

  resolveIncident: (incidentId: string, resolution_notes: string) =>
    request<{ success: boolean; incident_id: string; status: string }>(`/officer/incidents/${incidentId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolution_notes }),
    }),

  getAuditLogs: () => request<{ audit_logs: any[] }>('/officer/audit-logs'),

  getUsers: () => request<{ users: any[] }>('/officer/users'),

  updateUserRole: (userId: number, role: string, district?: string) =>
    request<{ success: boolean; user_id: number; role: string }>(`/officer/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, district }),
    }),
}

// ---------------------------------------------------------------------------
// Rescue Operations Portal API (/rescue)
// ---------------------------------------------------------------------------
export const rescueApi = {
  getMyTasks: () => request<{ team_name: string; count: number; tasks: any[] }>('/rescue/my-tasks'),

  updateTaskStatus: (taskId: string, status: string, notes?: string) =>
    request<{ success: boolean; task_id: string; status: string }>(`/rescue/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  submitProgressUpdate: (taskId: string, payload: {
    status: string
    notes: string
    casualties?: number
    affected_people?: number
    road_status?: string
    photo_url?: string
    request_additional_support?: boolean
    additional_support_details?: string
  }) =>
    request<{ success: boolean; task_id: string; status: string; message: string }>(
      `/rescue/tasks/${taskId}/updates`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  getMyHistory: () => request<{ completed_tasks: any[] }>('/rescue/my-history'),
}
