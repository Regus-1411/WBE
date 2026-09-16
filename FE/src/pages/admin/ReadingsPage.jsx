import { useState, useEffect } from "react";
import { dataStore } from "../../services/store";
import Pagination from "../../components/Pagination";
import "./HouseholdsPage.css";
import "./ReadingsPage.css";

function ReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [notification, setNotification] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form, setForm] = useState({
    unitNumber: "",
    readingDate: new Date().toISOString().split("T")[0],
    meterReading: "",
    notes: "Regular reading",
  });

  const loadData = () => {
    const list = dataStore.getReadings();
    const hList = dataStore.getHouseholds();
    setReadings(list);
    setHouseholds(hList);
    if (hList.length > 0 && !form.unitNumber) {
      setForm((prev) => ({ ...prev, unitNumber: hList[0].unitNumber }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogReading = (e) => {
    e.preventDefault();
    if (!form.unitNumber || !form.meterReading) return;

    try {
      const added = dataStore.addReading(form);
      loadData();
      setCurrentPage(1);
      setNotification(`✓ Logged meter reading for Unit ${added.unitNumber}: ${added.meterReading} kL (${added.consumptionLiters} L consumed)`);
      setTimeout(() => setNotification(""), 4000);
      setForm((prev) => ({ ...prev, meterReading: "" }));
    } catch (err) {
      setNotification(`❌ Error: ${err.message}`);
    }
  };

  // Pagination slicing
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReadings = readings.slice(startIndex, startIndex + pageSize);

  return (
    <div className="admin-page" id="readings-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Meter Readings & Water Usage</h1>
          <p className="admin-page__subtitle">Record meter readings for flats and track live household consumption</p>
        </div>
      </div>

      {notification && (
        <div className={`notification-banner ${notification.startsWith("✓") ? "notification-banner--success" : "notification-banner--error"}`}>
          {notification}
        </div>
      )}

      {/* Direct Input Form */}
      <div className="admin-card input-creation-card">
        <div className="input-creation-header">
          <h2>⚡ Log Meter Reading for Flat</h2>
        </div>

        {households.length === 0 ? (
          <div style={{ padding: "1.5rem", color: "#d97706", background: "#fef3c7" }}>
            ⚠️ No flats registered yet. Please go to <strong>Household Directory</strong> to add your flats first.
          </div>
        ) : (
          <form onSubmit={handleLogReading} className="direct-form">
            <div className="direct-form__grid">
              <div className="form-group">
                <label>Select Flat / Unit *</label>
                <select
                  value={form.unitNumber}
                  onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                  required
                >
                  {households.map((h) => (
                    <option key={h.id} value={h.unitNumber}>
                      {h.unitNumber} ({h.block}) {h.residentName ? `— ${h.residentName}` : "— [Vacant]"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reading Date *</label>
                <input
                  type="date"
                  required
                  value={form.readingDate}
                  onChange={(e) => setForm({ ...form, readingDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Current Meter Reading (kL) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1450.75"
                  value={form.meterReading}
                  onChange={(e) => setForm({ ...form, meterReading: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly meter check"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="direct-form__actions">
              <button type="submit" className="btn-primary">
                + Save Meter Reading
              </button>
            </div>
          </form>
        )}
      </div>

      {/* History Table */}
      <div className="admin-card">
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Reading History</h2>
          <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>{readings.length} total entries</span>
        </div>

        {readings.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">📊</div>
            <h3>No Readings Logged Yet</h3>
            <p>Select a flat and enter its current meter reading above to record data.</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Unit #</th>
                  <th>Resident</th>
                  <th>Reading Date</th>
                  <th>Meter Reading</th>
                  <th>Previous Reading</th>
                  <th>Consumption</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReadings.map((r) => (
                  <tr key={r.id}>
                    <td><code>#{r.id.toString().slice(-4)}</code></td>
                    <td><strong>{r.unitNumber}</strong></td>
                    <td>{r.residentName || "—"}</td>
                    <td>{r.date}</td>
                    <td>{r.meterReading} kL</td>
                    <td className="text-muted">{r.previousReading} kL</td>
                    <td style={{ fontWeight: 700, color: "#0284c7" }}>{r.consumptionLiters.toLocaleString()} Liters</td>
                    <td>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Universal Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={readings.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ReadingsPage;
