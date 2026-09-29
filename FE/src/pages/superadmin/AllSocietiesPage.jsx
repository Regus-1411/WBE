import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dataStore } from "../../services/store";
import "./SuperAdmin.css";

function AllSocietiesPage() {
  const [societies, setSocieties] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSocieties(dataStore.getSocieties());
  }, []);

  const filtered = societies.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.adminName?.toLowerCase().includes(q) ||
        s.adminEmail?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="superadmin-page" id="all-societies-page">
      <div className="superadmin-header">
        <div>
          <h1 className="superadmin-header__title">
            <span>Societies & Apartment Communities</span>
            <span className="superadmin-badge-pill">🏢 Multi-Society Oversight</span>
          </h1>
          <p className="superadmin-header__subtitle">
            All onboarded residential apartment societies and water telemetry installations
          </p>
        </div>
      </div>

      <div className="superadmin-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, color: "#475569", fontSize: "0.875rem" }}>
            Total Registered Communities: <strong style={{ color: "#7c3aed" }}>{societies.length}</strong>
          </div>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <input
              type="text"
              placeholder="Search societies or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.45rem 0.75rem 0.45rem 2rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8125rem" }}
            />
            <span style={{ position: "absolute", left: "8px", top: "7px", color: "#94a3b8", fontSize: "0.8125rem" }}>🔍</span>
          </div>
        </div>
      </div>

      <div className="superadmin-card">
        <div style={{ overflowX: "auto" }}>
          <table className="approvals-table">
            <thead>
              <tr>
                <th>Society Name</th>
                <th>Location / Address</th>
                <th>Capacity / Units</th>
                <th>Assigned Administrator</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{s.name}</strong>
                  </td>
                  <td>
                    <div>{s.address}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{s.city}, {s.state}</div>
                  </td>
                  <td>
                    <strong>{s.totalUnits || 50}</strong> Total Flats
                  </td>
                  <td>
                    <strong style={{ color: "#0284c7" }}>{s.adminName || "Assigned Admin"}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{s.adminEmail}</div>
                  </td>
                  <td>
                    <span className="status-badge status-badge--approved">
                      ● Active Infrastructure
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Link
                      to="/admin/dashboard"
                      className="btn-secondary"
                      style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", textDecoration: "none" }}
                    >
                      Inspect Dashboard →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AllSocietiesPage;
