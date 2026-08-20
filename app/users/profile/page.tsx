"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Paperclip, Smile, CheckCheck, Check, Search,
  Loader2, AlertTriangle, RefreshCw, X, Image as ImageIcon, FileText, Mic,
  Maximize, Minimize, Clock, ShieldCheck, Upload, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:          "#F0F2F5",
  surface:     "#FFFFFF",
  red:         "#C62828",
  redBright:   "#E53935",
  redGlow:     "rgba(229,57,53,0.18)",
  redActiveBg: "rgba(198,40,40,0.07)",
  textHeading: "#111111",
  textBody:    "#1A1A1A",
  textLabel:   "#374151",
  textMuted:   "#6B7280",
  textHint:    "#9BA3AF",
  border:      "rgba(0,0,0,0.07)",
  borderHover: "rgba(0,0,0,0.14)",
  inputBg:     "#F4F6F8",
  msgSent:         "#C62828",
  msgSentText:     "#FFFFFF",
  msgReceived:     "#FFFFFF",
  msgReceivedText: "#1A1A1A",
  chatBg:          "#ECE5DD",
  pendingBg:       "rgba(59,130,246,0.08)",
  pendingText:     "#3B82F6",
  alertBg:         "rgba(198,40,40,0.08)",
  alertText:       "#C62828",
  shadow:          "rgba(0,0,0,0.06)",
  shadowMd:        "rgba(0,0,0,0.10)",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${C.bg}; font-family: 'Inter', sans-serif; color: ${C.textBody}; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lineGrow {
    from { width: 0; }
    to   { width: 40px; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  @keyframes modalIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes pulseDot {
    0%   { box-shadow: 0 0 0 0 rgba(198,40,40,0.45); }
    70%  { box-shadow: 0 0 0 6px rgba(198,40,40,0); }
    100% { box-shadow: 0 0 0 0 rgba(198,40,40,0); }
  }

  .card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 16px;
    overflow: hidden;
  }

  .row-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 13px 20px;
    border-bottom: 1px solid ${C.border};
    transition: background 0.15s ease;
  }
  .row-item:last-child { border-bottom: none; }
  .row-item:hover { background: ${C.inputBg}; }

  .tab-btn {
    padding: 9px 20px;
    border-radius: 9px;
    border: none;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    letter-spacing: 0.3px;
    position: relative;
  }
  .tab-btn.active   { background: ${C.red}; color: #fff; }
  .tab-btn.inactive { background: transparent; color: ${C.textMuted}; }
  .tab-btn.inactive:hover { background: ${C.inputBg}; color: ${C.textBody}; }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 11px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .day-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px; height: 36px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    border: 1.5px solid transparent;
  }
  .day-pill.active  { background: ${C.red}; color: #fff; border-color: ${C.red}; }
  .day-pill.inactive { background: ${C.inputBg}; color: ${C.textHint}; border-color: ${C.border}; }

  .form-input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 9px;
    border: 1.5px solid ${C.border};
    background: ${C.inputBg};
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: ${C.textBody};
    outline: none;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .form-input:focus {
    border-color: ${C.red};
    background: ${C.surface};
  }
  .form-input::placeholder { color: ${C.textHint}; }

  .form-select {
    width: 100%;
    padding: 10px 14px;
    border-radius: 9px;
    border: 1.5px solid ${C.border};
    background: ${C.inputBg};
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: ${C.textBody};
    outline: none;
    transition: border-color 0.15s ease;
    appearance: none;
    cursor: pointer;
  }
  .form-select:focus { border-color: ${C.red}; background: ${C.surface}; }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fadeIn 0.2s ease;
  }
  .modal-box {
    background: ${C.surface};
    border-radius: 20px;
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalIn 0.25s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  }
  .modal-box::-webkit-scrollbar { width: 4px; }
  .modal-box::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
`;

const SHIFT_MAP: Record<string, string> = {
  morning_shift:   "Morning Shift (6 AM – 2 PM)",
  afternoon_shift: "Afternoon Shift (2 PM – 10 PM)",
  night_shift:     "Night Shift (10 PM – 6 AM)",
  rotating_shift:  "Rotating Shift",
  split_shift:     "Split Shift",
  on_call:         "On-Call / Flexible",
  day_shift:       "Day Shift",
};
const PERMIT_MAP: Record<string, string> = {
  citizen:                  "Canadian Citizen",
  permanent_resident:       "Permanent Resident",
  open_work_permit:         "Work Permit – Open",
  employer_specific_permit: "Work Permit – Employer Specific",
  pending:                  "Pending / In Progress",
  student_coop:             "Student Visa (Co-op)",
  approved:                 "Approved",
  other:                    "Other",
};
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ALL_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ApiProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  gender: string;
  date_of_birth: string;
  city: string;
  province: string;
  postal_code: string;
  resume_url: string | null;
  campaign_id: number;
  status: string;
  email_verified: boolean;
  available_from: string;
  permit_status: string;
  shift_preference: string;
  license_required: boolean;
  license_expiry_month: number | null;
  license_expiry_year: number | null;
  job_category_id: string | null;
  job_industry_id: string | null;
  created_at: string;
  updated_at: string;
  sin_number?: string | null;
  bank_account_number?: string | null;
}

interface ApiUser {
  type: string;
  email: string;
  verificationId: string;
  status: string;
  message: string;
  profile: ApiProfile;
}

interface ApiResponse {
  success: boolean;
  user: ApiUser;
}

interface UpdatePayload {
  first_name?:           string;
  last_name?:            string;
  phone_number?:         string | null;
  gender?:               string;
  date_of_birth?:        string;
  city?:                 string;
  province?:             string;
  postal_code?:          string;
  available_from?:       string;
  permit_status?:        string;
  shift_preference?:     string;
  license_required?:     boolean;
  license_expiry_month?: number | null;
  license_expiry_year?:  number | null;
  job_category_id?:      string | null;
  job_industry_id?:      string | null;
}

interface ChatMessage {
  id: string;
  session_id: string;
  employee_id: string;
  message_text: string;
  message_type: string;
  media_url: string | null;
  sender_type: "employee" | "vendor" | "admin";
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── NEW: Document status types ───────────────────────────────────────────────
interface DocStatus {
  sinExists: boolean;
  bankExists: boolean;
  loading: boolean;
  checked: boolean;
}

// ─── TOKEN HELPER ─────────────────────────────────────────────────────────────
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jbr_token_user");
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-CA", { month:"long", day:"numeric", year:"numeric" });
}
function fmtShort(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-CA", { month:"short", day:"numeric", year:"numeric" });
}
function age(dob: string | null | undefined) {
  if (!dob) return "N/A";
  const b = new Date(dob), today = new Date();
  let a = today.getFullYear() - b.getFullYear();
  if (today < new Date(today.getFullYear(), b.getMonth(), b.getDate())) a--;
  return a;
}
function genderLabel(g: string | null | undefined) {
  if (!g) return "—";
  return ({ M:"Male", F:"Female", m:"Male", f:"Female" }[g]) ?? g;
}
const formatTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Today";
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function SectionHead({ title }: { title: string }) {
  return (
    <p style={{ fontSize:11, letterSpacing:1.8, textTransform:"uppercase", fontWeight:700, color:C.textLabel, marginBottom:12 }}>
      {title}
    </p>
  );
}

function InfoRow({ label, value, accent }: { label:string; value:React.ReactNode; accent?:boolean }) {
  return (
    <div className="row-item">
      <span style={{ fontSize:13, color:C.textMuted }}>{label}</span>
      {typeof value === "string"
        ? <span style={{ fontSize:13, fontWeight:600, color:accent?C.red:C.textBody, textAlign:"right", maxWidth:"60%" }}>{value}</span>
        : value}
    </div>
  );
}

function StatusChip({ status }: { status: string | null }) {
  if (!status) return <span className="chip" style={{ background:C.inputBg, color:C.textMuted }}>—</span>;
  const map: Record<string,{bg:string;color:string}> = {
    pending:        { bg:"#FEF3C7", color:"#92400E" },
    approved:       { bg:"#D1FAE5", color:"#065F46" },
    verified:       { bg:"#D1FAE5", color:"#065F46" },
    rejected:       { bg:"#FEE2E2", color:"#991B1B" },
    email_verified: { bg:"#DBEAFE", color:"#1D4ED8" },
  };
  const s = map[status] ?? { bg:C.inputBg, color:C.textMuted };
  return <span className="chip" style={{ background:s.bg, color:s.color }}>{status.replace(/_/g," ")}</span>;
}

function PermitChip({ permit }: { permit: string | null }) {
  if (!permit) return <span className="chip" style={{ background:C.inputBg, color:C.textMuted }}>Not Specified</span>;
  const label = PERMIT_MAP[permit] ?? permit;
  const isCitizen = permit==="citizen", isApproved = permit==="approved", isOpen = permit.includes("open");
  const bg    = isCitizen?"#EFF6FF":isApproved||isOpen?"#F0FDF4":"#FFF7ED";
  const color = isCitizen?"#1D4ED8":isApproved||isOpen?"#15803D":"#C2410C";
  return <span className="chip" style={{ background:bg, color }}>{label}</span>;
}

function Skeleton({ h, w, radius }: { h:number; w?:string|number; radius?:number }) {
  return (
    <div style={{
      height:h, width:w??"100%", borderRadius:radius??8,
      background:"linear-gradient(90deg,#f0f2f5 25%,#e8eaed 50%,#f0f2f5 75%)",
      backgroundSize:"200% 100%",
      animation:"shimmer 1.4s infinite linear",
    }}/>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:C.textLabel }}>{label}</label>
      {children}
    </div>
  );
}

// ─── CHAT COMPONENT (EMPLOYEE SIDE) ───────────────────────────────────────────
function EmployeeChat({ profile, token }: { profile: ApiProfile; token: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const markReadInFlightRef = useRef(false);

  const BASE_URL = "https://jbrstaffingsolutions.com/api";
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isFullScreen]);

  const markMessagesAsRead = useCallback(async (sId: string) => {
    if (!sId || !profile.id) return;
    if (markReadInFlightRef.current) return;
    markReadInFlightRef.current = true;
    try {
      await fetch(
        `${BASE_URL}/chat/messages/${sId}/mark-read?employee_id=${encodeURIComponent(profile.id)}`,
        { method: "PATCH", headers: authHeaders }
      );
      setMessages(prev =>
        prev.map(msg =>
          (msg.sender_type === "vendor" || msg.sender_type === "admin") && !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.warn("mark-read failed:", err);
    } finally {
      markReadInFlightRef.current = false;
    }
  }, [profile.id, token]);

  useEffect(() => {
    let cancelled = false;
    const createSession = async () => {
      if (!profile.phone || !profile.campaign_id) {
        setSessionError("Missing profile details (phone or campaign) to start chat.");
        return;
      }
      setCreatingSession(true);
      setSessionError(null);
      try {
        let sId = null;
        try {
          const getRes = await fetch(
            `${BASE_URL}/chat/sessions/employee/${profile.id}?mobile_number=${encodeURIComponent(profile.phone)}`,
            { headers: authHeaders }
          );
          if (getRes.ok) {
            const getJson = await getRes.json();
            if (getJson?.data?.id) sId = getJson.data.id;
          }
        } catch (e) {
          console.warn("Failed to GET existing session, falling back to POST", e);
        }

        if (!sId) {
          const postRes = await fetch(`${BASE_URL}/chat/sessions/start`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              employee_id: profile.id,
              mobile_number: profile.phone,
              campaign_id: profile.campaign_id,
              job_category_id: profile.job_category_id,
            }),
          });
          if (!postRes.ok) throw new Error(`Error ${postRes.status}`);
          const postJson = await postRes.json();
          sId = postJson?.data?.id;
        }
        if (cancelled) return;
        if (!sId) throw new Error("Could not initialize chat session.");
        setSessionId(sId);
      } catch (err: any) {
        if (!cancelled) setSessionError(err.message || "Failed to start chat.");
      } finally {
        if (!cancelled) setCreatingSession(false);
      }
    };
    createSession();
    return () => { cancelled = true; };
  }, [profile.id, profile.phone, profile.campaign_id, profile.job_category_id, token]);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!sessionId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const qs = new URLSearchParams({ limit: "50", offset: "0", employee_id: profile.id });
      const res = await fetch(`${BASE_URL}/chat/messages/${sessionId}?${qs.toString()}`, { headers: authHeaders });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      const data: ChatMessage[] = (json.data || [])
        .slice()
        .sort((a: ChatMessage, b: ChatMessage) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(data);
      setMessagesError(null);

      const hasUnreadIncoming = data.some(
        msg => (msg.sender_type === "vendor" || msg.sender_type === "admin") && !msg.read_at
      );
      if (hasUnreadIncoming) {
        markMessagesAsRead(sessionId);
      }
    } catch (err: any) {
      if (!silent) setMessagesError(err.message || "Failed to load messages.");
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [sessionId, profile.id, token, markMessagesAsRead]);

  useEffect(() => {
    if (!sessionId) return;
    fetchMessages(false);
    pollRef.current = setInterval(() => fetchMessages(true), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, fetchMessages]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && sessionId) {
        const hasUnread = messages.some(
          msg => (msg.sender_type === "vendor" || msg.sender_type === "admin") && !msg.read_at
        );
        if (hasUnread) markMessagesAsRead(sessionId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sessionId, messages, markMessagesAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setShowAttachMenu(false);
    }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if ((!text && !selectedFile) || !sessionId || sending) return;
    setSending(true);
    setSendError(null);
    setInputText("");

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("session_id", sessionId);
        formData.append("employee_id", profile.id);
        formData.append("message_text", text);
        formData.append("sender_type", "employee");
        formData.append("file", selectedFile);
        res = await fetch(`${BASE_URL}/chat/messages/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        res = await fetch(`${BASE_URL}/chat/messages/send`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            session_id: sessionId,
            employee_id: profile.id,
            message_text: text,
            message_type: "text",
            sender_type: "employee",
          }),
        });
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      
      if (json?.data) {
        setMessages(prev => [...prev, json.data]);
      } else {
        fetchMessages(true);
      }
      setSelectedFile(null);
    } catch (err: any) {
      setSendError(err.message || "Failed to send message.");
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canCompose = !!sessionId && !creatingSession;

  const displayedMessages = messages.filter(msg => {
    if (!searchQuery.trim()) return true;
    return msg.message_text?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const dateLabel = displayedMessages.length 
    ? formatDateLabel(displayedMessages[0].created_at) 
    : messages.length 
      ? formatDateLabel(messages[0].created_at) 
      : "Today";

  if (sessionError && !sessionId && !creatingSession) {
    return (
      <div className="card" style={{ padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", animation: "fadeUp 0.3s ease" }}>
        <AlertTriangle size={40} color={C.red} />
        <div style={{ fontSize: "15px", fontWeight: 600, color: C.textHeading }}>{sessionError}</div>
      </div>
    );
  }

  return (
    <div className={isFullScreen ? "" : "card"} style={{ display: "flex", flexDirection: "column", ...(isFullScreen ? { position: "fixed", inset: 0, zIndex: 9999, background: C.surface, borderRadius: 0, animation: "modalIn 0.3s cubic-bezier(0.4,0,0.2,1)" } : { height: "65vh", minHeight: "500px", animation: "fadeUp 0.3s ease", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden" }) }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${C.textHeading}, ${C.textLabel})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 700 }}>JBR</div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: C.textHeading }}>JBR Support</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(""); }} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: isSearchOpen ? C.redActiveBg : "transparent", border: `1px solid ${isSearchOpen ? C.red : C.border}`, borderRadius: "8px", color: isSearchOpen ? C.red : C.textMuted, cursor: "pointer", transition: "all 0.2s" }}><Search size={14} /></button>
          <button onClick={() => setIsFullScreen(!isFullScreen)} title={isFullScreen ? "Minimize" : "Full Screen"} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textMuted, cursor: "pointer", transition: "all 0.2s" }}>{isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", flexShrink: 0, zIndex: 9 }}>
            <div style={{ padding: "10px 24px", background: C.inputBg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
              <Search size={14} color={C.textMuted} />
              <input autoFocus type="text" placeholder="Search in conversation..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: C.textBody, fontFamily: "'Inter', sans-serif" }} />
              {searchQuery && (<button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex" }}><X size={14} /></button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {creatingSession && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: C.pendingBg, color: C.pendingText, fontSize: "13px", fontWeight: 500, flexShrink: 0 }}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Connecting to chat server…
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0", background: C.chatBg, backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {loadingMessages && messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "60px 0", color: C.textMuted }}>
              <Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: C.red }} />
              <span style={{ fontSize: "13px" }}>Loading conversation…</span>
            </div>
          ) : messagesError && messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "60px 0", color: C.textMuted, textAlign: "center" }}>
              <AlertTriangle size={22} color={C.red} />
              <span style={{ fontSize: "13px", maxWidth: "320px" }}>{messagesError}</span>
              <button onClick={() => fetchMessages(false)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}><RefreshCw size={14} /> Retry</button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", margin: "12px 0" }}><span style={{ fontSize: "12px", color: C.textMuted, background: "rgba(255,255,255,0.85)", padding: "4px 14px", borderRadius: "12px", fontWeight: 500, boxShadow: `0 1px 2px ${C.shadow}` }}>{dateLabel}</span></div>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textMuted, fontSize: "13px", padding: "40px 0", background: "rgba(255,255,255,0.8)", borderRadius: "12px", width: "fit-content", margin: "0 auto" }}>No messages yet. Send a message to reach out to the agency.</div>
              ) : displayedMessages.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textMuted, fontSize: "13px", padding: "40px 0", background: "rgba(255,255,255,0.8)", borderRadius: "12px", width: "fit-content", margin: "0 auto" }}>No messages found matching "{searchQuery}".</div>
              ) : (
                displayedMessages.map((msg, idx) => {
                  const isMe = msg.sender_type === "employee";
                  const prevMsg = displayedMessages[idx - 1];
                  const isSameGroup = !!prevMsg && prevMsg.sender_type === msg.sender_type;
                  const originalIdx = messages.findIndex(m => m.id === msg.id);
                  const vendorRepliedAfter = isMe && messages.slice(originalIdx + 1).some(m => m.sender_type === "vendor" || m.sender_type === "admin");
                  const isDelivered = isMe && !!msg.id;
                  const isReadByVendor = isMe && (!!msg.read_at || vendorRepliedAfter);

                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginTop: isSameGroup ? "2px" : "10px", paddingLeft: isMe ? "60px" : "0", paddingRight: isMe ? "0" : "60px" }}>
                      {!isMe && !isSameGroup && (<div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${C.textHeading}, ${C.textLabel})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 700, marginRight: "8px", alignSelf: "flex-end" }}>JBR</div>)}
                      {!isMe && isSameGroup && <div style={{ width: "36px", flexShrink: 0 }} />}
                      <div style={{ maxWidth: "65%", padding: "9px 14px", borderRadius: isMe ? "12px 2px 12px 12px" : "2px 12px 12px 12px", background: isMe ? C.msgSent : C.msgReceived, color: isMe ? C.msgSentText : C.msgReceivedText, boxShadow: `0 1px 2px ${C.shadow}` }}>
                        {msg.media_url && (
                          <div style={{ marginBottom: msg.message_text ? '6px' : '0' }}>
                            {msg.message_type === 'image' || msg.media_url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                              <a href={msg.media_url} target="_blank" rel="noopener noreferrer"><img src={msg.media_url} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover', display: 'block' }} /></a>
                            ) : (
                              <a href={msg.media_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', color: 'inherit', textDecoration: 'none', fontSize: '13px' }}><FileText size={16} /> Document</a>
                            )}
                          </div>
                        )}
                        {msg.message_text && (<div style={{ fontSize: "14px", lineHeight: 1.5, wordBreak: "break-word" }}>{msg.message_text}</div>)}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "3px", marginTop: "5px", minHeight: "16px" }}>
                          <span style={{ fontSize: "11px", lineHeight: "13px", color: isMe ? "rgba(255,255,255,0.72)" : C.textHint }}>{formatTime(msg.created_at)}</span>
                          {isMe && (<span style={{ display: "inline-flex", alignItems: "center", color: isReadByVendor ? "#4FC3F7" : "rgba(255,255,255,0.75)" }}>{isDelivered ? isReadByVendor ? <CheckCheck size={13} /> : <CheckCheck size={13} /> : <Check size={13} />}</span>)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {sendError && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 24px", background: C.alertBg, color: C.alertText, fontSize: "13px", fontWeight: 500, flexShrink: 0 }}>
          <span>{sendError}</span>
          <button onClick={() => setSendError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.alertText, padding: "2px", display: "flex" }}><X size={14} /></button>
        </div>
      )}
      <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "12px 24px", flexShrink: 0 }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", display: "flex", alignItems: "flex-end", gap: "10px" }}>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
          <div style={{ position: "relative" }}>
            <motion.button whileHover={{ backgroundColor: C.redActiveBg, color: C.red }} whileTap={{ scale: 0.95 }} onClick={() => setShowAttachMenu(prev => !prev)} disabled={!canCompose} style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "10px", color: C.textMuted, cursor: canCompose ? "pointer" : "not-allowed", opacity: canCompose ? 1 : 0.5, transition: "all 0.2s", flexShrink: 0 }}><Paperclip size={18} /></motion.button>
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} style={{ position: "absolute", bottom: "52px", left: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", boxShadow: `0 8px 32px ${C.shadowMd}`, padding: "8px", minWidth: "160px", zIndex: 100 }}>
                  {[
                    { icon: <ImageIcon size={16} />, label: "Photo / Video", accept: "image/*,video/*" },
                    { icon: <FileText size={16} />, label: "Document", accept: ".pdf,.doc,.docx,.txt" },
                    { icon: <Mic size={16} />, label: "Audio", accept: "audio/*" },
                  ].map(item => (
                    <button key={item.label} onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = item.accept; fileInputRef.current.click(); } setShowAttachMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", background: "transparent", border: "none", borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => (e.currentTarget.style.background = C.inputBg)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><span style={{ color: C.red }}>{item.icon}</span>{item.label}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", gap: "8px" }}>
            {selectedFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: '8px', width: 'fit-content' }}>
                <span style={{ fontSize: '12px', color: C.textBody, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: C.textMuted }}><X size={14} /></button>
              </div>
            )}
            <div style={{ position: "relative" }}>
              <input ref={inputRef} type="text" placeholder={canCompose ? "Type a message…" : "Waiting for chat session…"} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} disabled={!canCompose} style={{ width: "100%", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "11px 44px 11px 16px", color: C.textBody, fontSize: "14px", fontFamily: "'Inter', sans-serif", outline: "none", lineHeight: 1.5, transition: "border-color 0.2s", opacity: canCompose ? 1 : 0.6 }} onFocus={e => (e.target.style.borderColor = C.red)} onBlur={e => (e.target.style.borderColor = C.border)} />
              <button style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textHint, padding: "2px", display: "flex" }}><Smile size={18} /></button>
            </div>
          </div>
          <motion.button whileHover={(inputText.trim() || selectedFile) && canCompose && !sending ? { opacity: 0.9 } : {}} whileTap={(inputText.trim() || selectedFile) && canCompose && !sending ? { scale: 0.95 } : {}} onClick={sendMessage} disabled={(!inputText.trim() && !selectedFile) || !canCompose || sending} style={{ width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", background: (inputText.trim() || selectedFile) && canCompose && !sending ? C.red : C.inputBg, border: "none", borderRadius: "10px", color: (inputText.trim() || selectedFile) && canCompose && !sending ? "#fff" : C.textHint, cursor: (inputText.trim() || selectedFile) && canCompose && !sending ? "pointer" : "not-allowed", transition: "all 0.2s", flexShrink: 0 }}>
            {sending ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditModal({
  profile, email, token, onClose, onSaved, industryMap, categoryMap,
}: {
  profile: ApiProfile;
  email: string;
  token: string;
  onClose: () => void;
  onSaved: (updated: Partial<ApiProfile>) => void;
  industryMap: Record<string, string>;
  categoryMap: Record<string, string>;
}) {
  const [form, setForm] = useState<UpdatePayload>({
    first_name:           profile.first_name,
    last_name:            profile.last_name,
    phone_number:         profile.phone,
    gender:               profile.gender,
    date_of_birth:        profile.date_of_birth,
    city:                 profile.city,
    province:             profile.province,
    postal_code:          profile.postal_code,
    available_from:       profile.available_from,
    permit_status:        profile.permit_status,
    shift_preference:     profile.shift_preference,
    license_required:     profile.license_required,
    license_expiry_month: profile.license_expiry_month,
    license_expiry_year:  profile.license_expiry_year,
    job_category_id:      profile.job_category_id,
    job_industry_id:      profile.job_industry_id,
  });
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string|null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function set(key: keyof UpdatePayload, val: unknown) {
    setForm(f => ({ ...f, [key]: val }));
  }

  const catName = form.job_category_id ? categoryMap[form.job_category_id]?.trim().toLowerCase() : "";
  const isGeneralLabor = catName === "general labor" || catName === "general labour";

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("https://jbrstaffingsolutions.com/api/employees/self", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Update failed");
      setSaveSuccess(true);
      onSaved({
        first_name:           json.first_name,
        last_name:            json.last_name,
        phone:                json.phone ?? json.phone_number,
        gender:               json.gender,
        date_of_birth:        json.date_of_birth,
        city:                 json.city,
        province:             json.province,
        postal_code:          json.postal_code,
        available_from:       json.available_from,
        permit_status:        json.permit_status,
        shift_preference:     json.shift_preference,
        license_required:     json.license_required,
        license_expiry_month: json.license_expiry_month,
        license_expiry_year:  json.license_expiry_year,
        job_category_id:      json.job_category_id,
        job_industry_id:      json.job_industry_id,
        updated_at:           json.updated_at,
      });
      setTimeout(() => onClose(), 1200);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div style={{ padding:"24px 28px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:C.surface, zIndex:10 }}>
          <div>
            <div style={{ width:32, height:3, background:`linear-gradient(to right,${C.redBright},${C.red})`, borderRadius:2, marginBottom:8 }}/>
            <p style={{ fontSize:17, fontWeight:700, color:C.textHeading }}>Edit Profile</p>
            <p style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{email}</p>
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:9, border:`1.5px solid ${C.border}`, background:C.surface, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16} color={C.textMuted} />
          </button>
        </div>

        <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:24 }}>
          <div>
            <p style={{ fontSize:11, letterSpacing:1.6, textTransform:"uppercase", fontWeight:700, color:C.textLabel, marginBottom:14 }}>Personal</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Field label="First Name">
                <input className="form-input" value={form.first_name??""} onChange={e=>set("first_name",e.target.value)} placeholder="First name"/>
              </Field>
              <Field label="Last Name">
                <input className="form-input" value={form.last_name??""} onChange={e=>set("last_name",e.target.value)} placeholder="Last name"/>
              </Field>
              <Field label="Phone Number">
                <input className="form-input" value={form.phone_number??""} onChange={e=>set("phone_number",e.target.value)} placeholder="Phone"/>
              </Field>
              <Field label="Gender">
                <select className="form-select" value={form.gender??""} onChange={e=>set("gender",e.target.value)}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </Field>
              <Field label="Date of Birth">
                <input className="form-input" type="date" value={form.date_of_birth??""} onChange={e=>set("date_of_birth",e.target.value)}/>
              </Field>
            </div>
          </div>

          <div>
            <p style={{ fontSize:11, letterSpacing:1.6, textTransform:"uppercase", fontWeight:700, color:C.textLabel, marginBottom:14 }}>Location</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Field label="City">
                <input className="form-input" value={form.city??""} onChange={e=>set("city",e.target.value)} placeholder="City"/>
              </Field>
              <Field label="Province">
                <input className="form-input" value={form.province??""} onChange={e=>set("province",e.target.value)} placeholder="Province"/>
              </Field>
              <Field label="Postal Code">
                <input className="form-input" value={form.postal_code??""} onChange={e=>set("postal_code",e.target.value)} placeholder="Postal code"/>
              </Field>
            </div>
          </div>

          <div>
            <p style={{ fontSize:11, letterSpacing:1.6, textTransform:"uppercase", fontWeight:700, color:C.textLabel, marginBottom:14 }}>Job & Role</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Field label="Industry">
                <select className="form-select" value={form.job_industry_id??""} onChange={e=>set("job_industry_id",e.target.value||null)}>
                  <option value="">— Select —</option>
                  {Object.entries(industryMap).map(([k,v])=>(
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select className="form-select" value={form.job_category_id??""} onChange={e=>{
                  const val = e.target.value || null;
                  const cName = val ? categoryMap[val]?.trim().toLowerCase() : "";
                  const isGL = cName === "general labor" || cName === "general labour";
                  setForm(f => ({
                    ...f,
                    job_category_id: val,
                    ...(isGL ? { license_required: false, license_expiry_month: null, license_expiry_year: null } : {})
                  }));
                }}>
                  <option value="">— Select —</option>
                  {Object.entries(categoryMap).map(([k,v])=>(
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Permit Status">
                <select className="form-select" value={form.permit_status??""} onChange={e=>set("permit_status",e.target.value)}>
                  <option value="">— Select —</option>
                  {Object.entries(PERMIT_MAP).map(([k,v])=>(
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Shift Preference">
                <select className="form-select" value={form.shift_preference??""} onChange={e=>set("shift_preference",e.target.value)}>
                  <option value="">— Select —</option>
                  {Object.entries(SHIFT_MAP).map(([k,v])=>(
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Available From">
                <input className="form-input" type="date" value={form.available_from??""} onChange={e=>set("available_from",e.target.value)}/>
              </Field>
            </div>
          </div>

          {!isGeneralLabor && (
            <div>
              <p style={{ fontSize:11, letterSpacing:1.6, textTransform:"uppercase", fontWeight:700, color:C.textLabel, marginBottom:14 }}>License</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Field label="License Required">
                  <select className="form-select" value={form.license_required?"yes":"no"} onChange={e=>set("license_required",e.target.value==="yes")}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </Field>
                {form.license_required && (
                  <>
                    <Field label="Expiry Month">
                      <select className="form-select" value={form.license_expiry_month??""} onChange={e=>set("license_expiry_month",e.target.value?Number(e.target.value):null)}>
                        <option value="">— Select —</option>
                        {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Expiry Year">
                      <input className="form-input" type="number" placeholder="e.g. 2027" value={form.license_expiry_year??""} onChange={e=>set("license_expiry_year",e.target.value?Number(e.target.value):null)}/>
                    </Field>
                  </>
                )}
              </div>
            </div>
          )}

          {saveError && (
            <div style={{ padding:"12px 16px", borderRadius:9, background:"#FEE2E2", border:"1px solid #FECACA", display:"flex", gap:10, alignItems:"center" }}>
              <AlertTriangle size={18} color="#991B1B" />
              <span style={{ fontSize:13, color:"#991B1B", fontWeight:500 }}>{saveError}</span>
            </div>
          )}
          {saveSuccess && (
            <div style={{ padding:"12px 16px", borderRadius:9, background:"#D1FAE5", border:"1px solid #A7F3D0", display:"flex", gap:10, alignItems:"center" }}>
              <CheckCheck size={18} color="#065F46" />
              <span style={{ fontSize:13, color:"#065F46", fontWeight:500 }}>Profile updated successfully!</span>
            </div>
          )}
        </div>

        <div style={{ padding:"16px 28px 24px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"flex-end", gap:10, position:"sticky", bottom:0, background:C.surface }}>
          <button onClick={onClose} style={{ padding:"10px 20px", borderRadius:9, border:`1.5px solid ${C.border}`, background:C.surface, color:C.textLabel, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding:"10px 24px", borderRadius:9, border:"none", background:saving?C.textHint:`linear-gradient(135deg,${C.redBright},${C.red})`, color:"#fff", fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8, transition:"background 0.2s" }}>
            {saving && <Loader2 size={13} color="white" style={{ animation: "spin 1s linear infinite" }} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NO TOKEN SCREEN ──────────────────────────────────────────────────────────
function NoTokenScreen() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div className="card" style={{ padding:"48px 40px", textAlign:"center", maxWidth:420 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:C.redActiveBg, border:`2px solid ${C.red}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <AlertTriangle size={24} color={C.red} />
          </div>
          <p style={{ fontSize:18, fontWeight:600, color:C.textHeading, marginBottom:8 }}>Session Not Found</p>
          <p style={{ fontSize:14, color:C.textMuted, marginBottom:24, lineHeight:1.6 }}>
            No authentication token was found. Please verify your identity first to access your profile.
          </p>
          <a href="/users/employee-register/" style={{ textDecoration:"none" }}>
            <button style={{ padding:"10px 24px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${C.redBright},${C.red})`, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              Go to Verification
            </button>
          </a>
        </div>
      </div>
    </>
  );
}

// ─── PENDING DOCUMENTS MODAL ───────────────────────────────────────────────────
function PendingDocsModal({
  missingDocs, onClose, onGoToDocuments,
}: {
  missingDocs: string[];
  onClose: () => void;
  onGoToDocuments: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div style={{ padding: "32px 28px 8px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px", background: "#FEF3C7", border: "2px solid #F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={24} color="#92400E" />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: C.textHeading, marginBottom: 6 }}>
            Your Profile is Pending Verification
          </p>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
            To complete your verification, please submit the following document{missingDocs.length > 1 ? "s" : ""}:
          </p>
        </div>

        <div style={{ padding: "16px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          {missingDocs.map(doc => (
            <div key={doc} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: C.alertBg, border: "1px solid rgba(198,40,40,0.18)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, flexShrink: 0, animation: "pulseDot 1.6s infinite" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.textBody }}>{doc}</span>
              <span className="chip" style={{ marginLeft: "auto", background: "#FEF3C7", color: "#92400E" }}>Required</span>
            </div>
          ))}
        </div>

        <p style={{ padding: "0 28px", fontSize: 12, color: C.textHint, lineHeight: 1.6 }}>
          You can upload or share these from the Documents tab, or send them directly to our team via Chat.
        </p>

        <div style={{ padding: "20px 28px 28px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 16px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.surface, color: C.textLabel, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Maybe Later
          </button>
          <button onClick={onGoToDocuments} style={{ flex: 1, padding: "11px 16px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${C.redBright},${C.red})`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <ShieldCheck size={14} /> View Required Documents
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CandidateProfile() {
  const [tab, setTab]               = useState<"overview"|"documents"|"chat">("overview");
  const [data, setData]             = useState<ApiResponse|null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string|null>(null);
  const [editOpen, setEditOpen]     = useState(false);
  const [token, setToken]           = useState<string|null>(null);
  const [industryMap, setIndustryMap] = useState<Record<string, string>>({});
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  const [registrationNumber, setRegistrationNumber] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);

  // ── NEW: Real document status from dedicated endpoints ──────────────────────
  const [docStatus, setDocStatus] = useState<DocStatus>({
    sinExists: false,
    bankExists: false,
    loading: true,
    checked: false,
  });

  // ── NEW: Inline doc form state (keyed per doc) ─────────────────────────────
  const [expandedDoc, setExpandedDoc]   = useState<string | null>(null);
  const [docInputText, setDocInputText] = useState("");
  const [docInputFile, setDocInputFile] = useState<File | null>(null);
  const [submittingDoc, setSubmittingDoc] = useState<string | null>(null);
  const [docSubmitError, setDocSubmitError] = useState<string | null>(null);

  const BASE_URL = "https://jbrstaffingsolutions.com/api";

  useEffect(() => {
    const storedRegNum = localStorage.getItem("jbr_registration_number");
    if (storedRegNum) setRegistrationNumber(storedRegNum);
  }, []);

  // ── Fetch profile + industries + categories ─────────────────────────────────
  useEffect(() => {
    const stored = getStoredToken();
    setToken(stored);
    if (!stored) {
      setLoading(false);
      return;
    }

    const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${stored}` };
    Promise.all([
      fetch(`${BASE_URL}/auth/me`, { headers }),
      fetch(`${BASE_URL}/job-industries`, { headers }),
      fetch(`${BASE_URL}/job-categories`, { headers }),
    ]).then(async ([meRes, indRes, catRes]) => {
        if (!meRes.ok) throw new Error(`HTTP ${meRes.status}`);
        const meJson = await meRes.json() as ApiResponse;
        if (!meJson.success) throw new Error("API returned success: false");
        setData(meJson);

        if (indRes.ok) {
          const indData = await indRes.json();
          const map: Record<string, string> = {};
          (indData.data ?? []).forEach((i: { id: string; name: string }) => map[i.id] = i.name.trim());
          setIndustryMap(map);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          const map: Record<string, string> = {};
          (catData.data ?? []).forEach((c: { id: string; name: string }) => map[c.id] = c.name.trim());
          setCategoryMap(map);
        }
      }).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  // ── NEW: Check SIN and bank-account existence via dedicated GET endpoints ───
  const checkDocumentStatus = useCallback(async (authToken: string) => {
    setDocStatus(prev => ({ ...prev, loading: true }));
    const headers = { "Authorization": `Bearer ${authToken}` };

    const [sinRes, bankRes] = await Promise.allSettled([
      fetch(`${BASE_URL}/chat/documents/sin`, { headers }),
      fetch(`${BASE_URL}/chat/documents/bank-account`, { headers }),
    ]);

    // 200 = exists, 404 = not found; any other error = treat as missing
    const sinExists = sinRes.status === "fulfilled" && sinRes.value.ok;
    const bankExists = bankRes.status === "fulfilled" && bankRes.value.ok;

    setDocStatus({ sinExists, bankExists, loading: false, checked: true });
  }, []);

  useEffect(() => {
    if (token) {
      checkDocumentStatus(token);
    }
  }, [token, checkDocumentStatus]);

  // ── Show pending modal once doc check is done — triggered purely by 404s ───
  const _docChecked   = docStatus.checked;
  const _sinExists    = docStatus.sinExists;
  const _bankExists   = docStatus.bankExists;
  useEffect(() => {
    if (_docChecked && (!_sinExists || !_bankExists)) {
      setShowPendingModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_docChecked, _sinExists, _bankExists]);

  function handleSaved(updated: Partial<ApiProfile>) {
    if (!data) return;
    setData({
      ...data,
      user: { ...data.user, profile: { ...data.user.profile, ...updated } },
    });
  }

  // ── NEW: Submit SIN or bank-account document using the real POST endpoints ──
  const handleDocSubmit = async (docLabel: string) => {
    if (!token) return;
    setSubmittingDoc(docLabel);
    setDocSubmitError(null);

    try {
      const isSin = docLabel === "Social Insurance Number (SIN)";
      const endpoint = isSin
        ? `${BASE_URL}/chat/documents/sin`
        : `${BASE_URL}/chat/documents/bank-account`;

      const formData = new FormData();
      // Field names match exactly what the API expects (from screenshots)
      if (isSin) {
        if (docInputText) formData.append("sinNumber", docInputText);
      } else {
        if (docInputText) formData.append("accountNumber", docInputText);
      }
      if (docInputFile) formData.append("supportingDocument", docInputFile);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Upload failed (${res.status})`);
      }

      // Update local doc status
      setDocStatus(prev => ({
        ...prev,
        sinExists:  isSin  ? true : prev.sinExists,
        bankExists: !isSin ? true : prev.bankExists,
      }));

      setExpandedDoc(null);
      setDocInputText("");
      setDocInputFile(null);
    } catch (err: any) {
      setDocSubmitError(err.message || "Failed to upload document.");
    } finally {
      setSubmittingDoc(null);
    }
  };

  // ─── Derived values ────────────────────────────────────────────────────────
  if (!loading && !token) return <NoTokenScreen />;

  if (loading) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position:"fixed",top:0,left:0,right:0,height:3,background:`linear-gradient(to right,${C.redBright},${C.red})`,zIndex:100 }}/>
      <div style={{ minHeight:"100vh", background:C.bg, paddingTop:3 }}>
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, height:64, display:"flex", alignItems:"center", padding:"0 40px" }}>
          <Skeleton h={32} w={120}/>
        </div>
        <div style={{ maxWidth:1160, margin:"0 auto", padding:"40px 24px" }}>
          <div className="card" style={{ marginBottom:24, padding:28, display:"flex", flexDirection:"column", gap:16 }}>
            <Skeleton h={90} radius={12}/><Skeleton h={40} w="40%"/><Skeleton h={20} w="25%"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginBottom:24 }}>
            {[1,2].map(i=><div key={i} className="card" style={{ padding:20 }}><Skeleton h={60}/></div>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {[1,2,3,4].map(i=><div key={i} className="card" style={{ padding:20 }}><Skeleton h={160}/></div>)}
          </div>
        </div>
      </div>
    </>
  );

  if (error || !data) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div className="card" style={{ padding:"48px 40px", textAlign:"center", maxWidth:420 }}>
          <div style={{ width:56,height:56,borderRadius:"50%",background:C.redActiveBg,border:`2px solid ${C.red}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
            <AlertTriangle size={24} color={C.red} />
          </div>
          <p style={{ fontSize:18, fontWeight:600, color:C.textHeading, marginBottom:8 }}>Failed to load profile</p>
          <p style={{ fontSize:14, color:C.textMuted, marginBottom:24 }}>{error ?? "Unknown error"}</p>
          <button onClick={()=>window.location.reload()} style={{ padding:"10px 24px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${C.redBright},${C.red})`, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>Try Again</button>
        </div>
      </div>
    </>
  );

  const u = data.user;
  const p = u.profile;
  const isPending  = u.status === "pending";

  // Use real doc status from API
  const sinProvided  = docStatus.sinExists;
  const bankProvided = docStatus.bankExists;

  // Docs are required based purely on GET API 404s — not on account status
  const missingRequiredDocs = [
    ...(!sinProvided  ? ["Social Insurance Number (SIN)"] : []),
    ...(!bankProvided ? ["Bank Account Details"]           : []),
  ];
  const hasPendingRequiredDocs = missingRequiredDocs.length > 0;

  const name         = `${p.first_name} ${p.last_name}`;
  const jobCategory  = p.job_category_id ? (categoryMap[p.job_category_id] ?? "Not Specified") : "Not Specified";
  const jobIndustry  = p.job_industry_id ? (industryMap[p.job_industry_id] ?? "Not Specified") : "Not Specified";
  const shiftLabel   = p.shift_preference ? (SHIFT_MAP[p.shift_preference]   ?? p.shift_preference) : "Not Specified";
  const permitLabel  = p.permit_status ? (PERMIT_MAP[p.permit_status]        ?? p.permit_status) : "Not Specified";
  const registeredOn = p.created_at ? p.created_at.split("T")[0] : null;
  const resumeName   = p.resume_url ? p.resume_url.split("/").pop() ?? "Resume.pdf" : null;
  const licenseExpiry = p.license_required && p.license_expiry_month && p.license_expiry_year
    ? `${MONTHS[p.license_expiry_month - 1]} ${p.license_expiry_year}` : null;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {editOpen && token && (
        <EditModal
          profile={p}
          email={u.email}
          token={token}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
          industryMap={industryMap}
          categoryMap={categoryMap}
        />
      )}

      {showPendingModal && (
        <PendingDocsModal
          missingDocs={missingRequiredDocs}
          onClose={() => setShowPendingModal(false)}
          onGoToDocuments={() => { setTab("documents"); setShowPendingModal(false); }}
        />
      )}

      <div style={{ position:"fixed",top:0,left:0,right:0,height:3,background:`linear-gradient(to right,${C.redBright},${C.red})`,zIndex:100 }}/>

      <div style={{ minHeight:"100vh", background:C.bg, paddingTop:3 }}>
        {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", height:64, position:"sticky", top:3, zIndex:50 }}>
          <div style={{ display:"flex",alignItems:"stretch",border:`1.5px solid ${C.border}`,width:"fit-content" }}>
            <div style={{ padding:"8px 10px 8px 14px",borderRight:`1.5px solid ${C.border}` }}>
              <span style={{ fontSize:28,fontWeight:600,color:C.red,letterSpacing:3,lineHeight:1,display:"block" }}>JBR</span>
            </div>
            <div style={{ display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 12px",gap:2 }}>
              <span style={{ fontSize:9,letterSpacing:3.5,color:C.textHeading,textTransform:"uppercase",fontWeight:600 }}>STAFFING</span>
              <span style={{ fontSize:9,letterSpacing:3.5,color:C.textMuted,textTransform:"uppercase" }}>SOLUTIONS</span>
            </div>
          </div>

          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span style={{ fontSize:14,fontWeight:600,color:C.textBody,letterSpacing:0.2 }}>My Profile</span>
          </div>

          <div style={{ display:"flex",gap:10 }}>
            <button
              onClick={() => setEditOpen(true)}
              style={{ padding:"9px 18px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.surface,color:C.textLabel,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:7 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </button>
            {p.resume_url && (
              <a href={p.resume_url} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                <button style={{ padding:"9px 18px",borderRadius:9,border:`1.5px solid ${C.border}`,background:C.surface,color:C.textLabel,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Resume
                </button>
              </a>
            )}
          </div>
        </div>

        <div style={{ maxWidth:1160, margin:"0 auto", padding:"40px 24px 60px" }}>
          {/* ── HERO CARD ──────────────────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom:24, padding:0, animation:"fadeUp 0.45s cubic-bezier(0.4,0,0.2,1) both" }}>
            <div style={{ height:90, background:`linear-gradient(135deg,#8B0000 0%,${C.red} 40%,#E53935 70%,#FF8A80 100%)`, position:"relative" }}>
              <div style={{ position:"absolute",inset:0,opacity:0.08,backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",backgroundSize:"12px 12px" }}/>
            </div>
            <div style={{ padding:"0 36px 28px", position:"relative" }}>
              <div style={{ width:80,height:80,borderRadius:"50%",background:C.surface,border:`4px solid ${C.surface}`,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:600,color:C.red,position:"absolute",top:-40,left:36 }}>
                {p.first_name?.[0] || ""}{p.last_name?.[0] || ""}
              </div>
              <div style={{ paddingTop:48, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                <div>
                  <h1 style={{ fontSize:34,fontWeight:600,color:C.textHeading,lineHeight:1.1,marginBottom:6 }}>{name}</h1>
                  <div style={{ display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
                    <span style={{ fontSize:14,color:C.textMuted,fontWeight:500 }}>{jobCategory} · {jobIndustry}</span>
                    <span style={{ width:4,height:4,borderRadius:"50%",background:C.border,display:"inline-block" }}/>
                    <span style={{ fontSize:13,color:C.textMuted }}>{p.city}, {p.province}</span>
                    <span style={{ width:4,height:4,borderRadius:"50%",background:C.border,display:"inline-block" }}/>
                    <StatusChip status={u.status}/>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  {registrationNumber && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:C.textHint,fontWeight:700,marginBottom:4 }}>Registration No.</p>
                      <p style={{ fontSize:15,fontWeight:700,color:C.red,fontFamily:"'Inter', monospace",letterSpacing:1 }}>{registrationNumber}</p>
                    </div>
                  )}
                  <p style={{ fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:C.textHint,fontWeight:700,marginBottom:4 }}>Registered On</p>
                  <p style={{ fontSize:14,fontWeight:600,color:C.textBody }}>{fmt(registeredOn)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── STAT CARDS ─────────────────────────────────────────────────────── */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,marginBottom:24 }}>
            {[
              { label:"Available From", value:fmtShort(p.available_from), icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { label:"Permit Status",  value:permitLabel,                icon:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            ].map((s,i)=>(
              <div key={s.label} className="card" style={{ padding:"18px 20px", animation:`fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) ${i*0.07+0.1}s both` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                  <p style={{ fontSize:11,fontWeight:700,letterSpacing:1.1,textTransform:"uppercase",color:C.textMuted }}>{s.label}</p>
                  <div style={{ width:30,height:30,borderRadius:8,background:C.redActiveBg,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.8"><path d={s.icon}/></svg>
                  </div>
                </div>
                <p style={{ fontSize:20,fontWeight:600,color:C.textHeading,lineHeight:1.2 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── TABS ───────────────────────────────────────────────────────────── */}
          <div style={{ display:"flex",gap:4,marginBottom:24,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:5,width:"fit-content" }}>
            {(["overview","documents","chat"] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} className={`tab-btn ${tab===t?"active":"inactive"}`} style={{ textTransform:"capitalize" }}>
                {t}
                {t==="documents" && hasPendingRequiredDocs && (
                  <span style={{ position:"absolute", top:6, right:6, width:7, height:7, borderRadius:"50%", background: tab===t ? "#fff" : C.red, boxShadow: `0 0 0 2px ${tab===t ? C.red : C.surface}`, animation:"pulseDot 1.6s infinite" }}/>
                )}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ───────────────────────────────────────────────────── */}
          {tab==="overview"&&(
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,animation:"fadeUp 0.3s ease" }}>
              <div className="card" style={{ animation:"fadeUp 0.3s ease 0.05s both" }}>
                <div style={{ padding:"20px 20px 14px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:40,height:3,background:`linear-gradient(to right,${C.redBright},${C.red})`,borderRadius:2,marginBottom:10,animation:"lineGrow 0.8s ease 0.2s both" }}/>
                  <SectionHead title="Personal Details"/>
                </div>
                <div>
                  <InfoRow label="Full Name"     value={name}/>
                  <InfoRow label="Email"         value={u.email}/>
                  <InfoRow label="Phone"         value={p.phone ?? "—"}/>
                  <InfoRow label="Gender"        value={genderLabel(p.gender)}/>
                  <InfoRow label="Date of Birth" value={`${fmt(p.date_of_birth)}  (Age ${age(p.date_of_birth)})`}/>
                  <InfoRow label="Email Verified" value={<span className="chip" style={{ background:p.email_verified?"#D1FAE5":"#FEE2E2", color:p.email_verified?"#065F46":"#991B1B" }}>{p.email_verified?"Verified":"Not Verified"}</span>}/>
                </div>
              </div>

              <div className="card" style={{ animation:"fadeUp 0.3s ease 0.10s both" }}>
                <div style={{ padding:"20px 20px 14px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:40,height:3,background:`linear-gradient(to right,${C.redBright},${C.red})`,borderRadius:2,marginBottom:10,animation:"lineGrow 0.8s ease 0.3s both" }}/>
                  <SectionHead title="Location"/>
                </div>
                <div>
                  <InfoRow label="Province"    value={p.province}/>
                  <InfoRow label="City"        value={p.city}/>
                  <InfoRow label="Postal Code" value={p.postal_code}/>
                </div>
                <div style={{ padding:"16px 20px",borderTop:`1px solid ${C.border}` }}>
                  <div style={{ width:"100%",height:120,borderRadius:10,background:C.inputBg,overflow:"hidden",position:"relative" }}>
                    <div style={{ position:"absolute",inset:0,opacity:0.07,backgroundImage:"linear-gradient(rgba(0,0,0,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.3) 1px,transparent 1px)",backgroundSize:"24px 24px" }}/>
                    <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span style={{ fontSize:13,fontWeight:600,color:C.textMuted }}>{p.city}, {p.province} · {p.postal_code}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ animation:"fadeUp 0.3s ease 0.15s both" }}>
                <div style={{ padding:"20px 20px 14px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:40,height:3,background:`linear-gradient(to right,${C.redBright},${C.red})`,borderRadius:2,marginBottom:10 }}/>
                  <SectionHead title="Job & Role"/>
                </div>
                <div>
                  <InfoRow label="Industry"       value={jobIndustry}/>
                  <InfoRow label="Category"       value={jobCategory} accent/>
                  <InfoRow label="Permit Status"  value={<PermitChip permit={p.permit_status}/>}/>
                  <InfoRow label="Account Status" value={<StatusChip status={u.status}/>}/>
                  {p.license_required && (<InfoRow label="License Required" value={<span className="chip" style={{ background:"#FEF3C7",color:"#92400E" }}>Yes</span>}/>)}
                  {licenseExpiry && <InfoRow label="License Expiry" value={licenseExpiry}/>}
                </div>
              </div>

              <div className="card" style={{ animation:"fadeUp 0.3s ease 0.20s both" }}>
                <div style={{ padding:"20px 20px 14px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ width:40,height:3,background:`linear-gradient(to right,${C.redBright},${C.red})`,borderRadius:2,marginBottom:10 }}/>
                  <SectionHead title="Shift & Availability"/>
                </div>
                <div>
                  <InfoRow label="Shift Preference" value={shiftLabel}/>
                  <InfoRow label="Available From"   value={fmt(p.available_from)} accent/>
                  <InfoRow label="License Required" value={p.license_required?"Yes":"No"}/>
                </div>
                <div style={{ padding:"16px 20px" }}>
                  <p style={{ fontSize:11,letterSpacing:1.4,textTransform:"uppercase",fontWeight:700,color:C.textLabel,marginBottom:12 }}>Typical Schedule</p>
                  <div style={{ display:"flex",gap:8 }}>
                    {ALL_DAYS.map(d=>{
                      const isNight  = p.shift_preference==="night_shift";
                      const isOnCall = p.shift_preference==="on_call"||p.shift_preference==="rotating_shift";
                      const weekdays = ["Mon","Tue","Wed","Thu","Fri"];
                      const weekend  = ["Sat","Sun"];
                      const active   = isOnCall?true:isNight?weekend.includes(d):weekdays.includes(d);
                      return <div key={d} className={`day-pill ${active?"active":"inactive"}`}>{d}</div>;
                    })}
                  </div>
                  <p style={{ fontSize:11,color:C.textHint,marginTop:10 }}>Based on {shiftLabel}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── DOCUMENTS TAB ──────────────────────────────────────────────────── */}
          {tab==="documents"&&(
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              {/* Doc status loading banner */}
              {docStatus.loading && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", borderRadius:12, marginBottom:18, background:C.pendingBg, border:`1px solid rgba(59,130,246,0.3)` }}>
                  <Loader2 size={16} color={C.pendingText} style={{ animation:"spin 1s linear infinite" }}/>
                  <span style={{ fontSize:13, fontWeight:500, color:C.pendingText }}>Checking document status…</span>
                </div>
              )}

              {/* Pending verification banner */}
              {!docStatus.loading && hasPendingRequiredDocs && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 18px", borderRadius:12, marginBottom:18, background:"#FEF3C7", border:"1px solid #FCD34D" }}>
                  <Clock size={18} color="#92400E" style={{ flexShrink:0, marginTop:1 }}/>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:"#92400E", marginBottom:2 }}>Verification Pending</p>
                    <p style={{ fontSize:12.5, color:"#92400E", lineHeight:1.6 }}>
                      Please submit the document{missingRequiredDocs.length>1?"s":""} marked "Required" below to complete your verification.
                    </p>
                  </div>
                </div>
              )}

              {/* Doc submit error */}
              {docSubmitError && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"12px 18px", borderRadius:12, marginBottom:18, background:C.alertBg, border:`1px solid rgba(198,40,40,0.2)` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <AlertTriangle size={16} color={C.red}/>
                    <span style={{ fontSize:13, fontWeight:500, color:C.alertText }}>{docSubmitError}</span>
                  </div>
                  <button onClick={() => setDocSubmitError(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.alertText, display:"flex" }}><X size={14}/></button>
                </div>
              )}

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
                {[
                  { name:resumeName??"-",       size:"—",      label:"Resume",                      date:registeredOn, url:p.resume_url,  required:false, provided:true },
                  { name:"ID_Verification.pdf", size:"0.8 MB", label:"ID Verification",             date:registeredOn, url:null,           required:false, provided:true },
                  { name:"Work_Permit.pdf",     size:"1.1 MB", label:"Work Permit",                 date:registeredOn, url:null,           required:false, provided:true },
                  {
                    name:  sinProvided  ? "SIN on file"       : "Not submitted yet",
                    size:  sinProvided  ? "—"                 : "—",
                    label: "Social Insurance Number (SIN)",
                    date:  sinProvided  ? registeredOn        : null,
                    url:   null,
                    required: !sinProvided,
                    provided: sinProvided,
                  },
                  {
                    name:  bankProvided ? "Bank details on file" : "Not submitted yet",
                    size:  bankProvided ? "—"                   : "—",
                    label: "Bank Account Details",
                    date:  bankProvided ? registeredOn          : null,
                    url:   null,
                    required: !bankProvided,
                    provided: bankProvided,
                  },
                ].map((f,i) => {
                  const pendingDoc = f.required && !f.provided;
                  const isExpanded = expandedDoc === f.label;

                  return (
                    <div key={i} className="card" style={{
                      padding:"20px 22px",
                      display:"flex",
                      flexDirection:"column",
                      position:"relative",
                      animation:`fadeUp 0.35s cubic-bezier(0.4,0,0.2,1) ${i*0.07}s both`,
                      ...(pendingDoc ? { border:`1.5px solid #FCD34D` } : f.provided && (f.label === "Social Insurance Number (SIN)" || f.label === "Bank Account Details") ? { border:`1.5px solid #A7F3D0` } : {}),
                    }}>
                      {/* Pulse dot for pending */}
                      {pendingDoc && !isExpanded && (
                        <span style={{ position:"absolute", top:14, right:14, width:9, height:9, borderRadius:"50%", background:C.red, boxShadow:`0 0 0 2px ${C.surface}`, animation:"pulseDot 1.6s infinite" }}/>
                      )}
                      {/* Green check for provided SIN/bank */}
                      {f.provided && (f.label === "Social Insurance Number (SIN)" || f.label === "Bank Account Details") && (
                        <span style={{ position:"absolute", top:14, right:14, width:20, height:20, borderRadius:"50%", background:"#D1FAE5", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Check size={11} color="#065F46"/>
                        </span>
                      )}

                      <div style={{ display:"flex", alignItems:"flex-start", gap:16, width:"100%" }}>
                        <div style={{
                          width:48, height:48, borderRadius:12, flexShrink:0,
                          background: pendingDoc ? "#FEF3C7" : f.provided && (f.label === "Social Insurance Number (SIN)" || f.label === "Bank Account Details") ? "#D1FAE5" : C.redActiveBg,
                          border: `1.5px solid ${pendingDoc ? "#FCD34D" : f.provided && (f.label === "Social Insurance Number (SIN)" || f.label === "Bank Account Details") ? "#A7F3D0" : "rgba(198,40,40,0.2)"}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke={pendingDoc ? "#92400E" : f.provided && (f.label === "Social Insurance Number (SIN)" || f.label === "Bank Account Details") ? "#065F46" : C.red}
                            strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        </div>

                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                            <p style={{ fontSize:11, letterSpacing:1.2, textTransform:"uppercase", fontWeight:700, color:C.textHint }}>{f.label}</p>
                            {pendingDoc && <span className="chip" style={{ background:"#FEF3C7", color:"#92400E" }}>Required</span>}
                            {f.provided && (f.label === "Social Insurance Number (SIN)" || f.label === "Bank Account Details") && (
                              <span className="chip" style={{ background:"#D1FAE5", color:"#065F46" }}>Submitted</span>
                            )}
                          </div>
                          <p style={{ fontSize:14, fontWeight:600, color:pendingDoc ? C.textMuted : C.textBody, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</p>
                          <p style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
                            {pendingDoc ? "Awaiting submission" : `PDF · ${f.size}${f.date ? ` · ${fmt(f.date)}` : ""}`}
                          </p>
                        </div>

                        {f.url && (
                          <a href={f.url} target="_blank" rel="noreferrer">
                            <button
                              style={{ width:32, height:32, borderRadius:9, border:`1.5px solid ${C.border}`, background:C.surface, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s ease", flexShrink:0 }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.red; (e.currentTarget as HTMLButtonElement).style.background = C.redActiveBg; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.background = C.surface; }}
                              title="Download">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </button>
                          </a>
                        )}

                        {/* "Provide Details" button for pending docs */}
                        {pendingDoc && !isExpanded && (
                          <button
                            onClick={() => { setExpandedDoc(f.label); setDocInputText(""); setDocInputFile(null); setDocSubmitError(null); }}
                            style={{ alignSelf:"center", display:"inline-flex", alignItems:"center", gap:4, padding:"6px 12px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, color:C.textLabel, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.red; (e.currentTarget as HTMLButtonElement).style.color = C.red; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.textLabel; }}>
                            Provide Details <ChevronRight size={14}/>
                          </button>
                        )}
                      </div>

                      {/* ── INLINE UPLOAD FORM ──────────────────────────────── */}
                      {pendingDoc && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          style={{ overflow:"hidden", marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:10 }}>

                          <input
                            className="form-input"
                            style={{ fontSize:13, padding:"8px 12px" }}
                            placeholder={
                              f.label === "Social Insurance Number (SIN)"
                                ? "Enter SIN Number (e.g. 123 456 789)"
                                : "Enter Bank Account Number"
                            }
                            value={docInputText}
                            onChange={e => setDocInputText(e.target.value)}
                          />

                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <input
                              type="file"
                              id={`upload-file-${i}`}
                              style={{ display:"none" }}
                              onChange={e => setDocInputFile(e.target.files?.[0] || null)}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <label
                              htmlFor={`upload-file-${i}`}
                              style={{
                                flex:1, padding:"8px 12px",
                                border:`1.5px dashed ${docInputFile ? C.red : C.border}`,
                                borderRadius:8,
                                background: docInputFile ? C.redActiveBg : C.inputBg,
                                textAlign:"center", cursor:"pointer",
                                fontSize:12, color: docInputFile ? C.red : C.textMuted,
                                fontWeight:500, transition:"all 0.2s",
                              }}>
                              {docInputFile ? (
                                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                                  <Check size={14}/> {docInputFile.name}
                                </span>
                              ) : "+ Attach Supporting Document (Optional)"}
                            </label>
                          </div>

                          <p style={{ fontSize:11, color:C.textHint }}>
                            {f.label === "Social Insurance Number (SIN)"
                              ? "Your SIN is kept secure and only used for payroll purposes."
                              : "Enter your bank account number for direct deposit payments."}
                          </p>

                          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
                            <button
                              onClick={() => { setExpandedDoc(null); setDocInputText(""); setDocInputFile(null); setDocSubmitError(null); }}
                              style={{ padding:"7px 14px", fontSize:12, fontWeight:600, borderRadius:8, border:"none", background:"transparent", color:C.textLabel, cursor:"pointer" }}>
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDocSubmit(f.label)}
                              disabled={(!docInputText.trim() && !docInputFile) || submittingDoc === f.label}
                              style={{
                                padding:"7px 14px", fontSize:12, fontWeight:600, borderRadius:8, border:"none",
                                background: (!docInputText.trim() && !docInputFile) ? C.textHint : C.red,
                                color:"#fff",
                                cursor: (!docInputText.trim() && !docInputFile) ? "not-allowed" : "pointer",
                                display:"flex", alignItems:"center", gap:6, transition:"background 0.2s",
                              }}>
                              {submittingDoc === f.label
                                ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/>
                                : <Upload size={14}/>}
                              {submittingDoc === f.label ? "Saving…" : "Save Details"}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CHAT TAB ───────────────────────────────────────────────────────── */}
          {tab === "chat" && token && (
            <EmployeeChat profile={p} token={token} />
          )}

          <p style={{ fontSize:12, color:C.textHint, textAlign:"center", marginTop:40 }}>
            © 2026 JBR Staffing Solutions Pvt. Ltd.
          </p>
        </div>
      </div>
    </>
  );
}
