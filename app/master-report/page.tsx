"use client";

import React, { useState, useEffect } from "react";
import { cubicBezier, motion, type Variants } from "framer-motion";
import { 
  LogOut, Download, FileText, Users, UserCheck, Calendar, 
  AlertTriangle, TrendingUp, MapPin, Briefcase, Clock, 
  ShieldAlert, Activity, FileWarning, Loader2
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

import Sidebar from "../components/Sidebar";
import { useRouter } from "next/navigation";

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
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
  alertBg: "rgba(198,40,40,0.08)",
  alertText: "#C62828",
  shadow: "rgba(0,0,0,0.06)",
};

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
  .chart-bar { transition: filter 0.2s; }
  .chart-bar:hover { filter: brightness(0.9); }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ─── AUTH ───────────────────────────────────────────────────── */
function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jbr_token") || "" : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ─── BASE URL ───────────────────────────────────────────────── */
const BASE_URL = "https://jbrstaffingsolutions.com/api";

/* ─── TYPES ──────────────────────────────────────────────────── */
interface ProvinceData {
  id: string; name: string; code?: string;
  total: number; verified: number; unverified: number; recentAdditions: number;
}
interface CityData {
  id: string; name: string; province: string;
  total: number; verified: number; unverified: number; recentAdditions: number;
}
interface GroupData {
  id: string; name: string; isActive: boolean; total: number; createdAt: string;
}
interface CampaignData {
  id: string | null; name: string; isActive: boolean;
  total: number; verified: number; unverified: number; recentAdditions: number;
}

/* ─── ANIMATION VARIANTS ─────────────────────────────────────── */
const easeOutCirc = cubicBezier(0.0, 0.55, 0.45, 1);
const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const itemVars: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

/* ─── LOADING SPINNER ────────────────────────────────────────── */
function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", color: C.textMuted }}>
      <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );
}

/* ─── DONUT CHART ────────────────────────────────────────────── */
function DonutChart({
  data, size = 200, strokeWidth = 30,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let currentOffset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={C.bg} strokeWidth={strokeWidth} />
          {total === 0 ? (
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={C.borderHover} strokeWidth={strokeWidth} />
          ) : (
            data.map((item, i) => {
              const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
              const offset = currentOffset;
              currentOffset -= (item.value / total) * circumference;
              return (
                <motion.circle
                  key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
                  stroke={item.color} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, ease: easeOutCirc, delay: i * 0.2 }}
                />
              );
            })
          )}
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: C.textBody }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: item.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: C.textMuted }}>
              ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── BAR CHART ──────────────────────────────────────────────── */
function CustomBarChart({ data, color }: { data: { name: string; total: number }[]; color: string }) {
  if (!data || data.length === 0) {
    return <div style={{ color: C.textMuted, fontSize: "14px", padding: "20px 0" }}>No data available</div>;
  }
  const maxVal = Math.max(...data.map((d) => d.total)) * 1.1 || 1;

  return (
    <div style={{ display: "flex", height: "220px", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
        {[1, 0.75, 0.5, 0.25, 0].map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", width: "24px", textAlign: "right", color: C.textHint, fontWeight: 500 }}>
              {Math.round(maxVal * step)}
            </span>
            <div style={{ flex: 1, height: "1px", background: i === 4 ? C.borderHover : C.border }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", flex: 1, paddingLeft: "40px", position: "relative", zIndex: 1 }}>
        {data.map((item, i) => {
          const heightPct = (item.total / maxVal) * 100;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "32px" }}>
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${heightPct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: easeOutCirc, delay: i * 0.1 }}
                className="chart-bar"
                style={{ width: "100%", background: color, borderRadius: "4px 4px 0 0", cursor: "pointer" }}
                title={`${item.name}: ${item.total}`}
              />
              <span style={{ fontSize: "10px", color: C.textMuted, transform: "rotate(-45deg)", transformOrigin: "top left", whiteSpace: "nowrap", marginTop: "8px", width: "20px", fontWeight: 600 }}>
                {item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── METRIC CARD ────────────────────────────────────────────── */
function MetricCard({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: "160px", padding: "24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
      <h3 style={{ fontSize: "36px", fontWeight: 700, color, fontFamily: "'DM Sans', sans-serif" }}>{value}</h3>
      <p style={{ fontSize: "14px", fontWeight: 600, color: C.textHeading, textAlign: "center" }}>{label}</p>
      <p style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500, textAlign: "center" }}>{sub}</p>
    </div>
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
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: `1px solid ${C.border}`, background: C.surface, position: "sticky", top: 0, zIndex: 10 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHint, fontWeight: 600 }}>Reports</span>
        <span style={{ color: C.textMuted }}>/</span>
        <span style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: C.textHeading, fontWeight: 600 }}>Master Report</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <span style={{ fontSize: "13px", color: C.textMuted }}>
          Welcome, <span style={{ color: C.textHeading, fontWeight: 600 }}>
            {user ? (user.firstName ? `${user.firstName} (${user.email})` : user.email) : "Loading..."}
          </span>
        </span>
        <motion.button
          onClick={() => { localStorage.removeItem("jbr_token"); localStorage.removeItem("jbr_user"); router.push("/"); }}
          whileHover={{ backgroundColor: C.redActiveBg, borderColor: C.red, color: C.red }}
          whileTap={{ scale: 0.98 }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.textLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}
        >
          Sign Out <LogOut size={16} />
        </motion.button>
      </div>
    </motion.header>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function MasterReportPage() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();

        const [summaryRes, provincesRes, citiesRes, groupsRes, campaignsRes] = await Promise.all([
          fetch(`${BASE_URL}/master-report/summary`, { headers }),
          fetch(`${BASE_URL}/master-report/provinces?sort=count&order=desc`, { headers }),
          fetch(`${BASE_URL}/master-report/cities?sort=count&order=desc`, { headers }),
          fetch(`${BASE_URL}/master-report/groups?sort=recentAdditions&order=desc`, { headers }),
          fetch(`${BASE_URL}/master-report/campaigns`, { headers }),
        ]);

        const [summaryJson, provincesJson, citiesJson, groupsJson, campaignsJson] = await Promise.all([
          summaryRes.json(),
          provincesRes.json(),
          citiesRes.json(),
          groupsRes.json(),
          campaignsRes.json(),
        ]);

        // Summary
        if (summaryJson?.summary?.totalCandidates !== undefined) {
          setTotalCandidates(summaryJson.summary.totalCandidates);
        }

        // Provinces
        if (Array.isArray(provincesJson?.data)) {
          setProvinces(provincesJson.data);
        }

        // Cities
        if (Array.isArray(citiesJson?.data)) {
          setCities(citiesJson.data);
        }

        // Groups
        if (Array.isArray(groupsJson?.data)) {
          setGroups(groupsJson.data);
        }

        // Campaigns
        if (Array.isArray(campaignsJson?.data)) {
          setCampaigns(campaignsJson.data);
        }
      } catch (err) {
        console.error("Master Report fetch error:", err);
        setError("Failed to load report data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  /* ── Derived values ── */
  const totalVerified = provinces.reduce((acc, p) => acc + p.verified, 0);
  const totalUnverified = provinces.reduce((acc, p) => acc + p.unverified, 0);
  const verifiedRate = totalCandidates > 0 ? Math.round((totalVerified / totalCandidates) * 100) : 0;
  const activeGroups = groups.filter((g) => g.isActive).length;
  const inactiveGroups = groups.filter((g) => !g.isActive).length;
  const activeCampaigns = campaigns.filter((c) => c.isActive).length;
  const topCities = [...cities].sort((a, b) => b.total - a.total).slice(0, 6);

  const statCards = [
    { label: "Total Candidates", value: totalCandidates.toLocaleString(), sub: "All registrations", icon: Users, color: "#3B82F6" },
    { label: "Verified Rate", value: `${verifiedRate}%`, sub: `${totalVerified.toLocaleString()} verified`, icon: UserCheck, color: C.successText },
    { label: "Active Groups", value: activeGroups.toString(), sub: `${groups.length} total groups`, icon: Calendar, color: "#8B5CF6" },
    { label: "Active Campaigns", value: activeCampaigns.toString(), sub: "Currently running", icon: AlertTriangle, color: C.alertText },
  ];

  const verDonut = [
    { label: "Verified", value: totalVerified, color: C.successText },
    { label: "Unverified", value: totalUnverified, color: "#F59E0B" },
  ];

  const groupsDonut = [
    { label: "Active", value: activeGroups, color: C.successText },
    { label: "Inactive", value: inactiveGroups, color: C.alertText },
  ];

  /* ── Export Functions ── */
  const handleExportExcel = () => {
    if (loading) return;

    const wb = XLSX.utils.book_new();

    // Summary Data
    const summaryData = [
      { Metric: "Total Candidates", Value: totalCandidates },
      { Metric: "Verified Candidates", Value: totalVerified },
      { Metric: "Unverified Candidates", Value: totalUnverified },
      { Metric: "Overall Verified Rate", Value: `${verifiedRate}%` },
      { Metric: "Active Groups", Value: activeGroups },
      { Metric: "Inactive Groups", Value: inactiveGroups },
      { Metric: "Active Campaigns", Value: activeCampaigns }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Provinces Data
    const formattedProvinces = provinces.map((p) => ({
      Province: p.name,
      "Total Candidates": p.total,
      "Verified Candidates": p.verified,
      "Unverified Candidates": p.unverified,
      "Verification Rate": p.total > 0 ? `${Math.round((p.verified / p.total) * 100)}%` : "0%"
    }));
    const wsProvinces = XLSX.utils.json_to_sheet(formattedProvinces);
    XLSX.utils.book_append_sheet(wb, wsProvinces, "Provinces Breakdown");

    // Cities Data
    const formattedCities = cities.map((c) => ({
      City: c.name,
      Province: c.province,
      "Total Candidates": c.total,
      "Verified Candidates": c.verified,
      "Unverified Candidates": c.unverified,
      "Verification Rate": c.total > 0 ? `${Math.round((c.verified / c.total) * 100)}%` : "0%"
    }));
    const wsCities = XLSX.utils.json_to_sheet(formattedCities);
    XLSX.utils.book_append_sheet(wb, wsCities, "Cities Breakdown");

    // Groups Data
    const formattedGroups = groups.map((g) => ({
      "Group Name": g.name,
      "Total Members": g.total,
      Status: g.isActive ? "Active" : "Inactive"
    }));
    const wsGroups = XLSX.utils.json_to_sheet(formattedGroups);
    XLSX.utils.book_append_sheet(wb, wsGroups, "Groups");

    // Campaigns Data
    const formattedCampaigns = campaigns.map((c) => ({
      "Campaign Name": c.name,
      "Total Candidates": c.total,
      "Verified Candidates": c.verified,
      Status: c.isActive ? "Active" : "Inactive"
    }));
    const wsCampaigns = XLSX.utils.json_to_sheet(formattedCampaigns);
    XLSX.utils.book_append_sheet(wb, wsCampaigns, "Campaigns");

    XLSX.writeFile(wb, "Master_Report.xlsx");
  };

  const handleGeneratePDF = () => {
    if (loading) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header Title
    doc.setFontSize(22);
    doc.setTextColor(198, 40, 40); // C.red
    doc.text("JBR Master Report", 14, 22);

    // Meta Data
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // C.textMuted
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30);

    let currentY = 40;

    // 1. Summary Metrics
    doc.setFontSize(14);
    doc.setTextColor(17, 17, 17);
    doc.text("Performance Metrics & KPIs", 14, currentY);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: currentY + 6,
      head: [["Metric", "Value"]],
      body: [
        ["Total Candidates", totalCandidates.toString()],
        ["Verified Candidates", totalVerified.toString()],
        ["Unverified Candidates", totalUnverified.toString()],
        ["Overall Verification Rate", `${verifiedRate}%`],
        ["Total Active Groups", activeGroups.toString()],
        ["Total Active Campaigns", activeCampaigns.toString()],
      ],
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      margin: { left: 14 }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // 2. Provinces Table
    doc.setFontSize(14);
    doc.text("Candidates by Province", 14, currentY);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: currentY + 6,
      head: [["Province", "Total", "Verified", "Unverified", "Rate"]],
      body: provinces.map((p) => [
        p.name,
        p.total.toString(),
        p.verified.toString(),
        p.unverified.toString(),
        p.total > 0 ? `${Math.round((p.verified / p.total) * 100)}%` : "0%"
      ]),
      theme: "striped",
      headStyles: { fillColor: [5, 150, 105] }, // Success green
      styles: { fontSize: 10 },
      margin: { left: 14 }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Page break logic if needed
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // 3. Top Cities Table
    doc.setFontSize(14);
    doc.text("Top Cities Overview", 14, currentY);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: currentY + 6,
      head: [["City", "Province", "Total", "Verified", "Rate"]],
      body: topCities.map((c) => [
        c.name,
        c.province,
        c.total.toString(),
        c.verified.toString(),
        c.total > 0 ? `${Math.round((c.verified / c.total) * 100)}%` : "0%"
      ]),
      theme: "striped",
      headStyles: { fillColor: [229, 57, 53] }, // Red bright
      styles: { fontSize: 10 },
      margin: { left: 14 }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 240) { doc.addPage(); currentY = 20; }

    // 4. Groups Table
    doc.setFontSize(14);
    doc.text("Groups Directory", 14, currentY);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: currentY + 6,
      head: [["Group Name", "Total Members", "Status"]],
      body: groups.map((g) => [
        g.name,
        g.total.toString(),
        g.isActive ? "Active" : "Inactive"
      ]),
      theme: "striped",
      headStyles: { fillColor: [139, 92, 246] }, // Purple
      styles: { fontSize: 10 },
      margin: { left: 14 }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 240) { doc.addPage(); currentY = 20; }

    // 5. Campaigns Table
    doc.setFontSize(14);
    doc.text("Campaigns Snapshot", 14, currentY);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: currentY + 6,
      head: [["Campaign Name", "Total Candidates", "Verified", "Status"]],
      body: campaigns.map((c) => [
        c.name,
        c.total.toString(),
        c.verified.toString(),
        c.isActive ? "Active" : "Inactive"
      ]),
      theme: "striped",
      headStyles: { fillColor: [229, 57, 53] }, // Red bright
      styles: { fontSize: 10 },
      margin: { left: 14 }
    });

    doc.save("Master_Report.pdf");
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} activeTab="master_report" setActiveTab={() => {}} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", position: "relative" }}>
          <TopNav />

          <main style={{ padding: "40px", maxWidth: "1600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "8px" }}
            >
              <div>
                <h1 style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "'Cormorant Garamond', serif", fontSize: "42px", fontWeight: 600, color: C.textHeading, marginBottom: "8px", letterSpacing: "-0.5px" }}>
                  <Activity size={32} color={C.red} strokeWidth={2} /> Master Report
                </h1>
                <p style={{ fontSize: "15px", color: C.textMuted }}>Comprehensive overview of all portal metrics and statistics</p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <motion.button
                  onClick={handleExportExcel}
                  whileHover={{ backgroundColor: C.inputBg }} whileTap={{ scale: 0.98 }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textHeading, fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                >
                  <Download size={16} /> Export Excel
                </motion.button>
                <motion.button
                  onClick={handleGeneratePDF}
                  whileHover={{ y: -2, boxShadow: `0 4px 16px ${C.redGlow}` }} whileTap={{ scale: 0.98 }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: `linear-gradient(135deg, ${C.redBright}, ${C.red})`, border: "none", borderRadius: "8px", color: C.white, fontSize: "14px", fontWeight: 600, cursor: "pointer", boxShadow: `0 2px 8px ${C.redGlow}` }}
                >
                  <FileText size={16} /> Generate PDF
                </motion.button>
              </div>
            </motion.div>

            {/* Error Banner */}
            {error && (
              <div style={{ padding: "16px 24px", background: C.alertBg, border: `1px solid ${C.red}`, borderRadius: "12px", color: C.alertText, fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* ── Stat Cards ── */}
            <motion.div variants={containerVars} initial="hidden" animate="show" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              {statCards.map((stat, i) => (
                <motion.div key={i} variants={itemVars} className="clean-card" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: C.textLabel, marginBottom: "12px", fontWeight: 600 }}>{stat.label}</p>
                    <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "36px", fontWeight: 700, color: C.textHeading, lineHeight: 1, marginBottom: "8px" }}>
                      {loading
                        ? <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: C.textHint }} />
                        : stat.value}
                    </h3>
                    <p style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500 }}>{stat.sub}</p>
                  </div>
                  <div style={{ color: stat.color, padding: "10px", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "10px" }}>
                    <stat.icon size={24} strokeWidth={2} />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Charts Row 1: Verification Donut + Groups Donut ── */}
            <motion.div variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
              <motion.div variants={itemVars} className="clean-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, marginBottom: "32px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={20} color={C.red} strokeWidth={2} /> Verification Status Distribution
                </h3>
                {loading ? <LoadingSpinner /> : <DonutChart data={verDonut} />}
              </motion.div>

              <motion.div variants={itemVars} className="clean-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, marginBottom: "32px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Users size={20} color={C.red} strokeWidth={2} /> Groups Overview
                </h3>
                {loading ? <LoadingSpinner /> : (
                  <div>
                    <DonutChart data={groupsDonut} size={180} strokeWidth={28} />
                    <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {groups.map((g, i) => (
                        <div key={i} style={{ padding: "7px 14px", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: g.isActive ? C.successText : C.alertText, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: C.textHeading }}>{g.name}</span>
                          <span style={{ color: C.textMuted }}>{g.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* ── Charts Row 2: Province Bar + City Bar ── */}
            <motion.div variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
              <motion.div variants={itemVars} className="clean-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, marginBottom: "32px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={20} color={C.red} strokeWidth={2} /> Top Provinces by Candidates
                </h3>
                {loading ? <LoadingSpinner /> : (
                  <CustomBarChart data={provinces.map((p) => ({ name: p.name, total: p.total }))} color="#3B82F6" />
                )}
              </motion.div>

              <motion.div variants={itemVars} className="clean-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, marginBottom: "32px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Briefcase size={20} color={C.red} strokeWidth={2} /> Top Cities by Candidates
                </h3>
                {loading ? <LoadingSpinner /> : (
                  <CustomBarChart data={topCities.map((c) => ({ name: c.name, total: c.total }))} color={C.redBright} />
                )}
              </motion.div>
            </motion.div>

            {/* ── Performance KPIs ── */}
            <motion.div variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="clean-card" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={20} color={C.red} strokeWidth={2} /> Performance Metrics & KPIs
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                <MetricCard value={loading ? "—" : totalCandidates.toLocaleString()} label="Total Candidates" sub="All registrations" color="#3B82F6" />
                <MetricCard value={loading ? "—" : `${verifiedRate}%`} label="Verification Rate" sub="Overall success" color={C.successText} />
                <MetricCard value={loading ? "—" : activeCampaigns.toString()} label="Active Campaigns" sub="Currently running" color="#8B5CF6" />
                <MetricCard value={loading ? "—" : groups.length.toString()} label="Total Groups" sub={`${activeGroups} active`} color={C.alertText} />
              </div>
            </motion.div>

            {/* ── Tables Row: Provinces + Cities ── */}
            <motion.div variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
              {/* Provinces Table */}
              <motion.div variants={itemVars} className="clean-card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "24px", borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, display: "flex", alignItems: "center", gap: "8px" }}>
                    <MapPin size={20} color={C.red} strokeWidth={2} /> Candidates by Province
                  </h3>
                </div>
                <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: C.inputBg, fontSize: "12px", textTransform: "uppercase", color: C.textHint, fontWeight: 600 }}>
                  <span>Province</span>
                  <span style={{ textAlign: "right" }}>Total</span>
                  <span style={{ textAlign: "right" }}>Verified</span>
                  <span style={{ textAlign: "right" }}>Rate</span>
                </div>
                {loading ? <LoadingSpinner /> : provinces.map((prov, i) => {
                  const rate = prov.total > 0 ? Math.round((prov.verified / prov.total) * 100) : 0;
                  return (
                    <div key={i} style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderBottom: i !== provinces.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                      <span style={{ fontSize: "15px", color: C.textHeading, fontWeight: 600 }}>{prov.name}</span>
                      <span style={{ fontSize: "14px", color: C.textMuted, textAlign: "right" }}>{prov.total}</span>
                      <span style={{ fontSize: "14px", color: C.textMuted, textAlign: "right" }}>{prov.verified}</span>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: rate >= 50 ? C.successBg : C.alertBg, color: rate >= 50 ? C.successText : C.alertText }}>
                          {rate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {/* Cities Table */}
              <motion.div variants={itemVars} className="clean-card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "24px", borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, display: "flex", alignItems: "center", gap: "8px" }}>
                    <MapPin size={20} color={C.red} strokeWidth={2} /> Top Cities by Candidates
                  </h3>
                </div>
                <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: C.inputBg, fontSize: "12px", textTransform: "uppercase", color: C.textHint, fontWeight: 600 }}>
                  <span>City</span>
                  <span style={{ textAlign: "right" }}>Total</span>
                  <span style={{ textAlign: "right" }}>Verified</span>
                  <span style={{ textAlign: "right" }}>Rate</span>
                </div>
                {loading ? <LoadingSpinner /> : topCities.map((city, i) => {
                  const rate = city.total > 0 ? Math.round((city.verified / city.total) * 100) : 0;
                  return (
                    <div key={i} style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderBottom: i !== topCities.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "14px", color: C.textHeading, fontWeight: 600 }}>{city.name}</span>
                        <span style={{ fontSize: "11px", color: C.textHint }}>{city.province}</span>
                      </div>
                      <span style={{ fontSize: "14px", color: C.textMuted, textAlign: "right" }}>{city.total}</span>
                      <span style={{ fontSize: "14px", color: C.textMuted, textAlign: "right" }}>{city.verified}</span>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: rate >= 50 ? C.successBg : C.alertBg, color: rate >= 50 ? C.successText : C.alertText }}>
                          {rate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* ── Groups + Campaigns Tables ── */}
            <motion.div variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
              {/* Groups Table */}
              <motion.div variants={itemVars} className="clean-card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "24px", borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Users size={20} color={C.red} strokeWidth={2} /> Groups
                  </h3>
                </div>
                <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr", background: C.inputBg, fontSize: "12px", textTransform: "uppercase", color: C.textHint, fontWeight: 600 }}>
                  <span>Group Name</span>
                  <span style={{ textAlign: "right" }}>Members</span>
                  <span style={{ textAlign: "right" }}>Status</span>
                </div>
                {loading ? <LoadingSpinner /> : groups.map((grp, i) => (
                  <div key={i} style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr", borderBottom: i !== groups.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", color: C.textHeading, fontWeight: 600 }}>{grp.name}</span>
                    <span style={{ fontSize: "14px", color: C.textMuted, textAlign: "right" }}>{grp.total}</span>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: grp.isActive ? C.successBg : C.alertBg, color: grp.isActive ? C.successText : C.alertText }}>
                        {grp.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Campaigns Table */}
              <motion.div variants={itemVars} className="clean-card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "24px", borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Activity size={20} color={C.red} strokeWidth={2} /> Campaigns
                  </h3>
                </div>
                <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: C.inputBg, fontSize: "12px", textTransform: "uppercase", color: C.textHint, fontWeight: 600 }}>
                  <span>Campaign</span>
                  <span style={{ textAlign: "right" }}>Total</span>
                  <span style={{ textAlign: "right" }}>Verified</span>
                  <span style={{ textAlign: "right" }}>Status</span>
                </div>
                {loading ? <LoadingSpinner /> : campaigns.map((camp, i) => (
                  <div key={i} style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderBottom: i !== campaigns.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", color: C.textHeading, fontWeight: 600 }}>{camp.name}</span>
                    <span style={{ fontSize: "14px", color: C.textMuted, textAlign: "right" }}>{camp.total}</span>
                    <span style={{ fontSize: "14px", color: C.textMuted, textAlign: "right" }}>{camp.verified}</span>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: camp.isActive ? C.successBg : C.alertBg, color: camp.isActive ? C.successText : C.alertText }}>
                        {camp.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── Verification Breakdown ── */}
            <motion.div variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "40px" }}>
              <motion.div variants={itemVars} className="clean-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldAlert size={20} color={C.red} strokeWidth={2} /> Verification Status Breakdown
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                  <MetricCard value={loading ? "—" : totalVerified.toLocaleString()} label="Verified" sub="Ready for placement" color={C.successText} />
                  <MetricCard value={loading ? "—" : totalUnverified.toLocaleString()} label="Unverified" sub="Pending review" color="#F59E0B" />
                  <MetricCard value={loading ? "—" : totalCandidates.toLocaleString()} label="Total" sub="All registrations" color="#3B82F6" />
                  <MetricCard value={loading ? "—" : `${verifiedRate}%`} label="Rate" sub="Overall verification" color={C.successText} />
                </div>
              </motion.div>

              <motion.div variants={itemVars} className="clean-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: C.textHeading, marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileWarning size={20} color={C.red} strokeWidth={2} /> Unverified by Province
                </h3>
                {loading ? <LoadingSpinner /> : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                    {provinces.map((prov, i) => (
                      <MetricCard
                        key={i}
                        value={prov.unverified.toLocaleString()}
                        label={prov.name}
                        sub={`${prov.total} total`}
                        color={prov.unverified > 200 ? C.alertText : "#F59E0B"}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>

          </main>
        </div>
      </div>
    </>
  );
}


