import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dataStore } from "../services/store";
import "./DashboardPage.css";

// ── SVG PIE / DONUT CHART HELPER FUNCTIONS ──
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeDonutArc(x, y, radius, innerRadius, startAngle, endAngle) {
  const angleDiff = endAngle - startAngle;
  const isFull = angleDiff >= 359.99;
  const safeEnd = isFull ? startAngle + 359.99 : endAngle;

  const start = polarToCartesian(x, y, radius, safeEnd);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = safeEnd - startAngle <= 180 ? "0" : "1";

  const innerStart = polarToCartesian(x, y, innerRadius, startAngle);
  const innerEnd = polarToCartesian(x, y, innerRadius, safeEnd);

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", innerStart.x, innerStart.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerEnd.x, innerEnd.y,
    "Z",
  ].join(" ");
}

// ── REUSABLE INTERACTIVE SVG PIE / DONUT CHART ──
function SvgPieChart({ data = [], centerLabel = "", centerValue = "", size = 220 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = data.reduce((acc, d) => acc + (d.value || 0), 0);
  if (total === 0) {
    return (
      <div className="svg-chart-empty">
        <span style={{ fontSize: "2rem" }}>📊</span>
        <p>No data available for chart</p>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size * 0.42;
  const innerRadius = size * 0.25;

  let cumulativeAngle = 0;
  const slices = data.map((d, idx) => {
    const sliceAngle = (d.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    const pathD = describeDonutArc(cx, cy, hoveredIdx === idx ? outerRadius + 4 : outerRadius, innerRadius, startAngle, endAngle);
    const percentage = Math.round((d.value / total) * 100);

    return {
      ...d,
      idx,
      startAngle,
      endAngle,
      pathD,
      percentage,
    };
  });

  return (
    <div className="svg-donut-wrapper">
      <div className="svg-donut-container" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="svg-donut-graphic">
          <g>
            {slices.map((slice) => (
              <path
                key={slice.idx}
                d={slice.pathD}
                fill={slice.color}
                className="svg-donut-slice"
                style={{
                  opacity: hoveredIdx !== null && hoveredIdx !== slice.idx ? 0.6 : 1,
                  filter: hoveredIdx === slice.idx ? "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </g>
        </svg>

        {/* Center Donut Label */}
        <div className="svg-donut-center-text">
          <strong className="svg-donut-center-val">
            {hoveredIdx !== null ? `${slices[hoveredIdx].percentage}%` : centerValue}
          </strong>
          <span className="svg-donut-center-lbl">
            {hoveredIdx !== null ? slices[hoveredIdx].label : centerLabel}
          </span>
        </div>
      </div>

      {/* Legend with interactive highlight */}
      <div className="svg-pie-legend">
        {slices.map((slice) => (
          <div
            key={slice.idx}
            className={`svg-pie-legend-item ${hoveredIdx === slice.idx ? "active" : ""}`}
            onMouseEnter={() => setHoveredIdx(slice.idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span className="svg-legend-bullet" style={{ background: slice.color }} />
            <div className="svg-legend-text">
              <div className="svg-legend-row">
                <span className="svg-legend-label">{slice.label}</span>
                <strong className="svg-legend-pct">{slice.percentage}%</strong>
              </div>
              <span className="svg-legend-sub">{slice.formattedValue || slice.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── REUSABLE INTERACTIVE SVG VERTICAL BAR GRAPH ──
function SvgBarGraph({ data = [], height = 180, metricUnit = "kL" }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="svg-chart-empty">
        <span style={{ fontSize: "2rem" }}>📊</span>
        <p>No comparison data recorded yet</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const chartWidth = 480;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  const slotWidth = innerWidth / data.length;
  const barWidth = Math.max(20, Math.min(48, slotWidth * 0.55));

  return (
    <div className="svg-bar-graph-wrapper">
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="svg-bar-graphic" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="barGradBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="barGradGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="barGradAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = paddingTop + innerHeight * (1 - ratio);
          const val = maxVal * ratio;
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={paddingLeft + innerWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={ratio === 0 ? "0" : "3,3"}
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill="#94a3b8"
                fontWeight="600"
              >
                {metricUnit === "₹" ? `₹${Math.round(val)}` : `${val.toFixed(1)}`}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, index) => {
          const barHeight = Math.max(6, (d.value / maxVal) * innerHeight);
          const x = paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
          const y = paddingTop + innerHeight - barHeight;
          const isHovered = hoveredIdx === index;

          let fill = d.gradient || "url(#barGradBlue)";
          if (index % 3 === 1) fill = "url(#barGradGreen)";
          if (index % 3 === 2) fill = "url(#barGradAmber)";

          return (
            <g
              key={index}
              className="svg-bar-col"
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Hover highlight column */}
              <rect
                x={paddingLeft + index * slotWidth}
                y={paddingTop}
                width={slotWidth}
                height={innerHeight}
                fill={isHovered ? "rgba(2, 132, 199, 0.06)" : "transparent"}
                rx="4"
              />

              {/* Bar rectangle */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={fill}
                rx="5"
                style={{
                  filter: isHovered ? "drop-shadow(0 4px 6px rgba(0,0,0,0.18))" : "none",
                  transition: "all 0.2s ease",
                }}
              />

              {/* Value on top */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                fill={isHovered ? "#0284c7" : "#334155"}
              >
                {metricUnit === "₹" ? `₹${d.value.toLocaleString()}` : `${d.value.toFixed(1)} ${metricUnit}`}
              </text>

              {/* X label */}
              <text
                x={x + barWidth / 2}
                y={paddingTop + innerHeight + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight={isHovered ? "800" : "600"}
                fill={isHovered ? "#0284c7" : "#64748b"}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && (
        <div className="svg-bar-tooltip-pill">
          <strong>{data[hoveredIdx].label}</strong>: {metricUnit === "₹" ? `₹${data[hoveredIdx].value.toLocaleString()}` : `${data[hoveredIdx].value.toFixed(2)} ${metricUnit}`}
          {data[hoveredIdx].sub && ` • ${data[hoveredIdx].sub}`}
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [readings, setReadings] = useState([]);
  const [bills, setBills] = useState([]);
  const [leaks, setLeaks] = useState([]);
  const [bulkPurchases, setBulkPurchases] = useState([]);
  const [blockMetric, setBlockMetric] = useState("volume"); // 'volume' or 'revenue'

  useEffect(() => {
    setHouseholds(dataStore.getHouseholds());
    setReadings(dataStore.getReadings());
    setBills(dataStore.getBills());
    setLeaks(dataStore.getLeaks());
    setBulkPurchases(dataStore.getBulkPurchases());
  }, []);

  const totalInvoiced = bills.reduce((acc, b) => acc + (b.rawAmount || 0), 0);
  const totalCollected = bills.filter((b) => b.status === "Paid").reduce((acc, b) => acc + (b.rawAmount || 0), 0);
  const totalPending = totalInvoiced - totalCollected;
  const paidCount = bills.filter((b) => b.status === "Paid").length;
  const unpaidCount = bills.filter((b) => b.status === "Unpaid").length;
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
  const activeLeaksCount = leaks.filter((l) => l.status === "Active").length;
  const totalTankersVolume = bulkPurchases.reduce((acc, p) => acc + (Number(p.quantity || p.capacityKL) || 0), 0);
  const totalBilledWaterKL = bills.reduce((acc, b) => acc + (Number(b.consumptionKL) || 0), 0);

  // 1. Pie Chart 1 Data: Paid vs Unpaid Invoices
  const billingPieData = [
    {
      label: "Settled / Paid",
      value: totalCollected > 0 ? totalCollected : (bills.length > 0 ? 1 : 0),
      formattedValue: `₹${totalCollected.toLocaleString()} (${paidCount} bills)`,
      color: "#10b981", // Green
    },
    {
      label: "Pending / Due",
      value: totalPending > 0 ? totalPending : (unpaidCount > 0 ? 1 : 0),
      formattedValue: `₹${totalPending.toLocaleString()} (${unpaidCount} bills)`,
      color: "#f59e0b", // Amber
    },
  ];

  // 2. Pie Chart 2 Data: Water Supply Inflow & Allocation Sources
  const waterSupplyPieData = [
    {
      label: "Metered Household Use",
      value: totalBilledWaterKL > 0 ? Number(totalBilledWaterKL.toFixed(1)) : 12,
      formattedValue: `${totalBilledWaterKL.toFixed(1)} kL (${(totalBilledWaterKL * 1000).toLocaleString()} L)`,
      color: "#0284c7", // Sky Blue
    },
    {
      label: "Bulk Tanker Supply",
      value: totalTankersVolume > 0 ? Number(totalTankersVolume.toFixed(1)) : 5,
      formattedValue: `${totalTankersVolume} kL (${bulkPurchases.length} Shipments)`,
      color: "#06b6d4", // Cyan
    },
    {
      label: "Common Area & Losses",
      value: Math.max(1, Number((totalBilledWaterKL * 0.12).toFixed(1))),
      formattedValue: `${(totalBilledWaterKL * 0.12).toFixed(1)} kL (Auxiliary / Loss)`,
      color: "#8b5cf6", // Purple
    },
  ];

  // 3. Bar Graph 1 Data: Block-wise Usage & Revenue
  const blockMap = {};
  households.forEach((h) => {
    const blockName = h.block || "Block A";
    if (!blockMap[blockName]) {
      blockMap[blockName] = { name: blockName, totalKL: 0, totalAmount: 0, unitCount: 0 };
    }
    blockMap[blockName].unitCount += 1;
  });

  bills.forEach((b) => {
    const h = households.find((item) => item.unitNumber === b.unitNumber);
    const blockName = h ? h.block || "Block A" : "Block A";
    if (!blockMap[blockName]) {
      blockMap[blockName] = { name: blockName, totalKL: 0, totalAmount: 0, unitCount: 1 };
    }
    blockMap[blockName].totalKL += Number(b.consumptionKL) || 0;
    blockMap[blockName].totalAmount += Number(b.rawAmount) || 0;
  });

  const blockGraphData = Object.values(blockMap).map((b) => ({
    label: b.name,
    value: blockMetric === "volume" ? Number(b.totalKL.toFixed(1)) : Math.round(b.totalAmount),
    sub: `${b.unitCount} registered flats`,
  }));

  // 4. Bar Graph 2 Data: Top Consuming Households
  const householdUsageMap = {};
  bills.forEach((b) => {
    const unit = b.unitNumber || "Unknown";
    if (!householdUsageMap[unit]) {
      householdUsageMap[unit] = {
        unitNumber: unit,
        residentName: b.residentName || "Resident",
        totalKL: 0,
        totalAmount: 0,
      };
    }
    householdUsageMap[unit].totalKL += Number(b.consumptionKL) || 0;
    householdUsageMap[unit].totalAmount += Number(b.rawAmount) || 0;
  });

  const topConsumers = Object.values(householdUsageMap)
    .sort((a, b) => b.totalKL - a.totalKL)
    .slice(0, 5);

  const topConsumersBarData = topConsumers.map((c) => ({
    label: `Unit ${c.unitNumber}`,
    value: Number(c.totalKL.toFixed(1)),
    sub: `${c.residentName} (₹${c.totalAmount.toLocaleString()})`,
  }));

  return (
    <div className="dash" id="dashboard-page">
      {/* Top Welcome Banner in Website Theme */}
      <div className="dash-hero-banner">
        <div className="dash-hero-content">
          <div className="dash-hero-badge">
            <span className="dash-hero-dot"></span>
            <span>Society Utility Control Center</span>
          </div>
          <h1 className="dash-hero-title">
            {user?.apartmentName || "Palm Meadows Society"} Water Command
          </h1>
          <p className="dash-hero-desc">
            Administrator: <strong>{user?.fullName || user?.username || "Admin"}</strong> • Continuous Sub-meter Telemetry & Automated Volumetric Slab Engine
          </p>
        </div>

        <div className="dash-hero-status">
          <div className="dash-live-chip">
            <span className="live-pulse-dot"></span>
            <span>Network Active</span>
          </div>
          <span className="dash-date-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="dash__stats" id="dash-stats">
        <div className="dash__stat-card dash__stat-card--blue">
          <div className="dash__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="dash__stat-body">
            <span className="dash__stat-label">Registered Flats</span>
            <span className="dash__stat-value">{households.length} Units</span>
            <span className="dash__stat-change dash__stat-change--up">
              {households.filter((h) => h.residentName).length} Occupied
            </span>
          </div>
        </div>

        <div className="dash__stat-card dash__stat-card--green">
          <div className="dash__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="dash__stat-body">
            <span className="dash__stat-label">Total Invoiced</span>
            <span className="dash__stat-value">₹{totalInvoiced.toLocaleString()}</span>
            <span className="dash__stat-change dash__stat-change--up">
              ₹{totalCollected.toLocaleString()} Collected
            </span>
          </div>
        </div>

        <div className="dash__stat-card dash__stat-card--amber">
          <div className="dash__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="dash__stat-body">
            <span className="dash__stat-label">Pending Invoices</span>
            <span className="dash__stat-value">{unpaidCount} Bills</span>
            <span className="dash__stat-change dash__stat-change--alert">₹{totalPending.toLocaleString()} Due</span>
          </div>
        </div>

        <div className="dash__stat-card dash__stat-card--teal">
          <div className="dash__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div className="dash__stat-body">
            <span className="dash__stat-label">Billed Water Flow</span>
            <span className="dash__stat-value">{totalBilledWaterKL.toFixed(1)} <small>kL</small></span>
            <span className="dash__stat-change dash__stat-change--down">
              {bills.length} Invoices Issued
            </span>
          </div>
        </div>

        <div className="dash__stat-card dash__stat-card--red">
          <div className="dash__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <div className="dash__stat-body">
            <span className="dash__stat-label">Leak Alerts</span>
            <span className="dash__stat-value">{activeLeaksCount} Active</span>
            <span className="dash__stat-change" style={{ color: activeLeaksCount > 0 ? "var(--red-600)" : "var(--emerald-600)" }}>
              {activeLeaksCount > 0 ? "Action Required" : "All Normal"}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2 PIE CHARTS + 2 BAR GRAPHS COMPREHENSIVE VISUAL GRID
      ══════════════════════════════════════════════════════════ */}
      <div className="dash-visual-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
        
        {/* PIE CHART 1: Billing Recovery & Payment Status */}
        <div className="admin-card dash-chart-card">
          <div className="dash-chart-card-header">
            <div>
              <h2 className="dash-chart-title">🥧 Invoice Settlement & Recovery Status (Pie Chart)</h2>
              <span className="dash-chart-sub">Proportion of collected receivables vs outstanding dues</span>
            </div>
            <Link to="/admin/bills" className="dash-card-link">View Invoices →</Link>
          </div>

          <div style={{ padding: "20px 22px" }}>
            <SvgPieChart
              data={billingPieData}
              centerValue={`${collectionRate}%`}
              centerLabel="Settled Rate"
              size={210}
            />
          </div>
        </div>

        {/* PIE CHART 2: Water Supply Source Distribution */}
        <div className="admin-card dash-chart-card">
          <div className="dash-chart-card-header">
            <div>
              <h2 className="dash-chart-title">🥧 Water Supply & Network Distribution (Pie Chart)</h2>
              <span className="dash-chart-sub">Household metered vs tanker vs auxiliary flow</span>
            </div>
            <Link to="/admin/bulk-purchases" className="dash-card-link">Tanker Logs →</Link>
          </div>

          <div style={{ padding: "20px 22px" }}>
            <SvgPieChart
              data={waterSupplyPieData}
              centerValue={`${totalBilledWaterKL.toFixed(0)} kL`}
              centerLabel="Total Flow"
              size={210}
            />
          </div>
        </div>

        {/* BAR GRAPH 1: Block-wise Water Consumption */}
        <div className="admin-card dash-chart-card">
          <div className="dash-chart-card-header">
            <div>
              <h2 className="dash-chart-title">📊 Block-wise Consumption (Bar Graph)</h2>
              <span className="dash-chart-sub">Volumetric usage comparison across residential blocks</span>
            </div>
            <div className="dash-chart-toggle">
              <button
                className={`dash-toggle-btn ${blockMetric === "volume" ? "active" : ""}`}
                onClick={() => setBlockMetric("volume")}
              >
                Volume (kL)
              </button>
              <button
                className={`dash-toggle-btn ${blockMetric === "revenue" ? "active" : ""}`}
                onClick={() => setBlockMetric("revenue")}
              >
                Revenue (₹)
              </button>
            </div>
          </div>

          <div style={{ padding: "18px 20px" }}>
            <SvgBarGraph
              data={blockGraphData}
              height={200}
              metricUnit={blockMetric === "volume" ? "kL" : "₹"}
            />
          </div>
        </div>

        {/* BAR GRAPH 2: Top Consuming Households Leaderboard */}
        <div className="admin-card dash-chart-card">
          <div className="dash-chart-card-header">
            <div>
              <h2 className="dash-chart-title">📊 Top Consuming Households (Bar Graph)</h2>
              <span className="dash-chart-sub">Ranked water consumption among highest utilizing units</span>
            </div>
            <Link to="/admin/households" className="dash-card-link">Household List →</Link>
          </div>

          <div style={{ padding: "18px 20px" }}>
            <SvgBarGraph
              data={topConsumersBarData}
              height={200}
              metricUnit="kL"
            />
          </div>
        </div>
      </div>

      {/* Quick Access System Actions */}
      <div className="admin-card dash-quick-card">
        <div className="dash-quick-header">
          <h2>Society Management Actions</h2>
          <p>Quick shortcuts for routine water metering and resident billing operations</p>
        </div>
        <div className="dash-quick-grid">
          <Link to="/admin/households" className="dash-quick-btn" id="quick-households">
            <div className="dash-quick-icon blue">🏢</div>
            <div className="dash-quick-label">
              <strong>Household Directory</strong>
              <span>Add flats, map meters & residents</span>
            </div>
          </Link>

          <Link to="/admin/readings" className="dash-quick-btn" id="quick-readings">
            <div className="dash-quick-icon emerald">⚡</div>
            <div className="dash-quick-label">
              <strong>Log Meter Readings</strong>
              <span>Enter monthly readings or CSV</span>
            </div>
          </Link>

          <Link to="/admin/bills" className="dash-quick-btn" id="quick-bills">
            <div className="dash-quick-icon purple">💳</div>
            <div className="dash-quick-label">
              <strong>Issue Monthly Invoices</strong>
              <span>Generate 100% verified slab bills</span>
            </div>
          </Link>

          <Link to="/admin/bulk-purchases" className="dash-quick-btn" id="quick-bulk-purchases">
            <div className="dash-quick-icon teal">🚚</div>
            <div className="dash-quick-label">
              <strong>Bulk Water Purchases</strong>
              <span>Record tankers & allocate to flats</span>
            </div>
          </Link>

          <Link to="/admin/leakage" className="dash-quick-btn" id="quick-leakage">
            <div className="dash-quick-icon red">🚨</div>
            <div className="dash-quick-label">
              <strong>Leakage Incidents</strong>
              <span>Anomaly monitoring & repair log</span>
            </div>
          </Link>

          <Link to="/admin/plans" className="dash-quick-btn" id="quick-plans">
            <div className="dash-quick-icon amber">⚙️</div>
            <div className="dash-quick-label">
              <strong>Pricing & Slabs</strong>
              <span>Configure volumetric tariff slabs</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Directory & Recent Bulk Purchases */}
      <div className="dash-split-grid">
        {/* Left Column: Recent Households */}
        <div className="admin-card">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">Registered Household Directory</h2>
              <span className="dash-card-sub">Recent units in society</span>
            </div>
            <Link to="/admin/households" className="dash-card-link">
              View All ({households.length}) →
            </Link>
          </div>

          {households.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-state-icon">🏢</div>
              <h3>No Flats Added Yet</h3>
              <p>Add your first apartment units in Household Directory.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Unit #</th>
                  <th>Block</th>
                  <th>Meter Serial</th>
                  <th>Resident</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {households.slice(0, 5).map((h) => (
                  <tr key={h.id}>
                    <td><strong>{h.unitNumber}</strong></td>
                    <td>{h.block}</td>
                    <td><code>{h.meterSerialNumber}</code></td>
                    <td>{h.residentName || <span className="text-muted">Unassigned</span>}</td>
                    <td>
                      <span className={`badge badge--${h.residentName ? "success" : "warning"}`}>
                        {h.residentName ? "Occupied" : "Vacant"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column: Recent Bulk Water Tanker Orders */}
        <div className="admin-card">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">External Tanker Supplies</h2>
              <span className="dash-card-sub">Procured bulk water shipments</span>
            </div>
            <Link to="/admin/bulk-purchases" className="dash-card-link">
              Manage Tankers →
            </Link>
          </div>

          {bulkPurchases.length === 0 ? (
            <div className="empty-state-card" style={{ padding: "2rem" }}>
              <div className="empty-state-icon">🚚</div>
              <h3>No External Purchases</h3>
              <p>Record water tanker procurement when auxiliary supply is needed.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Volume</th>
                  <th>Total Cost</th>
                  <th>Allocated</th>
                </tr>
              </thead>
              <tbody>
                {bulkPurchases.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.vendorName}</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--gray-400)" }}>{p.purchaseDate}</div>
                    </td>
                    <td>
                      <span className="badge badge--info">{p.capacityKL} kL</span>
                    </td>
                    <td>
                      <strong>₹{Number(p.totalCost).toLocaleString()}</strong>
                    </td>
                    <td>
                      <strong style={{ color: "var(--blue-600)" }}>₹{p.costPerUnit}</strong> / flat
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
