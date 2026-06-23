"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ─── DESIGN TOKENS (matches auth page) ─────────────────────── */
const C = {
  bg: "#F0F2F5",
  surface: "#FFFFFF",
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

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: ${C.bg}; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.93); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  input:focus { outline: none; }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px ${C.surface} inset !important;
    -webkit-text-fill-color: ${C.textBody} !important;
    transition: background-color 5000s;
  }
  input::placeholder { color: ${C.textHint}; }
`;

/* ─── LOGO (identical to auth page) ─────────────────────────── */
function Logo() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
      marginBottom: "28px",
      animation: "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
    }}>
      <div style={{
        display: "flex", alignItems: "stretch",
        border: `1.5px solid ${C.border}`, overflow: "hidden",
      }}>
        <div style={{ padding: "8px 10px 8px 14px", borderRight: `1.5px solid ${C.border}` }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "34px", fontWeight: 600,
            color: C.red, letterSpacing: "3px", lineHeight: 1, display: "block",
          }}>JBR</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 12px", gap: "1px" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "9.5px", letterSpacing: "4px", color: C.textHeading, textTransform: "uppercase" }}>STAFFING</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "9.5px", letterSpacing: "4px", color: C.textMuted, textTransform: "uppercase" }}>SOLUTIONS</span>
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        fontSize: "9px", letterSpacing: "2.5px", color: C.textMuted,
        textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ width: "20px", height: "1px", background: C.border }} />
        Redefining People &amp; Culture
        <div style={{ width: "20px", height: "1px", background: C.border }} />
      </div>
    </div>
  );
}

/* ─── INPUT FIELD ────────────────────────────────────────────── */
interface FieldProps {
  label: string;
  subLabel?: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
}
function Field({ label, subLabel, type = "text", placeholder, value, onChange, prefix, icon, autoComplete }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      <div>
        <label style={{
          fontSize: "10.5px", fontWeight: 600, letterSpacing: "1.2px",
          textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
          color: C.textLabel, display: "block", marginBottom: "2px",
        }}>
          {label}
        </label>
        {subLabel && (
          <span style={{ fontSize: "11px", color: C.textHint, fontFamily: "'DM Sans', sans-serif" }}>
            {subLabel}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {prefix && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: C.inputBg, border: `1px solid ${C.border}`,
            borderRadius: "10px", padding: "0 14px",
            fontSize: "13px", color: C.textMuted, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            {prefix}
          </div>
        )}
        <div style={{ position: "relative", flex: 1 }}>
          {icon && (
            <div style={{
              position: "absolute", left: "13px", top: "50%",
              transform: "translateY(-50%)",
              color: focused ? C.red : C.textMuted,
              transition: "color 0.2s", display: "flex", pointerEvents: "none",
            }}>
              {icon}
            </div>
          )}
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            autoComplete={autoComplete}
            style={{
              width: "100%",
              padding: `13px 14px 13px ${icon ? "40px" : "14px"}`,
              background: focused ? C.surface : C.inputBg,
              border: `1px solid ${focused ? C.red : hovered ? C.borderHover : C.border}`,
              borderRadius: "10px", color: C.textBody,
              fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── PRIMARY BUTTON ─────────────────────────────────────────── */
function PrimaryBtn({ label, loading }: { label: string; loading?: boolean }) {
  const [hov, setHov] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <button
      type="submit"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      disabled={loading}
      style={{
        width: "100%", padding: "14px",
        background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`,
        border: "none", borderRadius: "10px", color: C.white,
        fontSize: "13px", fontWeight: 600, letterSpacing: "1.5px",
        textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        transform: press ? "scale(0.985) translateY(1px)" : hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 6px 20px ${C.redGlow}, 0 2px 6px rgba(0,0,0,0.08)` : `0 4px 16px ${C.redGlow}`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        opacity: loading ? 0.7 : 1, marginTop: "8px",
      }}
    >
      {loading && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.7s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      )}
      {loading ? "Sending Code…" : label}
    </button>
  );
}

/* ─── WHATSAPP ICON ──────────────────────────────────────────── */
const whatsappIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const emailIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

/* ─── MAIN FORM ──────────────────────────────────────────────── */
function EmployeeRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // FIX: was a <form> which caused default submit bugs — now uses onSubmit correctly via div + button type="submit" inside a real form handled by React
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() && !phone.trim()) {
      setErrorMsg("Please enter either an Email Address or a WhatsApp Number.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const payload: Record<string, string> = {};
      if (email.trim()) payload.email = email.trim();
      if (phone.trim()) payload.phone = phone.trim();

      const res = await fetch("https://jbrstaffingsolutions.com/api/candidates/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const query = new URLSearchParams();
        if (token) query.append("token", token);
        if (email.trim()) query.append("email", email.trim());
        if (phone.trim()) query.append("phone", phone.trim());
        router.push(`/employee-register/verify-otp?${query.toString()}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || "Failed to send OTP. Please check your details and try again.");
      }
    } catch {
      setErrorMsg("A network error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Top accent bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "3px",
        background: `linear-gradient(to right, ${C.redBright}, ${C.red})`, zIndex: 50,
      }} />

      <div style={{
        minHeight: "100vh", backgroundColor: C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          width: "100%", maxWidth: "440px",
          backgroundColor: C.surface, borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)",
          padding: "44px 36px",
          border: `1px solid ${C.border}`,
          animation: "fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both",
        }}>

          <Logo />

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{
              fontSize: "20px", fontWeight: 700, color: C.textHeading,
              fontFamily: "'DM Sans', sans-serif", marginBottom: "6px", letterSpacing: "-0.3px",
            }}>
              Account Verification
            </h2>
            <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6 }}>
              Verify your WhatsApp number or Email to continue
            </p>
          </div>

          <form onSubmit={handleSendOTP} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <Field
              label="WhatsApp Number"
              subLabel="US / Canada only — WhatsApp must be active"
              type="tel"
              placeholder="123-456-7890"
              value={phone}
              onChange={setPhone}
              prefix="+1"
              icon={whatsappIcon}
              autoComplete="tel"
            />

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <hr style={{ flex: 1, border: "none", borderTop: `1px solid ${C.border}` }} />
              <span style={{
                fontSize: "10px", letterSpacing: "2px", color: C.textHint,
                fontWeight: 600, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
              }}>OR</span>
              <hr style={{ flex: 1, border: "none", borderTop: `1px solid ${C.border}` }} />
            </div>

            <Field
              label="Email Address"
              subLabel="We'll send the verification code here"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              icon={emailIcon}
              autoComplete="email"
            />

            {errorMsg && (
              <div style={{
                color: C.red, backgroundColor: C.redActiveBg,
                padding: "10px 14px", borderRadius: "8px",
                fontSize: "12px", textAlign: "center",
                fontWeight: 500, border: `1px solid rgba(198,40,40,0.15)`,
              }}>
                {errorMsg}
              </div>
            )}

            <PrimaryBtn label="Send Verification Code" loading={isLoading} />
          </form>

          <p style={{
            fontSize: "11px", color: C.textHint, textAlign: "center",
            marginTop: "20px", lineHeight: 1.6,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            By continuing you agree to our{" "}
            <span style={{ color: C.textLabel, fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${C.borderHover}` }}>Terms</span>
            {" "}&amp;{" "}
            <span style={{ color: C.textLabel, fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${C.borderHover}` }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </>
  );
}

export default function EmployeeRegisterPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", backgroundColor: "#F0F2F5",
        fontFamily: "'DM Sans', sans-serif", color: "#6B7280", fontSize: "14px",
      }}>
        Loading…
      </div>
    }>
      <EmployeeRegisterForm />
    </Suspense>
  );
}
