import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dataStore } from "../services/store";
import { openRazorpayCheckout } from "../services/razorpayService";
import Pagination from "../components/Pagination";
import InvoiceModal from "../components/InvoiceModal";
import { WaterConsumptionChart, SlabTierVisualizer } from "../components/WaterConsumptionChart";
import "./ResidentDashboardPage.css";

function ResidentDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [razorpayPaymentDetails, setRazorpayPaymentDetails] = useState(null);
  const [selectedPayMode, setSelectedPayMode] = useState("upi"); // 'upi' or 'card' only
  const [upiType, setUpiType] = useState("qr"); // 'qr' or 'vpa'
  const [vpaInput, setVpaInput] = useState("resident@okaxis");
  const [cardNumber, setCardNumber] = useState("4532 8901 2345 6789");
  const [cardExpiry, setCardExpiry] = useState("08/28");
  const [cardCvv, setCardCvv] = useState("782");
  const [cardName, setCardName] = useState(user?.fullName || "Resident User");
  const [activeBillToPay, setActiveBillToPay] = useState(null);
  const [viewingOfficialInvoice, setViewingOfficialInvoice] = useState(null);
  const [tariffPlan, setTariffPlan] = useState(null);

  // Search & Filter for Usage History Tab
  const [readingSearch, setReadingSearch] = useState("");
  const [readingSourceFilter, setReadingSourceFilter] = useState("all");

  const [unitData, setUnitData] = useState({
    unitNumber: user?.householdUnitNumber || "B-402",
    residentName: user?.fullName || "Resident",
    meter: user?.householdMeter || "WM-B402-2026",
    block: user?.householdBlock || "Block B",
  });

  const [bills, setBills] = useState([]);
  const [readings, setReadings] = useState([]);

  // Pagination for readings in Usage tab
  const [readingPage, setReadingPage] = useState(1);
  const [readingPageSize, setReadingPageSize] = useState(10);

  // Pagination for bills in Invoices tab
  const [billPage, setBillPage] = useState(1);
  const [billPageSize, setBillPageSize] = useState(5);

  useEffect(() => {
    if (location.pathname.endsWith("/usage")) {
      setActiveTab("usage");
    } else if (location.pathname.endsWith("/bills")) {
      setActiveTab("bills");
    } else if (location.pathname.endsWith("/reports")) {
      setActiveTab("reports");
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  const loadResidentData = () => {
    const allBills = dataStore.getBills();
    const allReadings = dataStore.getReadings();
    const allHouseholds = dataStore.getHouseholds();
    const plans = dataStore.getTariffPlans();
    const defaultPlan = plans.find((p) => p.isDefault) || plans[0];
    setTariffPlan(defaultPlan);

    const currentUnit = user?.householdUnitNumber || (allHouseholds[0] ? allHouseholds[0].unitNumber : "B-402");
    const currentHousehold = allHouseholds.find((h) => h.unitNumber === currentUnit);

    setUnitData({
      unitNumber: currentUnit,
      residentName: user?.fullName || (currentHousehold ? currentHousehold.residentName : "Resident"),
      meter: currentHousehold ? currentHousehold.meterSerialNumber : `WM-${currentUnit}-2026`,
      block: currentHousehold ? currentHousehold.block : "Block B",
    });

    const myBills = allBills.filter((b) => b.unitNumber === currentUnit);
    const myReadings = allReadings.filter((r) => r.unitNumber === currentUnit);

    setBills(myBills);
    setReadings(myReadings);
  };

  useEffect(() => {
    loadResidentData();
  }, [user]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "overview") navigate("/resident/dashboard");
    else if (tab === "usage") navigate("/resident/usage");
    else if (tab === "bills") navigate("/resident/bills");
    else if (tab === "reports") navigate("/resident/reports");
  };

  const unpaidBill = bills.find((b) => b.status === "Unpaid");
  const latestBill = bills[0];
  const currentConsumptionKL = latestBill
    ? (Number(latestBill.consumptionKL) || 0)
    : (readings.length > 0 ? readings.reduce((acc, r) => acc + (Number(r.consumptionLiters) || 0), 0) / 1000 : 0);
  const totalLiters = readings.length > 0 
    ? readings.reduce((acc, r) => acc + (Number(r.consumptionLiters) || 0), 0)
    : (bills.reduce((acc, b) => acc + (Number(b.litersRaw) || ((Number(b.consumptionKL) || 0) * 1000)), 0));
  const avgDailyLiters = currentConsumptionKL > 0 ? Math.round((currentConsumptionKL * 1000) / 30) : 0;

  const handleOpenPay = (bill) => {
    setActiveBillToPay(bill || unpaidBill);
    setPaymentSuccess(false);
    setRazorpayPaymentDetails(null);
    setIsProcessingRazorpay(false);
    setProcessingStep(0);
    setSelectedPayMode("upi");
    setUpiType("qr");
    setPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!activeBillToPay) return;
    setIsProcessingRazorpay(true);
    setProcessingStep(1);

    const methodStr = selectedPayMode === "card"
      ? `Razorpay Card (•••• ${cardNumber.replace(/\s+/g, "").slice(-4) || "6789"})`
      : `Razorpay UPI (${upiType === "qr" ? "QR Scan" : vpaInput})`;

    // Sequence the Razorpay processing animation stages
    setTimeout(() => {
      setProcessingStep(2);
      setTimeout(() => {
        setProcessingStep(3);
        setTimeout(() => {
          const paymentId = `pay_rzp_${Math.random().toString(36).substring(2, 8).toUpperCase()}${Date.now().toString().slice(-4)}`;
          const orderId = `order_rzp_${Math.random().toString(36).substring(2, 8)}`;
          const finalData = {
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId,
            razorpaySignature: "sig_rzp_256_verified",
            paymentMethod: methodStr,
            amount: activeBillToPay.amount,
            paidAt: new Date().toISOString(),
          };

          dataStore.markBillPaid(activeBillToPay.id, methodStr, finalData);
          setIsProcessingRazorpay(false);
          setProcessingStep(0);
          setRazorpayPaymentDetails(finalData);
          setPaymentSuccess(true);
          loadResidentData();
        }, 850);
      }, 850);
    }, 750);
  };

  // Export readings to CSV
  const handleExportCSV = () => {
    if (readings.length === 0) return;
    const headers = ["Reading Date", "Previous Reading (kL)", "Current Reading (kL)", "Consumption (Liters)", "Source", "Notes"];
    const rows = readings.map((r) => [
      r.date,
      r.previousReading || "—",
      r.meterReading,
      r.consumptionLiters,
      r.source || "IOT_METER",
      `"${r.notes || "Standard"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Water_Usage_Log_${unitData.unitNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered readings for Usage History Tab
  const filteredReadings = readings.filter((r) => {
    if (readingSourceFilter !== "all" && r.source?.toLowerCase() !== readingSourceFilter.toLowerCase()) {
      return false;
    }
    if (readingSearch.trim()) {
      const q = readingSearch.toLowerCase();
      const matchDate = r.date?.toLowerCase().includes(q);
      const matchNotes = r.notes?.toLowerCase().includes(q);
      const matchReading = r.meterReading?.toString().includes(q);
      if (!matchDate && !matchNotes && !matchReading) return false;
    }
    return true;
  });

  // Build chart dataset from resident's historical bills/readings
  const consumptionChartData = (bills.length > 0 ? bills : readings).map((item, idx) => {
    const rawLiters = item.litersRaw || item.consumptionLiters || (item.consumptionKL ? Number(item.consumptionKL) * 1000 : 0);
    const kl = item.consumptionKL !== undefined && item.consumptionKL !== null ? Number(item.consumptionKL) : (item.consumptionLiters ? Number(item.consumptionLiters) / 1000 : 0);
    return {
      id: item.id || idx,
      period: item.period || item.date || `Month ${idx + 1}`,
      litersRaw: rawLiters,
      consumptionKL: kl,
      amount: item.amount || null,
      status: item.status || "Recorded",
    };
  }).reverse();

  // Pagination slices
  const paginatedReadings = filteredReadings.slice((readingPage - 1) * readingPageSize, readingPage * readingPageSize);
  const paginatedBills = bills.slice((billPage - 1) * billPageSize, billPage * billPageSize);

  return (
    <div className="res-dash" id="resident-dashboard-page">
      {/* Header */}
      <div className="res-dash__header">
        <div>
          <div className="res-dash__badge-row">
            <span className="res-dash__community-tag">Palm Meadows Society</span>
            <span className="res-dash__unit-tag">Flat {unitData.unitNumber}</span>
            <span className="res-dash__unit-tag">{unitData.block}</span>
          </div>
          <h1 className="res-dash__title">My Water Dashboard & Invoices</h1>
          <p className="res-dash__subtitle">Welcome, <strong>{unitData.residentName}</strong> • Smart Meter ID: <code>{unitData.meter}</code></p>
        </div>

        <div className="res-dash__header-actions">
          {unpaidBill ? (
            <button className="btn-primary res-dash__quick-pay-btn" onClick={() => handleOpenPay(unpaidBill)} id="quick-pay-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Pay Current Bill ({unpaidBill.amount})
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.5rem 1rem", borderRadius: "8px", color: "#16a34a", fontSize: "0.8125rem", fontWeight: 700 }}>
              <span>✓ All Utility Dues Cleared</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="res-dash__tabs" id="resident-tabs">
        <button
          className={`res-dash__tab ${activeTab === "overview" ? "res-dash__tab--active" : ""}`}
          onClick={() => handleTabClick("overview")}
          id="tab-overview"
        >
          📊 Comprehensive Overview
        </button>
        <button
          className={`res-dash__tab ${activeTab === "usage" ? "res-dash__tab--active" : ""}`}
          onClick={() => handleTabClick("usage")}
          id="tab-usage"
        >
          ⚡ Detailed Usage Reports & Logs ({readings.length})
        </button>
        <button
          className={`res-dash__tab ${activeTab === "bills" ? "res-dash__tab--active" : ""}`}
          onClick={() => handleTabClick("bills")}
          id="tab-bills"
        >
          💳 Invoices & Billing ({bills.length}) {unpaidBill && <span className="res-dash__tab-badge">Due</span>}
        </button>
        <button
          className={`res-dash__tab ${activeTab === "reports" ? "res-dash__tab--active" : ""}`}
          onClick={() => handleTabClick("reports")}
          id="tab-reports"
        >
          📈 Tariff & Insights
        </button>
      </div>

      {/* Top KPI Cards (Always Visible for Quick Orientation) */}
      <div className="res-dash__stats" id="resident-stats">
        <div className="res-dash__stat-card res-dash__stat-card--blue">
          <div className="res-dash__stat-icon">💧</div>
          <div className="res-dash__stat-body">
            <span className="res-dash__stat-label">Current Cycle Usage</span>
            <span className="res-dash__stat-value">{currentConsumptionKL.toFixed(1)} kL</span>
            <span className="res-dash__stat-change res-dash__stat-change--down">
              {(currentConsumptionKL * 1000).toLocaleString()} Liters recorded
            </span>
          </div>
        </div>

        <div className="res-dash__stat-card res-dash__stat-card--amber">
          <div className="res-dash__stat-icon">💳</div>
          <div className="res-dash__stat-body">
            <span className="res-dash__stat-label">Outstanding Dues</span>
            <span className="res-dash__stat-value">{unpaidBill ? unpaidBill.amount : "₹0.00"}</span>
            <span className={`res-dash__stat-change ${unpaidBill ? "res-dash__stat-change--alert" : "res-dash__stat-change--down"}`}>
              {unpaidBill ? `Due: ${unpaidBill.dueDate}` : "All Invoices Settled"}
            </span>
          </div>
        </div>

        <div className="res-dash__stat-card res-dash__stat-card--green">
          <div className="res-dash__stat-icon">⏱️</div>
          <div className="res-dash__stat-body">
            <span className="res-dash__stat-label">Daily Average</span>
            <span className="res-dash__stat-value">{avgDailyLiters} L / day</span>
            <span className="res-dash__stat-change res-dash__stat-change--up">Optimal Efficiency</span>
          </div>
        </div>

        <div className="res-dash__stat-card res-dash__stat-card--purple">
          <div className="res-dash__stat-icon">🏷️</div>
          <div className="res-dash__stat-body">
            <span className="res-dash__stat-label">Active Tariff Plan</span>
            <span className="res-dash__stat-value" style={{ fontSize: "1.05rem" }}>
              {tariffPlan ? tariffPlan.name.slice(0, 22) : "Tiered Plan"}
            </span>
            <span className="res-dash__stat-change res-dash__stat-change--normal">
              {tariffPlan?.type === "TIERED" ? `${tariffPlan.slabs?.length || 3} Slabs (Base ₹${tariffPlan.fixedCharge})` : `₹${tariffPlan?.flatRate || 20}/kL`}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. WHOLE OVERVIEW TAB: COMPLETE AGGREGATION OF ALL DATA
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="overview-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Visual Analytics & Slab Gauge Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
            <WaterConsumptionChart
              data={consumptionChartData}
              title={`Water Usage Trends — Flat ${unitData.unitNumber}`}
              subtitle="6-Month historical consumption and billing progression"
              targetThreshold={15000}
            />
            <SlabTierVisualizer
              consumptionKL={currentConsumptionKL}
              plan={tariffPlan}
            />
          </div>

          {/* Household Conservation Benchmark Visualizer Card */}
          <div className="res-dash__card" style={{ padding: "1.4rem" }}>
            <div className="res-dash__card-header" style={{ marginBottom: "1rem" }}>
              <div>
                <h2 className="res-dash__card-title">🌱 Society Water Conservation & Efficiency Benchmark</h2>
                <p className="res-dash__card-subtitle">Comparing Flat {unitData.unitNumber} against Palm Meadows Society Average</p>
              </div>
              <span className="res-dash__card-badge res-dash__card-badge--green">
                {currentConsumptionKL <= 15 ? "🌟 Eco Champion (18% below avg)" : "⚡ Moderate Consumption"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "center" }}>
              {/* Comparative Progress Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "4px" }}>
                    <span style={{ color: "#0284c7" }}>My Flat ({unitData.unitNumber}):</span>
                    <span>{currentConsumptionKL.toFixed(1)} kL ({(currentConsumptionKL * 1000).toLocaleString()} L)</span>
                  </div>
                  <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "6px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, Math.round((currentConsumptionKL / 25) * 100))}%`,
                        background: currentConsumptionKL <= 10 ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #0284c7, #38bdf8)",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                    <span>Society Average Flat (Palm Meadows):</span>
                    <span>16.5 kL (16,500 L)</span>
                  </div>
                  <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "6px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: "66%",
                        background: "linear-gradient(90deg, #94a3b8, #cbd5e1)",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Efficiency Summary Box */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1rem 1.25rem", borderRadius: "8px", fontSize: "0.8125rem", color: "#166534" }}>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "4px" }}>
                  🏆 Optimal Slab Status: Tier {currentConsumptionKL <= 10 ? "1 (Economical)" : "2 (Standard)"}
                </div>
                <p style={{ margin: 0, lineHeight: 1.45 }}>
                  Your consumption of <strong>{currentConsumptionKL.toFixed(1)} kL</strong> places you comfortably within the economical tier. Maintaining daily average under <strong>500 Liters</strong> avoids penalty tier rates.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Overview Summary Row: Invoices + Meter Readings Snapshots */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {/* Recent Invoices Widget */}
            <div className="res-dash__card">
              <div className="res-dash__card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 className="res-dash__card-title">Recent Invoices & Receipts</h2>
                  <p className="res-dash__card-subtitle">Latest billing cycles for Flat {unitData.unitNumber}</p>
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                  onClick={() => handleTabClick("bills")}
                >
                  View All ({bills.length}) →
                </button>
              </div>

              {bills.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b" }}>No bills issued yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {bills.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem 1rem",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>{b.period}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          <code>{b.invoiceNumber || b.id}</code> • {b.liters}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, color: "#0284c7" }}>{b.amount}</div>
                          <span className={`badge badge--${b.status === "Paid" ? "success" : "warning"}`} style={{ fontSize: "0.7rem" }}>
                            {b.status}
                          </span>
                        </div>
                        <button
                          className="btn-secondary res-dash__btn-sm"
                          onClick={() => setViewingOfficialInvoice(b)}
                          title="Open official itemized invoice"
                        >
                          📄 Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Readings Widget */}
            <div className="res-dash__card">
              <div className="res-dash__card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 className="res-dash__card-title">Live Meter Status & Logs</h2>
                  <p className="res-dash__card-subtitle">IoT Water Meter: <code>{unitData.meter}</code></p>
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                  onClick={() => handleTabClick("usage")}
                >
                  Usage Reports →
                </button>
              </div>

              {readings.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b" }}>No readings logged yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {readings.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem 1rem",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>{r.date}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Cumulative: <strong>{r.meterReading} kL</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#16a34a" }}>
                          {r.consumptionLiters?.toLocaleString()} L
                        </div>
                        <span className="res-dash__unit-tag" style={{ fontSize: "0.7rem" }}>
                          {r.source || "IOT"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. DETAILED USAGE HISTORY TAB: IN-DEPTH USAGE REPORTS & CHARTS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "usage" && (
        <div className="usage-reports-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* In-depth Usage KPI Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div className="readings-kpi" style={{ borderLeft: "4px solid #0284c7" }}>
              <span className="readings-kpi__label">Total Recorded Flow</span>
              <span className="readings-kpi__val">{(totalLiters / 1000).toFixed(2)} kL</span>
              <span className="readings-kpi__sub">{readings.length} Logged Entries</span>
            </div>
            <div className="readings-kpi" style={{ borderLeft: "4px solid #16a34a" }}>
              <span className="readings-kpi__label">Daily Average Consumption</span>
              <span className="readings-kpi__val" style={{ color: "#16a34a" }}>{avgDailyLiters} Liters</span>
              <span className="readings-kpi__sub">18% Below Society Average</span>
            </div>
            <div className="readings-kpi" style={{ borderLeft: "4px solid #d97706" }}>
              <span className="readings-kpi__label">Projected Month-End</span>
              <span className="readings-kpi__val" style={{ color: "#d97706" }}>{(avgDailyLiters * 30 / 1000).toFixed(1)} kL</span>
              <span className="readings-kpi__sub">Tier 2 Moderate Bracket</span>
            </div>
            <div className="readings-kpi" style={{ borderLeft: "4px solid #8b5cf6" }}>
              <span className="readings-kpi__label">Meter Health & Telemetry</span>
              <span className="readings-kpi__val" style={{ color: "#8b5cf6" }}>100% Online</span>
              <span className="readings-kpi__sub">Pulse Signal Active</span>
            </div>
          </div>

          {/* Full Visual Water Consumption Chart */}
          <WaterConsumptionChart
            data={consumptionChartData}
            title={`Detailed Water Consumption Audit — Flat ${unitData.unitNumber}`}
            subtitle="Historical volume tracking across all cycles with conservation threshold"
            targetThreshold={15000}
          />

          {/* Detailed Searchable & Perfectly Aligned Readings Ledger */}
          <div className="res-dash__card res-dash__card--table">
            <div className="res-dash__card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h2 className="res-dash__card-title">Water Meter Reading Log Ledger</h2>
                <p className="res-dash__card-subtitle">Comprehensive audit record of all individual meter readings for Flat {unitData.unitNumber}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {/* Search */}
                <input
                  type="text"
                  placeholder="Filter by date, notes..."
                  value={readingSearch}
                  onChange={(e) => {
                    setReadingSearch(e.target.value);
                    setReadingPage(1);
                  }}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8125rem",
                  }}
                />
                {/* Source Filter */}
                <select
                  value={readingSourceFilter}
                  onChange={(e) => {
                    setReadingSourceFilter(e.target.value);
                    setReadingPage(1);
                  }}
                  style={{
                    padding: "0.4rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8125rem",
                    background: "#ffffff",
                  }}
                >
                  <option value="all">All Sources</option>
                  <option value="IOT_METER">IoT Smart Meter</option>
                  <option value="MANUAL">Manual Verification</option>
                </select>
                {/* Export Button */}
                <button className="btn-secondary res-dash__btn-sm" onClick={handleExportCSV}>
                  📥 Export CSV
                </button>
              </div>
            </div>

            {filteredReadings.length === 0 ? (
              <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>
                No readings match your search or filter.
              </div>
            ) : (
              <>
                <table className="res-dash__table" style={{ width: "100%", tableLayout: "auto" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "12%" }}>Reading Date</th>
                      <th style={{ width: "12%" }}>Previous (kL)</th>
                      <th style={{ width: "12%" }}>Current (kL)</th>
                      <th style={{ width: "22%" }}>Volumetric Flow</th>
                      <th style={{ width: "14%" }}>Slab Tier</th>
                      <th style={{ width: "10%" }}>Source</th>
                      <th style={{ width: "18%" }}>Remarks & Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReadings.map((r) => {
                      const liters = r.consumptionLiters || 0;
                      const kL = (liters / 1000).toFixed(2);
                      const isHigh = liters > 20000;
                      const isLow = liters < 10000;
                      const maxLitersBar = 25000;
                      const barPercent = Math.min(100, Math.round((liters / maxLitersBar) * 100));

                      return (
                        <tr key={r.id}>
                          <td><strong>{r.date}</strong></td>
                          <td className="text-muted">{r.previousReading || "0.00"} kL</td>
                          <td><strong>{r.meterReading} kL</strong></td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                                <strong style={{ color: "#0284c7" }}>{kL} kL</strong>
                                <span style={{ color: "#64748b" }}>{liters.toLocaleString()} L</span>
                              </div>
                              <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden", width: "100%" }}>
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${Math.max(6, barPercent)}%`,
                                    background: isLow ? "#10b981" : isHigh ? "#ef4444" : "#0284c7",
                                    borderRadius: "3px",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge badge--${isLow ? "success" : isHigh ? "error" : "warning"}`}
                              style={{ fontSize: "0.72rem" }}
                            >
                              {isLow ? "Tier 1: Base" : isHigh ? "Tier 3: High" : "Tier 2: Mod"}
                            </span>
                          </td>
                          <td>
                            <span className="res-dash__unit-tag" style={{ fontSize: "0.72rem" }}>
                              {r.source || "IOT"}
                            </span>
                          </td>
                          <td style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                            <div>{r.notes || "Standard reading"}</div>
                            {r.isBilled && (
                              <div style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: 600 }}>
                                ✓ Invoiced ({r.billedInvoiceId || "Bill"})
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <Pagination
                  currentPage={readingPage}
                  totalItems={filteredReadings.length}
                  pageSize={readingPageSize}
                  onPageChange={setReadingPage}
                  onPageSizeChange={setReadingPageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. INVOICES & BILLING TAB: DETAILED BILLS WITH INVOICE VIEWER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "bills" && (
        <div className="res-dash__card res-dash__card--table" style={{ marginBottom: "1.5rem" }}>
          <div className="res-dash__card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 className="res-dash__card-title">My Invoices & Itemized Receipts</h2>
              <p className="res-dash__card-subtitle">Every invoice contains full tariff applied rates, base fees, and payment status</p>
            </div>
            {unpaidBill && (
              <button className="btn-primary res-dash__quick-pay-btn" onClick={() => handleOpenPay(unpaidBill)}>
                ⚡ Pay Outstanding: {unpaidBill.amount}
              </button>
            )}
          </div>

          {bills.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>
              No bills generated for your flat yet. Invoices are issued at each monthly billing cycle.
            </div>
          ) : (
            <>
              <table className="res-dash__table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Billing Period</th>
                    <th>Water Consumed</th>
                    <th>Fixed Base Fee</th>
                    <th>Volumetric Slabs</th>
                    <th>Total Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBills.map((b) => {
                    const proof = b.mathProof || {};
                    return (
                      <tr key={b.id}>
                        <td>
                          <button
                            onClick={() => setViewingOfficialInvoice(b)}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                            title="Click to view verified official invoice"
                          >
                            <code style={{ color: "#0284c7", fontWeight: 700 }}>{b.invoiceNumber || b.id}</code>
                          </button>
                        </td>
                        <td><strong>{b.period}</strong></td>
                        <td>
                          <div><strong>{b.liters}</strong></div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>({b.consumptionKL || "0.00"} kL)</div>
                        </td>
                        <td style={{ color: "#475569", fontSize: "0.8125rem" }}>
                          ₹{(b.fixedCharge !== undefined && b.fixedCharge !== null ? b.fixedCharge : 100).toFixed(2)}
                        </td>
                        <td style={{ color: "#0284c7", fontWeight: 600, fontSize: "0.8125rem" }}>
                          ₹{(proof.volumetricSlabsTotal !== undefined ? proof.volumetricSlabsTotal : ((b.rawAmount || 0) - (b.fixedCharge || 0))).toFixed(2)}
                        </td>
                        <td className="res-dash__table-amount">{b.amount}</td>
                        <td>{b.dueDate}</td>
                        <td>
                          <span className={`res-dash__status-badge res-dash__status-badge--${b.status === "Paid" ? "success" : "due"}`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                            <button
                              className="btn-secondary res-dash__btn-sm"
                              onClick={() => setViewingOfficialInvoice(b)}
                              title="Open verified printable invoice"
                            >
                              📄 View Invoice
                            </button>
                            {b.status === "Unpaid" ? (
                              <button className="btn-primary res-dash__btn-sm" onClick={() => handleOpenPay(b)}>
                                Pay Now
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center" }}>
                                ✓ Settled
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <Pagination
                currentPage={billPage}
                totalItems={bills.length}
                pageSize={billPageSize}
                onPageChange={setBillPage}
                onPageSizeChange={setBillPageSize}
                pageSizeOptions={[5, 10, 20]}
              />
            </>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. TARIFF & CONSERVATION INSIGHTS TAB
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "reports" && (
        <div className="res-dash__row">
          <div className="res-dash__card">
            <div className="res-dash__card-header">
              <h2 className="res-dash__card-title">Active Tariff Slab Schedule</h2>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.84rem", color: "#475569", marginBottom: "1rem" }}>
                Your community uses a progressive tiered water tariff. Using less water keeps you in Tier 1 and saves up to 45% on monthly charges.
              </p>

              {tariffPlan && tariffPlan.slabs?.map((s, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: idx % 2 === 0 ? "#f8fafc" : "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", marginBottom: "0.5rem", fontSize: "0.8125rem" }}>
                  <span>
                    <strong>Tier {idx + 1}:</strong> {s.label || (s.toKL ? `${s.fromKL} - ${s.toKL} kL` : `Above ${s.fromKL} kL`)}
                  </span>
                  <strong style={{ color: "#0284c7" }}>₹{s.ratePerKL} / kL (₹{(s.ratePerKL / 1000).toFixed(3)}/L)</strong>
                </div>
              ))}

              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "0.75rem", borderRadius: "8px", marginTop: "1rem", fontSize: "0.78rem", color: "#0369a1" }}>
                <strong>Base Fixed Fee:</strong> ₹{tariffPlan?.fixedCharge || 100} per month covers pipeline infrastructure & meter maintenance.
              </div>
            </div>
          </div>

          <div className="res-dash__card">
            <div className="res-dash__card-header">
              <h2 className="res-dash__card-title">Household Conservation Tips</h2>
            </div>
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div className="res-dash__eco-tip">
                <div className="res-dash__eco-icon">💡</div>
                <div className="res-dash__eco-content">
                  <strong>Aerators on Faucets</strong>
                  <p>Installing low-flow aerators can save 1,200 L per month without reducing water pressure.</p>
                </div>
              </div>
              <div className="res-dash__eco-tip">
                <div className="res-dash__eco-icon">🚿</div>
                <div className="res-dash__eco-content">
                  <strong>Shower Optimization</strong>
                  <p>Keeping showers under 5 minutes keeps your household firmly within the economical Tier 1 slab.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Verified Invoice Modal */}
      {viewingOfficialInvoice && (
        <InvoiceModal
          bill={viewingOfficialInvoice}
          onClose={() => setViewingOfficialInvoice(null)}
          onMarkPaid={(id) => {
            handleOpenPay(viewingOfficialInvoice);
            setViewingOfficialInvoice(null);
          }}
        />
      )}

      {/* Simple Razorpay Payment Gateway Modal (Only UPI & Card + Razorpay Animations) */}
      {payModalOpen && activeBillToPay && (
        <div className="res-modal__backdrop" id="payment-modal" onClick={() => !isProcessingRazorpay && setPayModalOpen(false)}>
          <div className="res-modal razorpay-gateway-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            
            {/* Razorpay Top Navy Brand Bar */}
            <div className="razorpay-modal__header">
              <div className="razorpay-brand-wrap">
                <div className="razorpay-logo-badge">
                  <span className="rzp-text-bold">Razor</span>
                  <span className="rzp-text-blue">pay</span>
                </div>
                <div className="razorpay-badge-sub">
                  <span>Secured 256-Bit SSL Checkout</span>
                </div>
              </div>
              <button
                type="button"
                className="razorpay-close-btn"
                disabled={isProcessingRazorpay}
                onClick={() => setPayModalOpen(false)}
                title="Cancel Payment"
              >
                ✕
              </button>
            </div>

            {/* Total Amount Pill Header */}
            <div className="razorpay-order-strip">
              <div>
                <span className="razorpay-order-label">TOTAL PAYABLE:</span>
                <h2 className="razorpay-order-amount">{activeBillToPay.amount}</h2>
              </div>
              <div className="razorpay-order-meta">
                <span className="razorpay-inv-pill">Invoice #{activeBillToPay.invoiceNumber || activeBillToPay.id}</span>
                <span className="razorpay-unit-pill">Flat {unitData.unitNumber}</span>
              </div>
            </div>

            {/* ── 1. CLASSIC RAZORPAY PROCESSING ANIMATION VIEW ── */}
            {isProcessingRazorpay ? (
              <div className="razorpay-classic-processing">
                <div className="razorpay-spinner-container">
                  <div className="razorpay-spinner-track"></div>
                  <div className="razorpay-spinner-glow"></div>
                  <div className="razorpay-spinner-center-logo">
                    {/* Official Razorpay Angled Lightning Mark */}
                    <svg viewBox="0 0 100 100" className="razorpay-glyph-svg">
                      <path d="M68 12H38L20 54h20L22 88 80 44H56z" fill="#3395ff" />
                      <path d="M52 12H38L20 54h20L22 88 42 72z" fill="#0c2340" opacity="0.3" />
                    </svg>
                  </div>
                </div>

                <h3 className="razorpay-processing-main-title">Processing Payment</h3>
                <p className="razorpay-processing-sub-text">
                  Authorizing <strong>{activeBillToPay.amount}</strong> with your bank...
                </p>

                <div className="razorpay-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="razorpay-security-footnote">
                  <span className="razorpay-lock-icon">🔒</span>
                  <span>Secured by <strong>Razorpay</strong> · Please do not press Back or Refresh</span>
                </div>
              </div>
            ) : paymentSuccess ? (
              /* ── 2. CLASSIC RAZORPAY SUCCESS ANIMATION VIEW ── */
              <div className="razorpay-classic-success">
                <div className="razorpay-success-badge-container">
                  <div className="razorpay-success-ripple"></div>
                  <div className="razorpay-success-circle">
                    <svg className="razorpay-success-check-svg" viewBox="0 0 52 52">
                      <circle className="razorpay-success-circle-outline" cx="26" cy="26" r="24" fill="none" />
                      <path className="razorpay-success-check-path" fill="none" d="M14.5 27.5l8 8 16-16" />
                    </svg>
                  </div>
                </div>

                <h3 className="razorpay-success-heading">Payment Successful!</h3>
                <div className="razorpay-success-amount-display">
                  {activeBillToPay.amount}
                </div>
                <p className="razorpay-success-paid-to">
                  Paid to <strong>DROP Water Management Platform</strong>
                </p>

                {/* Classic Razorpay Receipt Card */}
                <div className="razorpay-classic-receipt">
                  <div className="razorpay-receipt-line">
                    <span className="rzp-lbl">Razorpay Payment ID</span>
                    <strong className="rzp-val">
                      <code>{razorpayPaymentDetails?.razorpayPaymentId || `pay_rzp_${Date.now()}`}</code>
                    </strong>
                  </div>
                  <div className="razorpay-receipt-line">
                    <span className="rzp-lbl">Order Reference</span>
                    <span className="rzp-val">{razorpayPaymentDetails?.razorpayOrderId || `order_rzp_${Date.now()}`}</span>
                  </div>
                  <div className="razorpay-receipt-line">
                    <span className="rzp-lbl">Payment Mode</span>
                    <span className="rzp-val">{razorpayPaymentDetails?.paymentMethod || "Razorpay Online"}</span>
                  </div>
                  <div className="razorpay-receipt-line">
                    <span className="rzp-lbl">Billing Period</span>
                    <span className="rzp-val">{activeBillToPay.period}</span>
                  </div>
                  <div className="razorpay-receipt-line">
                    <span className="rzp-lbl">Status</span>
                    <span className="rzp-val rzp-val--success">✓ Verified & Settled</span>
                  </div>
                </div>

                <div className="razorpay-success-footer-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setPayModalOpen(false);
                      setViewingOfficialInvoice(dataStore.getBillById(activeBillToPay.id));
                    }}
                  >
                    📄 View Official Receipt
                  </button>
                  <button
                    type="button"
                    className="btn-primary razorpay-pay-btn"
                    onClick={() => setPayModalOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* ── 3. SIMPLE 2-OPTION RAZORPAY GATEWAY (UPI & CARD ONLY) ── */
              <div className="razorpay-modal__body">
                
                {/* 2-Option Tabs */}
                <div className="razorpay-tabs-nav">
                  <button
                    type="button"
                    className={`razorpay-tab-btn ${selectedPayMode === "upi" ? "razorpay-tab-btn--active" : ""}`}
                    onClick={() => setSelectedPayMode("upi")}
                  >
                    <span className="razorpay-tab-icon">⚡</span>
                    <div className="razorpay-tab-text">
                      <strong>UPI / QR Code</strong>
                      <small>GPay, PhonePe, Paytm, BHIM</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`razorpay-tab-btn ${selectedPayMode === "card" ? "razorpay-tab-btn--active" : ""}`}
                    onClick={() => setSelectedPayMode("card")}
                  >
                    <span className="razorpay-tab-icon">💳</span>
                    <div className="razorpay-tab-text">
                      <strong>Debit / Credit Card</strong>
                      <small>Visa, MasterCard, RuPay</small>
                    </div>
                  </button>
                </div>

                {/* OPTION 1: UPI CONTENT */}
                {selectedPayMode === "upi" && (
                  <div className="razorpay-panel razorpay-panel--upi">
                    <div className="razorpay-upi-type-selector">
                      <button
                        type="button"
                        className={`razorpay-upi-subtab ${upiType === "qr" ? "razorpay-upi-subtab--active" : ""}`}
                        onClick={() => setUpiType("qr")}
                      >
                        📱 Scan QR Code
                      </button>
                      <button
                        type="button"
                        className={`razorpay-upi-subtab ${upiType === "vpa" ? "razorpay-upi-subtab--active" : ""}`}
                        onClick={() => setUpiType("vpa")}
                      >
                        ⚡ Enter UPI ID / VPA
                      </button>
                    </div>

                    {upiType === "qr" ? (
                      <div className="razorpay-qr-container">
                        <div className="razorpay-qr-box">
                          {/* Animated Scan Bar on QR Code */}
                          <div className="razorpay-qr-scan-line"></div>
                          <svg className="razorpay-qr-svg" viewBox="0 0 100 100" fill="none">
                            {/* QR Corner Markers */}
                            <rect x="5" y="5" width="26" height="26" rx="4" fill="#0c2340" />
                            <rect x="9" y="9" width="18" height="18" rx="2" fill="#ffffff" />
                            <rect x="13" y="13" width="10" height="10" fill="#2563eb" />

                            <rect x="69" y="5" width="26" height="26" rx="4" fill="#0c2340" />
                            <rect x="73" y="9" width="18" height="18" rx="2" fill="#ffffff" />
                            <rect x="77" y="13" width="10" height="10" fill="#2563eb" />

                            <rect x="5" y="69" width="26" height="26" rx="4" fill="#0c2340" />
                            <rect x="9" y="73" width="18" height="18" rx="2" fill="#ffffff" />
                            <rect x="13" y="77" width="10" height="10" fill="#2563eb" />

                            {/* Center Data Pattern */}
                            <rect x="36" y="8" width="6" height="6" fill="#0c2340" />
                            <rect x="46" y="8" width="8" height="6" fill="#0c2340" />
                            <rect x="36" y="18" width="12" height="6" fill="#0c2340" />
                            <rect x="52" y="18" width="10" height="6" fill="#0c2340" />

                            <rect x="8" y="36" width="6" height="10" fill="#0c2340" />
                            <rect x="18" y="36" width="12" height="6" fill="#0c2340" />
                            <rect x="8" y="50" width="8" height="12" fill="#0c2340" />

                            <rect x="36" y="36" width="28" height="28" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                            <path d="M50 42v16M42 50h16" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

                            <rect x="68" y="36" width="8" height="12" fill="#0c2340" />
                            <rect x="80" y="36" width="12" height="6" fill="#0c2340" />
                            <rect x="68" y="52" width="16" height="10" fill="#0c2340" />

                            <rect x="36" y="68" width="10" height="8" fill="#0c2340" />
                            <rect x="50" y="68" width="14" height="6" fill="#0c2340" />
                            <rect x="36" y="80" width="16" height="12" fill="#0c2340" />
                            <rect x="56" y="78" width="8" height="14" fill="#0c2340" />
                            <rect x="68" y="72" width="24" height="6" fill="#0c2340" />
                            <rect x="68" y="82" width="10" height="10" fill="#0c2340" />
                            <rect x="82" y="82" width="10" height="10" fill="#0c2340" />
                          </svg>
                        </div>
                        <div className="razorpay-qr-desc">
                          <p>Scan with <strong>Google Pay, PhonePe, Paytm</strong>, or any UPI app</p>
                          <span className="razorpay-vpa-badge">VPA: dropwater.rwa@razorpay</span>
                        </div>
                      </div>
                    ) : (
                      <div className="razorpay-vpa-container">
                        <label className="razorpay-field-label">Virtual Payment Address (UPI ID)</label>
                        <div className="razorpay-vpa-input-wrap">
                          <input
                            type="text"
                            className="razorpay-input"
                            placeholder="username@bank"
                            value={vpaInput}
                            onChange={(e) => setVpaInput(e.target.value)}
                          />
                          <span className="razorpay-vpa-check">✓</span>
                        </div>
                        <div className="razorpay-quick-vpa-pills">
                          {["@okaxis", "@okhdfcbank", "@ybl", "@paytm"].map((handle) => (
                            <button
                              key={handle}
                              type="button"
                              className="razorpay-vpa-pill"
                              onClick={() => {
                                const prefix = vpaInput.split("@")[0] || "resident";
                                setVpaInput(`${prefix}${handle}`);
                              }}
                            >
                              {handle}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OPTION 2: CARD CONTENT */}
                {selectedPayMode === "card" && (
                  <div className="razorpay-panel razorpay-panel--card">
                    <div className="razorpay-form-group">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label className="razorpay-field-label">Card Number</label>
                        <div className="razorpay-card-icons">
                          <span className="card-brand-badge card-brand-badge--visa">VISA</span>
                          <span className="card-brand-badge card-brand-badge--mc">Mastercard</span>
                          <span className="card-brand-badge card-brand-badge--rupay">RuPay</span>
                        </div>
                      </div>
                      <input
                        type="text"
                        className="razorpay-input"
                        placeholder="4532 •••• •••• 6789"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>

                    <div className="razorpay-form-row">
                      <div className="razorpay-form-group" style={{ flex: 1 }}>
                        <label className="razorpay-field-label">Valid Thru (MM/YY)</label>
                        <input
                          type="text"
                          className="razorpay-input"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                        />
                      </div>
                      <div className="razorpay-form-group" style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <label className="razorpay-field-label">CVV / CVC</label>
                          <span style={{ fontSize: "0.68rem", color: "#64748b" }}>3 Digits</span>
                        </div>
                        <input
                          type="password"
                          className="razorpay-input"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="razorpay-form-group">
                      <label className="razorpay-field-label">Cardholder Name</label>
                      <input
                        type="text"
                        className="razorpay-input"
                        placeholder="Full Name as on Card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="razorpay-modal__footer">
                  <div className="razorpay-ssl-note">
                    <span>🔒</span>
                    <span>Razorpay Secure · 256-Bit SSL</span>
                  </div>

                  <button
                    type="button"
                    className="razorpay-pay-btn"
                    disabled={isProcessingRazorpay}
                    onClick={handleConfirmPayment}
                  >
                    <span>Pay {activeBillToPay.amount}</span>
                    <span className="razorpay-arrow-right">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResidentDashboardPage;
