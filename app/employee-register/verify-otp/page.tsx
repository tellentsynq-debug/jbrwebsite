"use client";

import React, { useState, useRef, Suspense } from "react";
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

/* ─── OTP INPUT ──────────────────────────────────────────────── */
function OtpInput({
  otp, onChange, onKeyDown, inputRefs,
}: {
  otp: string[];
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}) {
  const [focused, setFocused] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "24px" }}>
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={() => setFocused(i)}
          onBlur={() => setFocused(null)}
          style={{
            width: "48px",
            height: "56px",
            border: `1.5px solid ${focused === i ? C.red : digit ? C.borderHover : C.border}`,
            borderRadius: "10px",
            background: focused === i ? C.surface : C.inputBg,
            textAlign: "center",
            fontSize: "20px",
            fontWeight: 700,
            color: C.textHeading,
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
            outline: "none",
            caretColor: C.red,
          }}
        />
      ))}
    </div>
  );
}

/* ─── PRIMARY BUTTON ─────────────────────────────────────────── */
function PrimaryBtn({ label, loading, onClick }: { label: string; loading?: boolean; onClick: () => void }) {
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
        border: "none", borderRadius: "10px", color: C.white,
        fontSize: "13px", fontWeight: 600, letterSpacing: "1.5px",
        textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        transform: press ? "scale(0.985) translateY(1px)" : hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 6px 20px ${C.redGlow}, 0 2px 6px rgba(0,0,0,0.08)` : `0 4px 16px ${C.redGlow}`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.7s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      )}
      {loading ? "Verifying…" : label}
    </button>
  );
}

/* ─── SHIELD ICON ────────────────────────────────────────────── */
function ShieldIcon() {
  return (
    <div style={{
      width: "56px", height: "56px", borderRadius: "50%",
      border: `1.5px solid ${C.border}`, background: C.redActiveBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 16px",
      animation: "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </div>
  );
}

/* ─── MAIN FORM ──────────────────────────────────────────────── */
function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const token = searchParams.get("token") || "";

  const isEmailActive = Boolean(email);
  const verifyMethod = isEmailActive ? "Email" : "WhatsApp";
  const targetDisplay = isEmailActive ? email : `+1 ${phone}`;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((ch, i) => { newOtp[i] = ch; });
    setOtp(newOtp);
    const nextEmpty = Math.min(pasted.length, 5);
    inputRefs.current[nextEmpty]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setErrorMsg("Please enter the complete 6-digit code.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      const payload: Record<string, string> = { otp: otpString };
      if (email) payload.email = email;
      if (phone) payload.phone = phone;

      const res = await fetch("https://jbrstaffingsolutions.com/api/candidates/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/success?token=${token}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || "Invalid verification code. Please try again.");
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
          <ShieldIcon />

          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h2 style={{
              fontSize: "20px", fontWeight: 700, color: C.textHeading,
              fontFamily: "'DM Sans', sans-serif", marginBottom: "6px", letterSpacing: "-0.3px",
            }}>
              {verifyMethod} Verification
            </h2>
            <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6 }}>
              Enter the 6-digit code sent to your {verifyMethod}
            </p>
            <p style={{
              fontSize: "12px", fontWeight: 600, color: C.textLabel,
              marginTop: "6px", fontFamily: "'DM Sans', sans-serif",
            }}>
              {targetDisplay}
            </p>
          </div>

          {/* OTP with paste support */}
          <div onPaste={handlePaste}>
            <OtpInput
              otp={otp}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              inputRefs={inputRefs}
            />
          </div>

          {errorMsg && (
            <div style={{
              color: C.red, backgroundColor: C.redActiveBg,
              padding: "10px 14px", borderRadius: "8px",
              fontSize: "12px", marginBottom: "16px",
              fontWeight: 500, textAlign: "center",
              border: `1px solid rgba(198,40,40,0.15)`,
            }}>
              {errorMsg}
            </div>
          )}

          <PrimaryBtn label="Verify Code" loading={isLoading} onClick={handleVerify} />

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={() => router.back()}
              style={{
                background: "none", border: "none",
                color: C.textMuted, fontSize: "12px",
                fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.3px",
                transition: "color 0.2s",
                padding: "4px 8px",
                borderRadius: "6px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.red)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
            >
              ← Change {isEmailActive ? "email" : "number"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VerifyOtpPage() {
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
      <VerifyOtpForm />
    </Suspense>
  );
}
