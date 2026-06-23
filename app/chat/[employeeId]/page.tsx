"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, MoreVertical, Paperclip,
  Smile, CheckCheck, Check, Search,
  Image as ImageIcon, FileText,
  Loader2, AlertTriangle, RefreshCw, X
} from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

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
  redActiveBg: "rgba(198,40,40,0.06)",
  inputBg: "#F4F6F8",
  white: "#FFFFFF",
  successText: "#059669",
  pendingBg: "rgba(59,130,246,0.08)",
  pendingText: "#3B82F6",
  alertBg: "rgba(198,40,40,0.08)",
  alertText: "#C62828",
  shadow: "rgba(0,0,0,0.06)",
  shadowMd: "rgba(0,0,0,0.10)",
  msgSent: "#C62828",
  msgSentText: "#FFFFFF",
  msgReceived: "#FFFFFF",
  msgReceivedText: "#1A1A1A",
  chatBg: "#ECE5DD",
};

/* ─── GLOBAL CSS ─────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.textBody}; font-family: 'DM Sans', sans-serif; overflow: hidden; height: 100vh; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
`;

/* ─── API CONFIG ─────────────────────────────────────────────── */
const BASE_URL = "https://jbrstaffingsolutions.com/api";

const getAuthToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("jbr_token") || "" : "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getAuthToken()}`,
});

// How often we poll the server for new messages from the employee side.
const MESSAGE_POLL_INTERVAL_MS = 5000;

/* ─── TYPES ──────────────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  session_id: string;
  employee_id: string;
  message_text: string;
  message_type: string;
  media_url: string | null;
  sender_type: "vendor" | "employee" | "admin";
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

/* ─── HELPERS ────────────────────────────────────────────────── */
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

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const employeeId = (params?.employeeId as string) || "";

  // Info passed in from the Employees page when the chat icon is clicked
  const rawName = searchParams.get("name") || "";
  const rawPhone = searchParams.get("phone") || "";
  const sessionIdFromQuery = searchParams.get("sessionId") || "";
  const campaignIdFromQuery = searchParams.get("campaignId") || "";
  const jobCategoryIdFromQuery = searchParams.get("jobCategoryId") || "";

  const displayName = rawName.trim() || "Employee";
  const digits = rawPhone.replace(/\D/g, "");
  const last4 = digits.length >= 4 ? digits.slice(-4) : digits || "----";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "E";

  /* ── SESSION STATE ── */
  const [sessionId, setSessionId] = useState(sessionIdFromQuery);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  /* ── MESSAGES STATE ── */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  /* ── COMPOSER STATE ── */
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  /* ── SEARCH STATE ── */
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* ── MARK-READ STATE ── */
  // Tracks the last session for which we called mark-read, to avoid duplicate calls
  const lastMarkedSessionRef = useRef<string | null>(null);
  const markReadInFlightRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─────────────────────────────────────────────────────────────
     MARK-READ API
     PATCH /api/chat/messages/:session_id/mark-read?employee_id=...
     Called:
       1. After initial messages are fetched (if any unread employee msgs exist)
       2. After each poll that returns new employee messages
     ───────────────────────────────────────────────────────────── */
  const markMessagesAsRead = useCallback(async (sId: string) => {
    if (!sId || !employeeId) return;
    // Avoid concurrent in-flight calls
    if (markReadInFlightRef.current) return;

    markReadInFlightRef.current = true;
    try {
      await fetch(
        `${BASE_URL}/chat/messages/${sId}/mark-read?employee_id=${encodeURIComponent(employeeId)}`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      );
      // Update local state: mark all employee/admin messages as read
      setMessages(prev =>
        prev.map(msg =>
          msg.sender_type !== "vendor" && !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
      lastMarkedSessionRef.current = sId;
    } catch (err) {
      // Non-critical: silently ignore mark-read errors
      console.warn("mark-read failed:", err);
    } finally {
      markReadInFlightRef.current = false;
    }
  }, [employeeId]);

  /* ── ESTABLISH SESSION (PERMANENT FIX) ── */
  useEffect(() => {
    if (!employeeId || !rawPhone) {
      setSessionError("Missing chat session details.");
      return;
    }

    let cancelled = false;
    const createSession = async () => {
      setCreatingSession(true);
      setSessionError(null);
      try {
        let sId = null;

        // 1. ALWAYS check the database for the active session first!
        try {
          const getRes = await fetch(
            `${BASE_URL}/chat/sessions/employee/${employeeId}?mobile_number=${encodeURIComponent(rawPhone)}`,
            { headers: authHeaders() }
          );
          if (getRes.ok) {
            const getJson = await getRes.json();
            if (getJson?.data?.id) {
              sId = getJson.data.id;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch existing session, checking URL fallback", e);
        }

        // 2. If the database didn't have an active session, but we have one in the URL, use it
        if (!sId && sessionIdFromQuery) {
          sId = sessionIdFromQuery;
        }

        // 3. If we STILL don't have a session, create a brand new one
        if (!sId) {
          if (!campaignIdFromQuery || !jobCategoryIdFromQuery) {
            throw new Error("Missing campaign or job category details to create a new session.");
          }

          const postRes = await fetch(`${BASE_URL}/chat/sessions/start`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              employee_id: employeeId,
              mobile_number: rawPhone,
              campaign_id: Number(campaignIdFromQuery),
              job_category_id: jobCategoryIdFromQuery,
            }),
          });
          if (!postRes.ok) throw new Error(`Error ${postRes.status}`);
          const postJson = await postRes.json();
          sId = postJson?.data?.id;
        }

        if (cancelled) return;
        if (!sId) throw new Error("Chat session response did not include a session id.");

        // Update the state with the true, active session ID
        setSessionId(sId);
      } catch (err: any) {
        if (!cancelled) setSessionError(err.message || "Failed to start chat session.");
      } finally {
        if (!cancelled) setCreatingSession(false);
      }
    };

    createSession();
    return () => { cancelled = true; };
  }, [employeeId, rawPhone, sessionIdFromQuery, campaignIdFromQuery, jobCategoryIdFromQuery]);

  /* ── FETCH MESSAGES ── */
  const fetchMessages = useCallback(async (silent = false) => {
    if (!sessionId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const qs = new URLSearchParams({ limit: "50", offset: "0", employee_id: employeeId });
      const res = await fetch(`${BASE_URL}/chat/messages/${sessionId}?${qs.toString()}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      const data: ChatMessage[] = (json.data || [])
        .slice()
        .sort((a: ChatMessage, b: ChatMessage) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setMessages(data);
      setMessagesError(null);

      // ── MARK-READ: call whenever we receive messages that include
      //    unread employee/admin messages (i.e., the other side sent something)
      const hasUnreadIncoming = data.some(
        msg => msg.sender_type !== "vendor" && !msg.read_at
      );
      if (hasUnreadIncoming) {
        markMessagesAsRead(sessionId);
      }
    } catch (err: any) {
      if (!silent) setMessagesError(err.message || "Failed to load messages.");
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [sessionId, employeeId, markMessagesAsRead]);

  // Initial load + polling for new incoming messages
  useEffect(() => {
    if (!sessionId) return;
    fetchMessages(false);

    pollRef.current = setInterval(() => fetchMessages(true), MESSAGE_POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId, fetchMessages]);

  // Also fire mark-read when the chat tab gains focus (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && sessionId) {
        const hasUnread = messages.some(
          msg => msg.sender_type !== "vendor" && !msg.read_at
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

  /* ── FILE SELECTION ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setShowAttachMenu(false);
    }
  };

  /* ── SEND MESSAGE ── */
  const sendMessage = async () => {
    const text = inputText.trim();
    if ((!text && !selectedFile) || !sessionId || sending) return;

    setSending(true);
    setSendError(null);
    setInputText("");

    try {
      let res;

      if (selectedFile) {
        // Upload API using FormData
        const formData = new FormData();
        formData.append("session_id", sessionId);
        formData.append("employee_id", employeeId);
        formData.append("message_text", text);
        formData.append("sender_type", "vendor"); // <--- ADDED SENDER_TYPE HERE
        formData.append("file", selectedFile);

        res = await fetch(`${BASE_URL}/chat/messages/upload`, {
          method: "POST",
          headers: {
            // Note: Do NOT set Content-Type manually when using FormData
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: formData,
        });
      } else {
        // Existing Send API for text only
        res = await fetch(`${BASE_URL}/chat/messages/send`, {
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
      setInputText(text); // restore the draft
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

  // Filter messages based on search query
  const displayedMessages = messages.filter(msg => {
    if (!searchQuery.trim()) return true;
    return msg.message_text?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const dateLabel = displayedMessages.length 
    ? formatDateLabel(displayedMessages[0].created_at) 
    : messages.length 
      ? formatDateLabel(messages[0].created_at) 
      : "Today";

  /* ── FATAL STATE: no session and unable to create one ── */
  if (sessionError && !sessionId && !creatingSession) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px", padding: "24px", textAlign: "center", background: C.bg }}>
          <AlertTriangle size={40} color={C.red} />
          <div style={{ fontSize: "16px", fontWeight: 600, color: C.textHeading, maxWidth: "420px" }}>{sessionError}</div>
          <button
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: C.red, border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bg }}>

        {/* ── HEADER ── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
          style={{
            display: "flex", alignItems: "center", gap: "16px",
            padding: "0 24px", height: "64px",
            background: C.surface,
            borderBottom: `1px solid ${C.border}`,
            boxShadow: `0 1px 4px ${C.shadow}`,
            zIndex: 10, flexShrink: 0
          }}>

          {/* Back */}
          <motion.button
            whileHover={{ backgroundColor: C.redActiveBg, color: C.red }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "36px", height: "36px", borderRadius: "8px",
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.textMuted, cursor: "pointer", transition: "all 0.2s", flexShrink: 0
            }}>
            <ArrowLeft size={18} />
          </motion.button>

          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.red}, #EF5350)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: "15px",
              fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.5px"
            }}>
              {initials}
            </div>
          </div>

          {/* Name & phone last 4 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "15px", fontWeight: 700, color: C.textHeading,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {displayName}
            </div>
            <div style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500, marginTop: "1px" }}>
              ···· {last4}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px" }}>
            <motion.button 
              whileHover={{ backgroundColor: C.redActiveBg, color: C.red }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(""); }}
              style={{ 
                width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", 
                background: isSearchOpen ? C.redActiveBg : "transparent", 
                border: `1px solid ${isSearchOpen ? C.red : C.border}`, 
                borderRadius: "8px", 
                color: isSearchOpen ? C.red : C.textMuted, 
                cursor: "pointer", transition: "all 0.2s" 
              }}>
              <Search size={16} />
            </motion.button>
            <motion.button whileHover={{ backgroundColor: C.redActiveBg, color: C.red }} whileTap={{ scale: 0.95 }}
              style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textMuted, cursor: "pointer", transition: "all 0.2s" }}>
              <MoreVertical size={16} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── SEARCH INPUT BAR ANIMATION ── */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", flexShrink: 0, zIndex: 9 }}>
              <div style={{ padding: "10px 24px", background: C.inputBg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                <Search size={14} color={C.textMuted} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search in conversation..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: C.textBody, fontFamily: "'DM Sans', sans-serif" }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex" }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SESSION-STARTING BANNER ── */}
        {creatingSession && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: C.pendingBg, color: C.pendingText, fontSize: "13px", fontWeight: 500, flexShrink: 0 }}>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Starting chat session…
          </div>
        )}

        {/* ── MESSAGES AREA ── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "24px 0",
          background: C.chatBg,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}>
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
                <button
                  onClick={() => fetchMessages(false)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : (
              <>
                {/* Date label */}
                <div style={{ textAlign: "center", margin: "12px 0" }}>
                  <span style={{ fontSize: "12px", color: C.textMuted, background: "rgba(255,255,255,0.85)", padding: "4px 14px", borderRadius: "12px", fontWeight: 500, boxShadow: `0 1px 2px ${C.shadow}` }}>
                    {dateLabel}
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: C.textMuted, fontSize: "13px", padding: "40px 0" }}>
                    No messages yet. Start the conversation below.
                  </div>
                ) : displayedMessages.length === 0 ? (
                  <div style={{ textAlign: "center", color: C.textMuted, fontSize: "13px", padding: "40px 0" }}>
                    No messages found matching "{searchQuery}".
                  </div>
                ) : (
                  displayedMessages.map((msg, idx) => {
                    const isVendor = msg.sender_type === "vendor";
                    const prevMsg = displayedMessages[idx - 1];
                    const isSameGroup = !!prevMsg && prevMsg.sender_type === msg.sender_type;

                    // For vendor-sent messages, determine tick state:
                    // Using original `messages` array so filtering doesn't break tick logic
                    const originalIdx = messages.findIndex(m => m.id === msg.id);
                    const employeeRepliedAfter = isVendor && messages.slice(originalIdx + 1).some(
                      m => m.sender_type === "employee"
                    );
                    const isDelivered = isVendor && !!msg.id; // has a server-assigned id
                    const isReadByEmployee = isVendor && (!!msg.read_at || employeeRepliedAfter);

                    return (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          display: "flex",
                          justifyContent: isVendor ? "flex-end" : "flex-start",
                          marginTop: isSameGroup ? "2px" : "10px",
                          paddingLeft: isVendor ? "60px" : "0",
                          paddingRight: isVendor ? "0" : "60px",
                        }}>

                        {/* Employee avatar */}
                        {!isVendor && !isSameGroup && (
                          <div style={{
                            width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                            background: `linear-gradient(135deg, ${C.red}, #EF5350)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: "11px", fontWeight: 700,
                            marginRight: "8px", alignSelf: "flex-end"
                          }}>
                            {initials.slice(0, 1)}
                          </div>
                        )}
                        {!isVendor && isSameGroup && <div style={{ width: "36px", flexShrink: 0 }} />}

                        {/* Bubble */}
                        <div style={{
                          maxWidth: "65%", padding: "9px 14px",
                          borderRadius: isVendor ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                          background: isVendor ? C.msgSent : C.msgReceived,
                          color: isVendor ? C.msgSentText : C.msgReceivedText,
                          boxShadow: `0 1px 2px ${C.shadow}`,
                        }}>

                          {/* Media Display */}
                          {msg.media_url && (
                            <div style={{ marginBottom: msg.message_text ? '6px' : '0' }}>
                              {msg.message_type === 'image' || msg.media_url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
                                  <img src={msg.media_url} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover', display: 'block' }} />
                                </a>
                              ) : (
                                <a href={msg.media_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', color: 'inherit', textDecoration: 'none', fontSize: '13px' }}>
                                  <FileText size={16} /> Document
                                </a>
                              )}
                            </div>
                          )}

                          {/* Text Display */}
                          {msg.message_text && (
                            <div style={{ fontSize: "14px", lineHeight: 1.5, wordBreak: "break-word" }}>
                              {msg.message_text}
                            </div>
                          )}

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "3px", marginTop: "5px", minHeight: "16px" }}>
                            <span style={{ fontSize: "11px", lineHeight: "13px", color: isVendor ? "rgba(255,255,255,0.72)" : C.textHint }}>
                              {formatTime(msg.created_at)}
                            </span>
                            {isVendor && (
                              <span style={{
                                display: "inline-flex", alignItems: "center",
                                color: isReadByEmployee
                                  ? "#4FC3F7"                    // blue  — read / employee replied
                                  : "rgba(255,255,255,0.75)",   // white-ish — sent / delivered
                              }}>
                                {isDelivered
                                  ? isReadByEmployee
                                    ? <CheckCheck size={13} />   // ✓✓ blue
                                    : <CheckCheck size={13} />   // ✓✓ white (delivered, not read)
                                  : <Check size={13} />          // ✓  white (sending / optimistic)
                                }
                              </span>
                            )}
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

        {/* ── SEND ERROR BANNER ── */}
        {sendError && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 24px", background: C.alertBg, color: C.alertText, fontSize: "13px", fontWeight: 500, flexShrink: 0 }}>
            <span>{sendError}</span>
            <button onClick={() => setSendError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.alertText, padding: "2px", display: "flex" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── INPUT AREA ── */}
        <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "12px 24px", flexShrink: 0 }}>
          <div style={{ maxWidth: "820px", margin: "0 auto", display: "flex", alignItems: "flex-end", gap: "10px" }}>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Attach */}
            <div style={{ position: "relative" }}>
              <motion.button
                whileHover={{ backgroundColor: C.redActiveBg, color: C.red }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAttachMenu(prev => !prev)}
                disabled={!canCompose}
                style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "10px", color: C.textMuted, cursor: canCompose ? "pointer" : "not-allowed", opacity: canCompose ? 1 : 0.5, transition: "all 0.2s", flexShrink: 0 }}>
                <Paperclip size={18} />
              </motion.button>

              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    style={{ position: "absolute", bottom: "52px", left: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", boxShadow: `0 8px 32px ${C.shadowMd}`, padding: "8px", minWidth: "160px", zIndex: 100 }}>
                    {[
                      { icon: <ImageIcon size={16} />, label: "Photo / Video", accept: "image/*,video/*" },
                      { icon: <FileText size={16} />, label: "Document", accept: ".pdf,.doc,.docx,.txt" },
                    ].map(item => (
                      <button key={item.label}
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = item.accept;
                            fileInputRef.current.click();
                          }
                          setShowAttachMenu(false);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", background: "transparent", border: "none", borderRadius: "8px", color: C.textLabel, fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = C.inputBg)}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <span style={{ color: C.red }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Text input with File Preview */}
            <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: '8px', width: 'fit-content' }}>
                  <span style={{ fontSize: '12px', color: C.textBody, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </span>
                  <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: C.textMuted }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              <div style={{ position: "relative" }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={canCompose ? "Type a message…" : "Waiting for chat session…"}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!canCompose}
                  style={{ width: "100%", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "11px 44px 11px 16px", color: C.textBody, fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none", lineHeight: 1.5, transition: "border-color 0.2s", opacity: canCompose ? 1 : 0.6 }}
                  onFocus={e => (e.target.style.borderColor = C.red)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                />
                <button style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textHint, padding: "2px", display: "flex" }}>
                  <Smile size={18} />
                </button>
              </div>
            </div>

            {/* Send */}
            <motion.button
              whileHover={(inputText.trim() || selectedFile) && canCompose && !sending ? { opacity: 0.9 } : {}}
              whileTap={(inputText.trim() || selectedFile) && canCompose && !sending ? { scale: 0.95 } : {}}
              onClick={sendMessage}
              disabled={(!inputText.trim() && !selectedFile) || !canCompose || sending}
              style={{
                width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center",
                background: (inputText.trim() || selectedFile) && canCompose && !sending ? C.red : C.inputBg,
                border: "none", borderRadius: "10px",
                color: (inputText.trim() || selectedFile) && canCompose && !sending ? "#fff" : C.textHint,
                cursor: (inputText.trim() || selectedFile) && canCompose && !sending ? "pointer" : "not-allowed",
                transition: "all 0.2s", flexShrink: 0
              }}>
              {sending ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
            </motion.button>
          </div>
        </div>

      </div>
    </>
  );
}