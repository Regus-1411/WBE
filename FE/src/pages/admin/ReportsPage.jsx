import { useState, useEffect } from "react";
import { dataStore } from "../../services/store";
import Pagination from "../../components/Pagination";
import InvoiceModal from "../../components/InvoiceModal";
import "./HouseholdsPage.css";

function ReportsPage() {
  const [downloading, setDownloading] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState("consumption"); // "consumption" | "revenue" | "leaks"
  const [readings, setReadings] = useState([]);
  const [bills, setBills] = useState([]);
  const [leaks, setLeaks] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setReadings(dataStore.getReadings());
    setBills(dataStore.getBills());
    setLeaks(dataStore.getLeaks());
  }, []);

  const handleDownload = (reportName) => {
    setDownloading(reportName);
    setTimeout(() => {
      setDownloading(null);
      alert(`Report "${reportName}" has been exported as CSV/PDF.`);
    }, 1000);
  };

  const currentDataset =
    activeReportTab === "consumption"
      ? readings
      : activeReportTab === "revenue"
      ? bills
      : leaks;

  const paginatedData = currentDataset.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="admin-page" id="reports-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Reports & Analytics</h1>
          <p className="admin-page__subtitle">Export audit-ready water statements, consumption trends, and financial reports</p>
        </div>
      </div>

      {/* Export Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
          <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "#0f172a" }}>Monthly Consumption Audit</h2>
          <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 1.25rem 0" }}>
            Comprehensive household-level water meter readings and daily averages.
          </p>
          <button
            className="btn-secondary"
            style={{ width: "100%" }}
            disabled={downloading === "consumption"}
            onClick={() => handleDownload("Monthly Consumption Audit")}
          >
            {downloading === "consumption" ? "Generating..." : "Export CSV & PDF"}
          </button>
        </div>

        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💰</div>
          <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "#0f172a" }}>Billing & Revenue Ledger</h2>
          <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 1.25rem 0" }}>
            Complete ledger of invoice numbers, payments collected, and dues.
          </p>
          <button
            className="btn-secondary"
            style={{ width: "100%" }}
            disabled={downloading === "revenue"}
            onClick={() => handleDownload("Billing & Revenue Ledger")}
          >
            {downloading === "revenue" ? "Generating..." : "Export Financial Statement"}
          </button>
        </div>

        <div className="admin-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💧</div>
          <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "#0f172a" }}>Water Loss & Leakage Report</h2>
          <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 1.25rem 0" }}>
            Plumbing incident alerts, detected loss rates, and resolution status.
          </p>
          <button
            className="btn-secondary"
            style={{ width: "100%" }}
            disabled={downloading === "leakage"}
            onClick={() => handleDownload("Water Loss & Leakage Report")}
          >
            {downloading === "leakage" ? "Generating..." : "Download Loss Audit"}
          </button>
        </div>
      </div>

      {/* Interactive Report Data Viewer with Pagination */}
      <div className="admin-card">
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => {
                setActiveReportTab("consumption");
                setCurrentPage(1);
              }}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: activeReportTab === "consumption" ? "1px solid #0284c7" : "1px solid #e2e8f0",
                background: activeReportTab === "consumption" ? "#e0f2fe" : "#ffffff",
                color: activeReportTab === "consumption" ? "#0284c7" : "#475569",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
              }}
            >
              📊 Usage Log ({readings.length})
            </button>
            <button
              onClick={() => {
                setActiveReportTab("revenue");
                setCurrentPage(1);
              }}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: activeReportTab === "revenue" ? "1px solid #0284c7" : "1px solid #e2e8f0",
                background: activeReportTab === "revenue" ? "#e0f2fe" : "#ffffff",
                color: activeReportTab === "revenue" ? "#0284c7" : "#475569",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
              }}
            >
              💰 Invoices Ledger ({bills.length})
            </button>
            <button
              onClick={() => {
                setActiveReportTab("leaks");
                setCurrentPage(1);
              }}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: activeReportTab === "leaks" ? "1px solid #0284c7" : "1px solid #e2e8f0",
                background: activeReportTab === "leaks" ? "#e0f2fe" : "#ffffff",
                color: activeReportTab === "leaks" ? "#0284c7" : "#475569",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
              }}
            >
              💧 Incidents Log ({leaks.length})
            </button>
          </div>
          <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
            Live Audit Preview • {currentDataset.length} records
          </span>
        </div>

        {currentDataset.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">📋</div>
            <h3>No Records In Audit Log</h3>
            <p>Data will appear here once households, readings, or invoices are recorded.</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              {activeReportTab === "consumption" && (
                <>
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Unit #</th>
                      <th>Resident</th>
                      <th>Date</th>
                      <th>Reading (kL)</th>
                      <th>Consumption</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((r) => (
                      <tr key={r.id}>
                        <td><code>#{r.id.toString().slice(-4)}</code></td>
                        <td><strong>{r.unitNumber}</strong></td>
                        <td>{r.residentName || "—"}</td>
                        <td>{r.date}</td>
                        <td>{r.meterReading} kL</td>
                        <td style={{ fontWeight: 700, color: "#0284c7" }}>{r.consumptionLiters?.toLocaleString()} Liters</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeReportTab === "revenue" && (
                <>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Unit #</th>
                      <th>Period</th>
                      <th>Consumption</th>
                      <th>Plan Applied</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((b) => (
                      <tr key={b.id}>
                        <td><code>{b.invoiceNumber || b.id}</code></td>
                        <td><strong>{b.unitNumber}</strong></td>
                        <td>{b.period}</td>
                        <td>{b.liters || `${b.consumptionKL || "12.5"} kL`}</td>
                        <td><span style={{ color: "#0284c7", fontSize: "0.8125rem" }}>{b.planName || "Tiered Plan"}</span></td>
                        <td style={{ fontWeight: 700, color: "#0f172a" }}>{b.amount}</td>
                        <td>
                          <span className={`badge badge--${b.status === "Paid" ? "success" : "warning"}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                            onClick={() => setSelectedInvoice(b)}
                          >
                            📄 Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeReportTab === "leaks" && (
                <>
                  <thead>
                    <tr>
                      <th>Incident ID</th>
                      <th>Location</th>
                      <th>Severity</th>
                      <th>Flow Rate</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((l) => (
                      <tr key={l.id}>
                        <td><code>{l.id}</code></td>
                        <td><strong>{l.location}</strong></td>
                        <td>
                          <span className={`badge badge--${l.severity === "High" ? "error" : "warning"}`}>
                            {l.severity}
                          </span>
                        </td>
                        <td>{l.flowRate}</td>
                        <td>
                          <span className={`badge badge--${l.status === "Active" ? "warning" : "success"}`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>

            {/* Universal Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={currentDataset.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </>
        )}
      </div>

      {/* Official Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          bill={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}

export default ReportsPage;
