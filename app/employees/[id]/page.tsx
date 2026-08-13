"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import {
  ArrowLeft, User, MapPin, Briefcase, ShieldCheck, FileText,
  CreditCard, Hash, Calendar, Phone, Mail, Download, ExternalLink,
  CheckCircle, Clock, XCircle, AlertTriangle, Loader2, RefreshCw,
  Building2, BadgeCheck, Lock, Eye, EyeOff, MessageSquare,
  CheckCheck, Edit2, Fingerprint, Banknote, IdCard, ChevronRight,
  X, Save, Briefcase as BriefcaseIcon, DollarSign, MapPinned, Check, Ban,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

/* ─── ANIMATION EASING (used by the custom DatePicker) ─────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);

/* ─── DESIGN TOKENS (aligned with employee list page) ────────── */
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
  redActiveBg: "rgba(198,40,40,0.07)",
  redGlow: "rgba(229,57,53,0.15)",
  inputBg: "#F4F6F8",
  white: "#FFFFFF",
  successBg: "rgba(5,150,105,0.10)",
  successBorder: "rgba(5,150,105,0.25)",
  successText: "#059669",
  pendingBg: "rgba(245,158,11,0.10)",
  pendingBorder: "rgba(245,158,11,0.30)",
  pendingText: "#D97706",
  alertBg: "rgba(198,40,40,0.08)",
  alertBorder: "rgba(198,40,40,0.20)",
  alertText: "#C62828",
  blueBg: "rgba(59,130,246,0.08)",
  blueBorder: "rgba(59,130,246,0.20)",
  blueText: "#3B82F6",
  purpleBg: "rgba(124,58,237,0.08)",
  purpleBorder: "rgba(124,58,237,0.20)",
  purpleText: "#7C3AED",
  shadow: "rgba(0,0,0,0.06)",
  shadowMd: "rgba(0,0,0,0.10)",
  shadowLg: "rgba(0,0,0,0.15)",
  overlayBg: "rgba(0,0,0,0.45)",
};

/* ─── GLOBAL CSS ──────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.textBody}; font-family: 'DM Sans', sans-serif; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.borderHover}; border-radius: 4px; }

  .clean-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 16px;
    box-shadow: 0 1px 3px ${C.shadow}, 0 4px 16px ${C.shadow};
  }

  .section-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 14px;
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 24px;
    border-bottom: 1px solid ${C.border};
    background: ${C.inputBg};
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  .detail-cell {
    padding: 16px 24px;
    border-bottom: 1px solid ${C.border};
    border-right: 1px solid ${C.border};
    transition: background 0.15s;
  }
  .detail-cell:hover { background: ${C.inputBg}; }
  .detail-cell:nth-child(even) { border-right: none; }
  .detail-cell:nth-last-child(-n+2) { border-bottom: none; }
  .detail-cell.full-width {
    grid-column: 1 / -1;
    border-right: none;
  }
  .detail-cell.full-width:last-child { border-bottom: none; }

  .detail-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: ${C.textHint};
    margin-bottom: 5px;
  }

  .detail-value {
    font-size: 14px;
    font-weight: 600;
    color: ${C.textBody};
    word-break: break-word;
  }

  .detail-value.mono {
    font-family: 'DM Mono', 'Courier New', monospace;
    font-size: 13px;
    letter-spacing: 0.5px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    border: 1px solid transparent;
  }

  .doc-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid ${C.border};
    background: ${C.surface};
    color: ${C.textLabel};
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
  }
  .doc-action-btn:hover {
    border-color: ${C.red};
    background: ${C.redActiveBg};
    color: ${C.red};
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border-radius: 8px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    color: ${C.textLabel};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .back-btn:hover {
    border-color: ${C.red};
    background: ${C.redActiveBg};
    color: ${C.red};
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-family: 'DM Sans', sans-serif;
  }

  .sensitive-mask {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border-radius: 6px;
    background: ${C.inputBg};
    border: 1px solid ${C.border};
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 3px;
    color: ${C.textMuted};
  }

  .reveal-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid ${C.border};
    background: ${C.surface};
    color: ${C.textMuted};
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
    margin-left: 8px;
  }
  .reveal-btn:hover {
    border-color: ${C.red};
    color: ${C.red};
    background: ${C.redActiveBg};
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  .skeleton {
    background: linear-gradient(90deg, #ebebeb 25%, #f5f5f5 50%, #ebebeb 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 6px;
  }

  /* ── Edit Modal ── */
  .modal-overlay { position: fixed; inset: 0; background: ${C.overlayBg}; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(2px); }
  .modal-box { background: ${C.surface}; border-radius: 16px; padding: 32px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 600; color: ${C.textLabel}; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input { background: ${C.inputBg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 10px 14px; color: ${C.textBody}; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; width: 100%; }
  .form-input:focus { border-color: ${C.red}; }

  /* ── Applied Jobs card ── */
  .job-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px 20px;
    border-radius: 12px;
    border: 1px solid ${C.border};
    background: ${C.surface};
    transition: all 0.2s;
  }
  .job-card:hover { border-color: ${C.borderHover}; box-shadow: 0 2px 10px ${C.shadow}; }
  .job-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    color: ${C.textMuted};
    font-weight: 500;
  }
`;

/* ─── API ─────────────────────────────────────────────────────── */
const BASE_URL = "https://jbrstaffingsolutions.com/api";
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("jbr_token") || "" : "";

interface UserPolicy {
  name: string;
  signed_pdf_url: string;
  uploaded_at: string;
}

/* ─── TYPES ──────────────────────────────────────────────────── */
interface BankAccount {
  account_number: string;
  document_url: string | null;
  storage_path: string | null;
  created_at: string;
}

interface SIN {
  sin_number: string;
  document_url: string | null;
  storage_path: string | null;
  created_at: string;
}

interface JobCategory {
  id: string;
  name: string;
}

interface JobIndustry {
  id: string;
  name: string;
}

interface Campaign {
  id: number;
  name: string;
}

interface EmployeeDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  registration_number: string;
  gender: string;
  date_of_birth: string;
  city: string;
  province: string;
  postal_code: string;
  job_category_id: string;
  job_industry_id: string;
  campaign_id: number;
  verification_status: "pending" | "verified" | "rejected";
  available_from: string;
permit_status: string;
  permit_note: string | null;
  permit_expiry_month: number | null;
  permit_expiry_year: number | null;
  permit_document_url: string | null;
  shift_preference: string;
  license_required: boolean;
license_expiry_month: number | null;
  license_expiry_year: number | null;
  availability_days: string[] | null;
  resume_url: string | null;
  license_url: string | null;
  created_at: string;
  updated_at: string;
  job_categories: JobCategory;
  job_industries: JobIndustry;
  campaigns: Campaign;
  bank_account: BankAccount | null;
  sin: SIN | null;
}

/* Applied Jobs — from GET /jobs/user/:user_id */
interface AppliedJobWarehouse {
  id: string;
  customer_name: string;
  warehouse_name: string;
  warehouse_address: string;
  supervisor_manager: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  privacy_policy_url: string | null;
  privacy_policy_storage_path: string | null;
  terms_and_conditions_url: string | null;
  terms_and_conditions_storage_path: string | null;
}

interface AppliedJob {
  id: string;

  campaign_name: string;
  role_title: string;

  company_or_warehouse: string;
  company_or_warehouse_name: string;
  company_or_warehouse_customer: string;

  hourly_rate: number;

  start_at: string;
  end_at: string;

  full_address: string;

  is_active: boolean;

  application_id: string | null;
  application_status: string;

  privacy_policy_url: string | null;
  terms_and_conditions_url: string | null;
}

/* ─── HELPERS ─────────────────────────────────────────────────── */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const SHIFT_MAP: Record<string, string> = {
  morning_shift:   "Morning (6 AM – 2 PM)",
  afternoon_shift: "Afternoon (2 PM – 10 PM)",
  night_shift:     "Night (10 PM – 6 AM)",
  rotating_shift:  "Rotating",
  split_shift:     "Split Shift",
  on_call:         "On-Call / Flexible",
  day_shift:       "Day Shift",
};

const PERMIT_MAP: Record<string, string> = {
  citizen:                  "Canadian Citizen",
  permanent_resident:       "Permanent Resident",
  open_work_permit:         "Open Work Permit",
  employer_specific_permit: "Employer-Specific Permit",
  pending:                  "Pending",
  student_coop:             "Student Visa (Co-op)",
  approved:                 "Approved",
  other:                    "Other",
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  } catch { return iso; }
}

function fmtDateShort(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-CA", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function fmtTimeRange(startIso: string | null | undefined, endIso: string | null | undefined) {
  if (!startIso || !endIso) return "—";
  try {
    const s = new Date(startIso), e = new Date(endIso);
    const dateStr = s.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
    const startTime = s.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });
    const endTime = e.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });
    return `${dateStr} · ${startTime} – ${endTime}`;
  } catch { return "—"; }
}

function calcAge(dob: string | null | undefined) {
  if (!dob) return null;
  try {
    const b = new Date(dob), today = new Date();
    let a = today.getFullYear() - b.getFullYear();
    if (today < new Date(today.getFullYear(), b.getMonth(), b.getDate())) a--;
    return a;
  } catch { return null; }
}

function maskSIN(sin: string) {
  return "••• ••• " + sin.slice(-3);
}

function maskAccount(acc: string) {
  if (acc.length <= 4) return "••••";
  return "•".repeat(acc.length - 4) + acc.slice(-4);
}

/* Converts an ISO datetime (or date) string to yyyy-MM-dd for <input type="date"> */
function toDateInputValue(iso: string | null | undefined) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch { return ""; }
}

/* Returns true if a license_expiry_month/year pair is in the past relative to today */
function isLicenseExpired(month: number | null, year: number | null) {
  if (!month || !year) return false;
  const today = new Date();
  // Expiry is considered the last day of the given month/year
  const expiry = new Date(year, month, 0);
  return expiry < today;
}

/* ─── VERIFICATION BADGE ──────────────────────────────────────── */
function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; border: string; color: string; label: string; icon: React.ReactNode }> = {
    verified: { bg: C.successBg, border: C.successBorder, color: C.successText, label: "Verified",
      icon: <BadgeCheck size={13} /> },
    pending:  { bg: C.pendingBg, border: C.pendingBorder, color: C.pendingText, label: "Pending",
      icon: <Clock size={13} /> },
    rejected: { bg: C.alertBg, border: C.alertBorder, color: C.alertText, label: "Rejected",
      icon: <XCircle size={13} /> },
  };
  const s = map[status] ?? { bg: C.inputBg, border: C.border, color: C.textMuted, label: status, icon: null };
  return (
    <span className="chip" style={{ background: s.bg, borderColor: s.border, color: s.color }}>
      {s.icon}{s.label}
    </span>
  );
}

/* ─── APPLICATION STATUS BADGE ──────────────────────────────────── */
function ApplicationStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { bg: string; border: string; color: string; label: string; icon: React.ReactNode }> = {
    approved: { bg: C.successBg, border: C.successBorder, color: C.successText, label: "Approved",
      icon: <BadgeCheck size={12} /> },
    pending:  { bg: C.pendingBg, border: C.pendingBorder, color: C.pendingText, label: "Pending",
      icon: <Clock size={12} /> },
    rejected: { bg: C.alertBg, border: C.alertBorder, color: C.alertText, label: "Rejected",
      icon: <XCircle size={12} /> },
    assigned: { bg: C.blueBg, border: C.blueBorder, color: C.blueText, label: "Assigned",
      icon: <BadgeCheck size={12} /> },
  };
  const key = (status ?? "pending").toLowerCase();
  const s = map[key] ?? { bg: C.inputBg, border: C.border, color: C.textMuted, label: status ?? "Pending", icon: null };
  return (
    <span className="chip" style={{ background: s.bg, borderColor: s.border, color: s.color }}>
      {s.icon}{s.label}
    </span>
  );
}

/* ─── PERMIT BADGE ────────────────────────────────────────────── */
function PermitBadge({ status }: { status: string }) {
  const label = PERMIT_MAP[status] ?? status;
  const isCitizen = status === "citizen" || status === "permanent_resident";
  return (
    <span className="chip" style={{
      background: isCitizen ? C.successBg : C.blueBg,
      borderColor: isCitizen ? C.successBorder : C.blueBorder,
      color: isCitizen ? C.successText : C.blueText,
    }}>
      {isCitizen ? <ShieldCheck size={12} /> : <FileText size={12} />}
      {label}
    </span>
  );
}

/* ─── SENSITIVE FIELD ─────────────────────────────────────────── */
function SensitiveField({ value, mask }: { value: string; mask: (v: string) => string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
      {revealed ? (
        <span className="detail-value mono">{value}</span>
      ) : (
        <span className="sensitive-mask">{mask(value)}</span>
      )}
      <button className="reveal-btn" onClick={() => setRevealed(r => !r)}>
        {revealed ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Reveal</>}
      </button>
    </div>
  );
}

/* ─── SKELETON ────────────────────────────────────────────────── */
function SkeletonBlock({ h, w }: { h: number; w?: string }) {
  return <div className="skeleton" style={{ height: h, width: w ?? "100%", borderRadius: 8 }} />;
}

/* ─── SECTION TITLE ───────────────────────────────────────────── */
function SectionTitle({
  icon, label, accent, right,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: accent ?? C.redActiveBg,
        border: `1.5px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.textHeading, letterSpacing: 0.3 }}>{label}</span>
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
    </div>
  );
}

/* ─── DETAIL CELL ─────────────────────────────────────────────── */
function Cell({
  label, children, fullWidth,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`detail-cell${fullWidth ? " full-width" : ""}`}>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{children}</div>
    </div>
  );
}

/* ─── TOP NAV ─────────────────────────────────────────────────── */
function TopNav({ emp }: { emp: EmployeeDetail | null }) {
  const router = useRouter();
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 40px", borderBottom: `1px solid ${C.border}`,
      background: C.surface, position: "sticky", top: 0, zIndex: 20,
      gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: C.textHint, letterSpacing: 1, textTransform: "uppercase" }}>Contractors</span>
          <ChevronRight size={13} color={C.textHint} />
          <span style={{ fontSize: 12, color: C.textHeading, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {emp ? `${emp.first_name} ${emp.last_name}` : "Employee Detail"}
          </span>
        </div>
      </div>
      {emp && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {emp.registration_number && (
            <span style={{
              padding: "6px 14px", borderRadius: 20,
              background: C.redActiveBg, border: `1px solid ${C.red}`,
              fontSize: 12, fontWeight: 700, color: C.red, letterSpacing: 1,
            }}>
              {emp.registration_number}
            </span>
          )}
          <VerificationBadge status={emp.verification_status} />
        </div>
      )}
    </header>
  );
}

/* ─── DOCUMENT CARD ───────────────────────────────────────────── */
function DocCard({
  icon, title, subtitle, docUrl, badge, badgeColor,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  docUrl?: string | null;
  badge?: string;
  badgeColor?: { bg: string; border: string; color: string };
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "16px 20px", borderRadius: 12,
      border: `1px solid ${C.border}`,
      background: C.surface,
      transition: "all 0.2s",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: C.inputBg, border: `1.5px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textHeading, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {badge && badgeColor && (
          <span className="chip" style={{ background: badgeColor.bg, borderColor: badgeColor.border, color: badgeColor.color }}>
            {badge}
          </span>
        )}
        {docUrl ? (
          <a href={docUrl} target="_blank" rel="noreferrer" className="doc-action-btn">
            <ExternalLink size={13} /> View
          </a>
        ) : (
          <span style={{ fontSize: 12, color: C.textHint, fontStyle: "italic" }}>No file</span>
        )}
      </div>
    </div>
  );
}

/* ─── APPLIED JOB CARD ───────────────────────────────────────────
 * One row in the "Applied Jobs" section. Shows the job/campaign info
 * plus Approve / Reject actions that call:
 *   PATCH /auth/applications/{jobId}/status
 *   body: { user_id, status: "approved" | "rejected" }
 * ────────────────────────────────────────────────────────────── */
function AppliedJobCard({
  job,
  employeeId,
  policyUrl,
  onDecision,
}: {
  job: AppliedJob;
  employeeId: string;
  policyUrl: string | null;
onDecision: (
  applicationId: string,
  status: "approved" | "rejected"
) => Promise<void>;
}) {
  const [actioning, setActioning] = useState<"approved" | "rejected" | null>(null);

  const currentStatus = (job.application_status ?? "pending").toLowerCase();

const isDecided =
  currentStatus === "approved" ||
  currentStatus === "rejected" ||
  currentStatus === "assigned";

const handleClick = async (
  status: "approved" | "rejected"
) => {
  console.log("handleClick called");

  console.log("job =", job);

  console.log("application_id =", job.application_id);

  console.log("status =", status);

  if (actioning) {
    console.log("Blocked because actioning =", actioning);
    return;
  }

  if (!job.application_id) {
    console.log("application_id is NULL or undefined");
    return;
  }

  setActioning(status);

  try {
    console.log("Calling onDecision...");
    await onDecision(job.application_id, status);
    console.log("onDecision finished");
  } catch (e) {
    console.error(e);
  } finally {
    setActioning(null);
  }
};
  return (
    <div className="job-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.textHeading }}>{job.role_title}</span>
            <ApplicationStatusBadge status={job.application_status} />
            {!job.is_active && (
              <span className="chip" style={{ background: C.inputBg, borderColor: C.border, color: C.textHint }}>Inactive</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 500, marginBottom: 10 }}>
            {job.campaign_name}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span className="job-meta-item">
              <Building2 size={13} /> {job.company_or_warehouse_name ?? "—"}
            </span>
            <span className="job-meta-item">
              <MapPinned size={13} /> {job.full_address || "—"}
            </span>
            <span className="job-meta-item">
              <DollarSign size={13} /> ${job.hourly_rate?.toFixed(2)}/hr
            </span>
            <span className="job-meta-item">
              <Calendar size={13} /> {fmtTimeRange(job.start_at, job.end_at)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
         {policyUrl && (
  <a
    href={policyUrl}
    target="_blank"
    rel="noreferrer"
    className="doc-action-btn"
  >
    <ExternalLink size={13} /> Policy
  </a>
)}
          {!isDecided && (
            <>
              <button
                className="action-btn"
                onClick={() => {
  console.log("APPROVE BUTTON CLICKED");
  handleClick("approved");
}}
                disabled={!!actioning}
                style={{ background: C.successText, color: "#fff", opacity: actioning ? 0.7 : 1, padding: "8px 16px", fontSize: 12.5 }}
              >
                {actioning === "approved"
                  ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  : <Check size={13} />}
                Approve
              </button>
              <button
                className="action-btn"
                onClick={() => handleClick("rejected")}
                disabled={!!actioning}
                style={{ background: C.red, color: "#fff", opacity: actioning ? 0.7 : 1, padding: "8px 16px", fontSize: 12.5 }}
              >
                {actioning === "rejected"
                  ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  : <Ban size={13} />}
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── DATE PICKER (custom, on-theme, portal-based, compact) ────── */
/*
 * Date-only sibling of the app's DateTimePicker — same calendar visuals,
 * header strip, portal positioning, and Clear/Done footer, minus the
 * hour/minute columns since date_of_birth / available_from are plain
 * dates. Emits a yyyy-MM-dd string, matching what the API expects.
 */
function DatePicker({
  label, value, onChange, icon,
}: {
  label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const selected = value ? new Date(`${value}T00:00:00`) : null;
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const openPanel = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelWidth = 260;
      const panelHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < panelHeight && rect.top > panelHeight;
      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 16) left = window.innerWidth - panelWidth - 16;

      setCoords({
        top: openUpward ? rect.top - 8 - panelHeight : rect.bottom + 8,
        left,
        width: rect.width,
      });
    }
    if (!open) setViewDate(selected ?? new Date());
    setOpen(o => !o);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    function handleScroll() { setOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const numDays = new Date(year, month + 1, 0).getDate();
  const startOffset = new Date(year, month, 1).getDay();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long" });
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  const selectDay = (day: number) => {
    onChange(`${year}-${pad(month + 1)}-${pad(day)}`);
    setOpen(false);
  };

  const displayValue = selected
    ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
            overflow: "hidden", width: "260px",
          }}
        >
          {/* Header strip */}
          <div style={{
            background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
            padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              style={{
                background: "rgba(255,255,255,0.16)", border: "none", borderRadius: "7px",
                width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: C.white, fontSize: "14px", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.16)")}
            >‹</button>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: 600,
              color: C.white, letterSpacing: "0.3px",
            }}>
              {monthLabel} <span style={{ opacity: 0.75, fontWeight: 500 }}>{year}</span>
            </span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={{
                background: "rgba(255,255,255,0.16)", border: "none", borderRadius: "7px",
                width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: C.white, fontSize: "14px", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.16)")}
            >›</button>
          </div>

          {/* Calendar */}
          <div style={{ padding: "14px" }}>
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
                        width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "7px", fontSize: "12px", cursor: "pointer",
                        background: isSelected ? `linear-gradient(135deg, ${C.redBright}, ${C.red})` : "transparent",
                        color: isSelected ? C.white : C.textBody,
                        fontWeight: isSelected ? 700 : isToday ? 700 : 400,
                        border: isToday && !isSelected ? `1.5px solid ${C.red}` : "1.5px solid transparent",
                        boxShadow: isSelected ? `0 3px 10px ${C.redGlow}` : "none",
                        transition: "border-color 0.15s",
                      }}
                    >
                      {day}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "10px 16px", borderTop: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center", background: C.inputBg,
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
                color: C.white, fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.3px", cursor: "pointer",
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
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, position: "relative" }}>
      <label className="form-label">{label}</label>

      <div
        ref={triggerRef}
        onClick={openPanel}
        style={{
          position: "relative", cursor: "pointer",
          padding: icon ? "10px 14px 10px 38px" : "10px 14px",
          background: C.inputBg,
          border: `1px solid ${open ? C.red : C.border}`,
          borderRadius: "8px", color: displayValue ? C.textBody : C.textHint,
          fontSize: "14px", fontWeight: displayValue ? 500 : 400,
          transition: "all 0.2s ease", userSelect: "none",
          boxShadow: open ? `0 0 0 3px ${C.redGlow}` : "none",
        }}
      >
        {icon && (
          <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: open ? C.red : C.textHint, transition: "color 0.2s" }}>
            {icon}
          </div>
        )}
        {displayValue || "Select date"}
      </div>

      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  );
}

/* ─── EDIT CONTRACTOR MODAL ───────────────────────────────────── */
/*
 * Uses the same endpoint/field-shape as the working EditModal on the
 * employees list page: PUT /employees/{id} with first_name, last_name,
 * email, phone_number, gender, date_of_birth, city, province,
 * postal_code, permit_status, shift_preference, available_from,
 * license_required.
 *
 * NOTE: job_category_id, job_industry_id, campaign_id, and the license
 * expiry month/year are shown elsewhere on this page but are NOT sent
 * here — the PUT contract for those fields hasn't been confirmed. Add
 * them to the `form` state / body below once confirmed.
 */
interface EditContractorModalProps {
  employee: EmployeeDetail;
  onClose: () => void;
  onSaved: (updated: EmployeeDetail) => void;
  showToast: (t: { type: "success" | "error"; message: string }) => void;
}

function EditContractorModal({ employee, onClose, onSaved, showToast }: EditContractorModalProps) {
  const [form, setForm] = useState({
    first_name: employee.first_name || "",
    last_name: employee.last_name || "",
    email: employee.email || "",
    phone_number: employee.phone_number || "",
    gender: employee.gender || "Male",
    date_of_birth: toDateInputValue(employee.date_of_birth),
    city: employee.city || "",
    province: employee.province || "",
    postal_code: employee.postal_code || "",
    permit_status: employee.permit_status || "citizen",
    shift_preference: employee.shift_preference || "day_shift",
    available_from: toDateInputValue(employee.available_from),
    license_required: employee.license_required || false,
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/employees/${employee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let serverMessage = "";
        try { const e = await res.json(); serverMessage = e?.message || e?.error || ""; } catch {}
        throw new Error(serverMessage || `Error ${res.status}`);
      }
      onSaved({ ...employee, ...form });
      showToast({ type: "success", message: "Contractor updated successfully." });
      onClose();
    } catch (err: any) {
      const msg = err.message || "Failed to update contractor.";
      setErrorMsg(msg);
      showToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: C.textHeading, fontFamily: "'Cormorant Garamond', serif" }}>
              Edit Contractor
            </h2>
            <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "4px" }}>
              {employee.first_name} {employee.last_name}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: C.alertBg, border: `1px solid ${C.alertBorder}`, color: C.alertText, fontSize: 13, marginBottom: 16 }}>
            <AlertTriangle size={14} /> {errorMsg}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" value={form.first_name} onChange={e => set("first_name", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" value={form.last_name} onChange={e => set("last_name", e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone_number} onChange={e => set("phone_number", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-input" value={form.gender} onChange={e => set("gender", e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <DatePicker
            label="Date of Birth"
            value={form.date_of_birth}
            onChange={v => set("date_of_birth", v)}
            icon={<Calendar size={15} />}
          />
          <DatePicker
            label="Available From"
            value={form.available_from}
            onChange={v => set("available_from", v)}
            icon={<Calendar size={15} />}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e => set("city", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Province</label>
            <input className="form-input" value={form.province} onChange={e => set("province", e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Postal Code</label>
            <input className="form-input" value={form.postal_code} onChange={e => set("postal_code", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Permit Status</label>
            <select className="form-input" value={form.permit_status} onChange={e => set("permit_status", e.target.value)}>
              <option value="citizen">Canadian Citizen</option>
              <option value="permanent_resident">Permanent Resident</option>
              <option value="open_work_permit">Open Work Permit</option>
              <option value="employer_specific_permit">Employer-Specific Permit</option>
              <option value="pending">Pending</option>
              <option value="student_coop">Student Visa (Co-op)</option>
              <option value="approved">Approved</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Shift Preference</label>
            <select className="form-input" value={form.shift_preference} onChange={e => set("shift_preference", e.target.value)}>
              <option value="morning_shift">Morning (6 AM – 2 PM)</option>
              <option value="afternoon_shift">Afternoon (2 PM – 10 PM)</option>
              <option value="night_shift">Night (10 PM – 6 AM)</option>
              <option value="day_shift">Day Shift</option>
              <option value="rotating_shift">Rotating</option>
              <option value="split_shift">Split Shift</option>
              <option value="on_call">On-Call / Flexible</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">License Required</label>
            <select className="form-input" value={form.license_required ? "true" : "false"} onChange={e => set("license_required", e.target.value === "true")}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <motion.button
            whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: C.red, border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function parseAvailabilityDays(raw: string[] | null | undefined): string[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  const looksMalformed = raw.some(d => typeof d === "string" && (d.includes("[") || d.includes("]") || d.includes('"')));
  if (!looksMalformed) return raw;
  return raw
    .join(",")
    .replace(/[\[\]"]/g, "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

/* ─── TOAST (lightweight, local to this page) ─────────────────── */
function ToastNotification({ toast, onDismiss }: { toast: { type: "success" | "error"; message: string }; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const isSuccess = toast.type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{
        position: "fixed", bottom: 32, right: 32, zIndex: 2000,
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: "16px 20px", boxShadow: `0 8px 32px ${C.shadowMd}`,
        display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, minWidth: 280,
        borderLeft: `4px solid ${isSuccess ? C.successText : C.alertText}`,
      }}>
      <span style={{ color: isSuccess ? C.successText : C.alertText }}>
        {isSuccess ? <CheckCheck size={18} /> : <AlertTriangle size={18} />}
      </span>
      <span style={{ color: C.textBody, flex: 1 }}>{toast.message}</span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "2px" }}>
        <X size={16} />
      </button>
    </motion.div>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────────── */
export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id as string;

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("employees");

  const [emp, setEmp] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Applied jobs
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [appliedJobsLoading, setAppliedJobsLoading] = useState(true);
  const [appliedJobsError, setAppliedJobsError] = useState<string | null>(null);

  const [userPolicy, setUserPolicy] = useState<UserPolicy | null>(null);
const [userPolicyLoading, setUserPolicyLoading] = useState(false);

  // Chat session
  const [chatLoading, setChatLoading] = useState(false);

  // Verify action
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showToast = useCallback((t: { type: "success" | "error"; message: string }) => setToast(t), []);

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BASE_URL}/employees?id=${encodeURIComponent(employeeId)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const json = await res.json();
      const record = (json.data || [])[0];
      if (!record) throw new Error("Employee not found.");
      setEmp(record);
    } catch (err: any) {
      setError(err.message || "Failed to load employee.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  /* ── Applied Jobs — GET /jobs/user/:user_id ── */
  const fetchAppliedJobs = useCallback(async () => {
    if (!employeeId) return;
    setAppliedJobsLoading(true);
    setAppliedJobsError(null);
    try {
      const res = await fetch(
        `${BASE_URL}/jobs/user/${encodeURIComponent(employeeId)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
     const json = await res.json();

setAppliedJobs(json.data ?? []);
    } catch (err: any) {
      setAppliedJobsError(err.message || "Failed to load applied jobs.");
    } finally {
      setAppliedJobsLoading(false);
    }
  }, [employeeId]);

  /* ── User Policy — GET /jobs/policy/upload?user_id=...
   * A 404 here just means this employee hasn't uploaded a signed
   * policy PDF yet — that's an expected, normal state (most employees
   * won't have one), not an error. Only genuinely unexpected failures
   * (5xx, network errors) are logged and surfaced.
   */
  const fetchUserPolicy = useCallback(async () => {
    if (!employeeId) return;

    setUserPolicyLoading(true);

    try {
      const res = await fetch(
        `${BASE_URL}/jobs/policy/upload?user_id=${encodeURIComponent(employeeId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (res.status === 404) {
        // No policy uploaded for this employee yet — normal, not an error.
        setUserPolicy(null);
        return;
      }

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const json: UserPolicy = await res.json();
      setUserPolicy(json);
    } catch (err) {
      // Only reaches here for genuinely unexpected failures (5xx, network, etc).
      console.error("Failed to load user policy:", err);
      setUserPolicy(null);
    } finally {
      setUserPolicyLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
  fetchEmployee();
}, [fetchEmployee]);

useEffect(() => {
  fetchAppliedJobs();
}, [fetchAppliedJobs]);

useEffect(() => {
  fetchUserPolicy();
}, [fetchUserPolicy]);

  /* ── Approve / Reject a job application ──
   * PATCH /auth/applications/{jobId}/status
   * body: { user_id, status: "approved" | "rejected" }
   */
const handleJobDecision = useCallback(
  async (
    applicationId: string,
    status: "approved" | "rejected"
  ) => {
    console.log("========== APPROVE / REJECT ==========");
    console.log("applicationId:", applicationId);
    console.log("employeeId:", employeeId);
    console.log("status:", status);

    if (!employeeId) {
      console.log("employeeId missing");
      return;
    }

    try {
      const url = `${BASE_URL}/auth/applications/${applicationId}/status`;

      console.log("PATCH URL:", url);

      const body = {
        user_id: employeeId,
        status,
      };

      console.log("REQUEST BODY:", body);

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });

      console.log("HTTP STATUS:", res.status);
      console.log("HTTP OK:", res.ok);

      const text = await res.text();

      console.log("RAW RESPONSE:");
      console.log(text);

      if (!res.ok) {
        throw new Error(text);
      }

      setAppliedJobs(prev =>
        prev.map(job =>
          job.application_id === applicationId
            ? {
                ...job,
                application_status: status,
              }
            : job
        )
      );

      showToast({
        type: "success",
        message:
          status === "approved"
            ? "Application approved successfully."
            : "Application rejected successfully.",
      });
    } catch (err) {
      console.error("PATCH ERROR:", err);

      showToast({
        type: "error",
        message: String(err),
      });
    }
  },
  [employeeId, showToast]
);

  /* ── Verify ── */
  const handleVerify = async () => {
    if (!emp || verifying) return;
    setVerifying(true);
    try {
      const res = await fetch(`${BASE_URL}/employees/${emp.id}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setEmp(prev => prev ? { ...prev, verification_status: "verified" } : prev);
      setVerifySuccess(true);
      setTimeout(() => setVerifySuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  /* ── Open Chat ── */
  const handleOpenChat = async () => {
    if (!emp || chatLoading) return;
    setChatLoading(true);
    try {
      let sessionId: string | null = null;
      try {
        const getRes = await fetch(
          `${BASE_URL}/chat/sessions/employee/${emp.id}?mobile_number=${encodeURIComponent(emp.phone_number)}`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (getRes.ok) {
          const j = await getRes.json();
          if (j?.data?.id) sessionId = j.data.id;
        }
      } catch {}

      if (!sessionId) {
        const postRes = await fetch(`${BASE_URL}/chat/sessions/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({
            employee_id: emp.id,
            mobile_number: emp.phone_number,
            campaign_id: emp.campaign_id,
            job_category_id: parseInt(emp.job_category_id, 10),
          }),
        });
        if (!postRes.ok) throw new Error(`Error ${postRes.status}`);
        const j = await postRes.json();
        sessionId = j?.data?.id;
      }

      if (!sessionId) throw new Error("No session ID returned.");
      const p = new URLSearchParams({
        name: `${emp.first_name} ${emp.last_name}`,
        phone: emp.phone_number,
        sessionId,
        campaignId: String(emp.campaign_id),
        jobCategoryId: emp.job_category_id,
      });
      router.push(`/chat/${emp.id}?${p.toString()}`);
    } catch (err: any) {
      alert(err.message || "Failed to open chat.");
    } finally {
      setChatLoading(false);
    }
  };

  /* ── Edit save handler — merges the updated fields into local state ── */
  const handleEditSaved = (updated: EmployeeDetail) => {
    setEmp(updated);
  };

  /* ── DERIVED ── */
  const age = emp ? calcAge(emp.date_of_birth) : null;
  const shiftLabel = emp ? (SHIFT_MAP[emp.shift_preference] ?? emp.shift_preference) : "—";
  const licenseExpiry = emp?.license_required && emp.license_expiry_month && emp.license_expiry_year
    ? `${MONTHS[emp.license_expiry_month - 1]} ${emp.license_expiry_year}` : null;
  const licenseExpired = emp
    ? isLicenseExpired(emp.license_expiry_month, emp.license_expiry_year)
    : false;

  /* ── LOADING SKELETON ── */
  if (loading) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed}
            activeTab={activeTab} setActiveTab={setActiveTab} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ height: 64, background: C.surface, borderBottom: `1px solid ${C.border}` }} />
            <div style={{ padding: "40px", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Hero skeleton */}
              <div className="clean-card" style={{ padding: "32px 36px" }}>
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                  <div className="skeleton" style={{ width: 88, height: 88, borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <SkeletonBlock h={32} w="40%" />
                    <SkeletonBlock h={18} w="25%" />
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <SkeletonBlock h={26} w="80%" />
                      <SkeletonBlock h={26} w="100%" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Section skeletons */}
              {[1, 2, 3].map(i => (
                <div key={i} className="section-card">
                  <div className="section-header"><SkeletonBlock h={20} w="30%" /></div>
                  <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <SkeletonBlock h={16} /><SkeletonBlock h={16} w="75%" /><SkeletonBlock h={16} w="60%" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── ERROR STATE ── */
  if (error || !emp) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed}
            activeTab={activeTab} setActiveTab={setActiveTab} />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="clean-card" style={{ padding: "48px 40px", textAlign: "center", maxWidth: 420 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.alertBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <AlertTriangle size={26} color={C.red} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.textHeading, marginBottom: 8 }}>Failed to load profile</p>
              <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 24, lineHeight: 1.6 }}>{error ?? "Employee not found."}</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button className="back-btn" onClick={() => router.back()}><ArrowLeft size={15}/> Go Back</button>
                <button className="action-btn" onClick={fetchEmployee}
                  style={{ background: C.red, color: "#fff" }}>
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed}
          activeTab={activeTab} setActiveTab={setActiveTab} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <TopNav emp={emp} />

          <main style={{ padding: "40px", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>

            {/* ── VERIFY SUCCESS TOAST ── */}
            <AnimatePresence>
              {verifySuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: 12, background: C.successBg, border: `1px solid ${C.successBorder}`, color: C.successText, fontSize: 14, fontWeight: 600 }}>
                  <CheckCheck size={18} /> Employee verified successfully.
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─────────────────────────────────────────── */}
            {/* HERO CARD                                   */}
            {/* ─────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="clean-card" style={{ overflow: "hidden" }}>

              {/* Colour band */}
              <div style={{ height: 80, background: `linear-gradient(135deg, #8B0000 0%, ${C.red} 45%, #E53935 75%, #FF8A80 100%)`, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.07,
                  backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
                  backgroundSize: "12px 12px" }} />
              </div>

              <div style={{ padding: "0 36px 32px", position: "relative" }}>
                {/* Avatar */}
                <div style={{
                  position: "absolute", top: -40, left: 36,
                  width: 80, height: 80, borderRadius: "50%",
                  background: C.surface, border: `4px solid ${C.surface}`,
                  boxShadow: `0 4px 20px ${C.shadowMd}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 700, color: C.red,
                }}>
                  {emp.first_name?.[0] ?? ""}{emp.last_name?.[0] ?? ""}
                </div>

                <div style={{ paddingTop: 52, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                  <div>
                    <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: C.textHeading, lineHeight: 1.1, marginBottom: 6 }}>
                      {emp.first_name} {emp.last_name}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                      <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 500 }}>
                        {emp.job_categories?.name ?? "—"} · {emp.job_industries?.name ?? "—"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <VerificationBadge status={emp.verification_status} />
                      <PermitBadge status={emp.permit_status} />
                      <span className="chip" style={{ background: C.blueBg, borderColor: C.blueBorder, color: C.blueText }}>
                        <Building2 size={11} /> {emp.campaigns?.name ?? "—"}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <button className="action-btn" onClick={() => setShowEditModal(true)}
                      style={{ background: C.surface, color: C.textLabel, border: `1px solid ${C.border}` }}>
                      <Edit2 size={14} /> Edit Contractor
                    </button>
                    {emp.verification_status !== "verified" && (
                      <button className="action-btn" onClick={handleVerify} disabled={verifying}
                        style={{ background: C.successText, color: "#fff", opacity: verifying ? 0.7 : 1 }}>
                        {verifying
                          ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          : <CheckCircle size={14} />}
                        {verifying ? "Verifying…" : "Verify Employee"}
                      </button>
                    )}
                    <button className="action-btn" onClick={handleOpenChat} disabled={chatLoading}
                      style={{ background: C.red, color: "#fff", opacity: chatLoading ? 0.7 : 1 }}>
                      {chatLoading
                        ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        : <MessageSquare size={14} />}
                      {chatLoading ? "Opening…" : "Open Chat"}
                    </button>
                    {emp.resume_url && (
                      <a href={emp.resume_url} target="_blank" rel="noreferrer" className="doc-action-btn"
                        style={{ padding: "10px 18px", fontSize: 13, fontWeight: 600 }}>
                        <Download size={14} /> Resume
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ─────────────────────────────────────────── */}
            {/* APPLIED JOBS (top of page, per request)     */}
            {/* ─────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.02 }}
              className="section-card">
              <SectionTitle
                icon={<BriefcaseIcon size={15} color={C.red} />}
                label="Applied Jobs"
                right={
                  <button
                    onClick={fetchAppliedJobs}
                    disabled={appliedJobsLoading}
                    className="doc-action-btn"
                    style={{ padding: "6px 12px" }}
                  >
                    <RefreshCw size={12} style={appliedJobsLoading ? { animation: "spin 1s linear infinite" } : undefined} />
                    Refresh
                  </button>
                }
              />

              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {appliedJobsLoading ? (
                  <>
                    <SkeletonBlock h={92} />
                    <SkeletonBlock h={92} />
                  </>
                ) : appliedJobsError ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 10, background: C.alertBg, border: `1px solid ${C.alertBorder}`, color: C.alertText, fontSize: 13 }}>
                    <AlertTriangle size={15} /> {appliedJobsError}
                    <button
                      onClick={fetchAppliedJobs}
                      style={{ marginLeft: "auto", background: "none", border: "none", color: C.alertText, fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Retry
                    </button>
                  </div>
                ) : appliedJobs.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: C.textHint, fontSize: 14 }}>
                    This contractor hasn't applied to any jobs yet.
                  </div>
                ) : (
                  appliedJobs.map((job, index) => (
  <AppliedJobCard
    key={job.id || index}
    job={job}
    employeeId={employeeId}
    policyUrl={userPolicy?.signed_pdf_url ?? null}
    onDecision={handleJobDecision}
  />
))
                )}
              </div>
            </motion.div>

            {/* ─────────────────────────────────────────── */}
            {/* TWO-COLUMN LAYOUT                           */}
            {/* ─────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* ── PERSONAL INFORMATION ── */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
                className="section-card">
                <SectionTitle icon={<User size={15} color={C.red} />} label="Personal Information" />
                <div className="detail-grid">
                  <Cell label="First Name">{emp.first_name || "—"}</Cell>
                  <Cell label="Last Name">{emp.last_name || "—"}</Cell>
                  <Cell label="Email">
                    <a href={`mailto:${emp.email}`} style={{ color: C.red, textDecoration: "none", wordBreak: "break-all" }}>
                      {emp.email || "—"}
                    </a>
                  </Cell>
                  <Cell label="Phone">
                    <a href={`tel:${emp.phone_number}`} style={{ color: C.textBody, textDecoration: "none" }}>
                      {emp.phone_number || "—"}
                    </a>
                  </Cell>
                  <Cell label="Gender">
                    <span style={{ textTransform: "capitalize" }}>{emp.gender || "—"}</span>
                  </Cell>
                  <Cell label="Date of Birth">
                    {fmtDate(emp.date_of_birth)}
                    {age !== null && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: C.textMuted, fontWeight: 400 }}>
                        (Age {age})
                      </span>
                    )}
                  </Cell>
                  <Cell label="Registration No." fullWidth>
                    <span className="detail-value mono" style={{ color: C.red, letterSpacing: 1.5 }}>
                      {emp.registration_number || "—"}
                    </span>
                  </Cell>
                </div>
              </motion.div>

              {/* ── LOCATION ── */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}
                className="section-card">
                <SectionTitle icon={<MapPin size={15} color={C.red} />} label="Location" />
                <div className="detail-grid">
                  <Cell label="City">{emp.city || "—"}</Cell>
                  <Cell label="Province">{emp.province || "—"}</Cell>
                  <Cell label="Postal Code">
                    <span className="detail-value mono">{emp.postal_code || "—"}</span>
                  </Cell>
                  <Cell label="Campaign">
                    <span className="chip" style={{ background: C.blueBg, borderColor: C.blueBorder, color: C.blueText }}>
                      <Building2 size={11} />{emp.campaigns?.name ?? "—"}
                    </span>
                  </Cell>
                </div>

                {/* Mini map placeholder */}
                <div style={{ margin: "0 24px 24px", borderRadius: 10, height: 110, background: C.inputBg, overflow: "hidden", position: "relative", border: `1px solid ${C.border}` }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "linear-gradient(rgba(0,0,0,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.3) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <MapPin size={16} color={C.red} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.textMuted }}>{emp.city}, {emp.province} · {emp.postal_code}</span>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* ─────────────────────────────────────────── */}
            {/* JOB & COMPLIANCE (full width)               */}
            {/* ─────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12 }}
              className="section-card">
              <SectionTitle icon={<Briefcase size={15} color={C.red} />} label="Job & Compliance" />
              <div className="detail-grid">
                <Cell label="Job Category">
                  <span style={{ fontWeight: 600, color: C.textHeading }}>{emp.job_categories?.name ?? "—"}</span>
                </Cell>
                <Cell label="Job Industry">
                  {emp.job_industries?.name ?? "—"}
                </Cell>
                <Cell label="Verification Status">
                  <VerificationBadge status={emp.verification_status} />
                </Cell>
            <Cell label="Permit Status">
                  <PermitBadge status={emp.permit_status} />
                </Cell>
                {emp.permit_note && (
                  <Cell label="Permit Note">
                    {emp.permit_note}
                  </Cell>
                )}
                {emp.permit_expiry_month && emp.permit_expiry_year && (
                  <Cell label="Permit Expiry">
                    {MONTHS[emp.permit_expiry_month - 1]} {emp.permit_expiry_year}
                  </Cell>
                )}
                <Cell label="Availability Days">
                  {parseAvailabilityDays(emp.availability_days).length
                    ? parseAvailabilityDays(emp.availability_days).join(", ")
                    : "—"}
                </Cell>
                <Cell label="Shift Preference">
                  <span className="chip" style={{ background: C.purpleBg, borderColor: C.purpleBorder, color: C.purpleText }}>
                    <Clock size={11} />{shiftLabel}
                  </span>
                </Cell>
                <Cell label="Available From">
                  <span style={{ color: C.red, fontWeight: 700 }}>
                    <Calendar size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                    {fmtDateShort(emp.available_from)}
                  </span>
                </Cell>
                <Cell label="License Required">
                  {emp.license_required ? (
                    <span className="chip" style={{ background: C.pendingBg, borderColor: C.pendingBorder, color: C.pendingText }}>
                      <CheckCircle size={11} /> Yes
                    </span>
                  ) : (
                    <span className="chip" style={{ background: C.inputBg, borderColor: C.border, color: C.textMuted }}>
                      No
                    </span>
                  )}
                </Cell>
                <Cell label="License Expiry">
                  {licenseExpiry ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {licenseExpiry}
                      {licenseExpired && (
                        <span className="chip" style={{ background: C.alertBg, borderColor: C.alertBorder, color: C.alertText }}>
                          <AlertTriangle size={10} /> Expired
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: C.textHint }}>—</span>
                  )}
                </Cell>
              </div>
            </motion.div>

            {/* ─────────────────────────────────────────── */}
            {/* SENSITIVE DOCUMENTS (SIN + BANK)            */}
            {/* ─────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.16 }}
              className="section-card">
              <SectionTitle
                icon={<Lock size={15} color={C.red} />}
                label="Sensitive & Financial Documents"
              />

              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Compliance notice */}
                <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderRadius: 10, background: C.pendingBg, border: `1px solid ${C.pendingBorder}` }}>
                  <ShieldCheck size={16} color={C.pendingText} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12.5, color: C.pendingText, lineHeight: 1.6 }}>
                    This section contains confidential payroll information. Access is logged and restricted to authorized personnel only.
                  </span>
                </div>

                {/* ── SIN ── */}
                <div style={{ borderRadius: 12, border: emp.sin ? `1.5px solid ${C.successBorder}` : `1px solid ${C.border}`, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: emp.sin ? C.successBg : C.inputBg, borderBottom: `1px solid ${emp.sin ? C.successBorder : C.border}` }}>
                    <Fingerprint size={16} color={emp.sin ? C.successText : C.textHint} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: emp.sin ? C.successText : C.textMuted }}>
                      Social Insurance Number (SIN)
                    </span>
                    {emp.sin ? (
                      <span className="chip" style={{ marginLeft: "auto", background: C.successBg, borderColor: C.successBorder, color: C.successText }}>
                        <BadgeCheck size={11} /> On File
                      </span>
                    ) : (
                      <span className="chip" style={{ marginLeft: "auto", background: C.alertBg, borderColor: C.alertBorder, color: C.alertText }}>
                        Missing
                      </span>
                    )}
                  </div>

                  {emp.sin ? (
                    <div className="detail-grid">
                      <Cell label="SIN Number">
                        <SensitiveField value={emp.sin.sin_number} mask={maskSIN} />
                      </Cell>
                      <Cell label="Submitted On">
                        {fmtDateTime(emp.sin.created_at)}
                      </Cell>
                      <Cell label="Supporting Document" fullWidth>
                        {emp.sin.document_url ? (
                          <a href={emp.sin.document_url} target="_blank" rel="noreferrer" className="doc-action-btn">
                            <ExternalLink size={13} /> View Document
                          </a>
                        ) : (
                          <span style={{ fontSize: 13, color: C.textHint, fontStyle: "italic" }}>No supporting document uploaded</span>
                        )}
                      </Cell>
                    </div>
                  ) : (
                    <div style={{ padding: "24px", textAlign: "center", color: C.textHint, fontSize: 14 }}>
                      No SIN on file for this employee.
                    </div>
                  )}
                </div>

                {/* ── BANK ACCOUNT ── */}
                <div style={{ borderRadius: 12, border: emp.bank_account ? `1.5px solid ${C.successBorder}` : `1px solid ${C.border}`, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", background: emp.bank_account ? C.successBg : C.inputBg, borderBottom: `1px solid ${emp.bank_account ? C.successBorder : C.border}` }}>
                    <Banknote size={16} color={emp.bank_account ? C.successText : C.textHint} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: emp.bank_account ? C.successText : C.textMuted }}>
                      Bank Account Details
                    </span>
                    {emp.bank_account ? (
                      <span className="chip" style={{ marginLeft: "auto", background: C.successBg, borderColor: C.successBorder, color: C.successText }}>
                        <BadgeCheck size={11} /> On File
                      </span>
                    ) : (
                      <span className="chip" style={{ marginLeft: "auto", background: C.alertBg, borderColor: C.alertBorder, color: C.alertText }}>
                        Missing
                      </span>
                    )}
                  </div>

                  {emp.bank_account ? (
                    <div className="detail-grid">
                      <Cell label="Account Number">
                        <SensitiveField value={emp.bank_account.account_number} mask={maskAccount} />
                      </Cell>
                      <Cell label="Submitted On">
                        {fmtDateTime(emp.bank_account.created_at)}
                      </Cell>
                      <Cell label="Supporting Document" fullWidth>
                        {emp.bank_account.document_url ? (
                          <a href={emp.bank_account.document_url} target="_blank" rel="noreferrer" className="doc-action-btn">
                            <ExternalLink size={13} /> View Document
                          </a>
                        ) : (
                          <span style={{ fontSize: 13, color: C.textHint, fontStyle: "italic" }}>No supporting document uploaded</span>
                        )}
                      </Cell>
                    </div>
                  ) : (
                    <div style={{ padding: "24px", textAlign: "center", color: C.textHint, fontSize: 14 }}>
                      No bank account on file for this employee.
                    </div>
                  )}
                </div>

              </div>
            </motion.div>

            {/* ─────────────────────────────────────────── */}
            {/* DOCUMENTS (Resume / License / other files)  */}
            {/* ─────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.20 }}
              className="section-card">
              <SectionTitle icon={<FileText size={15} color={C.red} />} label="Uploaded Documents" />
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                <DocCard
                  icon={<FileText size={20} color={emp.resume_url ? C.red : C.textHint} />}
                  title="Resume / CV"
                  subtitle={emp.resume_url
                    ? (emp.resume_url.split("/").pop()?.split("?")[0] ?? "Resume.pdf")
                    : "No resume uploaded"}
                  docUrl={emp.resume_url}
                  badge={emp.resume_url ? "Available" : undefined}
                  badgeColor={emp.resume_url ? { bg: C.successBg, border: C.successBorder, color: C.successText } : undefined}
                />

                {/* ── LICENSE DOCUMENT ── (only relevant when a license is required for this role) */}
                <DocCard
                  icon={<FileText size={20} color={emp.permit_document_url ? C.red : C.textHint} />}
                  title="Permit Document"
                  subtitle={emp.permit_document_url
                    ? (emp.permit_document_url.split("/").pop()?.split("?")[0] ?? "Permit.pdf")
                    : "No permit document uploaded"}
                  docUrl={emp.permit_document_url}
                  badge={emp.permit_document_url ? "Available" : undefined}
                  badgeColor={emp.permit_document_url ? { bg: C.successBg, border: C.successBorder, color: C.successText } : undefined}
                />

                {/* ── LICENSE DOCUMENT ── (only relevant when a license is required for this role) */}
                {emp.license_required && (
                  <DocCard
                    icon={<IdCard size={20} color={emp.license_url ? C.red : C.textHint} />}
                    title="License Document"
                    subtitle={
                      emp.license_url
                        ? `${licenseExpiry ? `Expires ${licenseExpiry}` : "Expiry date not set"}${licenseExpired ? " · Expired" : ""}`
                        : "No license document uploaded"
                    }
                    docUrl={emp.license_url}
                    badge={
                      emp.license_url
                        ? (licenseExpired ? "Expired" : "Available")
                        : "Missing"
                    }
                    badgeColor={
                      emp.license_url
                        ? (licenseExpired
                          ? { bg: C.alertBg, border: C.alertBorder, color: C.alertText }
                          : { bg: C.successBg, border: C.successBorder, color: C.successText })
                        : { bg: C.alertBg, border: C.alertBorder, color: C.alertText }
                    }
                  />
                )}

             
              </div>
            </motion.div>

            {/* ─────────────────────────────────────────── */}
            {/* SYSTEM METADATA                             */}
            {/* ─────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.24 }}
              className="section-card">
              <SectionTitle icon={<Hash size={15} color={C.textMuted} />} label="Other Information" accent={C.inputBg} />
              <div className="detail-grid">
                <Cell label="Employee ID" fullWidth>
                  <span className="detail-value mono" style={{ fontSize: 12, color: C.textMuted }}>{emp.id}</span>
                </Cell>
                <Cell label="Registered On">
                  {fmtDateTime(emp.created_at)}
                </Cell>
                <Cell label="Last Updated">
                  {fmtDateTime(emp.updated_at)}
                </Cell>
                <Cell label="Campaign ID">
                  <span className="detail-value mono">{emp.campaign_id}</span>
                </Cell>
              </div>
            </motion.div>

            {/* Footer */}
            <p style={{ fontSize: 12, color: C.textHint, textAlign: "center", paddingBottom: 8 }}>
              © 2026 JBR Staffing Solutions Pvt. Ltd.
            </p>

          </main>
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      <AnimatePresence>
        {showEditModal && (
          <EditContractorModal
            employee={emp}
            onClose={() => setShowEditModal(false)}
            onSaved={handleEditSaved}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && <ToastNotification toast={toast} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}