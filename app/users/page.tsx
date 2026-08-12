"use client";

import { useState, useEffect, useRef } from "react";

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
  green:       "#2E7D32",
  greenBg:     "rgba(46,125,50,0.08)",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: ${C.bg}; font-family: 'DM Sans', sans-serif; color: ${C.textBody}; }
  #__next, main { height: 100%; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes lineGrow { from { width:0; } to { width:40px; } }
  @keyframes reveal   { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
  @keyframes successPop { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  .field { animation: reveal 0.35s cubic-bezier(0.4,0,0.2,1) both; }
  .field:nth-child(1){animation-delay:0.05s}
  .field:nth-child(2){animation-delay:0.10s}
  .field:nth-child(3){animation-delay:0.15s}
  .field:nth-child(4){animation-delay:0.20s}
  .field:nth-child(5){animation-delay:0.25s}
  .field:nth-child(6){animation-delay:0.30s}
  .field:nth-child(7){animation-delay:0.35s}
  .field:nth-child(8){animation-delay:0.40s}

  input:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px ${C.surface} inset !important; -webkit-text-fill-color:${C.textBody} !important; }
  input::placeholder { color:${C.textHint}; font-size:15px; }
  input:focus, select:focus { outline:none; }
  button:focus-visible { outline:2px solid ${C.redBright}; outline-offset:3px; }
  select option { background:${C.surface}; color:${C.textBody}; }

  .day-btn {
    width: 38px; height: 38px; border-radius: 50%;
    border: 1.5px solid transparent;
    background: ${C.inputBg};
    color: ${C.textBody};
    font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.18s ease;
    display: flex; align-items: center; justify-content: center;
  }
  .day-btn:hover { border-color: ${C.red}; color: ${C.red}; background: ${C.redActiveBg}; }
  .day-btn.selected { background: ${C.red}; color: #fff; border-color: ${C.red}; }
  .day-btn.today { border-color: ${C.redBright}; color: ${C.red}; }
  .day-btn.other-month { color: ${C.textHint}; background: transparent; }
  .day-btn.other-month:hover { border-color: ${C.border}; color: ${C.textMuted}; background: ${C.inputBg}; }

  .avail-chip {
    padding: 8px 16px; border-radius: 20px;
    border: 1.5px solid ${C.border};
    background: ${C.inputBg};
    color: ${C.textLabel};
    font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;
  }
  .avail-chip:hover { border-color: ${C.red}; color: ${C.red}; background: ${C.redActiveBg}; }
  .avail-chip.selected { background: ${C.red}; color: #fff; border-color: ${C.red}; }

    @media (max-width: 768px) {
    .brand-panel { display: none !important; }
    .form-panel { padding: 24px 20px !important; }
    .page-shell { padding: 0 !important; align-items: flex-start !important; }
    .reg-card { border-radius: 0 !important; height: 100dvh !important; min-height: 100dvh !important; flex-direction: column !important; }
    .step-label { display: none !important; }
    .step-dot { width: 28px !important; height: 28px !important; font-size: 11px !important; }
    .step-connector { margin-bottom: 0 !important; }
    .dob-grid { grid-template-columns: 1fr 1fr !important; }
    .avail-chip { padding: 6px 12px !important; font-size: 12px !important; }
    .nav-row { flex-direction: column-reverse !important; }
    .nav-row > * { width: 100% !important; }
    .doc-grid { grid-template-columns: 1fr !important; }
  }
`;

// ─── TYPES ────────────────────────────────────────────────────────────────────
type AuthState = "loading" | "unauthorized" | "ready";

interface JobIndustry {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface JobCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  license_required: boolean;
  job_industry_id: string | null;
  job_industry: { id: string; name: string } | null;
}

interface Province {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  city_count: number;
}

interface City {
  id: string;
  name: string;
  province_id: string;
  is_active: boolean;
}

interface FormData {
  firstName: string; lastName: string; email: string; phone: string; gender: string;
  day: string; month: string; year: string;
  jobIndustryId: string; jobIndustryName: string;
  jobCategoryId: string; jobCategoryName: string;
  provinceId: string; provinceName: string;
  cityId: string; cityName: string;
  postalCode: string;
  startDate: string; preferredTime: string; shiftType: string; availability: string[];

  // ── Permit/License fields ──
  permitStatus: string;
  permitNote: string;
  permitExpiryMonth: string;
  permitExpiryYear: string;
  permitFile: File | null;        // Work permit / visa document
  licenseExpiryMonth: string;
  licenseExpiryYear: string;
  licenseFile: File | null;       // Forklift license document

  resume: File | null;
}

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const GENDERS      = ["Male","Female","Non-binary","Prefer not to say"];
const SHIFT_TYPES  = [
  { label:"Morning Shift (6 AM – 2 PM)",    value:"morning_shift" },
  { label:"Afternoon Shift (2 PM – 10 PM)", value:"afternoon_shift" },
  { label:"Night Shift (10 PM – 6 AM)",     value:"night_shift" },
  { label:"Rotating Shift",                 value:"rotating_shift" },
  { label:"Split Shift",                    value:"split_shift" },
  { label:"On-Call / Flexible",             value:"on_call" },
];
const PREFERRED_TIMES = [
  "6:00 AM – 9:00 AM","9:00 AM – 12:00 PM","12:00 PM – 3:00 PM",
  "3:00 PM – 6:00 PM","6:00 PM – 9:00 PM","9:00 PM – 12:00 AM","Flexible / No preference",
];
const PERMIT_STATUSES = [
  { label:"Canadian Citizen",                value:"citizen" },
  { label:"Permanent Resident",              value:"permanent_resident" },
  { label:"Work Permit – Open",              value:"open_work_permit" },
  { label:"Student Visa (Co-op)",            value:"student_coop" },
  { label:"Other",                           value:"other" },
];
const AVAILABILITY_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const STEPS = ["Personal Info","Date of Birth & Role","Location","Shift & Availability","License & Permit","Resume Upload"];

// Canadian postal code: A1A 1A1 (letter-digit-letter, optional space/dash, digit-letter-digit)
const CA_POSTAL_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

function formatPostalCode(raw: string): string {
  let text = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (text.length > 6) text = text.slice(0, 6);
  if (text.length > 3) return `${text.slice(0, 3)} ${text.slice(3)}`;
  return text;
}

// ─── AUTH GATE SCREEN ─────────────────────────────────────────────────────────
function AuthGate({ reason }: { reason: "no_token" | "invalid_token" | "error" }) {
  const messages = {
    no_token:      { title: "Access Denied",        body: "No session found. Please verify your email or WhatsApp before accessing this page." },
    invalid_token: { title: "Session Expired",      body: "Your session is invalid or has expired. Please go back and verify your identity again." },
    error:         { title: "Something Went Wrong", body: "We couldn't verify your session right now. Please try again in a moment." },
  };
  const { title, body } = messages[reason];
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, padding:"20px", fontFamily:"'DM Sans',sans-serif", animation:"fadeIn 0.4s ease" }}>
      <div style={{ maxWidth:420, width:"100%", background:C.surface, borderRadius:20, padding:"48px 40px", textAlign:"center", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:C.redActiveBg, border:`1.5px solid rgba(198,40,40,0.2)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <div style={{ display:"flex", alignItems:"stretch", border:`1.5px solid ${C.border}`, width:"fit-content", margin:"0 auto 24px" }}>
          <div style={{ padding:"6px 8px 6px 12px", borderRight:`1.5px solid ${C.border}` }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:600, color:C.red, letterSpacing:3, lineHeight:1, display:"block" }}>JBR</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 10px", gap:2 }}>
            <span style={{ fontSize:8.5, letterSpacing:3.5, color:C.textHeading, textTransform:"uppercase", fontWeight:600 }}>STAFFING</span>
            <span style={{ fontSize:8.5, letterSpacing:3.5, color:C.textMuted, textTransform:"uppercase" }}>SOLUTIONS</span>
          </div>
        </div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:600, color:C.textHeading, marginBottom:12 }}>{title}</h2>
        <p style={{ fontSize:14, color:C.textMuted, lineHeight:1.7 }}>{body}</p>
      </div>
    </div>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, flexDirection:"column", gap:16 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" style={{ animation:"spin 0.7s linear infinite" }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <p style={{ fontSize:13, color:C.textMuted, fontFamily:"'DM Sans',sans-serif", letterSpacing:"1px" }}>Verifying session…</p>
    </div>
  );
}

// ─── INLINE SPINNER ───────────────────────────────────────────────────────────
function InlineSpinner({ label }: { label: string }) {
  return (
    <div style={{ padding:"15px 18px", background:C.inputBg, border:`1.5px solid ${C.border}`, borderRadius:12, display:"flex", alignItems:"center", gap:10, color:C.textMuted, fontSize:14 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" style={{ animation:"spin 0.7s linear infinite", flexShrink:0 }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      {label}
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
function MiniCalendar({ selected, onChange }: { selected:string; onChange:(v:string)=>void }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const selDate     = selected ? new Date(selected) : null;
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevDays    = new Date(viewYear, viewMonth, 0).getDate();
  const cells: { d:number; month:"prev"|"cur"|"next" }[] = [];
  for (let i=firstDay-1;i>=0;i--) cells.push({d:prevDays-i,month:"prev"});
  for (let d=1;d<=daysInMonth;d++) cells.push({d,month:"cur"});
  let next=1; while(cells.length%7!==0) cells.push({d:next++,month:"next"});
  const prevMonth=()=>{if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);};
  const nextMonth=()=>{if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);};
  const isToday=(d:number,m:string)=>m==="cur"&&d===today.getDate()&&viewMonth===today.getMonth()&&viewYear===today.getFullYear();
  const isSelected=(d:number,m:string)=>{if(!selDate||m!=="cur")return false;return selDate.getFullYear()===viewYear&&selDate.getMonth()===viewMonth&&selDate.getDate()===d;};
  const handleClick=(d:number,month:"prev"|"cur"|"next")=>{
    let m=viewMonth,y=viewYear;
    if(month==="prev"){m-=1;if(m<0){m=11;y-=1;}}
    if(month==="next"){m+=1;if(m>11){m=0;y+=1;}}
    onChange(`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
    if(month!=="cur"){setViewMonth(m);setViewYear(y);}
  };
  return (
    <div style={{background:C.inputBg,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"16px 20px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button onClick={prevMonth} style={{width:30,height:30,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{fontSize:14,fontWeight:700,color:C.textHeading}}>{MONTHS_SHORT[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{width:30,height:30,border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.textHint,letterSpacing:0.5,padding:"2px 0"}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((c,i)=>{
          const cls=["day-btn",c.month!=="cur"?"other-month":"",isSelected(c.d,c.month)?"selected":"",isToday(c.d,c.month)&&!isSelected(c.d,c.month)?"today":""].filter(Boolean).join(" ");
          return <button key={i} className={cls} onClick={()=>handleClick(c.d,c.month)} style={{margin:"0 auto"}}>{c.d}</button>;
        })}
      </div>
      {selected&&(
        <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}`,fontSize:13,color:C.red,fontWeight:600,textAlign:"center"}}>
          Start date: {new Date(selected+"T00:00:00").toLocaleDateString("en-CA",{weekday:"short",month:"long",day:"numeric",year:"numeric"})}
        </div>
      )}
    </div>
  );
}

function StepBar({ step }: { step:number }) {
  return (
    <div style={{display:"flex",alignItems:"center",marginBottom:"16px"}}>
      {STEPS.map((label,i)=>{
        const done=i<step,active=i===step;
        return (
          <div key={label} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:0}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"}}>
              <div className="step-dot" style={{width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,transition:"all 0.3s ease",background:done?C.red:active?C.redActiveBg:C.inputBg,border:`2px solid ${done?C.red:active?C.red:C.border}`,color:done?"#fff":active?C.red:C.textMuted}}>
                {done?<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>:i+1}
              </div>
              <span className="step-label" style={{fontSize:"10px",letterSpacing:"1px",textTransform:"uppercase",color:active?C.red:done?C.textLabel:C.textHint,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>
            </div>
            {i<STEPS.length-1&&<div className="step-connector" style={{flex:1,height:1.5,background:done?C.red:C.border,margin:"0 6px",marginBottom:"22px",transition:"background 0.4s"}}/>}
          </div>
        );
      })}
    </div>
  );
}

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
function FieldWrap({label,error,hint,children}:{label:string;error?:string;hint?:string;children:React.ReactNode}) {
  return (
    <div className="field" style={{marginBottom:20}}>
      <label style={{display:"block",fontSize:"12px",fontWeight:700,letterSpacing:"1.4px",textTransform:"uppercase",color:error?C.red:C.textLabel,marginBottom:8}}>
        {label}{error&&<span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:12,marginLeft:6,color:C.red}}>— {error}</span>}
      </label>
      {children}
      {hint&&!error&&<p style={{fontSize:12,color:C.textHint,marginTop:6}}>{hint}</p>}
    </div>
  );
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
function Input({value,onChange,placeholder,type="text",autoComplete}:{value:string;onChange:(v:string)=>void;placeholder?:string;type?:string;autoComplete?:string}) {
  const [focused,setFocused]=useState(false);
  return (
    <input type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
      onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
      style={{width:"100%",padding:"15px 18px",background:focused?C.surface:C.inputBg,border:`1.5px solid ${focused?C.red:C.border}`,borderRadius:12,color:C.textBody,fontSize:15,fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s ease",boxShadow:focused?`0 0 0 3px ${C.redGlow}`:"none"}}
    />
  );
}

// ─── SELECT ───────────────────────────────────────────────────────────────────
function Select({value,onChange,options,placeholder,disabled}:{value:string;onChange:(v:string)=>void;options:{label:string;value:string}[];placeholder?:string;disabled?:boolean}) {
  const [focused,setFocused]=useState(false);
  return (
    <div style={{position:"relative"}}>
      <select value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} disabled={disabled}
        style={{width:"100%",padding:"15px 44px 15px 18px",background:focused?C.surface:C.inputBg,border:`1.5px solid ${focused?C.red:C.border}`,borderRadius:12,color:value?C.textBody:C.textHint,fontSize:15,fontFamily:"'DM Sans',sans-serif",appearance:"none",cursor:disabled?"not-allowed":"pointer",transition:"all 0.2s ease",boxShadow:focused?`0 0 0 3px ${C.redGlow}`:"none",opacity:disabled?0.6:1}}>
        {placeholder&&<option value="" disabled hidden>{placeholder}</option>}
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}

// ─── PRIMARY BUTTON ───────────────────────────────────────────────────────────
function PrimaryBtn({label,loading,onClick}:{label:string;loading?:boolean;onClick?:()=>void}) {
  const [hov,setHov]=useState(false);
  return (
    <button onClick={onClick} disabled={loading} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:"100%",padding:"16px",background:`linear-gradient(135deg,${C.redBright},${C.red})`,border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif",cursor:loading?"not-allowed":"pointer",opacity:loading?0.75:1,transition:"all 0.25s ease",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transform:hov&&!loading?"translateY(-2px)":"none",boxShadow:hov?`0 8px 24px ${C.redGlow}`:`0 4px 14px ${C.redGlow}`}}>
      {loading&&<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{animation:"spin 0.7s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
      {loading?"Processing…":label}
    </button>
  );
}

// ─── GHOST BUTTON ─────────────────────────────────────────────────────────────
function GhostBtn({label,onClick}:{label:string;onClick:()=>void}) {
  const [hov,setHov]=useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:"16px 28px",background:hov?C.redActiveBg:"transparent",border:`1.5px solid ${hov?C.red:C.border}`,borderRadius:12,color:hov?C.red:C.textLabel,fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all 0.2s ease",whiteSpace:"nowrap"}}>
      {label}
    </button>
  );
}

// ─── FILE FIELD (shared upload dropzone) ──────────────────────────────────────
function FileField({file,error,accept,onSelect,uploadHint,compact}:{file:File|null;error?:string;accept:string;onSelect:(f?:File)=>void;uploadHint:string;compact?:boolean}) {
  const [dragOver,setDragOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const pad = compact ? "24px 20px" : "40px 24px";
  const iconBox = compact ? 44 : 52;
  return (
    <div>
      <input ref={ref} type="file" accept={accept} style={{display:"none"}} onChange={e=>onSelect(e.target.files?.[0])}/>
      <div
        onClick={()=>ref.current?.click()}
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);onSelect(e.dataTransfer.files?.[0]);}}
        style={{border:`2px dashed ${error?C.red:dragOver?C.red:C.border}`,borderRadius:14,padding:pad,textAlign:"center",cursor:"pointer",background:dragOver?C.redActiveBg:C.surface,transition:"all 0.2s ease"}}
      >
        {file ? (
          <>
            <div style={{width:iconBox,height:iconBox,borderRadius:12,background:C.redActiveBg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <p style={{fontSize:14,fontWeight:500,color:C.textBody,marginBottom:4}}>{file.name}</p>
            <p style={{fontSize:12,color:C.textMuted}}>Click to replace</p>
          </>
        ) : (
          <>
            <div style={{width:iconBox,height:iconBox,borderRadius:12,background:C.inputBg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
            </div>
            <p style={{fontSize:14,color:C.textMuted,marginBottom:4}}>Drag &amp; drop or <span style={{color:C.red,fontWeight:600}}>browse</span></p>
            <p style={{fontSize:12,color:C.textHint}}>{uploadHint}</p>
          </>
        )}
      </div>
      {error&&<p style={{fontSize:13,color:C.red,marginTop:8}}>{error}</p>}
    </div>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
function SuccessScreen({name}:{name:string}) {
  return (
    <div style={{position:"absolute",inset:0,background:C.surface,zIndex:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:24,animation:"fadeIn 0.3s ease"}}>
      <div style={{width:72,height:72,borderRadius:"50%",background:C.redActiveBg,border:`2px solid ${C.red}`,display:"flex",alignItems:"center",justifyContent:"center",animation:"successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",marginBottom:24}}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:C.textHeading,marginBottom:10}}>Registration Complete.</p>
      <p style={{fontSize:15,color:C.textMuted}}>Welcome aboard, {name}.</p>
    </div>
  );
}

// ─── FILE UPLOAD HELPERS ──────────────────────────────────────────────────────
// Uploads the resume file. Field name: "resume".
async function uploadResume(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await fetch("https://jbrstaffingsolutions.com/api/candidates/upload-resume", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      // NOTE: do NOT set Content-Type manually for multipart/form-data —
      // the browser sets the correct boundary automatically.
    },
    body: formData,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    const err: any = new Error(body?.message || body?.error || `Resume upload failed (${response.status})`);
    err.status = response.status;
    err.body = body;
    throw err;
  }

  const url = body?.data?.resume_url || body?.data?.url || body?.resume_url || body?.url;
  if (!url) {
    const err: any = new Error("Resume upload succeeded but no file URL was returned.");
    err.body = body;
    throw err;
  }
  return url;
}

// Uploads the forklift license document. Fields: "type" = "license", "key" = file.
async function uploadLicense(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append("type", "license");
  formData.append("key", file);

  const response = await fetch("https://jbrstaffingsolutions.com/api/candidates/upload-license", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    const err: any = new Error(body?.message || body?.error || `License upload failed (${response.status})`);
    err.status = response.status;
    err.body = body;
    throw err;
  }

  const url = body?.data?.license_url || body?.data?.url || body?.license_url || body?.url;
  if (!url) {
    const err: any = new Error("License upload succeeded but no file URL was returned.");
    err.body = body;
    throw err;
  }
  return url;
}

// ─── API SUBMIT ───────────────────────────────────────────────────────────────
async function submitToAPI(
  form: FormData,
  token: string,
  resumeUrl: string | null,
  licenseUrl: string | null
): Promise<any> {
  const dobMonth = MONTHS.indexOf(form.month) + 1;
  const dob = `${form.year}-${String(dobMonth).padStart(2,"0")}-${form.day.padStart(2,"0")}`;
  const shiftObj = SHIFT_TYPES.find(s => s.label === form.shiftType);
  const shiftValue = shiftObj?.value ?? form.shiftType;

  // Only Canadian Citizens are exempt from the work permit + forklift license documents.
  const requiresPermitDocs = form.permitStatus !== "citizen";

  const FULL_DAY_NAMES: Record<string,string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const payload = {
    first_name:           form.firstName,
    last_name:            form.lastName,
    email:                form.email,
    phone_number:         form.phone,
    gender:               form.gender.toLowerCase(),
    date_of_birth:        dob,
    city:                 form.cityName,
    city_id:              form.cityId,
    province:             form.provinceName,
    province_id:          form.provinceId,
    postal_code:          form.postalCode,
    job_category_id:      form.jobCategoryId,
    job_industry_id:      form.jobIndustryId,
    campaign_id:          1,
    available_from:       form.startDate,
    permit_status:        form.permitStatus,
    permit_note:          form.permitStatus === "other" ? form.permitNote : null,
    permit_expiry_month:  requiresPermitDocs ? parseInt(form.permitExpiryMonth) : null,
    permit_expiry_year:   requiresPermitDocs ? parseInt(form.permitExpiryYear)  : null,
    permit_document_url:  requiresPermitDocs && form.permitFile ? `https://storage.jbrstaffingsolutions.com/permits/${form.permitFile.name}` : null,
    shift_preference:     shiftValue,
    license_required:     requiresPermitDocs,
    license_expiry_month: requiresPermitDocs ? parseInt(form.licenseExpiryMonth) : null,
    license_expiry_year:  requiresPermitDocs ? parseInt(form.licenseExpiryYear)  : null,
    license_document_url: requiresPermitDocs ? licenseUrl : null,
    resume_url:           resumeUrl,
    availability_days:    form.availability.map(d => FULL_DAY_NAMES[d] ?? d),
};



  const response = await fetch("https://jbrstaffingsolutions.com/api/employees", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err: any = new Error(responseBody?.error || `API error ${response.status}`);
    err.status = response.status;
    err.body = responseBody;
    throw err;
  }

  return responseBody;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RegistrationPage() {
  const [authState,  setAuthState]  = useState<AuthState>("loading");
  const [authReason, setAuthReason] = useState<"no_token"|"invalid_token"|"error">("no_token");
  const [jwtToken,   setJwtToken]   = useState("");

  const [industries,        setIndustries]        = useState<JobIndustry[]>([]);
  const [allCategories,     setAllCategories]     = useState<JobCategory[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  const [provinces,        setProvinces]        = useState<Province[]>([]);
  const [cities,           setCities]           = useState<City[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities,    setLoadingCities]    = useState(false);

  const [step,     setStep]    = useState(0);
  const [done,     setDone]    = useState(false);
  const [loading,  setLoading] = useState(false);
  const [errors,   setErrors]  = useState<Record<string,string>>({});

  // Upload progress state — shown on the final step while files are sent
  // to their dedicated upload endpoints before the main registration call.
  const [uploadStage, setUploadStage] = useState<"idle"|"resume"|"license"|"submitting">("idle");

  const [form, setForm] = useState<FormData>({
    firstName:"", lastName:"", email:"", phone:"", gender:"",
    day:"", month:"", year:"",
    jobIndustryId:"", jobIndustryName:"",
    jobCategoryId:"", jobCategoryName:"",
    provinceId:"", provinceName:"",
    cityId:"", cityName:"",
    postalCode:"",
    startDate:"", preferredTime:"", shiftType:"", availability:[],
    permitStatus:"", permitNote:"",
    permitExpiryMonth:"", permitExpiryYear:"", permitFile:null,
    licenseExpiryMonth:"", licenseExpiryYear:"", licenseFile:null,
    resume:null,
  });

  const filteredCategories = allCategories.filter(
    c => c.job_industry_id === form.jobIndustryId
  );

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("jbr_token_user");
      if (!token) { setAuthReason("no_token"); setAuthState("unauthorized"); return; }
      try {
        const res = await fetch("https://jbrstaffingsolutions.com/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("jbr_token_user");
          setAuthReason("invalid_token"); setAuthState("unauthorized"); return;
        }
        if (!res.ok) { setAuthReason("error"); setAuthState("unauthorized"); return; }
        const data = await res.json();
        if (data?.user?.email) setForm(f => ({ ...f, email: data.user.email }));
        setJwtToken(token);
        setAuthState("ready");
      } catch {
        setAuthReason("error"); setAuthState("unauthorized");
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (authState !== "ready" || !jwtToken) return;
    const headers = { "Authorization": `Bearer ${jwtToken}` };
    const fetchData = async () => {
      setLoadingIndustries(true);
      try {
        const [indRes, catRes] = await Promise.all([
          fetch("https://jbrstaffingsolutions.com/api/job-industries", { headers }),
          fetch("https://jbrstaffingsolutions.com/api/job-categories", { headers }),
        ]);
        if (indRes.ok) {
          const indData = await indRes.json();
          setIndustries((indData.data ?? []).filter((i: JobIndustry) => i.is_active));
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setAllCategories((catData.data ?? []).filter((c: JobCategory) => c.is_active));
        }
      } catch {
        // silently fail
      } finally {
        setLoadingIndustries(false);
      }
    };
    fetchData();
  }, [authState, jwtToken]);

  useEffect(() => {
    if (authState !== "ready" || !jwtToken) return;
    const headers = { "Authorization": `Bearer ${jwtToken}` };
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch("https://jbrstaffingsolutions.com/api/provinces", { headers });
        if (res.ok) {
          const data = await res.json();
          setProvinces((data.data ?? []).filter((p: Province) => p.is_active));
        }
      } catch {
        // silently fail
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, [authState, jwtToken]);

  useEffect(() => {
    if (!form.provinceId || !jwtToken) return;
    const headers = { "Authorization": `Bearer ${jwtToken}` };
    const fetchCities = async () => {
      setLoadingCities(true);
      setCities([]);
      try {
        const res = await fetch(
          `https://jbrstaffingsolutions.com/api/cities/province/${form.provinceId}/list`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setCities((data.data ?? []).filter((c: City) => c.is_active));
        }
      } catch {
        // silently fail
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [form.provinceId, jwtToken]);

  const clrErr = (k: string) => setErrors(e => { const n={...e}; delete n[k]; return n; });

  const toggleAvailability = (day:string) => {
    setForm(f => ({ ...f, availability: f.availability.includes(day) ? f.availability.filter(d=>d!==day) : [...f.availability, day] }));
    clrErr("availability");
  };

  const handleIndustryChange = (id: string) => {
    const ind = industries.find(i => i.id === id);
    setForm(f => ({
      ...f,
      jobIndustryId:   id,
      jobIndustryName: ind?.name.trim() ?? "",
      jobCategoryId:   "",
      jobCategoryName: "",
    }));
    clrErr("jobIndustryId");
    clrErr("jobCategoryId");
  };

  const handleCategoryChange = (id: string) => {
    const cat = allCategories.find(c => c.id === id);
    setForm(f => ({
      ...f,
      jobCategoryId:   id,
      jobCategoryName: cat?.name ?? "",
    }));
    clrErr("jobCategoryId");
  };

  const handleProvinceChange = (id: string) => {
    const prov = provinces.find(p => p.id === id);
    setForm(f => ({
      ...f,
      provinceId:   id,
      provinceName: prov?.name ?? "",
      cityId:       "",
      cityName:     "",
    }));
    clrErr("provinceId");
    clrErr("cityId");
  };

  const handleCityChange = (id: string) => {
    const city = cities.find(c => c.id === id);
    setForm(f => ({
      ...f,
      cityId:   id,
      cityName: city?.name ?? "",
    }));
    clrErr("cityId");
  };

  // Only Canadian Citizens skip the work permit + forklift license documents.
  const requiresPermitDocs = form.permitStatus !== "" && form.permitStatus !== "citizen";
  const permitNoExtras     = form.permitStatus === "citizen";

  const handlePermitStatusChange = (v: string) => {
    setForm(f => {
      const needsDocs = v !== "citizen";
      return {
        ...f,
        permitStatus: v,
        permitNote: v === "other" ? f.permitNote : "",
        permitExpiryMonth: needsDocs ? f.permitExpiryMonth : "",
        permitExpiryYear:  needsDocs ? f.permitExpiryYear  : "",
        permitFile:        needsDocs ? f.permitFile        : null,
        licenseExpiryMonth: needsDocs ? f.licenseExpiryMonth : "",
        licenseExpiryYear:  needsDocs ? f.licenseExpiryYear  : "",
        licenseFile:        needsDocs ? f.licenseFile        : null,
      };
    });
    clrErr("permitStatus"); clrErr("permitNote");
    clrErr("permitExpiryMonth"); clrErr("permitExpiryYear"); clrErr("permitFile");
    clrErr("licenseExpiryMonth"); clrErr("licenseExpiryYear"); clrErr("licenseFile");
  };

  const handleFileSelect = (key: "resume"|"permitFile"|"licenseFile", file?: File) => {
    if (!file) return;
    if (file.size > 5*1024*1024) { setErrors(e=>({...e,[key]:"Max 5 MB"})); return; }
    clrErr(key);
    setForm(f => ({ ...f, [key]: file }));
  };

  const validate = (): boolean => {
    const e: Record<string,string> = {};
    if (step===0) {
      if (!form.firstName.trim())                              e.firstName = "Required";
      if (!form.lastName.trim())                               e.lastName  = "Required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))    e.email     = "Invalid email";
      if (!form.phone.trim())                                  e.phone     = "Required";
      if (!/^\+?[\d\s\-().]{7,15}$/.test(form.phone))        e.phone     = "Invalid phone number";
      if (!form.gender)                                        e.gender    = "Required";
    } else if (step===1) {
      if (!form.day)                                           e.day   = "Required";
      if (!form.month)                                         e.month = "Required";
      if (!form.year || form.year.length!==4)                  e.year  = "4-digit year";
      else if (new Date().getFullYear() - +form.year < 18)    e.year  = "Must be 18+";
      if (!form.jobIndustryId)                                 e.jobIndustryId  = "Required";
      if (!form.jobCategoryId)                                 e.jobCategoryId  = "Required";
    } else if (step===2) {
      if (!form.provinceId)                                    e.provinceId = "Required";
      if (!form.cityId)                                        e.cityId     = "Required";
      const postal = form.postalCode.trim();
      if (!postal)                                              e.postalCode = "Required";
      else if (!CA_POSTAL_REGEX.test(postal))                   e.postalCode = "Invalid format (e.g. M4B 1G5)";
    } else if (step===3) {
      if (!form.startDate)                                     e.startDate     = "Please select a date";
      if (!form.preferredTime)                                 e.preferredTime = "Required";
      if (!form.shiftType)                                     e.shiftType     = "Required";
      if (form.availability.length === 0)                      e.availability  = "Select at least one day";
    } else if (step===4) {
      if (!form.permitStatus) e.permitStatus = "Required";

      if (form.permitStatus === 'other' && !form.permitNote.trim()) {
        e.permitNote = "Please describe your status";
      }

      const needsDocs = form.permitStatus !== "" && form.permitStatus !== "citizen";
      if (needsDocs) {
        if (!form.permitExpiryMonth) e.permitExpiryMonth = "Required";
        if (!form.permitExpiryYear) e.permitExpiryYear  = "Required";
        else if (+form.permitExpiryYear < new Date().getFullYear()) e.permitExpiryYear = "Must be future year";
        if (!form.permitFile) e.permitFile = "Please upload your work permit / visa document";

        if (!form.licenseExpiryMonth) e.licenseExpiryMonth = "Required";
        if (!form.licenseExpiryYear) e.licenseExpiryYear  = "Required";
        else if (+form.licenseExpiryYear < new Date().getFullYear()) e.licenseExpiryYear = "Must be future year";
        if (!form.licenseFile) e.licenseFile = "Please upload your forklift license";
      }

    } else if (step===5) {
      if (!form.resume)                                        e.resume = "Please upload your resume";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next   = () => { if (validate()) setStep(s=>s+1); };
  const prev   = () => setStep(s=>s-1);

 const [submitError, setSubmitError] = useState<string | null>(null);

const submit = async () => {
  if (!validate()) return;
  setLoading(true);
  setSubmitError(null);

  // Only Canadian Citizens are exempt from the work permit + forklift license documents.
  const needsLicenseDoc = form.permitStatus !== "" && form.permitStatus !== "citizen";

  try {
    // 1) Upload the resume to its dedicated endpoint first.
    let resumeUrl: string | null = null;
    if (form.resume) {
      setUploadStage("resume");
      resumeUrl = await uploadResume(form.resume, jwtToken);
    }

    // 2) Upload the forklift license document, only when required.
    let licenseUrl: string | null = null;
    if (needsLicenseDoc && form.licenseFile) {
      setUploadStage("license");
      licenseUrl = await uploadLicense(form.licenseFile, jwtToken);
    }

    // 3) Submit the main registration payload with the returned file URLs.
    setUploadStage("submitting");
    const responseData = await submitToAPI(form, jwtToken, resumeUrl, licenseUrl);

    if (responseData && responseData.registration_number) {
      localStorage.setItem("jbr_registration_number", responseData.registration_number);
    }

    setLoading(false);
    setUploadStage("idle");
    setDone(true);
    setTimeout(() => { window.location.href = "/users/profile"; }, 1500);

  } catch (error: any) {
    setLoading(false);
    setUploadStage("idle");

    // Employee already exists -> go directly to Profile, same as mobile
    if (
      error.status === 409 &&
      error.body?.error === "An employee with this email already exists"
    ) {
      const existingId = error.body?.existingEmployee?.id;
      if (existingId) {
        localStorage.setItem("jbr_employee_id", existingId);
      }
      window.location.href = "/users/profile";
      return;
    }

    console.error("Submission failed:", error);
    setSubmitError(error.body?.message || error.body?.error || error.message || "Registration failed. Please try again.");
    // Do NOT setDone(true) here — don't fake success on real failures
  }
};

  const years    = Array.from({length:60},(_,i)=>String(new Date().getFullYear()-17-i));
  const licYears = Array.from({length:20},(_,i)=>String(new Date().getFullYear()+i));

  const industryOptions  = industries.map(i => ({ label: i.name.trim(), value: i.id }));
  const categoryOptions  = filteredCategories.map(c => ({ label: c.name, value: c.id }));
  const provinceOptions  = provinces.map(p => ({ label: p.name, value: p.id }));
  const cityOptions      = cities.map(c => ({ label: c.name, value: c.id }));
  const monthOptions     = Array.from({length:12},(_,i)=>({label:MONTHS[i],value:String(i+1)}));
  const licYearOptions   = licYears.map(y=>({label:y,value:y}));

  if (authState === "loading") return <><style>{GLOBAL_CSS}</style><LoadingScreen /></>;
  if (authState === "unauthorized") return <><style>{GLOBAL_CSS}</style><AuthGate reason={authReason} /></>;

  const submitLabel =
    uploadStage === "resume"     ? "Uploading resume…" :
    uploadStage === "license"    ? "Uploading license…" :
    uploadStage === "submitting" ? "Submitting…" :
    "Complete Registration";

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{position:"fixed",top:0,left:0,right:0,height:3,background:`linear-gradient(to right,${C.redBright},${C.red})`,zIndex:50}}/>

      <div className="page-shell" style={{minHeight:"100vh",display:"flex",alignItems:"stretch",padding:"36px 28px 28px 28px",background:C.bg,overflow:"hidden"}}>
        <div className="reg-card" style={{display:"flex",width:"100%",height:"calc(100vh - 40px)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",animation:"fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both",position:"relative"}}>

          {/* ── Left Brand Panel ── */}
          <div className="brand-panel" style={{flex:"0 0 380px",padding:"48px 6%",background:C.surface,overflowY:"auto",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
            <div>
              <div style={{display:"flex",alignItems:"stretch",border:`1.5px solid ${C.border}`,width:"fit-content",marginBottom:12}}>
                <div style={{padding:"10px 12px 10px 16px",borderRight:`1.5px solid ${C.border}`}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:600,color:C.red,letterSpacing:3,lineHeight:1,display:"block"}}>JBR</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 14px",gap:3}}>
                  <span style={{fontSize:10,letterSpacing:4,color:C.textHeading,textTransform:"uppercase",fontWeight:600}}>STAFFING</span>
                  <span style={{fontSize:10,letterSpacing:4,color:C.textMuted,textTransform:"uppercase"}}>SOLUTIONS</span>
                </div>
              </div>
              <p style={{fontSize:10.5,color:C.textHint,letterSpacing:2.5,textTransform:"uppercase",display:"flex",alignItems:"center",gap:8,marginBottom:44}}>
                <span style={{width:18,height:1,background:C.border,display:"inline-block"}}/>
                Redefining People &amp; Culture
              </p>
              <div style={{width:40,height:3,background:`linear-gradient(to right,${C.redBright},${C.red})`,borderRadius:2,marginBottom:28,animation:"lineGrow 1s cubic-bezier(0.4,0,0.2,1) 0.3s both"}}/>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:400,color:C.textHeading,lineHeight:1.15,marginBottom:18}}>
                Find your<br/><em style={{color:C.red,fontWeight:600}}>next role.</em>
              </h2>
              <p style={{fontSize:15,color:C.textMuted,lineHeight:1.8}}>Complete your profile and let us match you with the right opportunity.</p>
            </div>
            <div>
              <div style={{height:1,background:C.border,marginBottom:28}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0}}>
                {[["500+","Partners"],["10K+","Placed"],["98%","Sat."]].map(([n,l],i)=>(
                  <div key={l} style={{borderRight:i<2?`1px solid ${C.border}`:"none",paddingRight:i<2?20:0,paddingLeft:i>0?20:0,animation:`fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) ${0.5+i*0.1}s both`}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:C.textHeading,lineHeight:1,marginBottom:6}}>{n}</div>
                    <div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:C.textLabel,fontWeight:600}}>{l}</div>
                  </div>
                ))}
              </div>
              <p style={{marginTop:24,fontSize:11,color:C.textHint}}>© 2026 JBR Staffing Solutions Pvt. Ltd.</p>
            </div>
          </div>

          {/* ── Right Form Panel ── */}
          <div className="form-panel" style={{flex:1,padding:"40px 6%",overflowY:"auto",position:"relative",display:"flex",flexDirection:"column",justifyContent:"flex-start"}}>
            {done&&<SuccessScreen name={form.firstName}/>}

            <div style={{width:"100%",maxWidth:560,margin:"0 auto"}}>
              <StepBar step={step}/>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600,color:C.textHeading,marginBottom:6}}>{STEPS[step]}</h3>
              <p style={{fontSize:14,color:C.textMuted,marginBottom:32}}>Step {step+1} of {STEPS.length} — fill in the details below.</p>

              {/* ── Step 0: Personal Info ── */}
              {step===0&&(
                <div key="s0" style={{animation:"fadeUp 0.3s ease"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                    <FieldWrap label="First Name" error={errors.firstName}>
                      <Input value={form.firstName} onChange={v=>{setForm(f=>({...f,firstName:v}));clrErr("firstName");}} placeholder="Jane" autoComplete="given-name"/>
                    </FieldWrap>
                    <FieldWrap label="Last Name" error={errors.lastName}>
                      <Input value={form.lastName} onChange={v=>{setForm(f=>({...f,lastName:v}));clrErr("lastName");}} placeholder="Doe" autoComplete="family-name"/>
                    </FieldWrap>
                  </div>
                  <FieldWrap label="Email Address" error={errors.email}>
                    <Input value={form.email} onChange={v=>{setForm(f=>({...f,email:v}));clrErr("email");}} type="email" placeholder="you@example.com" autoComplete="email"/>
                  </FieldWrap>
                  <FieldWrap label="Phone Number" error={errors.phone} hint="Include country code — e.g. +1 416 555 0100">
                    <Input value={form.phone} onChange={v=>{setForm(f=>({...f,phone:v}));clrErr("phone");}} type="tel" placeholder="+1 416 555 0100" autoComplete="tel"/>
                  </FieldWrap>
                  <FieldWrap label="Gender" error={errors.gender}>
                    <Select value={form.gender} onChange={v=>{setForm(f=>({...f,gender:v}));clrErr("gender");}} options={GENDERS.map(g=>({label:g,value:g}))} placeholder="Select gender"/>
                  </FieldWrap>
                </div>
              )}

              {/* ── Step 1: DOB & Role ── */}
              {step===1&&(
                <div key="s1" style={{animation:"fadeUp 0.3s ease"}}>
                  <div style={{padding:"14px 18px",background:C.redActiveBg,border:`1px solid rgba(198,40,40,0.18)`,borderRadius:12,marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{fontSize:13,color:C.red,fontWeight:500}}>You must be 18 or older to register.</span>
                  </div>

                  <div className="dob-grid" style={{display:"grid",gridTemplateColumns:"1fr 2fr 1.5fr",gap:14}}>
                    <FieldWrap label="Day" error={errors.day}>
                      <Select value={form.day} onChange={v=>{setForm(f=>({...f,day:v}));clrErr("day");}} options={Array.from({length:31},(_,i)=>({label:String(i+1).padStart(2,"0"),value:String(i+1).padStart(2,"0")}))} placeholder="DD"/>
                    </FieldWrap>
                    <FieldWrap label="Month" error={errors.month}>
                      <Select value={form.month} onChange={v=>{setForm(f=>({...f,month:v}));clrErr("month");}} options={MONTHS.map(m=>({label:m,value:m}))} placeholder="Month"/>
                    </FieldWrap>
                    <FieldWrap label="Year" error={errors.year}>
                      <Select value={form.year} onChange={v=>{setForm(f=>({...f,year:v}));clrErr("year");}} options={years.map(y=>({label:y,value:y}))} placeholder="YYYY"/>
                    </FieldWrap>
                  </div>

                  <FieldWrap label="Job Industry" error={errors.jobIndustryId} hint={loadingIndustries?"Loading industries from server…":undefined}>
                    {loadingIndustries ? (
                      <InlineSpinner label="Loading industries…" />
                    ) : (
                      <Select
                        value={form.jobIndustryId}
                        onChange={handleIndustryChange}
                        options={industryOptions}
                        placeholder={industryOptions.length ? "Select industry" : "No industries available"}
                        disabled={industryOptions.length === 0}
                      />
                    )}
                  </FieldWrap>

                  <FieldWrap label="Job Category" error={errors.jobCategoryId}>
                    <Select
                      value={form.jobCategoryId}
                      onChange={handleCategoryChange}
                      options={categoryOptions}
                      placeholder={
                        !form.jobIndustryId
                          ? "Select an industry first"
                          : categoryOptions.length === 0
                          ? "No categories for this industry"
                          : "Select category"
                      }
                      disabled={!form.jobIndustryId || categoryOptions.length === 0}
                    />
                  </FieldWrap>

                  {form.jobCategoryId && (() => {
                    const cat = allCategories.find(c => c.id === form.jobCategoryId);
                    return cat ? (
                      <div style={{padding:"12px 16px",borderRadius:10,background:cat.license_required ? C.redActiveBg : C.greenBg,border:`1px solid ${cat.license_required ? "rgba(198,40,40,0.2)" : "rgba(46,125,50,0.2)"}`,display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cat.license_required ? C.red : C.green} strokeWidth="2">
                          {cat.license_required
                            ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                            : <><polyline points="20 6 9 17 4 12"/></>
                          }
                        </svg>
                        <span style={{fontSize:13,fontWeight:600,color:cat.license_required ? C.red : C.green}}>
                          {cat.license_required
                            ? "This role requires a valid license or certification — you'll set that up in Step 5."
                            : "No license or certification required for this role."}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* ── Step 2: Location ── */}
              {step===2&&(
                <div key="s2" style={{animation:"fadeUp 0.3s ease"}}>
                  <FieldWrap label="Province" error={errors.provinceId}>
                    {loadingProvinces ? (
                      <InlineSpinner label="Loading provinces…" />
                    ) : (
                      <Select
                        value={form.provinceId}
                        onChange={handleProvinceChange}
                        options={provinceOptions}
                        placeholder={
                          provinceOptions.length
                            ? "Select province"
                            : "No provinces available"
                        }
                        disabled={provinceOptions.length === 0}
                      />
                    )}
                  </FieldWrap>

                  <FieldWrap label="City" error={errors.cityId}>
                    {loadingCities ? (
                      <InlineSpinner label="Loading cities…" />
                    ) : (
                      <Select
                        value={form.cityId}
                        onChange={handleCityChange}
                        options={cityOptions}
                        placeholder={
                          !form.provinceId
                            ? "Select a province first"
                            : cityOptions.length === 0
                            ? "No cities available for this province"
                            : "Select city"
                        }
                        disabled={!form.provinceId || loadingCities || cityOptions.length === 0}
                      />
                    )}
                  </FieldWrap>

                  <FieldWrap label="Postal Code" error={errors.postalCode} hint="Canadian format — e.g. M4B 1G5">
                    <Input
                      value={form.postalCode}
                      onChange={v=>{setForm(f=>({...f,postalCode:formatPostalCode(v)}));clrErr("postalCode");}}
                      placeholder="e.g. V5K 0A1"
                    />
                  </FieldWrap>

                  {(form.provinceName || form.cityName) && (
                    <div style={{padding:"14px 18px",background:C.inputBg,border:`1px solid ${C.border}`,borderRadius:12,display:"flex",alignItems:"center",gap:12,marginTop:4,animation:"fadeUp 0.25s ease"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <div>
                        <p style={{fontSize:13,fontWeight:600,color:C.textBody}}>
                          {[form.cityName, form.provinceName].filter(Boolean).join(", ")}
                        </p>
                        {form.postalCode && (
                          <p style={{fontSize:12,color:C.textMuted,marginTop:2}}>{form.postalCode}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Shift & Availability ── */}
              {step===3&&(
                <div key="s3" style={{animation:"fadeUp 0.3s ease"}}>
                  <FieldWrap label="Earliest Available Start Date" error={errors.startDate}>
                    <MiniCalendar selected={form.startDate} onChange={v=>{setForm(f=>({...f,startDate:v}));clrErr("startDate");}}/>
                  </FieldWrap>
                  <FieldWrap label="Preferred Work Time" error={errors.preferredTime}>
                    <Select value={form.preferredTime} onChange={v=>{setForm(f=>({...f,preferredTime:v}));clrErr("preferredTime");}} options={PREFERRED_TIMES.map(t=>({label:t,value:t}))} placeholder="Select preferred time slot"/>
                  </FieldWrap>
                  <FieldWrap label="Preferred Shift Type" error={errors.shiftType}>
                    <Select value={form.shiftType} onChange={v=>{setForm(f=>({...f,shiftType:v}));clrErr("shiftType");}} options={SHIFT_TYPES} placeholder="Select shift type"/>
                  </FieldWrap>
                  <div className="field" style={{marginBottom:20}}>
                    <label style={{display:"block",fontSize:"12px",fontWeight:700,letterSpacing:"1.4px",textTransform:"uppercase",color:errors.availability?C.red:C.textLabel,marginBottom:8}}>
                      Weekly Availability{errors.availability&&<span style={{fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:12,marginLeft:6,color:C.red}}>— {errors.availability}</span>}
                    </label>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {AVAILABILITY_DAYS.map(day=>(
                        <button key={day} className={`avail-chip${form.availability.includes(day)?" selected":""}`} onClick={()=>toggleAvailability(day)}>{day}</button>
                      ))}
                    </div>
                    <p style={{fontSize:12,color:C.textHint,marginTop:8}}>Select all days you are available to work.</p>
                  </div>
                  {(form.startDate||form.preferredTime||form.shiftType||form.availability.length>0)&&(
                    <div style={{padding:"16px 20px",background:C.inputBg,border:`1px solid ${C.border}`,borderRadius:12,marginTop:4}}>
                      <p style={{fontSize:11,letterSpacing:1.8,textTransform:"uppercase",fontWeight:700,color:C.textLabel,marginBottom:12}}>Shift Summary</p>
                      {([
                        ["Start Date", form.startDate ? new Date(form.startDate+"T00:00:00").toLocaleDateString("en-CA",{month:"long",day:"numeric",year:"numeric"}) : ""],
                        ["Time Slot",  form.preferredTime],
                        ["Shift Type", SHIFT_TYPES.find(s=>s.value===form.shiftType)?.label||form.shiftType],
                        ["Available",  form.availability.join(", ")],
                      ] as [string,string][]).map(([k,v])=>v&&(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <span style={{fontSize:13,color:C.textMuted,flexShrink:0,marginRight:12}}>{k}</span>
                          <span style={{fontSize:13,color:C.textBody,fontWeight:600,textAlign:"right"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 4: License & Permit ── */}
              {step===4&&(
                <div key="s4" style={{animation:"fadeUp 0.3s ease"}}>

                  {/* Permit Status */}
                  <FieldWrap label="Work Permit / Authorization Status" error={errors.permitStatus} hint="Select the option that best describes your current right to work in Canada.">
                    <Select value={form.permitStatus} onChange={handlePermitStatusChange} options={PERMIT_STATUSES} placeholder="Select status"/>
                  </FieldWrap>

                  {/* "Other" Status Description Field */}
                  {form.permitStatus === 'other' && (
                    <FieldWrap label="Please Describe Your Status" error={errors.permitNote} hint="e.g. Refugee claimant, TRP holder, diplomatic visa, etc.">
                      <Input value={form.permitNote} onChange={v=>{setForm(f=>({...f,permitNote:v}));clrErr("permitNote");}} placeholder="Describe your current immigration / work status"/>
                    </FieldWrap>
                  )}

                  {/* Citizen Banner — the only status exempt from document uploads */}
                  {permitNoExtras && (
                    <div style={{padding:"14px 18px",background:C.greenBg,border:`1px solid rgba(46,125,50,0.2)`,borderRadius:12,marginBottom:20,display:"flex",gap:10,alignItems:"center",animation:"fadeUp 0.25s ease"}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{fontSize:13,fontWeight:600,color:C.green}}>
                        As a Canadian Citizen, no work permit or forklift license documents are required.
                      </span>
                    </div>
                  )}

                  {/* Work Permit + Forklift License — required for every status except Citizen */}
                  {requiresPermitDocs && (
                    <>
                      <div style={{padding:"20px",background:C.inputBg,border:`1.5px solid ${C.border}`,borderRadius:12,marginBottom:20,animation:"fadeUp 0.25s ease"}}>
                        <p style={{fontSize:11,letterSpacing:1.8,textTransform:"uppercase",fontWeight:700,color:C.textLabel,marginBottom:6}}>WORK PERMIT / VISA DOCUMENT</p>
                        <p style={{fontSize:12,color:C.textMuted,marginBottom:16}}>Upload a copy of your permit or visa and enter its expiry date.</p>

                        <div style={{marginBottom:16}}>
                          <FileField
                            file={form.permitFile}
                            error={errors.permitFile}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onSelect={f=>handleFileSelect("permitFile", f)}
                            uploadHint="PDF, image, or Word · max 5 MB"
                            compact
                          />
                        </div>

                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                          <FieldWrap label="Month" error={errors.permitExpiryMonth}>
                            <Select value={form.permitExpiryMonth} onChange={v=>{setForm(f=>({...f,permitExpiryMonth:v}));clrErr("permitExpiryMonth");}} options={monthOptions} placeholder="Month"/>
                          </FieldWrap>
                          <FieldWrap label="Year" error={errors.permitExpiryYear}>
                            <Select value={form.permitExpiryYear} onChange={v=>{setForm(f=>({...f,permitExpiryYear:v}));clrErr("permitExpiryYear");}} options={licYearOptions} placeholder="Year"/>
                          </FieldWrap>
                        </div>
                      </div>

                      <div style={{padding:"20px",background:C.inputBg,border:`1.5px solid ${C.border}`,borderRadius:12,marginBottom:20,animation:"fadeUp 0.25s ease"}}>
                        <p style={{fontSize:11,letterSpacing:1.8,textTransform:"uppercase",fontWeight:700,color:C.textLabel,marginBottom:6}}>FORKLIFT LICENSE</p>
                        <p style={{fontSize:12,color:C.textMuted,marginBottom:16}}>Upload a copy of your license or certification and enter its expiry date.</p>

                        <div style={{marginBottom:16}}>
                          <FileField
                            file={form.licenseFile}
                            error={errors.licenseFile}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onSelect={f=>handleFileSelect("licenseFile", f)}
                            uploadHint="PDF, image, or Word · max 5 MB"
                            compact
                          />
                        </div>

                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                          <FieldWrap label="Month" error={errors.licenseExpiryMonth}>
                            <Select value={form.licenseExpiryMonth} onChange={v=>{setForm(f=>({...f,licenseExpiryMonth:v}));clrErr("licenseExpiryMonth");}} options={monthOptions} placeholder="Month"/>
                          </FieldWrap>
                          <FieldWrap label="Year" error={errors.licenseExpiryYear}>
                            <Select value={form.licenseExpiryYear} onChange={v=>{setForm(f=>({...f,licenseExpiryYear:v}));clrErr("licenseExpiryYear");}} options={licYearOptions} placeholder="Year"/>
                          </FieldWrap>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 4 Summary Card */}
                  {form.permitStatus&&(
                    <div style={{padding:"16px 20px",background:C.inputBg,border:`1px solid ${C.border}`,borderRadius:12}}>
                      {([
                        ["Permit Status",    PERMIT_STATUSES.find(p=>p.value===form.permitStatus)?.label||""],
                        ...(form.permitStatus === 'other' && form.permitNote ? [["Status Note", form.permitNote] as [string,string]] : []),
                        ...(requiresPermitDocs && form.permitFile ? [["Work Permit Doc", form.permitFile.name] as [string,string]] : []),
                        ...(requiresPermitDocs && form.permitExpiryMonth && form.permitExpiryYear
                          ? [["Permit Expires", `${MONTHS[+form.permitExpiryMonth-1]} ${form.permitExpiryYear}`] as [string,string]]
                          : []),
                        ...(requiresPermitDocs && form.licenseFile ? [["Forklift License Doc", form.licenseFile.name] as [string,string]] : []),
                        ...(requiresPermitDocs && form.licenseExpiryMonth && form.licenseExpiryYear
                          ? [["License Expires", `${MONTHS[+form.licenseExpiryMonth-1]} ${form.licenseExpiryYear}`] as [string,string]]
                          : []),
                      ] as [string,string][]).map(([k,v])=>v&&(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <span style={{fontSize:13,color:C.textMuted,flexShrink:0,marginRight:12}}>{k}</span>
                          <span style={{fontSize:13,color:C.textBody,fontWeight:600,textAlign:"right"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 5: Resume Upload ── */}
              {step===5&&(
                <div key="s5" style={{animation:"fadeUp 0.3s ease"}}>
                  <div style={{marginBottom:20}}>
                    <FileField
                      file={form.resume}
                      error={errors.resume}
                      accept=".pdf,.doc,.docx"
                      onSelect={f=>handleFileSelect("resume", f)}
                      uploadHint="PDF or Word · max 5 MB"
                    />
                  </div>

                  {submitError && (
                    <div style={{padding:"14px 18px",background:C.redActiveBg,border:`1px solid rgba(198,40,40,0.2)`,borderRadius:12,marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span style={{fontSize:13,color:C.red,fontWeight:500}}>{submitError}</span>
                    </div>
                  )}

                  {/* Full summary */}
                  <div style={{padding:"20px 22px",background:C.inputBg,border:`1px solid ${C.border}`,borderRadius:12}}>
                    <p style={{fontSize:11,letterSpacing:1.8,textTransform:"uppercase",fontWeight:700,color:C.textLabel,marginBottom:14}}>Registration Summary</p>
                    {([
                      ["Name",       `${form.firstName} ${form.lastName}`],
                      ["Email",      form.email],
                      ["Phone",      form.phone],
                      ["Industry",   form.jobIndustryName],
                      ["Role",       form.jobCategoryName],
                      ["Location",   [form.cityName, form.provinceName].filter(Boolean).join(", ")],
                      ["Postal Code",form.postalCode],
                      ["Shift",      SHIFT_TYPES.find(s=>s.value===form.shiftType)?.label||form.shiftType],
                      ["Time Slot",  form.preferredTime],
                      ["Available",  form.availability.join(", ")],
                      ["Start Date", form.startDate ? new Date(form.startDate+"T00:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"}) : ""],
                      ["Permit",     PERMIT_STATUSES.find(p=>p.value===form.permitStatus)?.label||""],
                      ["Work Permit Doc",    requiresPermitDocs ? (form.permitFile?.name  || "") : ""],
                      ["Forklift License Doc",requiresPermitDocs ? (form.licenseFile?.name || "") : ""],
                      ["License / Permit",   requiresPermitDocs ? "Required" : "Not required (Canadian Citizen)"],
                    ] as [string,string][]).map(([k,v])=>v&&(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <span style={{fontSize:13,color:C.textMuted,flexShrink:0,marginRight:12}}>{k}</span>
                        <span style={{fontSize:13,color:C.textBody,fontWeight:600,textAlign:"right"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="nav-row" style={{display:"flex",gap:12,marginTop:32}}>
                {step>0&&<GhostBtn label="← Back" onClick={prev}/>}
                <div style={{flex:1}}>
                  <PrimaryBtn label={step<5?"Continue →":submitLabel} loading={loading} onClick={step<5?next:submit}/>
                </div>
              </div>
              <p style={{fontSize:13,color:C.textHint,textAlign:"center",marginTop:20}}>
                By registering you agree to our{" "}
                <span style={{color:C.textLabel,fontWeight:600,cursor:"pointer",borderBottom:`1px solid ${C.borderHover}`}}>Terms</span>
                {" "}&amp;{" "}
                <span style={{color:C.textLabel,fontWeight:600,cursor:"pointer",borderBottom:`1px solid ${C.borderHover}`}}>Privacy Policy</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}