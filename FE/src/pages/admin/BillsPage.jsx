import { useState, useEffect } from "react";
import { dataStore } from "../../services/store";
import { notificationApi } from "../../services/api";
import Pagination from "../../components/Pagination";
import InvoiceModal from "../../components/InvoiceModal";
import { WaterConsumptionChart, SlabTierVisualizer } from "../../components/WaterConsumptionChart";
import "./HouseholdsPage.css";

function BillsPage() {
  const [bills, setBills] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [tariffPlans, setTariffPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [billingMonth, setBillingMonth] = useState("September 2026");
  const [overrideFixedCharge, setOverrideFixedCharge] = useState("");
  const [notification, setNotification] = useState("");
  const [viewingBillBreakdown, setViewingBillBreakdown] = useState(null);
  const [viewingOfficialInvoice, setViewingOfficialInvoice] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = () => {
    setBills(dataStore.getBills());
    setHouseholds(dataStore.getHouseholds());
    const plans = dataStore.getTariffPlans();
    setTariffPlans(plans);
    if (plans.length > 0 && !selectedPlanId) {
      const defaultPlan = plans.find((p) => p.isDefault) || plans[0];
      setSelectedPlanId(defaultPlan.id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendBillEmail = async (bill) => {
    const household = households.find((h) => h.unitNumber === bill.unitNumber || String(h.id) === String(bill.householdId));
    const targetEmail = bill.residentEmail || (household && household.residentEmail);

    if (!targetEmail) {
      const inputEmail = window.prompt(`No email address on file for Unit ${bill.unitNumber} (${bill.residentName}). Enter resident email:`);
      if (!inputEmail) return;
      return sendBillEmailDirect(bill, inputEmail.trim());
    }

    sendBillEmailDirect(bill, targetEmail);
  };

  const sendBillEmailDirect = async (bill, targetEmail) => {
    try {
      setNotification(`📧 Dispatching real bill email to ${targetEmail}...`);
      await notificationApi.sendBill({
        email: targetEmail,
        residentName: bill.residentName || "Resident",
        unitNumber: bill.unitNumber,
        invoiceNumber: bill.invoiceNumber || bill.id,
        period: bill.period,
        consumptionKL: bill.consumptionKL || 0,
        totalAmount: bill.rawAmount || 0,
        dueDate: bill.dueDate || "20th of month",
        apartmentName: "Palm Meadows Society",
      });
      setNotification(`✓ Real invoice email dispatched to ${targetEmail}!`);
      setTimeout(() => setNotification(""), 5000);
    } catch (err) {
      setNotification(`⚠️ Email dispatch: ${err.message}`);
      setTimeout(() => setNotification(""), 6000);
    }
  };

  const handleSendReminderEmail = async (bill) => {
    const household = households.find((h) => h.unitNumber === bill.unitNumber || String(h.id) === String(bill.householdId));
    const targetEmail = bill.residentEmail || (household && household.residentEmail);

    if (!targetEmail) {
      const inputEmail = window.prompt(`Enter email address to send payment reminder for Unit ${bill.unitNumber}:`);
      if (!inputEmail) return;
      return sendReminderEmailDirect(bill, inputEmail.trim());
    }

    sendReminderEmailDirect(bill, targetEmail);
  };

  const sendReminderEmailDirect = async (bill, targetEmail) => {
    try {
      setNotification(`🔔 Dispatching payment reminder to ${targetEmail}...`);
      await notificationApi.sendReminder({
        email: targetEmail,
        residentName: bill.residentName || "Resident",
        unitNumber: bill.unitNumber,
        invoiceNumber: bill.invoiceNumber || bill.id,
        period: bill.period,
        totalAmount: bill.rawAmount || 0,
        dueDate: bill.dueDate || "Immediate",
        apartmentName: "Palm Meadows Society",
      });
      setNotification(`✓ Payment reminder sent to ${targetEmail}!`);
      setTimeout(() => setNotification(""), 5000);
    } catch (err) {
      setNotification(`⚠️ Reminder dispatch: ${err.message}`);
      setTimeout(() => setNotification(""), 6000);
    }
  };

  const handleBatchEmail = async () => {
    const cycleBills = bills.filter((b) => b.period === billingMonth);
    if (cycleBills.length === 0) {
      setNotification(`❌ No bills found for ${billingMonth} to dispatch.`);
      return;
    }

    if (!window.confirm(`Send real bill notification emails to all ${cycleBills.length} households for ${billingMonth}?`)) {
      return;
    }

    let sentCount = 0;
    for (const b of cycleBills) {
      const household = households.find((h) => h.unitNumber === b.unitNumber || String(h.id) === String(b.householdId));
      const targetEmail = b.residentEmail || (household && household.residentEmail);
      if (targetEmail) {
        try {
          await notificationApi.sendBill({
            email: targetEmail,
            residentName: b.residentName || "Resident",
            unitNumber: b.unitNumber,
            invoiceNumber: b.invoiceNumber || b.id,
            period: b.period,
            consumptionKL: b.consumptionKL || 0,
            totalAmount: b.rawAmount || 0,
            dueDate: b.dueDate || "20th of month",
            apartmentName: "Palm Meadows Society",
          });
          sentCount++;
        } catch (e) {
          console.error("Batch email failure for unit:", b.unitNumber, e);
        }
      }
    }

    setNotification(`✓ Batch email run complete: Sent ${sentCount} bill emails for ${billingMonth}.`);
    setTimeout(() => setNotification(""), 5000);
  };

  const handleTestSmtp = async (e) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) return;

    setTestingEmail(true);
    try {
      setNotification(`🧪 Sending test email to ${testEmailAddress}...`);
      const res = await notificationApi.testEmail(testEmailAddress.trim());
      setNotification(res.message || `✓ Test email successfully delivered to ${testEmailAddress}! Check your inbox.`);
      setEmailModalOpen(false);
      setTimeout(() => setNotification(""), 7000);
    } catch (err) {
      setNotification(`❌ SMTP Diagnostic Failed: ${err.message}`);
      setTimeout(() => setNotification(""), 7000);
    } finally {
      setTestingEmail(false);
    }
  };


  const handleGenerate = (e) => {
    e.preventDefault();
    if (households.length === 0) {
      setNotification("❌ Please register flats first in Household Directory before generating bills.");
      return;
    }

    const result = dataStore.generateBillsForCycle(
      billingMonth,
      selectedPlanId,
      overrideFixedCharge !== "" ? Number(overrideFixedCharge) : null
    );
    loadData();
    setCurrentPage(1);

    if (result.generatedCount === 0) {
      setNotification(`⚠️ Duplicate billing prevented: All ${result.totalHouseholds} registered flats already have invoices generated for ${billingMonth}.`);
    } else if (result.skippedCount > 0) {
      setNotification(`✓ Generated ${result.generatedCount} new invoices for ${billingMonth} (${result.skippedCount} flats were already billed and skipped to prevent duplicates).`);
    } else {
      setNotification(`✓ Generated ${result.generatedCount} monthly invoices for ${billingMonth} with 100% verified slab calculations!`);
    }
    setTimeout(() => setNotification(""), 5000);
  };

  const handleMarkPaid = (id) => {
    dataStore.markBillPaid(id, "Admin Manual Settle");
    loadData();
    setNotification("✓ Bill successfully marked as Paid and Settled.");
    setTimeout(() => setNotification(""), 3000);
  };

  const handleDeleteBill = (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      dataStore.deleteBill(id);
      loadData();
      setNotification("✓ Invoice deleted successfully.");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const filteredBills = bills.filter((b) => {
    // Status filter
    if (filter === "paid" && b.status !== "Paid") return false;
    if (filter === "unpaid" && b.status !== "Unpaid") return false;
    if (filter === "high" && (b.consumptionKL || 0) < 20) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUnit = b.unitNumber?.toLowerCase().includes(q);
      const matchResident = b.residentName?.toLowerCase().includes(q);
      const matchId = (b.invoiceNumber || b.id)?.toLowerCase().includes(q);
      const matchPlan = b.planName?.toLowerCase().includes(q);
      const matchPeriod = b.period?.toLowerCase().includes(q);
      if (!matchUnit && !matchResident && !matchId && !matchPlan && !matchPeriod) {
        return false;
      }
    }

    return true;
  });

  // Pagination slice
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBills = filteredBills.slice(startIndex, startIndex + pageSize);

  const totalInvoiced = bills.reduce((acc, b) => acc + (b.rawAmount || 0), 0);
  const totalPaid = bills.filter((b) => b.status === "Paid").reduce((acc, b) => acc + (b.rawAmount || 0), 0);
  const totalPending = totalInvoiced - totalPaid;
  const totalVolumeKL = bills.reduce((acc, b) => acc + (Number(b.consumptionKL) || 0), 0);
  const avgBillAmount = bills.length > 0 ? Math.round(totalInvoiced / bills.length) : 0;

  const currentSelectedPlan = tariffPlans.find((p) => p.id === selectedPlanId) || tariffPlans[0];

  // Chart data: map recent bills for visual representation
  const chartData = bills.slice(0, 8).map((b) => ({
    id: b.id,
    period: `${b.unitNumber} (${b.period?.slice(0, 3)})`,
    consumptionKL: Number(b.consumptionKL) || 0,
    consumptionLiters: (Number(b.consumptionKL) || 0) * 1000,
    amount: b.amount,
    rawAmount: b.rawAmount,
    status: b.status,
    unitNumber: b.unitNumber,
  }));

  return (
    <div className="admin-page" id="bills-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Bill & Invoice Management</h1>
          <p className="admin-page__subtitle">
            Generate monthly consumption bills, apply dynamic tariff slabs, dispatch real email invoices to residents, and track receivables
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            className="btn-secondary"
            onClick={() => setEmailModalOpen(true)}
            style={{ fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.4rem", background: "#f0fdf4", borderColor: "#86efac", color: "#166534", fontWeight: 700 }}
          >
            🧪 Test Real Email (SMTP)
          </button>
          <button
            className="btn-secondary"
            onClick={handleBatchEmail}
            style={{ fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.4rem", background: "#f0f9ff", borderColor: "#bae6fd", color: "#0369a1", fontWeight: 700 }}
          >
            ⚡ Batch Email {billingMonth} Invoices
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{ fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            📊 {showAnalytics ? "Hide Charts" : "Show Water Analytics"}
          </button>
        </div>
      </div>


      {notification && (
        <div className={`notification-banner ${notification.startsWith("✓") ? "notification-banner--success" : "notification-banner--error"}`}>
          {notification}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="readings-kpi" style={{ borderLeft: "4px solid #0284c7" }}>
          <span className="readings-kpi__label">Total Invoiced</span>
          <span className="readings-kpi__val">₹{totalInvoiced.toLocaleString()}</span>
          <span className="readings-kpi__sub">{bills.length} Invoices Issued</span>
        </div>
        <div className="readings-kpi" style={{ borderLeft: "4px solid #16a34a" }}>
          <span className="readings-kpi__label">Total Collected</span>
          <span className="readings-kpi__val" style={{ color: "#16a34a" }}>₹{totalPaid.toLocaleString()}</span>
          <span className="readings-kpi__sub">
            {totalInvoiced > 0 ? `${Math.round((totalPaid / totalInvoiced) * 100)}% Collection Rate` : "0% Settled"}
          </span>
        </div>
        <div className="readings-kpi" style={{ borderLeft: "4px solid #d97706" }}>
          <span className="readings-kpi__label">Pending Receivables</span>
          <span className="readings-kpi__val" style={{ color: "#d97706" }}>₹{totalPending.toLocaleString()}</span>
          <span className="readings-kpi__sub">{bills.filter((b) => b.status === "Unpaid").length} Invoices Awaiting Payment</span>
        </div>
        <div className="readings-kpi" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <span className="readings-kpi__label">Total Water Billed</span>
          <span className="readings-kpi__val" style={{ color: "#8b5cf6" }}>{totalVolumeKL.toFixed(1)} kL</span>
          <span className="readings-kpi__sub">Avg ₹{avgBillAmount} per household</span>
        </div>
      </div>

      {/* Visual Water Consumption & Slab Analytics (Optional / Collapsible) */}
      {showAnalytics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <WaterConsumptionChart
            data={chartData}
            title="Household Water Consumption Across Recent Invoices"
            subtitle="Live volumetric consumption by unit compared to society baseline"
            targetThreshold={15000}
          />
          <SlabTierVisualizer
            consumptionKL={bills.length > 0 ? (Number(bills[0].consumptionKL) || 0) : 0}
            plan={currentSelectedPlan}
          />
        </div>
      )}

      {/* Bill Generation Form with Dynamic Tariff Selection */}
      <div className="admin-card input-creation-card">
        <div className="input-creation-header">
          <h2>⚡ Generate Invoices with Dynamic Tariff Slabs</h2>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Calculates exact tier costs & fixed base fees</span>
        </div>
        <form onSubmit={handleGenerate} className="direct-form">
          <div className="direct-form__grid">
            <div className="form-group">
              <label>Billing Cycle / Month *</label>
              <input
                type="text"
                required
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                placeholder="e.g. September 2026"
              />
            </div>

            <div className="form-group">
              <label>Applied Tariff Plan *</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                required
              >
                {tariffPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? "(Default)" : ""} — {p.type === "TIERED" ? `${p.slabs?.length || 0} Slabs` : `Flat ₹${p.flatRate}/kL`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fixed Base Maintenance Fee (₹)</label>
              <input
                type="number"
                placeholder={currentSelectedPlan ? `Default: ₹${currentSelectedPlan.fixedCharge}` : "100"}
                value={overrideFixedCharge}
                onChange={(e) => setOverrideFixedCharge(e.target.value)}
              />
            </div>
          </div>

          {/* Slabs summary banner of selected plan */}
          {currentSelectedPlan && (
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "0.85rem 1rem", margin: "1rem 0", fontSize: "0.8125rem", color: "#0369a1" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.35rem", display: "flex", justifyContent: "space-between" }}>
                <span>Active Plan: {currentSelectedPlan.name} ({currentSelectedPlan.type === "TIERED" ? "Progressive Slabs" : "Flat Volumetric"})</span>
                <span style={{ color: "#0284c7" }}>Base: ₹{overrideFixedCharge !== "" ? overrideFixedCharge : currentSelectedPlan.fixedCharge}</span>
              </div>
              <div style={{ color: "#0c4a6e" }}>
                {currentSelectedPlan.type === "TIERED" && currentSelectedPlan.slabs?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                    {currentSelectedPlan.slabs.map((s, idx) => (
                      <span key={idx} style={{ background: "#ffffff", padding: "0.25rem 0.5rem", borderRadius: "4px", border: "1px solid #bae6fd", fontWeight: 600 }}>
                        {s.label || (s.toKL ? `${s.fromKL}-${s.toKL} kL` : `>${s.fromKL} kL`)}: <span style={{ color: "#0284c7" }}>₹{s.ratePerKL}/kL</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="direct-form__actions">
            <button type="submit" className="btn-primary">
              ⚡ Calculate & Issue Verified Invoices
            </button>
          </div>
        </form>
      </div>

      {/* Bills Table with Advanced Search & Filter */}
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: "0.75rem" }}>
          {/* Tab Filters */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Invoices" },
              { id: "unpaid", label: "Unpaid / Due" },
              { id: "paid", label: "Settled / Paid" },
              { id: "high", label: "High Usage (>20 kL)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilter(tab.id);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "6px",
                  border: filter === tab.id ? "1px solid #0284c7" : "1px solid #e2e8f0",
                  background: filter === tab.id ? "#e0f2fe" : "#ffffff",
                  color: filter === tab.id ? "#0284c7" : "#475569",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                {tab.label} ({
                  tab.id === "all" ? bills.length :
                  tab.id === "paid" ? bills.filter((b) => b.status === "Paid").length :
                  tab.id === "unpaid" ? bills.filter((b) => b.status === "Unpaid").length :
                  bills.filter((b) => (Number(b.consumptionKL) || 0) >= 20).length
                })
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "240px" }}>
            <input
              type="text"
              placeholder="Search by flat, resident, invoice #..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8125rem",
              }}
            />
            <span style={{ position: "absolute", left: "8px", top: "7px", color: "#94a3b8", fontSize: "0.8125rem" }}>🔍</span>
          </div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">💳</div>
            <h3>No Invoices Found</h3>
            <p>{bills.length === 0 ? "Use the form above to generate monthly invoices." : "No invoices match the search or filter criteria."}</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Unit</th>
                  <th>Resident</th>
                  <th>Period</th>
                  <th>Consumption</th>
                  <th>Fixed Base</th>
                  <th>Slabs Cost</th>
                  <th>Total Amount</th>
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
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                          title="Click to view official invoice"
                        >
                          <code style={{ color: "#0284c7", fontWeight: 700 }}>{b.invoiceNumber || b.id}</code>
                        </button>
                      </td>
                      <td><strong>{b.unitNumber}</strong></td>
                      <td>{b.residentName}</td>
                      <td>{b.period}</td>
                      <td>
                        <div><strong>{b.liters}</strong></div>
                        <div style={{ fontSize: "0.72rem", color: (Number(b.consumptionKL) || 0) > 25 ? "#dc2626" : (Number(b.consumptionKL) || 0) > 10 ? "#0284c7" : "#16a34a", fontWeight: 600 }}>
                          ({b.consumptionKL || "0.00"} kL)
                        </div>
                      </td>
                      <td style={{ color: "#475569", fontSize: "0.8125rem" }}>
                        ₹{(b.fixedCharge !== undefined && b.fixedCharge !== null ? b.fixedCharge : 100).toFixed(2)}
                      </td>
                      <td style={{ color: "#0284c7", fontWeight: 600, fontSize: "0.8125rem" }}>
                        ₹{(proof.volumetricSlabsTotal !== undefined ? proof.volumetricSlabsTotal : ((b.rawAmount || 0) - (b.fixedCharge || 0))).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                        {b.amount}
                      </td>
                      <td>
                        <span className={`badge badge--${b.status === "Paid" ? "success" : "warning"}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", flexWrap: "wrap" }}>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem" }}
                            onClick={() => setViewingOfficialInvoice(b)}
                            title="View official printable invoice"
                          >
                            📄 Invoice
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", background: "#f0f9ff", borderColor: "#bae6fd", color: "#0284c7" }}
                            onClick={() => handleSendBillEmail(b)}
                            title="Send real email invoice with consumption details to resident"
                          >
                            📧 Email
                          </button>
                          {b.status !== "Paid" && (
                            <button
                              className="btn-secondary"
                              style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", background: "#fffbeb", borderColor: "#fde68a", color: "#b45309" }}
                              onClick={() => handleSendReminderEmail(b)}
                              title="Send payment reminder email to resident"
                            >
                              🔔 Reminder
                            </button>
                          )}
                          <button
                            className="btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem" }}
                            onClick={() => setViewingBillBreakdown(b)}
                            title="Inspect slab tier calculation"
                          >
                            🔍 Breakdown
                          </button>
                          {b.status !== "Paid" ? (
                            <button
                              className="btn-table-action"
                              onClick={() => handleMarkPaid(b.id)}
                              style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem" }}
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center" }}>
                              ✓ Settled
                            </span>
                          )}
                          <button
                            className="btn-table-action"
                            onClick={() => handleDeleteBill(b.id)}
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", color: "var(--red-600)", borderColor: "#fecaca" }}
                            title="Delete this invoice"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Universal Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredBills.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </div>

      {/* Test SMTP Email Modal */}
      {emailModalOpen && (
        <div className="modal-backdrop" id="test-smtp-modal" onClick={() => setEmailModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧪 Test Live SMTP Email Delivery</h2>
              <button className="modal-close" onClick={() => setEmailModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleTestSmtp} style={{ padding: "1.25rem 0" }}>
              <p style={{ fontSize: "0.875rem", color: "#475569", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
                Enter your own email address below. We will dispatch a live verification email through your configured SMTP server to confirm everything works.
              </p>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.8125rem" }}>
                  Destination Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>


              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setEmailModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={testingEmail}>
                  {testingEmail ? "Sending Email..." : "🚀 Send Live Test Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Invoice Modal */}
      {viewingOfficialInvoice && (
        <InvoiceModal
          bill={viewingOfficialInvoice}
          onClose={() => setViewingOfficialInvoice(null)}
          onMarkPaid={(id) => {
            handleMarkPaid(id);
            setViewingOfficialInvoice(null);
          }}
        />
      )}

      {/* Slabs Breakdown Inspector Modal */}
      {viewingBillBreakdown && (
        <div className="modal-backdrop" id="invoice-breakdown-modal" onClick={() => setViewingBillBreakdown(null)}>
          <div className="modal-card" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invoice Slab Breakdown — {viewingBillBreakdown.id}</h2>
              <button className="modal-close" onClick={() => setViewingBillBreakdown(null)}>×</button>
            </div>

            <div style={{ padding: "1.25rem 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", background: "#f8fafc", padding: "1rem", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "0.8125rem" }}>
                <div>Flat / Unit: <strong>{viewingBillBreakdown.unitNumber}</strong></div>
                <div>Resident: <strong>{viewingBillBreakdown.residentName}</strong></div>
                <div>Billing Period: <strong>{viewingBillBreakdown.period}</strong></div>
                <div>Total Volume: <strong>{viewingBillBreakdown.liters} ({viewingBillBreakdown.consumptionKL || "0.00"} kL)</strong></div>
                <div style={{ gridColumn: "span 2" }}>Applied Plan: <strong style={{ color: "#0284c7" }}>{viewingBillBreakdown.planName || "Tiered Plan"}</strong></div>
              </div>

              <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.75rem 0", color: "#0f172a" }}>Itemized Charges & Formulas</h3>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "0.5rem" }}>Tier / Component</th>
                    <th style={{ padding: "0.5rem" }}>Volume</th>
                    <th style={{ padding: "0.5rem" }}>Rate</th>
                    <th style={{ padding: "0.5rem", textAlign: "right" }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.5rem" }}>Fixed Base Fee</td>
                    <td style={{ padding: "0.5rem" }}>—</td>
                    <td style={{ padding: "0.5rem" }}>Monthly Fixed</td>
                    <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>
                      ₹{(viewingBillBreakdown.fixedCharge !== undefined && viewingBillBreakdown.fixedCharge !== null ? viewingBillBreakdown.fixedCharge : 100).toFixed(2)}
                    </td>
                  </tr>

                  {viewingBillBreakdown.slabBreakdown && viewingBillBreakdown.slabBreakdown.length > 0 ? (
                    viewingBillBreakdown.slabBreakdown.map((s, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.5rem" }}>
                          <strong>{s.slabLabel}</strong>
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{s.formula || `${s.unitsKL} kL × ₹${s.ratePerKL}`}</div>
                        </td>
                        <td style={{ padding: "0.5rem" }}>{s.unitsKL} kL</td>
                        <td style={{ padding: "0.5rem", color: "#0284c7" }}>₹{s.ratePerKL.toFixed(2)}/kL</td>
                        <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>₹{s.cost.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.5rem" }}>Volumetric Water Usage</td>
                      <td style={{ padding: "0.5rem" }}>{viewingBillBreakdown.consumptionKL || "0.00"} kL</td>
                      <td style={{ padding: "0.5rem" }}>Standard</td>
                      <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>
                        ₹{(viewingBillBreakdown.usageCost !== undefined ? viewingBillBreakdown.usageCost : ((viewingBillBreakdown.rawAmount || 0) - (viewingBillBreakdown.fixedCharge || 0))).toFixed(2)}
                      </td>
                    </tr>
                  )}

                  <tr style={{ borderTop: "2px solid #0f172a", fontWeight: 700, fontSize: "0.95rem" }}>
                    <td colSpan="3" style={{ padding: "0.75rem 0.5rem", color: "#0f172a" }}>Total Invoiced Amount:</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", color: "#0284c7" }}>{viewingBillBreakdown.amount}</td>
                  </tr>
                </tbody>
              </table>

              {/* Verified Billing Total */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.78rem", color: "#166534" }}>
                <strong>Billing Breakdown Summary:</strong> Fixed Base (₹{(viewingBillBreakdown.fixedCharge !== undefined && viewingBillBreakdown.fixedCharge !== null ? viewingBillBreakdown.fixedCharge : 100).toFixed(2)}) + Volumetric Usage (₹{(viewingBillBreakdown.usageCost !== undefined ? viewingBillBreakdown.usageCost : ((viewingBillBreakdown.rawAmount || 0) - (viewingBillBreakdown.fixedCharge || 0))).toFixed(2)}) = <strong>{viewingBillBreakdown.amount}</strong>
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setViewingOfficialInvoice(viewingBillBreakdown);
                  setViewingBillBreakdown(null);
                }}
              >
                📄 Open Printable Invoice
              </button>
              <button className="btn-secondary" onClick={() => setViewingBillBreakdown(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillsPage;

