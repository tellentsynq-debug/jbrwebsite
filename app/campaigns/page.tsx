"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, cubicBezier, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  LogOut, Plus, Search, Copy, Check, Edit2, EyeOff, Eye, X,
  Calendar as CalendarIcon, Trash2, AlertTriangle, RefreshCw
} from "lucide-react";
import Sidebar from "../components/Sidebar";

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
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
  pendingBg: "rgba(59,130,246,0.08)",
  pendingBorder: "rgba(59,130,246,0.2)",
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
  .table-min-width { min-width: 1100px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
`;

/* ─── TYPES ──────────────────────────────────────────────────── */
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

/* ─── HELPERS ────────────────────────────────────────────────── */
function getToken(): string | null {
  return localStorage.getItem("jbr_token");
}

function authHeaders(includeContentType = false): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (includeContentType) headers["Content-Type"] = "application/json";
  return headers;
}

function formatDate(iso: string): string {
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

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);
const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
};
const itemVars: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 22 } }
};

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
      <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHeading, fontWeight: 600 }}>
        Campaign Link
      </span>
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

/* ─── COPY LINK BUTTON ───────────────────────────────────────── */
function CopyLinkButton({ campaign }: { campaign: Campaign }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const link = getCampaignLink(campaign);
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={copied ? {} : { backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
        background: copied ? C.successBg : "transparent",
        border: `1px solid ${copied ? "transparent" : C.border}`,
        borderRadius: "6px", cursor: "pointer",
        color: copied ? C.successText : C.textLabel,
        transition: "all 0.2s ease", whiteSpace: "nowrap"
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span style={{ fontSize: "12px", fontWeight: 600 }}>{copied ? "Copied!" : "Copy Link"}</span>
    </motion.button>
  );
}

/* ─── FORM FIELD ─────────────────────────────────────────────── */
interface FormFieldProps {
  label: string;
  placeholder: string;
  isDate?: boolean;
  value: string;
  onChange: (v: string) => void;
}
function FormField({ label, placeholder, isDate = false, value, onChange }: FormFieldProps) {
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
          outline: "none", transition: "all 0.2s ease"
        }}
      />
    </div>
  );
}

/* ─── STATUS BADGE ───────────────────────────────────────────── */
function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", background: C.successBg, color: C.successText, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.successText }} /> Active
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: "20px", background: C.inactiveBg, color: C.inactiveText, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
      Inactive
    </div>
  );
}

/* ─── SPINNER ────────────────────────────────────────────────── */
function Spinner({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
      style={{ animation: "spin 0.7s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

/* ─── CONFIRM DELETE MODAL ───────────────────────────────────── */
interface DeleteModalProps {
  campaign: Campaign | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}
function DeleteModal({ campaign, onConfirm, onCancel, isDeleting }: DeleteModalProps) {
  return (
    <AnimatePresence>
      {campaign && (
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
              padding: "32px", textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)"
            }}
          >
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: C.alertBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <AlertTriangle size={26} color={C.red} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.textHeading, marginBottom: "10px" }}>Delete Campaign?</h2>
            <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "28px", lineHeight: 1.6 }}>
              You are about to permanently delete <strong style={{ color: C.textBody }}>{campaign.name}</strong>. This action cannot be undone.
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
                  flex: 1, padding: "12px", background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
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

/* ─── EDIT MODAL ─────────────────────────────────────────────── */
interface EditModalProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSaved: (updated: Campaign) => void;
}
function EditModal({ campaign, onClose, onSaved }: EditModalProps) {
  const [name, setName]           = useState(campaign?.name ?? "");
  const [startDate, setStartDate] = useState(toInputDate(campaign?.start_date ?? ""));
  const [endDate, setEndDate]     = useState(toInputDate(campaign?.end_date ?? ""));
  const [isActive, setIsActive]   = useState(campaign?.is_active ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");

  const handleSave = async () => {
    if (!name || !startDate || !endDate) { setErrorMsg("Please fill in all fields."); return; }
    setIsLoading(true); setErrorMsg("");
    try {
      const res = await fetch(`https://jbrstaffingsolutions.com/api/campaigns/${campaign!.id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({
          name,
          start_date: startDate,
          end_date:   endDate,
          is_active:  isActive,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated: Campaign = {
          ...campaign!,
          name:       data.name       ?? name,
          start_date: data.start_date ?? startDate,
          end_date:   data.end_date   ?? endDate,
          is_active:  data.is_active  ?? isActive,
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
              position: "relative", width: "100%", maxWidth: "560px", margin: "24px",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)"
            }}
          >
            <button
              onClick={onClose} disabled={isLoading || isSuccess}
              style={{ position: "absolute", right: "24px", top: "24px", background: "transparent", border: "none", color: C.textHint, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.color = C.textHeading}
              onMouseLeave={(e) => e.currentTarget.style.color = C.textHint}
            >
              <X size={24} />
            </button>

            <div style={{ padding: "32px 32px 24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 600, color: C.textHeading, marginBottom: "8px" }}>Edit Campaign</h2>
              <p style={{ fontSize: "14px", color: C.textMuted }}>Update the parameters for this campaign.</p>
            </div>

            <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <FormField label="Campaign Name" placeholder="Enter campaign name" value={name} onChange={setName} />
              <div style={{ display: "flex", gap: "16px" }}>
                <FormField label="Start Date" placeholder="" isDate value={startDate} onChange={setStartDate} />
                <FormField label="End Date"   placeholder="" isDate value={endDate}   onChange={setEndDate}   />
              </div>

              {/* Active toggle */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>Status</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    onClick={() => setIsActive(a => !a)}
                    style={{
                      width: "44px", height: "24px", borderRadius: "12px",
                      background: isActive ? C.successText : C.borderHover,
                      position: "relative", cursor: "pointer", transition: "background 0.3s ease", flexShrink: 0
                    }}
                  >
                    <motion.div
                      layout initial={false} animate={{ x: isActive ? 22 : 2 }}
                      style={{ width: "20px", height: "20px", borderRadius: "50%", background: C.white, position: "absolute", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                    />
                  </div>
                  <span style={{ fontSize: "14px", color: C.textBody, fontWeight: 500 }}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {errorMsg && <div style={{ color: C.red, fontSize: "13px", fontWeight: 500 }}>{errorMsg}</div>}

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
                  transition: "background 0.3s ease, box-shadow 0.3s ease",
                  opacity: isLoading ? 0.8 : 1
                }}
              >
                {isLoading ? <Spinner size={18} color={C.white} /> :
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

/* ─── CREATE CAMPAIGN MODAL ──────────────────────────────────── */
interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (campaign: Campaign) => void;
}
function CreateModal({ isOpen, onClose, onCreated }: CreateModalProps) {
  const [campaignName, setCampaignName] = useState("");
  const [startDate, setStartDate]       = useState("");
  const [endDate, setEndDate]           = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [isSuccess, setIsSuccess]       = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");

  const reset = () => { setCampaignName(""); setStartDate(""); setEndDate(""); setIsSuccess(false); setErrorMsg(""); };

  const handleCreate = async () => {
    if (!campaignName || !startDate || !endDate) { setErrorMsg("Please fill in all fields."); return; }
    setIsLoading(true); setErrorMsg("");
    try {
      const res = await fetch("https://jbrstaffingsolutions.com/api/campaigns", {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ name: campaignName, start_date: startDate, end_date: endDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        const normalized: Campaign = {
          id:         data.id,
          name:       data.name       ?? campaignName,
          start_date: data.start_date ?? startDate,
          end_date:   data.end_date   ?? endDate,
          is_active:  data.is_active  ?? true,
          link_token: data.link_token,
          created_at: data.created_at,
          updated_at: data.updated_at,
          created_by: data.created_by,
        };
        setTimeout(() => { onCreated(normalized); reset(); onClose(); }, 1400);
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
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}
            onClick={() => { if (!isLoading && !isSuccess) { reset(); onClose(); } }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            style={{
              position: "relative", width: "100%", maxWidth: "560px", margin: "24px",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)"
            }}
          >
            <button
              onClick={() => { reset(); onClose(); }} disabled={isLoading || isSuccess}
              style={{ position: "absolute", right: "24px", top: "24px", background: "transparent", border: "none", color: C.textHint, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.color = C.textHeading}
              onMouseLeave={(e) => e.currentTarget.style.color = C.textHint}
            >
              <X size={24} />
            </button>

            <div style={{ padding: "32px 32px 24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 600, color: C.textHeading, marginBottom: "8px" }}>Create New Campaign</h2>
              <p style={{ fontSize: "14px", color: C.textMuted }}>Define the parameters for your new recruitment campaign.</p>
            </div>

            <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <FormField label="Campaign Name" placeholder="Enter campaign name" value={campaignName} onChange={setCampaignName} />
              <div style={{ display: "flex", gap: "16px" }}>
                <FormField label="Start Date" placeholder="" isDate value={startDate} onChange={setStartDate} />
                <FormField label="End Date"   placeholder="" isDate value={endDate}   onChange={setEndDate}   />
              </div>

              {errorMsg && <div style={{ color: C.red, fontSize: "13px", fontWeight: 500, marginTop: "-8px" }}>{errorMsg}</div>}

              <motion.button
                disabled={isLoading || isSuccess}
                onClick={handleCreate}
                whileHover={isLoading || isSuccess ? {} : { y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }}
                whileTap={isLoading || isSuccess ? {} : { scale: 0.98 }}
                style={{
                  width: "100%", padding: "14px", marginTop: "8px",
                  background: isSuccess ? "#059669" : `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                  border: "none", borderRadius: "10px",
                  display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                  color: C.white, fontSize: "15px", fontWeight: 600, letterSpacing: "0.5px",
                  cursor: isLoading || isSuccess ? "default" : "pointer",
                  transition: "background 0.3s ease, box-shadow 0.3s ease",
                  opacity: isLoading ? 0.8 : 1
                }}
              >
                {isLoading ? <Spinner size={18} color={C.white} /> :
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

/* ─── TOAST NOTIFICATION ─────────────────────────────────────── */
interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onDone: () => void;
}
function Toast({ message, type, onDone }: ToastProps) {
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

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: "center", padding: "80px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
    >
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: C.inputBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CalendarIcon size={28} color={C.textHint} />
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading }}>No Campaigns Yet</h3>
      <p style={{ fontSize: "14px", color: C.textMuted, maxWidth: "320px", lineHeight: 1.6 }}>
        You haven't created any campaigns. Click the button below to get started.
      </p>
      <motion.button
        onClick={onCreateClick}
        whileHover={{ y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
        style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", marginTop: "8px",
          background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
          border: "none", borderRadius: "8px", color: C.white, fontSize: "14px",
          fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${C.redGlow}`
        }}
      >
        <Plus size={18} /> Create First Campaign
      </motion.button>
    </motion.div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function CampaignsPage() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("campaigns");

  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [loadError, setLoadError]   = useState("");
  const [search, setSearch]         = useState("");

  const [isCreateOpen, setCreateOpen]   = useState(false);
  const [editTarget, setEditTarget]     = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") =>
    setToast({ message, type });

  /* ── Fetch campaigns ── */
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true); setLoadError("");
    try {
      const res = await fetch("https://jbrstaffingsolutions.com/api/campaigns", {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load campaigns.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`https://jbrstaffingsolutions.com/api/campaigns/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(true),
      });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        showToast("Campaign deleted successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Failed to delete campaign.", "error");
      }
    } catch {
      showToast("A network error occurred.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

/* ─── Toggle active / inactive via PATCH with action endpoints ── */
  const handleToggleStatus = async (camp: Campaign) => {
    setActionLoading((prev) => ({ ...prev, [camp.id]: true }));
    const newActiveState = !camp.is_active;
    const action = newActiveState ? "activate" : "deactivate";
    
    try {
      const res = await fetch(`https://jbrstaffingsolutions.com/api/campaigns/${camp.id}/${action}`, {
        method: "PATCH",
        headers: authHeaders(), // No need for true (Content-Type) since there's no body
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === camp.id
              ? { ...c, is_active: data.is_active ?? newActiveState }
              : c
          )
        );
        showToast(`Campaign ${newActiveState ? "activated" : "deactivated"} successfully.`);
      } else {
        showToast(data.message || "Failed to update campaign status.", "error");
      }
    } catch {
      showToast("A network error occurred.", "error");
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[camp.id]; return n; });
    }
  };

  const handleCreated = (newCampaign: Campaign) => {
    setCampaigns((prev) => [newCampaign, ...prev]);
    showToast("Campaign created successfully!");
  };

  const handleUpdated = (updated: Campaign) => {
    setCampaigns((prev) => prev.map((c) => Number(c.id) === Number(updated.id) ? updated : c));
    setEditTarget(null);
    showToast("Campaign updated successfully.");
  };

  const filtered = campaigns.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const tableGridTemplate = "1.8fr 1fr 1fr 1fr 1fr 0.9fr";

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar
          isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed}
          activeTab={activeTab} setActiveTab={setActiveTab}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", position: "relative" }}>
          <TopNav />

          <main style={{ padding: "40px", maxWidth: "1600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}
            >
              <div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: 600, color: C.textHeading, marginBottom: "8px", letterSpacing: "-0.5px" }}>
                  Campaigns
                </h1>
                <p style={{ fontSize: "15px", color: C.textMuted }}>
                  Create and manage recruitment campaigns
                  {!isLoading && !loadError && (
                    <span style={{ marginLeft: "8px", fontSize: "13px", color: C.textHint }}>
                      ({campaigns.length} total)
                    </span>
                  )}
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <motion.button
                  onClick={fetchCampaigns}
                  whileHover={{ backgroundColor: C.inputBg }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
                    background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px",
                    color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <RefreshCw size={15} style={isLoading ? { animation: "spin 0.7s linear infinite" } : {}} />
                  Refresh
                </motion.button>

                <motion.button
                  onClick={() => setCreateOpen(true)}
                  whileHover={{ y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px",
                    background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                    border: "none", borderRadius: "8px", color: C.white, fontSize: "14px",
                    fontWeight: 600, letterSpacing: "0.5px", cursor: "pointer",
                    boxShadow: `0 4px 16px ${C.redGlow}`
                  }}
                >
                  <Plus size={18} />
                  <span>Create Campaign</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Table Card */}
            <motion.div
              variants={containerVars} initial="hidden" animate="show"
              className="clean-card"
              style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {/* Card Header */}
              <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading }}>Campaign List</h3>
                <div style={{ position: "relative" }}>
                  <Search size={16} color={C.textHint} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text" placeholder="Search campaigns..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    style={{
                      background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px",
                      padding: "10px 16px 10px 40px", color: C.textBody, fontSize: "14px",
                      width: "260px", outline: "none", transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = C.red}
                    onBlur={(e) => e.target.style.borderColor = C.border}
                  />
                </div>
              </div>

              {isLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "60px 40px", color: C.textMuted, fontSize: "15px" }}>
                  <Spinner size={22} color={C.red} /> Loading campaigns…
                </div>
              )}

              {!isLoading && loadError && (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <p style={{ color: C.red, fontSize: "14px", marginBottom: "16px" }}>{loadError}</p>
                  <motion.button
                    onClick={fetchCampaigns}
                    whileHover={{ backgroundColor: C.redActiveBg }}
                    style={{ padding: "10px 20px", border: `1px solid ${C.red}`, borderRadius: "8px", background: "transparent", color: C.red, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Retry
                  </motion.button>
                </div>
              )}

              {!isLoading && !loadError && filtered.length === 0 && (
                search
                  ? <div style={{ padding: "60px", textAlign: "center", color: C.textMuted }}>No campaigns match "{search}".</div>
                  : <EmptyState onCreateClick={() => setCreateOpen(true)} />
              )}

              {!isLoading && !loadError && filtered.length > 0 && (
                <div className="table-container">
                  <div className="table-min-width">

                    {/* Header Row */}
                    <div style={{ display: "grid", gridTemplateColumns: tableGridTemplate, padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: C.inputBg }}>
                      {["Name", "Start Date", "End Date", "Status", "Link", "Actions"].map((head, i) => (
                        <span key={i} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: C.textHint, fontWeight: 600 }}>
                          {head}
                        </span>
                      ))}
                    </div>

                    {/* Data Rows */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {filtered.map((camp, idx) => {
                        const isToggling = !!actionLoading[camp.id];

                        return (
                          <motion.div
                            key={camp.id} variants={itemVars}
                            whileHover={{ backgroundColor: C.inputBg }}
                            style={{
                              display: "grid", gridTemplateColumns: tableGridTemplate,
                              alignItems: "center", padding: "20px 32px",
                              borderBottom: idx !== filtered.length - 1 ? `1px solid ${C.border}` : "none",
                              transition: "background-color 0.2s ease"
                            }}
                          >
                            {/* Name */}
                            <div>
                              <div style={{ fontSize: "15px", fontWeight: 600, color: C.textHeading }}>{camp.name}</div>
                              <div style={{ fontSize: "11px", color: C.textHint, marginTop: "2px" }}>ID: {camp.id}</div>
                            </div>

                            {/* Start Date */}
                            <div style={{ fontSize: "14px", color: C.textMuted }}>{formatDate(camp.start_date)}</div>

                            {/* End Date */}
                            <div style={{ fontSize: "14px", color: C.textMuted }}>{formatDate(camp.end_date)}</div>

                            {/* Status — uses is_active boolean */}
                            <div><StatusBadge isActive={camp.is_active} /></div>

                            {/* Copy Link */}
                            <div>
                              <CopyLinkButton campaign={camp} />
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              {/* Edit */}
                              <motion.button
                                onClick={() => setEditTarget(camp)}
                                whileHover={{ scale: 1.1, color: C.red }}
                                whileTap={{ scale: 0.9 }}
                                title="Edit campaign"
                                style={{ background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "7px", transition: "color 0.2s", borderRadius: "6px" }}
                              >
                                <Edit2 size={17} />
                              </motion.button>

                              {/* Toggle active/inactive */}
                              <motion.button
                                onClick={() => handleToggleStatus(camp)}
                                disabled={isToggling}
                                whileHover={isToggling ? {} : { scale: 1.1, color: camp.is_active ? C.redBright : C.successText }}
                                whileTap={{ scale: 0.9 }}
                                title={camp.is_active ? "Deactivate" : "Activate"}
                                style={{
                                  background: "transparent", border: "none", color: C.textHint,
                                  cursor: isToggling ? "default" : "pointer", padding: "7px",
                                  transition: "color 0.2s", borderRadius: "6px",
                                  opacity: isToggling ? 0.5 : 1
                                }}
                              >
                                {isToggling
                                  ? <Spinner size={17} />
                                  : camp.is_active ? <EyeOff size={17} /> : <Eye size={17} />
                                }
                              </motion.button>

                              {/* Delete */}
                              <motion.button
                                onClick={() => setDeleteTarget(camp)}
                                whileHover={{ scale: 1.1, color: C.redBright }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete campaign"
                                style={{ background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "7px", transition: "color 0.2s", borderRadius: "6px" }}
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

      <CreateModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      {editTarget && <EditModal campaign={editTarget} onClose={() => setEditTarget(null)} onSaved={handleUpdated} />}
      <DeleteModal campaign={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting} />

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}

