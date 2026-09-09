// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BrainCircuit,
  Check,
  ChevronDown,
  CloudRain,
  CloudSun,
  Compass,
  Crosshair,
  Database,
  Download,
  FileText,
  Globe2,
  Layers3,
  LocateFixed,
  Menu,
  Mic,
  MicOff,
  Mountain,
  Radio,
  RefreshCw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Waves,
  X,
  Zap,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Alert,
  AlertStatus,
  Detection,
  FieldReport,
  Incident,
  Region,
  RiskLevel,
  calculateRisk,
  detections,
  environmentSeries,
  initialAlerts,
  initialIncident,
  initialReports,
  loadState,
  priorityLevel,
  regions,
  riskLevel,
  saveState,
  sourceNames,
} from "./data/demoData";
import {
  assessRegion,
  buildSituationBrief,
  createFieldReport,
} from "./services/demoServices";

// Upgraded UI/UX Components
import { TopNav, Brand } from "./components/navbar/TopNav";
import { EnhancedLanding } from "./components/landing/EnhancedLanding";
import { CommandCenterOperations } from "./components/command-center/CommandCenterOperations";
// import { GISWorkstation } from "./components/gis/GISWorkstation";
import { RiskIntelligenceWorkspace } from "./components/risk/RiskIntelligenceWorkspace";
import { UnifiedFieldReportsWorkspace } from "./components/field-reports/UnifiedFieldReportsWorkspace";
import { EnvironmentMonitoring } from "./components/environment/EnvironmentMonitoring";
import { AnalyticsDashboard } from "./components/analytics/AnalyticsDashboard";
import { DataProvider, useDataContext } from "./context/DataContext";

type RouteName =
  | "home"
  | "login"
  | "command-center"
  | "risk-intelligence"
  | "field-reports"
  | "gis"
  | "alerts"
  | "response-planning"
  | "analytics"
  | "environment"
  | "incidents"
  | "settings";
type Toast = { message: string; tone?: "success" | "error" };
const routeFromPath = (): RouteName => {
  const path = window.location.pathname.replace(/^\//, "") || "home";
  return (
    [
      "home",
      "login",
      "command-center",
      "risk-intelligence",
      "field-reports",
      "alerts",
      "response-planning",
      "analytics",
      "environment",
      "incidents",
      "settings",
    ].includes(path)
      ? path
      : "home"
  ) as RouteName;
};
const labels: Record<RouteName, string> = {
  home: "Home",
  login: "Login",
  "command-center": "Command Center",
  "risk-intelligence": "Risk Intelligence",
  "field-reports": "Field Reports",
  gis: "GIS Layers",
  alerts: "Alert Center",
  "response-planning": "Response Planning",
  analytics: "Analytics",
  environment: "Environmental Monitoring",
  incidents: "Incident Management",
  settings: "Profile & Settings",
};
const nav = [
  {
    label: "Command Center",
    icon: Crosshair,
    route: "command-center" as RouteName,
  },
  {
    label: "Risk Intelligence",
    icon: BrainCircuit,
    route: "risk-intelligence" as RouteName,
  },
  {
    label: "Field Reports",
    icon: FileText,
    route: "field-reports" as RouteName,
  },
  { label: "GIS Layers", icon: Layers3, route: "gis" as RouteName },
  { label: "Alert Center", icon: Radio, route: "alerts" as RouteName },
  {
    label: "Response Planning",
    icon: Route,
    route: "response-planning" as RouteName,
  },
  { label: "Analytics", icon: BarChart3, route: "analytics" as RouteName },
];

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

function AppContent() {
  const [route, setRoute] = useState<RouteName>(routeFromPath);
  const {
    dataMode,
    isDemoMode,
    setMode,
    userLocation,
    isNER,
    activeDistrict,
    setActiveDistrict,
    activeRegion,
    liveRiskScore,
    alerts,
    setAlerts,
    incident,
    setIncident,
    reports,
    setReports,
  } = useDataContext();

  const [sources, setSources] = useState<Record<string, boolean>>(
    loadState(
      "sources",
      Object.fromEntries(sourceNames.map((name) => [name, true])),
    ),
  );
  const [notifications, setNotifications] = useState(
    isDemoMode
      ? [
          "Critical landslide risk detected in Churachandpur",
          "New field report received",
          "Rainfall threshold exceeded",
        ]
      : ["Operational status normal", "Live GPS tracking active"],
  );
  const [modal, setModal] = useState<string | null>(null),
    [selectedAlert, setSelectedAlert] = useState<Alert | null>(null),
    [selectedReport, setSelectedReport] = useState<FieldReport | null>(null),
    [toast, setToast] = useState<Toast | null>(null),
    [menuOpen, setMenuOpen] = useState(false),
    [search, setSearch] = useState("");
  const region = activeRegion,
    score = liveRiskScore;
  const go = (next: RouteName) => {
    window.history.pushState({}, "", next === "home" ? "/" : `/${next}`);
    setRoute(next);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };
  const notify = (message: string, tone: Toast["tone"] = "success") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2800);
  };
  useEffect(() => {
    const pop = () => setRoute(routeFromPath());
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModal("search");
      }
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    const open = () => setModal("sources");
    document.addEventListener("open-sources", open);
    return () => document.removeEventListener("open-sources", open);
  }, []);
  useEffect(() => {
    const select = (event: Event) =>
      setActiveDistrict((event as CustomEvent<string>).detail);
    document.addEventListener("select-region", select);
    return () => document.removeEventListener("select-region", select);
  }, [setActiveDistrict]);
  const simulate = () => {
    const loc =
      incident?.location || `${userLocation?.displayName || "Active Sector"}`;
    const alert: Alert = {
      id: `ALT-${33 + alerts.length}`,
      level: "CRITICAL",
      title: "Emergency simulation escalation",
      location: loc,
      risk: 94,
      cause: "Rainfall + satellite change + voice field evidence",
      status: "NEW",
      time: "Just now",
    };
    const nextIncident: Incident = incident
      ? {
          ...incident,
          responseStatus: "APPROVED FOR RESPONSE",
          officerDecision: "APPROVED",
          connectivity: "BLACKOUT",
          timeline: [
            ...incident.timeline,
            {
              id: `simulation-${Date.now()}`,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              label: "Approved",
              detail: "Officer approved response plan in simulation",
              tone: "approved",
            },
            {
              id: `assigned-${Date.now()}`,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              label: "Assigned",
              detail: "Field team assigned to Route C",
              tone: "assigned",
            },
          ],
        }
      : {
          id: "SNR-SIM-01",
          location: loc,
          district: activeDistrict,
          coordinates: [24.33, 93.67],
          severity: "CRITICAL",
          riskScore: 94,
          priorityScore: 94,
          confidence: 94,
          connectivity: "BLACKOUT",
          lastSignal: "Just now",
          affectedArea: "14.2 km²",
          officerDecision: "APPROVED",
          responseStatus: "APPROVED FOR RESPONSE",
          timeline: [
            {
              id: `simulation-${Date.now()}`,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              label: "Approved",
              detail: "Officer approved response plan in simulation",
              tone: "approved",
            },
          ],
          resources: [
            {
              id: "clearance",
              name: "Road clearance unit",
              recommended: 2,
              available: 3,
              assigned: 1,
              unit: "units",
            },
          ],
          routes: [
            {
              id: "route-c",
              name: "Corridor Charlie",
              status: "RECOMMENDED",
              distance: "24.6 km",
              travelTime: "45 min",
              risk: "Low",
              reason: "Ridge crest bypass",
            },
          ],
        };
    setIncident(nextIncident);
    setAlerts([alert, ...alerts]);
    setNotifications([
      `APPROVAL · ${loc} response plan approved`,
      `CRITICAL · ${loc} priority score 94`,
      ...notifications,
    ]);
    notify("Full disaster response simulation completed.");
    setModal(null);
    go("response-planning");
  };
  const sync = () => {
    setModal("sync");
    window.setTimeout(() => {
      setModal(null);
      notify("Telemetry synchronized.");
    }, 1100);
  };
  const openAlert = (alert: Alert) => {
    const match = regions.find((item) =>
      alert.location.toLowerCase().startsWith(item.name.toLowerCase()),
    );
    if (match) setActiveDistrict(match.name);
    setSelectedAlert(alert);
    setModal("alert");
  };
  const openReport = (report: FieldReport) => {
    setSelectedReport(report);
    setModal("report");
  };
  if (route === "home") return <EnhancedLanding go={go} />;
  if (route === "login") return <Login onLogin={() => go("command-center")} />;
  return (
    <div className="app-shell">
      <TopNav
        route={route}
        go={go}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        simulate={simulate}
        notifications={notifications.length}
        setModal={setModal}
        setSearch={setSearch}
      />
      <main className="main-area">
        <Page
          route={route}
          region={region}
          regionName={activeDistrict}
          setRegionName={setActiveDistrict}
          score={score}
          sources={sources}
          setSources={setSources}
          alerts={alerts}
          reports={reports}
          setReports={setReports}
          incident={incident}
          setIncident={setIncident}
          onAlert={openAlert}
          onReport={openReport}
          go={go}
          notify={notify}
          sync={sync}
          simulate={simulate}
        />
      </main>
      <Overlay
        modal={modal}
        close={() => setModal(null)}
        search={search}
        setSearch={setSearch}
        go={go}
        notifications={notifications}
        setNotifications={setNotifications}
        alerts={alerts}
        selectedAlert={selectedAlert}
        setAlerts={setAlerts}
        selectedReport={selectedReport}
        reports={reports}
        setReports={setReports}
        incident={incident}
        setIncident={setIncident}
        sources={sources}
        setSources={setSources}
        notify={notify}
      />
      {toast && (
        <div className={`toast ${toast.tone || ""}`}>
          <Check size={15} />
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Header({
  route,
  go,
  notifications,
  setModal,
  setSearch,
}: {
  route: RouteName;
  go: (r: RouteName) => void;
  notifications: number;
  setModal: (m: string) => void;
  setSearch: (s: string) => void;
}) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={() =>
          document.querySelector(".app-nav")?.classList.toggle("is-open")
        }
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <div className="breadcrumb">
        <button onClick={() => go("home")}>SENTINEL NER</button>
        <span>/</span>
        <strong>{labels[route]}</strong>
      </div>
      <div className="top-actions">
        <button
          className="last-sync sync-button"
          onClick={() => setModal("sync")}
        >
          <span className="status-dot green" /> Last sync 2 minutes ago
        </button>
        <button
          className="icon-button"
          onClick={() => {
            setSearch("");
            setModal("search");
          }}
          aria-label="Open global search"
        >
          <Search size={17} />
        </button>
        <button
          className="icon-button notification"
          onClick={() => setModal("notifications")}
          aria-label="Open notifications"
        >
          <Bell size={17} />
          <i>{notifications}</i>
        </button>
        <button
          className="mini-avatar"
          onClick={() => setModal("profile")}
          aria-label="Open profile"
        >
          AS
        </button>
      </div>
    </header>
  );
}

function Page({
  route,
  region,
  regionName,
  setRegionName,
  score,
  sources,
  setSources,
  alerts,
  reports,
  setReports,
  incident,
  setIncident,
  onAlert,
  onReport,
  go,
  notify,
  sync,
  simulate,
}: any) {
  switch (route) {
    case "command-center":
      return (
        <CommandCenterOperations
          region={region}
          score={score}
          alerts={alerts}
          incident={incident}
          onAlert={onAlert}
          go={go}
          notify={notify}
          simulate={simulate}
        />
      );
    case "risk-intelligence":
      return <RiskIntelligenceWorkspace go={go} notify={notify} />;
    case "field-reports":
      return (
        <UnifiedFieldReportsWorkspace
          reports={reports}
          setReports={setReports}
          onReport={onReport}
          notify={notify}
          sync={sync}
        />
      );
    case "gis":
      return (
        <GISWorkstation
          region={region}
          score={score}
          incident={incident}
          notify={notify}
        />
      );
    case "alerts":
      return (
        <AlertsPage alerts={alerts} onAlert={onAlert} simulate={simulate} />
      );
    case "response-planning":
      return (
        <Response
          region={region}
          score={score}
          incident={incident}
          setIncident={setIncident}
          notify={notify}
        />
      );
    case "analytics":
      return <AnalyticsDashboard notify={notify} />;
    case "environment":
      return (
        <EnvironmentMonitoring
          region={region}
          regionName={regionName}
          setRegionName={setRegionName}
        />
      );
    case "incidents":
      return <Incidents reports={reports} onReport={onReport} />;
    case "settings":
      return <SettingsPage notify={notify} />;
    default:
      return null;
  }
}
function Title({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: React.ReactNode;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="section-kicker">{kicker}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}

function AlertsPage({ alerts, onAlert, simulate }: any) {
  const { isDemoMode, activeLocationName, setMode } = useDataContext();
  const [filter, setFilter] = useState("ALL");
  const visible = alerts.filter(
    (a: Alert) => filter === "ALL" || a.status === filter || a.level === filter,
  );
  return (
    <div className="page-content">
      <Title
        kicker="EMERGENCY MANAGEMENT / LIVE QUEUE"
        title={
          <>
            Alert <span>Center</span>
          </>
        }
        description="Acknowledge, escalate and resolve risk warnings with a visible audit trail."
        actions={
          <button className="primary-button compact" onClick={simulate}>
            <Zap size={15} /> Simulate escalation
          </button>
        }
      />
      <div className="filter-tabs">
        {["ALL", "CRITICAL", "HIGH", "ACKNOWLEDGED", "RESOLVED"].map((item) => (
          <button
            className={filter === item ? "active" : ""}
            key={item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="panel alert-table">
        {visible.map((alert: Alert) => (
          <button
            className="alert-detail-row"
            key={alert.id}
            onClick={() => onAlert(alert)}
          >
            <span className={`alert-marker ${alert.level.toLowerCase()}`}>
              <AlertTriangle size={15} />
            </span>
            <span>
              <b>
                {alert.id} · {alert.title}
              </b>
              <small>
                {alert.location} · {alert.cause}
              </small>
            </span>
            <strong>{alert.risk}%</strong>
            <span className={`status-text ${alert.status.toLowerCase()}`}>
              {alert.status}
            </span>
            <ArrowRight size={15} />
          </button>
        ))}
        {!visible.length && (
          <div className="p-8 text-center space-y-3">
            <Empty
              text={
                alerts.length === 0
                  ? `0 Active Alerts for ${activeLocationName}. All environmental telemetry within nominal safety envelopes.`
                  : "No alerts match this filter."
              }
            />
            {!isDemoMode && alerts.length === 0 && (
              <div className="pt-2">
                <button
                  className="primary-button compact cursor-pointer"
                  onClick={() => setMode("demo")}
                >
                  <Zap size={14} /> Launch NER Emergency Demo
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
function Response({ region, score, incident, setIncident, notify }: any) {
  const { setMode, userLocation } = useDataContext();
  if (!incident || !incident.routes) {
    return (
      <div className="page-content">
        <Title
          kicker="RESPONSE OPERATIONS / HUMAN-IN-THE-LOOP"
          title={
            <>
              Response <span>Planning</span>
            </>
          }
          description="AI recommendations remain advisory. An authorized disaster officer makes the final response decision."
        />
        <div className="panel p-8 text-center space-y-3 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-mono">
            NO ACTIVE RESPONSE OPERATIONS
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            Live telemetry indicates current sector (
            {userLocation?.displayName || "Active Sector"}) is within nominal
            safety envelopes. No emergency evacuation or multi-unit response
            operations have been triggered.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              className="primary-button compact cursor-pointer"
              onClick={() => {
                setMode("demo");
                notify(
                  "Switched to Demo Mode with active KM-42 crisis response plan.",
                );
              }}
            >
              <Zap size={14} /> Launch NER Emergency Demo
            </button>
          </div>
        </div>
      </div>
    );
  }
  const [generated, setGenerated] = useState(false),
    [rejectReason, setRejectReason] = useState(""),
    [selectedRoute, setSelectedRoute] = useState(
      incident.routes.find((route: any) => route.status === "RECOMMENDED") ||
        incident.routes[0],
    );
  const decide = (decision: "APPROVED" | "MODIFIED" | "REJECTED") => {
    if (decision === "REJECTED" && !rejectReason.trim()) {
      notify("Add a short rejection reason first.", "error");
      return;
    }
    const event = {
      id: `decision-${Date.now()}`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      label: decision === "APPROVED" ? "Approved" : "Reported",
      detail:
        decision === "APPROVED"
          ? "Officer approved response plan"
          : decision === "MODIFIED"
            ? "Officer modified recommendation"
            : `Officer rejected plan: ${rejectReason}`,
      tone: decision === "APPROVED" ? "approved" : "reported",
    };
    setIncident({
      ...incident,
      officerDecision: decision,
      responseStatus:
        decision === "APPROVED" ? "APPROVED FOR RESPONSE" : "AWAITING APPROVAL",
      decisionReason: decision === "REJECTED" ? rejectReason : undefined,
      timeline: [...incident.timeline, event],
    });
    notify(
      decision === "APPROVED"
        ? "Approved for response."
        : decision === "MODIFIED"
          ? "Recommendation saved for review."
          : "Response plan rejected.",
    );
  };
  const assign = (resourceId: string) =>
    setIncident({
      ...incident,
      resources: incident.resources.map((resource: any) =>
        resource.id === resourceId
          ? {
              ...resource,
              assigned: Math.min(resource.available, resource.assigned + 1),
            }
          : resource,
      ),
      timeline: [
        ...incident.timeline,
        {
          id: `assign-${Date.now()}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          label: "Assigned",
          detail: "Resource assigned by officer",
          tone: "assigned",
        },
      ],
    });
  return (
    <div className="page-content">
      <Title
        kicker="RESPONSE OPERATIONS / HUMAN-IN-THE-LOOP"
        title={
          <>
            Response <span>Planning</span>
          </>
        }
        description="AI recommendations remain advisory. An authorized officer makes the final response decision."
        actions={
          <>
            <button
              className="secondary-button"
              onClick={() => notify("Response plan exported.")}
            >
              <Download size={15} /> Export plan
            </button>
            <button
              className="primary-button compact"
              onClick={() => {
                setGenerated(true);
                notify("Response plan generated.");
              }}
            >
              <Zap size={15} /> Generate plan
            </button>
          </>
        }
      />
      <div className="incident-hero panel">
        <div>
          <span className="section-kicker">
            SINGLE SOURCE OF TRUTH · {incident.id}
          </span>
          <h2>{incident.location}</h2>
          <p>
            Unified incident from field evidence, satellite change and
            environmental signals.
          </p>
        </div>
        <div className="incident-hero-score">
          <strong>
            {incident.priorityScore}
            <small>/100</small>
          </strong>
          <span
            className={`risk-badge ${priorityLevel(incident.priorityScore).toLowerCase()}`}
          >
            {priorityLevel(incident.priorityScore)}
          </span>
        </div>
      </div>
      <div className="response-intelligence-grid">
        <section className="panel approval-panel">
          <div className="panel-heading">
            <div>
              <h2>AI analysis</h2>
              <span>Decision support · simulated intelligence</span>
            </div>
            <span className="demo-chip">AI DOES NOT APPROVE</span>
          </div>
          <div className="ai-summary">
            <div>
              <span>Risk</span>
              <b>{incident.severity}</b>
            </div>
            <div>
              <span>Confidence</span>
              <b>{incident.confidence}%</b>
            </div>
            <div>
              <span>Action</span>
              <b>Immediate field verification</b>
            </div>
          </div>
          <div className="priority-breakdown">
            <b>PRIORITY SCORE · {incident.priorityScore}/100</b>
            {[
              ["Risk severity", "35"],
              ["Population exposure", "20"],
              ["Infrastructure impact", "18"],
              ["Connectivity loss", "10"],
              ["Confidence", "9"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="recommendation">
            <ShieldCheck size={16} />
            <span>
              <b>Suggested resources</b>
              <small>
                Road clearance team · Field assessment team · Medical support
              </small>
              <small>Suggested route: {selectedRoute.name}</small>
            </span>
          </div>
          <div className="officer-decision">
            <div className="section-label">OFFICER DECISION</div>
            <div className="decision-actions">
              <button
                className="primary-button"
                onClick={() => decide("APPROVED")}
              >
                <Check size={15} /> Approve
              </button>
              <button
                className="secondary-button"
                onClick={() => decide("MODIFIED")}
              >
                Modify
              </button>
              <button
                className="secondary-button danger-action"
                onClick={() => decide("REJECTED")}
              >
                Reject
              </button>
            </div>
            {incident.officerDecision === "REJECTED" && (
              <p className="decision-note">{incident.decisionReason}</p>
            )}
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Reason required when rejecting..."
            />
          </div>
        </section>
        <section className="panel connectivity-panel">
          <div className="panel-heading">
            <div>
              <h2>Connectivity / blackout intelligence</h2>
              <span>Officer planning layer</span>
            </div>
            <span className="demo-chip">DEMO DATA</span>
          </div>
          <div className="connectivity-status">
            <span className="connectivity-dot blackout" />
            <div>
              <b>{incident.location}</b>
              <strong>{incident.connectivity}</strong>
              <small>Last signal: {incident.lastSignal}</small>
            </div>
          </div>
          <div className="connectivity-facts">
            <span>
              <b>Affected area</b>
              <strong>{incident.affectedArea}</strong>
            </span>
            <span>
              <b>Nearby field teams</b>
              <strong>2 teams</strong>
            </span>
            <span>
              <b>Alternative comms</b>
              <strong>Radio relay available</strong>
            </span>
          </div>
          <p className="data-boundary">
            Connectivity status is simulated and should be verified before
            dispatch.
          </p>
        </section>
      </div>
      <section className="panel route-panel">
        <div className="panel-heading">
          <div>
            <h2>Safe route intelligence</h2>
            <span>Simulated route analysis · not live navigation</span>
          </div>
          <Route size={19} />
        </div>
        <div className="route-options">
          {incident.routes.map((route: any) => (
            <button
              key={route.id}
              className={`route-option ${selectedRoute.id === route.id ? "selected" : ""}`}
              onClick={() => setSelectedRoute(route)}
            >
              <span
                className={`route-status ${route.status.toLowerCase().replace(" ", "-")}`}
              >
                {route.status}
              </span>
              <b>{route.name}</b>
              <small>
                {route.distance} · {route.travelTime} · {route.risk} risk
              </small>
              <em>{route.reason}</em>
            </button>
          ))}
        </div>
      </section>
      <section className="panel resources-panel">
        <div className="panel-heading">
          <div>
            <h2>AI resource recommendation</h2>
            <span>Recommended · available · assigned</span>
          </div>
          <span className="demo-chip">OFFICER ASSIGNMENT REQUIRED</span>
        </div>
        <div className="resource-table">
          {incident.resources.map((resource: any) => (
            <div className="resource-row" key={resource.id}>
              <span>
                <b>{resource.name}</b>
                <small>
                  Recommended {resource.recommended} · Available{" "}
                  {resource.available}
                </small>
              </span>
              <strong>{resource.assigned} assigned</strong>
              <button
                className="secondary-button compact"
                onClick={() => assign(resource.id)}
                disabled={resource.assigned >= resource.available}
              >
                Assign
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="panel timeline-panel">
        <div className="panel-heading">
          <div>
            <h2>Incident timeline</h2>
            <span>Actions update this audit trail</span>
          </div>
          <span className="live-label">
            <i /> {incident.responseStatus}
          </span>
        </div>
        <div className="incident-timeline">
          {incident.timeline.map((event: any) => (
            <div className={`timeline-event ${event.tone}`} key={event.id}>
              <span className="timeline-icon">
                <Check size={12} />
              </span>
              <time>{event.time}</time>
              <b>{event.label}</b>
              <small>{event.detail}</small>
            </div>
          ))}
        </div>
        {generated && (
          <div className="timeline-new">
            <Zap size={14} /> Response plan generated for officer review.
          </div>
        )}
      </section>
    </div>
  );
}
function Analytics({ notify }: { notify: (m: string) => void }) {
  const [range, setRange] = useState("30 days"),
    bars =
      range === "7 days"
        ? [42, 58, 36, 71, 54]
        : range === "90 days"
          ? [33, 49, 62, 55, 73, 64, 81, 68]
          : [25, 41, 36, 57, 48, 69, 62, 78, 66, 84];
  return (
    <div className="page-content">
      <Title
        kicker="DECISION SUPPORT / TRENDS"
        title={
          <>
            Analytics <span>& Insights</span>
          </>
        }
        description="Understand the signals behind risk, incidents and response performance."
        actions={
          <>
            <select
              className="range-control"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option>7 days</option>
              <option>30 days</option>
              <option>90 days</option>
              <option>1 year</option>
            </select>
            <button
              className="secondary-button"
              onClick={() => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(
                  new Blob(
                    ["district,risk\nChurachandpur,91\nEast Khasi Hills,74"],
                    { type: "text/csv" },
                  ),
                );
                link.download = "sentinel-analytics.csv";
                link.click();
                notify("Analytics CSV downloaded.");
              }}
            >
              <Download size={15} /> CSV
            </button>
          </>
        }
      />
      <div className="analytics-cards">
        <Metric
          label="Critical zones"
          value="03"
          detail="+12% vs previous period"
        />
        <Metric
          label="Verified reports"
          value="86%"
          detail="Across 8 districts"
        />
        <Metric
          label="Avg response time"
          value="18m"
          detail="-4m vs previous period"
        />
        <Metric
          label="Risk / rainfall correlation"
          value="0.82"
          detail="Demo indicator"
        />
      </div>
      <div className="analytics-grid">
        <section className="panel bar-panel">
          <div className="panel-heading">
            <div>
              <h2>Risk by district</h2>
              <span>{range} · clickable bars</span>
            </div>
          </div>
          <div className="bars">
            {bars.map((value, index) => (
              <button
                key={index}
                style={{ height: `${value}%` }}
                onClick={() =>
                  notify(`District ${index + 1}: ${value}% risk in ${range}.`)
                }
              >
                <i />
                <small>
                  {
                    [
                      "CP",
                      "EK",
                      "TW",
                      "GK",
                      "AZ",
                      "KH",
                      "DB",
                      "AG",
                      "NE",
                      "NR",
                    ][index]
                  }
                </small>
              </button>
            ))}
          </div>
        </section>
        <section className="panel insight-panel">
          <div className="panel-heading">
            <div>
              <h2>Operational insights</h2>
              <span>Generated from demo state</span>
            </div>
            <Sparkles size={18} />
          </div>
          {[
            "Rainfall is leading risk",
            "Field verification is improving",
            "Response readiness",
          ].map((title, index) => (
            <div className="insight" key={title}>
              <b>{title}</b>
              <p>
                {
                  [
                    "Churachandpur rainfall anomaly contributes the largest share of current risk.",
                    "Verified reports are reaching the command center faster than the previous period.",
                    "Two blocked road segments are affecting the current evacuation route.",
                  ][index]
                }
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric panel">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Incidents({ reports, onReport }: any) {
  const [query, setQuery] = useState(""),
    filtered = reports.filter((r: FieldReport) =>
      `${r.id} ${r.location} ${r.incident}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  return (
    <div className="page-content">
      <Title
        kicker="INCIDENT MANAGEMENT / AUDITABLE"
        title={
          <>
            Incident <span>Management</span>
          </>
        }
        description="Search, verify and assign field observations from one operational register."
      />
      <section className="panel incident-panel">
        <div className="incident-toolbar">
          <div className="search-field">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search incidents, locations or IDs"
            />
          </div>
          <button className="secondary-button" onClick={() => setQuery("")}>
            Clear filter
          </button>
        </div>
        {filtered.map((r: FieldReport) => (
          <button
            className="incident-row"
            key={r.id}
            onClick={() => onReport(r)}
          >
            <b>{r.id}</b>
            <span>{r.location}</span>
            <span>{r.incident}</span>
            <span className={`risk-badge ${r.severity.toLowerCase()}`}>
              {r.severity}
            </span>
            <span>{r.timestamp}</span>
            <span className="status-text acknowledged">{r.status}</span>
            <ArrowRight size={15} />
          </button>
        ))}
        {!filtered.length && <Empty text="No incidents found." />}
      </section>
    </div>
  );
}
function SettingsPage({ notify }: { notify: (m: string) => void }) {
  const [name, setName] = useState("Ananya Sharma");
  return (
    <div className="page-content">
      <Title
        kicker="ACCOUNT / ACCESS CONTROL"
        title={
          <>
            Profile <span>& Settings</span>
          </>
        }
        description="Manage your operator profile and workspace preferences."
      />
      <section className="panel settings-panel">
        <div className="profile-large">AS</div>
        <div className="settings-form">
          <label>
            Display name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Role
            <select defaultValue="District Officer">
              <option>Administrator</option>
              <option>District Officer</option>
              <option>Field Officer</option>
              <option>Analyst</option>
            </select>
          </label>
          <label>
            Notification preference
            <select defaultValue="Dashboard + Email placeholder">
              <option>Dashboard + Email placeholder</option>
              <option>Dashboard only</option>
              <option>SMS placeholder</option>
            </select>
          </label>
          <button
            className="primary-button"
            onClick={() => notify("Profile updated.")}
          >
            Save profile <Check size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Database size={20} />
      <strong>{text}</strong>
    </div>
  );
}

function Overlay({
  modal,
  close,
  search,
  setSearch,
  go,
  notifications,
  setNotifications,
  alerts,
  selectedAlert,
  setAlerts,
  selectedReport,
  reports,
  setReports,
  sources,
  setSources,
  notify,
}: any) {
  const results = regions.filter((r: Region) =>
    `${r.name} ${r.state}`.toLowerCase().includes(search.toLowerCase()),
  );
  if (!modal) return null;
  if (modal === "sync")
    return (
      <Modal title="System status" close={close}>
        <div className="sync-state">
          <span className="status-dot green" />
          <strong>OPERATIONAL</strong>
          <p>
            Last sync: 2 minutes ago · Data sources: 8/8 available · Demo Mode:
            ACTIVE
          </p>
          <button
            className="primary-button"
            onClick={() => {
              close();
              notify("Synchronizing...");
              window.setTimeout(() => notify("Sync completed."), 900);
            }}
          >
            <RefreshCw size={15} /> Sync now
          </button>
        </div>
      </Modal>
    );
  if (modal === "search")
    return (
      <Modal title="Global search" close={close}>
        <div className="search-modal">
          <div className="search-field">
            <Search size={16} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search districts, incidents, alerts..."
            />
            <button onClick={() => setSearch("")}>
              <X size={15} />
            </button>
          </div>
          {search ? (
            results.map((r: Region) => (
              <button
                className="search-result"
                key={r.name}
                onClick={() => {
                  close();
                  go("risk-intelligence");
                }}
              >
                <Globe2 size={15} />
                <span>
                  <b>{r.name}</b>
                  <small>
                    {r.state} · {r.risk}% {riskLevel(r.risk)} risk
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))
          ) : (
            <p className="modal-hint">
              Try “Churachandpur”, “Meghalaya” or “Sikkim”. Press Ctrl + K
              anytime.
            </p>
          )}
          {search && !results.length && (
            <Empty text="No matching locations found." />
          )}
        </div>
      </Modal>
    );
  if (modal === "notifications")
    return (
      <Modal title="Notifications" close={close}>
        <div className="notification-modal">
          <button
            className="mark-read"
            onClick={() => {
              setNotifications([]);
              notify("Notifications marked as read.");
            }}
          >
            Mark all as read
          </button>
          {notifications.map((item: string, i: number) => (
            <button
              className="notification-item"
              key={`${item}-${i}`}
              onClick={() => {
                close();
                go("alerts");
              }}
            >
              <span className="alert-marker critical">
                <Bell size={14} />
              </span>
              <span>
                <b>{item}</b>
                <small>Sentinel NER · just now</small>
              </span>
              <ArrowRight size={14} />
            </button>
          ))}
          {!notifications.length && (
            <Empty text="All notifications are read." />
          )}
        </div>
      </Modal>
    );
  if (modal === "profile")
    return (
      <Modal title="Ananya Sharma" close={close}>
        <div className="profile-menu">
          <button
            onClick={() => {
              close();
              go("settings");
            }}
          >
            <Settings size={16} /> Profile & settings <ArrowRight size={14} />
          </button>
          <button
            onClick={() => {
              close();
              go("settings");
            }}
          >
            <ShieldCheck size={16} /> Preferences <ArrowRight size={14} />
          </button>
          <button
            onClick={() => {
              close();
              go("login");
            }}
          >
            <ArrowLeft size={16} /> Logout <ArrowRight size={14} />
          </button>
        </div>
      </Modal>
    );
  if (modal === "sources")
    return (
      <Modal title="Data sources" close={close}>
        <div className="source-list">
          {sourceNames.map((name) => (
            <label key={name}>
              <span>
                <b>{name}</b>
                <small>
                  {sources[name]
                    ? "Connected · Demo data · Updated 2 min ago"
                    : "Disabled · excluded from score"}
                </small>
              </span>
              <input
                type="checkbox"
                checked={sources[name] !== false}
                onChange={(e) => {
                  setSources({ ...sources, [name]: e.target.checked });
                  notify("Risk recalculated.");
                }}
              />
            </label>
          ))}
        </div>
      </Modal>
    );
  if (modal === "alert" && selectedAlert)
    return (
      <Modal
        title={`${selectedAlert.id} · ${selectedAlert.title}`}
        close={close}
      >
        <div className="detail-modal">
          <span className={`risk-badge ${selectedAlert.level.toLowerCase()}`}>
            {selectedAlert.level} · {selectedAlert.risk}%
          </span>
          <p>
            <b>Location:</b> {selectedAlert.location}
          </p>
          <p>
            <b>Trigger:</b> {selectedAlert.cause}
          </p>
          <p>
            <b>Current status:</b> {selectedAlert.status}
          </p>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setAlerts(
                  alerts.map((a: Alert) =>
                    a.id === selectedAlert.id
                      ? { ...a, status: "ACKNOWLEDGED" }
                      : a,
                  ),
                );
                notify("Alert acknowledged.");
                close();
              }}
            >
              Acknowledge
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setAlerts(
                  alerts.map((a: Alert) =>
                    a.id === selectedAlert.id
                      ? { ...a, status: "ESCALATED" }
                      : a,
                  ),
                );
                notify("Alert escalated.");
              }}
            >
              Escalate
            </button>
            <button
              className="secondary-button"
              onClick={() => notify("Notification sent to response team.")}
            >
              Notify
            </button>
            <button
              className="primary-button"
              onClick={() => {
                setAlerts(
                  alerts.map((a: Alert) =>
                    a.id === selectedAlert.id
                      ? { ...a, status: "RESOLVED" }
                      : a,
                  ),
                );
                notify("Alert resolved.");
                close();
              }}
            >
              Resolve
            </button>
          </div>
        </div>
      </Modal>
    );
  if (modal === "report" && selectedReport)
    return (
      <Modal
        title={`${selectedReport.id} · ${selectedReport.incident}`}
        close={close}
      >
        <div className="detail-modal">
          {selectedReport.image && (
            <img
              className="report-detail-image"
              src={selectedReport.image}
              alt="Field report evidence"
            />
          )}
          <p>
            <b>Location:</b> {selectedReport.location}
          </p>
          <p>
            <b>Reporter:</b> {selectedReport.reporter}
          </p>
          <p>
            <b>Severity:</b> {selectedReport.severity}
          </p>
          <p>
            <b>Status:</b> {selectedReport.status}
          </p>
          <p>
            <b>Description:</b>{" "}
            {selectedReport.description || "No additional notes."}
          </p>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setReports(
                  reports.map((r: FieldReport) =>
                    r.id === selectedReport.id
                      ? { ...r, status: "Verified" }
                      : r,
                  ),
                );
                notify("Report verified.");
                close();
              }}
            >
              Verify
            </button>
            <button
              className="secondary-button"
              onClick={() => notify("Report escalated.")}
            >
              Escalate
            </button>
            <button
              className="primary-button"
              onClick={() => notify("Officer assignment sent.")}
            >
              Assign officer
            </button>
          </div>
        </div>
      </Modal>
    );
  return null;
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section className="modal">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close dialog"
          >
            <X size={17} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function HeroMap() {
  return (
    <div className="hero-map-wrap">
      <div className="hero-map-label">
        <span className="status-dot green" /> LIVE RISK OVERVIEW{" "}
        <small>DEMO DATA</small>
      </div>
      <div className="hero-map">
        <div className="contour c1" />
        <div className="contour c2" />
        <div className="contour c3" />
        <div className="contour c4" />
        {regions.map((region) => (
          <span
            key={region.name}
            className={`map-node node-${riskLevel(region.risk).toLowerCase()}`}
            style={{ left: `${region.x}%`, top: `${region.y}%` }}
          >
            <span className="node-pulse" />
            <span className="node-core" />
            <b>{region.risk}%</b>
          </span>
        ))}
        <div className="map-compass">
          <Compass size={19} />
          <small>N</small>
        </div>
        <div className="map-scale">10 km</div>
      </div>
      <div className="hero-map-footer">
        <span>
          <i className="legend-dot critical" /> Critical
        </span>
        <span>
          <i className="legend-dot high" /> High
        </span>
        <span>
          <i className="legend-dot moderate" /> Moderate
        </span>
        <span className="map-coords">26.2006° N, 92.9376° E</span>
      </div>
    </div>
  );
}
