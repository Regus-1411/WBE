import { useState, useEffect } from "react";
import { dataStore } from "../../services/store";
import "./SuperAdmin.css";

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLogs(dataStore.getAuditLogs());
  }, []);

  const filtered = logs.filter((l) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.title?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.user?.toLowerCase().includes(q) ||
        l.type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="superadmin-page" id="audit-logs-page">
      <div className="superadmin-header">
        <div>
          <h1 className="superadmin-header__title">
            <span>System Audit & Platform Activity Log</span>
            <span className="superadmin-badge-pill">⚡ Live Event Feed</span>
          </h1>
          <p className="superadmin-header__subtitle">
            Comprehensive audit trail of administrator registrations, document approvals, billing issuances, and platform modifications
          </p>
        </div>
      </div>

      <div className="superadmin-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, color: "#475569", fontSize: "0.875rem" }}>
            Total Recorded Events: <strong style={{ color: "#7c3aed" }}>{logs.length}</strong>
          </div>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <input
              type="text"
              placeholder="Search event title, user, or desc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.45rem 0.75rem 0.45rem 2rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8125rem" }}
            />
            <span style={{ position: "absolute", left: "8px", top: "7px", color: "#94a3b8", fontSize: "0.8125rem" }}>🔍</span>
          </div>
        </div>
      </div>

      <div className="superadmin-card">
        <div className="activity-stream" style={{ padding: "1.5rem" }}>
          {filtered.map((item, idx) => (
            <div className="activity-item" key={item.id || idx}>
              <div className="activity-icon-bullet" style={{ background: item.type === "ADMIN_APPROVED" ? "#dcfce7" : item.type === "ADMIN_REGISTERED" ? "#fef3c7" : "#f0f9ff" }}>
                {item.type === "ADMIN_APPROVED" ? "🎉" : item.type === "ADMIN_REGISTERED" ? "📋" : item.type === "ADMIN_REJECTED" ? "❌" : "🛡️"}
              </div>
              <div className="activity-content">
                <div className="activity-title-row">
                  <span className="activity-title" style={{ fontSize: "0.95rem" }}>{item.title}</span>
                  <span className="activity-time">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                  </span>
                </div>
                <p className="activity-desc" style={{ fontSize: "0.85rem", color: "#475569", margin: "4px 0" }}>
                  {item.description}
                </p>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Initiator: <code>{item.user || "System"}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AuditLogsPage;
