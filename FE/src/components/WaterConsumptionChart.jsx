import React, { useState } from "react";
import "./WaterConsumptionChart.css";

/**
 * Interactive Water Consumption Chart Component
 * Renders SVG Bar & Trend chart with consumption threshold and hover tooltips.
 */
export function WaterConsumptionChart({
  data = [],
  title = "Water Consumption History",
  subtitle = "Monthly usage trends across billing cycles",
  targetThreshold = 15000, // 15 kL
  showLegend = true,
  unit = "liters", // "liters" or "kL"
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(unit);

  if (!data || data.length === 0) {
    return (
      <div className="water-chart-empty">
        <div className="water-chart-empty-icon">📊</div>
        <p>No consumption data points available for charting.</p>
      </div>
    );
  }

  // Normalize data
  const normalizedData = data.map((item, index) => {
    const rawLiters = item.litersRaw || item.consumptionLiters || (item.consumptionKL ? item.consumptionKL * 1000 : 0) || 12000;
    const kL = rawLiters / 1000;
    const label = item.period || item.date || item.month || `Period ${index + 1}`;
    const amount = item.amount || (item.rawAmount ? `₹${item.rawAmount.toFixed(2)}` : null);

    // Determine tier color
    let tierColor = "#0284c7"; // Blue
    let tierName = "Tier 2: Normal";
    if (kL <= 10) {
      tierColor = "#10b981"; // Green
      tierName = "Tier 1: Conservation";
    } else if (kL > 25) {
      tierColor = "#ef4444"; // Red / High
      tierName = "Tier 3: High Usage";
    } else {
      tierColor = "#0284c7"; // Tier 2
      tierName = "Tier 2: Moderate";
    }

    return {
      id: item.id || index,
      label,
      rawLiters,
      kL: Number(kL.toFixed(2)),
      amount,
      tierColor,
      tierName,
      status: item.status || "Recorded",
      unitNumber: item.unitNumber,
    };
  });

  const maxVal = Math.max(...normalizedData.map((d) => (selectedUnit === "liters" ? d.rawLiters : d.kL)), selectedUnit === "liters" ? targetThreshold * 1.2 : (targetThreshold / 1000) * 1.2, 1);
  const chartHeight = 180;
  const chartWidth = 520;
  const paddingLeft = 45;
  const paddingBottom = 35;
  const paddingTop = 20;
  const paddingRight = 20;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const barWidth = Math.max(16, Math.min(42, (innerWidth / normalizedData.length) * 0.55));
  const slotWidth = innerWidth / normalizedData.length;

  const thresholdY = paddingTop + innerHeight - (targetThreshold / (selectedUnit === "liters" ? maxVal : maxVal * 1000)) * innerHeight;

  return (
    <div className="water-consumption-chart-card">
      <div className="water-chart-header">
        <div>
          <h3 className="water-chart-title">{title}</h3>
          <p className="water-chart-subtitle">{subtitle}</p>
        </div>
        <div className="water-chart-controls">
          <div className="unit-toggle-group">
            <button
              className={`unit-toggle-btn ${selectedUnit === "liters" ? "active" : ""}`}
              onClick={() => setSelectedUnit("liters")}
            >
              Liters (L)
            </button>
            <button
              className={`unit-toggle-btn ${selectedUnit === "kL" ? "active" : ""}`}
              onClick={() => setSelectedUnit("kL")}
            >
              kL (1,000 L)
            </button>
          </div>
        </div>
      </div>

      <div className="water-chart-svg-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="water-chart-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="tier1Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="tier2Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="tier3Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <pattern id="gridPattern" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={innerWidth}
            height={innerHeight}
            fill="#f8fafc"
            rx="6"
          />

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
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
                  fontWeight="500"
                >
                  {selectedUnit === "liters"
                    ? `${Math.round(val / 1000)}k`
                    : `${val.toFixed(1)}`}
                </text>
              </g>
            );
          })}

          {/* Target Conservation Threshold Line */}
          {targetThreshold && thresholdY >= paddingTop && thresholdY <= paddingTop + innerHeight && (
            <g className="chart-threshold-line">
              <line
                x1={paddingLeft}
                y1={thresholdY}
                x2={paddingLeft + innerWidth}
                y2={thresholdY}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x={paddingLeft + innerWidth - 6}
                y={thresholdY - 4}
                textAnchor="end"
                fontSize="8"
                fill="#d97706"
                fontWeight="700"
              >
                Avg Limit ({selectedUnit === "liters" ? `${targetThreshold.toLocaleString()} L` : `${targetThreshold / 1000} kL`})
              </text>
            </g>
          )}

          {/* Bars */}
          {normalizedData.map((d, index) => {
            const val = selectedUnit === "liters" ? d.rawLiters : d.kL;
            const barHeight = Math.max(4, (val / maxVal) * innerHeight);
            const x = paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
            const y = paddingTop + innerHeight - barHeight;

            let fillGrad = "url(#tier2Grad)";
            if (d.kL <= 10) fillGrad = "url(#tier1Grad)";
            else if (d.kL > 25) fillGrad = "url(#tier3Grad)";

            const isHovered = hoveredItem && hoveredItem.id === d.id;

            return (
              <g
                key={d.id}
                className="chart-bar-group"
                onMouseEnter={() => setHoveredItem(d)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Background hover column */}
                <rect
                  x={paddingLeft + index * slotWidth}
                  y={paddingTop}
                  width={slotWidth}
                  height={innerHeight}
                  fill={isHovered ? "rgba(2, 132, 199, 0.08)" : "transparent"}
                  rx="4"
                />

                {/* Main Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={fillGrad}
                  rx="4"
                  className="chart-bar-rect"
                  style={{
                    filter: isHovered ? "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" : "none",
                    transformOrigin: `${x + barWidth / 2}px ${paddingTop + innerHeight}px`,
                  }}
                />

                {/* Value on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill={isHovered ? "#0f172a" : "#475569"}
                >
                  {selectedUnit === "liters"
                    ? `${(d.rawLiters / 1000).toFixed(1)}k`
                    : `${d.kL}`}
                </text>

                {/* X-axis Label */}
                <text
                  x={x + barWidth / 2}
                  y={paddingTop + innerHeight + 16}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight={isHovered ? "700" : "500"}
                  fill={isHovered ? "#0284c7" : "#64748b"}
                >
                  {d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredItem && (
          <div className="water-chart-tooltip">
            <div className="tooltip-header">
              <span className="tooltip-period">{hoveredItem.label}</span>
              <span
                className="tooltip-badge"
                style={{
                  background: hoveredItem.kL <= 10 ? "#ecfdf5" : hoveredItem.kL > 25 ? "#fef2f2" : "#f0f9ff",
                  color: hoveredItem.kL <= 10 ? "#059669" : hoveredItem.kL > 25 ? "#dc2626" : "#0284c7",
                }}
              >
                {hoveredItem.tierName}
              </span>
            </div>
            <div className="tooltip-body">
              <div className="tooltip-row">
                <span>Consumed:</span>
                <strong>{hoveredItem.rawLiters.toLocaleString()} Liters ({hoveredItem.kL} kL)</strong>
              </div>
              {hoveredItem.amount && (
                <div className="tooltip-row">
                  <span>Invoiced Bill:</span>
                  <strong style={{ color: "#0284c7" }}>{hoveredItem.amount}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Summary Info */}
      {showLegend && (
        <div className="water-chart-legend">
          <div className="legend-item">
            <span className="legend-dot legend-dot--tier1" />
            <span>Tier 1: 0-10 kL (Base)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-dot--tier2" />
            <span>Tier 2: 10-25 kL (Moderate)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot legend-dot--tier3" />
            <span>Tier 3: &gt;25 kL (High)</span>
          </div>
          <div className="legend-item">
            <span className="legend-line--threshold" />
            <span>Target Benchmark</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Slab Tier Utilization Visualizer / Gauge
 * Displays how water consumption is distributed across slabs and proximity to higher rate tiers.
 */
export function SlabTierVisualizer({
  consumptionKL = 14.2,
  plan = null,
}) {
  const defaultSlabs = [
    { fromKL: 0, toKL: 10, ratePerKL: 18, label: "Tier 1: 0 - 10 kL" },
    { fromKL: 10, toKL: 25, ratePerKL: 28, label: "Tier 2: 10 - 25 kL" },
    { fromKL: 25, toKL: null, ratePerKL: 45, label: "Tier 3: Above 25 kL" },
  ];

  const slabs = (plan && plan.slabs && plan.slabs.length > 0) ? plan.slabs : defaultSlabs;
  const totalKL = Number(consumptionKL) || 0;

  // Calculate allocation per slab
  const allocations = slabs.map((s, index) => {
    const from = Number(s.fromKL) || 0;
    const to = s.toKL !== null && s.toKL !== undefined ? Number(s.toKL) : 40;
    const capacity = to - from;

    let consumedInTier = 0;
    if (totalKL > from) {
      consumedInTier = Math.min(totalKL, to) - from;
    }

    const percentage = capacity > 0 ? Math.min(100, Math.round((consumedInTier / capacity) * 100)) : 0;
    const isCurrentActive = totalKL > from && (s.toKL === null || totalKL <= to);

    return {
      index: index + 1,
      label: s.label || (s.toKL ? `${from} - ${s.toKL} kL` : `>${from} kL`),
      rate: s.ratePerKL,
      from,
      to: s.toKL,
      capacity,
      consumedInTier: Number(consumedInTier.toFixed(2)),
      percentage,
      isCurrentActive,
      cost: Math.round(consumedInTier * s.ratePerKL * 100) / 100,
    };
  });

  return (
    <div className="slab-visualizer-card">
      <div className="slab-visualizer-header">
        <div>
          <h4 className="slab-visualizer-title">⚡ Live Tariff Slab Gauge</h4>
          <p className="slab-visualizer-subtitle">
            Current Usage: <strong>{totalKL.toFixed(2)} kL</strong> ({(totalKL * 1000).toLocaleString()} L)
          </p>
        </div>
        <span className="slab-visualizer-active-tag">
          {allocations.find((a) => a.isCurrentActive)?.label || "Active Tier"}
        </span>
      </div>

      {/* Segmented Tier Progress Bar */}
      <div className="slab-gauge-container">
        <div className="slab-gauge-segments">
          {allocations.map((a, idx) => (
            <div
              key={idx}
              className={`slab-gauge-segment slab-gauge-segment--tier${idx + 1} ${a.isCurrentActive ? "active" : ""}`}
              style={{ flex: Math.max(1, a.capacity) }}
            >
              <div
                className="slab-gauge-fill"
                style={{ width: `${a.percentage}%` }}
              />
              <span className="slab-gauge-label">
                T{a.index} ({a.from}{a.to ? `-${a.to}` : "+"} kL)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Itemized Slab Breakdown Pills */}
      <div className="slab-pills-grid">
        {allocations.map((a, idx) => (
          <div
            key={idx}
            className={`slab-pill ${a.isCurrentActive ? "slab-pill--active" : ""}`}
          >
            <div className="slab-pill-top">
              <span className="slab-pill-title">{a.label}</span>
              <span className="slab-pill-rate">₹{a.rate}/kL</span>
            </div>
            <div className="slab-pill-bottom">
              <span className="slab-pill-vol">
                {a.consumedInTier.toFixed(2)} kL consumed
              </span>
              <strong className="slab-pill-cost">₹{a.cost.toFixed(2)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WaterConsumptionChart;
