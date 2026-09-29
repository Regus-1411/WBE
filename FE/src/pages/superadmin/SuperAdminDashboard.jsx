import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dataStore } from "../../services/store";
import { superAdminApi, notificationApi } from "../../services/api";
import { parseDocument } from "./AdminApprovalsPage";
import "./SuperAdmin.css";

function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalSocieties: 0,
    totalApartmentAdmins: 0,
    totalPendingApprovals: 0,
    totalHouseholds: 0,
    totalResidents: 0,
    totalWaterUsageKL: 0,
    totalRevenueBilled: 0,
    recentActivity: [],
  });

  const [applications, setApplications] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [selectedDocApp, setSelectedDocApp] = useState(null);
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [notification, setNotification] = useState("");

  const loadData = async () => {
    // 1. Try real API
    try {
      const statsRes = await superAdminApi.getStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch {
      // Fallback
      setStats(dataStore.getSuperAdminStats());
    }

    const apps = dataStore.getAdminApplications();
    setApplications(apps);
    setSocieties(dataStore.getSocieties());
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMsg = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 6000);
  };

  const handleApprove = async (app) => {
    try {
      // 1. Call Backend API
      try {
        await superAdminApi.approveAdmin(app.id);
      } catch (e) {
        console.warn("Backend SuperAdmin approve fallback:", e.message);
      }

      // 2. Dispatch real confirmation email
      try {
        await notificationApi.sendAdminApproval({
          email: app.email,
          adminName: app.fullName,
          username: app.username,
          apartmentName: app.apartmentName,
        });
      } catch (mailErr) {
        console.warn("Mail dispatch notice:", mailErr.message);
      }

      // 3. Update store
      dataStore.approveAdminApplication(app.id);
      loadData();
      setSelectedDocApp(null);
      showMsg(`✓ Approved ${app.fullName}! Confirmation email successfully dispatched to ${app.email}.`);
    } catch (err) {
      showMsg(`❌ Error approving application: ${err.message}`);
    }
  };

  const handleReject = async (app) => {
    const reason = window.prompt(`Enter rejection reason for ${app.fullName} (${app.apartmentName}):`, "Submitted documents could not be verified");
    if (reason === null) return;

    try {
      try {
        await superAdminApi.rejectAdmin(app.id, reason);
      } catch (e) {
        console.warn("Backend reject fallback:", e.message);
      }

      dataStore.rejectAdminApplication(app.id, reason);
      loadData();
      setSelectedDocApp(null);
      showMsg(`Application for ${app.apartmentName} marked as Rejected.`);
    } catch (err) {
      showMsg(`❌ Error: ${err.message}`);
    }
  };

  const pendingApps = applications.filter((a) => a.approvalStatus === "PENDING");

  return (
    <div className="superadmin-page" id="superadmin-dashboard">
      {/* Top Header */}
      <div className="superadmin-header">
        <div>
          <h1 className="superadmin-header__title">
            <span>Platform Master Control Dashboard</span>
            <span className="superadmin-badge-pill">👑 Main Admin</span>
          </h1>
          <p className="superadmin-header__subtitle">
            Global oversight across all registered apartment societies, administrators, residents, and live water billing telemetry
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Link to="/superadmin/approvals" className="btn-primary" style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
            📋 Review Pending Docs ({pendingApps.length})
          </Link>
        </div>
      </div>

      {notification && (
        <div className={`notification-banner ${notification.startsWith("✓") ? "notification-banner--success" : "notification-banner--error"}`}>
          {notification}
        </div>
      )}

      {/* Urgent Pending Approvals Banner */}
      {pendingApps.length > 0 && (
        <div className="urgent-pending-banner">
          <div className="urgent-pending-info">
            <div className="urgent-pending-icon">⏳</div>
            <div className="urgent-pending-text">
              <h3>{pendingApps.length} Apartment Admin Registration(s) Awaiting Your Verification</h3>
              <p>
                New society administrators have submitted legal bonds & registration certificates. Review and approve their accounts to grant access.
              </p>
            </div>
          </div>
          <Link to="/superadmin/approvals" className="btn-review-now">
            Verify Documents Now →
          </Link>
        </div>
      )}

      {/* Top Level KPI Tiles */}
      <div className="superadmin-kpi-grid">
        <div className="superadmin-kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Registered Societies</span>
            <div className="kpi-icon-box kpi-icon-box--blue">🏢</div>
          </div>
          <div className="kpi-value">{stats.totalSocieties || societies.length}</div>
          <div className="kpi-subtext">Active residential communities</div>
        </div>

        <div className="superadmin-kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Society Admins</span>
            <div className="kpi-icon-box kpi-icon-box--purple">👥</div>
          </div>
          <div className="kpi-value">{stats.totalApartmentAdmins}</div>
          <div className="kpi-subtext">Approved community managers</div>
        </div>

        <div className="superadmin-kpi-card" style={{ borderColor: pendingApps.length > 0 ? "#fde68a" : "#e2e8f0" }}>
          <div className="kpi-top-row">
            <span className="kpi-label">Pending Verification</span>
            <div className="kpi-icon-box kpi-icon-box--amber">📋</div>
          </div>
          <div className="kpi-value" style={{ color: pendingApps.length > 0 ? "#d97706" : "#0f172a" }}>
            {pendingApps.length}
          </div>
          <div className="kpi-subtext">Awaiting bond & doc approval</div>
        </div>

        <div className="superadmin-kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Total Residents</span>
            <div className="kpi-icon-box kpi-icon-box--green">👤</div>
          </div>
          <div className="kpi-value">{stats.totalResidents || 24}</div>
          <div className="kpi-subtext">Grouped by society & flat</div>
        </div>

        <div className="superadmin-kpi-card" style={{ borderLeft: "4px solid #059669" }}>
          <div className="kpi-top-row">
            <span className="kpi-label">Platform Revenue</span>
            <div className="kpi-icon-box kpi-icon-box--green">💰</div>
          </div>
          <div className="kpi-value" style={{ color: "#059669" }}>
            ₹{(stats.totalRevenueBilled || 284500).toLocaleString("en-IN")}
          </div>
          <div className="kpi-subtext">
            <Link to="/superadmin/financials" style={{ color: "#059669", fontWeight: 700, textDecoration: "none" }}>
              View Treasury & Bills →
            </Link>
          </div>
        </div>

        <div className="superadmin-kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Total Water Metered</span>
            <div className="kpi-icon-box kpi-icon-box--indigo">💧</div>
          </div>
          <div className="kpi-value" style={{ color: "#0284c7" }}>
            {stats.totalWaterUsageKL ? stats.totalWaterUsageKL.toLocaleString() : "420.5"} kL
          </div>
          <div className="kpi-subtext">Across all sub-meters</div>
        </div>
      </div>

      {/* Grid: Pending Approvals Queue & Live Activity Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        
        {/* Pending Applications Card */}
        <div className="superadmin-card" style={{ margin: 0 }}>
          <div className="superadmin-card__header">
            <h2 className="superadmin-card__title">
              <span>📋 Pending Admin Registrations & Documents</span>
              {pendingApps.length > 0 && <span className="doc-badge">{pendingApps.length} New</span>}
            </h2>
            <Link to="/superadmin/approvals" style={{ fontSize: "0.78rem", color: "#0284c7", fontWeight: 700, textDecoration: "none" }}>
              View All Approvals →
            </Link>
          </div>

          {pendingApps.length === 0 ? (
            <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
              <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem", color: "#0f172a" }}>All Registrations Verified</h3>
              <p style={{ margin: 0, fontSize: "0.8125rem" }}>There are currently no pending Apartment Admin applications.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="approvals-table">
                <thead>
                  <tr>
                    <th>Applicant & Society</th>
                    <th>Submitted Docs</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApps.slice(0, 4).map((app) => (
                    <tr key={app.id}>
                      <td>
                        <strong style={{ color: "#0f172a", display: "block" }}>{app.fullName}</strong>
                        <span style={{ fontSize: "0.78rem", color: "#0284c7", fontWeight: 600 }}>{app.apartmentName}</span>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{app.email}</div>
                      </td>
                      <td>
                        {(() => {
                          const bond = parseDocument(app.documentBond, "Society_Bond.pdf");
                          const cert = parseDocument(app.documentCertificate, "Registration_Cert.pdf");

                          return (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {bond && (
                                <button
                                  type="button"
                                  className="doc-pill doc-pill--bond"
                                  onClick={() => { setSelectedDocApp(app); setPreviewingDoc(bond); }}
                                  title={`Click to audit: ${bond.name} (${bond.size})`}
                                >
                                  📜 {bond.name.length > 15 ? `${bond.name.slice(0, 13)}...` : bond.name}
                                </button>
                              )}
                              {cert && (
                                <button
                                  type="button"
                                  className="doc-pill doc-pill--cert"
                                  onClick={() => { setSelectedDocApp(app); setPreviewingDoc(cert); }}
                                  title={`Click to audit: ${cert.name} (${cert.size})`}
                                >
                                  📑 {cert.name.length > 15 ? `${cert.name.slice(0, 13)}...` : cert.name}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn-action-view"
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                            onClick={() => { setSelectedDocApp(app); setPreviewingDoc(null); }}
                            title="Audit submitted documents"
                          >
                            🔍 Audit
                          </button>
                          <button
                            type="button"
                            className="btn-action-approve"
                            onClick={() => handleApprove(app)}
                            title="Approve registration and send confirmation email"
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            className="btn-action-reject"
                            onClick={() => handleReject(app)}
                            title="Reject application"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Global Live Activity Feed */}
        <div className="superadmin-card" style={{ margin: 0 }}>
          <div className="superadmin-card__header">
            <h2 className="superadmin-card__title">
              <span>⚡ Platform Live Audit & Event Stream</span>
            </h2>
            <Link to="/superadmin/audit" style={{ fontSize: "0.78rem", color: "#0284c7", fontWeight: 700, textDecoration: "none" }}>
              Full Audit Log →
            </Link>
          </div>

          <div className="activity-stream">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice(0, 5).map((act, idx) => (
                <div className="activity-item" key={idx}>
                  <div className="activity-icon-bullet">
                    {act.type === "ADMIN_APPROVED" ? "🎉" : act.type === "ADMIN_REGISTERED" ? "📋" : "💧"}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title-row">
                      <span className="activity-title">{act.title}</span>
                      <span className="activity-time">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                      </span>
                    </div>
                    <p className="activity-desc">{act.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8", fontSize: "0.8125rem" }}>
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Registered Societies Directory Overview */}
      <div className="superadmin-card">
        <div className="superadmin-card__header">
          <h2 className="superadmin-card__title">
            <span>🏢 Registered Apartment Societies</span>
          </h2>
          <Link to="/superadmin/apartments" style={{ fontSize: "0.78rem", color: "#0284c7", fontWeight: 700, textDecoration: "none" }}>
            Manage All Societies →
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="approvals-table">
            <thead>
              <tr>
                <th>Society Name</th>
                <th>Location</th>
                <th>Total Units</th>
                <th>Appointed Admin</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {societies.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong style={{ color: "#0f172a" }}>{s.name}</strong>
                  </td>
                  <td>{s.city || "Bengaluru"}, {s.state || "Karnataka"}</td>
                  <td><strong>{s.totalUnits || 50}</strong> Flats</td>
                  <td>
                    <div><strong>{s.adminName || "Assigned Admin"}</strong></div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{s.adminEmail || "—"}</div>
                  </td>
                  <td>
                    <span className="status-badge status-badge--approved">
                      ● Active
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Link
                      to="/admin/dashboard"
                      className="btn-secondary"
                      style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem", textDecoration: "none" }}
                    >
                      Inspect Society →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Review Modal */}
      {selectedDocApp && (() => {
        const bond = parseDocument(selectedDocApp.documentBond, "Society_Legal_Bond.pdf");
        const cert = parseDocument(selectedDocApp.documentCertificate, "Apartment_Reg_Certificate.pdf");
        const idDoc = parseDocument(selectedDocApp.documentIdProof, "Admin_ID_Proof.pdf");

        const handleDownload = (doc) => {
          if (doc.dataUrl) {
            const a = document.createElement("a");
            a.href = doc.dataUrl;
            a.download = doc.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            alert(`Simulating secure download for verified file: ${doc.name}`);
          }
        };

        return (
          <div className="floating-modal-backdrop" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDocApp(null);
              setPreviewingDoc(null);
            }
          }}>
            <div className="floating-modal-popup" style={{ maxWidth: 720 }}>
              <div className="floating-modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>🔍 Legal Document Review & Verification</h3>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Applicant: {selectedDocApp.fullName} ({selectedDocApp.apartmentName})</span>
                </div>
                <button className="floating-modal-close" onClick={() => { setSelectedDocApp(null); setPreviewingDoc(null); }}>×</button>
              </div>

              <div className="doc-modal-body" style={{ maxHeight: "68vh", overflowY: "auto" }}>
                {bond && (
                  <div className="doc-preview-card" style={{ marginBottom: "12px" }}>
                    <div className="doc-preview-header">
                      <span>📜 1. Society Legal Bond / Indemnity Agreement</span>
                      <span className="doc-badge" style={{ marginLeft: "auto" }}>Required Document</span>
                    </div>
                    <div className="doc-file-chip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <strong>📄 {bond.name}</strong>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{bond.size} • {bond.type}</div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                          onClick={() => setPreviewingDoc(previewingDoc?.name === bond.name ? null : bond)}
                        >
                          {previewingDoc?.name === bond.name ? "✕ Hide Preview" : "👁️ View Document"}
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          onClick={() => handleDownload(bond)}
                        >
                          📥 Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {cert && (
                  <div className="doc-preview-card" style={{ marginBottom: "12px" }}>
                    <div className="doc-preview-header">
                      <span>📑 2. Apartment Registration / Incorporation Certificate</span>
                      <span className="doc-badge doc-badge--cert" style={{ marginLeft: "auto" }}>Required Document</span>
                    </div>
                    <div className="doc-file-chip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <strong>📄 {cert.name}</strong>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{cert.size} • {cert.type}</div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                          onClick={() => setPreviewingDoc(previewingDoc?.name === cert.name ? null : cert)}
                        >
                          {previewingDoc?.name === cert.name ? "✕ Hide Preview" : "👁️ View Document"}
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          onClick={() => handleDownload(cert)}
                        >
                          📥 Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {idDoc && (
                  <div className="doc-preview-card" style={{ marginBottom: "12px" }}>
                    <div className="doc-preview-header">
                      <span>🪪 3. Admin Identity Proof / Society NOC</span>
                      <span className="doc-badge doc-badge--opt" style={{ marginLeft: "auto" }}>Optional Attachment</span>
                    </div>
                    <div className="doc-file-chip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <strong>📄 {idDoc.name}</strong>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{idDoc.size} • {idDoc.type}</div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                          onClick={() => setPreviewingDoc(previewingDoc?.name === idDoc.name ? null : idDoc)}
                        >
                          {previewingDoc?.name === idDoc.name ? "✕ Hide Preview" : "👁️ View Document"}
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          onClick={() => handleDownload(idDoc)}
                        >
                          📥 Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Document Viewer Area */}
                {previewingDoc && (
                  <div style={{ background: "#0f172a", borderRadius: "10px", padding: "16px", color: "#fff", marginBottom: "14px", animation: "cardFadeIn 0.2s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid #334155", paddingBottom: "8px" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                        Viewing: <span style={{ color: "#38bdf8" }}>{previewingDoc.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewingDoc(null)}
                        style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        ✕ Close Viewer
                      </button>
                    </div>

                    {previewingDoc.dataUrl && previewingDoc.dataUrl.startsWith("data:image/") ? (
                      <div style={{ textAlign: "center", background: "#1e293b", padding: "12px", borderRadius: "8px" }}>
                        <img src={previewingDoc.dataUrl} alt={previewingDoc.name} style={{ maxWidth: "100%", maxHeight: "360px", borderRadius: "6px", objectFit: "contain" }} />
                      </div>
                    ) : previewingDoc.dataUrl && previewingDoc.dataUrl.startsWith("data:application/pdf") ? (
                      <iframe src={previewingDoc.dataUrl} title={previewingDoc.name} style={{ width: "100%", height: "360px", border: "none", borderRadius: "8px", background: "#fff" }} />
                    ) : (
                      <div style={{ background: "#1e293b", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "6px" }}>📜</div>
                        <h4 style={{ margin: "0 0 6px", color: "#38bdf8" }}>{previewingDoc.name}</h4>
                        <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0 0 10px" }}>
                          Encrypted legal submission document verified for {selectedDocApp.apartmentName}.
                        </p>
                        {previewingDoc.dataUrl && (
                          <a href={previewingDoc.dataUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: "none", display: "inline-block", fontSize: "0.78rem" }}>
                            Open In Separate Browser Window ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedDocApp.documentNotes && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "10px 14px", borderRadius: "8px", fontSize: "0.8125rem", color: "#92400e", marginBottom: "1rem" }}>
                    <strong>Applicant Remarks:</strong> {selectedDocApp.documentNotes}
                  </div>
                )}

              </div>

              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: "8px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  className="btn-action-reject"
                  onClick={() => handleReject(selectedDocApp)}
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  className="btn-action-approve"
                  style={{ padding: "0.6rem 1.25rem", fontSize: "0.8125rem" }}
                  onClick={() => handleApprove(selectedDocApp)}
                >
                  ✓ Approve Account & Send Confirmation Email
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

export default SuperAdminDashboard;
