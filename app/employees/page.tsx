"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, cubicBezier, type Variants } from "framer-motion";
import {
  LogOut, Search, ChevronDown, Download, CheckCircle,
  MessageCircle, Users, Trash2, Edit2, ChevronLeft,
  ChevronRight, Square, CheckSquare, Calendar, FileSpreadsheet,
  X, Save, AlertTriangle, CheckCheck, Loader2, UserPlus, MessageSquare
} from "lucide-react";
import * as XLSX from "xlsx";

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
  pendingBg: "rgba(59,130,246,0.08)",
  pendingBorder: "rgba(59,130,246,0.2)",
  pendingText: "#3B82F6",
  alertBg: "rgba(198,40,40,0.08)",
  alertText: "#C62828",
  shadow: "rgba(0,0,0,0.06)",
  shadowMd: "rgba(0,0,0,0.10)",
  overlayBg: "rgba(0,0,0,0.45)",
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
  .clean-card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px; box-shadow: 0 1px 3px ${C.shadow}, 0 4px 16px ${C.shadow}; }
  .table-container { width: 100%; overflow-x: auto; }
  .table-min-width { min-width: 1400px; }
  select { appearance: none; background-color: transparent; cursor: pointer; }
  select option { background-color: ${C.surface}; color: ${C.textHeading}; }
  .modal-overlay { position: fixed; inset: 0; background: ${C.overlayBg}; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(2px); }
  .modal-box { background: ${C.surface}; border-radius: 16px; padding: 32px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 600; color: ${C.textLabel}; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input { background: ${C.inputBg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 10px 14px; color: ${C.textBody}; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: ${C.red}; }
  .form-select { background: ${C.inputBg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 10px 14px; color: ${C.textBody}; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; appearance: none; }
  .toast { position: fixed; bottom: 32px; right: 32px; z-index: 2000; background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 12px; padding: 16px 20px; box-shadow: 0 8px 32px ${C.shadowMd}; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500; min-width: 280px; }
  .group-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid ${C.border}; border-radius: 10px; cursor: pointer; transition: all 0.2s; background: ${C.surface}; }
  .group-item:hover { border-color: ${C.red}; background: ${C.redActiveBg}; }
  .group-item.selected { border-color: ${C.red}; background: ${C.redActiveBg}; }
`;

/* ─── API CONFIG ──────────────────────────────────────────────── */
const BASE_URL = "https://jbrstaffingsolutions.com/api";

const getAuthToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("jbr_token") || "" : "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getAuthToken()}`,
});

/* ─── TYPES ──────────────────────────────────────────────────── */
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
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
  shift_preference: string;
  license_required: boolean;
  license_expiry_month: number | null;
  license_expiry_year: number | null;
  resume_url: string;
  created_at: string;
  updated_at: string;
  job_categories: { id: string; name: string };
  job_industries: { id: string; name: string };
  campaigns: { id: number; name: string };
}

interface JobCategory {
  id: string;
  name: string;
  job_industry?: { id: string; name: string } | null;
}

interface Group {
  id: string | number;
  name: string;
  description?: string;
  member_count?: number;
}

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

/* ─── HELPERS ────────────────────────────────────────────────── */
const formatDate = (d: string) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
};

const getVerificationBadge = (status: string) => {
  switch (status) {
    case "verified": return { bg: C.successBg, border: "transparent", color: C.successText, label: "Verified" };
    case "pending":  return { bg: C.pendingBg,  border: C.pendingBorder, color: C.pendingText,  label: "Pending"  };
    case "rejected": return { bg: C.alertBg,    border: "transparent",   color: C.alertText,    label: "Rejected" };
    default:         return { bg: C.inputBg,    border: C.border,        color: C.textMuted,    label: "Unknown"  };
  }
};

/*
 * The /groups/{id}/members endpoint (proven to work on the Shortlisted page)
 * returns rows shaped like { id, candidate_id, assigned_at, candidates: {...} }
 * instead of flat Employee objects. This normalizes one of those rows into the
 * Employee shape the rest of this page already knows how to render.
 */
const mapGroupMemberToEmployee = (m: any): Employee => {
  const c = m?.candidates || m || {};
  return {
    id: c.id,
    first_name: c.first_name || "",
    last_name: c.last_name || "",
    email: c.email || "",
    phone_number: c.phone_number || "",
    gender: c.gender || "",
    date_of_birth: c.date_of_birth || "",
    city: c.city || "",
    province: c.province || "",
    postal_code: c.postal_code || "",
    job_category_id: c.job_category_id ?? "",
    job_industry_id: c.job_industry_id ?? "",
    campaign_id: c.campaigns?.id ?? c.campaign_id ?? 0,
    verification_status: c.verification_status || "pending",
    available_from: c.available_from || "",
    permit_status: c.permit_status || "",
    shift_preference: c.shift_preference || "",
    license_required: !!c.license_required,
    license_expiry_month: c.license_expiry_month ?? null,
    license_expiry_year: c.license_expiry_year ?? null,
    resume_url: c.resume_url || "",
    created_at: c.created_at || m?.assigned_at || "",
    updated_at: c.updated_at || "",
    job_categories: c.job_categories || { id: "", name: "" },
    job_industries: c.job_industries || { id: "", name: "" },
    campaigns: c.campaigns || { id: 0, name: "" },
  };
};

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);
const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } } };
const itemVars = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } } };

function TopNav() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; email?: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("jbr_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("jbr_token");
    localStorage.removeItem("jbr_user");
    router.push("/");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: easeOutCirc }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: `1px solid ${C.border}`, background: C.surface, position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHint, fontWeight: 600 }}>Main</span>
        <span style={{ color: C.textMuted }}>/</span>
        <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHeading, fontWeight: 600 }}>Employees</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <span style={{ fontSize: "13px", color: C.textMuted }}>
          Welcome, <span style={{ color: C.textHeading, fontWeight: 600 }}>
            {user ? (user.firstName ? `${user.firstName} (${user.email})` : user.email) : "Loading..."}
          </span>
        </span>
        <motion.button
          onClick={handleSignOut}
          whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }} whileTap={{ scale: 0.98 }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}>
          Sign Out <LogOut size={16} />
        </motion.button>
      </div>
    </motion.header>
  );
}

/* ─── ASSIGN TO GROUP MODAL ──────────────────────────────────── */
interface AssignGroupModalProps {
  selectedIds: string[];
  onClose: () => void;
  showToast: (t: Toast) => void;
  onSuccess: () => void;
}

function AssignGroupModal({ selectedIds, onClose, showToast, onSuccess }: AssignGroupModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [searchGroup, setSearchGroup] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await fetch(`${BASE_URL}/groups`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        setGroups(json.data || json.groups || json || []);
      } catch (err: any) {
        showToast({ type: "error", message: err.message || "Failed to load groups." });
        setGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchGroup.toLowerCase()));

  const handleAssign = async () => {
    if (!selectedGroupId) return;
    setAssigning(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/${selectedGroupId}/add-members`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ candidate_ids: selectedIds }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const groupName = groups.find(g => g.id === selectedGroupId)?.name || "group";
      showToast({ type: "success", message: `${selectedIds.length} employee(s) assigned to "${groupName}" successfully.` });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to assign employees to group." });
    } finally {
      setAssigning(false);
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
        style={{ maxWidth: "500px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: C.textHeading, fontFamily: "'Cormorant Garamond', serif", display: "flex", alignItems: "center", gap: "10px" }}>
              <UserPlus size={22} color={C.red} /> Assign to Group
            </h2>
            <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "6px" }}>
              Assigning <strong style={{ color: C.textHeading }}>{selectedIds.length}</strong> employee{selectedIds.length !== 1 ? "s" : ""} to a group
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "8px", background: C.redActiveBg, border: `1px solid ${C.red}`, marginBottom: "20px" }}>
          <CheckSquare size={15} color={C.red} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: C.red }}>
            {selectedIds.length} employee{selectedIds.length !== 1 ? "s" : ""} selected
          </span>
        </div>

        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Search size={15} color={C.textHint} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchGroup}
            onChange={e => setSearchGroup(e.target.value)}
            style={{ width: "100%", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px 16px 10px 38px", color: C.textBody, fontSize: "14px", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
            onFocus={e => (e.target.style.borderColor = C.red)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
        </div>

        <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
          {loadingGroups ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: C.red }} />
              <span>Loading groups…</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.textMuted, fontSize: "14px" }}>
              {searchGroup ? "No groups match your search." : "No groups found."}
            </div>
          ) : (
            filteredGroups.map(group => {
              const isSelected = selectedGroupId === group.id;
              return (
                <div
                  key={group.id}
                  className={`group-item${isSelected ? " selected" : ""}`}
                  onClick={() => setSelectedGroupId(isSelected ? null : group.id)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "10px", cursor: "pointer", border: `1px solid ${isSelected ? C.red : C.border}`, background: isSelected ? C.redActiveBg : C.surface, transition: "all 0.2s" }}
                >
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, border: `2px solid ${isSelected ? C.red : C.borderHover}`, background: isSelected ? C.red : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    {isSelected && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0, background: isSelected ? C.red : C.inputBg, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    <Users size={16} color={isSelected ? "#fff" : C.textMuted} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: isSelected ? C.red : C.textHeading, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{group.name}</div>
                    {group.description && <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{group.description}</div>}
                    {group.member_count !== undefined && <div style={{ fontSize: "11px", color: C.textHint, marginTop: "2px" }}>{group.member_count} member{group.member_count !== 1 ? "s" : ""}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <motion.button
            whileHover={{ opacity: selectedGroupId ? 0.9 : 1 }}
            whileTap={selectedGroupId ? { scale: 0.98 } : {}}
            onClick={handleAssign}
            disabled={!selectedGroupId || assigning}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: selectedGroupId ? C.red : C.inputBg, border: "none", borderRadius: "8px", color: selectedGroupId ? "#fff" : C.textHint, fontSize: "14px", fontWeight: 600, cursor: selectedGroupId && !assigning ? "pointer" : "not-allowed", opacity: assigning ? 0.7 : 1, transition: "all 0.2s" }}>
            {assigning ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Assigning…</> : <><UserPlus size={16} /> Assign to Group</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── EDIT MODAL ─────────────────────────────────────────────── */
interface EditModalProps {
  employee: Employee;
  onClose: () => void;
  onSaved: (updated: Employee) => void;
  showToast: (t: Toast) => void;
}

function EditModal({ employee, onClose, onSaved, showToast }: EditModalProps) {
  const [form, setForm] = useState({
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    phone_number: employee.phone_number,
    gender: employee.gender,
    date_of_birth: employee.date_of_birth,
    city: employee.city,
    province: employee.province,
    postal_code: employee.postal_code,
    permit_status: employee.permit_status,
    shift_preference: employee.shift_preference,
    available_from: employee.available_from,
    license_required: employee.license_required,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/employees/${employee.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      onSaved({ ...employee, ...form });
      showToast({ type: "success", message: "Employee updated successfully." });
      onClose();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to update employee." });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px",
    padding: "10px 14px", color: C.textBody, fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" onClick={(e: React.MouseEvent) => e.stopPropagation()} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: C.textHeading, fontFamily: "'Cormorant Garamond', serif" }}>Edit Employee</h2>
            <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "4px" }}>{employee.first_name} {employee.last_name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px" }}><X size={20} /></button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" value={form.first_name} onChange={e => set("first_name", e.target.value)} style={inputStyle} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" value={form.last_name} onChange={e => set("last_name", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone_number} onChange={e => set("phone_number", e.target.value)} style={inputStyle} />
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select value={form.gender} onChange={e => set("gender", e.target.value)} style={inputStyle}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input className="form-input" type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} style={inputStyle} />
          </div>
          <div className="form-group">
            <label className="form-label">Available From</label>
            <input className="form-input" type="date" value={form.available_from} onChange={e => set("available_from", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={e => set("city", e.target.value)} style={inputStyle} />
          </div>
          <div className="form-group">
            <label className="form-label">Province</label>
            <input className="form-input" value={form.province} onChange={e => set("province", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Postal Code</label>
            <input className="form-input" value={form.postal_code} onChange={e => set("postal_code", e.target.value)} style={inputStyle} />
          </div>
          <div className="form-group">
            <label className="form-label">Permit Status</label>
            <select value={form.permit_status} onChange={e => set("permit_status", e.target.value)} style={inputStyle}>
              <option value="Study permit">Study permit</option>
              <option value="Open work permit">Open work permit</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Shift Preference</label>
            <select value={form.shift_preference} onChange={e => set("shift_preference", e.target.value)} style={inputStyle}>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">License Required</label>
            <select value={form.license_required ? "true" : "false"} onChange={e => set("license_required", e.target.value === "true")} style={inputStyle}>
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

/* ─── DELETE CONFIRM MODAL ───────────────────────────────────── */
interface DeleteModalProps {
  employee: Employee;
  onClose: () => void;
  onDeleted: (id: string) => void;
  showToast: (t: Toast) => void;
}

function DeleteModal({ employee, onClose, onDeleted, showToast }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/employees/${employee.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      onDeleted(employee.id);
      showToast({ type: "success", message: `${employee.first_name} ${employee.last_name} deleted.` });
      onClose();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to delete employee." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ maxWidth: "420px" }} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: C.alertBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <AlertTriangle size={28} color={C.red} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.textHeading, marginBottom: "8px" }}>Delete Employee</h2>
          <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.6 }}>
            Are you sure you want to delete <strong>{employee.first_name} {employee.last_name}</strong>? This action cannot be undone.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <motion.button
            whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}
            onClick={handleDelete} disabled={deleting}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: C.red, border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={16} />}
            {deleting ? "Deleting..." : "Delete"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── TOAST COMPONENT ────────────────────────────────────────── */
function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const colors = {
    success: { bg: C.successBg, color: C.successText, icon: <CheckCheck size={18} /> },
    error:   { bg: C.alertBg,   color: C.alertText,   icon: <AlertTriangle size={18} /> },
    info:    { bg: C.pendingBg, color: C.pendingText,  icon: <CheckCircle size={18} /> },
  }[toast.type];

  return (
    <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{ borderLeft: `4px solid ${colors.color}` }}>
      <span style={{ color: colors.color }}>{colors.icon}</span>
      <span style={{ color: C.textBody, flex: 1 }}>{toast.message}</span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "2px" }}><X size={16} /></button>
    </motion.div>
  );
}

/* ─── SELECT DROPDOWN WRAPPER ────────────────────────────────── */
function SelectFilter({
  label,
  value,
  onChange,
  children,
  loading = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.textLabel, marginBottom: "8px" }}>{label}</label>
      <div style={{ position: "relative" }}>
        {loading && (
          <Loader2
            size={14}
            color={C.textHint}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", animation: "spin 1s linear infinite", zIndex: 1 }}
          />
        )}
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={loading}
          style={{
            width: "100%",
            background: C.inputBg,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: `10px 36px 10px ${loading ? "34px" : "16px"}`,
            color: value && value !== "all" ? C.textBody : C.textHint,
            fontSize: "14px",
            outline: "none",
          }}
        >
          {children}
        </select>
        <ChevronDown size={14} color={C.textHint} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function EmployeesPage() {
  const router = useRouter();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("employees");

  // Full raw dataset — either every employee in the campaign, or, when a group
  // filter is active, that group's members fetched from /groups/{id}/members.
  // Every other filter is applied locally below (see filteredEmployees).
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [jobCategoryFilter, setJobCategoryFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  // Filter options from APIs
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [jobCategoriesLoading, setJobCategoriesLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chatSessionLoadingId, setChatSessionLoadingId] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [showAssignGroupModal, setShowAssignGroupModal] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback((t: Toast) => setToast(t), []);

  // The Group object currently selected in the filter dropdown — same pattern
  // as the Shortlisted page's `selectedGroup`, used to drive the heading,
  // subtext, and empty states below.
  const selectedGroup = useMemo(
    () => (groupFilter !== "all" ? groups.find(g => String(g.id) === String(groupFilter)) : undefined),
    [groups, groupFilter]
  );

  /* ── FETCH JOB CATEGORIES ── */
  useEffect(() => {
    setJobCategoriesLoading(true);
    fetch(`${BASE_URL}/job-categories`, { headers: authHeaders() })
      .then(r => r.json())
      .then(j => setJobCategories(j.data || []))
      .catch(() => showToast({ type: "error", message: "Failed to load job categories." }))
      .finally(() => setJobCategoriesLoading(false));
  }, []);

  /* ── FETCH GROUPS (for the filter dropdown) ── */
  useEffect(() => {
    setGroupsLoading(true);
    fetch(`${BASE_URL}/groups`, { headers: authHeaders() })
      .then(r => r.json())
      .then(j => setGroups(j.data || j.groups || j || []))
      .catch(() => showToast({ type: "error", message: "Failed to load groups." }))
      .finally(() => setGroupsLoading(false));
  }, []);

  /*
   * ── FETCH EMPLOYEES ──
   * Fetches the entire dataset in one shot (high limit, like the Excel export
   * already did) instead of paging server-side. Gender, verification status,
   * job category, province, city and search are all filtered locally below in
   * `filteredEmployees` — that no longer depends on the backend honoring those
   * query params correctly.
   *
   * The Group filter is the one exception: it can't be checked client-side
   * because membership isn't part of the employee record. `/employees?group_id=X`
   * turned out to be silently ignored by the backend, so instead — same as the
   * working Shortlisted page — we hit `/groups/{id}/members` directly, which
   * actually returns that group's members, and normalize each row into the
   * Employee shape this page already knows how to render.
   */
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      let rawData: Employee[] = [];

      if (groupFilter !== "all") {
        const res = await fetch(`${BASE_URL}/groups/${groupFilter}/members?limit=10000&offset=0`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        rawData = (json.data || json.members || []).map(mapGroupMemberToEmployee);
      } else {
        const params = new URLSearchParams();
        params.set("campaign_id", "1");
        params.set("limit", "10000");
        params.set("offset", "0");
        const res = await fetch(`${BASE_URL}/employees?${params.toString()}`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        rawData = json.data || [];
      }

      setEmployees(rawData);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to load employees." });
    } finally {
      setLoading(false);
    }
  }, [groupFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  /* ── CLIENT-SIDE FILTERING — this is what makes every filter reliable ── */
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const province = provinceFilter === "all" ? "" : provinceFilter.trim().toLowerCase();
    const city = cityFilter === "all" ? "" : cityFilter.trim().toLowerCase();

    return employees.filter(emp => {
      // Case-insensitive, trimmed comparison — fixes "Male" (UI) vs "male" (data) mismatches
      if (genderFilter !== "all" && (emp.gender || "").trim().toLowerCase() !== genderFilter.trim().toLowerCase()) {
        return false;
      }
      if (verificationFilter !== "all" && (emp.verification_status || "").toLowerCase() !== verificationFilter.toLowerCase()) {
        return false;
      }
      // String-normalized comparison — fixes number/string id mismatches (e.g. 3 vs "3")
      if (jobCategoryFilter !== "all" && String(emp.job_category_id) !== String(jobCategoryFilter)) {
        return false;
      }
      // Partial, case-insensitive match — so typing "surrey" matches "Surrey, BC"
      if (province && !(emp.province || "").toLowerCase().includes(province)) {
        return false;
      }
      if (city && !(emp.city || "").toLowerCase().includes(city)) {
        return false;
      }
      if (term) {
        const haystack = `${emp.first_name || ""} ${emp.last_name || ""} ${emp.email || ""} ${emp.phone_number || ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [employees, genderFilter, verificationFilter, jobCategoryFilter, provinceFilter, cityFilter, searchTerm]);

  /* Keep the current page valid whenever the filtered result set changes size */
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
    setCurrentPage(p => (p > totalPages ? totalPages : p));
  }, [filteredEmployees.length, pageSize]);

  const visibleEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  /* ── VERIFY ── */
  const verifyEmployee = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/employees/${id}/verify`, { method: "PATCH", headers: authHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, verification_status: "verified" } : e));
      showToast({ type: "success", message: "Employee verified successfully." });
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to verify employee." });
    }
  };

  /* ── BULK VERIFY ── */
  const bulkVerify = async () => {
    if (!selectedIds.length) return;
    const results = await Promise.allSettled(
      selectedIds.map(async (id) => {
        const res = await fetch(`${BASE_URL}/employees/${id}/verify`, { method: "PATCH", headers: authHeaders() });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return id;
      })
    );
    const succeededIds = results.filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled").map(r => r.value);
    const failedResults = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (succeededIds.length) setEmployees(prev => prev.map(e => succeededIds.includes(e.id) ? { ...e, verification_status: "verified" } : e));
    setSelectedIds(prev => prev.filter(id => !succeededIds.includes(id)));
    if (succeededIds.length && failedResults.length === 0) showToast({ type: "success", message: `${succeededIds.length} employee${succeededIds.length !== 1 ? "s" : ""} verified.` });
    else if (succeededIds.length && failedResults.length) showToast({ type: "info", message: `${succeededIds.length} verified, ${failedResults.length} failed.` });
    else showToast({ type: "error", message: (failedResults[0]?.reason as Error)?.message || "Bulk verify failed." });
  };

  /* ── BULK DELETE ── */
  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    const results = await Promise.allSettled(
      selectedIds.map(async (id) => {
        const res = await fetch(`${BASE_URL}/employees/${id}`, { method: "DELETE", headers: authHeaders() });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return id;
      })
    );
    const succeededIds = results.filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled").map(r => r.value);
    const failedResults = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (succeededIds.length) setEmployees(prev => prev.filter(e => !succeededIds.includes(e.id)));
    setSelectedIds(prev => prev.filter(id => !succeededIds.includes(id)));
    if (succeededIds.length && failedResults.length === 0) showToast({ type: "success", message: `${succeededIds.length} employee${succeededIds.length !== 1 ? "s" : ""} deleted.` });
    else if (succeededIds.length && failedResults.length) showToast({ type: "info", message: `${succeededIds.length} deleted, ${failedResults.length} failed.` });
    else showToast({ type: "error", message: (failedResults[0]?.reason as Error)?.message || "Bulk delete failed." });
  };

  /* ── CHAT SESSION ── */
  const openEmployeeChat = async (emp: Employee) => {
    if (chatSessionLoadingId) return;
    setChatSessionLoadingId(emp.id);
    try {
      let sessionId = null;
      try {
        const getRes = await fetch(
          `${BASE_URL}/chat/sessions/employee/${emp.id}?mobile_number=${encodeURIComponent(emp.phone_number)}`,
          { method: "GET", headers: authHeaders() }
        );
        if (getRes.ok) {
          const getJson = await getRes.json();
          if (getJson?.data?.id) sessionId = getJson.data.id;
        }
      } catch {}

      if (!sessionId) {
        const postRes = await fetch(`${BASE_URL}/chat/sessions/start`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            employee_id: emp.id,
            mobile_number: emp.phone_number,
            campaign_id: emp.campaign_id,
            job_category_id: parseInt(emp.job_category_id, 10),
          }),
        });
        if (!postRes.ok) {
          let serverMessage = "";
          try { const e = await postRes.json(); serverMessage = e?.message || e?.error || ""; } catch {}
          throw new Error(serverMessage || `Request failed with status ${postRes.status}`);
        }
        const postJson = await postRes.json();
        sessionId = postJson?.data?.id;
        if (!sessionId) throw new Error("Chat session response did not include a session id.");
      }

      const params = new URLSearchParams({
        name: `${emp.first_name} ${emp.last_name}`.trim(),
        phone: emp.phone_number || "",
        sessionId: sessionId,
        campaignId: String(emp.campaign_id ?? ""),
        jobCategoryId: emp.job_category_id || "",
      });
      router.push(`/chat/${emp.id}?${params.toString()}`);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to start or retrieve chat session." });
    } finally {
      setChatSessionLoadingId(null);
    }
  };

  const handleDeleted = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const handleSaved = (updated: Employee) => setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
  const handleAssignGroupSuccess = () => setSelectedIds([]);

  /* ── EXCEL — now exports whatever the active filters currently match ── */
  const downloadExcel = () => {
    if (!filteredEmployees.length) {
      showToast({ type: "info", message: "No employees match the current filters." });
      return;
    }
    try {
      const rows = filteredEmployees.map(e => ({
        "First Name": e.first_name, "Last Name": e.last_name, "Email": e.email,
        "Phone": e.phone_number, "Gender": e.gender, "DOB": e.date_of_birth,
        "City": e.city, "Province": e.province, "Postal Code": e.postal_code,
        "Job Category": e.job_categories?.name || "", "Job Industry": e.job_industries?.name || "",
        "Campaign": e.campaigns?.name || "", "Verification Status": e.verification_status,
        "Available From": e.available_from, "Permit Status": e.permit_status,
        "Shift Preference": e.shift_preference, "License Required": e.license_required ? "Yes" : "No",
        "Registered At": formatDate(e.created_at),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      const sheetName = selectedGroup ? selectedGroup.name.slice(0, 31) : "Employees";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      ws["!cols"] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length + 2, 16) }));
      const fileLabel = selectedGroup ? selectedGroup.name.replace(/\s+/g, "_") : "Employees";
      XLSX.writeFile(wb, `JBR_${fileLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast({ type: "success", message: `Exported ${rows.length} employees to Excel.` });
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Excel export failed." });
    }
  };

  /* ── SELECTION (scoped to the currently visible page) ── */
  const toggleRow = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => {
    const visibleIds = visibleEmployees.map(e => e.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev => allVisibleSelected
      ? prev.filter(id => !visibleIds.includes(id))
      : Array.from(new Set([...prev, ...visibleIds]))
    );
  };

  /* ── PAGINATION (derived from the filtered set) ── */
  const totalFiltered = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startIndex = totalFiltered > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, totalFiltered);

  const tableGridTemplate = "40px 1.3fr 1.8fr 1.2fr 0.8fr 1.2fr 1.2fr 0.9fr 1fr 1.6fr 120px";

  const resetFilters = () => {
    setSearchTerm("");
    setVerificationFilter("all");
    setJobCategoryFilter("all");
    setGenderFilter("all");
    setGroupFilter("all");
    setProvinceFilter("all");
    setCityFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || verificationFilter !== "all" || jobCategoryFilter !== "all" ||
    genderFilter !== "all" || groupFilter !== "all" || provinceFilter !== "all" || cityFilter !== "all";

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} activeTab={activeTab} setActiveTab={setActiveTab} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", position: "relative" }}>
          <TopNav />

          <main style={{ padding: "40px", maxWidth: "1700px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: 600, color: C.textHeading, marginBottom: "8px", letterSpacing: "-0.5px" }}>
                <Users size={32} color={C.red} strokeWidth={2} /> {selectedGroup ? selectedGroup.name : "Employee Management"}
              </h1>
              <p style={{ fontSize: "15px", color: C.textMuted }}>
                {selectedGroup
                  ? `Viewing members of "${selectedGroup.name}". Clear the group filter to see all employees.`
                  : "View and manage registered candidates and their information."}
              </p>
            </motion.div>

            {/* ── FILTERS ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="clean-card" style={{ padding: "24px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, marginBottom: "4px" }}>Filters</h3>
                  <p style={{ fontSize: "13px", color: C.textMuted }}>Filter candidates by various criteria</p>
                </div>
                {hasActiveFilters && (
                  <motion.button
                    whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
                    whileTap={{ scale: 0.97 }}
                    onClick={resetFilters}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textMuted, fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                  >
                    <X size={13} /> Clear Filters
                  </motion.button>
                )}
              </div>

              {/* Row 1: Search + Verification Status + Gender */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "20px" }}>

                {/* Search */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.textLabel, marginBottom: "8px" }}>Search</label>
                  <div style={{ position: "relative" }}>
                    <Search size={16} color={C.textHint} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                    <input type="text" placeholder="Name, email, or phone" value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      style={{ width: "100%", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px 16px 10px 40px", color: C.textBody, fontSize: "14px", outline: "none" }}
                      onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                </div>

                {/* Verification Status */}
                <SelectFilter label="Verification Status" value={verificationFilter} onChange={v => { setVerificationFilter(v); setCurrentPage(1); }}>
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </SelectFilter>

                {/* Gender */}
                <SelectFilter label="Gender" value={genderFilter} onChange={v => { setGenderFilter(v); setCurrentPage(1); }}>
                  <option value="all">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </SelectFilter>

                {/* Job Category */}
                <SelectFilter label="Job Category" value={jobCategoryFilter} onChange={v => { setJobCategoryFilter(v); setCurrentPage(1); }} loading={jobCategoriesLoading}>
                  <option value="all">All Categories</option>
                  {jobCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </SelectFilter>

              </div>

              {/* Row 2: Group + Province + City */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>

                {/* Group */}
                <SelectFilter label="Group" value={groupFilter} onChange={v => { setGroupFilter(v); setCurrentPage(1); }} loading={groupsLoading}>
                  <option value="all">All Groups</option>
                  {groups.map(g => (
                    <option key={g.id} value={String(g.id)}>
                      {g.name}{g.member_count !== undefined ? ` (${g.member_count})` : ""}
                    </option>
                  ))}
                </SelectFilter>

                {/* Province */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.textLabel, marginBottom: "8px" }}>Province</label>
                  <input type="text" placeholder="e.g. British Columbia" value={provinceFilter === "all" ? "" : provinceFilter}
                    onChange={e => { setProvinceFilter(e.target.value || "all"); setCurrentPage(1); }}
                    style={{ width: "100%", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px 16px", color: C.textBody, fontSize: "14px", outline: "none" }}
                    onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                </div>

                {/* City */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.textLabel, marginBottom: "8px" }}>City</label>
                  <input type="text" placeholder="e.g. Surrey" value={cityFilter === "all" ? "" : cityFilter}
                    onChange={e => { setCityFilter(e.target.value || "all"); setCurrentPage(1); }}
                    style={{ width: "100%", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px 16px", color: C.textBody, fontSize: "14px", outline: "none" }}
                    onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                </div>

              </div>
            </motion.div>

            {/* Table Card */}
            <motion.div variants={containerVars} initial="hidden" animate="show" className="clean-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Controls Row */}
              <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading, display: "flex", alignItems: "center", gap: "8px" }}>
                      {selectedGroup ? selectedGroup.name : "Employees"} <span style={{ color: C.redBright }}>({totalFiltered})</span>
                    </h3>
                    <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "4px" }}>
                      {loading
                        ? "Loading…"
                        : totalFiltered === 0 && selectedGroup
                        ? `No members in "${selectedGroup.name}" match the current filters`
                        : `Showing ${startIndex}–${endIndex} of ${totalFiltered}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: C.textLabel, fontWeight: 500 }}>Rows per page:</span>
                    <div style={{ position: "relative" }}>
                      <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "8px 28px 8px 12px", color: C.textBody, fontSize: "13px", outline: "none" }}>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <ChevronDown size={14} color={C.textHint} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                  </div>
                </div>

                {/* Bulk Actions */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  <motion.button whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }} whileTap={{ scale: 0.98 }}
                    onClick={downloadExcel}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                    <FileSpreadsheet size={16} /> Download Excel ({totalFiltered})
                  </motion.button>

                  <motion.button disabled={!selectedIds.length}
                    whileHover={selectedIds.length ? { backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red } : {}}
                    onClick={bulkVerify}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: selectedIds.length ? C.textHeading : C.textHint, fontSize: "13px", fontWeight: 600, cursor: selectedIds.length ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                    <CheckCircle size={16} /> Bulk Verify ({selectedIds.length})
                  </motion.button>

                  <motion.button disabled={!selectedIds.length}
                    whileHover={selectedIds.length ? { backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red } : {}}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: selectedIds.length ? C.textHeading : C.textHint, fontSize: "13px", fontWeight: 600, cursor: selectedIds.length ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                    <MessageCircle size={16} /> Send WhatsApp ({selectedIds.length})
                  </motion.button>

                  <motion.button
                    disabled={!selectedIds.length}
                    whileHover={selectedIds.length ? { backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red } : {}}
                    whileTap={selectedIds.length ? { scale: 0.98 } : {}}
                    onClick={() => selectedIds.length > 0 && setShowAssignGroupModal(true)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: selectedIds.length ? C.textHeading : C.textHint, fontSize: "13px", fontWeight: 600, cursor: selectedIds.length ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                    <UserPlus size={16} /> Assign to Group ({selectedIds.length})
                  </motion.button>

                  <motion.button disabled={!selectedIds.length}
                    whileHover={selectedIds.length ? { backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red } : {}}
                    onClick={bulkDelete}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: selectedIds.length ? C.textHeading : C.textHint, fontSize: "13px", fontWeight: 600, cursor: selectedIds.length ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                    <Trash2 size={16} /> Bulk Delete ({selectedIds.length})
                  </motion.button>
                </div>
              </div>

              {/* Table */}
              <div className="table-container">
                <div className="table-min-width">

                  {/* Column Headers */}
                  <div style={{ display: "grid", gridTemplateColumns: tableGridTemplate, padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: C.inputBg, alignItems: "center" }}>
                    <button onClick={toggleAll} style={{ background: "none", border: "none", color: C.textHint, cursor: "pointer", padding: 0, display: "flex" }}>
                      {visibleEmployees.length > 0 && visibleEmployees.every(e => selectedIds.includes(e.id)) ? <CheckSquare size={16} color={C.red} /> : <Square size={16} />}
                    </button>
                    {["Name", "Email", "Phone", "Gender", "Job Category", "Location", "Status", "Registered", "Documents", "Actions"].map((h, i) => (
                      <span key={i} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: C.textHint, fontWeight: 600 }}>{h}</span>
                    ))}
                  </div>

                  {/* Rows */}
                  {loading ? (
                    <div style={{ padding: "60px", textAlign: "center", color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                      <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: C.red }} />
                      <span>{selectedGroup ? `Loading "${selectedGroup.name}" members…` : "Loading employees…"}</span>
                    </div>
                  ) : visibleEmployees.length === 0 ? (
                    <div style={{ padding: "60px", textAlign: "center", color: C.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <Users size={36} color={C.textHint} strokeWidth={1.5} />
                      {selectedGroup
                        ? hasActiveFilters
                          ? `No members in "${selectedGroup.name}" match the selected filters.`
                          : `"${selectedGroup.name}" has no members yet.`
                        : hasActiveFilters
                        ? "No employees match the selected filters."
                        : "No employees found."}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {visibleEmployees.map((emp, idx) => {
                        const isSelected = selectedIds.includes(emp.id);
                        const badge = getVerificationBadge(emp.verification_status);
                        const isChatLoading = chatSessionLoadingId === emp.id;
                        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
                        return (
                          <motion.div key={emp.id} variants={itemVars}
                            whileHover={{ backgroundColor: C.inputBg }}
                            style={{ display: "grid", gridTemplateColumns: tableGridTemplate, alignItems: "center", padding: "16px 32px", borderBottom: idx !== visibleEmployees.length - 1 ? `1px solid ${C.border}` : "none", background: isSelected ? C.redActiveBg : "transparent", transition: "background-color 0.2s" }}>

                            <button onClick={() => toggleRow(emp.id)} style={{ background: "none", border: "none", color: isSelected ? C.red : C.textHint, cursor: "pointer", padding: 0, display: "flex" }}>
                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>

                            <div style={{ fontSize: "14px", fontWeight: 600, color: C.textHeading, lineHeight: 1.4 }}>
                              {fullName ? (
                                <>
                                  <div>{emp.first_name}</div>
                                  <div>{emp.last_name}</div>
                                </>
                              ) : (
                                <span style={{ color: C.textHint, fontWeight: 500 }}>—</span>
                              )}
                            </div>

                            <div style={{ fontSize: "13px", color: C.textMuted, wordBreak: "break-all", paddingRight: "16px" }}>{emp.email || "—"}</div>
                            <div style={{ fontSize: "13px", color: C.textMuted }}>{emp.phone_number || "—"}</div>
                            <div style={{ fontSize: "13px", color: C.textMuted }}>{emp.gender || "—"}</div>
                            <div style={{ fontSize: "14px", color: C.textBody, fontWeight: 500 }}>{emp.job_categories?.name || "—"}</div>

                            <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.4 }}>
                              <div>{emp.city || "—"}{emp.city && emp.province ? "," : ""}</div>
                              <div>{emp.province}</div>
                            </div>

                            <div>
                              <div style={{ display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: "20px", background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {badge.label}
                              </div>
                            </div>

                            <div style={{ fontSize: "13px", color: C.textMuted, display: "flex", alignItems: "center", gap: "6px" }}>
                              <Calendar size={14} /> {formatDate(emp.created_at)}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {emp.resume_url && (
                                <a href={emp.resume_url} target="_blank" rel="noreferrer">
                                  <motion.button whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
                                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textLabel, fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                                    <Download size={14} /> Resume
                                  </motion.button>
                                </a>
                              )}
                              {emp.license_required && (
                                <motion.button whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
                                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textLabel, fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                                  <Download size={14} /> License
                                </motion.button>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <motion.button
                                whileHover={!isChatLoading ? { scale: 1.1, backgroundColor: "rgba(59,130,246,0.08)", color: "#3B82F6", borderColor: "#3B82F6" } : {}}
                                whileTap={!isChatLoading ? { scale: 0.9 } : {}}
                                onClick={() => openEmployeeChat(emp)}
                                disabled={isChatLoading}
                                title="Open Chat"
                                style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textHint, cursor: isChatLoading ? "not-allowed" : "pointer", padding: "8px", display: "flex", opacity: isChatLoading ? 0.6 : 1, transition: "all 0.2s" }}>
                                {isChatLoading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <MessageSquare size={15} />}
                              </motion.button>

                              {emp.verification_status !== "verified" && (
                                <motion.button
                                  whileHover={{ scale: 1.1, backgroundColor: C.successBg, color: C.successText, borderColor: C.successText }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => verifyEmployee(emp.id)}
                                  title="Verify"
                                  style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textHint, cursor: "pointer", padding: "8px", display: "flex", transition: "all 0.2s" }}>
                                  <CheckCheck size={15} />
                                </motion.button>
                              )}

                              <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: C.redActiveBg, color: C.red, borderColor: C.red }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setEditTarget(emp)}
                                title="Edit"
                                style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textHint, cursor: "pointer", padding: "8px", display: "flex", transition: "all 0.2s" }}>
                                <Edit2 size={15} />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: C.redActiveBg, color: C.redBright, borderColor: C.redBright }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setDeleteTarget(emp)}
                                title="Delete"
                                style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textHint, cursor: "pointer", padding: "8px", display: "flex", transition: "all 0.2s" }}>
                                <Trash2 size={15} />
                              </motion.button>
                            </div>

                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination Footer */}
              <div style={{ padding: "16px 32px", borderTop: `1px solid ${C.border}`, background: C.inputBg, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <span style={{ fontSize: "13px", color: C.textMuted }}>
                  Showing <strong style={{ color: C.textHeading }}>{startIndex}</strong> to <strong style={{ color: C.textHeading }}>{endIndex}</strong> of {totalFiltered} results
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 12px", background: "transparent", border: "none", color: currentPage === 1 ? C.textHint : C.textLabel, fontSize: "13px", fontWeight: 500, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>
                    <ChevronLeft size={16} /> Previous
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: currentPage === page ? C.red : C.surface, border: `1px solid ${currentPage === page ? C.red : C.border}`, borderRadius: "6px", color: currentPage === page ? "#fff" : C.textHeading, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                        {page}
                      </button>
                    );
                  })}

                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 12px", background: "transparent", border: "none", color: currentPage >= totalPages ? C.textHint : C.textLabel, fontSize: "13px", fontWeight: 500, cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>

            </motion.div>
          </main>
        </div>
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {editTarget && <EditModal employee={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} showToast={showToast} />}
        {deleteTarget && <DeleteModal employee={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} showToast={showToast} />}
        {showAssignGroupModal && (
          <AssignGroupModal selectedIds={selectedIds} onClose={() => setShowAssignGroupModal(false)} showToast={showToast} onSuccess={handleAssignGroupSuccess} />
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && <ToastNotification toast={toast} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}



