import { useState, useEffect } from "react";
import { dataStore } from "../../services/store";
import Pagination from "../../components/Pagination";
import "./HouseholdsPage.css";

function LeakagePage() {
  const [leaks, setLeaks] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newLeak, setNewLeak] = useState({ location: "", severity: "Medium", flowRate: "" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLeaks(dataStore.getLeaks());
  }, []);

  const handleResolve = (id) => {
    dataStore.resolveLeak(id);
    setLeaks(dataStore.getLeaks());
  };

  const handleCreateLeak = (e) => {
    e.preventDefault();
    if (!newLeak.location.trim()) return;

    dataStore.addLeak({
      location: newLeak.location,
      severity: newLeak.severity,
      flowRate: newLeak.flowRate || "15",
    });

    setLeaks(dataStore.getLeaks());
    setShowReportModal(false);
    setNewLeak({ location: "", severity: "Medium", flowRate: "" });
    setCurrentPage(1);
  };

  // Pagination slicing
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeaks = leaks.slice(startIndex, startIndex + pageSize);

  const activeLeaks = leaks.filter((l) => l.status === "Active");
  const highPriorityLeaks = activeLeaks.filter((l) => l.severity === "High");

  return (
    <div className="admin-page" id="leakage-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Leakage & Anomaly Detection</h1>
          <p className="admin-page__subtitle">AI automated continuous night-flow monitoring and plumbing incident manager</p>
        </div>
        <button className="btn-primary" onClick={() => setShowReportModal(true)}>
          🚨 Report Incident
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="readings-kpi">
          <span className="readings-kpi__label">Active Incidents</span>
          <span className="readings-kpi__val" style={{ color: activeLeaks.length > 0 ? "#dc2626" : "#16a34a" }}>
            {activeLeaks.length} Active
          </span>
          <span className="readings-kpi__sub">
            {highPriorityLeaks.length} High Priority
          </span>
        </div>
        <div className="readings-kpi">
          <span className="readings-kpi__label">Network Health</span>
          <span className="readings-kpi__val" style={{ color: "#16a34a" }}>Operational</span>
          <span className="readings-kpi__sub">Telemetry Active</span>
        </div>
        <div className="readings-kpi">
          <span className="readings-kpi__label">Resolved Incidents</span>
          <span className="readings-kpi__val">
            {leaks.filter((l) => l.status === "Resolved").length} Closed
          </span>
          <span className="readings-kpi__sub">Documented in Audit Log</span>
        </div>
      </div>

      <div className="admin-card">
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.05rem", margin: 0, color: "#0f172a" }}>Incident Log</h2>
          <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>{leaks.length} recorded incidents</span>
        </div>

        {leaks.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">💧</div>
            <h3>No Leak Incidents Reported</h3>
            <p>All pipeline nodes and meters are operating at normal baseline flow.</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Location / Point</th>
                  <th>Severity</th>
                  <th>Loss Rate</th>
                  <th>Detected At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaks.map((l) => (
                  <tr key={l.id}>
                    <td><code>{l.id}</code></td>
                    <td><strong>{l.location}</strong></td>
                    <td>
                      <span className={`badge badge--${l.severity === "High" ? "danger" : l.severity === "Medium" ? "warning" : "success"}`}>
                        {l.severity}
                      </span>
                    </td>
                    <td>{l.flowRate}</td>
                    <td>{l.detectedAt}</td>
                    <td>
                      <span className={`badge badge--${l.status === "Resolved" ? "success" : "danger"}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {l.status !== "Resolved" ? (
                        <button className="btn-table-action" onClick={() => handleResolve(l.id)}>
                          Resolve
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>✓ Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalItems={leaks.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </>
        )}
      </div>

      {showReportModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Report Leakage Incident</h2>
              <button className="modal-close" onClick={() => setShowReportModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateLeak} className="modal-form">
              <div className="form-group">
                <label>Location / Pipe Details *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block C Basement Pump Line"
                  value={newLeak.location}
                  onChange={(e) => setNewLeak({ ...newLeak, location: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Severity Level</label>
                  <select
                    value={newLeak.severity}
                    onChange={(e) => setNewLeak({ ...newLeak, severity: e.target.value })}
                  >
                    <option value="High">High (Immediate Overflow)</option>
                    <option value="Medium">Medium (Dripping Line)</option>
                    <option value="Low">Low (Minor Seepage)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estimated Flow (L/hr)</label>
                  <input
                    type="text"
                    placeholder="e.g. 25"
                    value={newLeak.flowRate}
                    onChange={(e) => setNewLeak({ ...newLeak, flowRate: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeakagePage;
