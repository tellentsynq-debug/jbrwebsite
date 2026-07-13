"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Plus, Search, Edit2, X, Trash2, AlertTriangle,
  Warehouse, MapPin, User, Building2, Check, RefreshCw, Eye, EyeOff,
  FileText, Upload, Paperclip
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
  id: string;
  customer_name: string;
  warehouse_name: string;
  warehouse_address: string;
  supervisor_manager: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // These may come back as a single URL, or an array of URLs, depending on
  // how many files were uploaded. We normalize everything to string[] in the UI.
  privacy_policy_url?: string | string[] | null;
  privacy_policy_storage_path?: string | string[] | null;
  terms_and_conditions_url?: string | string[] | null;
  terms_and_conditions_storage_path?: string | string[] | null;
}

/* ─── HELPERS ────────────────────────────────────────────────── */
function getToken(): string | null {
  return localStorage.getItem("jbr_token");
}

// includeContentType is only relevant for JSON requests.
// For multipart/form-data requests, DO NOT set Content-Type manually —
// the browser needs to set it (with the correct boundary) itself.
function authHeaders(includeContentType = false): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (includeContentType) headers["Content-Type"] = "application/json";
  return headers;
}

// Normalize a URL field that might be a single string, an array, or null/undefined
// into a clean string[] for rendering.
function toUrlArray(value?: string | string[] | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value];
}

const BASE_URL = "https://jbrstaffingsolutions.com/api/warehouses";

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVars = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 22 } },
};

/* ─── SPINNER ────────────────────────────────────────────────── */
function Spinner({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
      style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

/* ─── FORM FIELD ─────────────────────────────────────────────── */
function FormField({
  label, placeholder, value, onChange, icon,
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
          <div style={{
            position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
            color: focused ? C.red : C.textHint, transition: "color 0.2s", pointerEvents: "none",
          }}>
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
            background: C.inputBg, border: `1px solid ${focused ? C.red : C.border}`,
            borderRadius: "8px", color: C.textBody, fontSize: "14px",
            outline: "none", transition: "all 0.2s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ─── MULTI FILE FIELD ───────────────────────────────────────── */
// Supports selecting multiple files for a single field (e.g. multiple
// privacy policy pages/documents). Files can be added across several
// selections (they accumulate) and removed individually before saving.
function MultiFileField({
  label, files, existingUrls, onChange, icon,
}: {
  label: string;
  files: File[];
  existingUrls?: string[];
  onChange: (files: File[]) => void;
  icon?: React.ReactNode;
}) {
  const inputId = `file-${label.replace(/\s+/g, "-").toLowerCase()}`;

  const handleSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles = Array.from(fileList);
    onChange([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label
          htmlFor={inputId}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px",
            background: C.inputBg, border: `1px dashed ${C.border}`, borderRadius: "8px",
            color: files.length ? C.textBody : C.textHint, fontSize: "13px", cursor: "pointer",
            flex: 1, minWidth: 0, transition: "all 0.2s ease",
          }}
        >
          {icon ?? <Upload size={15} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {files.length
              ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
              : "Choose file(s) to upload…"}
          </span>
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*,.pdf"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            handleSelect(e.target.files);
            // reset so selecting the same file again still fires onChange
            e.target.value = "";
          }}
        />
      </div>

      {/* Selected (pending upload) files */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 10px", background: C.inputBg, borderRadius: "6px",
            }}>
              <span style={{
                fontSize: "12px", color: C.textBody, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px",
              }}>
                {f.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{ background: "transparent", border: "none", color: C.textHint, cursor: "pointer", padding: "2px", flexShrink: 0 }}
                title="Remove selected file"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Existing uploaded files (already saved on the server) */}
      {existingUrls && existingUrls.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {existingUrls.map((url, i) => (
            <a
              key={i}
              href={url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "12px", color: C.red, display: "flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
            >
              <Paperclip size={12} /> View existing file {existingUrls.length > 1 ? i + 1 : ""}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── TOAST ──────────────────────────────────────────────────── */
function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      style={{
        position: "fixed", bottom: "32px", right: "32px", zIndex: 300,
        background: type === "success" ? "#059669" : C.red,
        color: C.white, padding: "14px 20px", borderRadius: "12px",
        fontSize: "14px", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        display: "flex", alignItems: "center", gap: "10px", maxWidth: "360px",
      }}
    >
      {type === "success" ? <Check size={18} /> : <X size={18} />}
      {message}
    </motion.div>
  );
}

/* ─── DELETE MODAL ───────────────────────────────────────────── */
function DeleteModal({
  entry, onConfirm, onCancel, isDeleting,
}: {
  entry: WarehouseEntry | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
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
              padding: "32px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%", background: C.alertBg,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
            }}>
              <AlertTriangle size={26} color={C.red} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.textHeading, marginBottom: "10px" }}>
              Delete Warehouse?
            </h2>
            <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "28px", lineHeight: 1.6 }}>
              You are about to permanently delete{" "}
              <strong style={{ color: C.textBody }}>{entry.warehouse_name}</strong> for{" "}
              <strong style={{ color: C.textBody }}>{entry.customer_name}</strong>. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <motion.button
                onClick={onCancel} disabled={isDeleting}
                whileHover={{ backgroundColor: C.inputBg }}
                style={{
                  flex: 1, padding: "12px", background: "transparent",
                  border: `1px solid ${C.border}`, borderRadius: "10px",
                  fontSize: "14px", fontWeight: 600, color: C.textLabel, cursor: "pointer", transition: "all 0.2s",
                }}
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
                  opacity: isDeleting ? 0.8 : 1, transition: "all 0.2s",
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
function WarehouseModal({
  entry, onClose, onSaved, mode,
}: {
  entry: WarehouseEntry | null;
  onClose: () => void;
  onSaved: (data: WarehouseEntry) => void;
  mode: "add" | "edit";
}) {
  const [customerName,    setCustomerName]    = useState(entry?.customer_name    ?? "");
  const [warehouseName,   setWarehouseName]   = useState(entry?.warehouse_name   ?? "");
  const [warehouseAddress,setWarehouseAddress]= useState(entry?.warehouse_address ?? "");
  const [supervisorManager,setSupervisorManager] = useState(entry?.supervisor_manager ?? "");
  const [isActive,        setIsActive]        = useState(entry?.is_active ?? true);
  // Now arrays, to support multiple files per field
  const [privacyPolicyFiles, setPrivacyPolicyFiles] = useState<File[]>([]);
  const [termsFiles,         setTermsFiles]         = useState<File[]>([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [isSuccess,       setIsSuccess]       = useState(false);
  const [errorMsg,        setErrorMsg]        = useState("");

  const isOpen = true;

  const handleSave = async () => {
    if (!customerName || !warehouseName || !warehouseAddress || !supervisorManager) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    // On create, both documents are required (at least one file each)
    if (mode === "add" && (privacyPolicyFiles.length === 0 || termsFiles.length === 0)) {
      setErrorMsg("Please upload at least one file for both Warehouse Rules & Regulations and the Warehouse Contractor Agreement.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    try {
      let res: Response;

      if (mode === "add") {
        // POST — multipart/form-data with all fields + files
        // Multiple files for the same field are appended under the same key,
        // which most backends (multer .array(), etc.) parse as an array.
        const formData = new FormData();
        formData.append("customer_name", customerName);
        formData.append("warehouse_name", warehouseName);
        formData.append("warehouse_address", warehouseAddress);
        formData.append("supervisor_manager", supervisorManager);
        formData.append("is_active", String(isActive));
        privacyPolicyFiles.forEach((f) => formData.append("privacy_policy", f));
        termsFiles.forEach((f) => formData.append("terms_and_conditions", f));

        res = await fetch(BASE_URL, {
          method: "POST",
          headers: authHeaders(false), // let browser set multipart boundary
          body: formData,
        });
      } else {
        // PATCH — multipart/form-data with only changed fields / new files
        const formData = new FormData();
        let hasChanges = false;

        if (customerName !== (entry?.customer_name ?? "")) {
          formData.append("customer_name", customerName); hasChanges = true;
        }
        if (warehouseName !== (entry?.warehouse_name ?? "")) {
          formData.append("warehouse_name", warehouseName); hasChanges = true;
        }
        if (warehouseAddress !== (entry?.warehouse_address ?? "")) {
          formData.append("warehouse_address", warehouseAddress); hasChanges = true;
        }
        if (supervisorManager !== (entry?.supervisor_manager ?? "")) {
          formData.append("supervisor_manager", supervisorManager); hasChanges = true;
        }
        if (isActive !== (entry?.is_active ?? true)) {
          formData.append("is_active", String(isActive)); hasChanges = true;
        }
        if (privacyPolicyFiles.length > 0) {
          privacyPolicyFiles.forEach((f) => formData.append("privacy_policy", f));
          hasChanges = true;
        }
        if (termsFiles.length > 0) {
          termsFiles.forEach((f) => formData.append("terms_and_conditions", f));
          hasChanges = true;
        }

        // If nothing changed, just close
        if (!hasChanges) {
          onClose();
          return;
        }

        res = await fetch(`${BASE_URL}/${entry!.id}`, {
          method: "PATCH",
          headers: authHeaders(false), // let browser set multipart boundary
          body: formData,
        });
      }

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        const saved: WarehouseEntry = {
          id:                 data.data?.id                ?? entry?.id ?? "",
          customer_name:      data.data?.customer_name      ?? customerName,
          warehouse_name:     data.data?.warehouse_name     ?? warehouseName,
          warehouse_address:  data.data?.warehouse_address  ?? warehouseAddress,
          supervisor_manager: data.data?.supervisor_manager ?? supervisorManager,
          is_active:          data.data?.is_active          ?? isActive,
          created_at:         data.data?.created_at,
          updated_at:         data.data?.updated_at,
          deleted_at:         data.data?.deleted_at,
          privacy_policy_url:                data.data?.privacy_policy_url                ?? entry?.privacy_policy_url ?? null,
          privacy_policy_storage_path:        data.data?.privacy_policy_storage_path       ?? entry?.privacy_policy_storage_path ?? null,
          terms_and_conditions_url:           data.data?.terms_and_conditions_url          ?? entry?.terms_and_conditions_url ?? null,
          terms_and_conditions_storage_path:  data.data?.terms_and_conditions_storage_path ?? entry?.terms_and_conditions_storage_path ?? null,
        };
        setTimeout(() => {
          onSaved(saved);
          onClose();
        }, 900);
      } else {
        setErrorMsg(data.message || `Failed to ${mode === "add" ? "create" : "update"} warehouse.`);
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
              position: "relative", width: "100%", maxWidth: "620px", margin: "24px",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
              maxHeight: "92vh", overflowY: "auto",
            }}
          >
            {/* Close */}
            <button
              onClick={() => { if (!isLoading && !isSuccess) onClose(); }}
              style={{
                position: "absolute", right: "24px", top: "24px",
                background: "transparent", border: "none", color: C.textHint, cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.textHeading)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textHint)}
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div style={{ padding: "32px 32px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px", background: C.alertBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Warehouse size={20} color={C.red} />
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 600, color: C.textHeading }}>
                  {mode === "add" ? "Add Warehouse" : "Edit Warehouse"}
                </h2>
              </div>
              <p style={{ fontSize: "14px", color: C.textMuted, paddingLeft: "52px" }}>
                {mode === "add"
                  ? "Fill in the details for the new warehouse location."
                  : "Update any fields you'd like to change."}
              </p>
            </div>

            {/* Fields */}
            <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <FormField
                  label="Customer Name" placeholder="e.g. ABC Logistics"
                  value={customerName} onChange={setCustomerName}
                  icon={<User size={15} />}
                />
                <FormField
                  label="Warehouse Name" placeholder="e.g. Canada Central Warehouse"
                  value={warehouseName} onChange={setWarehouseName}
                  icon={<Building2 size={15} />}
                />
              </div>
              <FormField
                label="Warehouse Address" placeholder="Full address including city and province"
                value={warehouseAddress} onChange={setWarehouseAddress}
                icon={<MapPin size={15} />}
              />
              <FormField
                label="Supervisor / Manager" placeholder="e.g. John Smith"
                value={supervisorManager} onChange={setSupervisorManager}
                icon={<User size={15} />}
              />

              {/* File uploads (multiple files allowed per field) */}
              <div style={{ display: "flex", gap: "16px" }}>
                <MultiFileField
                  label={`Warehouse Rules & Regulations${mode === "add" ? "" : " (optional)"}`}
                  files={privacyPolicyFiles}
                  existingUrls={toUrlArray(entry?.privacy_policy_url)}
                  onChange={setPrivacyPolicyFiles}
                  icon={<FileText size={15} />}
                />
                <MultiFileField
                  label={`Warehouse Contractor Agreement${mode === "add" ? "" : " (optional)"}`}
                  files={termsFiles}
                  existingUrls={toUrlArray(entry?.terms_and_conditions_url)}
                  onChange={setTermsFiles}
                  icon={<FileText size={15} />}
                />
              </div>

              {/* Active toggle */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>Status</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    onClick={() => { if (!isLoading && !isSuccess) setIsActive(a => !a); }}
                    style={{
                      width: "44px", height: "24px", borderRadius: "12px",
                      background: isActive ? C.successText : C.borderHover,
                      position: "relative", cursor: "pointer", transition: "background 0.3s ease", flexShrink: 0,
                    }}
                  >
                    <motion.div
                      layout initial={false} animate={{ x: isActive ? 22 : 2 }}
                      style={{
                        width: "20px", height: "20px", borderRadius: "50%", background: C.white,
                        position: "absolute", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "14px", color: C.textBody, fontWeight: 500 }}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
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
                  width: "100%", padding: "14px", marginTop: "4px",
                  background: isSuccess ? "#059669" : `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                  border: "none", borderRadius: "10px",
                  display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                  color: C.white, fontSize: "15px", fontWeight: 600, letterSpacing: "0.5px",
                  cursor: isLoading || isSuccess ? "default" : "pointer",
                  transition: "background 0.3s ease", opacity: isLoading ? 0.8 : 1,
                }}
              >
                {isLoading
                  ? <><Spinner size={18} color={C.white} /><span>Saving…</span></>
                  : isSuccess
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

/* ─── STATUS BADGE ───────────────────────────────────────────── */
function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px",
        borderRadius: "20px", background: C.successBg, color: C.successText,
        fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px",
      }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.successText }} />
        Active
      </div>
    );
  }
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: "20px",
      background: C.inactiveBg, color: C.inactiveText,
      fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px",
    }}>
      Inactive
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: "center", padding: "80px 40px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
      }}
    >
      <div style={{
        width: "64px", height: "64px", borderRadius: "50%", background: C.inputBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
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
          fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${C.redGlow}`,
        }}
      >
        <Plus size={18} /> Add First Warehouse
      </motion.button>
    </motion.div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function WarehousePage() {
  const [warehouses,    setWarehouses]    = useState<WarehouseEntry[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [loadError,     setLoadError]     = useState("");
  const [search,        setSearch]        = useState("");
  const [isAddOpen,     setAddOpen]       = useState(false);
  const [editTarget,    setEditTarget]    = useState<WarehouseEntry | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<WarehouseEntry | null>(null);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("warehouses");

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  /* ── Fetch all warehouses ── */
  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await fetch(BASE_URL, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      // API returns { message, count, data: [...] }
      setWarehouses(Array.isArray(data.data) ? data.data : []);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load warehouses.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  /* ── Toggle active/inactive via PATCH ── */
  const handleToggleStatus = async (w: WarehouseEntry) => {
    setActionLoading((prev) => ({ ...prev, [w.id]: true }));
    const newState = !w.is_active;
    try {
      const res = await fetch(`${BASE_URL}/${w.id}`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify({ is_active: newState }),
      });
      const data = await res.json();
      if (res.ok) {
        setWarehouses((prev) =>
          prev.map((wh) =>
            wh.id === w.id
              ? { ...wh, is_active: data.data?.is_active ?? newState, updated_at: data.data?.updated_at }
              : wh
          )
        );
        showToast(`Warehouse ${newState ? "activated" : "deactivated"} successfully.`);
      } else {
        showToast(data.message || "Failed to update warehouse status.", "error");
      }
    } catch {
      showToast("A network error occurred.", "error");
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[w.id]; return n; });
    }
  };

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${BASE_URL}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setWarehouses((prev) => prev.filter((w) => w.id !== deleteTarget.id));
        showToast("Warehouse deleted successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Failed to delete warehouse.", "error");
      }
    } catch {
      showToast("A network error occurred.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ── Add ── */
  const handleAdded = (entry: WarehouseEntry) => {
    setWarehouses((prev) => [entry, ...prev]);
    showToast("Warehouse added successfully!");
  };

  /* ── Edit ── */
  const handleUpdated = (entry: WarehouseEntry) => {
    setWarehouses((prev) => prev.map((w) => w.id === entry.id ? entry : w));
    setEditTarget(null);
    showToast("Warehouse updated successfully.");
  };

  const filtered = warehouses.filter((w) =>
    w.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    w.warehouse_name.toLowerCase().includes(search.toLowerCase()) ||
    w.supervisor_manager.toLowerCase().includes(search.toLowerCase()) ||
    w.warehouse_address.toLowerCase().includes(search.toLowerCase())
  );

  const tableGridTemplate = "1.4fr 1.3fr 1.8fr 1.1fr 0.9fr 0.8fr 0.9fr";

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", position: "relative" }}>

          {/* ── Top Nav ── */}
          <motion.header
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0, 0.55, 0.45, 1] }}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 40px", borderBottom: `1px solid ${C.border}`,
              background: C.surface, position: "sticky", top: 0, zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Warehouse size={18} color={C.red} />
              <span style={{
                fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase",
                color: C.textHeading, fontWeight: 600,
              }}>
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
                  transition: "all 0.2s ease",
                }}
              >
                Sign Out <LogOut size={16} />
              </motion.button>
            </div>
          </motion.header>

          {/* ── Main Content ── */}
          <main style={{
            padding: "40px", maxWidth: "1600px", margin: "0 auto", width: "100%",
            display: "flex", flexDirection: "column", gap: "32px",
          }}>

            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}
            >
              <div>
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: 600,
                  color: C.textHeading, marginBottom: "8px", letterSpacing: "-0.5px",
                }}>
                  Warehouses
                </h1>
                <p style={{ fontSize: "15px", color: C.textMuted }}>
                  Manage warehouse locations, assignments, and supervisors
                  {!isLoading && !loadError && (
                    <span style={{ marginLeft: "8px", fontSize: "13px", color: C.textHint }}>
                      ({warehouses.length} total)
                    </span>
                  )}
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <motion.button
                  onClick={fetchWarehouses}
                  whileHover={{ backgroundColor: C.inputBg }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
                    background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px",
                    color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <RefreshCw size={15} style={isLoading ? { animation: "spin 0.7s linear infinite" } : {}} />
                  Refresh
                </motion.button>

                <motion.button
                  onClick={() => setAddOpen(true)}
                  whileHover={{ y: -2, boxShadow: `0 8px 24px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px",
                    background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                    border: "none", borderRadius: "8px", color: C.white, fontSize: "14px",
                    fontWeight: 600, letterSpacing: "0.5px", cursor: "pointer",
                    boxShadow: `0 4px 16px ${C.redGlow}`,
                  }}
                >
                  <Plus size={18} /> Add Warehouse
                </motion.button>
              </div>
            </motion.div>

            {/* ── Summary Cards ── */}
            {!isLoading && !loadError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}
              >
                {[
                  { label: "Total Warehouses",  value: warehouses.length,                                      icon: <Warehouse size={20} color={C.red} />        },
                  { label: "Active",            value: warehouses.filter(w => w.is_active).length,             icon: <Check size={20} color="#059669" />          },
                  { label: "Unique Customers",  value: new Set(warehouses.map(w => w.customer_name)).size,     icon: <User size={20} color="#3B82F6" />           },
                  { label: "Unique Locations",  value: new Set(warehouses.map(w => w.warehouse_address)).size, icon: <MapPin size={20} color="#8B5CF6" />         },
                  { label: "Supervisors",       value: new Set(warehouses.map(w => w.supervisor_manager)).size,icon: <Building2 size={20} color="#10B981" />       },
                ].map((card) => (
                  <div key={card.label} className="clean-card"
                    style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px", background: C.inputBg,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {card.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "26px", fontWeight: 700, color: C.textHeading, lineHeight: 1 }}>
                        {card.value}
                      </div>
                      <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "4px" }}>{card.label}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Table Card ── */}
            <motion.div
              variants={containerVars} initial="hidden" animate="show"
              className="clean-card"
              style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {/* Card Header */}
              <div style={{
                padding: "24px 32px", borderBottom: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: "16px",
              }}>
                <h3 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading }}>
                  Warehouse Directory
                </h3>
                <div style={{ position: "relative" }}>
                  <Search size={16} color={C.textHint} style={{
                    position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  }} />
                  <input
                    type="text"
                    placeholder="Search by customer, name, supervisor…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px",
                      padding: "10px 16px 10px 40px", color: C.textBody, fontSize: "14px",
                      width: "300px", outline: "none", transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.red)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  />
                </div>
              </div>

              {/* Loading */}
              {isLoading && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                  padding: "60px 40px", color: C.textMuted, fontSize: "15px",
                }}>
                  <Spinner size={22} color={C.red} /> Loading warehouses…
                </div>
              )}

              {/* Error */}
              {!isLoading && loadError && (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <p style={{ color: C.red, fontSize: "14px", marginBottom: "16px" }}>{loadError}</p>
                  <motion.button
                    onClick={fetchWarehouses}
                    whileHover={{ backgroundColor: C.redActiveBg }}
                    style={{
                      padding: "10px 20px", border: `1px solid ${C.red}`, borderRadius: "8px",
                      background: "transparent", color: C.red, fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Retry
                  </motion.button>
                </div>
              )}

              {/* Empty */}
              {!isLoading && !loadError && filtered.length === 0 && (
                search
                  ? <div style={{ padding: "60px", textAlign: "center", color: C.textMuted }}>
                      No warehouses match &ldquo;{search}&rdquo;.
                    </div>
                  : <EmptyState onAddClick={() => setAddOpen(true)} />
              )}

              {/* Table */}
              {!isLoading && !loadError && filtered.length > 0 && (
                <div className="table-container">
                  <div className="table-min-width">

                    {/* Header Row */}
                    <div style={{
                      display: "grid", gridTemplateColumns: tableGridTemplate,
                      padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: C.inputBg,
                    }}>
                      {["Customer", "Warehouse", "Address", "Supervisor / Manager", "Documents", "Status", "Actions"].map((h, i) => (
                        <span key={i} style={{
                          fontSize: "11px", textTransform: "uppercase",
                          letterSpacing: "1px", color: C.textHint, fontWeight: 600,
                        }}>
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* Data Rows */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {filtered.map((w, idx) => {
                        const isToggling = !!actionLoading[w.id];
                        const privacyUrls = toUrlArray(w.privacy_policy_url);
                        const termsUrls = toUrlArray(w.terms_and_conditions_url);
                        return (
                          <motion.div
                            key={w.id} variants={itemVars}
                            whileHover={{ backgroundColor: C.inputBg }}
                            style={{
                              display: "grid", gridTemplateColumns: tableGridTemplate,
                              alignItems: "center", padding: "20px 32px",
                              borderBottom: idx !== filtered.length - 1 ? `1px solid ${C.border}` : "none",
                              transition: "background-color 0.2s ease",
                            }}
                          >
                            {/* Customer */}
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: C.textHeading }}>
                                {w.customer_name}
                              </div>
                            </div>

                            {/* Warehouse Name */}
                            <div>
                              <div style={{ fontSize: "15px", fontWeight: 600, color: C.textHeading }}>
                                {w.warehouse_name}
                              </div>
                              <div style={{ fontSize: "11px", color: C.textHint, marginTop: "2px", fontFamily: "monospace" }}>
                                {w.id.slice(0, 8)}…
                              </div>
                            </div>

                            {/* Address */}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                              <MapPin size={13} color={C.textHint} style={{ marginTop: "2px", flexShrink: 0 }} />
                              <span style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.4 }}>
                                {w.warehouse_address}
                              </span>
                            </div>

                            {/* Supervisor */}
                            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                              <User size={13} color={C.textHint} style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: "13px", color: C.textBody, fontWeight: 500 }}>
                                {w.supervisor_manager}
                              </span>
                            </div>

                            {/* Documents */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {privacyUrls.length > 0 ? (
                                privacyUrls.map((url, i) => (
                                  <a
                                    key={`pp-${i}`}
                                    href={url} target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: "12px", color: C.red, display: "flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
                                  >
                                    <FileText size={12} /> Warehouse Rules & Regulations{privacyUrls.length > 1 ? ` ${i + 1}` : ""}
                                  </a>
                                ))
                              ) : (
                                <span style={{ fontSize: "12px", color: C.textHint }}>No rules & regulations</span>
                              )}
                              {termsUrls.length > 0 ? (
                                termsUrls.map((url, i) => (
                                  <a
                                    key={`tc-${i}`}
                                    href={url} target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: "12px", color: C.red, display: "flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
                                  >
                                    <FileText size={12} /> Warehouse Contractor Agreement{termsUrls.length > 1 ? ` ${i + 1}` : ""}
                                  </a>
                                ))
                              ) : (
                                <span style={{ fontSize: "12px", color: C.textHint }}>No contractor agreement</span>
                              )}
                            </div>

                            {/* Status */}
                            <div><StatusBadge isActive={w.is_active} /></div>

                            {/* Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              {/* Edit */}
                              <motion.button
                                onClick={() => setEditTarget(w)}
                                whileHover={{ scale: 1.1, color: C.red }}
                                whileTap={{ scale: 0.9 }}
                                title="Edit warehouse"
                                style={{
                                  background: "transparent", border: "none", color: C.textHint,
                                  cursor: "pointer", padding: "7px", borderRadius: "6px", transition: "color 0.2s",
                                }}
                              >
                                <Edit2 size={17} />
                              </motion.button>

                              {/* Toggle active */}
                              <motion.button
                                onClick={() => handleToggleStatus(w)}
                                disabled={isToggling}
                                whileHover={isToggling ? {} : { scale: 1.1, color: w.is_active ? C.redBright : C.successText }}
                                whileTap={{ scale: 0.9 }}
                                title={w.is_active ? "Deactivate" : "Activate"}
                                style={{
                                  background: "transparent", border: "none", color: C.textHint,
                                  cursor: isToggling ? "default" : "pointer", padding: "7px",
                                  borderRadius: "6px", transition: "color 0.2s",
                                  opacity: isToggling ? 0.5 : 1,
                                }}
                              >
                                {isToggling
                                  ? <Spinner size={17} />
                                  : w.is_active ? <EyeOff size={17} /> : <Eye size={17} />
                                }
                              </motion.button>

                              {/* Delete */}
                              <motion.button
                                onClick={() => setDeleteTarget(w)}
                                whileHover={{ scale: 1.1, color: C.redBright }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete warehouse"
                                style={{
                                  background: "transparent", border: "none", color: C.textHint,
                                  cursor: "pointer", padding: "7px", borderRadius: "6px", transition: "color 0.2s",
                                }}
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
        isDeleting={isDeleting}
      />

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>
    </>
  );
}