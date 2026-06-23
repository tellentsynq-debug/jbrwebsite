"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, cubicBezier, type Variants } from "framer-motion";
import { useRouter } from "next/navigation"; 
import { 
  Users, 
  Clock, 
  CheckSquare, 
  AlertCircle, 
  TrendingUp, 
  LogOut, 
  CalendarPlus, 
  FileSignature,
  PieChart,
  Briefcase
} from "lucide-react";
import SidebarManager from "@/app/components/SidebarManager";
// Assuming Sidebar is in the parent directory based on your previous structure


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
  pendingBg: "rgba(59,130,246,0.08)",
  pendingBorder: "rgba(59,130,246,0.2)",
  pendingText: "#3B82F6",
  alertBg: "rgba(198,40,40,0.08)",
  alertText: "#C62828",
  btnSecondary: "#111111",
  btnTertiary: "#374151",
  shadow: "rgba(0,0,0,0.06)",      
  shadowMd: "rgba(0,0,0,0.10)",    
};

/* ─── GLOBAL CSS ────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.textBody}; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #9BA3AF; }

  .clean-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
  }

  @media (max-width: 1200px) {
    .stats-row {
      overflow-x: auto;
      padding-bottom: 16px;
    }
    .stats-grid {
      min-width: 1000px;
    }
  }
`;

/* ─── MOCK DATA ──────────────────────────────────────────────── */
const STATS_DATA = [
  { label: "Active Team", value: "142", sub: "Currently deployed", icon: Users, href: "/manager/team" },
  { label: "Shifts Today", value: "38", sub: "across 5 sites", icon: Clock, href: "/manager/schedule" },
  { label: "Pending Approvals", value: "12", sub: "Timesheets & Leaves", icon: CheckSquare, href: "/manager/approvals" },
  { label: "Overtime Alerts", value: "4", sub: "Requires attention", icon: AlertCircle, alert: true, href: "/manager/alerts" },
  { label: "Fulfillment Rate", value: "94%", sub: "Weekly average", icon: TrendingUp, href: "/manager/reports" },
];

const RECENT_ACTIVITY = [
  { name: "John Doe", action: "Clocked in - Morning Shift", time: "10 mins ago", initials: "JD", status: "Active", statusColor: C.successText, statusBg: C.successBg },
  { name: "Sarah Smith", action: "Requested shift swap", time: "1 hr ago", initials: "SS", status: "Review", statusColor: C.pendingText, statusBg: C.pendingBg },
  { name: "Apex Logistics", action: "Approved weekly timesheets", time: "2 hrs ago", initials: "AL", status: "Done", statusColor: C.textMuted, statusBg: C.inputBg },
  { name: "Mike Johnson", action: "Submitted sick leave", time: "3 hrs ago", initials: "MJ", status: "Review", statusColor: C.pendingText, statusBg: C.pendingBg },
];

const CLIENT_REQUESTS = [
  { name: "Apex Logistics", requested: 45, filled: 42 },
  { name: "Prime Warehousing", requested: 30, filled: 30 },
  { name: "Global Freight", requested: 25, filled: 20 },
  { name: "Nexus Security", requested: 15, filled: 15 },
  { name: "Summit Manufac...", requested: 10, filled: 8 },
  { name: "Elevate Retail", requested: 8, filled: 8 },
];

const SHIFT_STATS = {
  filled: 34, 
  open: 3, 
  cancelled: 1
};
const totalShifts = SHIFT_STATS.filled + SHIFT_STATS.open + SHIFT_STATS.cancelled;

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);
const spring = { type: "spring" as const, stiffness: 200, damping: 20 };

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: spring }
};

/* ─── COMPONENTS ─────────────────────────────────────────────── */

function TopNav({ activeTabLabel }: { activeTabLabel: string }) {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string, email?: string, role?: string } | null>(null);

  useEffect(() => {
    // Pulling the manager user object specifically
    const storedUser = localStorage.getItem("jbr_manager");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("jbr_manager_token");
    localStorage.removeItem("jbr_manager");
    router.push("/"); // Ensure this points to your login/auth route
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: easeOutCirc }}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 36px", borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        position: "sticky", top: 0, zIndex: 10,
      }}>
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", color: C.textHint, fontWeight: 600 }}>{activeTabLabel}</span>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <span style={{ fontSize: "13px", color: C.textMuted }}>
          Welcome, <span style={{ color: C.textHeading, fontWeight: 600 }}>
            {user ? (user.firstName ? `${user.firstName} (Manager)` : user.email) : "Loading..."}
          </span>
        </span>
        <motion.button 
          onClick={handleSignOut}
          whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }} whileTap={{ scale: 0.97 }}
          style={{
            display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px",
            background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px",
            color: C.textLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease"
          }}>
          Sign Out
          <LogOut size={14} strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.header>
  );
}

function StatCard({ data }: { data: typeof STATS_DATA[0] }) {
  const router = useRouter();
  const Icon = data.icon;
  const isAlert = 'alert' in data && data.alert;

  return (
    <motion.div 
      onClick={() => { if(data.href) router.push(data.href) }}
      variants={itemVars}
      whileHover={{ y: -3, borderColor: C.borderHover, boxShadow: `0 8px 24px rgba(0,0,0,0.08)` }}
      whileTap={{ scale: 0.98 }}
      className="clean-card" 
      style={{ 
        padding: "20px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start", 
        cursor: data.href ? "pointer" : "default",
        minWidth: 0,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}>
      <div style={{ flex: 1, minWidth: 0, paddingRight: "12px" }}>
        <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: C.textMuted, marginBottom: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>
          {data.label}
        </p>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "30px", fontWeight: 700, letterSpacing: "-0.5px", color: C.textHeading, lineHeight: 1, marginBottom: "8px" }}>
          {data.value}
        </h3>
        <p style={{ fontSize: "11px", color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
          {data.sub}
        </p>
      </div>
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
        background: isAlert ? C.alertBg : C.inputBg,
        border: `1px solid ${isAlert ? C.alertText : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", 
        color: isAlert ? C.alertText : C.textLabel,
      }}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
    </motion.div>
  );
}

function ShiftStatusDonutChart() {
  const size = 200; 
  const strokeWidth = 32; 
  const radius = (size - strokeWidth) / 2; 
  const circumference = radius * 2 * Math.PI;
  
  const filledPercentage = totalShifts > 0 ? (SHIFT_STATS.filled / totalShifts) : 0;
  const filledOffset = circumference - (filledPercentage * circumference);

  return (
    <motion.div variants={itemVars} className="clean-card" style={{ padding: "28px", flex: "1 1 380px", display: "flex", flexDirection: "column" }}>
      <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "28px", letterSpacing: "0.3px", color: C.textHeading, display: "flex", alignItems: "center", gap: "8px" }}>
        <PieChart size={18} color={C.red} strokeWidth={2.5} /> Today's Shift Status
      </h3>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, position: "relative" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={C.bg} strokeWidth={strokeWidth} />
          <motion.circle 
            cx={size/2} cy={size/2} r={radius} fill="none" stroke={C.redBright} strokeWidth={strokeWidth} strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: filledOffset }} transition={{ duration: 1.8, ease: easeOutCirc, delay: 0.4 }}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: "absolute", textAlign: "center" }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.9, ...spring }} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "34px", fontWeight: 700, color: C.textHeading }}>
            {SHIFT_STATS.filled}
          </motion.div>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: C.red, fontWeight: 700 }}>Filled</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "28px" }}>
        {[
          { label: "Filled", color: C.redBright, count: SHIFT_STATS.filled },
          { label: "Open", color: "#F59E0B", count: SHIFT_STATS.open },
          { label: "Cancelled", color: "#E5E7EB", count: SHIFT_STATS.cancelled }
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.textLabel }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
            <span style={{ fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: C.textMuted }}>({item.count})</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RecentActivity() {
  return (
    <motion.div variants={itemVars} className="clean-card" style={{ padding: "28px", flex: "1 1 340px", display: "flex", flexDirection: "column" }}>
      <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "20px", letterSpacing: "0.3px", color: C.textHeading }}>Team Activity</h3>
      <motion.div variants={containerVars} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column" }}>
        {RECENT_ACTIVITY.map((act, i) => (
          <motion.div key={i} variants={itemVars} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i !== RECENT_ACTIVITY.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: C.inputBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: C.textLabel, letterSpacing: "0.5px", flexShrink: 0 }}>
                {act.initials}
              </div>
              <div>
                <p style={{ fontSize: "13px", color: C.textBody, marginBottom: "3px" }}>
                  <span style={{ fontWeight: 700 }}>{act.name}</span>
                  <span style={{ color: C.textMuted }}> - </span>
                  <span style={{ color: C.textBody, fontWeight: 500 }}>{act.action}</span>
                </p>
                <p style={{ fontSize: "11px", color: C.textHint, fontWeight: 500 }}>{act.time}</p>
              </div>
            </div>
            <div style={{ padding: "4px 10px", borderRadius: "20px", background: act.statusBg, border: `1px solid ${act.statusColor}30`, color: act.statusColor, fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, flexShrink: 0, marginLeft: "12px" }}>
              {act.status}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function FulfillmentBarChart({ title, type }: { title: string, type: "requested" | "filled" }) {
  const isRequested = type === "requested";
  const maxVal = 50; // Based on mock data max
  const barColor = isRequested ? C.textHint : C.red;

  return (
    <motion.div variants={itemVars} className="clean-card" style={{ padding: "28px", flex: 1, minWidth: "380px" }}>
      <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "28px", letterSpacing: "0.3px", color: C.textHeading }}>{title}</h3>
      <div style={{ display: "flex", height: "180px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
          {[1, 0.75, 0.5, 0.25, 0].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", width: "24px", textAlign: "right", color: C.textHint, fontWeight: 600 }}>{Math.round(maxVal * step)}</span>
              <div style={{ flex: 1, height: "1px", background: i === 4 ? C.borderHover : C.border }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", flex: 1, paddingLeft: "40px", position: "relative", zIndex: 1 }}>
          {CLIENT_REQUESTS.map((client, i) => {
            const heightPct = ((isRequested ? client.requested : client.filled) / maxVal) * 100;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "46px" }}>
                <motion.div 
                  initial={{ height: 0 }}
                  whileInView={{ height: `${heightPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: easeOutCirc, delay: i * 0.05 }}
                  style={{ width: "100%", background: barColor, borderRadius: "4px 4px 0 0", minHeight: heightPct > 0 ? "4px" : 0 }}
                  title={`${client.name}: ${isRequested ? client.requested : client.filled}`}
                />
                <span style={{ fontSize: "10px", color: C.textHint, transform: "rotate(-45deg)", transformOrigin: "top left", whiteSpace: "nowrap", marginTop: "6px", width: "20px", fontWeight: 600 }}>{client.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ActionCard({ title, sub, type, icon: Icon, href }: { title: string, sub: string, type: "primary"|"secondary"|"tertiary", icon: any, href: string }) {
  const router = useRouter();
  const isPrimary = type === "primary";
  const isSecondary = type === "secondary";

  const bg = isPrimary
    ? `linear-gradient(135deg, ${C.redBright}, ${C.red})`
    : isSecondary
    ? C.btnSecondary
    : C.btnTertiary;

  const iconColor = isPrimary ? C.white : C.textHint;
  const titleColor = C.white;
  const subColor = "rgba(255,255,255,0.7)";

  return (
    <motion.div 
      onClick={() => router.push(href)}
      variants={itemVars}
      whileHover={{ y: -4, boxShadow: isPrimary ? `0 8px 24px ${C.redGlow}` : `0 8px 24px rgba(0,0,0,0.1)` }}
      whileTap={{ scale: 0.98 }}
      style={{
        flex: 1, padding: "24px", borderRadius: "14px", cursor: "pointer", position: "relative", overflow: "hidden",
        background: bg,
        border: isPrimary ? "none" : `1px solid ${C.border}`,
        boxShadow: isPrimary ? `0 4px 16px ${C.redGlow}` : `0 1px 3px ${C.shadow}`,
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: "20px" }}>
        <div style={{ color: iconColor }}><Icon size={26} strokeWidth={2} /></div>
        <div>
          <h4 style={{ fontSize: "16px", fontWeight: 600, color: titleColor, marginBottom: "4px" }}>{title}</h4>
          <p style={{ fontSize: "12px", color: subColor, fontWeight: 500 }}>{sub}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN LAYOUT PAGE ────────────────────────────────────── */
export default function ManagerDashboard() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const activeTabLabel = "Manager Dashboard"; 

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        
        <SidebarManager
          isCollapsed={isSidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", position: "relative" }}>
          
          <TopNav activeTabLabel={activeTabLabel} />

          <main style={{ padding: "32px 36px", maxWidth: "1600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "28px" }}>
            
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" ? (
                <motion.div
                  key="dashboard-view"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}
                  style={{ display: "flex", flexDirection: "column", gap: "28px" }}
                >
                  {/* Header */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "38px", fontWeight: 600, color: C.textHeading, marginBottom: "6px", letterSpacing: "-0.5px" }}>
                      Operations Overview
                    </h1>
                    <p style={{ fontSize: "15px", color: C.textMuted }}>
                      Monitor team deployments, shift fulfillment, and daily operations.
                    </p>
                  </motion.div>

                  {/* Stats Row */}
                  <div className="stats-row">
                    <motion.div 
                      variants={containerVars} 
                      initial="hidden" 
                      animate="show" 
                      className="stats-grid"
                      style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))", 
                        gap: "16px" 
                      }}
                    >
                      {STATS_DATA.map((stat, i) => <StatCard key={i} data={stat} />)}
                    </motion.div>
                  </div>

                  {/* Charts Row */}
                  <motion.div variants={containerVars} initial="hidden" animate="show" style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                    <ShiftStatusDonutChart />
                    <RecentActivity />
                  </motion.div>

                  {/* Bar Charts */}
                  <motion.div variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                    <FulfillmentBarChart title="Client Staffing Requests (Total)" type="requested" />
                    <FulfillmentBarChart title="Positions Filled by Client (Current)" type="filled" />
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ paddingBottom: "32px" }}>
                    <motion.h3 variants={itemVars} style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: C.textHeading }}>Manager Actions</motion.h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                      <ActionCard title="Assign Shift" sub="Schedule team members" type="primary" icon={CalendarPlus} href="/manager/schedule/new" />
                      <ActionCard title="Approve Timesheets" sub="12 pending reviews" type="secondary" icon={FileSignature} href="/manager/approvals" />
                      <ActionCard title="Client Portal" sub="View client requisitions" type="tertiary" icon={Briefcase} href="/manager/clients" />
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div 
                  key="other-view"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px dashed ${C.borderHover}`, borderRadius: "14px", background: C.surface }}
                >
                  <Briefcase size={40} color={C.textHint} style={{ marginBottom: "16px" }} />
                  <h2 style={{ fontSize: "22px", fontFamily: "'Cormorant Garamond', serif", color: C.textHeading, fontWeight: 600 }}>{activeTabLabel} Module</h2>
                  <p style={{ color: C.textMuted, marginTop: "8px", fontSize: "14px" }}>This operational section is currently under development.</p>
                </motion.div>
              )}
            </AnimatePresence>

          </main>
        </div>
      </div>
    </>
  );
}



