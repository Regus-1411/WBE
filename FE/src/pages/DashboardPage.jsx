import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dataStore } from "../services/store";
import "./DashboardPage.css";

function DashboardPage() {
  const { user } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [readings, setReadings] = useState([]);
  const [bills, setBills] = useState([]);
  const [leaks, setLeaks] = useState([]);
  const [bulkPurchases, setBulkPurchases] = useState([]);

  useEffect(() => {
    setHouseholds(dataStore.getHouseholds());
    setReadings(dataStore.getReadings());
    setBills(dataStore.getBills());
    setLeaks(dataStore.getLeaks());
    setBulkPurchases(dataStore.getBulkPurchases());
  }, []);

  const totalInvoiced = bills.reduce((acc, b) => acc + (b.rawAmount || 0), 0);
  const totalCollected = bills.filter((b) => b.status === "Paid").reduce((acc, b) => acc + (b.rawAmount || 0), 0);
  const pendingCount = bills.filter((b) => b.status === "Unpaid").length;
  const activeLeaksCount = leaks.filter((l) => l.status === "Active").length;
  const totalTankersVolume = bulkPurchases.reduce((acc, p) => acc + (Number(p.quantity || p.capacityKL) || 0), 0);

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
            <span className="dash__stat-value">{pendingCount} Bills</span>
            <span className="dash__stat-change dash__stat-change--alert">Awaiting Settlement</span>
          </div>
        </div>

        <div className="dash__stat-card dash__stat-card--teal">
          <div className="dash__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div className="dash__stat-body">
            <span className="dash__stat-label">External Tankers</span>
            <span className="dash__stat-value">{totalTankersVolume} <small>kL</small></span>
            <span className="dash__stat-change dash__stat-change--down">
              {bulkPurchases.length} Shipments Billed
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
