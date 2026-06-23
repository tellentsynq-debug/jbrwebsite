"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, cubicBezier, type Variants } from "framer-motion";
import { 
  LogOut, Plus, UserCog, X, ChevronDown, CheckCircle, AlertCircle
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import { useRouter } from "next/navigation";

/* ─── DESIGN TOKENS (LIGHT GRAY PROFESSIONAL THEME) ─────────── */
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
  successBorder: "rgba(5,150,105,0.25)",
  pendingBg: "rgba(59,130,246,0.08)",
  pendingBorder: "rgba(59,130,246,0.2)",
  pendingText: "#3B82F6",
  alertBg: "rgba(198,40,40,0.08)",
  alertText: "#C62828",
  alertBorder: "rgba(198,40,40,0.25)",
  shadow: "rgba(0,0,0,0.06)",
  shadowMd: "rgba(0,0,0,0.10)",
};

/* ─── GLOBAL CSS & ANIMATIONS ────────────────────────────────── */
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
    box-shadow: 0 1px 3px ${C.shadow}, 0 4px 16px ${C.shadow};
  }

  .table-container { width: 100%; overflow-x: auto; }
  .table-min-width { min-width: 900px; }

  select { appearance: none; background-color: transparent; cursor: pointer; }
  select option { background-color: ${C.surface}; color: ${C.textHeading}; }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

/* ─── TYPES ─────────────────────────────────────────────────── */
interface UserData {
  id: string | number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
}

/* ─── HELPER FUNCTIONS ───────────────────────────────────────── */
const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'SUPER ADMIN': return { bg: C.alertBg,    color: C.alertText   };
    case 'RECRUITER':   return { bg: C.successBg,  color: C.successText };
    case 'VIEWER':
    default:            return { bg: C.inputBg,    color: C.textMuted   };
  }
};

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);
const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }};
const itemVars = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }};

/* ─── TOAST NOTIFICATION ─────────────────────────────────────── */
type ToastType = "success" | "error";
interface ToastProps { message: string; type: ToastType; }

function Toast({ message, type }: ToastProps) {
  const isSuccess = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, y: -16, scale: 0.97 }}
      transition={{ type: "spring" as const, stiffness: 260, damping: 22 }}
      style={{
        position: "fixed", top: "28px", left: "50%", transform: "translateX(-50%)",
        zIndex: 200, display: "flex", alignItems: "center", gap: "12px",
        padding: "14px 22px",
        background: isSuccess ? C.successBg  : C.alertBg,
        border:     `1px solid ${isSuccess ? C.successBorder : C.alertBorder}`,
        borderRadius: "12px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        minWidth: "300px", maxWidth: "480px",
        pointerEvents: "none",
      }}
    >
      {isSuccess
        ? <CheckCircle size={20} color={C.successText} strokeWidth={2.5} />
        : <AlertCircle  size={20} color={C.alertText}   strokeWidth={2.5} />
      }
      <span style={{
        fontSize: "14px", fontWeight: 600,
        color: isSuccess ? C.successText : C.alertText,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {message}
      </span>
    </motion.div>
  );
}

/* ─── TOP NAV ────────────────────────────────────────────────── */
function TopNav() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; email?: string } | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("jbr_user");
    if (s) try { setUser(JSON.parse(s)); } catch {}
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: easeOutCirc }}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 40px", borderBottom: `1px solid ${C.border}`,
        background: C.surface, position: "sticky", top: 0, zIndex: 10
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHint, fontWeight: 600 }}>Administration</span>
        <span style={{ color: C.textMuted }}>/</span>
        <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHeading, fontWeight: 600 }}>User Management</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <span style={{ fontSize: "13px", color: C.textMuted }}>
          Welcome, <span style={{ color: C.textHeading, fontWeight: 600 }}>
            {user ? (user.firstName ? `${user.firstName} (${user.email})` : user.email) : "Loading..."}
          </span>
        </span>
        <motion.button
          onClick={() => { localStorage.removeItem("jbr_token"); localStorage.removeItem("jbr_user"); router.push("/"); }}
          whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }} whileTap={{ scale: 0.98 }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}
        >
          Sign Out <LogOut size={16} />
        </motion.button>
      </div>
    </motion.header>
  );
}

/* ─── FORM FIELD ─────────────────────────────────────────────── */
function FormField({
  label, placeholder, type = "text", autoFocus = false, value, onChange
}: {
  label: string; placeholder: string; type?: string;
  autoFocus?: boolean; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "12px 16px",
          background: C.inputBg,
          border: `1px solid ${focused ? C.red : C.border}`,
          borderRadius: "8px", color: C.textBody, fontSize: "14px",
          outline: "none", transition: "all 0.2s ease",
        }}
      />
    </div>
  );
}

/* ─── TOGGLE SWITCH ──────────────────────────────────────────── */
function ToggleSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: "44px", height: "24px", borderRadius: "12px",
          background: value ? C.successText : C.borderHover,
          position: "relative", cursor: "pointer", transition: "background 0.3s ease"
        }}
      >
        <motion.div
          layout initial={false} animate={{ x: value ? 22 : 2 }}
          style={{ width: "20px", height: "20px", borderRadius: "50%", background: C.white, position: "absolute", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
        />
      </div>
      <span style={{ fontSize: "14px", color: C.textBody, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function UserManagementPage() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab]   = useState("user_mgmt");
  const [isModalOpen, setModalOpen] = useState(false);
  
  // Table Data State
  const [users, setUsers]           = useState<UserData[]>([]);
  const [isLoading, setIsLoading]   = useState(true);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Form state
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [phone,      setPhone]      = useState("");
  const [isActive,   setIsActive]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const tableGridTemplate = "1.5fr 2fr 1fr 1fr 1fr";

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setFirstName(""); setLastName(""); setEmail("");
    setPhone(""); setIsActive(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  // Fetch Users Function
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jbr_token") || "" : "";
      
      const response = await fetch("https://jbrstaffingsolutions.com/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Map backend payload to UI state structure
        const formattedUsers: UserData[] = data.map((u: any) => ({
          id: u.id,
          name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Not provided",
          email: u.email || "No email",
          role: (u.role || "viewer").replace('_', ' ').toUpperCase(),
          status: u.is_active ? "Active" : "Inactive",
          lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : "Never",
        }));

        // Reverse the array to show newest users at the top
        setUsers(formattedUsers.reverse());
      } else {
        showToast("Failed to fetch users.", "error");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Network error. Could not load users.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    // 1. Frontend Validation
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jbr_token") || "" : "";
      
      const response = await fetch("https://jbrstaffingsolutions.com/api/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        // 2. Reverted strictly to the camelCase body you provided
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email,
          phoneNumber: phone,
          role: "user", 
          isActive: isActive
        }),
      });

      const data = await response.json();

      if (response.ok) {
        closeModal();
        showToast(`User "${firstName} ${lastName}" created successfully.`, "success");
        await fetchUsers(); // Refresh the table
      } else {
        // 3. Gracefully catch the backend validation errors
        const errorMessage = data.message || data.detail || data.error || "Failed to create user. Please try again.";
        showToast(errorMessage, "error");
      }
    } catch (err) {
      showToast("A network error occurred. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar
          isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed}
          activeTab={activeTab} setActiveTab={setActiveTab}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", position: "relative" }}>
          <TopNav />

          <main style={{ padding: "40px", maxWidth: "1600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}
            >
              <div>
                <h1 style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: 600, color: C.textHeading, marginBottom: "8px", letterSpacing: "-0.5px" }}>
                  <UserCog size={32} color={C.red} strokeWidth={2} /> User Management
                </h1>
                <p style={{ fontSize: "15px", color: C.textMuted }}>Manage users and their roles in the system.</p>
              </div>

              <motion.button
                onClick={() => setModalOpen(true)}
                whileHover={{ y: -2, boxShadow: `0 4px 16px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px",
                  background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                  border: "none", borderRadius: "8px",
                  color: C.white, fontSize: "14px", fontWeight: 600, letterSpacing: "0.5px",
                  cursor: "pointer", boxShadow: `0 2px 8px ${C.redGlow}`
                }}
              >
                <Plus size={18} />
                <span>Add User</span>
              </motion.button>
            </motion.div>

            {/* Data Table */}
            <motion.div variants={containerVars} initial="hidden" animate="show" className="clean-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

              <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: "20px", fontWeight: 600, color: C.textHeading }}>Users</h3>
                <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "4px" }}>Manage system users and their access levels</p>
              </div>

              <div className="table-container">
                <div className="table-min-width">

                  {/* Column Headers */}
                  <div style={{ display: "grid", gridTemplateColumns: tableGridTemplate, padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: C.inputBg, alignItems: "center" }}>
                    {["Name", "Email", "Role", "Status", "Last Login"].map((head, i) => (
                      <span key={i} style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: C.textHint, fontWeight: 600 }}>{head}</span>
                    ))}
                  </div>

                  {/* Rows */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {isLoading ? (
                      <div style={{ padding: "32px", textAlign: "center", color: C.textMuted, fontSize: "14px" }}>
                        Loading users...
                      </div>
                    ) : users.length === 0 ? (
                      <div style={{ padding: "32px", textAlign: "center", color: C.textMuted, fontSize: "14px" }}>
                        No users found.
                      </div>
                    ) : (
                      users.map((user, idx) => {
                        const roleStyle = getRoleBadgeStyle(user.role);
                        const isActiveUser = user.status.toLowerCase() === "active";
                        return (
                          <motion.div
                            key={user.id} variants={itemVars}
                            whileHover={{ backgroundColor: C.inputBg }}
                            style={{
                              display: "grid", gridTemplateColumns: tableGridTemplate, alignItems: "center",
                              padding: "20px 32px", borderBottom: idx !== users.length - 1 ? `1px solid ${C.border}` : "none",
                              transition: "background-color 0.2s ease"
                            }}
                          >
                            <div style={{ fontSize: "15px", fontWeight: 600, color: C.textHeading }}>
                              {user.name !== "Not provided" ? user.name : <span style={{ color: C.textHint, fontStyle: "italic", fontWeight: 500 }}>Not provided</span>}
                            </div>
                            <div style={{ fontSize: "14px", color: C.textMuted, wordBreak: "break-all", paddingRight: "16px" }}>
                              {user.email}
                            </div>
                            <div>
                              <div style={{ display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: "20px", background: roleStyle.bg, color: roleStyle.color, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {user.role}
                              </div>
                            </div>
                            <div>
                              <div style={{ display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: "20px", background: isActiveUser ? C.successBg : C.alertBg, color: isActiveUser ? C.successText : C.alertText, fontSize: "11px", fontWeight: 600, textTransform: "capitalize", letterSpacing: "0.5px" }}>
                                {user.status}
                              </div>
                            </div>
                            <div style={{ fontSize: "14px", color: C.textMuted }}>
                              {user.lastLogin}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                </div>
              </div>
            </motion.div>

          </main>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}
              onClick={closeModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
              style={{
                position: "relative", width: "100%", maxWidth: "560px", margin: "24px",
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: "20px",
                boxShadow: `0 4px 16px ${C.shadowMd}`
              }}
            >
              {/* Close */}
              <button
                onClick={closeModal}
                style={{ position: "absolute", right: "24px", top: "24px", background: "transparent", border: "none", color: C.textHint, cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.textHeading)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textHint)}
              >
                <X size={24} />
              </button>

              <div style={{ padding: "32px 32px 24px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 600, color: C.textHeading, marginBottom: "8px" }}>Create User</h2>
                <p style={{ fontSize: "14px", color: C.textMuted }}>Create a new user account.</p>
              </div>

              <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

                <div style={{ display: "flex", gap: "16px" }}>
                  <FormField label="First Name *" placeholder="Jane" autoFocus value={firstName} onChange={setFirstName} />
                  <FormField label="Last Name *"  placeholder="Doe"  value={lastName}  onChange={setLastName}  />
                </div>

                <FormField label="Email *"        placeholder="jane@jbrstaffingsolutions.com" type="email" value={email} onChange={setEmail} />
                <FormField label="Phone Number"   placeholder="+1 (555) 000-0000"             type="tel"   value={phone} onChange={setPhone} />

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: C.textLabel }}>Role</label>
                  <div style={{
                    width: "100%", padding: "12px 16px",
                    background: C.inputBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px", color: C.textMuted, fontSize: "14px",
                    cursor: "not-allowed",
                  }}>
                    User
                  </div>
                </div>

                <ToggleSwitch label="Active" value={isActive} onChange={setIsActive} />

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                  <motion.button
                    whileHover={{ backgroundColor: C.inputBg, color: C.red, borderColor: C.red }} whileTap={{ scale: 0.98 }}
                    onClick={closeModal}
                    disabled={submitting}
                    style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textLabel, fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={!submitting ? { y: -1, boxShadow: `0 4px 16px ${C.redGlow}` } : {}} whileTap={!submitting ? { scale: 0.98 } : {}}
                    onClick={handleCreateUser}
                    disabled={submitting}
                    style={{
                      padding: "10px 28px", background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
                      border: "none", borderRadius: "8px", color: C.white,
                      fontSize: "14px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                      boxShadow: `0 2px 8px ${C.redGlow}`, opacity: submitting ? 0.75 : 1,
                      display: "flex", alignItems: "center", gap: "8px", transition: "opacity 0.2s",
                    }}
                  >
                    {submitting && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.7s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    )}
                    {submitting ? "Creating…" : "Create User"}
                  </motion.button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}




