"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, cubicBezier, Variants } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, LogOut, Search, RefreshCw, Briefcase, Building2, User,
  MapPin, CalendarClock, DollarSign, Users, Mail, Phone, Activity,
  FileText, ShieldCheck, Clock3, CheckCircle2, XCircle, HourglassIcon,
  ClipboardList, Hash
} from "lucide-react";
import Sidebar from "../../components/Sidebar";

/* ─── API CONFIG ─────────────────────────────────────────────── */
const APPLICATIONS_API_BASE = "https://jbrstaffingsolutions.com/api/jobs/applications";

/* ─── DESIGN TOKENS (matches JobPage / CampaignsPage / WarehousePage) ─ */
const C = {
  bg: "#F0F2F5",
  surface: "#FFFFFF",
  border: "rgba(0,0,0,0.07)",
  borderHover: "rgba(0,0,0,0.14)",
  textHeading: "#111111",
  textBody: "#1A1A1A",
  textLabel: "#374151",
  textMuted: "#6B7280",
  textHint: "#9BA3AF",
  red: "#C62828",
  redBright: "#E53935",
  redGlow: "rgba(229,57,53,0.20)",
  redActiveBg: "rgba(198,40,40,0.08)",
  inputBg: "#F4F6F8",
  white: "#FFFFFF",
  successBg: "rgba(5,150,105,0.10)",
  successText: "#059669",
  pendingBg: "rgba(59,130,246,0.10)",
  pendingText: "#3B82F6",
  waitlistBg: "rgba(217,119,6,0.10)",
  waitlistText: "#D97706",
  alertBg: "rgba(198,40,40,0.08)",
  alertText: "#C62828",
  inactiveBg: "rgba(107,114,128,0.10)",
  inactiveText: "#6B7280",
};

/* ─── GLOBAL CSS ─────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.textBody}; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.borderHover}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
  .clean-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
  }
  .table-container { width: 100%; overflow-x: auto; }
  .table-min-width { min-width: 1220px; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─── TYPES (mirrors GET /api/jobs/applications/:jobId) ──────── */
interface ApiWarehouseDetail {
  id: string;
  customer_name: string;
  warehouse_name: string;
  warehouse_address: string;
  supervisor_manager: string;
  privacy_policy_url?: string | null;
  terms_and_conditions_url?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface ApiJobDetail {
  id: string;
  campaign_name: string;
  role_title: string;
  company_or_warehouse: string; // warehouse id
  hourly_rate: number | null;
  start_at: string;
  end_at: string;
  full_address: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  client_policy_url?: string | null;
  terms_and_conditions_url?: string | null;
  user_id?: string | null;
  warehouse: ApiWarehouseDetail;
}

interface ApiApplicant {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  registration_number: string | null;
  role: string | null;
  is_active: boolean | null;
  source: string | null;
}

interface ApiApplication {
  id: string;
  job_id: string;
  user_id: string;
  user_email: string;
  application_status: string;
  created_at: string;
  updated_at: string;
  applicant: ApiApplicant;
  job: ApiJobDetail;
}

interface ApplicationsApiResponse {
  success: boolean;
  count: number;
  job: ApiJobDetail;
  data: ApiApplication[];
  applicants?: ApiApplication[];
  message?: string;
}

/* ─── AUTH HELPERS (same convention as JobPage) ──────────────── */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jbr_token");
}

function authHeaders(includeContentType = false): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (includeContentType) headers["Content-Type"] = "application/json";
  return headers;
}

/* ─── FORMAT HELPERS ─────────────────────────────────────────── */
function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
  }).format(date);
}

function formatDateOnly(isoString?: string | null): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function applicantFullName(a: ApiApplicant, fallbackEmail: string): string {
  const name = [a.first_name, a.last_name].filter(Boolean).join(" ").trim();
  return name || fallbackEmail;
}

function initialsFor(a: ApiApplicant, fallbackEmail: string): string {
  const name = [a.first_name, a.last_name].filter(Boolean).join(" ").trim();
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
  }
  return fallbackEmail.slice(0, 2).toUpperCase();
}

function formatPhone(phone?: string | null): string {
  if (!phone) return "—";
  return phone;
}

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);
const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.08 } }
};
const itemVars: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 22 } }
};

/* ─── SPINNER ────────────────────────────────────────────────── */
function Spinner({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
      style={{ animation: "spin 0.7s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

/* ─── TOP NAV ────────────────────────────────────────────────── */
function TopNav({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; email?: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("jbr_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("jbr_token");
    localStorage.removeItem("jbr_user");
    router.push("/");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: easeOutCirc }}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 40px", borderBottom: `1px solid ${C.border}`,
        background: C.surface, position: "sticky", top: 0, zIndex: 10
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <motion.button
          onClick={onBack}
          whileHover={{ backgroundColor: C.inputBg, borderColor: C.borderHover }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px",
            background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px",
            color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s"
          }}
        >
          <ArrowLeft size={15} /> Back to Jobs
        </motion.button>
        <div style={{ width: "1px", height: "20px", background: C.border }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Users size={18} color={C.red} />
          <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHeading, fontWeight: 600 }}>
            Applicants
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <span style={{ fontSize: "13px", color: C.textMuted }}>
          Welcome,{" "}
          <span style={{ color: C.textHeading, fontWeight: 500 }}>
            {user ? (user.firstName ? `${user.firstName} (${user.email})` : user.email) : "Loading..."}
          </span>
        </span>
        <motion.button
          onClick={handleSignOut}
          whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px",
            background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px",
            color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s ease"
          }}
        >
          Sign Out <LogOut size={16} />
        </motion.button>
      </div>
    </motion.header>
  );
}

/* ─── STATUS PILL (application_status is free-form from the API) ─ */
function statusStyle(status: string): { bg: string; text: string; icon: React.ReactNode; label: string } {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "accepted" || s === "hired" || s === "confirmed") {
    return { bg: C.successBg, text: C.successText, icon: <CheckCircle2 size={12} />, label: status };
  }
  if (s === "rejected" || s === "declined" || s === "denied") {
    return { bg: C.alertBg, text: C.alertText, icon: <XCircle size={12} />, label: status };
  }
  if (s === "waitlisted" || s === "waitlist") {
    return { bg: C.waitlistBg, text: C.waitlistText, icon: <HourglassIcon size={12} />, label: status };
  }
  if (s === "pending" || s === "applied" || s === "submitted" || s === "") {
    return { bg: C.pendingBg, text: C.pendingText, icon: <Clock3 size={12} />, label: status || "Pending" };
  }
  return { bg: C.inactiveBg, text: C.inactiveText, icon: <Activity size={12} />, label: status };
}

function StatusPill({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px",
      background: s.bg, color: s.text, fontSize: "11px", fontWeight: 700,
      textTransform: "capitalize", letterSpacing: "0.3px", whiteSpace: "nowrap"
    }}>
      {s.icon}
      {s.label}
    </div>
  );
}

/* ─── AVATAR ─────────────────────────────────────────────────── */
function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{
      width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
      color: C.white, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "13px", fontWeight: 700, letterSpacing: "0.5px",
      boxShadow: `0 3px 10px ${C.redGlow}`
    }}>
      {initials}
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: "center", padding: "80px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
    >
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: C.inputBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Users size={28} color={C.textHint} />
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading }}>
        {hasSearch ? "No matching applicants" : "No Applicants Yet"}
      </h3>
      <p style={{ fontSize: "14px", color: C.textMuted, maxWidth: "320px", lineHeight: 1.6 }}>
        {hasSearch
          ? "Try adjusting your search or filter."
          : "No one has applied to this job yet. Check back later."}
      </p>
    </motion.div>
  );
}

/* ─── DETAIL ROW (used in job summary card) ─────────────────── */
function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
      <div style={{
        width: "34px", height: "34px", borderRadius: "9px", background: C.inputBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.red
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "11px", color: C.textHint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>
          {label}
        </div>
        <div style={{ fontSize: "13.5px", color: C.textBody, fontWeight: 500, lineHeight: 1.4, wordBreak: "break-word" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function JobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = (Array.isArray(params?.jobId) ? params.jobId[0] : (params?.jobId as string)) ?? "";

  const [job, setJob]                 = useState<ApiJobDetail | null>(null);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [loadError, setLoadError]     = useState("");

  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab]     = useState("jobs");

  /* ── Fetch applicants (GET /api/jobs/applications/:jobId) ── */
  const fetchApplicants = useCallback(async () => {
    if (!jobId) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`${APPLICATIONS_API_BASE}/${jobId}`, { headers: authHeaders() });
      const json: ApplicationsApiResponse & { message?: string } = await res.json().catch(() => ({} as ApplicationsApiResponse));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || `Server returned ${res.status}`);
      }
      setJob(json.job ?? null);
      setApplications(Array.isArray(json.data) ? json.data : []);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load applicants.");
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  /* ── Status filter options derived from actual data ── */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => {
      const key = (a.application_status || "pending").toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [applications]);

  const statusTabs = useMemo(() => {
    const known = Object.keys(statusCounts);
    return ["all", ...known];
  }, [statusCounts]);

  const filtered = applications.filter((a) => {
    const matchesStatus = statusFilter === "all" || (a.application_status || "pending").toLowerCase() === statusFilter;
    if (!matchesStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = applicantFullName(a.applicant, a.user_email).toLowerCase();
    return (
      name.includes(q) ||
      a.user_email.toLowerCase().includes(q) ||
      (a.applicant.phone_number ?? "").toLowerCase().includes(q) ||
      (a.applicant.registration_number ?? "").toLowerCase().includes(q)
    );
  });

  /* ── Navigate to the employee's full profile (employees/[id]) ──
   * The applicant's id in the applications API response (applicant.id,
   * same value as the top-level user_id) is the employee record's id
   * used by GET /api/employees?id=... on that page.
   */
  const handleViewEmployee = (app: ApiApplication) => {
    const targetId = app.applicant?.id || app.user_id;
    if (!targetId) return;
    router.push(`/employees/${targetId}`);
  };

  const tableGridTemplate = "2fr 1.7fr 1.2fr 1fr 1fr 1fr";

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>

        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          <TopNav onBack={() => router.push("/jobs")} />

          <main style={{ padding: "40px", maxWidth: "1600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* Loading */}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "100px 40px", color: C.textMuted, fontSize: "15px" }}>
                <Spinner size={22} color={C.red} /> Loading applicants…
              </div>
            )}

            {/* Error */}
            {!isLoading && loadError && (
              <div className="clean-card" style={{ padding: "60px 40px", textAlign: "center" }}>
                <p style={{ color: C.red, fontSize: "14px", marginBottom: "16px" }}>{loadError}</p>
                <motion.button
                  onClick={fetchApplicants}
                  whileHover={{ backgroundColor: C.redActiveBg }}
                  style={{ padding: "10px 20px", border: `1px solid ${C.red}`, borderRadius: "8px", background: "transparent", color: C.red, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Retry
                </motion.button>
              </div>
            )}

            {!isLoading && !loadError && (
              <>
                {/* ── Page Header ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}
                >
                  <div>
                    <h1 style={{
                      fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: 600,
                      color: C.textHeading, marginBottom: "8px", letterSpacing: "-0.5px"
                    }}>
                      {job?.campaign_name ?? "Job Applicants"}
                    </h1>
                    <p style={{ fontSize: "15px", color: C.textMuted }}>
                      {job?.role_title ?? "—"} · {job?.warehouse?.warehouse_name ?? "—"}
                      <span style={{ marginLeft: "8px", fontSize: "13px", color: C.textHint }}>
                        ({applications.length} applicant{applications.length === 1 ? "" : "s"})
                      </span>
                    </p>
                  </div>

                  <motion.button
                    onClick={fetchApplicants}
                    whileHover={{ backgroundColor: C.inputBg }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
                      background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px",
                      color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    <RefreshCw size={15} /> Refresh
                  </motion.button>
                </motion.div>

                {/* ── Job Summary Card ── */}
                {job && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                    className="clean-card"
                    style={{ padding: "28px 32px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Briefcase size={18} color={C.red} />
                        <span style={{ fontSize: "16px", fontWeight: 700, color: C.textHeading }}>Job Details</span>
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px",
                          background: job.is_active ? C.successBg : C.inactiveBg,
                          color: job.is_active ? C.successText : C.inactiveText,
                          fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px"
                        }}>
                          {job.is_active ? "Active" : "Inactive"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {job.client_policy_url && (
                          <a href={job.client_policy_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600, color: C.textLabel, textDecoration: "none", padding: "8px 14px", border: `1px solid ${C.border}`, borderRadius: "8px" }}>
                            <FileText size={13} /> Client Policy
                          </a>
                        )}
                        {job.terms_and_conditions_url && (
                          <a href={job.terms_and_conditions_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600, color: C.textLabel, textDecoration: "none", padding: "8px 14px", border: `1px solid ${C.border}`, borderRadius: "8px" }}>
                            <ShieldCheck size={13} /> Terms & Conditions
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px 28px" }}>
                      <DetailItem icon={<User size={15} />} label="Role Title" value={job.role_title} />
                      <DetailItem icon={<Building2 size={15} />} label="Warehouse / Company" value={job.warehouse?.warehouse_name ?? "—"} />
                      <DetailItem icon={<Building2 size={15} />} label="Customer" value={job.warehouse?.customer_name ?? "—"} />
                      <DetailItem icon={<User size={15} />} label="Supervisor / Manager" value={job.warehouse?.supervisor_manager ?? "—"} />
                      <DetailItem icon={<CalendarClock size={15} />} label="Shift Start" value={formatDateTime(job.start_at)} />
                      <DetailItem icon={<CalendarClock size={15} />} label="Shift End" value={formatDateTime(job.end_at)} />
                      <DetailItem icon={<DollarSign size={15} />} label="Hourly Rate" value={job.hourly_rate != null ? `$${job.hourly_rate.toFixed(2)}/hr` : "—"} />
                      <DetailItem icon={<MapPin size={15} />} label="Job Address" value={job.full_address} />
                      <DetailItem icon={<MapPin size={15} />} label="Warehouse Address" value={job.warehouse?.warehouse_address ?? "—"} />
                      <DetailItem icon={<Hash size={15} />} label="Job ID" value={<span style={{ fontFamily: "monospace", fontSize: "12px" }}>{job.id}</span>} />
                      <DetailItem icon={<Clock3 size={15} />} label="Posted On" value={formatDateOnly(job.created_at)} />
                      <DetailItem icon={<Clock3 size={15} />} label="Last Updated" value={formatDateOnly(job.updated_at)} />
                    </div>
                  </motion.div>
                )}

                {/* ── Summary Cards (applicant status breakdown) ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}
                >
                  {[
                    { label: "Total Applicants", value: applications.length, icon: <Users size={20} color={C.red} /> },
                    ...Object.entries(statusCounts).map(([status, count]) => {
                      const s = statusStyle(status);
                      return {
                        label: status.charAt(0).toUpperCase() + status.slice(1),
                        value: count,
                        icon: <div style={{ color: s.text }}>{s.icon}</div>
                      };
                    })
                  ].map((card) => (
                    <div key={card.label} className="clean-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: C.inputBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {card.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: "26px", fontWeight: 700, color: C.textHeading, lineHeight: 1 }}>{card.value}</div>
                        <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "4px" }}>{card.label}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* ── Applicants Table Card ── */}
                <motion.div
                  variants={containerVars} initial="hidden" animate="show"
                  className="clean-card"
                  style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
                >
                  {/* Card Header */}
                  <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading }}>Applicant List</h3>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                      {/* Status filter chips */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {statusTabs.map((tab) => {
                          const isActive = statusFilter === tab;
                          const label = tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1);
                          return (
                            <button
                              key={tab}
                              onClick={() => setStatusFilter(tab)}
                              style={{
                                padding: "7px 14px", borderRadius: "20px", fontSize: "12.5px", fontWeight: 600,
                                border: `1px solid ${isActive ? C.red : C.border}`,
                                background: isActive ? C.redActiveBg : "transparent",
                                color: isActive ? C.red : C.textLabel,
                                cursor: "pointer", transition: "all 0.15s"
                              }}
                            >
                              {label}{tab !== "all" ? ` (${statusCounts[tab]})` : ""}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ position: "relative" }}>
                        <Search size={16} color={C.textHint} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text" placeholder="Search name, email, phone…"
                          value={search} onChange={(e) => setSearch(e.target.value)}
                          style={{
                            background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px",
                            padding: "10px 16px 10px 40px", color: C.textBody, fontSize: "14px",
                            width: "260px", outline: "none", transition: "border-color 0.2s"
                          }}
                          onFocus={(e) => (e.target.style.borderColor = C.red)}
                          onBlur={(e) => (e.target.style.borderColor = C.border)}
                        />
                      </div>
                    </div>
                  </div>

                  {filtered.length === 0 && <EmptyState hasSearch={!!search || statusFilter !== "all"} />}

                  {filtered.length > 0 && (
                    <div className="table-container">
                      <div className="table-min-width">

                        {/* Header */}
                        <div style={{ display: "grid", gridTemplateColumns: tableGridTemplate, padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: C.inputBg }}>
                          {["Applicant", "Contact", "Applied On", "Source", "Status", "Actions"].map((h, i) => (
                            <span key={i} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: C.textHint, fontWeight: 600 }}>
                              {h}
                            </span>
                          ))}
                        </div>

                        {/* Rows */}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {filtered.map((app, idx) => {
                            const name = applicantFullName(app.applicant, app.user_email);
                            const initials = initialsFor(app.applicant, app.user_email);

                            return (
                              <motion.div
                                key={app.id} variants={itemVars}
                                whileHover={{ backgroundColor: C.inputBg }}
                                style={{
                                  display: "grid", gridTemplateColumns: tableGridTemplate,
                                  alignItems: "center", padding: "20px 32px",
                                  borderBottom: idx !== filtered.length - 1 ? `1px solid ${C.border}` : "none",
                                  transition: "background-color 0.2s ease"
                                }}
                              >
                                {/* Applicant */}
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <Avatar initials={initials} />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: "14.5px", fontWeight: 600, color: C.textHeading, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {name}
                                    </div>
                                    <div style={{ fontSize: "12px", color: C.textHint, marginTop: "2px" }}>
                                      {app.applicant.registration_number ? `Reg #${app.applicant.registration_number}` : `ID #${app.applicant.id.slice(0, 8)}`}
                                    </div>
                                  </div>
                                </div>

                                {/* Contact */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: C.textBody }}>
                                    <Mail size={12} color={C.textHint} />
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.user_email}</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: C.textMuted }}>
                                    <Phone size={12} color={C.textHint} />
                                    {formatPhone(app.applicant.phone_number)}
                                  </div>
                                </div>

                                {/* Applied On */}
                                <div>
                                  <div style={{ fontSize: "13px", color: C.textBody }}>{formatDateOnly(app.created_at)}</div>
                                  <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px" }}>
                                    {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(app.created_at))}
                                  </div>
                                </div>

                                {/* Source */}
                                <div>
                                  <div style={{
                                    display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px",
                                    background: C.inputBg, color: C.textLabel, fontSize: "12px", fontWeight: 600, textTransform: "capitalize"
                                  }}>
                                    <ClipboardList size={12} />
                                    {app.applicant.source ?? "—"}
                                  </div>
                                </div>

                                {/* Status */}
                                <div>
                                  <StatusPill status={app.application_status} />
                                </div>

                                {/* Actions */}
<div
  style={{
    display: "flex",
    justifyContent: "flex-start",
    marginLeft: "-16px", // adjust this value
  }}
>
  <motion.button
                                    onClick={() => handleViewEmployee(app)}
                                    whileHover={{ y: -1, boxShadow: `0 4px 14px ${C.redGlow}` }}
                                    whileTap={{ scale: 0.96 }}
                                    title="View full employee profile"
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: "6px",
                                      padding: "8px 14px", borderRadius: "8px",
                                      background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                                      border: "none", color: C.white, fontSize: "12px", fontWeight: 700,
                                      letterSpacing: "0.3px", cursor: "pointer", whiteSpace: "nowrap"
                                    }}
                                  >
                                    <User size={13} /> View Employee
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                      </div>
                    </div>
                  )}
                </motion.div>
              </>
            )}

          </main>
        </div>
      </div>
    </>
  );
}