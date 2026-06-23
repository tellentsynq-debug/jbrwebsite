"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const C = {
  bg: "#F0F2F5",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  panel: "#FFFFFF",
  red: "#C62828",
  redBright: "#E53935",
  redGlow: "rgba(229,57,53,0.20)",
  redActiveBg: "rgba(198,40,40,0.08)",
  white: "#FFFFFF",
  textHeading: "#111111",
  textBody: "#1A1A1A",
  textLabel: "#374151",
  textMuted: "#6B7280",
  textHint: "#9BA3AF",
  border: "rgba(0,0,0,0.07)",
  borderHover: "rgba(0,0,0,0.14)",
  inputBg: "#F4F6F8",
};

/* ─── KEYFRAMES & GLOBAL STYLES ──────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: ${C.bg}; overflow-x: hidden; color: ${C.textBody}; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes slideRight {
    from { transform: translateX(-100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.93); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes inputReveal {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes successPop {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes lineGrow {
    from { width: 0; }
    to   { width: 40px; }
  }
  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px ${C.surface} inset !important;
    -webkit-text-fill-color: ${C.textBody} !important;
    transition: background-color 5000s;
  }
  input::placeholder { color: ${C.textHint}; }
  input:focus        { outline: none; }
  button:focus-visible { outline: 2px solid ${C.redBright}; outline-offset: 3px; }

  .form-field { animation: inputReveal 0.4s cubic-bezier(0.4,0,0.2,1) both; }
  .form-field:nth-child(1) { animation-delay: 0.05s; }
  .form-field:nth-child(2) { animation-delay: 0.10s; }
  .form-field:nth-child(3) { animation-delay: 0.15s; }
  .form-field:nth-child(4) { animation-delay: 0.20s; }
  .form-field:nth-child(5) { animation-delay: 0.25s; }

  .stat-item { animation: fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) both; }
  .stat-item:nth-child(1) { animation-delay: 0.7s; }
  .stat-item:nth-child(2) { animation-delay: 0.85s; }
  .stat-item:nth-child(3) { animation-delay: 1.0s; }
`;

/* ─── TICKER ─────────────────────────────────────────────────── */
function Ticker() {
  const items = ["Talent Redefined", "500+ Partners", "10,000+ Placed", "Redefining Culture", "India's Premier Staffing", "People First"];
  const doubled = [...items, ...items];
  return (
    <div style={{
      overflow: "hidden",
      borderTop:    `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      padding: "10px 0",
      background: C.inputBg,
      marginBottom: "40px",
      width: "100%"
    }}>
      <div style={{
        display: "flex", gap: "48px", animation: "ticker 18s linear infinite", width: "max-content", whiteSpace: "nowrap"
      }}>
        {doubled.map((t, i) => (
          <span key={i} style={{
            fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase",
            color: i % 2 === 0 ? C.textMuted : C.textHeading,
            fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: "16px"
          }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: C.red, display: "inline-block" }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── LOGO ───────────────────────────────────────────────────── */
function Logo({ animate }: { animate?: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
      marginBottom: "36px",
      animation: animate ? "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" : undefined,
    }}>
      <div style={{
        display: "flex", alignItems: "stretch", border: `1.5px solid ${C.border}`, position: "relative", overflow: "hidden",
      }}>
        <div style={{ padding: "8px 10px 8px 14px", borderRight: `1.5px solid ${C.border}` }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "34px", fontWeight: 600, color: C.red, letterSpacing: "3px", lineHeight: 1, display: "block",
          }}>JBR</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 12px", gap: "1px" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "9.5px", letterSpacing: "4px", color: C.textHeading, textTransform: "uppercase" }}>STAFFING</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "9.5px", letterSpacing: "4px", color: C.textMuted, textTransform: "uppercase" }}>SOLUTIONS</span>
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "2.5px", color: C.textMuted, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ width: "20px", height: "1px", background: C.border }} />
        Redefining People &amp; Culture
        <div style={{ width: "20px", height: "1px", background: C.border }} />
      </div>
    </div>
  );
}

/* ─── TAB SWITCHER ───────────────────────────────────────────── */
function ModeTabs({ mode, onSwitch }: { mode: Mode; onSwitch: (m: Mode) => void }) {
  return (
    <div style={{
      display: "flex",
      background: C.inputBg,
      border: `1px solid ${C.border}`,
      borderRadius: "12px",
      padding: "4px",
      marginBottom: "30px",
      position: "relative",
    }}>
      {(["signin","signup"] as Mode[]).map(m => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            onClick={() => onSwitch(m)}
            style={{
              flex: 1, padding: "10px 16px", border: "none", borderRadius: "9px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase",
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              background: isActive ? C.redActiveBg : "transparent",
              color: isActive ? C.red : C.textLabel,
              position: "relative", overflow: "hidden",
            }}
          >
            {isActive && (
              <div style={{
                position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                width: "3px", height: "16px", background: C.red, borderRadius: "0 2px 2px 0"
              }} />
            )}
            {m === "signin" ? "Sign In" : "Register"}
          </button>
        );
      })}
    </div>
  );
}

/* ─── INPUT FIELD ────────────────────────────────────────────── */
interface FieldProps {
  label: string;
  hint?: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  icon?: React.ReactNode;
  delay?: number;
}
function Field({ label, hint, type="text", placeholder, value, onChange, autoComplete, icon, delay=0 }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";

  return (
    <div className="form-field" style={{ marginBottom: "16px", animationDelay: `${delay}s` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
        <label style={{
          fontSize: "10.5px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase",
          fontFamily: "'DM Sans',sans-serif", color: C.textLabel, transition: "color 0.2s",
        }}>
          {label}
        </label>
        {hint && (
          <span style={{
            fontSize: "11px", color: C.red, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", borderBottom: `1px solid ${C.redActiveBg}`,
          }}>{hint}</span>
        )}
      </div>
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{
            position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
            color: focused ? C.red : C.textMuted, transition: "color 0.2s", display: "flex", pointerEvents: "none",
          }}>{icon}</div>
        )}
        <input
          type={isPwd && showPwd ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          autoComplete={autoComplete}
          style={{
            width: "100%", padding: `13px ${isPwd ? "44px" : "14px"} 13px ${icon ? "42px" : "14px"}`,
            background: focused ? C.surface : C.inputBg,
            border: `1px solid ${focused ? C.red : hovered ? C.borderHover : C.border}`,
            borderRadius: "10px", color: C.textBody, fontSize: "14px", fontFamily: "'DM Sans',sans-serif",
            transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)", boxSizing: "border-box",
          }}
        />
        {isPwd && (
          <button
            type="button" onClick={() => setShowPwd(s => !s)}
            style={{
              position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none",
              cursor: "pointer", color: C.textMuted, padding: 0, display: "flex", transition: "color 0.2s",
            }}
          >
            {showPwd ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── PASSWORD STRENGTH ──────────────────────────────────────── */
function PwdStrength({ pwd }: { pwd: string }) {
  if (!pwd) return null;
  let s = 0;
  if (pwd.length >= 8)          s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const cols = ["#EF5350","#F59E0B","#10B981","#059669"];
  const labs = ["Weak","Fair","Good","Strong"];
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: "3px", borderRadius: "2px", background: i < s ? cols[s-1] : C.border, transition: "background 0.35s cubic-bezier(0.4,0,0.2,1)",
          }} />
        ))}
      </div>
      <span style={{ fontSize: "10px", color: s > 0 ? cols[s-1] : C.textMuted, fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.5px" }}>
        {s > 0 ? labs[s-1] : ""}
      </span>
    </div>
  );
}

/* ─── PRIMARY BUTTON ─────────────────────────────────────────── */
function PrimaryBtn({ label, loading, onClick }: { label: string; loading?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      disabled={loading}
      style={{
        width: "100%", padding: "14px",
        background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
        border: "none", borderRadius: "10px", color: C.white, fontSize: "13px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif",
        cursor: loading ? "not-allowed" : "pointer", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        transform: press ? "scale(0.985) translateY(1px)" : hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 6px 20px ${C.redGlow}, 0 2px 6px rgba(0,0,0,0.08)` : `0 4px 16px ${C.redGlow}`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px", position: "relative", overflow: "hidden", opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.7s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      ) : null}
      <span style={{ position: "relative", zIndex: 1 }}>{loading ? "Processing…" : label}</span>
    </button>
  );
}

/* ─── GHOST BUTTON ───────────────────────────────────────────── */
function GhostBtn({ label, onClick }: { label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", padding: "12px", background: hov ? C.redActiveBg : "transparent",
        border: `1px solid ${hov ? C.red : C.border}`, borderRadius: "10px",
        color: hov ? C.red : C.textLabel, fontSize: "13px", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
        cursor: "pointer", transition: "all 0.2s ease", marginTop: "8px",
      }}
    >
      {label}
    </button>
  );
}

/* ─── SUCCESS OVERLAY ────────────────────────────────────────── */
function SuccessFlash({ visible, mode }: { visible: boolean; mode: Mode }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 20, background: C.surface,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "24px", animation: "fadeIn 0.3s ease both",
    }}>
      <div style={{
        width: "64px", height: "64px", borderRadius: "50%", border: `1.5px solid ${C.red}`, background: C.redActiveBg,
        display: "flex", alignItems: "center", justifyContent: "center", animation: "successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both", marginBottom: "20px",
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p style={{ color: C.textHeading, fontSize: "18px", fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, letterSpacing: "1px", marginBottom: "8px" }}>
        {mode === "signin" ? "Welcome back." : "Account created."}
      </p>
      <p style={{ color: C.textMuted, fontSize: "13px", fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.5px" }}>
        Redirecting…
      </p>
    </div>
  );
}

/* ─── LEFT PANEL ─────────────────────────────────────────────── */
function BrandPanel() {
  return (
    <div className="brand-hide" style={{
      flex: 4, display: "flex", flexDirection: "column", justifyContent: "center", padding: "52px 8%",
      background: C.panel, borderRight: `1px solid ${C.border}`, position: "relative", overflow: "hidden", animation: "slideRight 0.7s cubic-bezier(0.4,0,0.2,1) both",
    }}>
      <div style={{ marginBottom: "12vh" }}>
        <div style={{
          width: "0px", height: "3px", background: `linear-gradient(to right, ${C.redBright}, ${C.red})`, marginBottom: "48px", borderRadius: "2px", animation: "lineGrow 1s cubic-bezier(0.4,0,0.2,1) 0.3s both",
        }} />
        <div style={{ animation: "fadeUp 0.7s cubic-bezier(0.4,0,0.2,1) 0.2s both" }}>
          <div style={{
            fontSize: "11px", letterSpacing: "3.5px", textTransform: "uppercase", color: C.textLabel, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{ width: "20px", height: "1px", background: C.borderHover }} />
            Est. 2015
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "46px", lineHeight: 1.1, color: C.textHeading, letterSpacing: "-0.5px", marginBottom: "8px",
          }}>
            People are
            <br />our <span style={{ color: C.red, fontWeight: 600, fontStyle: "italic" }}>greatest</span>
            <br />asset.
          </h1>
          <p style={{
            fontSize: "14px", color: C.textMuted, lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif", marginTop: "20px", maxWidth: "420px",
          }}>
            We connect exceptional talent with organisations that value culture. Your career journey deserves a partner that truly understands.
          </p>
        </div>
      </div>

      <div>
        <div style={{ height: "1px", background: C.border, marginBottom: "28px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0" }}>
          {[
            { num: "500+", label: "Companies" },
            { num: "10K+", label: "Placed" },
            { num: "98%",  label: "Satisfaction" },
          ].map((s, i) => (
            <div key={s.label} className="stat-item" style={{ borderRight: i < 2 ? `1px solid ${C.border}` : "none", paddingRight: i < 2 ? "20px" : "0", paddingLeft: i > 0 ? "20px" : "0" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 600, color: C.textHeading, lineHeight: 1, marginBottom: "6px" }}>{s.num}</div>
              <div style={{ fontSize: "10.5px", fontWeight: 600, color: C.textLabel, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "28px", fontSize: "11px", color: C.textHint, letterSpacing: "0.5px", fontFamily: "'DM Sans',sans-serif" }}>
          © 2026 JBR Staffing Solutions Pvt. Ltd.
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN AUTH PAGE ─────────────────────────────────────────── */
export default function JBRAuth() {
  const [mode,      setMode]      = useState<Mode>("signin");
  const router = useRouter();
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState("");
  const [formKey,   setFormKey]   = useState(0);
  const [opacity,   setOpacity]   = useState(1);
  const [yOff,      setYOff]      = useState(0);

  // Sign-in fields
  const [email,     setEmail]     = useState("");
  const [pwd,       setPwd]       = useState("");

  // Sign-up fields
  const [first,     setFirst]     = useState("");
  const [last,      setLast]      = useState("");
  const [signEmail, setSignEmail] = useState("");
  const [signPwd,   setSignPwd]   = useState("");

  const switchMode = useCallback((next: Mode) => {
    if (next === mode) return;
    const d = next === "signup" ? 1 : -1;
    setOpacity(0);
    setYOff(-12 * d);
    setErrorMsg("");
    setTimeout(() => {
      setMode(next);
      setFormKey(k => k + 1);
      setYOff(12 * d);
      setTimeout(() => { setOpacity(1); setYOff(0); }, 40);
    }, 260);
  }, [mode]);

  const submit = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const BASE = "https://jbrstaffingsolutions.com/api";

      if (mode === "signin") {
        /* ── SIGN IN ── */
        const response = await fetch(`${BASE}/auth/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pwd }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Save access token from session object
          if (data.session?.access_token) {
            localStorage.setItem("jbr_token", data.session.access_token);
          }
          if (data.session?.refresh_token) {
            localStorage.setItem("jbr_refresh_token", data.session.refresh_token);
          }
          // Save user — prefer top-level user object; merge in user_metadata for convenience
          if (data.user) {
            const userToStore = {
              id:        data.user.id,
              email:     data.user.email,
              role:      data.user.role,
              firstName: data.user.user_metadata?.first_name ?? "",
              lastName:  data.user.user_metadata?.last_name  ?? "",
            };
            localStorage.setItem("jbr_user", JSON.stringify(userToStore));
          }

          setSuccess(true);
          setTimeout(() => router.push("/dashboard"), 1200);
        } else {
          setErrorMsg(data.message || "Authentication failed. Please try again.");
        }

      } else {
        /* ── SIGN UP ── */
        const response = await fetch(`${BASE}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email:      signEmail,
            password:   signPwd,
            first_name: first,
            last_name:  last,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Save access token if returned on signup
          if (data.session?.access_token) {
            localStorage.setItem("jbr_token", data.session.access_token);
          }
          if (data.session?.refresh_token) {
            localStorage.setItem("jbr_refresh_token", data.session.refresh_token);
          }
          if (data.user) {
            const userToStore = {
              id:        data.user.id,
              email:     data.user.email,
              role:      data.user.role,
              firstName: data.user.user_metadata?.first_name ?? first,
              lastName:  data.user.user_metadata?.last_name  ?? last,
            };
            localStorage.setItem("jbr_user", JSON.stringify(userToStore));
          }

          setSuccess(true);
          setTimeout(() => router.push("/dashboard"), 1200);
        } else {
          setErrorMsg(data.message || "Registration failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const emailIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
  const lockIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
  const userIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Subtle top accent at the very top of the page */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "3px",
        background: `linear-gradient(to right, ${C.redBright}, ${C.red})`,
        zIndex: 50
      }} />

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "stretch", padding: "32px",
        position: "relative", zIndex: 1, fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          display: "flex", width: "100%", background: C.card,
          border: `1px solid ${C.border}`, borderRadius: "24px", overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
          animation: "fadeUp 0.6s cubic-bezier(0.4,0,0.2,1) 0.05s both", position: "relative",
        }}>

          <BrandPanel />

          <div style={{
            flex: 6, padding: "48px 4%", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflowY: "auto",
          }}>
            <div style={{ width: "100%", padding: "0 2%" }}>
              <Ticker />
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "440px", margin: "0 auto" }}>
              <Logo animate />

              <div style={{ width: "100%" }}>
                <ModeTabs mode={mode} onSwitch={switchMode} />

                <div
                  key={formKey}
                  style={{ opacity, transform: `translateY(${yOff}px)`, transition: "opacity 0.28s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)" }}
                >
                  {mode === "signin" ? (
                    <>
                      <Field label="Email Address" type="email" placeholder="you@jbrstaffingsolutions.com" value={email} onChange={setEmail} autoComplete="email" icon={emailIcon} delay={0.05} />
                      <Field label="Password" type="password" placeholder="Enter your password" value={pwd} onChange={setPwd} autoComplete="current-password" icon={lockIcon} hint="Forgot password?" delay={0.1} />

                      {errorMsg && (
                        <div style={{ color: C.red, fontSize: "12px", marginBottom: "12px", textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
                          {errorMsg}
                        </div>
                      )}

                      <PrimaryBtn label="Sign In" loading={loading} onClick={submit} />

                      <div style={{ display: "flex", alignItems: "center", margin: "24px 0 8px" }}>
                        <div style={{ flex: 1, height: "1px", background: C.border }} />
                        <span style={{ padding: "0 12px", fontSize: "11px", color: C.textHint, textTransform: "uppercase", letterSpacing: "1px" }}>Or</span>
                        <div style={{ flex: 1, height: "1px", background: C.border }} />
                      </div>

                      <GhostBtn label="Create an Account" onClick={() => switchMode("signup")} />
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <div style={{ flex: 1 }}><Field label="First" placeholder="Jane" value={first} onChange={setFirst} autoComplete="given-name" icon={userIcon} delay={0.05} /></div>
                        <div style={{ flex: 1 }}><Field label="Last" placeholder="Doe" value={last} onChange={setLast} autoComplete="family-name" delay={0.1} /></div>
                      </div>
                      <Field label="Work Email" type="email" placeholder="you@jbrstaffingsolutions.com" value={signEmail} onChange={setSignEmail} autoComplete="email" icon={emailIcon} hint="@jbrstaffingsolutions.com" delay={0.15} />
                      <Field label="Password" type="password" placeholder="Create a strong password" value={signPwd} onChange={setSignPwd} autoComplete="new-password" icon={lockIcon} delay={0.2} />
                      <PwdStrength pwd={signPwd} />
                      <p style={{ fontSize: "11px", color: C.textMuted, lineHeight: 1.7, marginBottom: "16px" }}>
                        By registering you agree to our{" "}
                        <span style={{ color: C.textLabel, fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${C.borderHover}` }}>Terms</span>
                        {" "}&amp;{" "}
                        <span style={{ color: C.textLabel, fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${C.borderHover}` }}>Privacy Policy</span>.
                      </p>

                      {errorMsg && (
                        <div style={{ color: C.red, fontSize: "12px", marginBottom: "12px", textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
                          {errorMsg}
                        </div>
                      )}

                      <PrimaryBtn label="Create Account" loading={loading} onClick={submit} />

                      <div style={{ display: "flex", alignItems: "center", margin: "24px 0 8px" }}>
                        <div style={{ flex: 1, height: "1px", background: C.border }} />
                        <span style={{ padding: "0 12px", fontSize: "11px", color: C.textHint, textTransform: "uppercase", letterSpacing: "1px" }}>Or</span>
                        <div style={{ flex: 1, height: "1px", background: C.border }} />
                      </div>

                      <GhostBtn label="Sign in to existing account" onClick={() => switchMode("signin")} />
                    </>
                  )}
                </div>

                {/* ─── MANAGER LOGIN NAVIGATION BUTTON ─── */}
                <div style={{ marginTop: "32px", animation: "fadeIn 0.5s ease 0.3s both" }}>
                  <button
                    onClick={() => router.push("/manager")}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      borderRadius: "10px",
                      color: C.textLabel,
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: "'DM Sans',sans-serif",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = C.red;
                      e.currentTarget.style.borderColor = C.red;
                      e.currentTarget.style.backgroundColor = C.redActiveBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = C.textLabel;
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Manager Login / Signup
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="M12 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>

              </div>
            </div>

            <SuccessFlash visible={success} mode={mode} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .brand-hide { display: none !important; }
        }
      `}</style>
    </>
  );
}
