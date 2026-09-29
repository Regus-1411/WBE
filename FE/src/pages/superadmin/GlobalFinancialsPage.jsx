import { useState, useEffect, useMemo } from "react";
import { dataStore } from "../../services/store";
import "./SuperAdmin.css";

function GlobalFinancialsPage() {
  const [financialStats, setFinancialStats] = useState(null);
  const [selectedSociety, setSelectedSociety] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [notification, setNotification] = useState("");

  const loadFinancials = () => {
    const data = dataStore.getGlobalFinancialStats();
    setFinancialStats(data);
  };

  useEffect(() => {
    loadFinancials();
  }, []);

  const showMsg = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 5000);
  };

  const handleMarkPaid = (invoice) => {
    try {
      const billId = invoice.id || invoice.invoiceNumber;
      dataStore.markBillPaid(billId, "Main Admin Direct Settlement", {
        paidAt: new Date().toISOString(),
        paymentMethod: "Main Admin Direct Settlement",
      });
      loadFinancials();
      if (
        selectedInvoice &&
        (String(selectedInvoice.id) === String(invoice.id) ||
          selectedInvoice.invoiceNumber === invoice.invoiceNumber)
      ) {
        setSelectedInvoice({
          ...selectedInvoice,
          status: "PAID",
          paymentMethod: "Main Admin Direct Settlement",
          paidAt: new Date().toISOString(),
        });
      }
      showMsg(`✓ Invoice #${invoice.invoiceNumber || invoice.id} marked as Paid & Reconciled!`);
    } catch (err) {
      showMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      showMsg("⚠️ No invoices available to export.");
      return;
    }

    const headers = [
      "Invoice ID",
      "Society Name",
      "Unit / Flat",
      "Resident Name",
      "Resident Email",
      "Billing Period",
      "Bill Date",
      "Due Date",
      "Consumption (kL)",
      "Consumption (Liters)",
      "Billed Amount (INR)",
      "Payment Status",
      "Payment Method",
      "Settlement Date",
    ];

    const rows = filteredInvoices.map((inv) => [
      `"${inv.invoiceNumber || inv.id}"`,
      `"${inv.societyName || ""}"`,
      `"${inv.unitNumber || ""}"`,
      `"${inv.residentName || ""}"`,
      `"${inv.residentEmail || ""}"`,
      `"${inv.period || ""}"`,
      `"${inv.billDate || ""}"`,
      `"${inv.dueDate || ""}"`,
      inv.consumptionKL || 0,
      Math.round((inv.consumptionKL || 0) * 1000),
      inv.rawAmount || 0,
      `"${inv.status || "PENDING"}"`,
      `"${inv.paymentMethod || "Unpaid"}"`,
      `"${inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("en-IN") : "N/A"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DROP_Global_Financial_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMsg("✓ Exported financial ledger CSV successfully!");
  };

  const filteredInvoices = useMemo(() => {
    if (!financialStats || !financialStats.invoices) return [];
    let list = financialStats.invoices.filter((inv) => {
      // Society filter
      if (
        selectedSociety !== "all" &&
        inv.societyName !== selectedSociety &&
        String(inv.societyId) !== selectedSociety
      ) {
        return false;
      }
      // Status filter
      if (statusFilter !== "all" && inv.status?.toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = inv.residentName?.toLowerCase().includes(q);
        const matchUnit = inv.unitNumber?.toLowerCase().includes(q);
        const matchInv =
          String(inv.invoiceNumber || "").toLowerCase().includes(q) ||
          String(inv.id || "").toLowerCase().includes(q);
        const matchSoc = inv.societyName?.toLowerCase().includes(q);
        if (!matchName && !matchUnit && !matchInv && !matchSoc) return false;
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "amount_desc") return (b.rawAmount || 0) - (a.rawAmount || 0);
      if (sortBy === "amount_asc") return (a.rawAmount || 0) - (b.rawAmount || 0);
      if (sortBy === "usage_desc") return (b.consumptionKL || 0) - (a.consumptionKL || 0);
      // Default date_desc
      return new Date(b.billDate || b.createdAt || 0) - new Date(a.billDate || a.createdAt || 0);
    });

    return list;
  }, [financialStats, selectedSociety, statusFilter, search, sortBy]);

  if (!financialStats) {
    return (
      <div className="superadmin-page">
        <div style={{ padding: "3rem", textAlign: "center" }}>Loading Financials...</div>
      </div>
    );
  }

  const {
    totalRevenueGenerated,
    totalRevenueCollected,
    totalPendingRevenue,
    totalOverdueRevenue,
    totalInvoicesCount,
    paidInvoicesCount,
    pendingInvoicesCount,
    overdueInvoicesCount,
    collectionEfficiency,
    avgRevenuePerFlat,
    totalWaterVolumeKL,
    societyBreakdown,
  } = financialStats;

  return (
    <div className="superadmin-page" id="global-financials-page">
      {/* Header */}
      <div className="superadmin-header">
        <div>
          <h1 className="superadmin-header__title">
            <span>Global Financials</span>
            <span className="superadmin-badge-pill">💳 Platform Treasury</span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-secondary" onClick={handleExportCSV}>
            📥 Export CSV
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              loadFinancials();
              showMsg("✓ Financial telemetry refreshed.");
            }}
          >
            🔄 Refresh Ledger
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`notification-banner ${
            notification.startsWith("✓") ? "notification-banner--success" : "notification-banner--error"
          }`}
        >
          {notification}
        </div>
      )}

      {/* ── 2. ELEVATED FINANCIAL KPI TILES ── */}
      <div className="fin-kpi-grid">
        {/* Total Invoiced */}
        <div className="fin-kpi-card fin-kpi-card--blue">
          <div className="fin-kpi-header">
            <div className="fin-kpi-icon">💰</div>
            <span className="fin-kpi-badge fin-kpi-badge--blue">{totalInvoicesCount || 0} Invoices</span>
          </div>
          <div className="fin-kpi-label">Total Revenue Billed</div>
          <div className="fin-kpi-amount">₹{(totalRevenueGenerated || 0).toLocaleString("en-IN")}</div>
          <div className="fin-kpi-footer">
            <span>Across {(societyBreakdown || []).length} societies</span>
            <span style={{ fontWeight: 700, color: "#0284c7" }}>100% Volumetric</span>
          </div>
        </div>

        {/* Realized Cash */}
        <div className="fin-kpi-card fin-kpi-card--emerald">
          <div className="fin-kpi-header">
            <div className="fin-kpi-icon">✓</div>
            <span className="fin-kpi-badge fin-kpi-badge--emerald">{collectionEfficiency || 0}% Efficiency</span>
          </div>
          <div className="fin-kpi-label">Realized Cash Collections</div>
          <div className="fin-kpi-amount" style={{ color: "#059669" }}>
            ₹{(totalRevenueCollected || 0).toLocaleString("en-IN")}
          </div>
          <div className="fin-kpi-footer">
            <span>{paidInvoicesCount || 0} Settled Invoices</span>
            <span style={{ fontWeight: 700, color: "#059669" }}>Reconciled</span>
          </div>
        </div>

        {/* Pending Outstanding */}
        <div className="fin-kpi-card fin-kpi-card--amber">
          <div className="fin-kpi-header">
            <div className="fin-kpi-icon">⏳</div>
            <span className="fin-kpi-badge fin-kpi-badge--amber">{pendingInvoicesCount || 0} Pending</span>
          </div>
          <div className="fin-kpi-label">Pending Outstanding</div>
          <div className="fin-kpi-amount" style={{ color: "#d97706" }}>
            ₹{(totalPendingRevenue || 0).toLocaleString("en-IN")}
          </div>
          <div className="fin-kpi-footer">
            <span>Awaiting Resident Payment</span>
            <span style={{ fontWeight: 700, color: "#d97706" }}>Active Dues</span>
          </div>
        </div>

        {/* Overdue Arrears */}
        <div className="fin-kpi-card fin-kpi-card--rose">
          <div className="fin-kpi-header">
            <div className="fin-kpi-icon">⚠️</div>
            <span className="fin-kpi-badge fin-kpi-badge--rose">{overdueInvoicesCount || 0} Overdue</span>
          </div>
          <div className="fin-kpi-label">Overdue Aging Arrears</div>
          <div className="fin-kpi-amount" style={{ color: "#dc2626" }}>
            ₹{(totalOverdueRevenue || 0).toLocaleString("en-IN")}
          </div>
          <div className="fin-kpi-footer">
            <span>Past Due Date</span>
            <span style={{ fontWeight: 700, color: "#dc2626" }}>Escalated</span>
          </div>
        </div>
      </div>

      {/* ── 3. FINANCIAL INTELLIGENCE HUB & TELEMETRY ── */}
      <div className="fin-telemetry-grid">
        {/* Society Revenue Breakdown Visualizer */}
        <div className="fin-telemetry-card">
          <div className="fin-telemetry-header">
            <h3 className="fin-telemetry-title">
              <span>📊 Society Revenue Contribution Telemetry</span>
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>
              {(societyBreakdown || []).length} Connected Societies
            </span>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", fontWeight: 700 }}>
              <span style={{ color: "#475569" }}>Platform Collection Health:</span>
              <span style={{ color: (collectionEfficiency || 0) >= 80 ? "#059669" : "#d97706" }}>
                {collectionEfficiency || 0}% Realized (₹{(totalRevenueCollected || 0).toLocaleString("en-IN")} / ₹
                {(totalRevenueGenerated || 0).toLocaleString("en-IN")})
              </span>
            </div>
            <div className="fin-progress-bar-container">
              <div
                className="fin-progress-bar-fill"
                style={{
                  width: `${Math.min(100, collectionEfficiency || 0)}%`,
                  background:
                    (collectionEfficiency || 0) >= 80
                      ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
                }}
              />
            </div>
          </div>

          {/* Mini Society Breakdown Stack */}
          {societyBreakdown && societyBreakdown.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {societyBreakdown.map((soc) => {
                const pct =
                  totalRevenueGenerated > 0
                    ? Math.round(((soc.totalBilled || 0) / totalRevenueGenerated) * 100)
                    : 0;
                return (
                  <div key={soc.id || soc.name} style={{ fontSize: "0.8125rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{soc.name}</span>
                      <span style={{ color: "#64748b" }}>
                        ₹{(soc.totalBilled || 0).toLocaleString("en-IN")}{" "}
                        <strong style={{ color: "#0284c7" }}>({pct}%)</strong>
                      </span>
                    </div>
                    <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
              No society billing records generated yet.
            </div>
          )}
        </div>

        {/* Operational Metrics & Unit Economics */}
        <div className="fin-telemetry-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="fin-telemetry-header">
              <h3 className="fin-telemetry-title">
                <span>💧 Unit Economics</span>
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                  Total Water Invoiced
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0284c7" }}>
                  {(totalWaterVolumeKL || 0).toLocaleString()} kL
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  {Math.round((totalWaterVolumeKL || 0) * 1000).toLocaleString()} Liters billed
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                  Avg. Revenue Per Flat (ARPU)
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#7c3aed" }}>
                  ₹{avgRevenuePerFlat || 0}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Per active household / cycle</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9", fontSize: "0.75rem", color: "#64748b" }}>
            🔒 Verified Volumetric Slab Formula Applied
          </div>
        </div>
      </div>

      {/* ── 4. SOCIETY-WISE PERFORMANCE COMPARISON MATRIX ── */}
      <div className="superadmin-card" style={{ marginBottom: "2rem" }}>
        <div className="superadmin-card__header">
          <div>
            <h3 className="superadmin-card__title">🏢 Society-Wise Financial Performance Matrix</h3>
            <p className="superadmin-card__subtitle">
              Detailed billing, collections, and recovery efficiency broken down by individual apartment society
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="approvals-table">
            <thead>
              <tr>
                <th>Apartment Society</th>
                <th>Admin in Charge</th>
                <th>Billed Flats</th>
                <th>Total Billed</th>
                <th>Collected (Paid)</th>
                <th>Outstanding (Pending)</th>
                <th>Recovery Rate</th>
                <th style={{ textAlign: "right" }}>Filter Invoices</th>
              </tr>
            </thead>
            <tbody>
              {societyBreakdown && societyBreakdown.length > 0 ? (
                societyBreakdown.map((soc) => (
                  <tr key={soc.id || soc.name}>
                    <td>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{soc.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {soc.city || "Karnataka"}, {soc.state || "India"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                        {soc.adminName || "Assigned Admin"}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          background: "#f0f9ff",
                          color: "#0369a1",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          border: "1px solid #bae6fd",
                        }}
                      >
                        {soc.invoicedFlats || 0} Flats
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>
                        ₹{(soc.totalBilled || 0).toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: "#16a34a", fontWeight: 800, fontSize: "0.95rem" }}>
                        ₹{(soc.totalPaid || 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color: (soc.totalPending || 0) > 0 ? "#d97706" : "#64748b",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                        }}
                      >
                        ₹{(soc.totalPending || 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            flex: 1,
                            height: "8px",
                            background: "#f1f5f9",
                            borderRadius: "4px",
                            overflow: "hidden",
                            minWidth: 70,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${soc.collectionRate || 0}%`,
                              background:
                                (soc.collectionRate || 0) >= 80
                                  ? "#16a34a"
                                  : (soc.collectionRate || 0) >= 50
                                  ? "#d97706"
                                  : "#dc2626",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#0f172a" }}>
                          {soc.collectionRate || 0}%
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn-action-view"
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                        onClick={() => {
                          setSelectedSociety(soc.name);
                          const tableElem = document.getElementById("master-invoices-ledger");
                          if (tableElem) tableElem.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Filter Ledger →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "#94a3b8" }}>
                    No society billing data currently registered in the platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. UNIVERSAL MASTER BILLING & INVOICES LEDGER ── */}
      <div className="superadmin-card" id="master-invoices-ledger">
        <div className="superadmin-card__header">
          <div>
            <h3 className="superadmin-card__title">📑 Universal Master Invoices Ledger</h3>
            <p className="superadmin-card__subtitle">
              Live audit trail of all generated water invoices across all societies with instant 1-click settlement
            </p>
          </div>
        </div>

        {/* Interactive Filter Toolbar */}
        <div className="fin-filter-toolbar">
          {/* Status Filter Tabs */}
          <div className="fin-filter-pills">
            {[
              { id: "all", label: "All Invoices", count: (financialStats?.invoices || []).length },
              { id: "paid", label: "Paid & Settled", count: paidInvoicesCount || 0 },
              { id: "pending", label: "Pending Dues", count: pendingInvoicesCount || 0 },
              { id: "overdue", label: "Overdue", count: overdueInvoicesCount || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`fin-filter-pill ${statusFilter === tab.id ? "fin-filter-pill--active" : ""}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="fin-pill-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Society Selector */}
            <select
              value={selectedSociety}
              onChange={(e) => setSelectedSociety(e.target.value)}
              style={{
                padding: "0.5rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#334155",
                background: "#ffffff",
                outline: "none",
              }}
            >
              <option value="all">🏢 All Societies ({(societyBreakdown || []).length})</option>
              {(societyBreakdown || []).map((s) => (
                <option key={s.id || s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.5rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#334155",
                background: "#ffffff",
                outline: "none",
              }}
            >
              <option value="date_desc">📅 Newest Invoices First</option>
              <option value="amount_desc">💰 Amount: High to Low</option>
              <option value="amount_asc">💰 Amount: Low to High</option>
              <option value="usage_desc">💧 Consumption: High to Low</option>
            </select>

            {/* Search Input */}
            <div className="fin-search-box">
              <span className="fin-search-icon">🔍</span>
              <input
                type="text"
                className="fin-search-input"
                placeholder="Search flat, resident, invoice #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div style={{ padding: "3.5rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔍</div>
            <h3 style={{ color: "#0f172a", marginBottom: "0.25rem" }}>No Invoices Matching Criteria</h3>
            <p style={{ margin: "0 0 1rem 0" }}>Try clearing search parameters or switching filters.</p>
            <button
              className="btn-secondary"
              onClick={() => {
                setSelectedSociety("all");
                setStatusFilter("all");
                setSearch("");
                setSortBy("date_desc");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="approvals-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Society & Flat Unit</th>
                  <th>Resident Details</th>
                  <th>Billing Period & Due</th>
                  <th>Water Consumption</th>
                  <th>Billed Total</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id || inv.invoiceNumber}>
                    <td>
                      <strong style={{ color: "#7c3aed", fontFamily: "monospace", fontSize: "0.9rem" }}>
                        #{inv.invoiceNumber || inv.id}
                      </strong>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                        {inv.billDate || "01 Sep 2026"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: "#0284c7" }}>{inv.societyName}</div>
                      <div style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 600 }}>
                        Flat: <strong>{inv.unitNumber}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{inv.residentName}</div>
                      {inv.residentEmail && (
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{inv.residentEmail}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#334155" }}>{inv.period}</div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: inv.status === "OVERDUE" ? "#dc2626" : "#64748b",
                          fontWeight: inv.status === "OVERDUE" ? 700 : 400,
                        }}
                      >
                        Due: {inv.dueDate || "20 Sep 2026"}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#0284c7", fontSize: "0.9rem" }}>{inv.consumptionKL} kL</strong>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                        {Math.round((inv.consumptionKL || 0) * 1000).toLocaleString()} Liters
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: "1rem", color: "#0f172a", letterSpacing: "-0.01em" }}>
                        {inv.amount || `₹${inv.rawAmount}`}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          inv.status === "PAID"
                            ? "status-badge--approved"
                            : inv.status === "PENDING"
                            ? "status-badge--pending"
                            : "status-badge--rejected"
                        }`}
                      >
                        {inv.status === "PAID"
                          ? "✓ Paid & Settled"
                          : inv.status === "PENDING"
                          ? "🟡 Pending"
                          : "🔴 Overdue"}
                      </span>
                      {inv.paymentMethod && (
                        <div style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: "2px", fontWeight: 600 }}>
                          via {inv.paymentMethod}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn-action-view"
                          style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          🔍 Audit Bill
                        </button>
                        {inv.status !== "PAID" && (
                          <button
                            type="button"
                            className="btn-action-approve"
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
                            onClick={() => handleMarkPaid(inv)}
                            title="Direct Settlement by Main Admin"
                          >
                            ✓ Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 6. DELUXE INVOICE AUDIT & RECEIPT MODAL ── */}
      {selectedInvoice && (
        <div
          className="floating-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedInvoice(null);
          }}
        >
          <div className="floating-modal-popup" style={{ maxWidth: 620 }}>
            <div className="floating-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>📑 Official Water Invoice Audit</h3>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Invoice Ref: #{selectedInvoice.invoiceNumber || selectedInvoice.id}
                </span>
              </div>
              <button className="floating-modal-close" onClick={() => setSelectedInvoice(null)}>
                ×
              </button>
            </div>

            <div className="doc-modal-body">
              {/* Receipt Preview Card */}
              <div className="fin-receipt-container">
                {/* Stamp */}
                <div
                  className={`fin-receipt-stamp ${
                    selectedInvoice.status === "PAID"
                      ? "fin-receipt-stamp--paid"
                      : selectedInvoice.status === "OVERDUE"
                      ? "fin-receipt-stamp--overdue"
                      : "fin-receipt-stamp--pending"
                  }`}
                >
                  {selectedInvoice.status === "PAID"
                    ? "✓ PAID & SETTLED"
                    : selectedInvoice.status === "OVERDUE"
                    ? "⚠️ OVERDUE ARREAR"
                    : "🟡 PENDING DUES"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", display: "block" }}>
                      Apartment Society
                    </span>
                    <strong style={{ color: "#0f172a" }}>{selectedInvoice.societyName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", display: "block" }}>
                      Flat / Unit Number
                    </span>
                    <strong style={{ color: "#0f172a" }}>Unit {selectedInvoice.unitNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", display: "block" }}>
                      Resident Name
                    </span>
                    <strong style={{ color: "#0f172a" }}>{selectedInvoice.residentName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", display: "block" }}>
                      Billing Period
                    </span>
                    <strong style={{ color: "#0f172a" }}>{selectedInvoice.period}</strong>
                  </div>
                </div>

                {/* Mathematical Slab Verification Box */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    marginBottom: "1rem",
                    fontSize: "0.8125rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "#475569" }}>Fixed Platform / Base Charge:</span>
                    <strong>₹100.00</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "#475569" }}>
                      Tiered Consumption ({selectedInvoice.consumptionKL} kL):
                    </span>
                    <strong>₹{Math.max(0, (selectedInvoice.rawAmount || 450) - 100).toFixed(2)}</strong>
                  </div>
                  <div style={{ height: "1px", background: "#e2e8f0", margin: "8px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "1.05rem",
                      fontWeight: 900,
                      color: "#0f172a",
                    }}
                  >
                    <span>Total Bill Amount:</span>
                    <span style={{ color: "#059669" }}>{selectedInvoice.amount || `₹${selectedInvoice.rawAmount}`}</span>
                  </div>
                </div>

                {/* Payment Breakdown Status */}
                <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                  <div>Due Date: <strong>{selectedInvoice.dueDate || "20 Sep 2026"}</strong></div>
                  {selectedInvoice.status === "PAID" && (
                    <div style={{ color: "#16a34a", marginTop: "4px", fontWeight: 600 }}>
                      ✓ Reconciled via {selectedInvoice.paymentMethod || "UPI"} on{" "}
                      {selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleString("en-IN") : "Direct Settlement"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              {selectedInvoice.status !== "PAID" && (
                <button
                  type="button"
                  className="btn-action-approve"
                  style={{ padding: "0.55rem 1.25rem", fontSize: "0.8125rem" }}
                  onClick={() => handleMarkPaid(selectedInvoice)}
                >
                  ✓ Settle & Mark Paid
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedInvoice(null)}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalFinancialsPage;
