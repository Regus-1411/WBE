import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dataStore } from "../services/store";
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
  const currentConsumptionKL = latestBill ? Number(latestBill.consumptionKL) || 14.2 : 14.2;
  const totalLiters = readings.reduce((acc, r) => acc + (r.consumptionLiters || 0), 0) || 14200;
  const avgDailyLiters = Math.round((currentConsumptionKL * 1000) / 30);

  const handleOpenPay = (bill) => {
    setActiveBillToPay(bill || unpaidBill);
    setPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (activeBillToPay) {
      dataStore.markBillPaid(activeBillToPay.id, "UPI QR Settlement");
    }
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setPayModalOpen(false);
      loadResidentData();
    }, 1500);
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
  const consumptionChartData = (bills.length > 0 ? bills : readings).map((item, idx) => ({
    id: item.id || idx,
    period: item.period || item.date || `Month ${idx + 1}`,
    litersRaw: item.litersRaw || item.consumptionLiters || (item.consumptionKL ? item.consumptionKL * 1000 : 12000),
    consumptionKL: item.consumptionKL || (item.consumptionLiters ? item.consumptionLiters / 1000 : 12),
    amount: item.amount || null,
    status: item.status || "Recorded",
  })).reverse();

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

          {/* Detailed Searchable & Filterable Readings Table */}
          <div className="res-dash__card res-dash__card--table">
            <div className="res-dash__card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h2 className="res-dash__card-title">Water Meter Reading Log Ledger</h2>
                <p className="res-dash__card-subtitle">Comprehensive audit record of all individual meter readings</p>
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
                <table className="res-dash__table">
                  <thead>
                    <tr>
                      <th>Reading Date</th>
                      <th>Previous (kL)</th>
                      <th>Current (kL)</th>
                      <th>Volume (kL)</th>
                      <th>Volume (Liters)</th>
                      <th>Consumption Category</th>
                      <th>Source</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReadings.map((r) => {
                      const liters = r.consumptionLiters || 0;
                      const kL = (liters / 1000).toFixed(2);
                      const isHigh = liters > 20000;
                      const isLow = liters < 10000;
                      return (
                        <tr key={r.id}>
                          <td><strong>{r.date}</strong></td>
                          <td>{r.previousReading || "—"} kL</td>
                          <td><strong>{r.meterReading} kL</strong></td>
                          <td style={{ fontWeight: 600, color: "#0284c7" }}>{kL} kL</td>
                          <td className="res-dash__table-liters">{liters.toLocaleString()} L</td>
                          <td>
                            <span
                              className={`badge badge--${isLow ? "success" : isHigh ? "error" : "warning"}`}
                              style={{ fontSize: "0.72rem" }}
                            >
                              {isLow ? "Tier 1: Base" : isHigh ? "Tier 3: High" : "Tier 2: Moderate"}
                            </span>
                          </td>
                          <td>
                            <span className="res-dash__unit-tag" style={{ fontSize: "0.72rem" }}>
                              {r.source || "IOT"}
                            </span>
                          </td>
                          <td style={{ color: "#64748b", fontSize: "0.8125rem" }}>{r.notes || "Standard cycle"}</td>
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
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>({b.consumptionKL || "14.2"} kL)</div>
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

      {/* Payment Modal */}
      {payModalOpen && activeBillToPay && (
        <div className="res-modal__backdrop" id="payment-modal" onClick={() => setPayModalOpen(false)}>
          <div className="res-modal" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <div className="res-modal__header">
              <h2>Pay Water Bill — {activeBillToPay.invoiceNumber || activeBillToPay.id}</h2>
              <button className="res-modal__close" onClick={() => setPayModalOpen(false)}>×</button>
            </div>

            {paymentSuccess ? (
              <div className="res-modal__success">
                <div className="res-modal__success-icon">✓</div>
                <h3>Payment Completed Successfully!</h3>
                <p>{activeBillToPay.amount} settled for {activeBillToPay.period}. Official receipt generated.</p>
              </div>
            ) : (
              <div className="res-modal__body">
                <div className="res-modal__summary">
                  <div className="res-modal__summary-row">
                    <span>Invoice Number:</span>
                    <strong><code>{activeBillToPay.invoiceNumber || activeBillToPay.id}</code></strong>
                  </div>
                  <div className="res-modal__summary-row">
                    <span>Flat & Resident:</span>
                    <strong>{unitData.unitNumber} ({unitData.residentName})</strong>
                  </div>
                  <div className="res-modal__summary-row">
                    <span>Billing Period:</span>
                    <strong>{activeBillToPay.period}</strong>
                  </div>
                  <div className="res-modal__summary-row">
                    <span>Consumption:</span>
                    <strong>{activeBillToPay.liters} ({activeBillToPay.consumptionKL || "14.2"} kL)</strong>
                  </div>

                  {/* Itemized Charges in Payment Receipt */}
                  <div style={{ margin: "0.75rem 0", padding: "0.6rem 0", borderTop: "1px dashed #cbd5e1", borderBottom: "1px dashed #cbd5e1", fontSize: "0.8125rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", color: "#64748b" }}>
                      <span>Fixed Base Fee:</span>
                      <span>₹{(activeBillToPay.fixedCharge || 100).toFixed(2)}</span>
                    </div>
                    {activeBillToPay.slabBreakdown && activeBillToPay.slabBreakdown.length > 0 ? (
                      activeBillToPay.slabBreakdown.map((s, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", color: "#334155" }}>
                          <span>{s.slabLabel} ({s.unitsKL} kL @ ₹{s.ratePerKL}):</span>
                          <strong>₹{s.cost.toFixed(2)}</strong>
                        </div>
                      ))
                    ) : null}
                  </div>

                  <div className="res-modal__summary-row res-modal__summary-row--total">
                    <span>Total Due:</span>
                    <strong className="res-modal__amount">{activeBillToPay.amount}</strong>
                  </div>
                </div>

                <div className="res-modal__methods">
                  <label className="res-modal__method-opt">
                    <input type="radio" name="pay-method" defaultChecked />
                    <span>UPI / QR Code (Google Pay, PhonePe, Paytm)</span>
                  </label>
                  <label className="res-modal__method-opt">
                    <input type="radio" name="pay-method" />
                    <span>Credit / Debit Card / NetBanking</span>
                  </label>
                </div>

                <div className="res-modal__footer">
                  <button className="btn-secondary" onClick={() => setPayModalOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleConfirmPayment}>Confirm & Pay {activeBillToPay.amount}</button>
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
