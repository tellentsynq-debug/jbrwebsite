"use client";

import React from "react";
import { motion, AnimatePresence, cubicBezier, type Variants } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  ClipboardCheck, 
  AlertCircle, 
  Briefcase, 
  BarChart3, 
  ChevronLeft, 
  Menu 
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
export const C = {
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
};

/* ─── MANAGER MENU CONFIGURATION ────────────────────────────── */
const MANAGER_SIDEBAR_MENU = [
  {
    group: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/manager/dashboard" },
    ]
  },
  {
    group: "Operations",
    items: [
      { id: "team", label: "My Team", icon: Users, path: "/manager/team" },
      { id: "schedule", label: "Schedule & Shifts", icon: CalendarDays, path: "/manager/schedule" },
      { id: "approvals", label: "Approvals", icon: ClipboardCheck, path: "/manager/approvals" },
      { id: "alerts", label: "Action Alerts", icon: AlertCircle, path: "/manager/alerts" },
    ]
  },
  {
    group: "Clients & Data",
    items: [
      { id: "clients", label: "Client Portal", icon: Briefcase, path: "/manager/clients" },
      { id: "reports", label: "Performance Reports", icon: BarChart3, path: "/manager/reports" },
    ]
  }
];

const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);

interface ManagerSidebarProps {
  isCollapsed: boolean;
  setCollapsed: (val: boolean) => void;
  activeTab?: string;
  setActiveTab?: (val: string) => void;
}

export default function ManagerSidebar({ isCollapsed, setCollapsed, activeTab, setActiveTab }: ManagerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.4, ease: easeOutCirc }}
      style={{
        background: C.surface,
        borderRight: `1px solid ${C.border}`, 
        height: "100vh", position: "sticky", top: 0,
        display: "flex", flexDirection: "column", zIndex: 50, overflow: "hidden", flexShrink: 0
      }}
    >
      <div style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between", borderBottom: `1px solid ${C.border}`, height: "85px" }}>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ display: "flex", flexDirection: "column", gap: "4px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", border: `1px solid ${C.border}`, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: C.inputBg }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", color: C.red, fontWeight: 700, fontSize: "14px", zIndex: 1 }}>JBR</span>
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, letterSpacing: "1.5px", color: C.textHeading, whiteSpace: "nowrap" }}>STAFFING</span>
              </div>
              <span style={{ fontSize: "9px", letterSpacing: "1.5px", color: C.textMuted, textTransform: "uppercase", whiteSpace: "nowrap", paddingLeft: "32px" }}>Manager Portal</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.05, backgroundColor: C.inputBg }} whileTap={{ scale: 0.95 }}
          style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", borderRadius: "8px", transition: "color 0.2s" }}
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </motion.button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {MANAGER_SIDEBAR_MENU.map((group, gIdx) => (
          <div key={gIdx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {!isCollapsed ? (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: C.textHint, paddingLeft: "12px", marginBottom: "4px" }}>{group.group}</motion.span>
            ) : <div style={{ height: "1px", background: C.border, margin: "8px 0" }} />}

            {group.items.map((item) => {
              // Automatically highlight based on URL, falling back to state if URL doesn't match
              const isActive = activeTab ? activeTab === item.id : pathname === item.path;
              const Icon = item.icon;
              
              return (
                <motion.button
                  key={item.id} 
                  onClick={() => {
                    if (setActiveTab) setActiveTab(item.id);
                    router.push(item.path);
                  }}
                  whileHover={!isActive ? { backgroundColor: C.inputBg, x: 4 } : {}} whileTap={{ scale: 0.98 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "16px", width: "100%", padding: "12px",
                    background: isActive ? C.redActiveBg : "transparent",
                    border: "none", borderRadius: "8px", cursor: "pointer", position: "relative", transition: "all 0.2s ease"
                  }}
                >
                  {isActive && <motion.div layoutId="activeManagerTabIndicator" style={{ position: "absolute", left: 0, top: "10%", bottom: "10%", width: "3px", borderRadius: "0 4px 4px 0", background: C.red }} />}
                  <div style={{ display: "flex", justifyContent: "center", width: isCollapsed ? "100%" : "auto", color: isActive ? C.red : C.textMuted }}><Icon size={20} strokeWidth={isActive ? 2.5 : 2} /></div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ fontSize: "13px", fontWeight: isActive ? 600 : 500, color: isActive ? C.red : C.textLabel, whiteSpace: "nowrap" }}>
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    </motion.aside>
  );
}


