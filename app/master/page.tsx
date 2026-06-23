"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, cubicBezier, type Variants } from "framer-motion";
import {
  LogOut, Plus, Search, Edit2, Trash2, Settings,
  Briefcase, Layers, Users, Link as LinkIcon, MapPin,
  Map, Calendar, Copy, ExternalLink, X, ChevronDown,
  AlertTriangle, Loader2, RefreshCw, CheckCircle, XCircle,
  Filter, Check, Eye, EyeOff,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import { useRouter } from "next/navigation";

/* ─── DESIGN TOKENS ──────────────────────────────────────────── */
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
  alertBg: "rgba(198,40,40,0.08)",
  alertText: "#C62828",
  shadow: "rgba(0,0,0,0.06)",
  shadowMd: "rgba(0,0,0,0.10)",
  inactiveBg: "rgba(107,114,128,0.10)",
  inactiveText: "#6B7280",
  pendingText: "#3B82F6",
};

const BASE_URL = "https://jbrstaffingsolutions.com/api";

/* ─── GLOBAL CSS ─────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.textBody}; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.borderHover}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
  .clean-card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px; box-shadow: 0 1px 3px ${C.shadow}, 0 4px 16px ${C.shadow}; }
  .sub-nav-container::-webkit-scrollbar { display: none; }
  .table-container { width: 100%; overflow-x: auto; }
  .table-min-width { min-width: 1100px; }
  select { appearance: none; -webkit-appearance: none; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
`;

/* ─── TYPES ──────────────────────────────────────────────────── */
interface Industry {
  id: number | string;
  name: string;
  description?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  license_required: boolean;
  job_industry_id: string | null;
  job_industry?: { id: string; name: string } | null;
  city_id?: string | null;
  city?: { id: string; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  member_count?: number;
}

interface Province {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at?: string;
  city_count?: number;
}

interface City {
  id: string;
  name: string;
  province_id: string;
  is_active: boolean;
  created_at?: string;
  provinces?: { id: string; code: string; name: string };
  candidates?: { count: number }[];
  candidate_count?: number;
}

interface Campaign {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  link_token?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/* ─── ERROR MESSAGES ─────────────────────────────────────────── */
function getFriendlyErrorMessage(error: string, statusCode?: number): string {
  const lower = error.toLowerCase();
  if (statusCode === 401 || lower.includes("unauthorized") || lower.includes("token"))
    return "Your session has expired. Please sign in again to continue.";
  if (statusCode === 403 || lower.includes("forbidden"))
    return "You don't have permission to perform this action. Contact your administrator.";
  if (statusCode === 404 || lower.includes("not found"))
    return "The requested item could not be found. It may have been deleted already.";
  if (statusCode === 409 || lower.includes("conflict") || lower.includes("duplicate") || lower.includes("already exists"))
    return "An item with this name already exists. Please use a different name.";
  if (statusCode === 422 || lower.includes("validation") || lower.includes("invalid"))
    return "Some fields have invalid values. Please check all fields and try again.";
  if (statusCode === 500 || lower.includes("server error") || lower.includes("internal"))
    return "The server encountered an unexpected error. Please try again in a moment.";
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch"))
    return "Unable to connect to the server. Please check your internet connection and try again.";
  if (lower.includes("timeout"))
    return "The request timed out. The server may be busy — please try again shortly.";
  return error || "Something went wrong. Please try again.";
}

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jbr_token") || "" : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// FIX #2: apiFetch now always awaits the full response and never returns stale data.
// We also add a small cache-busting approach by always reading the response body once.
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; error: null; status?: number } | { data: null; error: string; status?: number }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...getAuthHeaders(), ...(options.headers as Record<string, string> || {}) },
    });

    let json: unknown = null;
    try {
      const text = await res.text();
      json = text ? JSON.parse(text) : null;
    } catch {
      // non-JSON response
    }

    if (!res.ok) {
      const rawError =
        (json as Record<string, string>)?.message ||
        (json as Record<string, string>)?.error ||
        `Error ${res.status}`;
      return { data: null, error: getFriendlyErrorMessage(rawError, res.status), status: res.status };
    }
    return { data: json as T, error: null, status: res.status };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { data: null, error: getFriendlyErrorMessage(msg) };
  }
}

/* ─── TOAST ──────────────────────────────────────────────────── */
interface Toast { id: number; message: string; type: "success" | "error" }

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 999, display: "flex", flexDirection: "column", gap: "10px" }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", borderRadius: "10px", background: C.surface, border: `1px solid ${t.type === "success" ? C.successText : C.red}`, boxShadow: `0 4px 16px ${C.shadowMd}`, minWidth: "260px", maxWidth: "380px" }}>
            {t.type === "success"
              ? <CheckCircle size={18} color={C.successText} style={{ flexShrink: 0 }} />
              : <XCircle size={18} color={C.red} style={{ flexShrink: 0 }} />}
            <span style={{ fontSize: "13px", fontWeight: 500, color: C.textBody, flex: 1, lineHeight: 1.45 }}>{t.message}</span>
            <button onClick={() => onRemove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textHint, display: "flex", flexShrink: 0 }}>
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = React.useRef(0);
  const add = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now() + counterRef.current++;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const remove = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

/* ─── SUB TABS ───────────────────────────────────────────────── */
const SUB_TABS = [
  { id: "industries", label: "Job Industries", icon: Briefcase },
  { id: "categories", label: "Job Categories", icon: Layers },
  { id: "groups",     label: "Groups",          icon: Users },
  { id: "campaigns",  label: "Campaigns",       icon: LinkIcon },
  { id: "provinces",  label: "Provinces",       icon: MapPin },
  { id: "cities",     label: "Cities",          icon: Map },
];

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);
const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const itemVars = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } } };

/* ─── CAMPAIGN HELPERS ───────────────────────────────────────── */
function formatCampaignDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toInputDate(iso: string): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

function getCampaignLink(camp: Campaign): string {
  const tokenValue = camp.link_token ?? String(camp.id);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/employee-register?token=${tokenValue}`;
}

/* ─── TOP NAV ────────────────────────────────────────────────── */
function TopNav() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; email?: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("jbr_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { console.error("Failed to parse user data", e); }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("jbr_token");
    localStorage.removeItem("jbr_user");
    router.push("/");
  };

  return (
    <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: easeOutCirc }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: `1px solid ${C.border}`, background: C.surface, position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHint, fontWeight: 600 }}>Administration</span>
        <span style={{ color: C.textMuted }}>/</span>
        <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHeading, fontWeight: 600 }}>Master Management</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <span style={{ fontSize: "13px", color: C.textMuted }}>
          Welcome, <span style={{ color: C.textHeading, fontWeight: 600 }}>
            {user ? (user.firstName ? `${user.firstName} (${user.email})` : user.email) : "Loading..."}
          </span>
        </span>
        <motion.button onClick={handleSignOut} whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }} whileTap={{ scale: 0.98 }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}>
          Sign Out <LogOut size={16} />
        </motion.button>
      </div>
    </motion.header>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status?.toLowerCase() === "active" || status === "true" || status === true as unknown as string;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "20px", background: isActive ? C.successBg : C.alertBg, color: isActive ? C.successText : C.alertText, fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
      {isActive ? "Active" : "Inactive"}
    </div>
  );
}

function BoolStatusBadge({ active }: { active: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", background: active ? C.successBg : C.inactiveBg, color: active ? C.successText : C.inactiveText, fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
      {active && <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.successText }} />}
      {active ? "Active" : "Inactive"}
    </div>
  );
}

function ActionButtons({ onEdit, onDelete, loading, deleteDisabled, deleteDisabledReason }: {
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  deleteDisabled?: boolean;
  deleteDisabledReason?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isDeleteDisabled = loading || deleteDisabled;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <motion.button onClick={onEdit} disabled={loading}
        whileHover={{ scale: 1.1, color: C.red, borderColor: C.red, backgroundColor: C.redActiveBg }}
        whileTap={{ scale: 0.9 }}
        style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textHint, cursor: loading ? "not-allowed" : "pointer", padding: "8px", display: "flex", transition: "all 0.2s", opacity: loading ? 0.5 : 1 }}>
        <Edit2 size={16} />
      </motion.button>

      <div style={{ position: "relative" }}
        onMouseEnter={() => deleteDisabled && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}>
        <motion.button
          onClick={!isDeleteDisabled ? onDelete : undefined}
          disabled={isDeleteDisabled}
          whileHover={!isDeleteDisabled ? { scale: 1.1, color: C.redBright, borderColor: C.redBright, backgroundColor: C.redActiveBg } : {}}
          whileTap={!isDeleteDisabled ? { scale: 0.9 } : {}}
          style={{
            background: deleteDisabled ? C.inputBg : "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            color: C.textHint,
            cursor: isDeleteDisabled ? "not-allowed" : "pointer",
            padding: "8px",
            display: "flex",
            transition: "all 0.2s",
            opacity: loading ? 0.5 : deleteDisabled ? 0.4 : 1,
          }}>
          <Trash2 size={16} />
        </motion.button>

        <AnimatePresence>
          {showTooltip && deleteDisabledReason && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute", bottom: "calc(100% + 8px)", right: 0,
                background: "#1F2937", color: "#F9FAFB", fontSize: "12px", fontWeight: 500,
                padding: "8px 12px", borderRadius: "8px", whiteSpace: "nowrap", zIndex: 999,
                boxShadow: `0 4px 16px ${C.shadowMd}`, maxWidth: "240px", lineHeight: "1.5",
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <AlertTriangle size={13} color="#FBBF24" style={{ flexShrink: 0, marginTop: "1px" }} />
                <span style={{ whiteSpace: "normal" }}>{deleteDisabledReason}</span>
              </div>
              <div style={{ position: "absolute", bottom: "-5px", right: "12px", width: "10px", height: "10px", background: "#1F2937", transform: "rotate(45deg)", borderRadius: "2px" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SearchBar({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <Search size={16} color={C.textHint} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "12px 16px 12px 42px", color: C.textBody, fontSize: "14px", outline: "none", transition: "border-color 0.2s" }}
        onFocus={(e) => (e.target.style.borderColor = C.red)}
        onBlur={(e) => (e.target.style.borderColor = C.border)}
      />
    </div>
  );
}

function AddButton({ label, onClick, loading }: { label: string; onClick?: () => void; loading?: boolean }) {
  return (
    <motion.button onClick={onClick} disabled={loading} whileHover={{ y: -2, boxShadow: `0 4px 16px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`, border: "none", borderRadius: "8px", color: C.white, fontSize: "14px", fontWeight: 600, letterSpacing: "0.5px", cursor: loading ? "not-allowed" : "pointer", boxShadow: `0 2px 8px ${C.redGlow}`, opacity: loading ? 0.7 : 1 }}>
      {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />}
      <span>{label}</span>
    </motion.button>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "12px", color: C.textMuted }}>
      <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: C.red }} />
      <span style={{ fontSize: "14px" }}>Loading...</span>
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", gap: "8px" }}>
      <span style={{ fontSize: "14px", color: C.textMuted, fontWeight: 500 }}>{message}</span>
      {hint && <span style={{ fontSize: "12px", color: C.textHint }}>{hint}</span>}
    </div>
  );
}

/* ─── FORM COMPONENTS ─────────────────────────────────────────── */
function FormField({ label, placeholder, type = "text", autoFocus = false, value, onChange, required }: {
  label: string; placeholder: string; type?: string; autoFocus?: boolean; value?: string; onChange?: (v: string) => void; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel, letterSpacing: "0.3px" }}>
        {label}{required && <span style={{ color: C.red, marginLeft: "2px" }}>*</span>}
      </label>
      <input type={type} placeholder={placeholder} autoFocus={autoFocus} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "11px 14px", background: C.inputBg, border: `1.5px solid ${focused ? C.red : C.border}`, borderRadius: "8px", color: C.textBody, fontSize: "14px", outline: "none", transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif" }}
      />
    </div>
  );
}

function FormTextArea({ label, placeholder, value, onChange }: { label: string; placeholder: string; value?: string; onChange?: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel, letterSpacing: "0.3px" }}>{label}</label>
      <textarea placeholder={placeholder} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "11px 14px", minHeight: "100px", resize: "vertical", background: C.inputBg, border: `1.5px solid ${focused ? C.red : C.border}`, borderRadius: "8px", color: C.textBody, fontSize: "14px", outline: "none", transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif" }}
      />
    </div>
  );
}

function FormSelect({ label, placeholder, options, value, onChange, required, loading }: {
  label: string; placeholder: string; options: { value: string; label: string }[]; value?: string; onChange?: (v: string) => void; required?: boolean; loading?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel, letterSpacing: "0.3px" }}>
        {label}{required && <span style={{ color: C.red, marginLeft: "2px" }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        {loading && (
          <Loader2 size={14} color={C.textHint} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", animation: "spin 1s linear infinite", zIndex: 1 }} />
        )}
        <select value={value ?? ""} onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          disabled={loading}
          style={{ width: "100%", padding: loading ? "11px 40px 11px 36px" : "11px 40px 11px 14px", background: C.inputBg, border: `1.5px solid ${focused ? C.red : C.border}`, borderRadius: "8px", color: value ? C.textBody : C.textHint, fontSize: "14px", outline: "none", transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          <option value="" disabled>{loading ? "Loading..." : placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {!loading && <ChevronDown size={16} color={C.textHint} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />}
      </div>
    </div>
  );
}

function ToggleSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div onClick={() => onChange(!value)}
        style={{ width: "44px", height: "24px", borderRadius: "12px", background: value ? C.successText : C.borderHover, position: "relative", cursor: "pointer", transition: "background 0.3s ease", flexShrink: 0 }}>
        <motion.div layout initial={false} animate={{ x: value ? 22 : 2 }}
          style={{ width: "20px", height: "20px", borderRadius: "50%", background: C.white, position: "absolute", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
      <span style={{ fontSize: "14px", color: C.textBody, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/* ─── MODAL SHELL ────────────────────────────────────────────── */
function ModalShell({ isOpen, onClose, title, subtitle, submitLabel = "Create", onSubmit, children, loading }: {
  isOpen: boolean; onClose: () => void; title: string; subtitle: string;
  submitLabel?: string; onSubmit?: () => void; children: React.ReactNode; loading?: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }} onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.35, type: "spring", bounce: 0.25 }}
            style={{ position: "relative", width: "100%", maxWidth: "560px", margin: "24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px", boxShadow: `0 8px 32px ${C.shadowMd}`, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "28px 28px 20px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.surface, zIndex: 1 }}>
              <button onClick={onClose}
                style={{ position: "absolute", right: "20px", top: "20px", background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "4px", display: "flex", borderRadius: "6px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.textHeading)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.textHint)}>
                <X size={20} />
              </button>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.textHeading, marginBottom: "4px" }}>{title}</h2>
              <p style={{ fontSize: "13px", color: C.textMuted }}>{subtitle}</p>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>{children}</div>
            <div style={{ padding: "0 28px 24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <motion.button whileHover={{ backgroundColor: C.inputBg, borderColor: C.borderHover }} whileTap={{ scale: 0.98 }}
                onClick={onClose} disabled={loading}
                style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                Cancel
              </motion.button>
              <motion.button whileHover={{ y: -1, boxShadow: `0 4px 16px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
                onClick={onSubmit} disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`, border: "none", borderRadius: "8px", color: C.white, fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: `0 2px 8px ${C.redGlow}`, opacity: loading ? 0.7 : 1 }}>
                {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                {submitLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── DELETE MODAL ───────────────────────────────────────────── */
function DeleteModal({ isOpen, onClose, onConfirm, itemLabel, loading, warningMessage }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; itemLabel: string; loading?: boolean; warningMessage?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            style={{ position: "relative", width: "100%", maxWidth: "440px", margin: "24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", boxShadow: `0 8px 32px ${C.shadowMd}`, padding: "28px" }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: C.alertBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={20} color={C.red} />
              </div>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: C.textHeading, marginBottom: "6px" }}>Confirm Delete</h3>
                <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.5 }}>
                  This cannot be undone. <strong style={{ color: C.textBody }}>{itemLabel}</strong> will be permanently removed from the system.
                </p>
                {warningMessage && (
                  <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "8px", background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <AlertTriangle size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: "1px" }} />
                    <span style={{ fontSize: "12px", color: "#92400E", lineHeight: 1.5 }}>{warningMessage}</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <motion.button whileHover={{ backgroundColor: C.inputBg }} whileTap={{ scale: 0.98 }}
                onClick={onClose} disabled={loading}
                style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                Cancel
              </motion.button>
              <motion.button whileHover={{ y: -1, boxShadow: `0 4px 16px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
                onClick={onConfirm} disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 20px", background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`, border: "none", borderRadius: "8px", color: C.white, fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", boxShadow: `0 2px 8px ${C.redGlow}`, opacity: loading ? 0.7 : 1 }}>
                {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                Delete
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── INDUSTRY MODAL ─────────────────────────────────────────── */
interface IndustryForm { name: string; description: string; status: boolean }

function IndustryModal({ isOpen, onClose, mode = "create", initial, onSubmit, loading }: {
  isOpen: boolean; onClose: () => void; mode?: "create" | "edit";
  initial?: IndustryForm; onSubmit: (data: IndustryForm) => void; loading?: boolean;
}) {
  const [form, setForm] = useState<IndustryForm>({ name: "", description: "", status: true });
  useEffect(() => { if (isOpen) setForm(initial ?? { name: "", description: "", status: true }); }, [isOpen, initial]);
  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={mode === "create" ? "Create New Job Industry" : "Edit Job Industry"}
      subtitle={mode === "create" ? "Enter the details for the new job industry." : "Update the job industry information below."}
      submitLabel={mode === "create" ? "Create" : "Update"}
      onSubmit={() => onSubmit(form)} loading={loading}>
      <FormField label="Name" placeholder="Enter industry name" autoFocus required value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
      <FormTextArea label="Description" placeholder="Enter industry description (optional)" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} />
      <ToggleSwitch label="Active" value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} />
    </ModalShell>
  );
}

/* ─── CATEGORY MODAL ─────────────────────────────────────────── */
// FIX #1: Separate create and edit forms.
// Create form has city_id (required). Edit form does NOT have city_id.
interface CategoryCreateForm {
  name: string;
  job_industry_id: string;
  city_id: string;
  description: string;
  is_active: boolean;
  license_required: boolean;
}

interface CategoryEditForm {
  name: string;
  job_industry_id: string;
  description: string;
  is_active: boolean;
  license_required: boolean;
}

function CategoryCreateModal({ isOpen, onClose, industries, cities, citiesLoading, onSubmit, loading }: {
  isOpen: boolean; onClose: () => void;
  industries: Industry[]; cities: City[]; citiesLoading?: boolean;
  onSubmit: (data: CategoryCreateForm) => void; loading?: boolean;
}) {
  const [form, setForm] = useState<CategoryCreateForm>({ name: "", job_industry_id: "", city_id: "", description: "", is_active: true, license_required: false });
  useEffect(() => {
    if (isOpen) setForm({ name: "", job_industry_id: "", city_id: "", description: "", is_active: true, license_required: false });
  }, [isOpen]);

  const industryOptions = industries.map((i) => ({ value: String(i.id), label: i.name }));
  const cityOptions = cities
    .filter((c) => c.is_active)
    .map((c) => ({
      value: c.id,
      label: c.provinces ? `${c.name} (${c.provinces.code})` : c.name,
    }));

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title="Add New Job Category"
      subtitle="Create a new job category."
      submitLabel="Create"
      onSubmit={() => onSubmit(form)} loading={loading}>
      <FormField label="Category Name" placeholder="e.g., Healthcare, Construction, IT" autoFocus required value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
      <FormSelect label="Job Industry" placeholder="Select a job industry" options={industryOptions} value={form.job_industry_id} onChange={(v) => setForm((p) => ({ ...p, job_industry_id: v }))} />
      <FormSelect label="City" placeholder="Select a city" options={cityOptions} required value={form.city_id} onChange={(v) => setForm((p) => ({ ...p, city_id: v }))} loading={citiesLoading} />
      <FormTextArea label="Description" placeholder="Brief description of this job category..." value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <ToggleSwitch label="Active" value={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
        <ToggleSwitch label="License Required" value={form.license_required} onChange={(v) => setForm((p) => ({ ...p, license_required: v }))} />
      </div>
    </ModalShell>
  );
}

// FIX #1: Edit modal — no city field
function CategoryEditModal({ isOpen, onClose, initial, industries, onSubmit, loading }: {
  isOpen: boolean; onClose: () => void;
  initial?: CategoryEditForm; industries: Industry[];
  onSubmit: (data: CategoryEditForm) => void; loading?: boolean;
}) {
  const [form, setForm] = useState<CategoryEditForm>({ name: "", job_industry_id: "", description: "", is_active: true, license_required: false });
  useEffect(() => {
    if (isOpen) setForm(initial ?? { name: "", job_industry_id: "", description: "", is_active: true, license_required: false });
  }, [isOpen, initial]);

  const industryOptions = industries.map((i) => ({ value: String(i.id), label: i.name }));

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title="Edit Job Category"
      subtitle="Update job category information."
      submitLabel="Update"
      onSubmit={() => onSubmit(form)} loading={loading}>
      <FormField label="Category Name" placeholder="e.g., Healthcare, Construction, IT" autoFocus required value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
      <FormSelect label="Job Industry" placeholder="Select a job industry" options={industryOptions} value={form.job_industry_id} onChange={(v) => setForm((p) => ({ ...p, job_industry_id: v }))} />
      <FormTextArea label="Description" placeholder="Brief description of this job category..." value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <ToggleSwitch label="Active" value={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
        <ToggleSwitch label="License Required" value={form.license_required} onChange={(v) => setForm((p) => ({ ...p, license_required: v }))} />
      </div>
    </ModalShell>
  );
}

/* ─── GROUP MODAL ────────────────────────────────────────────── */
interface GroupForm { name: string; description: string; is_active: boolean }

function GroupModal({ isOpen, onClose, mode = "create", initial, onSubmit, loading }: {
  isOpen: boolean; onClose: () => void; mode?: "create" | "edit";
  initial?: GroupForm; onSubmit: (data: GroupForm) => void; loading?: boolean;
}) {
  const [form, setForm] = useState<GroupForm>({ name: "", description: "", is_active: true });
  useEffect(() => { if (isOpen) setForm(initial ?? { name: "", description: "", is_active: true }); }, [isOpen, initial]);
  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={mode === "create" ? "Create New Group" : "Edit Group"}
      subtitle={mode === "create" ? "Enter the details for the new group." : "Update the group details below."}
      submitLabel={mode === "create" ? "Create" : "Update"}
      onSubmit={() => onSubmit(form)} loading={loading}>
      <FormField label="Group Name" placeholder="Enter group name" autoFocus required value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
      <FormTextArea label="Job Group Description" placeholder="Describe the purpose/criteria of this group" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} />
      <ToggleSwitch label="Active" value={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
    </ModalShell>
  );
}

/* ─── PROVINCE MODAL ─────────────────────────────────────────── */
interface ProvinceForm { name: string; code: string; is_active: boolean }

function ProvinceModal({ isOpen, onClose, mode = "create", initial, onSubmit, loading }: {
  isOpen: boolean; onClose: () => void; mode?: "create" | "edit";
  initial?: ProvinceForm; onSubmit: (data: ProvinceForm) => void; loading?: boolean;
}) {
  const [form, setForm] = useState<ProvinceForm>({ name: "", code: "", is_active: true });
  useEffect(() => { if (isOpen) setForm(initial ?? { name: "", code: "", is_active: true }); }, [isOpen, initial]);
  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={mode === "create" ? "Add New Province" : "Edit Province"}
      subtitle={mode === "create" ? "Create a new province entry." : "Update province information."}
      submitLabel={mode === "create" ? "Create" : "Update"}
      onSubmit={() => onSubmit(form)} loading={loading}>
      <FormField label="Province Name" placeholder="e.g., Ontario" autoFocus required value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
      <FormField label="Province Code" placeholder="e.g., ON" required value={form.code} onChange={(v) => setForm((p) => ({ ...p, code: v.toUpperCase() }))} />
      <ToggleSwitch label="Active" value={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
    </ModalShell>
  );
}

/* ─── CITY MODAL ─────────────────────────────────────────────── */
interface CityForm { name: string; province_id: string; is_active: boolean }

function CityModal({ isOpen, onClose, mode = "create", initial, provinces, onSubmit, loading }: {
  isOpen: boolean; onClose: () => void; mode?: "create" | "edit";
  initial?: CityForm; provinces: Province[]; onSubmit: (data: CityForm) => void; loading?: boolean;
}) {
  const [form, setForm] = useState<CityForm>({ name: "", province_id: "", is_active: true });
  useEffect(() => {
    if (isOpen) setForm(initial ?? { name: "", province_id: "", is_active: true });
  }, [isOpen, initial]);

  const provinceOptions = provinces
    .filter((p) => p.is_active)
    .map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }));

  return (
    <ModalShell
      isOpen={isOpen} onClose={onClose}
      title={mode === "create" ? "Add New City" : "Edit City"}
      subtitle={mode === "create" ? "Create a new city and assign it to a province." : "Update city information."}
      submitLabel={mode === "create" ? "Create City" : "Save Changes"}
      onSubmit={() => onSubmit(form)} loading={loading}>
      <FormField label="City Name" placeholder="e.g., Toronto" autoFocus required value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
      <FormSelect label="Province" placeholder="Select a province" options={provinceOptions} required value={form.province_id} onChange={(v) => setForm((p) => ({ ...p, province_id: v }))} />
      <ToggleSwitch label="Active" value={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
    </ModalShell>
  );
}

/* ─── CAMPAIGN MODALS (from campaigns page) ──────────────────── */
function CampaignSpinner({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
      style={{ animation: "spin 0.7s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function CampaignFormField({ label, placeholder, isDate = false, value, onChange }: {
  label: string; placeholder: string; isDate?: boolean; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>{label}</label>
      <input
        type={isDate ? "date" : "text"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "12px 16px",
          background: C.inputBg,
          border: `1px solid ${focused ? C.red : C.border}`,
          borderRadius: "8px", color: C.textBody, fontSize: "14px",
          outline: "none", transition: "all 0.2s ease", fontFamily: "'DM Sans', sans-serif"
        }}
      />
    </div>
  );
}

function CampaignCreateModal({ isOpen, onClose, onCreated }: {
  isOpen: boolean; onClose: () => void; onCreated: (c: Campaign) => void;
}) {
  const [campaignName, setCampaignName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const reset = () => { setCampaignName(""); setStartDate(""); setEndDate(""); setIsSuccess(false); setErrorMsg(""); };

  const handleCreate = async () => {
    if (!campaignName || !startDate || !endDate) { setErrorMsg("Please fill in all fields."); return; }
    setIsLoading(true); setErrorMsg("");
    try {
      const res = await fetch(`${BASE_URL}/campaigns`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: campaignName, start_date: startDate, end_date: endDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        const normalized: Campaign = {
          id: data.id, name: data.name ?? campaignName,
          start_date: data.start_date ?? startDate, end_date: data.end_date ?? endDate,
          is_active: data.is_active ?? true, link_token: data.link_token,
          created_at: data.created_at, updated_at: data.updated_at, created_by: data.created_by,
        };
        setTimeout(() => { onCreated(normalized); reset(); onClose(); }, 1200);
      } else {
        setErrorMsg(data.message || "Failed to create campaign.");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}
            onClick={() => { if (!isLoading && !isSuccess) { reset(); onClose(); } }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            style={{ position: "relative", width: "100%", maxWidth: "560px", margin: "24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
            <button onClick={() => { reset(); onClose(); }} disabled={isLoading || isSuccess}
              style={{ position: "absolute", right: "24px", top: "24px", background: "transparent", border: "none", color: C.textHint, cursor: "pointer" }}>
              <X size={24} />
            </button>
            <div style={{ padding: "32px 32px 24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 600, color: C.textHeading, marginBottom: "8px" }}>Create New Campaign</h2>
              <p style={{ fontSize: "14px", color: C.textMuted }}>Define the parameters for your new recruitment campaign.</p>
            </div>
            <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <CampaignFormField label="Campaign Name" placeholder="Enter campaign name" value={campaignName} onChange={setCampaignName} />
              <div style={{ display: "flex", gap: "16px" }}>
                <CampaignFormField label="Start Date" placeholder="" isDate value={startDate} onChange={setStartDate} />
                <CampaignFormField label="End Date" placeholder="" isDate value={endDate} onChange={setEndDate} />
              </div>
              {errorMsg && <div style={{ color: C.red, fontSize: "13px", fontWeight: 500, marginTop: "-8px" }}>{errorMsg}</div>}
              <motion.button disabled={isLoading || isSuccess} onClick={handleCreate}
                whileHover={isLoading || isSuccess ? {} : { y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }}
                whileTap={isLoading || isSuccess ? {} : { scale: 0.98 }}
                style={{ width: "100%", padding: "14px", marginTop: "8px", background: isSuccess ? "#059669" : `linear-gradient(135deg, ${C.redBright}, ${C.red})`, border: "none", borderRadius: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", color: C.white, fontSize: "15px", fontWeight: 600, letterSpacing: "0.5px", cursor: isLoading || isSuccess ? "default" : "pointer", transition: "background 0.3s ease", opacity: isLoading ? 0.8 : 1 }}>
                {isLoading ? <CampaignSpinner size={18} color={C.white} /> :
                  isSuccess ? <><Check size={18} strokeWidth={2.5} /><span>Campaign Created!</span></> :
                    <span>Create Campaign</span>}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CampaignEditModal({ campaign, onClose, onSaved }: {
  campaign: Campaign | null; onClose: () => void; onSaved: (updated: Campaign) => void;
}) {
  const [name, setName] = useState(campaign?.name ?? "");
  const [startDate, setStartDate] = useState(toInputDate(campaign?.start_date ?? ""));
  const [endDate, setEndDate] = useState(toInputDate(campaign?.end_date ?? ""));
  const [isActive, setIsActive] = useState(campaign?.is_active ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setStartDate(toInputDate(campaign.start_date));
      setEndDate(toInputDate(campaign.end_date));
      setIsActive(campaign.is_active);
      setIsSuccess(false);
      setErrorMsg("");
    }
  }, [campaign]);

  const handleSave = async () => {
    if (!name || !startDate || !endDate) { setErrorMsg("Please fill in all fields."); return; }
    setIsLoading(true); setErrorMsg("");
    try {
      const res = await fetch(`${BASE_URL}/campaigns/${campaign!.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, start_date: startDate, end_date: endDate, is_active: isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated: Campaign = {
          ...campaign!,
          name: data.name ?? name,
          start_date: data.start_date ?? startDate,
          end_date: data.end_date ?? endDate,
          is_active: data.is_active ?? isActive,
          link_token: data.link_token ?? campaign!.link_token,
          updated_at: data.updated_at,
        };
        setIsSuccess(true);
        setTimeout(() => onSaved(updated), 900);
      } else {
        setErrorMsg(data.message || "Failed to update campaign.");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {campaign && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}
            onClick={() => { if (!isLoading && !isSuccess) onClose(); }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            style={{ position: "relative", width: "100%", maxWidth: "560px", margin: "24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
            <button onClick={onClose} disabled={isLoading || isSuccess}
              style={{ position: "absolute", right: "24px", top: "24px", background: "transparent", border: "none", color: C.textHint, cursor: "pointer" }}>
              <X size={24} />
            </button>
            <div style={{ padding: "32px 32px 24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 600, color: C.textHeading, marginBottom: "8px" }}>Edit Campaign</h2>
              <p style={{ fontSize: "14px", color: C.textMuted }}>Update the parameters for this campaign.</p>
            </div>
            <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <CampaignFormField label="Campaign Name" placeholder="Enter campaign name" value={name} onChange={setName} />
              <div style={{ display: "flex", gap: "16px" }}>
                <CampaignFormField label="Start Date" placeholder="" isDate value={startDate} onChange={setStartDate} />
                <CampaignFormField label="End Date" placeholder="" isDate value={endDate} onChange={setEndDate} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>Status</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div onClick={() => setIsActive((a) => !a)}
                    style={{ width: "44px", height: "24px", borderRadius: "12px", background: isActive ? C.successText : C.borderHover, position: "relative", cursor: "pointer", transition: "background 0.3s ease", flexShrink: 0 }}>
                    <motion.div layout initial={false} animate={{ x: isActive ? 22 : 2 }}
                      style={{ width: "20px", height: "20px", borderRadius: "50%", background: C.white, position: "absolute", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                  <span style={{ fontSize: "14px", color: C.textBody, fontWeight: 500 }}>{isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
              {errorMsg && <div style={{ color: C.red, fontSize: "13px", fontWeight: 500 }}>{errorMsg}</div>}
              <motion.button disabled={isLoading || isSuccess} onClick={handleSave}
                whileHover={isLoading || isSuccess ? {} : { y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }}
                whileTap={isLoading || isSuccess ? {} : { scale: 0.98 }}
                style={{ width: "100%", padding: "14px", marginTop: "8px", background: isSuccess ? "#059669" : `linear-gradient(135deg, ${C.redBright}, ${C.red})`, border: "none", borderRadius: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", color: C.white, fontSize: "15px", fontWeight: 600, letterSpacing: "0.5px", cursor: isLoading || isSuccess ? "default" : "pointer", transition: "background 0.3s ease", opacity: isLoading ? 0.8 : 1 }}>
                {isLoading ? <CampaignSpinner size={18} color={C.white} /> :
                  isSuccess ? <><Check size={18} strokeWidth={2.5} /><span>Saved!</span></> :
                    <span>Save Changes</span>}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CampaignDeleteModal({ campaign, onConfirm, onCancel, isDeleting }: {
  campaign: Campaign | null; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <AnimatePresence>
      {campaign && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
            onClick={() => { if (!isDeleting) onCancel(); }} />
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            style={{ position: "relative", width: "100%", maxWidth: "440px", margin: "24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "32px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: C.alertBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <AlertTriangle size={26} color={C.red} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.textHeading, marginBottom: "10px" }}>Delete Campaign?</h2>
            <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "28px", lineHeight: 1.6 }}>
              You are about to permanently delete <strong style={{ color: C.textBody }}>{campaign.name}</strong>. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <motion.button onClick={onCancel} disabled={isDeleting} whileHover={{ backgroundColor: C.inputBg }}
                style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: C.textLabel, cursor: "pointer", transition: "all 0.2s" }}>
                Cancel
              </motion.button>
              <motion.button onClick={onConfirm} disabled={isDeleting}
                whileHover={isDeleting ? {} : { boxShadow: `0 6px 20px ${C.redGlow}` }}
                whileTap={{ scale: 0.97 }}
                style={{ flex: 1, padding: "12px", background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`, border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: C.white, cursor: isDeleting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isDeleting ? 0.75 : 1, transition: "all 0.2s" }}>
                {isDeleting ? <CampaignSpinner size={16} color={C.white} /> : <Trash2 size={16} />}
                {isDeleting ? "Deleting…" : "Delete"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CopyLinkButton({ campaign }: { campaign: Campaign }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const link = getCampaignLink(campaign);
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.button onClick={handleCopy}
      whileHover={copied ? {} : { backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
      whileTap={{ scale: 0.95 }}
      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: copied ? C.successBg : "transparent", border: `1px solid ${copied ? "transparent" : C.border}`, borderRadius: "6px", cursor: "pointer", color: copied ? C.successText : C.textLabel, transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span style={{ fontSize: "12px", fontWeight: 600 }}>{copied ? "Copied!" : "Copy Link"}</span>
    </motion.button>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function MasterManagementPage() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("industries");
  const { toasts, add: addToast, remove: removeToast } = useToast();

  /* ── Industries State ── */
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industryLoading, setIndustryLoading] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const [industryCreateOpen, setIndustryCreateOpen] = useState(false);
  const [industryEditOpen, setIndustryEditOpen] = useState(false);
  const [industryEditTarget, setIndustryEditTarget] = useState<Industry | null>(null);
  const [industryDeleteTarget, setIndustryDeleteTarget] = useState<Industry | null>(null);
  const [industryModalLoading, setIndustryModalLoading] = useState(false);

  /* ── Categories State ── */
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false);
  const [categoryEditOpen, setCategoryEditOpen] = useState(false);
  const [categoryEditTarget, setCategoryEditTarget] = useState<Category | null>(null);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<Category | null>(null);
  const [categoryModalLoading, setCategoryModalLoading] = useState(false);

  /* ── Groups State ── */
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupCreateOpen, setGroupCreateOpen] = useState(false);
  const [groupEditOpen, setGroupEditOpen] = useState(false);
  const [groupEditTarget, setGroupEditTarget] = useState<Group | null>(null);
  const [groupDeleteTarget, setGroupDeleteTarget] = useState<Group | null>(null);
  const [groupModalLoading, setGroupModalLoading] = useState(false);

  /* ── Provinces State ── */
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceLoading, setProvinceLoading] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [provinceCreateOpen, setProvinceCreateOpen] = useState(false);
  const [provinceEditOpen, setProvinceEditOpen] = useState(false);
  const [provinceEditTarget, setProvinceEditTarget] = useState<Province | null>(null);
  const [provinceDeleteTarget, setProvinceDeleteTarget] = useState<Province | null>(null);
  const [provinceModalLoading, setProvinceModalLoading] = useState(false);

  /* ── Cities State ── */
  const [cities, setCities] = useState<City[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityProvinceFilter, setCityProvinceFilter] = useState<string>("");
  const [cityCreateOpen, setCityCreateOpen] = useState(false);
  const [cityEditOpen, setCityEditOpen] = useState(false);
  const [cityEditTarget, setCityEditTarget] = useState<City | null>(null);
  const [cityDeleteTarget, setCityDeleteTarget] = useState<City | null>(null);
  const [cityModalLoading, setCityModalLoading] = useState(false);
  const [categoryCities, setCategoryCities] = useState<City[]>([]);
  const [categoryCitiesLoading, setCategoryCitiesLoading] = useState(false);

  /* ── Campaigns State ── */
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignLoadError, setCampaignLoadError] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignCreateOpen, setCampaignCreateOpen] = useState(false);
  const [campaignEditTarget, setCampaignEditTarget] = useState<Campaign | null>(null);
  const [campaignDeleteTarget, setCampaignDeleteTarget] = useState<Campaign | null>(null);
  const [campaignDeleting, setCampaignDeleting] = useState(false);
  const [campaignActionLoading, setCampaignActionLoading] = useState<Record<number, boolean>>({});

  /* ── Fetch Industries ── */
  // FIX #2: All fetch functions now properly set loading false only after state is set.
  // CRUD handlers await the fetch before closing the modal, ensuring fresh data.
  const fetchIndustries = useCallback(async () => {
    setIndustryLoading(true);
    const { data, error } = await apiFetch<{ data: Industry[] }>("/job-industries");
    if (error) addToast(error, "error");
    else setIndustries((data as unknown as { data: Industry[] })?.data ?? []);
    setIndustryLoading(false);
  }, [addToast]);

  /* ── Fetch Categories ── */
  const fetchCategories = useCallback(async () => {
    setCategoryLoading(true);
    const { data, error } = await apiFetch<{ message: string; count: number; data: Category[] }>("/job-categories");
    if (error) addToast(error, "error");
    else {
      const raw = (data as unknown as { data: Category[] })?.data ?? [];
      setCategories(raw);
    }
    setCategoryLoading(false);
  }, [addToast]);

  /* ── Fetch Cities for Category Modal ── */
  const fetchCategoryCities = useCallback(async () => {
    setCategoryCitiesLoading(true);
    const { data, error } = await apiFetch<{ data: City[] }>("/cities");
    if (error) {
      addToast("Could not load cities for the form. " + error, "error");
    } else {
      const raw = (data as unknown as { data: City[] })?.data ?? [];
      setCategoryCities(raw.filter((c) => c.is_active));
    }
    setCategoryCitiesLoading(false);
  }, [addToast]);

  /* ── Fetch Groups ── */
  const fetchGroups = useCallback(async () => {
    setGroupLoading(true);
    const { data, error } = await apiFetch<{ data: Group[] }>("/groups");
    if (error) addToast(error, "error");
    else setGroups((data as unknown as { data: Group[] })?.data ?? []);
    setGroupLoading(false);
  }, [addToast]);

  /* ── Fetch Provinces ── */
  const fetchProvinces = useCallback(async () => {
    setProvinceLoading(true);
    const { data, error } = await apiFetch<{ data: Province[] }>("/provinces");
    if (error) addToast(error, "error");
    else setProvinces((data as unknown as { data: Province[] })?.data ?? []);
    setProvinceLoading(false);
  }, [addToast]);

  /* ── Fetch Cities ── */
  const fetchCities = useCallback(async (provinceId?: string) => {
    setCityLoading(true);
    const query = provinceId ? `?province_id=${provinceId}` : "";
    const { data, error } = await apiFetch<{ data: City[]; count: number }>(`/cities${query}`);
    if (error) addToast(error, "error");
    else {
      const raw = (data as unknown as { data: City[] })?.data ?? [];
      const normalized = raw.map((c) => ({
        ...c,
        candidate_count: c.candidate_count ?? c.candidates?.[0]?.count ?? 0,
      }));
      setCities(normalized);
    }
    setCityLoading(false);
  }, [addToast]);

  /* ── Fetch Campaigns ── */
  const fetchCampaigns = useCallback(async () => {
    setCampaignLoading(true);
    setCampaignLoadError("");
    try {
      const res = await fetch(`${BASE_URL}/campaigns`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err: unknown) {
      setCampaignLoadError(err instanceof Error ? err.message : "Failed to load campaigns.");
    } finally {
      setCampaignLoading(false);
    }
  }, []);

  useEffect(() => { fetchIndustries(); }, [fetchIndustries]);
  useEffect(() => {
    if (activeSubTab === "categories") {
      fetchCategories();
      if (categoryCities.length === 0) fetchCategoryCities();
      if (industries.length === 0) fetchIndustries();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]);
  useEffect(() => { if (activeSubTab === "groups") fetchGroups(); }, [activeSubTab, fetchGroups]);
  useEffect(() => { if (activeSubTab === "provinces") fetchProvinces(); }, [activeSubTab, fetchProvinces]);
  useEffect(() => {
    if (activeSubTab === "cities") {
      fetchCities(cityProvinceFilter || undefined);
      if (provinces.length === 0) fetchProvinces();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab, cityProvinceFilter]);
  useEffect(() => { if (activeSubTab === "campaigns") fetchCampaigns(); }, [activeSubTab, fetchCampaigns]);

  /* ── Industry CRUD ── */
  const handleIndustryCreate = async (form: IndustryForm) => {
    setIndustryModalLoading(true);
    const { error } = await apiFetch<Industry>("/job-industries", {
      method: "POST",
      body: JSON.stringify({ name: form.name, description: form.description, status: form.status ? "active" : "inactive" }),
    });
    if (error) { addToast(error, "error"); setIndustryModalLoading(false); return; }
    addToast(`Industry "${form.name}" created successfully!`);
    setIndustryCreateOpen(false);
    // FIX #2: await the fetch so UI reflects fresh server data
    await fetchIndustries();
    setIndustryModalLoading(false);
  };

  const handleIndustryEdit = async (form: IndustryForm) => {
    if (!industryEditTarget) return;
    setIndustryModalLoading(true);
    const { error } = await apiFetch(`/job-industries/${industryEditTarget.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: form.name, description: form.description, status: form.status ? "active" : "inactive" }),
    });
    if (error) { addToast(error, "error"); setIndustryModalLoading(false); return; }
    addToast("Industry updated successfully!");
    setIndustryEditOpen(false);
    setIndustryEditTarget(null);
    await fetchIndustries();
    setIndustryModalLoading(false);
  };

  const handleIndustryDelete = async () => {
    if (!industryDeleteTarget) return;
    setIndustryModalLoading(true);
    const { error } = await apiFetch(`/job-industries/${industryDeleteTarget.id}`, { method: "DELETE" });
    if (error) { addToast(error, "error"); setIndustryModalLoading(false); return; }
    addToast(`Industry "${industryDeleteTarget.name}" deleted.`);
    setIndustryDeleteTarget(null);
    await fetchIndustries();
    setIndustryModalLoading(false);
  };

  /* ── Category CRUD ── */
  const handleCategoryCreate = async (form: CategoryCreateForm) => {
    if (!form.name.trim()) { addToast("Category name is required.", "error"); return; }
    if (!form.city_id) { addToast("Please select a city.", "error"); return; }

    setCategoryModalLoading(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      is_active: form.is_active,
      license_required: form.license_required,
      city_id: form.city_id,
    };
    if (form.job_industry_id) payload.job_industry_id = form.job_industry_id;
    if (form.description) payload.description = form.description;

    const { error } = await apiFetch<{ data: Category; message: string }>("/job-categories/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (error) { addToast(error, "error"); setCategoryModalLoading(false); return; }
    addToast(`Category "${form.name}" created successfully!`);
    setCategoryCreateOpen(false);
    // FIX #2: await fresh data
    await fetchCategories();
    setCategoryModalLoading(false);
  };

  // FIX #1 + FIX #2: Edit handler uses CategoryEditForm (no city_id), awaits fetch
  const handleCategoryEdit = async (form: CategoryEditForm) => {
    if (!categoryEditTarget) return;
    if (!form.name.trim()) { addToast("Category name cannot be empty.", "error"); return; }

    setCategoryModalLoading(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      is_active: form.is_active,
      license_required: form.license_required,
    };
    if (form.job_industry_id) payload.job_industry_id = form.job_industry_id;
    if (form.description !== undefined) payload.description = form.description;

    const { error } = await apiFetch(`/job-categories/${categoryEditTarget.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (error) { addToast(error, "error"); setCategoryModalLoading(false); return; }
    addToast(`Category "${form.name}" updated successfully!`);
    setCategoryEditOpen(false);
    setCategoryEditTarget(null);
    await fetchCategories();
    setCategoryModalLoading(false);
  };

  const handleCategoryDelete = async () => {
    if (!categoryDeleteTarget) return;
    setCategoryModalLoading(true);
    const { error } = await apiFetch(`/job-categories/${categoryDeleteTarget.id}`, { method: "DELETE" });
    if (error) { addToast(error, "error"); setCategoryModalLoading(false); return; }
    addToast(`Category "${categoryDeleteTarget.name}" deleted.`);
    setCategoryDeleteTarget(null);
    await fetchCategories();
    setCategoryModalLoading(false);
  };

  /* ── Group CRUD ── */
  const handleGroupCreate = async (form: GroupForm) => {
    setGroupModalLoading(true);
    const { error } = await apiFetch<{ data: Group }>("/groups", {
      method: "POST",
      body: JSON.stringify({ name: form.name, description: form.description, is_active: form.is_active }),
    });
    if (error) { addToast(error, "error"); setGroupModalLoading(false); return; }
    addToast(`Group "${form.name}" created successfully!`);
    setGroupCreateOpen(false);
    await fetchGroups();
    setGroupModalLoading(false);
  };

  const handleGroupEdit = async (form: GroupForm) => {
    if (!groupEditTarget) return;
    setGroupModalLoading(true);
    const { error } = await apiFetch(`/groups/${groupEditTarget.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: form.name, description: form.description, is_active: form.is_active }),
    });
    if (error) { addToast(error, "error"); setGroupModalLoading(false); return; }
    addToast("Group updated successfully!");
    setGroupEditOpen(false);
    setGroupEditTarget(null);
    await fetchGroups();
    setGroupModalLoading(false);
  };

  const handleGroupDelete = async () => {
    if (!groupDeleteTarget) return;
    setGroupModalLoading(true);
    const { error } = await apiFetch(`/groups/${groupDeleteTarget.id}`, { method: "DELETE" });
    if (error) { addToast(error, "error"); setGroupModalLoading(false); return; }
    addToast(`Group "${groupDeleteTarget.name}" deleted.`);
    setGroupDeleteTarget(null);
    await fetchGroups();
    setGroupModalLoading(false);
  };

  /* ── Province CRUD ── */
  const handleProvinceCreate = async (form: ProvinceForm) => {
    setProvinceModalLoading(true);
    const { error } = await apiFetch<{ data: Province }>("/provinces", {
      method: "POST",
      body: JSON.stringify({ name: form.name, code: form.code, is_active: form.is_active }),
    });
    if (error) { addToast(error, "error"); setProvinceModalLoading(false); return; }
    addToast(`Province "${form.name}" created successfully!`);
    setProvinceCreateOpen(false);
    await fetchProvinces();
    setProvinceModalLoading(false);
  };

  const handleProvinceEdit = async (form: ProvinceForm) => {
    if (!provinceEditTarget) return;
    setProvinceModalLoading(true);
    const { error } = await apiFetch(`/provinces/${provinceEditTarget.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: form.name, code: form.code, is_active: form.is_active }),
    });
    if (error) { addToast(error, "error"); setProvinceModalLoading(false); return; }
    addToast("Province updated successfully!");
    setProvinceEditOpen(false);
    setProvinceEditTarget(null);
    await fetchProvinces();
    setProvinceModalLoading(false);
  };

  const handleProvinceDelete = async () => {
    if (!provinceDeleteTarget) return;
    setProvinceModalLoading(true);
    const { error } = await apiFetch(`/provinces/${provinceDeleteTarget.id}`, { method: "DELETE" });
    if (error) { addToast(error, "error"); setProvinceModalLoading(false); return; }
    addToast(`Province "${provinceDeleteTarget.name}" deleted.`);
    setProvinceDeleteTarget(null);
    await fetchProvinces();
    setProvinceModalLoading(false);
  };

  /* ── City CRUD ── */
  const handleCityCreate = async (form: CityForm) => {
    if (!form.name.trim()) { addToast("City name is required.", "error"); return; }
    if (!form.province_id) { addToast("Please select a province.", "error"); return; }
    setCityModalLoading(true);
    const { error } = await apiFetch<{ data: City; message: string }>("/cities", {
      method: "POST",
      body: JSON.stringify({ name: form.name.trim(), province_id: form.province_id, is_active: form.is_active }),
    });
    if (error) { addToast(error, "error"); setCityModalLoading(false); return; }
    addToast(`City "${form.name}" created successfully!`);
    setCityCreateOpen(false);
    await fetchCities(cityProvinceFilter || undefined);
    setCityModalLoading(false);
  };

  const handleCityEdit = async (form: CityForm) => {
    if (!cityEditTarget) return;
    if (!form.name.trim()) { addToast("City name cannot be empty.", "error"); return; }
    setCityModalLoading(true);
    const payload: Partial<{ name: string; province_id: string; is_active: boolean }> = {};
    if (form.name.trim()) payload.name = form.name.trim();
    if (form.province_id) payload.province_id = form.province_id;
    payload.is_active = form.is_active;
    const { error } = await apiFetch(`/cities/${cityEditTarget.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (error) { addToast(error, "error"); setCityModalLoading(false); return; }
    addToast(`City "${form.name}" updated successfully!`);
    setCityEditOpen(false);
    setCityEditTarget(null);
    await fetchCities(cityProvinceFilter || undefined);
    setCityModalLoading(false);
  };

  const handleCityDelete = async () => {
    if (!cityDeleteTarget) return;
    setCityModalLoading(true);
    const { error } = await apiFetch(`/cities/${cityDeleteTarget.id}`, { method: "DELETE" });
    if (error) { addToast(error, "error"); setCityModalLoading(false); return; }
    addToast(`City "${cityDeleteTarget.name}" deleted.`);
    setCityDeleteTarget(null);
    await fetchCities(cityProvinceFilter || undefined);
    setCityModalLoading(false);
  };

  /* ── Campaign CRUD ── */
  const handleCampaignCreated = (newCampaign: Campaign) => {
    setCampaigns((prev) => [newCampaign, ...prev]);
    addToast("Campaign created successfully!");
  };

  const handleCampaignUpdated = (updated: Campaign) => {
    setCampaigns((prev) => prev.map((c) => Number(c.id) === Number(updated.id) ? updated : c));
    setCampaignEditTarget(null);
    addToast("Campaign updated successfully.");
  };

  const handleCampaignDeleteConfirm = async () => {
    if (!campaignDeleteTarget) return;
    setCampaignDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/campaigns/${campaignDeleteTarget.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignDeleteTarget.id));
        addToast("Campaign deleted successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.message || "Failed to delete campaign.", "error");
      }
    } catch {
      addToast("A network error occurred.", "error");
    } finally {
      setCampaignDeleting(false);
      setCampaignDeleteTarget(null);
    }
  };

const handleToggleCampaignStatus = async (camp: Campaign) => {
    setCampaignActionLoading((prev) => ({ ...prev, [camp.id]: true }));
    const newActiveState = !camp.is_active;
    const action = newActiveState ? "activate" : "deactivate"; // Determine endpoint dynamically

    try {
      // Append the action to the URL and remove the body payload
      const res = await fetch(`${BASE_URL}/campaigns/${camp.id}/${action}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((c) => c.id === camp.id ? { ...c, is_active: data.is_active ?? newActiveState } : c)
        );
        addToast(`Campaign ${newActiveState ? "activated" : "deactivated"} successfully.`);
      } else {
        addToast(data.message || "Failed to update campaign status.", "error");
      }
    } catch {
      addToast("A network error occurred.", "error");
    } finally {
      setCampaignActionLoading((prev) => { const n = { ...prev }; delete n[camp.id]; return n; });
    }
  };

  /* ── Filtered data ── */
  const filteredIndustries = industries.filter((i) =>
    i.name?.toLowerCase().includes(industrySearch.toLowerCase()) ||
    i.description?.toLowerCase().includes(industrySearch.toLowerCase())
  );
  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(categorySearch.toLowerCase()) ||
    c.job_industry?.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.description?.toLowerCase().includes(groupSearch.toLowerCase())
  );
  const filteredProvinces = provinces.filter((p) =>
    p.name?.toLowerCase().includes(provinceSearch.toLowerCase()) ||
    p.code?.toLowerCase().includes(provinceSearch.toLowerCase())
  );
  const filteredCities = cities.filter((c) => {
    const q = citySearch.toLowerCase();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.provinces?.name?.toLowerCase().includes(q) ||
      c.provinces?.code?.toLowerCase().includes(q)
    );
  });
  const filteredCampaigns = campaigns.filter((c) =>
    c.name?.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const provinceFilterOptions = provinces.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }));

  /* ── Sub-Nav ── */
  const renderSubNav = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
      className="sub-nav-container"
      style={{ display: "flex", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "6px", marginBottom: "32px", overflowX: "auto", whiteSpace: "nowrap" }}>
      {SUB_TABS.map((tab) => {
        const isActive = activeSubTab === tab.id;
        const Icon = tab.icon;
        return (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
            style={{ flex: 1, minWidth: "150px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", background: "transparent", border: "none", borderRadius: "8px", cursor: "pointer", color: isActive ? C.red : C.textLabel, fontSize: "14px", fontWeight: isActive ? 600 : 500, position: "relative", transition: "color 0.2s ease" }}>
            {isActive && <motion.div layoutId="masterSubNav" style={{ position: "absolute", inset: 0, background: C.redActiveBg, borderRadius: "8px" }} />}
            <Icon size={16} style={{ position: "relative", zIndex: 1 }} />
            <span style={{ position: "relative", zIndex: 1 }}>{tab.label}</span>
          </button>
        );
      })}
    </motion.div>
  );

  /* ── Render Industries ── */
  const renderIndustries = () => (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="clean-card" style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading, marginBottom: "4px" }}>Job Industries</h2>
          <p style={{ fontSize: "14px", color: C.textMuted }}>Manage job industries and their configurations</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button onClick={fetchIndustries} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            <RefreshCw size={14} style={{ animation: industryLoading ? "spin 1s linear infinite" : "none" }} /> Refresh
          </motion.button>
          <AddButton label="Add Industry" onClick={() => setIndustryCreateOpen(true)} />
        </div>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <SearchBar placeholder="Search by name or description" value={industrySearch} onChange={setIndustrySearch} />
      </div>
      {industryLoading ? <LoadingState /> : filteredIndustries.length === 0 ? (
        <EmptyState message="No industries found." hint={industrySearch ? "Try a different search term." : "Add your first job industry to get started."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredIndustries.map((item) => (
            <motion.div key={item.id} variants={itemVars} whileHover={{ backgroundColor: C.inputBg }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", transition: "background-color 0.2s" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: C.textHeading }}>{item.name}</span>
                  {item.status ? <StatusBadge status={item.status} /> : <BoolStatusBadge active={item.is_active ?? true} />}
                </div>
                {item.description && <span style={{ fontSize: "13px", color: C.textMuted }}>{item.description}</span>}
                <span style={{ fontSize: "12px", color: C.textMuted }}>
                  Created: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                </span>
              </div>
              <ActionButtons
                onEdit={() => { setIndustryEditTarget(item); setIndustryEditOpen(true); }}
                onDelete={() => setIndustryDeleteTarget(item)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  /* ── Render Categories ── */
  const renderCategories = () => (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="clean-card" style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading, marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={20} color={C.red} strokeWidth={2} /> Job Categories Management
          </h2>
          <p style={{ fontSize: "14px", color: C.textMuted }}>Manage job categories and license requirements for candidate applications</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button onClick={fetchCategories} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            <RefreshCw size={14} style={{ animation: categoryLoading ? "spin 1s linear infinite" : "none" }} /> Refresh
          </motion.button>
          <AddButton label="Add Category" onClick={() => {
            if (categoryCities.length === 0) fetchCategoryCities();
            setCategoryCreateOpen(true);
          }} />
        </div>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <SearchBar placeholder="Search job categories..." value={categorySearch} onChange={setCategorySearch} />
      </div>
      {categoryLoading ? <LoadingState /> : filteredCategories.length === 0 ? (
        <EmptyState message="No categories found." hint={categorySearch ? "Try a different search term." : undefined} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {filteredCategories.map((item) => (
            <motion.div key={item.id} variants={itemVars} whileHover={{ borderColor: C.borderHover, boxShadow: `0 4px 16px ${C.shadow}` }}
              style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", minHeight: "140px", transition: "all 0.2s" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 600, color: C.textHeading }}>{item.name}</span>
                  <BoolStatusBadge active={item.is_active} />
                </div>
                {item.job_industry?.name && (
                  <span style={{ fontSize: "13px", color: C.textMuted }}>Industry: {item.job_industry.name}</span>
                )}
                {item.city && (
                  <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Map size={11} /> {item.city.name}
                  </div>
                )}
                {item.description && <p style={{ fontSize: "12px", color: C.textMuted, marginTop: "6px" }}>{item.description}</p>}
                {item.license_required && (
                  <div style={{ marginTop: "8px", display: "inline-flex", padding: "3px 8px", borderRadius: "6px", background: "rgba(59,130,246,0.08)", color: "#3B82F6", fontSize: "11px", fontWeight: 600 }}>
                    License Required
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                <span style={{ fontSize: "11px", color: C.textHint }}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                </span>
                <ActionButtons
                  onEdit={() => {
                    setCategoryEditTarget(item);
                    setCategoryEditOpen(true);
                  }}
                  onDelete={() => setCategoryDeleteTarget(item)}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  /* ── Render Groups ── */
  const renderGroups = () => (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="clean-card" style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading, marginBottom: "4px" }}>Master Groups</h2>
          <p style={{ fontSize: "14px", color: C.textMuted }}>Create groups to shortlist and manage candidates</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button onClick={fetchGroups} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            <RefreshCw size={14} style={{ animation: groupLoading ? "spin 1s linear infinite" : "none" }} /> Refresh
          </motion.button>
          <AddButton label="Add Group" onClick={() => setGroupCreateOpen(true)} />
        </div>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <SearchBar placeholder="Search groups..." value={groupSearch} onChange={setGroupSearch} />
      </div>
      {groupLoading ? <LoadingState /> : filteredGroups.length === 0 ? (
        <EmptyState message="No groups found." hint={groupSearch ? "Try a different search term." : undefined} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredGroups.map((item) => (
            <motion.div key={item.id} variants={itemVars} whileHover={{ backgroundColor: C.inputBg }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", transition: "background-color 0.2s" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Users size={18} color={C.textHint} />
                  <span style={{ fontSize: "16px", fontWeight: 600, color: C.textHeading }}>{item.name}</span>
                  <BoolStatusBadge active={item.is_active} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {item.description && <span style={{ fontSize: "13px", color: C.textMuted }}>{item.description}</span>}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontSize: "12px", color: C.textHint }}>
                      Created: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    </span>
                    {typeof item.member_count === "number" && (
                      <span style={{ fontSize: "12px", color: C.textMuted, display: "flex", alignItems: "center", gap: "4px" }}>
                        <Users size={12} /> {item.member_count} {item.member_count === 1 ? "member" : "members"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ActionButtons
                onEdit={() => { setGroupEditTarget(item); setGroupEditOpen(true); }}
                onDelete={() => setGroupDeleteTarget(item)}
                loading={groupModalLoading}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  /* ── Render Campaigns (fully integrated from campaigns page) ── */
  const campaignTableGrid = "1.8fr 1fr 1fr 1fr 1fr 0.9fr";

  const renderCampaigns = () => (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="clean-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading, marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
            <LinkIcon size={20} color={C.red} strokeWidth={2} /> Campaigns Management
          </h2>
          <p style={{ fontSize: "14px", color: C.textMuted }}>
            Create and manage recruitment campaigns with registration links
            {!campaignLoading && !campaignLoadError && (
              <span style={{ marginLeft: "8px", fontSize: "13px", color: C.textHint }}>({campaigns.length} total)</span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button onClick={fetchCampaigns} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            <RefreshCw size={14} style={{ animation: campaignLoading ? "spin 0.7s linear infinite" : "none" }} /> Refresh
          </motion.button>
          <AddButton label="Create Campaign" onClick={() => setCampaignCreateOpen(true)} />
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "16px 32px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ position: "relative", maxWidth: "320px" }}>
          <Search size={16} color={C.textHint} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" placeholder="Search campaigns..."
            value={campaignSearch} onChange={(e) => setCampaignSearch(e.target.value)}
            style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px 16px 10px 40px", color: C.textBody, fontSize: "14px", width: "100%", outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => (e.target.style.borderColor = C.red)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>
      </div>

      {/* Body */}
      {campaignLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "60px", color: C.textMuted, fontSize: "15px" }}>
          <CampaignSpinner size={22} color={C.red} /> Loading campaigns…
        </div>
      )}

      {!campaignLoading && campaignLoadError && (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: C.red, fontSize: "14px", marginBottom: "16px" }}>{campaignLoadError}</p>
          <motion.button onClick={fetchCampaigns} whileHover={{ backgroundColor: C.redActiveBg }}
            style={{ padding: "10px 20px", border: `1px solid ${C.red}`, borderRadius: "8px", background: "transparent", color: C.red, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Retry
          </motion.button>
        </div>
      )}

      {!campaignLoading && !campaignLoadError && filteredCampaigns.length === 0 && (
        campaignSearch
          ? <div style={{ padding: "60px", textAlign: "center", color: C.textMuted }}>No campaigns match &ldquo;{campaignSearch}&rdquo;.</div>
          : <div style={{ textAlign: "center", padding: "80px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: C.inputBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={28} color={C.textHint} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading }}>No Campaigns Yet</h3>
            <p style={{ fontSize: "14px", color: C.textMuted, maxWidth: "320px", lineHeight: 1.6 }}>
              You haven&apos;t created any campaigns. Click below to get started.
            </p>
            <motion.button onClick={() => setCampaignCreateOpen(true)}
              whileHover={{ y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", marginTop: "8px", background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`, border: "none", borderRadius: "8px", color: C.white, fontSize: "14px", fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${C.redGlow}` }}>
              <Plus size={18} /> Create First Campaign
            </motion.button>
          </div>
      )}

      {!campaignLoading && !campaignLoadError && filteredCampaigns.length > 0 && (
        <div className="table-container">
          <div className="table-min-width">
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: campaignTableGrid, padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: C.inputBg }}>
              {["Name", "Start Date", "End Date", "Status", "Link", "Actions"].map((h) => (
                <span key={h} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: C.textHint, fontWeight: 600 }}>{h}</span>
              ))}
            </div>
            {/* Rows */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredCampaigns.map((camp, idx) => {
                const isToggling = !!campaignActionLoading[camp.id];
                return (
                  <motion.div key={camp.id} variants={itemVars}
                    whileHover={{ backgroundColor: C.inputBg }}
                    style={{ display: "grid", gridTemplateColumns: campaignTableGrid, alignItems: "center", padding: "20px 32px", borderBottom: idx !== filteredCampaigns.length - 1 ? `1px solid ${C.border}` : "none", transition: "background-color 0.2s ease" }}>
                    {/* Name */}
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: C.textHeading }}>{camp.name}</div>
                      <div style={{ fontSize: "11px", color: C.textHint, marginTop: "2px" }}>ID: {camp.id}</div>
                    </div>
                    {/* Start */}
                    <div style={{ fontSize: "14px", color: C.textMuted }}>{formatCampaignDate(camp.start_date)}</div>
                    {/* End */}
                    <div style={{ fontSize: "14px", color: C.textMuted }}>{formatCampaignDate(camp.end_date)}</div>
                    {/* Status */}
                    <div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", background: camp.is_active ? C.successBg : C.inactiveBg, color: camp.is_active ? C.successText : C.inactiveText, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {camp.is_active && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.successText }} />}
                        {camp.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                    {/* Copy Link */}
                    <div><CopyLinkButton campaign={camp} /></div>
                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <motion.button onClick={() => setCampaignEditTarget(camp)}
                        whileHover={{ scale: 1.1, color: C.red }} whileTap={{ scale: 0.9 }}
                        title="Edit campaign"
                        style={{ background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "7px", transition: "color 0.2s", borderRadius: "6px" }}>
                        <Edit2 size={17} />
                      </motion.button>
                      <motion.button onClick={() => handleToggleCampaignStatus(camp)} disabled={isToggling}
                        whileHover={isToggling ? {} : { scale: 1.1, color: camp.is_active ? C.redBright : C.successText }}
                        whileTap={{ scale: 0.9 }}
                        title={camp.is_active ? "Deactivate" : "Activate"}
                        style={{ background: "transparent", border: "none", color: C.textHint, cursor: isToggling ? "default" : "pointer", padding: "7px", transition: "color 0.2s", borderRadius: "6px", opacity: isToggling ? 0.5 : 1 }}>
                        {isToggling ? <CampaignSpinner size={17} /> : camp.is_active ? <EyeOff size={17} /> : <Eye size={17} />}
                      </motion.button>
                      <motion.button onClick={() => setCampaignDeleteTarget(camp)}
                        whileHover={{ scale: 1.1, color: C.redBright }} whileTap={{ scale: 0.9 }}
                        title="Delete campaign"
                        style={{ background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "7px", transition: "color 0.2s", borderRadius: "6px" }}>
                        <Trash2 size={17} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, color: C.pendingText }} whileTap={{ scale: 0.9 }}
                        title="Open campaign link"
                        onClick={() => window.open(getCampaignLink(camp), "_blank")}
                        style={{ background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "7px", transition: "color 0.2s", borderRadius: "6px" }}>
                        <ExternalLink size={17} />
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
  );

  /* ── Render Provinces ── */
  const renderProvinces = () => (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="clean-card" style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading, marginBottom: "4px" }}>Provinces Management</h2>
          <p style={{ fontSize: "14px", color: C.textMuted }}>Manage provinces and territories for candidate locations</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button onClick={fetchProvinces} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            <RefreshCw size={14} style={{ animation: provinceLoading ? "spin 1s linear infinite" : "none" }} /> Refresh
          </motion.button>
          <AddButton label="Add Province" onClick={() => setProvinceCreateOpen(true)} />
        </div>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <SearchBar placeholder="Search provinces..." value={provinceSearch} onChange={setProvinceSearch} />
      </div>
      {provinceLoading ? <LoadingState /> : filteredProvinces.length === 0 ? (
        <EmptyState message="No provinces found." hint={provinceSearch ? "Try a different search term." : undefined} />
      ) : (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", padding: "16px 24px", background: C.inputBg, borderBottom: `1px solid ${C.border}` }}>
            {["Province Name", "Code", "Cities", "Status", "Actions"].map((h) => (
              <span key={h} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: C.textHint, fontWeight: 600 }}>{h}</span>
            ))}
          </div>
          {filteredProvinces.map((item, idx) => (
            <motion.div key={item.id} variants={itemVars} whileHover={{ backgroundColor: C.inputBg }}
              style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", alignItems: "center", padding: "16px 24px", borderBottom: idx !== filteredProvinces.length - 1 ? `1px solid ${C.border}` : "none", background: C.surface, transition: "background-color 0.2s" }}>
              <span style={{ fontSize: "15px", fontWeight: 600, color: C.textHeading }}>{item.name}</span>
              <span style={{ fontSize: "14px", color: C.textMuted, fontWeight: 500 }}>{item.code}</span>
              <span style={{ fontSize: "14px", color: C.textMuted }}>
                {typeof item.city_count === "number" ? `${item.city_count} ${item.city_count === 1 ? "city" : "cities"}` : "—"}
              </span>
              <div><BoolStatusBadge active={item.is_active} /></div>
              <ActionButtons
                onEdit={() => { setProvinceEditTarget(item); setProvinceEditOpen(true); }}
                onDelete={() => setProvinceDeleteTarget(item)}
                loading={provinceModalLoading}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  /* ── Render Cities ── */
  const renderCities = () => {
    const activeFilterLabel = cityProvinceFilter
      ? provinces.find((p) => p.id === cityProvinceFilter)?.name ?? "Filtered"
      : null;

    return (
      <motion.div variants={containerVars} initial="hidden" animate="show" className="clean-card" style={{ padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading, marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Map size={20} color={C.red} strokeWidth={2} /> Cities Management
            </h2>
            <p style={{ fontSize: "14px", color: C.textMuted }}>
              Manage cities for candidate locations within provinces
              {filteredCities.length > 0 && (
                <span style={{ marginLeft: "8px", fontSize: "13px", color: C.textHint }}>
                  — {filteredCities.length} {filteredCities.length === 1 ? "city" : "cities"}{activeFilterLabel ? ` in ${activeFilterLabel}` : ""}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <motion.button onClick={() => fetchCities(cityProvinceFilter || undefined)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              <RefreshCw size={14} style={{ animation: cityLoading ? "spin 1s linear infinite" : "none" }} /> Refresh
            </motion.button>
            <AddButton label="Add City" onClick={() => setCityCreateOpen(true)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", marginBottom: "24px", alignItems: "start" }}>
          <SearchBar placeholder="Search by city name or province…" value={citySearch} onChange={setCitySearch} />
          <div style={{ position: "relative", minWidth: "220px" }}>
            <Filter size={15} color={cityProvinceFilter ? C.red : C.textHint}
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
            <select value={cityProvinceFilter}
              onChange={(e) => { setCityProvinceFilter(e.target.value); setCitySearch(""); }}
              style={{ width: "100%", padding: "12px 36px 12px 38px", background: cityProvinceFilter ? C.redActiveBg : C.inputBg, border: `1px solid ${cityProvinceFilter ? C.red : C.border}`, borderRadius: "8px", color: cityProvinceFilter ? C.red : C.textHint, fontSize: "14px", fontWeight: cityProvinceFilter ? 600 : 400, outline: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
              <option value="">All Provinces</option>
              {provinceFilterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={15} color={cityProvinceFilter ? C.red : C.textHint}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
        </div>

        {activeFilterLabel && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 10px 5px 12px", background: C.redActiveBg, border: `1px solid ${C.red}`, borderRadius: "20px" }}>
              <MapPin size={12} color={C.red} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: C.red }}>{activeFilterLabel}</span>
              <button onClick={() => setCityProvinceFilter("")}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: C.red, marginLeft: "2px", padding: "1px" }}>
                <X size={12} />
              </button>
            </div>
            <span style={{ fontSize: "12px", color: C.textHint }}>Showing cities in this province only</span>
          </motion.div>
        )}

        {cityLoading ? (
          <LoadingState />
        ) : filteredCities.length === 0 ? (
          <EmptyState
            message={citySearch ? `No cities matching "${citySearch}"` : activeFilterLabel ? `No cities found in ${activeFilterLabel}` : "No cities found."}
            hint={citySearch || activeFilterLabel ? "Try clearing the filter or search to see all cities." : "Add your first city to get started."}
          />
        ) : (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.4fr 0.8fr 1fr 120px", padding: "14px 24px", background: C.inputBg, borderBottom: `1px solid ${C.border}` }}>
              {["City Name", "Province", "Candidates", "Status", "Actions"].map((h) => (
                <span key={h} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: C.textHint, fontWeight: 600 }}>{h}</span>
              ))}
            </div>
            {filteredCities.map((item, idx) => {
              const candidateCount = item.candidate_count ?? 0;
              const hasActiveCandidates = candidateCount > 0;
              return (
                <motion.div key={item.id} variants={itemVars} whileHover={{ backgroundColor: C.inputBg }}
                  style={{ display: "grid", gridTemplateColumns: "1.8fr 1.4fr 0.8fr 1fr 120px", alignItems: "center", padding: "16px 24px", borderBottom: idx !== filteredCities.length - 1 ? `1px solid ${C.border}` : "none", background: C.surface, transition: "background-color 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: C.redActiveBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Map size={14} color={C.red} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: C.textHeading }}>{item.name}</div>
                      <div style={{ fontSize: "11px", color: C.textHint }}>
                        Added {item.created_at ? new Date(item.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "14px", color: C.textBody, fontWeight: 500 }}>{item.provinces?.name ?? "—"}</span>
                    {item.provinces?.code && <span style={{ fontSize: "11px", color: C.textHint, fontWeight: 600, letterSpacing: "0.5px" }}>{item.provinces.code}</span>}
                  </div>
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: hasActiveCandidates ? "rgba(59,130,246,0.08)" : C.inputBg, color: hasActiveCandidates ? "#3B82F6" : C.textHint }}>
                      <Users size={11} />{candidateCount.toLocaleString()}
                    </span>
                  </div>
                  <div><BoolStatusBadge active={item.is_active} /></div>
                  <ActionButtons
                    onEdit={() => { setCityEditTarget(item); setCityEditOpen(true); }}
                    onDelete={() => setCityDeleteTarget(item)}
                    loading={cityModalLoading}
                    deleteDisabled={hasActiveCandidates}
                    deleteDisabledReason={hasActiveCandidates ? `This city has ${candidateCount} active candidate${candidateCount !== 1 ? "s" : ""}. Remove them first before deleting.` : undefined}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };

  /* ── Edit initial forms ── */
  const industryEditInitial: IndustryForm | undefined = industryEditTarget
    ? { name: industryEditTarget.name, description: industryEditTarget.description ?? "", status: industryEditTarget.status === "active" || industryEditTarget.is_active === true }
    : undefined;

  // FIX #1: Edit form no longer includes city_id
  const categoryEditInitial: CategoryEditForm | undefined = categoryEditTarget
    ? {
        name: categoryEditTarget.name,
        job_industry_id: categoryEditTarget.job_industry_id ?? "",
        description: categoryEditTarget.description ?? "",
        is_active: categoryEditTarget.is_active,
        license_required: categoryEditTarget.license_required,
      }
    : undefined;

  const groupEditInitial: GroupForm | undefined = groupEditTarget
    ? { name: groupEditTarget.name, description: groupEditTarget.description ?? "", is_active: groupEditTarget.is_active }
    : undefined;

  const provinceEditInitial: ProvinceForm | undefined = provinceEditTarget
    ? { name: provinceEditTarget.name, code: provinceEditTarget.code, is_active: provinceEditTarget.is_active }
    : undefined;

  const cityEditInitial: CityForm | undefined = cityEditTarget
    ? { name: cityEditTarget.name, province_id: cityEditTarget.province_id, is_active: cityEditTarget.is_active }
    : undefined;

  const cityDeleteWarning = cityDeleteTarget && (cityDeleteTarget.candidate_count ?? 0) > 0
    ? `This city has ${cityDeleteTarget.candidate_count} candidate${cityDeleteTarget.candidate_count !== 1 ? "s" : ""} associated. Deleting may affect their records.`
    : undefined;

  return (
    <>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} activeTab="master_mgmt" setActiveTab={() => {}} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", position: "relative" }}>
          <TopNav />
          <main style={{ padding: "40px", maxWidth: "1600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column" }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: "32px" }}>
              <h1 style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: 600, color: C.textHeading, marginBottom: "8px", letterSpacing: "-0.5px" }}>
                <Settings size={32} color={C.red} strokeWidth={2} /> Master Management
              </h1>
              <p style={{ fontSize: "15px", color: C.textMuted }}>Manage job industries, job categories, campaigns, provinces, cities and their configurations.</p>
            </motion.div>

            {renderSubNav()}

            <AnimatePresence mode="wait">
              <motion.div key={activeSubTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                {activeSubTab === "industries" && renderIndustries()}
                {activeSubTab === "categories" && renderCategories()}
                {activeSubTab === "groups"     && renderGroups()}
                {activeSubTab === "campaigns"  && renderCampaigns()}
                {activeSubTab === "provinces"  && renderProvinces()}
                {activeSubTab === "cities"     && renderCities()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* ── INDUSTRY MODALS ── */}
      <IndustryModal isOpen={industryCreateOpen} onClose={() => setIndustryCreateOpen(false)} mode="create" onSubmit={handleIndustryCreate} loading={industryModalLoading} />
      <IndustryModal isOpen={industryEditOpen} onClose={() => { setIndustryEditOpen(false); setIndustryEditTarget(null); }} mode="edit" initial={industryEditInitial} onSubmit={handleIndustryEdit} loading={industryModalLoading} />
      <DeleteModal isOpen={!!industryDeleteTarget} onClose={() => setIndustryDeleteTarget(null)} onConfirm={handleIndustryDelete} itemLabel={industryDeleteTarget?.name ?? "industry"} loading={industryModalLoading} />

      {/* ── CATEGORY MODALS ── */}
      {/* FIX #1: Separate create (with city) and edit (without city) modals */}
      <CategoryCreateModal
        isOpen={categoryCreateOpen}
        onClose={() => setCategoryCreateOpen(false)}
        industries={industries}
        cities={categoryCities}
        citiesLoading={categoryCitiesLoading}
        onSubmit={handleCategoryCreate}
        loading={categoryModalLoading}
      />
      <CategoryEditModal
        isOpen={categoryEditOpen}
        onClose={() => { setCategoryEditOpen(false); setCategoryEditTarget(null); }}
        initial={categoryEditInitial}
        industries={industries}
        onSubmit={handleCategoryEdit}
        loading={categoryModalLoading}
      />
      <DeleteModal
        isOpen={!!categoryDeleteTarget}
        onClose={() => setCategoryDeleteTarget(null)}
        onConfirm={handleCategoryDelete}
        itemLabel={categoryDeleteTarget?.name ?? "category"}
        loading={categoryModalLoading}
      />

      {/* ── GROUP MODALS ── */}
      <GroupModal isOpen={groupCreateOpen} onClose={() => setGroupCreateOpen(false)} mode="create" onSubmit={handleGroupCreate} loading={groupModalLoading} />
      <GroupModal isOpen={groupEditOpen} onClose={() => { setGroupEditOpen(false); setGroupEditTarget(null); }} mode="edit" initial={groupEditInitial} onSubmit={handleGroupEdit} loading={groupModalLoading} />
      <DeleteModal isOpen={!!groupDeleteTarget} onClose={() => setGroupDeleteTarget(null)} onConfirm={handleGroupDelete} itemLabel={groupDeleteTarget?.name ?? "group"} loading={groupModalLoading} />

      {/* ── PROVINCE MODALS ── */}
      <ProvinceModal isOpen={provinceCreateOpen} onClose={() => setProvinceCreateOpen(false)} mode="create" onSubmit={handleProvinceCreate} loading={provinceModalLoading} />
      <ProvinceModal isOpen={provinceEditOpen} onClose={() => { setProvinceEditOpen(false); setProvinceEditTarget(null); }} mode="edit" initial={provinceEditInitial} onSubmit={handleProvinceEdit} loading={provinceModalLoading} />
      <DeleteModal isOpen={!!provinceDeleteTarget} onClose={() => setProvinceDeleteTarget(null)} onConfirm={handleProvinceDelete} itemLabel={provinceDeleteTarget?.name ?? "province"} loading={provinceModalLoading} />

      {/* ── CITY MODALS ── */}
      <CityModal isOpen={cityCreateOpen} onClose={() => setCityCreateOpen(false)} mode="create" provinces={provinces} onSubmit={handleCityCreate} loading={cityModalLoading} />
      <CityModal isOpen={cityEditOpen} onClose={() => { setCityEditOpen(false); setCityEditTarget(null); }} mode="edit" initial={cityEditInitial} provinces={provinces} onSubmit={handleCityEdit} loading={cityModalLoading} />
      <DeleteModal isOpen={!!cityDeleteTarget} onClose={() => setCityDeleteTarget(null)} onConfirm={handleCityDelete} itemLabel={cityDeleteTarget ? `${cityDeleteTarget.name} (${cityDeleteTarget.provinces?.name ?? ""})` : "city"} loading={cityModalLoading} warningMessage={cityDeleteWarning} />

      {/* ── CAMPAIGN MODALS ── */}
      <CampaignCreateModal isOpen={campaignCreateOpen} onClose={() => setCampaignCreateOpen(false)} onCreated={handleCampaignCreated} />
      {campaignEditTarget && <CampaignEditModal campaign={campaignEditTarget} onClose={() => setCampaignEditTarget(null)} onSaved={handleCampaignUpdated} />}
      <CampaignDeleteModal campaign={campaignDeleteTarget} onConfirm={handleCampaignDeleteConfirm} onCancel={() => setCampaignDeleteTarget(null)} isDeleting={campaignDeleting} />

      {/* ── TOAST ── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}



