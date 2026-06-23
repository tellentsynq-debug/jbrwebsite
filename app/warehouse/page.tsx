"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, cubicBezier, type Variants } from "framer-motion";
import {
  LogOut, Plus, Search, Edit2, X, Trash2, AlertTriangle,
  Warehouse, MapPin, User, Building2, Check, RefreshCw
} from "lucide-react";
import Sidebar from "../components/Sidebar";



/* ─── DESIGN TOKENS (matches CampaignsPage) ─────────────────── */
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
`;

/* ─── TYPES ──────────────────────────────────────────────────── */
interface WarehouseEntry {
  id: number;
  customerName: string;
  warehouseName: string;
  address: string;
  supervisor: string;
}

/* ─── STATIC DATA ────────────────────────────────────────────── */
const INITIAL_WAREHOUSES: WarehouseEntry[] = [
  { id: 1,  customerName: "18 Wheels",          warehouseName: "Co Packing Burnaby",  address: "7185 11th Avenue, Burnaby, BC",                         supervisor: "Karan (Morning)"         },
  { id: 2,  customerName: "18 Wheels",          warehouseName: "Co Packing Burnaby",  address: "7185 11th Avenue, Burnaby, BC",                         supervisor: "Rafi Syed (Evening)"     },
  { id: 3,  customerName: "18 Wheels",          warehouseName: "Aldergrove",           address: "3254 262 St, Aldergrove",                               supervisor: "Hameed"                  },
  { id: 4,  customerName: "18 Wheels",          warehouseName: "Burnaby Building A",   address: "7185 11th Avenue, Burnaby, BC Building A East",          supervisor: "Amanpreet"               },
  { id: 5,  customerName: "18 Wheels",          warehouseName: "Meadow",               address: "8335 Meadow Avenue, Burnaby, BC",                        supervisor: "Kate"                    },
  { id: 6,  customerName: "Aerostream",         warehouseName: "Aerostream",           address: "18391 Mc Cartney, Richmond",                            supervisor: "Puneet & TL Amninder"    },
  { id: 7,  customerName: "Aerostream",         warehouseName: "Aerostream",           address: "4871 Miller Rd, Richmond, BC",                          supervisor: "Puneet"                  },
  { id: 8,  customerName: "Avlon Dairy",        warehouseName: "Avlon",                address: "7985 N Fraser Wy, Burnaby, BC V5J 0A4",                  supervisor: "Rylee"                   },
  { id: 9,  customerName: "Catalys Lubricants", warehouseName: "Catalys",              address: "7483 Progress Wy, Delta, BC V4G 1E7",                   supervisor: "Satwinder / Steven Curry"},
  { id: 10, customerName: "Fresh Direct Produce",warehouseName: "Fresh Direct",        address: "888 Malkin Ave, Vancouver, BC V6A 2K6",                  supervisor: "Gracie / Ivy Leong"      },
];

let nextId = 11;

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};
const itemVars = {
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

/* ─── FORM FIELD ─────────────────────────────────────────────── */
function FormField({
  label, placeholder, value, onChange, icon
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon?: React.ReactNode;
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
          type="text"
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

/* ─── TOAST ──────────────────────────────────────────────────── */
function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const bg = type === "success" ? "#059669" : C.red;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      style={{
        position: "fixed", bottom: "32px", right: "32px", zIndex: 300,
        background: bg, color: C.white, padding: "14px 20px", borderRadius: "12px",
        fontSize: "14px", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        display: "flex", alignItems: "center", gap: "10px"
      }}
    >
      {type === "success" ? <Check size={18} /> : <X size={18} />}
      {message}
    </motion.div>
  );
}

/* ─── DELETE MODAL ───────────────────────────────────────────── */
function DeleteModal({
  entry, onConfirm, onCancel
}: {
  entry: WarehouseEntry | null; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {entry && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
            onClick={onCancel}
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
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.textHeading, marginBottom: "10px" }}>Delete Warehouse?</h2>
            <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "28px", lineHeight: 1.6 }}>
              You are about to permanently delete <strong style={{ color: C.textBody }}>{entry.warehouseName}</strong> for <strong style={{ color: C.textBody }}>{entry.customerName}</strong>. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <motion.button
                onClick={onCancel}
                whileHover={{ backgroundColor: C.inputBg }}
                style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: C.textLabel, cursor: "pointer", transition: "all 0.2s" }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onConfirm}
                whileHover={{ boxShadow: `0 6px 20px ${C.redGlow}` }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, padding: "12px",
                  background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                  border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600,
                  color: C.white, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                }}
              >
                <Trash2 size={16} /> Delete
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── ADD / EDIT MODAL ───────────────────────────────────────── */
function WarehouseModal({
  entry, onClose, onSaved, mode
}: {
  entry: WarehouseEntry | null;
  onClose: () => void;
  onSaved: (data: WarehouseEntry) => void;
  mode: "add" | "edit";
}) {
  const [customerName,   setCustomerName]   = useState(entry?.customerName   ?? "");
  const [warehouseName,  setWarehouseName]  = useState(entry?.warehouseName  ?? "");
  const [address,        setAddress]        = useState(entry?.address        ?? "");
  const [supervisor,     setSupervisor]     = useState(entry?.supervisor     ?? "");
  const [isSuccess,      setIsSuccess]      = useState(false);
  const [errorMsg,       setErrorMsg]       = useState("");

  const isOpen = mode === "add" ? true : entry !== null;

  const handleSave = () => {
    if (!customerName || !warehouseName || !address || !supervisor) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    setErrorMsg("");
    setIsSuccess(true);
    const saved: WarehouseEntry = {
      id:            entry?.id ?? nextId++,
      customerName,
      warehouseName,
      address,
      supervisor,
    };
    setTimeout(() => {
      onSaved(saved);
      onClose();
    }, 900);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}
            onClick={() => { if (!isSuccess) onClose(); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            style={{
              position: "relative", width: "100%", maxWidth: "580px", margin: "24px",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)"
            }}
          >
            {/* Close */}
            <button
              onClick={() => { if (!isSuccess) onClose(); }}
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
                  <Warehouse size={20} color={C.red} />
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 600, color: C.textHeading }}>
                  {mode === "add" ? "Add Warehouse" : "Edit Warehouse"}
                </h2>
              </div>
              <p style={{ fontSize: "14px", color: C.textMuted, paddingLeft: "52px" }}>
                {mode === "add" ? "Fill in the details for the new warehouse location." : "Update the warehouse information below."}
              </p>
            </div>

            {/* Fields */}
            <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <FormField
                  label="Customer Name" placeholder="e.g. 18 Wheels"
                  value={customerName} onChange={setCustomerName}
                  icon={<User size={15} />}
                />
                <FormField
                  label="Warehouse Name" placeholder="e.g. Co Packing Burnaby"
                  value={warehouseName} onChange={setWarehouseName}
                  icon={<Building2 size={15} />}
                />
              </div>
              <FormField
                label="Warehouse Address" placeholder="Full address including city and province"
                value={address} onChange={setAddress}
                icon={<MapPin size={15} />}
              />
              <FormField
                label="Supervisor / Manager" placeholder="e.g. John Smith (Morning)"
                value={supervisor} onChange={setSupervisor}
                icon={<User size={15} />}
              />

              {errorMsg && (
                <div style={{ color: C.red, fontSize: "13px", fontWeight: 500 }}>{errorMsg}</div>
              )}

              <motion.button
                disabled={isSuccess}
                onClick={handleSave}
                whileHover={isSuccess ? {} : { y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }}
                whileTap={isSuccess ? {} : { scale: 0.98 }}
                style={{
                  width: "100%", padding: "14px", marginTop: "4px",
                  background: isSuccess ? "#059669" : `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                  border: "none", borderRadius: "10px",
                  display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                  color: C.white, fontSize: "15px", fontWeight: 600, letterSpacing: "0.5px",
                  cursor: isSuccess ? "default" : "pointer",
                  transition: "background 0.3s ease"
                }}
              >
                {isSuccess
                  ? <><Check size={18} strokeWidth={2.5} /><span>{mode === "add" ? "Warehouse Added!" : "Saved!"}</span></>
                  : <span>{mode === "add" ? "Add Warehouse" : "Save Changes"}</span>
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
        <Warehouse size={28} color={C.textHint} />
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading }}>No Warehouses Yet</h3>
      <p style={{ fontSize: "14px", color: C.textMuted, maxWidth: "300px", lineHeight: 1.6 }}>
        No warehouse locations found. Add your first one to get started.
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
        <Plus size={18} /> Add First Warehouse
      </motion.button>
    </motion.div>
  );
}

/* ─── CUSTOMER TAG ───────────────────────────────────────────── */
const CUSTOMER_COLORS: Record<string, { bg: string; text: string }> = {
  "18 Wheels":           { bg: "rgba(59,130,246,0.09)",  text: "#2563EB" },
  "Aerostream":          { bg: "rgba(139,92,246,0.09)",  text: "#7C3AED" },
  "Avlon Dairy":         { bg: "rgba(236,72,153,0.09)",  text: "#BE185D" },
  "Catalys Lubricants":  { bg: "rgba(245,158,11,0.09)",  text: "#B45309" },
  "Fresh Direct Produce":{ bg: "rgba(16,185,129,0.09)",  text: "#047857" },
};

function CustomerTag({ name }: { name: string }) {
  const style = CUSTOMER_COLORS[name] ?? { bg: C.inactiveBg, text: C.inactiveText };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: "20px",
      background: style.bg, color: style.text, fontSize: "11px", fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap"
    }}>
      {name}
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<WarehouseEntry[]>(INITIAL_WAREHOUSES);
  const [search, setSearch]         = useState("");
  const [isAddOpen, setAddOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<WarehouseEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("warehouses");

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const filtered = warehouses.filter((w) =>
    w.customerName.toLowerCase().includes(search.toLowerCase()) ||
    w.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
    w.supervisor.toLowerCase().includes(search.toLowerCase()) ||
    w.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdded = (entry: WarehouseEntry) => {
    setWarehouses((prev) => [entry, ...prev]);
    showToast("Warehouse added successfully!");
  };

  const handleUpdated = (entry: WarehouseEntry) => {
    setWarehouses((prev) => prev.map((w) => w.id === entry.id ? entry : w));
    setEditTarget(null);
    showToast("Warehouse updated successfully.");
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setWarehouses((prev) => prev.filter((w) => w.id !== deleteTarget.id));
    showToast("Warehouse deleted.");
    setDeleteTarget(null);
  };

  const tableGridTemplate = "1.6fr 1.4fr 2fr 1.4fr 0.7fr";

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

          {/* ── Top Nav ── */}
          <motion.header
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0, 0.55, 0.45, 1] }}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 40px", borderBottom: `1px solid ${C.border}`,
              background: C.surface, position: "sticky", top: 0, zIndex: 10
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Warehouse size={18} color={C.red} />
              <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHeading, fontWeight: 600 }}>
                Warehouse Management
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <span style={{ fontSize: "13px", color: C.textMuted }}>
                Welcome, <span style={{ color: C.textHeading, fontWeight: 500 }}>Admin</span>
              </span>
              <motion.button
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
                  Warehouses
                </h1>
                <p style={{ fontSize: "15px", color: C.textMuted }}>
                  Manage warehouse locations, assignments, and supervisors
                  <span style={{ marginLeft: "8px", fontSize: "13px", color: C.textHint }}>
                    ({warehouses.length} total)
                  </span>
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <motion.button
                  whileHover={{ backgroundColor: C.inputBg }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
                    background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px",
                    color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <RefreshCw size={15} /> Refresh
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
                  <Plus size={18} /> Add Warehouse
                </motion.button>
              </div>
            </motion.div>

            {/* ── Summary Cards ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}
            >
              {[
                { label: "Total Warehouses", value: warehouses.length, icon: <Warehouse size={20} color={C.red} /> },
                { label: "Unique Customers", value: new Set(warehouses.map(w => w.customerName)).size, icon: <User size={20} color="#3B82F6" /> },
                { label: "Locations", value: new Set(warehouses.map(w => w.address)).size, icon: <MapPin size={20} color="#8B5CF6" /> },
                { label: "Supervisors", value: new Set(warehouses.map(w => w.supervisor)).size, icon: <Building2 size={20} color="#10B981" /> },
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
                <h3 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading }}>Warehouse Directory</h3>
                <div style={{ position: "relative" }}>
                  <Search size={16} color={C.textHint} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text" placeholder="Search by customer, name, supervisor…"
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

              {filtered.length === 0 ? (
                search
                  ? <div style={{ padding: "60px", textAlign: "center", color: C.textMuted }}>No warehouses match "{search}".</div>
                  : <EmptyState onAddClick={() => setAddOpen(true)} />
              ) : (
                <div className="table-container">
                  <div className="table-min-width">

                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: tableGridTemplate, padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: C.inputBg }}>
                      {["Customer", "Warehouse", "Address", "Supervisor / Manager", "Actions"].map((h, i) => (
                        <span key={i} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: C.textHint, fontWeight: 600 }}>
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* Rows */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {filtered.map((w, idx) => (
                        <motion.div
                          key={w.id} variants={itemVars}
                          whileHover={{ backgroundColor: C.inputBg }}
                          style={{
                            display: "grid", gridTemplateColumns: tableGridTemplate,
                            alignItems: "center", padding: "20px 32px",
                            borderBottom: idx !== filtered.length - 1 ? `1px solid ${C.border}` : "none",
                            transition: "background-color 0.2s ease"
                          }}
                        >
                          {/* Customer */}
                          <div>
                            <CustomerTag name={w.customerName} />
                          </div>

                          {/* Warehouse Name */}
                          <div>
                            <div style={{ fontSize: "15px", fontWeight: 600, color: C.textHeading }}>{w.warehouseName}</div>
                            <div style={{ fontSize: "11px", color: C.textHint, marginTop: "2px" }}>ID #{w.id}</div>
                          </div>

                          {/* Address */}
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                            <MapPin size={13} color={C.textHint} style={{ marginTop: "2px", flexShrink: 0 }} />
                            <span style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.4 }}>{w.address}</span>
                          </div>

                          {/* Supervisor */}
                          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <User size={13} color={C.textHint} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: "13px", color: C.textBody, fontWeight: 500 }}>{w.supervisor}</span>
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <motion.button
                              onClick={() => setEditTarget(w)}
                              whileHover={{ scale: 1.1, color: C.red }}
                              whileTap={{ scale: 0.9 }}
                              title="Edit warehouse"
                              style={{ background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "7px", borderRadius: "6px", transition: "color 0.2s" }}
                            >
                              <Edit2 size={17} />
                            </motion.button>
                            <motion.button
                              onClick={() => setDeleteTarget(w)}
                              whileHover={{ scale: 1.1, color: C.redBright }}
                              whileTap={{ scale: 0.9 }}
                              title="Delete warehouse"
                              style={{ background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "7px", borderRadius: "6px", transition: "color 0.2s" }}
                            >
                              <Trash2 size={17} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
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
        <WarehouseModal
          mode="add" entry={null}
          onClose={() => setAddOpen(false)}
          onSaved={handleAdded}
        />
      )}
      {editTarget && (
        <WarehouseModal
          mode="edit" entry={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleUpdated}
        />
      )}
      <DeleteModal
        entry={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}



