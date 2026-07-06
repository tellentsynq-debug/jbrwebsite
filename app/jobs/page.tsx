"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, cubicBezier, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  LogOut, Plus, Search, Edit2, X, Trash2, AlertTriangle,
  MapPin, User, Building2, Check, RefreshCw, Briefcase,
  CalendarClock, DollarSign, Activity, Eye, EyeOff
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { createPortal } from "react-dom";

/* ─── API CONFIG ─────────────────────────────────────────────── */
const JOBS_API_BASE = "https://jbrstaffingsolutions.com/api/jobs";
const WAREHOUSES_API_BASE = "https://jbrstaffingsolutions.com/api/warehouses";

/* ─── DESIGN TOKENS (matches CampaignsPage/WarehousePage) ───── */
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
  pendingText: "#3B82F6",
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
  .table-min-width { min-width: 1200px; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─── TYPES ──────────────────────────────────────────────────── */
interface JobEntry {
  id: string;
  name: string;
  title: string;
  companyName: string;      // display name of the warehouse/company (from API response)
  warehouseId?: string;     // id of the warehouse (from API response, if provided)
  startDate: string;        // ISO string exactly as returned by the API
  endDate: string;          // ISO string exactly as returned by the API
  address: string;
  hourlyRate: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiJob {
  id: string;
  campaign_name: string;
  role_title: string;
  company_or_warehouse: string;       // display name, as returned by GET
  company_or_warehouse_id?: string;   // id of the warehouse, if the API includes it on read
  hourly_rate: number | null;
  start_at: string;
  end_at: string;
  full_address: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface ApiWarehouse {
  id: string;
  warehouse_name: string;
  warehouse_address: string;
}

/* ─── AUTH HELPERS (same convention as CampaignsPage) ────────── */
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

/* ─── DATE HELPERS ───────────────────────────────────────────── */
// API returns e.g. "2026-06-01T08:00:00+00:00" — slice to feed <input type="datetime-local">
function toDateTimeLocalValue(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

// <input type="datetime-local"> gives "2026-06-01T08:00" — the API expects a literal UTC instant (sends "...Z")
function toApiDateTime(localValue: string): string {
  if (!localValue) return "";
  return localValue.length === 16 ? `${localValue}:00Z` : localValue;
}

function formatDateTime(isoString: string): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  }).format(date);
}

/* ─── API <-> UI MAPPING ─────────────────────────────────────── */
function mapApiJobToEntry(apiJob: ApiJob): JobEntry {
  return {
    id: apiJob.id,
    name: apiJob.campaign_name,
    title: apiJob.role_title,
    companyName: apiJob.company_or_warehouse,
    warehouseId: apiJob.company_or_warehouse_id,
    startDate: apiJob.start_at,
    endDate: apiJob.end_at,
    address: apiJob.full_address,
    hourlyRate: apiJob.hourly_rate === null || apiJob.hourly_rate === undefined
      ? null
      : Number(apiJob.hourly_rate),
    isActive: Boolean(apiJob.is_active),
    createdAt: apiJob.created_at,
    updatedAt: apiJob.updated_at,
  };
}

/*
 * NOTE on request field names:
 * Both POST /api/jobs and PATCH /api/jobs/:id now send the selected warehouse's
 * ID (not its name) under the key "company_or_warehouse" — this matches the
 * key used in the GET/POST *response* shape, but the value is now an ID.
 * hourly_rate is optional on both create and update.
 */
const PATCH_FIELD_NAMES = {
  startDate: "start_at",
  endDate: "end_at",
};

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);
const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
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
function TopNav() {
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
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Briefcase size={18} color={C.red} />
        <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHeading, fontWeight: 600 }}>
          Job Management
        </span>
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
            color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Sign Out <LogOut size={16} />
        </motion.button>
      </div>
    </motion.header>
  );
}

/* ─── FORM FIELD ─────────────────────────────────────────────── */
function FormField({
  label, placeholder, value, onChange, icon, type = "text"
}: {
  label: string; placeholder: string; value: string | number;
  onChange: (v: string) => void; icon?: React.ReactNode; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: focused ? C.red : C.textHint, transition: "color 0.2s", pointerEvents: "none" }}>
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: icon ? "12px 16px 12px 42px" : "12px 16px",
            background: C.inputBg,
            border: `1px solid ${focused ? C.red : C.border}`,
            borderRadius: "8px", color: C.textBody, fontSize: "14px",
            outline: "none", transition: "all 0.2s ease"
          }}
        />
      </div>
    </div>
  );
}

/* ─── SELECT FIELD ───────────────────────────────────────────── */
function SelectField({
  label, placeholder, value, onChange, icon, options, isLoading
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon?: React.ReactNode;
  options: { label: string; value: string }[]; isLoading?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: focused ? C.red : C.textHint, transition: "color 0.2s", pointerEvents: "none", zIndex: 2 }}>
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: icon ? "12px 36px 12px 42px" : "12px 36px 12px 16px",
            background: C.inputBg,
            border: `1px solid ${focused ? C.red : C.border}`,
            borderRadius: "8px", color: value ? C.textBody : C.textHint, fontSize: "14px",
            outline: "none", transition: "all 0.2s ease",
            appearance: "none",
            cursor: isLoading ? "wait" : "pointer"
          }}
          disabled={isLoading}
        >
          <option value="" disabled>{isLoading ? "Loading..." : placeholder}</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value} style={{ color: C.textBody }}>{opt.label}</option>
          ))}
        </select>
        <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: C.textHint, zIndex: 2 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─── TOAST ──────────────────────────────────────────────────── */
function Toast({ message, type, onDone }: { message: string; type: "success" | "error" | "info"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const bg = type === "success" ? "#059669" : type === "error" ? C.red : C.pendingText;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      style={{
        position: "fixed", bottom: "32px", right: "32px", zIndex: 300,
        background: bg, color: C.white, padding: "14px 20px", borderRadius: "12px",
        fontSize: "14px", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        display: "flex", alignItems: "center", gap: "10px", maxWidth: "360px"
      }}
    >
      {type === "success" ? <Check size={18} /> : type === "error" ? <X size={18} /> : <RefreshCw size={18} />}
      {message}
    </motion.div>
  );
}

/* ─── DELETE MODAL ───────────────────────────────────────────── */
function DeleteModal({
  entry, onConfirm, onCancel, isDeleting
}: {
  entry: JobEntry | null; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <AnimatePresence>
      {entry && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
            onClick={() => { if (!isDeleting) onCancel(); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            style={{
              position: "relative", width: "100%", maxWidth: "440px", margin: "24px",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px",
              padding: "32px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.12)"
            }}
          >
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: C.alertBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <AlertTriangle size={26} color={C.red} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.textHeading, marginBottom: "10px" }}>Delete Job?</h2>
            <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "28px", lineHeight: 1.6 }}>
              You are about to permanently delete <strong style={{ color: C.textBody }}>{entry.name}</strong> at <strong style={{ color: C.textBody }}>{entry.companyName}</strong>. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <motion.button
                onClick={onCancel} disabled={isDeleting}
                whileHover={{ backgroundColor: C.inputBg }}
                style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: C.textLabel, cursor: "pointer", transition: "all 0.2s" }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onConfirm} disabled={isDeleting}
                whileHover={isDeleting ? {} : { boxShadow: `0 6px 20px ${C.redGlow}` }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, padding: "12px",
                  background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                  border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600,
                  color: C.white, cursor: isDeleting ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  opacity: isDeleting ? 0.75 : 1, transition: "all 0.2s"
                }}
              >
                {isDeleting ? <Spinner size={16} color={C.white} /> : <Trash2 size={16} />}
                {isDeleting ? "Deleting…" : "Delete"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── ADD / EDIT MODAL ───────────────────────────────────────── */
function JobModal({
  entry, onClose, onSaved, mode
}: {
  entry: JobEntry | null;
  onClose: () => void;
  onSaved: (data: JobEntry) => void;
  mode: "add" | "edit";
}) {
  const [name, setName]               = useState(entry?.name ?? "");
  const [title, setTitle]             = useState(entry?.title ?? "");

  // Selected warehouse ID (this is what gets sent to the API as "company_or_warehouse")
  const [warehouseId, setWarehouseId] = useState(entry?.warehouseId ?? "");
  // Tracks the warehouse ID the job started with, so PATCH only sends it if it actually changed
  const [initialWarehouseId, setInitialWarehouseId] = useState(entry?.warehouseId ?? "");

  const [startDate, setStartDate]     = useState(toDateTimeLocalValue(entry?.startDate ?? ""));
  const [endDate, setEndDate]         = useState(toDateTimeLocalValue(entry?.endDate ?? ""));
  const [address, setAddress]         = useState(entry?.address ?? "");
  const [hourlyRate, setHourlyRate]   = useState<string | number>(entry?.hourlyRate ?? "");
  const [isActive, setIsActive]       = useState(entry?.isActive ?? true);

  const [isLoading, setIsLoading]     = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");

  const [warehouses, setWarehouses]   = useState<{ label: string; value: string }[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  const isOpen = mode === "add" ? true : entry !== null;

  // Fetch warehouses when modal opens
  useEffect(() => {
    async function loadWarehouses() {
      if (!isOpen) return;
      setLoadingWarehouses(true);
      try {
        const res = await fetch(WAREHOUSES_API_BASE, { headers: authHeaders() });
        const json = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(json.data)) {
          const list: ApiWarehouse[] = json.data;
          setWarehouses(list.map((w) => ({
            label: w.warehouse_name,
            value: w.id,
          })));

          // If editing and we don't already have a warehouse ID (e.g. the GET /api/jobs
          // response only gave us the warehouse's name), resolve it by matching the name
          // against the freshly loaded warehouse list so the select shows the right value.
          if (mode === "edit" && entry && !entry.warehouseId) {
            const match = list.find(
              (w) => w.warehouse_name.trim().toLowerCase() === entry.companyName.trim().toLowerCase()
            );
            if (match) {
              setWarehouseId(match.id);
              setInitialWarehouseId(match.id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load warehouses");
      } finally {
        setLoadingWarehouses(false);
      }
    }
    loadWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSave = async () => {
    if (!name || !title || !warehouseId || !startDate || !endDate || !address) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setErrorMsg("");

    try {
      if (mode === "add") {
        setIsLoading(true);
        const body: Record<string, unknown> = {
          campaign_name: name,
          role_title: title,
          company_or_warehouse: warehouseId,
          start_date_time: toApiDateTime(startDate),
          end_date_time: toApiDateTime(endDate),
          full_address: address,
          is_active: isActive,
        };
        // hourly_rate is optional — only include it if the user actually entered one
        if (hourlyRate !== "" && hourlyRate !== null && !Number.isNaN(Number(hourlyRate))) {
          body.hourly_rate = Number(hourlyRate);
        }

        const res = await fetch(JOBS_API_BASE, {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrorMsg(json.message || `Failed to create job (${res.status}).`);
          return;
        }
        const mapped = mapApiJobToEntry(json.data);
        setIsSuccess(true);
        setTimeout(() => { onSaved(mapped); onClose(); }, 900);
      } else {
        // EDIT — only send fields that actually changed
        const diff: Record<string, unknown> = {};
        if (name !== entry!.name) diff.campaign_name = name;
        if (title !== entry!.title) diff.role_title = title;
        if (warehouseId !== initialWarehouseId) diff.company_or_warehouse = warehouseId;
        if (
          hourlyRate !== "" &&
          hourlyRate !== null &&
          !Number.isNaN(Number(hourlyRate)) &&
          Number(hourlyRate) !== entry!.hourlyRate
        ) {
          diff.hourly_rate = Number(hourlyRate);
        }
        if (startDate !== toDateTimeLocalValue(entry!.startDate)) diff[PATCH_FIELD_NAMES.startDate] = toApiDateTime(startDate);
        if (endDate !== toDateTimeLocalValue(entry!.endDate)) diff[PATCH_FIELD_NAMES.endDate] = toApiDateTime(endDate);
        if (address !== entry!.address) diff.full_address = address;
        if (isActive !== entry!.isActive) diff.is_active = isActive;

        if (Object.keys(diff).length === 0) {
          setErrorMsg("No changes to save.");
          return;
        }

        setIsLoading(true);
        const res = await fetch(`${JOBS_API_BASE}/${entry!.id}`, {
          method: "PATCH",
          headers: authHeaders(true),
          body: JSON.stringify(diff),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrorMsg(json.message || `Failed to update job (${res.status}).`);
          return;
        }
        const mapped = mapApiJobToEntry(json.data);
        setIsSuccess(true);
        setTimeout(() => { onSaved(mapped); onClose(); }, 900);
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
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}
            onClick={() => { if (!isLoading && !isSuccess) onClose(); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            style={{
              position: "relative", width: "100%", maxWidth: "640px", margin: "24px",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)", maxHeight: "90vh", overflowY: "auto"
            }}
          >
            {/* Close */}
            <button
              onClick={() => { if (!isLoading && !isSuccess) onClose(); }}
              style={{ position: "absolute", right: "24px", top: "24px", background: "transparent", border: "none", color: C.textHint, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.textHeading)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textHint)}
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div style={{ padding: "32px 32px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: C.alertBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Briefcase size={20} color={C.red} />
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 600, color: C.textHeading }}>
                  {mode === "add" ? "Create New Job" : "Edit Job Details"}
                </h2>
              </div>
              <p style={{ fontSize: "14px", color: C.textMuted, paddingLeft: "52px" }}>
                {mode === "add" ? "Define the scope, company, and schedule for this new shift." : "Update the schedule or details for this shift."}
              </p>
            </div>

            {/* Fields */}
            <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "18px" }}>

              <div style={{ display: "flex", gap: "16px" }}>
                <FormField
                  label="Campaign / Job Name" placeholder="e.g. Summer 2026 Hiring"
                  value={name} onChange={setName} icon={<Activity size={15} />}
                />
                <FormField
                  label="Role Title" placeholder="e.g. General Labor"
                  value={title} onChange={setTitle} icon={<User size={15} />}
                />
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <SelectField
                  label="Company / Warehouse" placeholder="Select a warehouse..."
                  value={warehouseId} onChange={setWarehouseId} icon={<Building2 size={15} />}
                  options={warehouses} isLoading={loadingWarehouses}
                />
                <FormField
                  label="Hourly Rate ($) — optional" placeholder="22.00" type="number"
                  value={hourlyRate} onChange={setHourlyRate} icon={<DollarSign size={15} />}
                />
              </div>

           <div style={{ display: "flex", gap: "16px" }}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={startDate} onChange={setStartDate} icon={<CalendarClock size={15} />}
                />
                <DateTimePicker
                  label="End Date & Time"
                  value={endDate} onChange={setEndDate} icon={<CalendarClock size={15} />}
                />
              </div>

              <FormField
                label="Full Address" placeholder="22 East 5th Avenue, East Vancouver"
                value={address} onChange={setAddress} icon={<MapPin size={15} />}
              />

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: C.red, cursor: "pointer" }}
                />
                <label htmlFor="isActiveToggle" style={{ fontSize: "14px", color: C.textBody, cursor: "pointer", fontWeight: 500 }}>
                  Mark Job as Active
                </label>
              </div>

              {errorMsg && (
                <div style={{ color: C.red, fontSize: "13px", fontWeight: 500 }}>{errorMsg}</div>
              )}

              <motion.button
                disabled={isLoading || isSuccess}
                onClick={handleSave}
                whileHover={isLoading || isSuccess ? {} : { y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }}
                whileTap={isLoading || isSuccess ? {} : { scale: 0.98 }}
                style={{
                  width: "100%", padding: "14px", marginTop: "8px",
                  background: isSuccess ? "#059669" : `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                  border: "none", borderRadius: "10px",
                  display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                  color: C.white, fontSize: "15px", fontWeight: 600, letterSpacing: "0.5px",
                  cursor: isLoading || isSuccess ? "default" : "pointer",
                  transition: "background 0.3s ease",
                  opacity: isLoading ? 0.85 : 1
                }}
              >
                {isLoading
                  ? <Spinner size={18} color={C.white} />
                  : isSuccess
                    ? <><Check size={18} strokeWidth={2.5} /><span>{mode === "add" ? "Job Created!" : "Job Saved!"}</span></>
                    : <span>{mode === "add" ? "Create Job" : "Save Changes"}</span>
                }
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: "center", padding: "80px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
    >
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: C.inputBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Briefcase size={28} color={C.textHint} />
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading }}>No Jobs Created Yet</h3>
      <p style={{ fontSize: "14px", color: C.textMuted, maxWidth: "300px", lineHeight: 1.6 }}>
        There are no job postings available. Create your first shift to get started.
      </p>
      <motion.button
        onClick={onAddClick}
        whileHover={{ y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
        style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", marginTop: "8px",
          background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
          border: "none", borderRadius: "8px", color: C.white, fontSize: "14px",
          fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${C.redGlow}`
        }}
      >
        <Plus size={18} /> Create First Job
      </motion.button>
    </motion.div>
  );
}

/* ─── STATUS & COMPANY TAGS ──────────────────────────────────── */
function StatusTag({ isActive }: { isActive: boolean }) {
  const style = isActive
    ? { bg: C.successBg, text: C.successText, label: "Active" }
    : { bg: C.inactiveBg, text: C.inactiveText, label: "Inactive" };

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "20px",
      background: style.bg, color: style.text, fontSize: "11px", fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap"
    }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: style.text }} />
      {style.label}
    </div>
  );
}

const COMPANY_COLORS: Record<string, { bg: string; text: string }> = {
  "Film Vancouver Production Services": { bg: "rgba(139,92,246,0.09)",  text: "#7C3AED" },
  "18 Wheels":                          { bg: "rgba(59,130,246,0.09)",  text: "#2563EB" },
  "Aerostream":                         { bg: "rgba(236,72,153,0.09)",  text: "#BE185D" },
};

function CompanyTag({ name }: { name: string }) {
  const style = COMPANY_COLORS[name] ?? { bg: C.inactiveBg, text: C.inactiveText };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", padding: "4px 8px", borderRadius: "6px",
      background: style.bg, color: style.text, fontSize: "12px", fontWeight: 600,
      whiteSpace: "nowrap"
    }}>
      {name}
    </div>
  );
}

/* ─── DATE TIME PICKER (custom, on-theme, portal-based, compact) ─ */
function DateTimePicker({
  label, value, onChange, icon
}: {
  label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const selected = value ? new Date(value) : null;
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

const openPanel = () => {
  if (triggerRef.current) {
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 340;
    const panelHeight = 320;
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;

    // Prefer opening below. Only flip above if below truly can't fit
    // AND above has more room than below.
    const openUpward = spaceBelow < panelHeight && spaceAbove > spaceBelow;

    let top = openUpward
      ? rect.top - 8 - panelHeight
      : rect.bottom + 8;

    // Clamp so it never goes off the top or bottom of the viewport
    top = Math.max(12, Math.min(top, viewportH - panelHeight - 12));

    let left = rect.left;
    if (left + panelWidth > viewportW - 16) left = viewportW - panelWidth - 16;
    if (left < 16) left = 16;

    setCoords({ top, left, width: rect.width });
  }
  setOpen(o => !o);
};

 useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (
      triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
      panelRef.current && !panelRef.current.contains(e.target as Node)
    ) setOpen(false);
  }
  function handleScroll(e: Event) {
    // Ignore scrolls that happen inside the panel itself (e.g. the hour/minute lists)
    if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) {
      return;
    }
    setOpen(false);
  }
  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("scroll", handleScroll, true);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    window.removeEventListener("scroll", handleScroll, true);
  };
}, [open]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const numDays = new Date(year, month + 1, 0).getDate();
  const startOffset = new Date(year, month, 1).getDay();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long" });
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const emit = (y: number, m: number, d: number, h: number, min: number) =>
    onChange(`${y}-${pad(m + 1)}-${pad(d)}T${pad(h)}:${pad(min)}`);

  const selectDay = (day: number) =>
    emit(year, month, day, selected?.getHours() ?? 9, selected?.getMinutes() ?? 0);

  const setTime = (h: number, min: number) => {
    const base = selected ?? new Date(year, month, viewDate.getDate() || 1);
    emit(base.getFullYear(), base.getMonth(), base.getDate(), h, min);
  };

  const displayValue = selected
    ? selected.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: easeOutCirc }}
          style={{
            position: "fixed", top: coords.top, left: coords.left, zIndex: 9999,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.22), 0 4px 14px rgba(0,0,0,0.1)",
            overflow: "hidden", width: "340px"
          }}
        >
          {/* Header strip */}
          <div style={{
            background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
            padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              style={{
                background: "rgba(255,255,255,0.16)", border: "none", borderRadius: "7px",
                width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: C.white, fontSize: "14px", transition: "background 0.15s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.16)")}
            >‹</button>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: 600,
              color: C.white, letterSpacing: "0.3px"
            }}>
              {monthLabel} <span style={{ opacity: 0.75, fontWeight: 500 }}>{year}</span>
            </span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={{
                background: "rgba(255,255,255,0.16)", border: "none", borderRadius: "7px",
                width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: C.white, fontSize: "14px", transition: "background 0.15s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.16)")}
            >›</button>
          </div>

          <div style={{ display: "flex", padding: "14px" }}>
            {/* Calendar */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "6px" }}>
                {weekdays.map((w, i) => (
                  <div key={i} style={{ fontSize: "9.5px", color: C.textHint, textAlign: "center", fontWeight: 700, letterSpacing: "0.5px" }}>{w}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: "3px" }}>
                {Array.from({ length: startOffset }).map((_, i) => <div key={"e" + i} />)}
                {Array.from({ length: numDays }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = !!selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
                  const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                  return (
                    <div key={day} style={{ display: "flex", justifyContent: "center" }}>
                      <motion.div
                        onClick={() => selectDay(day)}
                        whileHover={isSelected ? {} : { backgroundColor: C.inputBg, scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        style={{
                          width: "25px", height: "25px", display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "7px", fontSize: "11.5px", cursor: "pointer",
                          background: isSelected ? `linear-gradient(135deg, ${C.redBright}, ${C.red})` : "transparent",
                          color: isSelected ? C.white : C.textBody,
                          fontWeight: isSelected ? 700 : isToday ? 700 : 400,
                          border: isToday && !isSelected ? `1.5px solid ${C.red}` : "1.5px solid transparent",
                          boxShadow: isSelected ? `0 3px 10px ${C.redGlow}` : "none",
                          transition: "border-color 0.15s"
                        }}
                      >
                        {day}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: "1px", background: C.border, margin: "0 14px" }} />

            {/* Time */}
            <div style={{ width: "92px", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 700, color: C.textHint, textAlign: "center", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                Time
              </span>
              <div style={{ display: "flex", gap: "4px", height: "130px" }}>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {hours.map(h => {
                    const isSel = selected?.getHours() === h;
                    return (
                      <div key={h} onClick={() => setTime(h, selected?.getMinutes() ?? 0)}
                        style={{
                          padding: "4px 0", textAlign: "center", fontSize: "11.5px", cursor: "pointer", borderRadius: "6px",
                          background: isSel ? `linear-gradient(135deg, ${C.redBright}, ${C.red})` : "transparent",
                          color: isSel ? C.white : C.textBody,
                          fontWeight: isSel ? 700 : 400,
                          boxShadow: isSel ? `0 2px 6px ${C.redGlow}` : "none",
                          transition: "background 0.12s"
                        }}
                        onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = C.inputBg; }}
                        onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                      >{pad(h)}</div>
                    );
                  })}
                </div>
                <div style={{ width: "1px", background: C.border }} />
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {minutes.map(m => {
                    const isSel = selected?.getMinutes() === m;
                    return (
                      <div key={m} onClick={() => setTime(selected?.getHours() ?? 9, m)}
                        style={{
                          padding: "4px 0", textAlign: "center", fontSize: "11.5px", cursor: "pointer", borderRadius: "6px",
                          background: isSel ? `linear-gradient(135deg, ${C.redBright}, ${C.red})` : "transparent",
                          color: isSel ? C.white : C.textBody,
                          fontWeight: isSel ? 700 : 400,
                          boxShadow: isSel ? `0 2px 6px ${C.redGlow}` : "none",
                          transition: "background 0.12s"
                        }}
                        onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = C.inputBg; }}
                        onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                      >{pad(m)}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "10px 16px", borderTop: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center", background: C.inputBg
          }}>
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}
            >
              Clear
            </button>
            <motion.button
              onClick={() => setOpen(false)}
              whileHover={{ boxShadow: `0 6px 18px ${C.redGlow}` }}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: "6px 16px", border: "none", borderRadius: "7px",
                background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                color: C.white, fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.3px", cursor: "pointer"
              }}
            >
              Done
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, position: "relative" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>{label}</label>

      <div
        ref={triggerRef}
        onClick={openPanel}
        style={{
          position: "relative", cursor: "pointer",
          padding: icon ? "12px 16px 12px 42px" : "12px 16px",
          background: C.inputBg,
          border: `1px solid ${open ? C.red : C.border}`,
          borderRadius: "8px", color: displayValue ? C.textBody : C.textHint,
          fontSize: "14px", fontWeight: displayValue ? 500 : 400,
          transition: "all 0.2s ease", userSelect: "none",
          boxShadow: open ? `0 0 0 3px ${C.redGlow}` : "none"
        }}
      >
        {icon && (
          <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: open ? C.red : C.textHint, transition: "color 0.2s" }}>
            {icon}
          </div>
        )}
        {displayValue || "Select date & time"}
      </div>

      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function JobPage() {
  const [jobs, setJobs]               = useState<JobEntry[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [loadError, setLoadError]     = useState("");

  const [search, setSearch]           = useState("");
  const [isAddOpen, setAddOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<JobEntry | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobEntry | null>(null);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast]             = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab]     = useState("jobs");

  const showToast = (message: string, type: "success" | "error" | "info" = "success") =>
    setToast({ message, type });

  /* ── Fetch jobs (GET /api/jobs) ── */
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await fetch(JOBS_API_BASE, { headers: authHeaders() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || `Server returned ${res.status}`);
      }
      const list: ApiJob[] = Array.isArray(json.data) ? json.data : [];
      setJobs(list.map(mapApiJobToEntry));
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load jobs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  /* ── Edit click: fetch the freshest copy (GET /api/jobs/:id) before opening the modal ── */
  const handleEditClick = async (job: JobEntry) => {
    setEditLoadingId(job.id);
    try {
      const res = await fetch(`${JOBS_API_BASE}/${job.id}`, { headers: authHeaders() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Server returned ${res.status}`);
      setEditTarget(mapApiJobToEntry(json.data));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load latest job details.", "error");
      setEditTarget(job); // fall back to the row's last known data
    } finally {
      setEditLoadingId(null);
    }
  };

  /* ── Quick active/inactive toggle straight from the table (PATCH /api/jobs/:id) ── */
  const handleToggleStatus = async (job: JobEntry) => {
    setActionLoading((prev) => ({ ...prev, [job.id]: true }));
    const nextActive = !job.isActive;
    try {
      const res = await fetch(`${JOBS_API_BASE}/${job.id}`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify({ is_active: nextActive }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Failed to update job (${res.status}).`);
      const mapped = mapApiJobToEntry(json.data);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? mapped : j)));
      showToast(`Job ${nextActive ? "activated" : "deactivated"} successfully.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "A network error occurred.", "error");
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[job.id]; return n; });
    }
  };

  /* ── Delete (DELETE /api/jobs/:id) ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${JOBS_API_BASE}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(true),
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
        showToast("Job deleted.");
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.message || "Failed to delete job.", "error");
      }
    } catch {
      showToast("A network error occurred.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleAdded = (entry: JobEntry) => {
    setJobs((prev) => [entry, ...prev]);
    showToast("Job created successfully!");
  };

  const handleUpdated = (entry: JobEntry) => {
    setJobs((prev) => prev.map((j) => (j.id === entry.id ? entry : j)));
    setEditTarget(null);
    showToast("Job updated successfully.");
  };

  const filtered = jobs.filter((j) =>
    j.name.toLowerCase().includes(search.toLowerCase()) ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.companyName.toLowerCase().includes(search.toLowerCase()) ||
    j.address.toLowerCase().includes(search.toLowerCase())
  );

  // Adjust table layout columns
  const tableGridTemplate = "1.5fr 1.5fr 1.5fr 1.8fr 0.8fr 0.9fr";

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>

        {/* Sidebar Navigation Panel */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Dashboard Content Workspace Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          <TopNav />

          {/* ── Main content area ── */}
          <main style={{ padding: "40px", maxWidth: "1600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}
            >
              <div>
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: 600,
                  color: C.textHeading, marginBottom: "8px", letterSpacing: "-0.5px"
                }}>
                  Jobs & Shifts
                </h1>
                <p style={{ fontSize: "15px", color: C.textMuted }}>
                  Manage job postings, locations, and hiring requirements
                  {!isLoading && !loadError && (
                    <span style={{ marginLeft: "8px", fontSize: "13px", color: C.textHint }}>
                      ({jobs.length} total)
                    </span>
                  )}
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <motion.button
                  onClick={fetchJobs}
                  whileHover={{ backgroundColor: C.inputBg }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
                    background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px",
                    color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <RefreshCw size={15} style={isLoading ? { animation: "spin 0.7s linear infinite" } : {}} /> Refresh
                </motion.button>

                <motion.button
                  onClick={() => setAddOpen(true)}
                  whileHover={{ y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px",
                    background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                    border: "none", borderRadius: "8px", color: C.white, fontSize: "14px",
                    fontWeight: 600, letterSpacing: "0.5px", cursor: "pointer",
                    boxShadow: `0 4px 16px ${C.redGlow}`
                  }}
                >
                  <Plus size={18} /> Create Job
                </motion.button>
              </div>
            </motion.div>

            {/* ── Summary Cards ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}
            >
              {[
                { label: "Total Jobs", value: jobs.length, icon: <Briefcase size={20} color={C.red} /> },
                { label: "Active Jobs", value: jobs.filter(j => j.isActive).length, icon: <Activity size={20} color="#10B981" /> },
                { label: "Partner Companies", value: new Set(jobs.map(j => j.companyName)).size, icon: <Building2 size={20} color="#3B82F6" /> },
                {
                  label: "Avg. Hourly Rate",
                  value: (() => {
                    const withRate = jobs.filter((j) => j.hourlyRate !== null && j.hourlyRate !== undefined);
                    if (withRate.length === 0) return "—";
                    const avg = withRate.reduce((acc, j) => acc + (j.hourlyRate as number), 0) / withRate.length;
                    return `$${avg.toFixed(2)}`;
                  })(),
                  icon: <DollarSign size={20} color="#8B5CF6" />
                },
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

            {/* ── Table Card ── */}
            <motion.div
              variants={containerVars} initial="hidden" animate="show"
              className="clean-card"
              style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {/* Card Header */}
              <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading }}>Job Postings Directory</h3>
                <div style={{ position: "relative" }}>
                  <Search size={16} color={C.textHint} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text" placeholder="Search jobs, companies, or roles…"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    style={{
                      background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px",
                      padding: "10px 16px 10px 40px", color: C.textBody, fontSize: "14px",
                      width: "300px", outline: "none", transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.red)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  />
                </div>
              </div>

              {isLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "60px 40px", color: C.textMuted, fontSize: "15px" }}>
                  <Spinner size={22} color={C.red} /> Loading jobs…
                </div>
              )}

              {!isLoading && loadError && (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <p style={{ color: C.red, fontSize: "14px", marginBottom: "16px" }}>{loadError}</p>
                  <motion.button
                    onClick={fetchJobs}
                    whileHover={{ backgroundColor: C.redActiveBg }}
                    style={{ padding: "10px 20px", border: `1px solid ${C.red}`, borderRadius: "8px", background: "transparent", color: C.red, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Retry
                  </motion.button>
                </div>
              )}

              {!isLoading && !loadError && filtered.length === 0 && (
                search
                  ? <div style={{ padding: "60px", textAlign: "center", color: C.textMuted }}>No jobs match "{search}".</div>
                  : <EmptyState onAddClick={() => setAddOpen(true)} />
              )}

              {!isLoading && !loadError && filtered.length > 0 && (
                <div className="table-container">
                  <div className="table-min-width">

                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: tableGridTemplate, padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: C.inputBg }}>
                      {["Job Name", "Role & Company", "Date & Time", "Location & Pay", "Status", "Actions"].map((h, i) => (
                        <span key={i} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: C.textHint, fontWeight: 600 }}>
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* Rows */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {filtered.map((j, idx) => {
                        const isToggling = !!actionLoading[j.id];
                        const isEditLoadingRow = editLoadingId === j.id;

                        return (
                          <motion.div
                            key={j.id} variants={itemVars}
                            whileHover={{ backgroundColor: C.inputBg }}
                            style={{
                              display: "grid", gridTemplateColumns: tableGridTemplate,
                              alignItems: "center", padding: "20px 32px",
                              borderBottom: idx !== filtered.length - 1 ? `1px solid ${C.border}` : "none",
                              transition: "background-color 0.2s ease"
                            }}
                          >
                            {/* Job Name */}
                            <div>
                              <div style={{ fontSize: "15px", fontWeight: 600, color: C.textHeading }}>{j.name}</div>
                              <div style={{ fontSize: "12px", color: C.textHint, marginTop: "2px" }}>ID #{j.id.slice(0, 8)}</div>
                            </div>

                            {/* Role & Company */}
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 500, color: C.textBody, marginBottom: "4px" }}>{j.title}</div>
                              <CompanyTag name={j.companyName} />
                            </div>

                            {/* Dates */}
                            <div>
                              <div style={{ fontSize: "13px", color: C.textBody }}>{formatDateTime(j.startDate)}</div>
                              <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px" }}>to {formatDateTime(j.endDate)}</div>
                            </div>

                            {/* Location & Pay */}
                            <div>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
                                <MapPin size={13} color={C.textHint} style={{ marginTop: "2px", flexShrink: 0 }} />
                                <span style={{ fontSize: "13px", color: C.textBody, lineHeight: 1.3 }}>{j.address}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <DollarSign size={13} color={C.successText} />
                                <span style={{ fontSize: "13px", fontWeight: 600, color: C.successText }}>
                                  {j.hourlyRate !== null && j.hourlyRate !== undefined ? `$${j.hourlyRate.toFixed(2)}/hr` : "—"}
                                </span>
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <StatusTag isActive={j.isActive} />
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <motion.button
                                onClick={() => handleEditClick(j)}
                                disabled={isEditLoadingRow}
                                whileHover={isEditLoadingRow ? {} : { scale: 1.1, color: C.red }}
                                whileTap={{ scale: 0.9 }}
                                title="Edit job"
                                style={{ background: "transparent", border: "none", color: C.textHint, cursor: isEditLoadingRow ? "default" : "pointer", padding: "7px", borderRadius: "6px", transition: "color 0.2s", opacity: isEditLoadingRow ? 0.5 : 1 }}
                              >
                                {isEditLoadingRow ? <Spinner size={17} /> : <Edit2 size={17} />}
                              </motion.button>

                              <motion.button
                                onClick={() => handleToggleStatus(j)}
                                disabled={isToggling}
                                whileHover={isToggling ? {} : { scale: 1.1, color: j.isActive ? C.redBright : C.successText }}
                                whileTap={{ scale: 0.9 }}
                                title={j.isActive ? "Deactivate" : "Activate"}
                                style={{ background: "transparent", border: "none", color: C.textHint, cursor: isToggling ? "default" : "pointer", padding: "7px", borderRadius: "6px", transition: "color 0.2s", opacity: isToggling ? 0.5 : 1 }}
                              >
                                {isToggling ? <Spinner size={17} /> : j.isActive ? <EyeOff size={17} /> : <Eye size={17} />}
                              </motion.button>

                              <motion.button
                                onClick={() => setDeleteTarget(j)}
                                whileHover={{ scale: 1.1, color: C.redBright }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete job"
                                style={{ background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "7px", borderRadius: "6px", transition: "color 0.2s" }}
                              >
                                <Trash2 size={17} />
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

          </main>
        </div>
      </div>

      {/* ── Modals & Notifications ── */}
      {isAddOpen && (
        <JobModal
          mode="add" entry={null}
          onClose={() => setAddOpen(false)}
          onSaved={handleAdded}
        />
      )}
      {editTarget && (
        <JobModal
          mode="edit" entry={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleUpdated}
        />
      )}
      <DeleteModal
        entry={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}