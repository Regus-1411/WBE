import { useState, useEffect } from "react";
import { dataStore } from "../../services/store";
import { superAdminApi, notificationApi } from "../../services/api";
import "./SuperAdmin.css";

export function parseDocument(rawDoc, defaultTitle = "Document.pdf") {
  if (!rawDoc) return null;
  if (typeof rawDoc === "object") {
    return {
      name: rawDoc.name || defaultTitle,
      size: rawDoc.size || "Attached",
      type: rawDoc.type || (rawDoc.name?.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
      dataUrl: rawDoc.dataUrl || rawDoc.data || null,
      uploadedAt: rawDoc.uploadedAt || null,
    };
  }
  try {
    const parsed = JSON.parse(rawDoc);
    if (parsed && typeof parsed === "object") {
      return {
        name: parsed.name || defaultTitle,
        size: parsed.size || "Attached",
        type: parsed.type || (parsed.name?.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
        dataUrl: parsed.dataUrl || parsed.data || null,
        uploadedAt: parsed.uploadedAt || null,
      };
    }
  } catch (e) {
    // Not JSON string
  }
  if (typeof rawDoc === "string") {
    if (rawDoc.startsWith("data:")) {
      return {
        name: defaultTitle,
        size: "Uploaded File",
        type: rawDoc.includes("application/pdf") ? "application/pdf" : "image/jpeg",
        dataUrl: rawDoc,
        uploadedAt: null,
      };
    }
    return {
      name: rawDoc,
      size: "Verified Document",
      type: rawDoc.endsWith(".pdf") ? "application/pdf" : (rawDoc.match(/\.(jpg|jpeg|png|webp)$/i) ? "image/jpeg" : "application/octet-stream"),
      dataUrl: null,
      uploadedAt: null,
    };
  }
  return null;
}

function AdminApprovalsPage() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "approved" | "rejected"
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [previewingDoc, setPreviewingDoc] = useState(null); // active document being viewed
  const [notification, setNotification] = useState("");

  const loadData = async () => {
    let localList = dataStore.getAdminApplications();
    try {
      const res = await superAdminApi.getAllAdmins();
      if (res.success && Array.isArray(res.data)) {
        // Merge backend admins into local list
        res.data.forEach((beAdmin) => {
          const matchIdx = localList.findIndex(
            (l) => l.username?.toLowerCase() === beAdmin.username?.toLowerCase() ||
                   l.email?.toLowerCase() === beAdmin.email?.toLowerCase()
          );
          if (matchIdx >= 0) {
            localList[matchIdx] = {
              ...localList[matchIdx],
              id: beAdmin.id,
              approvalStatus: beAdmin.approvalStatus || localList[matchIdx].approvalStatus,
              isActive: beAdmin.isActive !== undefined ? beAdmin.isActive : localList[matchIdx].isActive,
            };
          } else {
            localList.push({
              id: beAdmin.id,
              username: beAdmin.username,
              email: beAdmin.email,
              fullName: beAdmin.fullName,
              phone: beAdmin.phone,
              apartmentName: beAdmin.apartmentName || "Society",
              societyAddress: beAdmin.societyAddress,
              city: beAdmin.city,
              state: beAdmin.state,
              totalUnits: beAdmin.totalUnits,
              approvalStatus: beAdmin.approvalStatus || "PENDING",
              documentBond: beAdmin.documentBond || "Society_Bond.pdf",
              documentCertificate: beAdmin.documentCertificate || "Certificate.pdf",
              documentIdProof: beAdmin.documentIdProof || "ID_Proof.pdf",
              documentNotes: beAdmin.documentNotes || "",
              rejectionReason: beAdmin.rejectionReason,
              isActive: beAdmin.isActive || false,
              createdAt: beAdmin.createdAt || new Date().toISOString(),
              approvedAt: beAdmin.approvedAt,
            });
          }
        });
      }
    } catch (err) {
      console.warn("Backend load admins fallback:", err.message);
    }
    setApplications([...localList]);
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
      // 1. Backend approval
      if (typeof app.id === "number" || (!isNaN(app.id) && String(app.id).indexOf("APP-") === -1)) {
        try {
          await superAdminApi.approveAdmin(app.id);
        } catch (e) {
          console.warn("Backend approve by ID failed, continuing:", e.message);
        }
      } else {
        // Try to find numeric ID from backend
        try {
          const adminsRes = await superAdminApi.getAllAdmins();
          if (adminsRes.success && Array.isArray(adminsRes.data)) {
            const found = adminsRes.data.find(
              (u) => u.username?.toLowerCase() === app.username?.toLowerCase() ||
                     u.email?.toLowerCase() === app.email?.toLowerCase()
            );
            if (found && found.id) {
              await superAdminApi.approveAdmin(found.id);
            }
          }
        } catch (e) {
          console.warn("Backend approve by lookup failed, continuing:", e.message);
        }
      }

      // 2. Dispatch confirmation email
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

      // 3. Update local state store (single call handles id/username/email matching)
      dataStore.approveAdminApplication(app.id);
      await loadData();
      setSelectedApp(null);
      showMsg(`✓ Verified & Approved ${app.fullName}! Confirmation email sent to ${app.email}.`);
    } catch (err) {
      showMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleReject = async (app) => {
    const reason = window.prompt(`Enter rejection reason for ${app.fullName}:`, "Submitted documents could not be verified");
    if (reason === null) return;

    try {
      if (typeof app.id === "number") {
        try {
          await superAdminApi.rejectAdmin(app.id, reason);
        } catch (e) {
          console.warn("Backend reject fallback:", e.message);
        }
      }

      dataStore.rejectAdminApplication(app.id, reason);
      dataStore.rejectAdminApplication(app.username, reason);
      await loadData();
      setSelectedApp(null);
      showMsg(`Application for ${app.apartmentName} marked as Rejected.`);
    } catch (err) {
      showMsg(`❌ Error: ${err.message}`);
    }
  };

  const filtered = applications.filter((a) => {
    if (filter === "pending" && a.approvalStatus !== "PENDING") return false;
    if (filter === "approved" && a.approvalStatus !== "APPROVED") return false;
    if (filter === "rejected" && a.approvalStatus !== "REJECTED") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = a.fullName?.toLowerCase().includes(q);
      const matchApt = a.apartmentName?.toLowerCase().includes(q);
      const matchEmail = a.email?.toLowerCase().includes(q);
      const matchUser = a.username?.toLowerCase().includes(q);
      if (!matchName && !matchApt && !matchEmail && !matchUser) return false;
    }

    return true;
  });

  const pendingCount = applications.filter((a) => a.approvalStatus === "PENDING").length;

  return (
    <div className="superadmin-page" id="admin-approvals-page">
      <div className="superadmin-header">
        <div>
          <h1 className="superadmin-header__title">
            <span>Apartment Admin Verification & Approvals</span>
            <span className="superadmin-badge-pill">📋 Document Audit</span>
          </h1>
          <p className="superadmin-header__subtitle">
            Review legal document submissions (Society Bond, Apartment Registration Certificate), audit credentials, and activate accounts
          </p>
        </div>
      </div>

      {notification && (
        <div className={`notification-banner ${notification.startsWith("✓") ? "notification-banner--success" : "notification-banner--error"}`}>
          {notification}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="superadmin-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Applications", count: applications.length },
              { id: "pending", label: "Pending Verification", count: pendingCount },
              { id: "approved", label: "Approved & Active", count: applications.filter((a) => a.approvalStatus === "APPROVED").length },
              { id: "rejected", label: "Rejected", count: applications.filter((a) => a.approvalStatus === "REJECTED").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "6px",
                  border: filter === tab.id ? "1px solid #7c3aed" : "1px solid #e2e8f0",
                  background: filter === tab.id ? "#f5f3ff" : "#ffffff",
                  color: filter === tab.id ? "#7c3aed" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div style={{ position: "relative", minWidth: "260px" }}>
            <input
              type="text"
              placeholder="Search applicant, society, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.45rem 0.75rem 0.45rem 2rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8125rem" }}
            />
            <span style={{ position: "absolute", left: "8px", top: "7px", color: "#94a3b8", fontSize: "0.8125rem" }}>🔍</span>
          </div>
        </div>
      </div>

      {/* Applications Directory Table */}
      <div className="superadmin-card">
        {filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <h3>No Applications Found</h3>
            <p>No registration requests match the selected filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="approvals-table">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Society & Location</th>
                  <th>Submitted Legal Documents</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{app.fullName}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Username: <code>@{app.username}</code></div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0284c7" }}>{app.apartmentName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {app.city || "Bengaluru"}, {app.state || "Karnataka"} • {app.totalUnits || 50} Units
                      </div>
                      {app.societyRegistrationNumber && (
                        <div style={{ fontSize: "0.7rem", color: "#475569" }}>Reg #: {app.societyRegistrationNumber}</div>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const bond = parseDocument(app.documentBond, "Society_Bond.pdf");
                        const cert = parseDocument(app.documentCertificate, "Registration_Cert.pdf");
                        const idDoc = parseDocument(app.documentIdProof, "ID_Proof.pdf");

                        return (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {bond && (
                              <button
                                type="button"
                                className="doc-pill doc-pill--bond"
                                onClick={() => { setSelectedApp(app); setPreviewingDoc(bond); }}
                                title={`Click to audit: ${bond.name} (${bond.size})`}
                              >
                                📜 {bond.name.length > 20 ? `${bond.name.slice(0, 18)}...` : bond.name}
                              </button>
                            )}
                            {cert && (
                              <button
                                type="button"
                                className="doc-pill doc-pill--cert"
                                onClick={() => { setSelectedApp(app); setPreviewingDoc(cert); }}
                                title={`Click to audit: ${cert.name} (${cert.size})`}
                              >
                                📑 {cert.name.length > 20 ? `${cert.name.slice(0, 18)}...` : cert.name}
                              </button>
                            )}
                            {idDoc && (
                              <button
                                type="button"
                                className="doc-pill"
                                onClick={() => { setSelectedApp(app); setPreviewingDoc(idDoc); }}
                                title={`Click to audit: ${idDoc.name} (${idDoc.size})`}
                              >
                                🪪 ID Proof
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8125rem", color: "#0f172a", fontWeight: 600 }}>{app.email}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{app.phone || "—"}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        app.approvalStatus === "APPROVED" ? "status-badge--approved" :
                        app.approvalStatus === "PENDING" ? "status-badge--pending" : "status-badge--rejected"
                      }`}>
                        {app.approvalStatus === "APPROVED" ? "✓ Approved & Active" :
                         app.approvalStatus === "PENDING" ? "🟡 Pending Verification" : "❌ Rejected"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn-action-view"
                          onClick={() => { setSelectedApp(app); setPreviewingDoc(null); }}
                        >
                          🔍 Audit Docs
                        </button>
                        {app.approvalStatus === "PENDING" && (
                          <>
                            <button
                              type="button"
                              className="btn-action-approve"
                              onClick={() => handleApprove(app)}
                              title="Approve and send confirmation email"
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              className="btn-action-reject"
                              onClick={() => handleReject(app)}
                              title="Reject registration"
                            >
                              Reject
                            </button>
                          </>
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

      {/* Document Review Modal */}
      {selectedApp && (() => {
        const bond = parseDocument(selectedApp.documentBond, "Society_Legal_Bond.pdf");
        const cert = parseDocument(selectedApp.documentCertificate, "Apartment_Reg_Certificate.pdf");
        const idDoc = parseDocument(selectedApp.documentIdProof, "Admin_ID_Proof.pdf");

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
              setSelectedApp(null);
              setPreviewingDoc(null);
            }
          }}>
            <div className="floating-modal-popup" style={{ maxWidth: 720 }}>
              <div className="floating-modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>🔍 Legal Document Verification & Audit</h3>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{selectedApp.fullName} — {selectedApp.apartmentName}</span>
                </div>
                <button className="floating-modal-close" onClick={() => { setSelectedApp(null); setPreviewingDoc(null); }}>×</button>
              </div>

              <div className="doc-modal-body" style={{ maxHeight: "68vh", overflowY: "auto" }}>
                <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.8125rem" }}>
                  <div>Society: <strong>{selectedApp.apartmentName}</strong></div>
                  <div>Reg #: <strong>{selectedApp.societyRegistrationNumber || "REG-2026"}</strong></div>
                  <div>Admin: <strong>{selectedApp.fullName}</strong></div>
                  <div>Email: <strong>{selectedApp.email}</strong></div>
                  <div>Location: <strong>{selectedApp.city || "Bengaluru"}, {selectedApp.state || "Karnataka"}</strong></div>
                  <div>Flats / Units: <strong>{selectedApp.totalUnits || 50} Flats</strong></div>
                </div>

                {/* Document 1: Bond */}
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

                {/* Document 2: Certificate */}
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

                {/* Document 3: ID Proof */}
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
                          Encrypted legal submission document verified for {selectedApp.apartmentName}.
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

                {selectedApp.documentNotes && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "10px 14px", borderRadius: "8px", fontSize: "0.8125rem", color: "#92400e", marginBottom: "1rem" }}>
                    <strong>Applicant Remarks:</strong> {selectedApp.documentNotes}
                  </div>
                )}

              </div>

              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: "8px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                {selectedApp.approvalStatus === "PENDING" ? (
                  <>
                    <button
                      type="button"
                      className="btn-action-reject"
                      onClick={() => handleReject(selectedApp)}
                    >
                      Reject Application
                    </button>
                    <button
                      type="button"
                      className="btn-action-approve"
                      style={{ padding: "0.6rem 1.25rem", fontSize: "0.8125rem" }}
                      onClick={() => handleApprove(selectedApp)}
                    >
                      ✓ Approve Account & Send Confirmation Email
                    </button>
                  </>
                ) : (
                  <button className="btn-secondary" onClick={() => { setSelectedApp(null); setPreviewingDoc(null); }}>Close</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default AdminApprovalsPage;
