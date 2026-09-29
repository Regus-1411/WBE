import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dataStore } from "../../services/store";
import "./SuperAdmin.css";

function AllAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const apps = dataStore.getAdminApplications();
    setAdmins(apps);
  }, []);

  const filtered = admins.filter((a) => {
    if (statusFilter === "approved" && a.approvalStatus !== "APPROVED") return false;
    if (statusFilter === "pending" && a.approvalStatus !== "PENDING") return false;
    if (statusFilter === "rejected" && a.approvalStatus !== "REJECTED") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = a.fullName?.toLowerCase().includes(q);
      const matchApt = a.apartmentName?.toLowerCase().includes(q);
      const matchEmail = a.email?.toLowerCase().includes(q);
      if (!matchName && !matchApt && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="superadmin-page" id="all-admins-page">
      <div className="superadmin-header">
        <div>
          <h1 className="superadmin-header__title">
            <span>Apartment Administrators Directory</span>
            <span className="superadmin-badge-pill">👥 Global Admins</span>
          </h1>
          <p className="superadmin-header__subtitle">
            Directory of all society administrators across the entire DROP platform
          </p>
        </div>
      </div>

      <div className="superadmin-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["all", "approved", "pending", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "6px",
                  border: statusFilter === st ? "1px solid #7c3aed" : "1px solid #e2e8f0",
                  background: statusFilter === st ? "#f5f3ff" : "#ffffff",
                  color: statusFilter === st ? "#7c3aed" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  textTransform: "capitalize",
                  cursor: "pointer",
                }}
              >
                {st} ({admins.filter((a) => st === "all" || a.approvalStatus?.toLowerCase() === st).length})
              </button>
            ))}
          </div>

          <div style={{ position: "relative", minWidth: "240px" }}>
            <input
              type="text"
              placeholder="Search admin, society, email..."
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
                <th>Admin Name</th>
                <th>Assigned Society</th>
                <th>Contact Info</th>
                <th>Username</th>
                <th>Account Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((adm) => (
                <tr key={adm.id}>
                  <td>
                    <strong style={{ color: "#0f172a" }}>{adm.fullName}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "#0284c7" }}>{adm.apartmentName}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{adm.city || "Bengaluru"}, {adm.state || "Karnataka"}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.8125rem", color: "#0f172a", fontWeight: 600 }}>{adm.email}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{adm.phone || "—"}</div>
                  </td>
                  <td>
                    <code>@{adm.username}</code>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      adm.approvalStatus === "APPROVED" ? "status-badge--approved" :
                      adm.approvalStatus === "PENDING" ? "status-badge--pending" : "status-badge--rejected"
                    }`}>
                      {adm.approvalStatus === "APPROVED" ? "● Active" :
                       adm.approvalStatus === "PENDING" ? "🟡 Pending Audit" : "❌ Rejected"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Link
                      to="/superadmin/approvals"
                      className="btn-secondary"
                      style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem", textDecoration: "none" }}
                    >
                      Audit Details →
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

export default AllAdminsPage;
