"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, cubicBezier, type Variants } from "framer-motion";
import {
  LogOut, Search, ChevronDown, CheckCircle, MessageCircle, Users,
  Trash2, Eye, UserCheck, ChevronLeft, ChevronRight, Square,
  CheckSquare, Calendar, Loader2, X, AlertTriangle, CheckCheck,
  FileSpreadsheet, Send, Paperclip, FileText, Image as ImageIcon, Mic
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
  .table-container { width: 100%; overflow-x: auto; }
  .table-min-width { min-width: 1200px; }
  select { appearance: none; -webkit-appearance: none; background-color: transparent; cursor: pointer; }
  select option { background-color: ${C.surface}; color: ${C.textHeading}; }
  .modal-overlay { position: fixed; inset: 0; background: ${C.overlayBg}; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(2px); }
  .modal-box { background: ${C.surface}; border-radius: 16px; padding: 32px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ─── AUTH HEADERS ───────────────────────────────────────────── */
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("jbr_token") || "" : ""}`,
});

const uploadHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("jbr_token") || "" : ""}`,
});

/* ─── TYPES ──────────────────────────────────────────────────── */
interface Group {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  member_count?: number;
}

interface JobCategory {
  id: string;
  name: string;
  job_industry?: { id: string; name: string } | null;
}

interface Candidate {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  gender?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  job_category_id?: string | null;
  job_industry_id?: string | null;
  verification_status?: string;
  resume_url?: string;
  permit_status?: string;
  shift_preference?: string;
  available_from?: string;
  created_at?: string;
  job_categories?: { id: string; name: string } | null;
  job_industries?: { id: string; name: string } | null;
  campaigns?: { id: number; name: string } | null;
}

interface GroupMember {
  id: string;
  candidate_id: string;
  assigned_by: string;
  assigned_at: string;
  candidates: Candidate;
}

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

/* ─── HELPERS ────────────────────────────────────────────────── */
const formatDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
};

const getVerificationBadge = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "verified":
      return { bg: C.successBg, border: "transparent", color: C.successText, label: "Verified" };
    case "pending":
      return { bg: C.pendingBg, border: C.pendingBorder, color: C.pendingText, label: "Pending" };
    case "rejected":
      return { bg: C.alertBg, border: "transparent", color: C.alertText, label: "Rejected" };
    case "shortlisted":
      return { bg: "rgba(139,92,246,0.08)", border: "transparent", color: "#7C3AED", label: "Shortlisted" };
    default:
      return { bg: C.inputBg, border: C.border, color: C.textMuted, label: "Unknown" };
  }
};

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);
const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};
const itemVars = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

/* ─── TOAST ──────────────────────────────────────────────────── */
function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  const colors = {
    success: { color: C.successText, icon: <CheckCheck size={18} /> },
    error: { color: C.alertText, icon: <AlertTriangle size={18} /> },
    info: { color: C.pendingText, icon: <CheckCircle size={18} /> },
  }[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        zIndex: 2000,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${colors.color}`,
        borderRadius: "12px",
        padding: "16px 20px",
        boxShadow: `0 8px 32px ${C.shadowMd}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        fontWeight: 500,
        minWidth: "280px",
      }}
    >
      <span style={{ color: colors.color }}>{colors.icon}</span>
      <span style={{ color: C.textBody, flex: 1 }}>{toast.message}</span>
      <button
        onClick={onDismiss}
        style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted }}
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

/* ─── REMOVE FROM GROUP CONFIRM MODAL ───────────────────────── */
function RemoveModal({
  name,
  onClose,
  onConfirm,
  loading,
}: {
  name: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: C.alertBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <AlertTriangle size={28} color={C.red} />
          </div>
          <h2
            style={{ fontSize: "20px", fontWeight: 700, color: C.textHeading, marginBottom: "8px" }}
          >
            Remove from Group
          </h2>
          <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.6 }}>
            Remove <strong>{name}</strong> from this group? They'll stay in the system and can be
            added back later.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              color: C.textLabel,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              background: C.red,
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Trash2 size={16} />
            )}
            {loading ? "Removing..." : "Remove"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── BULK MESSAGE COMPOSE MODAL ────────────────────────────── */
function BulkMessageModal({
  count,
  onClose,
  onSend,
  sending,
}: {
  count: number;
  onClose: () => void;
  onSend: (text: string, file: File | null) => void;
  sending: boolean;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setShowAttachMenu(false);
    }
  };

  const handleSend = () => {
    if (!text.trim() && !file) return;
    onSend(text, file);
  };

  const attachItems = [
    { icon: <ImageIcon size={16} />, label: "Photo / Video", accept: "image/*,video/*" },
    { icon: <FileText size={16} />, label: "Document", accept: ".pdf,.doc,.docx,.txt" },
    { icon: <Mic size={16} />, label: "Audio", accept: "audio/*" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        style={{ maxWidth: "520px", padding: 0 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
      >
        <div
          style={{ padding: "24px 24px 16px", borderBottom: `1px solid ${C.border}` }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: C.textHeading,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <MessageCircle size={20} color={C.red} /> Send Bulk Message
            </h2>
            <button
              onClick={onClose}
              disabled={sending}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted }}
            >
              <X size={20} />
            </button>
          </div>
          <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "8px" }}>
            This message will be sent individually to{" "}
            <strong style={{ color: C.textHeading }}>{count} selected candidates</strong>.
          </p>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ position: "relative" }}>
            <textarea
              placeholder="Type your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
              style={{
                width: "100%",
                minHeight: "120px",
                background: C.inputBg,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                padding: "14px",
                color: C.textBody,
                fontSize: "14px",
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                resize: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = C.red)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />

            <div style={{ position: "relative" }}>
              <motion.button
                whileHover={{ backgroundColor: C.redActiveBg, color: C.red }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAttachMenu((prev) => !prev)}
                disabled={sending}
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: "10px",
                  color: C.textMuted,
                  cursor: sending ? "not-allowed" : "pointer",
                  opacity: sending ? 0.5 : 1,
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <Paperclip size={18} />
              </motion.button>

              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    style={{
                      position: "absolute",
                      bottom: "48px",
                      left: 0,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: "12px",
                      boxShadow: `0 8px 32px ${C.shadowMd}`,
                      padding: "8px",
                      minWidth: "160px",
                      zIndex: 100,
                    }}
                  >
                    {attachItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = item.accept;
                            fileInputRef.current.click();
                          }
                          setShowAttachMenu(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "9px 12px",
                          background: "transparent",
                          border: "none",
                          borderRadius: "8px",
                          color: C.textLabel,
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = C.inputBg)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <span style={{ color: C.red }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {file && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  background: C.inputBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: C.textBody,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </span>
                <button
                  onClick={() => setFile(null)}
                  disabled={sending}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    color: C.textMuted,
                    marginLeft: "auto",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            background: C.inputBg,
            borderBottomLeftRadius: "16px",
            borderBottomRightRadius: "16px",
          }}
        >
          <button
            onClick={onClose}
            disabled={sending}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              color: C.textLabel,
              fontSize: "13px",
              fontWeight: 600,
              cursor: sending ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={(!text.trim() && !file) || sending}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 24px",
              background: (!text.trim() && !file) || sending ? C.textHint : C.red,
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: (!text.trim() && !file) || sending ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {sending ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Send size={16} />
            )}
            {sending ? "Sending..." : "Send to All"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── TOP NAV ────────────────────────────────────────────────── */
function TopNav() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; email?: string } | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("jbr_user");
    if (s) {
      try {
        setUser(JSON.parse(s));
      } catch {}
    }
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: easeOutCirc }}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            fontSize: "12px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: C.textHint,
            fontWeight: 600,
          }}
        >
          Main
        </span>
        <span style={{ color: C.textMuted }}>/</span>
        <span
          style={{
            fontSize: "12px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: C.textHeading,
            fontWeight: 600,
          }}
        >
          Shortlisted
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <span style={{ fontSize: "13px", color: C.textMuted }}>
          Welcome,{" "}
          <span style={{ color: C.textHeading, fontWeight: 600 }}>
            {user
              ? user.firstName
                ? `${user.firstName} (${user.email})`
                : user.email
              : "Loading..."}
          </span>
        </span>
        <motion.button
          onClick={() => {
            localStorage.removeItem("jbr_token");
            localStorage.removeItem("jbr_user");
            router.push("/");
          }}
          whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            color: C.textLabel,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Sign Out <LogOut size={16} />
        </motion.button>
      </div>
    </motion.header>
  );
}

/* ─── SELECT DROPDOWN WRAPPER (matches Employees page) ───────── */
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
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          color: C.textLabel,
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {loading && (
          <Loader2
            size={14}
            color={C.textHint}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              animation: "spin 1s linear infinite",
              zIndex: 1,
            }}
          />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          style={{
            width: "100%",
            background: C.inputBg,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: `10px 36px 10px ${loading ? "34px" : "16px"}`,
            color: value ? C.textBody : C.textHint,
            fontSize: "14px",
            outline: "none",
          }}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          color={C.textHint}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function ShortlistedPage() {
  const router = useRouter();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* ── Groups ── */
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  /* ── Job Categories (for filter dropdown) ── */
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [jobCategoriesLoading, setJobCategoriesLoading] = useState(false);

  /* ── Members ── */
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [total, setTotal] = useState(0);

  /* ── Filters ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [jobCategoryFilter, setJobCategoryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  /* ── Selection ── */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /* ── Remove-from-group modal ── */
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  /* ── Bulk Message Modal ── */
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isSendingMessages, setIsSendingMessages] = useState(false);

  /* ── Individual Chat Loading State ── */
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);

  /* ── Toast ── */
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback((t: Toast) => setToast(t), []);

  /* ── Derived State for Action Buttons ── */
  const hasInvalidSelectionForVerify = selectedIds.some((id) => {
    const member = members.find((m) => m.candidates.id === id);
    const status = member?.candidates.verification_status?.toLowerCase();
    return status === "shortlisted" || status === "verified";
  });

  /*
   * ── CLIENT-SIDE FILTER ──
   * All filters (search, status, job category, gender, province, city) are
   * applied locally against the currently fetched `members` array — same
   * pattern as the Employees page, since relying on the backend to honor
   * every query param isn't dependable.
   */
  const displayedMembers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const province = provinceFilter.trim().toLowerCase();
    const city = cityFilter.trim().toLowerCase();

    return members.filter((member) => {
      const c = member.candidates;

      if (filterStatus) {
        const status = (c.verification_status || "").toLowerCase();
        if (status !== filterStatus) return false;
      }

      if (jobCategoryFilter && String(c.job_category_id || "") !== String(jobCategoryFilter)) {
        return false;
      }

      // Case-insensitive, trimmed comparison — fixes "Male" (UI) vs "male" (data) mismatches
      if (genderFilter && (c.gender || "").trim().toLowerCase() !== genderFilter.trim().toLowerCase()) {
        return false;
      }

      if (province && !(c.province || "").toLowerCase().includes(province)) {
        return false;
      }

      if (city && !(c.city || "").toLowerCase().includes(city)) {
        return false;
      }

      if (term) {
        const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
        const email = (c.email || "").toLowerCase();
        const phone = (c.phone_number || "").toLowerCase();
        if (!fullName.includes(term) && !email.includes(term) && !phone.includes(term)) return false;
      }

      return true;
    });
  }, [members, filterStatus, jobCategoryFilter, genderFilter, provinceFilter, cityFilter, searchQuery]);

  /* ─── FETCH GROUPS ── */
  useEffect(() => {
    setGroupsLoading(true);
    fetch(`${BASE_URL}/groups`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => setGroups(j.data || j.groups || j || []))
      .catch(() => showToast({ type: "error", message: "Failed to load groups." }))
      .finally(() => setGroupsLoading(false));
  }, [showToast]);

  /* ─── FETCH JOB CATEGORIES ── */
  useEffect(() => {
    setJobCategoriesLoading(true);
    fetch(`${BASE_URL}/job-categories`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => setJobCategories(j.data || []))
      .catch(() => showToast({ type: "error", message: "Failed to load job categories." }))
      .finally(() => setJobCategoriesLoading(false));
  }, [showToast]);

  /* ─── FETCH MEMBERS ── */
  const fetchMembers = useCallback(async () => {
    if (!selectedGroupId) {
      setMembers([]);
      setTotal(0);
      return;
    }
    setMembersLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams();
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (filterStatus) params.set("verification_status", filterStatus);

      const res = await fetch(
        `${BASE_URL}/groups/${selectedGroupId}/members?${params.toString()}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setMembers(json.data || []);
      setTotal(json.pagination?.total ?? json.total_count ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load members.";
      showToast({ type: "error", message });
      setMembers([]);
      setTotal(0);
    } finally {
      setMembersLoading(false);
      setSelectedIds([]);
    }
  }, [selectedGroupId, currentPage, pageSize, searchQuery, filterStatus, showToast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGroupId, searchQuery, filterStatus, jobCategoryFilter, genderFilter, provinceFilter, cityFilter, pageSize]);

  /* ─── OPEN CHAT ── */
  const handleOpenChat = async (member: GroupMember) => {
    const c = member.candidates;
    const employeeId = c.id;
    const phone = c.phone_number || "";
    const name = `${c.first_name || ""} ${c.last_name || ""}`.trim();
    const campaignId = c.campaigns?.id || 0;
    const jobCategoryId = c.job_category_id || "";

    setOpeningChatId(employeeId);
    try {
      let sessionId = "";
      if (phone) {
        const res = await fetch(`${BASE_URL}/chat/sessions/employee/${employeeId}?mobile_number=${encodeURIComponent(phone)}`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.id) sessionId = data.data.id;
        }
      }
      
      if (!sessionId) {
        const res = await fetch(`${BASE_URL}/chat/sessions/start`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ 
            employee_id: employeeId, 
            mobile_number: phone, 
            campaign_id: campaignId, 
            job_category_id: jobCategoryId 
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.id) sessionId = data.data.id;
        }
      }

      const qs = new URLSearchParams({
        name,
        phone,
        campaignId: String(campaignId),
        jobCategoryId,
      });
      if (sessionId) qs.set("sessionId", sessionId);

      router.push(`/chat/${employeeId}?${qs.toString()}`);
    } catch (err) {
      showToast({ type: "error", message: "Failed to open chat session." });
      setOpeningChatId(null);
    }
  };

  /* ─── VERIFY SINGLE ── */
  const verifyEmployee = async (employeeId: string) => {
    showToast({ type: "info", message: "Verifying candidate..." });
    try {
      const res = await fetch(`${BASE_URL}/employees/${employeeId}/verify`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) {
        showToast({ type: "error", message: "Failed to verify candidate." });
        return;
      }
      setMembers((prev) =>
        prev.map((m) =>
          m.candidates.id === employeeId
            ? { ...m, candidates: { ...m.candidates, verification_status: "verified" } }
            : m
        )
      );
      showToast({ type: "success", message: "Candidate verified successfully." });
    } catch {
      showToast({ type: "error", message: "Failed to verify candidate due to a network issue." });
    }
  };

  /* ─── BULK VERIFY ── */
  const bulkVerify = async () => {
    if (!selectedIds.length) return;
    showToast({ type: "info", message: "Verifying candidates..." });

    let successCount = 0;
    let failCount = 0;
    const successfulIds: string[] = [];

    await Promise.all(
      selectedIds.map(async (id) => {
        try {
          const res = await fetch(`${BASE_URL}/employees/${id}/verify`, {
            method: "PATCH",
            headers: authHeaders(),
          });
          if (res.ok) {
            successCount++;
            successfulIds.push(id);
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      })
    );

    if (successCount > 0) {
      setMembers((prev) =>
        prev.map((m) =>
          successfulIds.includes(m.candidates.id)
            ? { ...m, candidates: { ...m.candidates, verification_status: "verified" } }
            : m
        )
      );
    }

    if (failCount === 0) {
      showToast({ type: "success", message: `Successfully verified ${successCount} candidates.` });
      setSelectedIds([]);
    } else if (successCount > 0) {
      showToast({
        type: "info",
        message: `Verified ${successCount}. Failed to verify ${failCount}.`,
      });
      setSelectedIds((prev) => prev.filter((id) => !successfulIds.includes(id)));
    } else {
      showToast({ type: "error", message: "Failed to verify candidates." });
    }
  };

  /* ─── REMOVE SINGLE FROM GROUP ── */
  const handleRemoveConfirm = async () => {
    if (!removeTarget || !selectedGroupId) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/${selectedGroupId}/remove-members`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ candidate_ids: [removeTarget.id] }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setMembers((prev) => prev.filter((m) => m.candidates.id !== removeTarget.id));
      setSelectedIds((prev) => prev.filter((id) => id !== removeTarget.id));
      setTotal((prev) => prev - 1);
      showToast({ type: "success", message: `${removeTarget.name} removed from group.` });
      setRemoveTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove candidate from group.";
      showToast({ type: "error", message });
    } finally {
      setRemoveLoading(false);
    }
  };

  /* ─── BULK REMOVE FROM GROUP ── */
  const bulkRemoveFromGroup = async () => {
    if (!selectedIds.length || !selectedGroupId) return;
    try {
      const res = await fetch(`${BASE_URL}/groups/${selectedGroupId}/remove-members`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ candidate_ids: selectedIds }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setMembers((prev) => prev.filter((m) => !selectedIds.includes(m.candidates.id)));
      setTotal((prev) => prev - selectedIds.length);
      showToast({
        type: "success",
        message: `${selectedIds.length} candidates removed from group.`,
      });
      setSelectedIds([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove candidates from group.";
      showToast({ type: "error", message });
    }
  };

  /* ─── BULK SEND MESSAGES ── */
  const sendBulkMessage = async (text: string, file: File | null) => {
    if (!selectedIds.length) return;
    setIsSendingMessages(true);
    showToast({ type: "info", message: `Sending message to ${selectedIds.length} candidates...` });

    let successCount = 0;
    let failCount = 0;

    for (const employeeId of selectedIds) {
      try {
        let sessionId: string | null = null;

        const member = members.find((m) => m.candidates.id === employeeId);
        if (!member) throw new Error("Candidate data not found");

        const candidate = member.candidates;
        const phone = candidate.phone_number;

        if (phone) {
          const getRes = await fetch(
            `${BASE_URL}/chat/sessions/employee/${employeeId}?mobile_number=${encodeURIComponent(phone)}`,
            { headers: authHeaders() }
          );
          if (getRes.ok) {
            const getJson = await getRes.json();
            if (getJson?.data?.id) sessionId = getJson.data.id;
          }
        }

        if (!sessionId) {
          const postRes = await fetch(`${BASE_URL}/chat/sessions/start`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              employee_id: employeeId,
              mobile_number: phone || "",
              campaign_id: candidate.campaigns?.id || 0,
              job_category_id: candidate.job_category_id || null,
            }),
          });
          if (postRes.ok) {
            const postJson = await postRes.json();
            sessionId = postJson?.data?.id;
          }
        }

        if (!sessionId) throw new Error("Could not resolve session ID");

        let sendRes: Response;
        if (file) {
          const formData = new FormData();
          formData.append("session_id", sessionId);
          formData.append("employee_id", employeeId);
          formData.append("message_text", text);
          formData.append("sender_type", "vendor");
          formData.append("file", file);

          sendRes = await fetch(`${BASE_URL}/chat/messages/upload`, {
            method: "POST",
            headers: uploadHeaders(),
            body: formData,
          });
        } else {
          sendRes = await fetch(`${BASE_URL}/chat/messages/send`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              session_id: sessionId,
              employee_id: employeeId,
              message_text: text,
              message_type: "text",
              sender_type: "vendor",
            }),
          });
        }

        if (sendRes.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error("Failed to send message to", employeeId, err);
        failCount++;
      }
    }

    setIsSendingMessages(false);
    setIsMessageModalOpen(false);

    if (failCount === 0) {
      showToast({
        type: "success",
        message: `Message sent successfully to ${successCount} candidates.`,
      });
      setSelectedIds([]);
    } else if (successCount > 0) {
      showToast({
        type: "info",
        message: `Sent to ${successCount}. Failed for ${failCount} candidates.`,
      });
    } else {
      showToast({ type: "error", message: "Failed to send messages. Please try again." });
    }
  };

  /* ─── EXCEL DOWNLOAD ── */
  const downloadExcel = async () => {
    if (!selectedGroupId) {
      showToast({ type: "error", message: "Select a group first." });
      return;
    }
    showToast({ type: "info", message: "Preparing Excel file…" });
    try {
      const res = await fetch(
        `${BASE_URL}/groups/${selectedGroupId}/members?limit=10000&offset=0`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      const allMembers: GroupMember[] = json.data || [];
      const rows = allMembers.map((m) => {
        const c = m.candidates;
        return {
          "First Name": c.first_name || "",
          "Last Name": c.last_name || "",
          Email: c.email || "",
          Phone: c.phone_number || "",
          Gender: c.gender || "",
          City: c.city || "",
          Province: c.province || "",
          "Postal Code": c.postal_code || "",
          "Job Category": c.job_categories?.name || "",
          Industry: c.job_industries?.name || "",
          "Verification Status": c.verification_status || "",
          "Permit Status": c.permit_status || "",
          "Shift Preference": c.shift_preference || "",
          "Available From": c.available_from || "",
          "Assigned Date": formatDate(m.assigned_at),
          "Resume URL": c.resume_url || "",
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Shortlisted");
      const colWidths = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length + 2, 16) }));
      ws["!cols"] = colWidths;
      const groupName =
        groups.find((g) => g.id === selectedGroupId)?.name || "candidates";
      XLSX.writeFile(
        wb,
        `JBR_${groupName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showToast({ type: "success", message: `Exported ${allMembers.length} rows to Excel.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Excel export failed.";
      showToast({ type: "error", message });
    }
  };

  /* ─── SELECTION ── */
  const toggleRow = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () =>
    setSelectedIds((prev) =>
      prev.length === displayedMembers.length && displayedMembers.length > 0
        ? []
        : displayedMembers.map((m) => m.candidates.id)
    );

  /* ─── RESET FILTERS ── */
  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("");
    setJobCategoryFilter("");
    setGenderFilter("");
    setProvinceFilter("");
    setCityFilter("");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filterStatus !== "" ||
    jobCategoryFilter !== "" ||
    genderFilter !== "" ||
    provinceFilter !== "" ||
    cityFilter !== "";

  /* ─── PAGINATION ── */
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, total);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const tableGridTemplate = "40px 1.4fr 1.8fr 1.3fr 1.2fr 0.9fr 1fr 110px";

  const isClientFiltered = hasActiveFilters;
  const displayTotal = isClientFiltered ? displayedMembers.length : total;

  return (
    <>
      <style suppressHydrationWarning>{GLOBAL_CSS}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeTab="shortlisted"
          setActiveTab={() => {}}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <TopNav />

          <main
            style={{
              padding: "40px",
              maxWidth: "1600px",
              margin: "0 auto",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "32px",
            }}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "42px",
                  fontWeight: 600,
                  color: C.textHeading,
                  marginBottom: "8px",
                  letterSpacing: "-0.5px",
                }}
              >
                <UserCheck size={32} color={C.red} strokeWidth={2} />{" "}
                {selectedGroup ? selectedGroup.name : "Shortlisted Candidates"}
              </h1>
              <p style={{ fontSize: "15px", color: C.textMuted }}>
                {selectedGroup
                  ? `Viewing members of "${selectedGroup.name}". Clear the group filter to start over.`
                  : "Select a group to view and manage shortlisted candidates."}
              </p>
            </motion.div>

            {/* Filters Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="clean-card"
              style={{ padding: "28px 32px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3
                    style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, marginBottom: "4px" }}
                  >
                    Filters
                  </h3>
                  <p style={{ fontSize: "13px", color: C.textMuted }}>
                    Filter candidates by group and other criteria
                  </p>
                </div>
                {hasActiveFilters && (
                  <motion.button
                    whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
                    whileTap={{ scale: 0.97 }}
                    onClick={resetFilters}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 14px",
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      color: C.textMuted,
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <X size={13} /> Clear Filters
                  </motion.button>
                )}
              </div>

              {/* Group Selector */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: C.textLabel,
                    marginBottom: "8px",
                  }}
                >
                  Group <span style={{ color: C.red }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  {groupsLoading && (
                    <Loader2
                      size={14}
                      color={C.textHint}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        animation: "spin 1s linear infinite",
                        zIndex: 1,
                      }}
                    />
                  )}
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    disabled={groupsLoading}
                    style={{
                      width: "100%",
                      background: selectedGroupId ? C.redActiveBg : C.inputBg,
                      border: `1px solid ${selectedGroupId ? C.red : C.border}`,
                      borderRadius: "8px",
                      padding: "12px 36px 12px 16px",
                      color: selectedGroupId ? C.red : C.textHint,
                      fontSize: "14px",
                      fontWeight: selectedGroupId ? 600 : 400,
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <option value="">
                      {groupsLoading ? "Loading groups..." : "Select a group to view candidates"}
                    </option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                        {typeof g.member_count === "number" ? ` (${g.member_count} members)` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    color={selectedGroupId ? C.red : C.textHint}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>

              {/* Row 1: Search + Verification Status + Job Category + Gender */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "20px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: C.textLabel,
                      marginBottom: "8px",
                    }}
                  >
                    Search
                  </label>
                  <div style={{ position: "relative" }}>
                    <Search
                      size={16}
                      color={C.textHint}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Name, email, or phone…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: "8px",
                        padding: "10px 16px 10px 36px",
                        color: C.textBody,
                        fontSize: "14px",
                        outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = C.red)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </div>
                </div>

                <SelectFilter
                  label="Verification Status"
                  value={filterStatus}
                  onChange={setFilterStatus}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </SelectFilter>

                <SelectFilter
                  label="Job Category"
                  value={jobCategoryFilter}
                  onChange={setJobCategoryFilter}
                  loading={jobCategoriesLoading}
                >
                  <option value="">All Categories</option>
                  {jobCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </SelectFilter>

                <SelectFilter
                  label="Gender"
                  value={genderFilter}
                  onChange={setGenderFilter}
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </SelectFilter>
              </div>

              {/* Row 2: Province + City */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: C.textLabel,
                      marginBottom: "8px",
                    }}
                  >
                    Province
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. British Columbia"
                    value={provinceFilter}
                    onChange={(e) => setProvinceFilter(e.target.value)}
                    style={{
                      width: "100%",
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: "8px",
                      padding: "10px 16px",
                      color: C.textBody,
                      fontSize: "14px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.red)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: C.textLabel,
                      marginBottom: "8px",
                    }}
                  >
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surrey"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    style={{
                      width: "100%",
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: "8px",
                      padding: "10px 16px",
                      color: C.textBody,
                      fontSize: "14px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.red)}
                    onBlur={(e) => (e.target.style.borderColor = C.border)}
                  />
                </div>
              </div>
            </motion.div>

            {/* Table Card */}
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="clean-card"
              style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {/* Controls */}
              <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}` }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: 600,
                        color: C.textHeading,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {selectedGroup ? selectedGroup.name : "Candidates"}
                      <span style={{ color: C.redBright, fontSize: "18px" }}>
                        ({displayTotal})
                      </span>
                    </h3>
                    <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "4px" }}>
                      {!selectedGroupId
                        ? "Select a group above to view candidates"
                        : membersLoading
                        ? "Loading…"
                        : displayTotal === 0
                        ? hasActiveFilters
                          ? "No members match the selected filters"
                          : "No members found"
                        : "Showing results from selection"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: C.textLabel, fontWeight: 500 }}>
                      Rows per page:
                    </span>
                    <div style={{ position: "relative" }}>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        style={{
                          background: C.inputBg,
                          border: `1px solid ${C.border}`,
                          borderRadius: "6px",
                          padding: "8px 28px 8px 12px",
                          color: C.textBody,
                          fontSize: "13px",
                          outline: "none",
                        }}
                      >
                        {[10, 25, 50, 100].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        color={C.textHint}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bulk Actions */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <motion.button
                    onClick={downloadExcel}
                    whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      color: C.textLabel,
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <FileSpreadsheet size={16} /> Download Excel ({total})
                  </motion.button>

                  {!hasInvalidSelectionForVerify && (
                    <motion.button
                      onClick={bulkVerify}
                      disabled={!selectedIds.length}
                      whileHover={
                        selectedIds.length
                          ? {
                              backgroundColor: C.successBg,
                              borderColor: C.successText,
                              color: C.successText,
                            }
                          : {}
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        background: "transparent",
                        border: `1px solid ${C.border}`,
                        borderRadius: "6px",
                        color: selectedIds.length ? C.textHeading : C.textHint,
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: selectedIds.length ? "pointer" : "not-allowed",
                        transition: "all 0.2s",
                        opacity: selectedIds.length ? 1 : 0.5,
                      }}
                    >
                      <CheckCheck size={16} /> Bulk Verify ({selectedIds.length})
                    </motion.button>
                  )}

                  <motion.button
                    onClick={() => setIsMessageModalOpen(true)}
                    disabled={!selectedIds.length}
                    whileHover={
                      selectedIds.length
                        ? { backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }
                        : {}
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      color: selectedIds.length ? C.textHeading : C.textHint,
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: selectedIds.length ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      opacity: selectedIds.length ? 1 : 0.5,
                    }}
                  >
                    <MessageCircle size={16} /> Send Message ({selectedIds.length})
                  </motion.button>

                  <motion.button
                    onClick={bulkRemoveFromGroup}
                    disabled={!selectedIds.length}
                    whileHover={
                      selectedIds.length
                        ? { backgroundColor: C.alertBg, borderColor: C.red, color: C.red }
                        : {}
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      color: selectedIds.length ? C.textHeading : C.textHint,
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: selectedIds.length ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      opacity: selectedIds.length ? 1 : 0.5,
                    }}
                  >
                    <Trash2 size={16} /> Remove from Group ({selectedIds.length})
                  </motion.button>
                </div>
              </div>

              {/* Table */}
              <div className="table-container">
                <div className="table-min-width">
                  {/* Headers */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: tableGridTemplate,
                      padding: "14px 32px",
                      borderBottom: `1px solid ${C.border}`,
                      background: C.inputBg,
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={toggleAll}
                      style={{
                        background: "none",
                        border: "none",
                        color: C.textHint,
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      {selectedIds.length === displayedMembers.length &&
                      displayedMembers.length > 0 ? (
                        <CheckSquare size={16} color={C.red} />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                    {["Name", "Email", "Phone", "Job Category", "Status", "Assigned Date", "Actions"].map(
                      (h) => (
                        <span
                          key={h}
                          style={{
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            color: C.textHint,
                            fontWeight: 600,
                          }}
                        >
                          {h}
                        </span>
                      )
                    )}
                  </div>

                  {/* Body */}
                  {!selectedGroupId ? (
                    <div
                      style={{
                        padding: "70px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Users size={44} color={C.textHint} strokeWidth={1.5} />
                      <p style={{ color: C.textMuted, fontSize: "15px", fontWeight: 500 }}>
                        Select a group to view candidates
                      </p>
                    </div>
                  ) : membersLoading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "60px",
                        gap: "12px",
                        color: C.textMuted,
                      }}
                    >
                      <Loader2
                        size={20}
                        style={{ animation: "spin 1s linear infinite", color: C.red }}
                      />
                      <span style={{ fontSize: "14px" }}>Loading members...</span>
                    </div>
                  ) : displayedMembers.length === 0 ? (
                    <div
                      style={{
                        padding: "70px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Users size={44} color={C.textHint} strokeWidth={1.5} />
                      <p style={{ color: C.textMuted, fontSize: "15px", fontWeight: 500 }}>
                        {hasActiveFilters ? "No members match the selected filters" : "No members found"}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {displayedMembers.map((member, idx) => {
                        const c = member.candidates;
                        const employeeId = c.id;
                        const isSelected = selectedIds.includes(employeeId);
                        const fullName =
                          `${c.first_name || ""} ${c.last_name || ""}`.trim() || "—";
                        const badge = getVerificationBadge(c.verification_status);
                        const statusLower = c.verification_status?.toLowerCase();

                        return (
                          <motion.div
                            key={member.id}
                            variants={itemVars}
                            whileHover={{ backgroundColor: isSelected ? undefined : C.inputBg }}
                            style={{
                              display: "grid",
                              gridTemplateColumns: tableGridTemplate,
                              alignItems: "center",
                              padding: "16px 32px",
                              borderBottom:
                                idx !== displayedMembers.length - 1
                                  ? `1px solid ${C.border}`
                                  : "none",
                              background: isSelected ? C.redActiveBg : "transparent",
                              transition: "background-color 0.2s",
                            }}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleRow(employeeId)}
                              style={{
                                background: "none",
                                border: "none",
                                color: isSelected ? C.red : C.textHint,
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                              }}
                            >
                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>

                            {/* Name */}
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: C.textHeading,
                                lineHeight: 1.4,
                              }}
                            >
                              <div>{c.first_name}</div>
                              <div>{c.last_name}</div>
                            </div>

                            {/* Email */}
                            <div
                              style={{
                                fontSize: "13px",
                                color: C.textMuted,
                                wordBreak: "break-all",
                                paddingRight: "16px",
                              }}
                            >
                              {c.email || "—"}
                            </div>

                            {/* Phone */}
                            <div style={{ fontSize: "13px", color: C.textMuted }}>
                              {c.phone_number || "—"}
                            </div>

                            {/* Job Category */}
                            <div
                              style={{ fontSize: "13px", color: C.textBody, fontWeight: 500 }}
                            >
                              {c.job_categories?.name || "—"}
                            </div>

                            {/* Status */}
                            <div>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  background: badge.bg,
                                  color: badge.color,
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  letterSpacing: "0.5px",
                                  textTransform: "uppercase",
                                }}
                              >
                                {badge.label}
                              </div>
                            </div>

                            {/* Assigned Date */}
                            <div
                              style={{
                                fontSize: "13px",
                                color: C.textMuted,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Calendar size={13} />
                              {member.assigned_at ? formatDate(member.assigned_at) : "—"}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              {/* View */}
                              <motion.button
                                whileHover={{
                                  scale: 1.1,
                                  backgroundColor: C.redActiveBg,
                                  color: C.red,
                                  borderColor: C.red,
                                }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                  background: "transparent",
                                  border: `1px solid ${C.border}`,
                                  borderRadius: "6px",
                                  color: C.textHint,
                                  cursor: "pointer",
                                  padding: "7px",
                                  display: "flex",
                                  transition: "all 0.2s",
                                }}
                                title="View"
                              >
                                <Eye size={14} />
                              </motion.button>
                              
                              {/* Chat */}
                              <motion.button
                                onClick={() => handleOpenChat(member)}
                                disabled={openingChatId === employeeId}
                                whileHover={
                                  openingChatId === employeeId
                                    ? {}
                                    : {
                                        scale: 1.1,
                                        backgroundColor: C.pendingBg,
                                        color: C.pendingText,
                                        borderColor: C.pendingText,
                                      }
                                }
                                whileTap={openingChatId === employeeId ? {} : { scale: 0.9 }}
                                style={{
                                  background: "transparent",
                                  border: `1px solid ${C.border}`,
                                  borderRadius: "6px",
                                  color: C.textHint,
                                  cursor: openingChatId === employeeId ? "not-allowed" : "pointer",
                                  padding: "7px",
                                  display: "flex",
                                  transition: "all 0.2s",
                                }}
                                title="Open Chat"
                              >
                                {openingChatId === employeeId ? (
                                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                                ) : (
                                  <MessageCircle size={14} />
                                )}
                              </motion.button>

                              {/* Verify */}
                              {statusLower !== "verified" && statusLower !== "shortlisted" && (
                                <motion.button
                                  onClick={() => verifyEmployee(employeeId)}
                                  whileHover={{
                                    scale: 1.1,
                                    backgroundColor: C.successBg,
                                    color: C.successText,
                                    borderColor: C.successText,
                                  }}
                                  whileTap={{ scale: 0.9 }}
                                  style={{
                                    background: "transparent",
                                    border: `1px solid ${C.border}`,
                                    borderRadius: "6px",
                                    color: C.textHint,
                                    cursor: "pointer",
                                    padding: "7px",
                                    display: "flex",
                                    transition: "all 0.2s",
                                  }}
                                  title="Verify"
                                >
                                  <CheckCheck size={14} />
                                </motion.button>
                              )}

                              {/* Remove */}
                              <motion.button
                                onClick={() => setRemoveTarget({ id: employeeId, name: fullName })}
                                whileHover={{
                                  scale: 1.1,
                                  backgroundColor: C.alertBg,
                                  color: C.redBright,
                                  borderColor: C.redBright,
                                }}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                  background: "transparent",
                                  border: `1px solid ${C.border}`,
                                  borderRadius: "6px",
                                  color: C.textHint,
                                  cursor: "pointer",
                                  padding: "7px",
                                  display: "flex",
                                  transition: "all 0.2s",
                                }}
                                title="Remove from Group"
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {total > 0 && (
                <div
                  style={{
                    padding: "16px 32px",
                    borderTop: `1px solid ${C.border}`,
                    background: C.inputBg,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: C.textMuted }}>
                    {isClientFiltered ? (
                      <>
                        Showing{" "}
                        <strong style={{ color: C.textHeading }}>{displayTotal}</strong> filtered
                        members
                      </>
                    ) : (
                      <>
                        Showing{" "}
                        <strong style={{ color: C.textHeading }}>{startIndex}</strong>–
                        <strong style={{ color: C.textHeading }}>{endIndex}</strong> of {total}{" "}
                        members
                      </>
                    )}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "8px 12px",
                        background: "transparent",
                        border: "none",
                        color: currentPage === 1 ? C.textHint : C.textLabel,
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page =
                        totalPages <= 5
                          ? i + 1
                          : currentPage <= 3
                          ? i + 1
                          : currentPage >= totalPages - 2
                          ? totalPages - 4 + i
                          : currentPage - 2 + i;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: currentPage === page ? C.red : C.surface,
                            border: `1px solid ${currentPage === page ? C.red : C.border}`,
                            borderRadius: "6px",
                            color: currentPage === page ? "#fff" : C.textHeading,
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "8px 12px",
                        background: "transparent",
                        border: "none",
                        color: currentPage >= totalPages ? C.textHint : C.textLabel,
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                      }}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Remove from Group Modal */}
      <AnimatePresence>
        {removeTarget && (
          <RemoveModal
            name={removeTarget.name}
            onClose={() => setRemoveTarget(null)}
            onConfirm={handleRemoveConfirm}
            loading={removeLoading}
          />
        )}
      </AnimatePresence>

      {/* Bulk Message Modal */}
      <AnimatePresence>
        {isMessageModalOpen && (
          <BulkMessageModal
            count={selectedIds.length}
            onClose={() => setIsMessageModalOpen(false)}
            onSend={sendBulkMessage}
            sending={isSendingMessages}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <ToastNotification toast={toast} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}



