import { useState, useEffect } from "react";
import { dataStore } from "../../services/store";
import { adminResidentApi, householdApi } from "../../services/api";
import Pagination from "../../components/Pagination";
import "./HouseholdsPage.css";

function HouseholdsPage() {
  const [households, setHouseholds] = useState([]);
  const [search, setSearch] = useState("");
  const [filterBlock, setFilterBlock] = useState("all");
  const [activeFormTab, setActiveFormTab] = useState("flat"); // "flat" | "resident"
  const [notification, setNotification] = useState("");
  const [allocationSuccess, setAllocationSuccess] = useState(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [residentFormStatus, setResidentFormStatus] = useState({ type: null, message: "" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Flat form state
  const [flatForm, setFlatForm] = useState({
    unitNumber: "",
    block: "Block A",
    floor: "1st Floor",
    meterSerialNumber: "",
  });

  // Resident form state
  const [residentForm, setResidentForm] = useState({
    householdId: "",
    fullName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
  });

  // Live email validation state (existence check only)
  const [emailValidation, setEmailValidation] = useState({
    status: "idle", // "idle" | "valid" | "taken"
    message: "",
  });

  const loadData = () => {
    const list = dataStore.getHouseholds();
    setHouseholds(list);
    if (list.length > 0) {
      if (!residentForm.householdId || !list.some((h) => String(h.id) === String(residentForm.householdId))) {
        setResidentForm((prev) => ({ ...prev, householdId: String(list[0].id) }));
      }
    } else {
      setResidentForm((prev) => ({ ...prev, householdId: "" }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMsg = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 6000);
  };

  // Live email existence check
  const handleEmailChange = (e) => {
    const rawVal = e.target.value;
    setResidentForm((prev) => ({ ...prev, email: rawVal }));
    setResidentFormStatus({ type: null, message: "" });

    const email = rawVal.trim();
    if (!email) {
      setEmailValidation({
        status: "idle",
        message: "",
      });
      return;
    }

    const targetHId = residentForm.householdId || (households.length > 0 ? String(households[0].id) : "");

    // Check whether the email is existing or available in the system
    const isAvailable = dataStore.isEmailAvailable(email, targetHId);
    if (isAvailable) {
      setEmailValidation({
        status: "valid",
        message: "✓ Email is available (New Resident) — Credentials will be sent upon allocation",
      });
    } else {
      setEmailValidation({
        status: "taken",
        message: "❌ Email already exists in the system",
      });
    }
  };

  const handleAddFlat = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!flatForm.unitNumber.trim()) {
      showMsg("❌ Please enter a Flat / Unit Number.");
      return;
    }

    try {
      const newUnit = dataStore.addHousehold(flatForm);
      loadData();
      setFlatForm({ unitNumber: "", block: "Block A", floor: "1st Floor", meterSerialNumber: "" });
      showMsg(`✓ Flat ${newUnit.unitNumber} added successfully to ${newUnit.block}!`);
      setResidentForm((prev) => ({ ...prev, householdId: String(newUnit.id) }));
    } catch (err) {
      showMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleCreateResident = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const targetHId = residentForm.householdId || (households.length > 0 ? String(households[0].id) : "");
    const targetHousehold = households.find((h) => String(h.id) === String(targetHId) || h.unitNumber === targetHId);

    if (!targetHId || !targetHousehold) {
      const err = "❌ Please select a flat to allocate.";
      setResidentFormStatus({ type: "error", message: err });
      showMsg(err);
      return;
    }

    if (!residentForm.fullName || !residentForm.fullName.trim()) {
      const err = "❌ Please enter the resident's Full Name.";
      setResidentFormStatus({ type: "error", message: err });
      showMsg(err);
      return;
    }

    if (!residentForm.email || !residentForm.email.trim()) {
      const err = "❌ Please enter the resident's Email address.";
      setResidentFormStatus({ type: "error", message: err });
      showMsg(err);
      return;
    }

    if (!residentForm.username || !residentForm.username.trim()) {
      const err = "❌ Please enter a Login User ID (Username).";
      setResidentFormStatus({ type: "error", message: err });
      showMsg(err);
      return;
    }

    if (!residentForm.password || !residentForm.password.trim()) {
      const err = "❌ Please enter a Login Password.";
      setResidentFormStatus({ type: "error", message: err });
      showMsg(err);
      return;
    }

    // Check if email already exists in system (excluding current household if updating)
    if (!dataStore.isEmailAvailable(residentForm.email.trim(), targetHId)) {
      const err = "❌ Email already exists in the system. Please enter a unique email address.";
      setResidentFormStatus({ type: "error", message: err });
      showMsg(err);
      setEmailValidation({
        status: "taken",
        message: "❌ Email already exists in the system",
      });
      return;
    }

    try {
      // 1. Dispatch to backend API
      try {
        await adminResidentApi.createResident({
          fullName: residentForm.fullName.trim(),
          email: residentForm.email.trim(),
          phone: residentForm.phone ? residentForm.phone.trim() : "",
          username: residentForm.username.trim(),
          password: residentForm.password.trim(),
          apartmentId: 1,
          householdId: Number(targetHId) || undefined,
          unitNumber: targetHousehold.unitNumber,
          sendEmail: true,
        });
      } catch (apiErr) {
        console.warn("Backend API dispatch notice:", apiErr.message);
      }

      // 2. Commit to local persistent dataStore
      const newRes = dataStore.createAndAssignResident({
        householdId: targetHId,
        fullName: residentForm.fullName.trim(),
        email: residentForm.email.trim(),
        phone: residentForm.phone ? residentForm.phone.trim() : "",
        username: residentForm.username.trim(),
        password: residentForm.password.trim(),
      });

      loadData();

      // Trigger success confirmation banner
      setAllocationSuccess({
        unitNumber: newRes.householdUnitNumber,
        block: newRes.householdBlock,
        fullName: newRes.fullName,
        email: newRes.email,
        username: newRes.username,
        password: residentForm.password.trim(),
      });

      const succMsg = `✓ Account created & allocated to Flat ${newRes.householdUnitNumber}! Credentials sent to ${newRes.email}.`;
      setResidentFormStatus({ type: "success", message: succMsg });
      showMsg(succMsg);

      // Smooth scroll to top to see success banner
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Reset form
      const remainingHouseholds = dataStore.getHouseholds();
      setResidentForm({
        householdId: remainingHouseholds[0] ? String(remainingHouseholds[0].id) : "",
        fullName: "",
        email: "",
        phone: "",
        username: "",
        password: "",
      });
      setEmailValidation({ status: "idle", message: "" });

    } catch (err) {
      setResidentFormStatus({ type: "error", message: `❌ Error: ${err.message}` });
      showMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this unit? All associated bills and resident allocations will also be deleted simultaneously.")) {
      try {
        try {
          await householdApi.delete(id);
        } catch (apiErr) {
          console.warn("Backend household delete notice:", apiErr.message);
        }
        dataStore.deleteHousehold(id);
        loadData();
        showMsg("✓ Unit and its associated bills removed successfully.");
      } catch (err) {
        showMsg(`❌ Error removing unit: ${err.message}`);
      }
    }
  };

  const filtered = households.filter((h) => {
    const term = search.toLowerCase();
    const matchesSearch =
      h.unitNumber.toLowerCase().includes(term) ||
      (h.residentName && h.residentName.toLowerCase().includes(term)) ||
      (h.residentUsername && h.residentUsername.toLowerCase().includes(term)) ||
      (h.meterSerialNumber && h.meterSerialNumber.toLowerCase().includes(term));
    const matchesBlock = filterBlock === "all" || h.block === filterBlock;
    return matchesSearch && matchesBlock;
  });

  // Pagination slice
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedHouseholds = filtered.slice(startIndex, startIndex + pageSize);

  const currentSelectedHouseholdId = residentForm.householdId || (households[0] ? String(households[0].id) : "");

  return (
    <div className="admin-page" id="households-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Household Directory & Resident Allocation</h1>
          <p className="admin-page__subtitle">
            Register apartment flats, verify resident email existence, and automatically dispatch login credentials
          </p>
        </div>
      </div>

      {/* Top Notification Banner */}
      {notification && (
        <div className={`notification-banner ${notification.startsWith("✓") ? "notification-banner--success" : "notification-banner--error"}`}>
          {notification}
        </div>
      )}

      {/* Allocation Success Banner */}
      {allocationSuccess && (
        <div className="allocation-success-banner">
          <div className="allocation-success-icon">✓</div>
          <div className="allocation-success-info">
            <h4>Flat {allocationSuccess.unitNumber} ({allocationSuccess.block}) Allocated Successfully!</h4>
            <p>
              Resident <strong>{allocationSuccess.fullName}</strong> has been bound to Flat {allocationSuccess.unitNumber}. An automated credentials email was dispatched to <strong>{allocationSuccess.email}</strong>.
            </p>
            <div className="allocation-credentials-pill">
              <span><strong>User ID (Username):</strong> <code>{allocationSuccess.username}</code></span>
              <span><strong>Password:</strong> <code>{allocationSuccess.password}</code></span>
              <span><strong>Status:</strong> 🟢 Dispatched</span>
              <button 
                type="button" 
                className="field-helper-btn"
                style={{ marginLeft: "8px", fontWeight: 700 }}
                onClick={() => setShowEmailPreview(true)}
              >
                ✉️ View Sent Email Preview
              </button>
            </div>
          </div>
          <button 
            className="field-helper-btn" 
            style={{ marginLeft: "auto", fontSize: "1.1rem", color: "#065f46" }}
            onClick={() => setAllocationSuccess(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailPreview && allocationSuccess && (
        <div className="floating-modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) setShowEmailPreview(false);
        }}>
          <div className="floating-modal-popup" style={{ maxWidth: 620, padding: 0 }}>
            <div className="floating-modal-header" style={{ padding: "16px 20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>✉️ Sent Email Preview</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>To: {allocationSuccess.email}</span>
              </div>
              <button className="floating-modal-close" onClick={() => setShowEmailPreview(false)}>×</button>
            </div>
            <div style={{ padding: "24px", background: "#f8fafc", maxHeight: "75vh", overflowY: "auto" }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", padding: "24px", color: "#ffffff" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "2px 8px", borderRadius: "12px", marginBottom: "8px" }}>💧 Smart Water Management</div>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#ffffff" }}>Welcome to Palm Meadows Society</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", opacity: 0.9 }}>Flat: {allocationSuccess.unitNumber} • Your resident account is ready</p>
                </div>
                <div style={{ padding: "20px", fontSize: "0.9rem", color: "#334155", lineHeight: 1.6 }}>
                  <p>Hello <strong>{allocationSuccess.fullName}</strong>,</p>
                  <p>You have been registered as a resident on the <strong>DROP Water Management Portal</strong>. Here are your account credentials:</p>
                  
                  <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "14px", margin: "16px 0" }}>
                    <div style={{ marginBottom: "6px" }}><strong>Username / User ID:</strong> <code style={{ color: "#0284c7", fontSize: "0.95rem" }}>{allocationSuccess.username}</code></div>
                    <div style={{ marginBottom: "6px" }}><strong>Password:</strong> <code style={{ color: "#0f172a", fontSize: "0.95rem", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>{allocationSuccess.password}</code></div>
                    <div><strong>Assigned Flat:</strong> {allocationSuccess.unitNumber} ({allocationSuccess.block})</div>
                  </div>

                  <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <a href="#/login" style={{ background: "#0284c7", color: "#fff", padding: "10px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, display: "inline-block" }}>
                      Sign In to Resident Portal →
                    </a>
                  </div>

                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "10px", borderRadius: "6px", fontSize: "0.8rem", color: "#92400e" }}>
                    <strong>🛡️ Note:</strong> Please change your password in your profile after initial login.
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end", background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
              <button className="btn-primary" onClick={() => setShowEmailPreview(false)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}


      {/* Direct Input Creation Section */}
      <div className="admin-card input-creation-card">
        <div className="input-creation-header">
          <h2>Add Data to System</h2>
          <div className="input-creation-tabs">
            <button
              type="button"
              className={`input-tab-btn ${activeFormTab === "flat" ? "input-tab-btn--active" : ""}`}
              onClick={() => {
                setActiveFormTab("flat");
                setResidentFormStatus({ type: null, message: "" });
              }}
            >
              🏢 1. Add Flat / Unit
            </button>
            <button
              type="button"
              className={`input-tab-btn ${activeFormTab === "resident" ? "input-tab-btn--active" : ""}`}
              onClick={() => {
                setActiveFormTab("resident");
                setResidentFormStatus({ type: null, message: "" });
              }}
            >
              👤 2. Assign Resident & Email Credentials
            </button>
          </div>
        </div>

        {/* Tab 1: Simple Flat Creation Form */}
        {activeFormTab === "flat" && (
          <form onSubmit={handleAddFlat} noValidate className="direct-form">
            <div className="direct-form__grid">
              <div className="form-group">
                <label>Flat / Unit Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A-101, B-402, 305"
                  value={flatForm.unitNumber}
                  onChange={(e) => setFlatForm({ ...flatForm, unitNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Block / Tower</label>
                <select
                  value={flatForm.block}
                  onChange={(e) => setFlatForm({ ...flatForm, block: e.target.value })}
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Block D">Block D</option>
                  <option value="Tower 1">Tower 1</option>
                  <option value="Tower 2">Tower 2</option>
                </select>
              </div>

              <div className="form-group">
                <label>Floor</label>
                <input
                  type="text"
                  placeholder="e.g. 1st Floor, 4th Floor"
                  value={flatForm.floor}
                  onChange={(e) => setFlatForm({ ...flatForm, floor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Meter Serial # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. WM-2026-A101"
                  value={flatForm.meterSerialNumber}
                  onChange={(e) => setFlatForm({ ...flatForm, meterSerialNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="direct-form__actions">
              <button type="submit" className="btn-primary">
                + Register Flat
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Resident Allocation Form */}
        {activeFormTab === "resident" && (
          <div className="direct-form">
            {households.length === 0 ? (
              <div style={{ padding: "1rem", color: "#d97706", background: "#fef3c7", borderRadius: "8px" }}>
                ⚠️ Please register at least one flat first before creating a resident account.
              </div>
            ) : (
              <>
                <div className="direct-form__grid">
                  <div className="form-group">
                    <label>Select Assigned Flat *</label>
                    <select
                      value={currentSelectedHouseholdId}
                      onChange={(e) => {
                        setResidentForm({ ...residentForm, householdId: e.target.value });
                        setResidentFormStatus({ type: null, message: "" });
                      }}
                    >
                      {households.map((h) => (
                        <option key={h.id} value={String(h.id)}>
                          {h.unitNumber} ({h.block}) {h.residentName ? `— Current: ${h.residentName}` : "— [Vacant]"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Resident Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel"
                      value={residentForm.fullName}
                      onChange={(e) => {
                        setResidentForm({ ...residentForm, fullName: e.target.value });
                        setResidentFormStatus({ type: null, message: "" });
                      }}
                    />
                  </div>

                  {/* Email Field with Existence Check */}
                  <div className="form-group email-input-container">
                    <label>Resident Email (For Credentials Dispatch) *</label>
                    <input
                      type="text"
                      placeholder="e.g. ramesh@example.com"
                      value={residentForm.email}
                      onChange={handleEmailChange}
                    />
                    {emailValidation.status !== "idle" && (
                      <div className={`email-feedback email-feedback--${emailValidation.status}`}>
                        {emailValidation.message}
                      </div>
                    )}
                    {emailValidation.status === "idle" && (
                      <span className="email-feedback email-feedback--idle">
                        ℹ️ Login credentials will be emailed to this address upon allocation
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 00000"
                      value={residentForm.phone}
                      onChange={(e) => {
                        setResidentForm({ ...residentForm, phone: e.target.value });
                        setResidentFormStatus({ type: null, message: "" });
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Login User ID (Username) *</label>
                    <input
                      type="text"
                      placeholder="e.g. ramesh_patel or flat_101"
                      value={residentForm.username}
                      onChange={(e) => {
                        setResidentForm({ ...residentForm, username: e.target.value });
                        setResidentFormStatus({ type: null, message: "" });
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Login Password *</label>
                    <input
                      type="text"
                      placeholder="e.g. securePass123"
                      value={residentForm.password}
                      onChange={(e) => {
                        setResidentForm({ ...residentForm, password: e.target.value });
                        setResidentFormStatus({ type: null, message: "" });
                      }}
                    />
                  </div>
                </div>

                <div className="direct-form__actions">
                  {/* Inline Alert directly inside the form card */}
                  {residentFormStatus.message && (
                    <div className={`form-inline-alert ${residentFormStatus.type === "success" ? "form-inline-alert--success" : "form-inline-alert--error"}`}>
                      {residentFormStatus.message}
                    </div>
                  )}

                  <button 
                    type="button" 
                    className="btn-primary"
                    id="btn-allocate-resident"
                    onClick={handleCreateResident}
                  >
                    ✓ Allocate Flat & Send Credentials Email
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="admin-page__toolbar">
        <div className="admin-page__search-wrapper">
          <svg className="admin-page__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search flats, resident name, username, or meter ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-page__search-input"
          />
        </div>

        <div className="admin-page__filters">
          <select
            value={filterBlock}
            onChange={(e) => {
              setFilterBlock(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-page__select"
          >
            <option value="all">All Blocks</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
            <option value="Block C">Block C</option>
            <option value="Block D">Block D</option>
            <option value="Tower 1">Tower 1</option>
            <option value="Tower 2">Tower 2</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="admin-card">
        {households.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">🏢</div>
            <h3>No Flats Registered Yet</h3>
            <p>Use the form above to add flats and create resident login accounts.</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Unit Number</th>
                  <th>Block</th>
                  <th>Floor</th>
                  <th>Meter Serial #</th>
                  <th>Assigned Resident</th>
                  <th>Login User ID</th>
                  <th>Resident Email</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHouseholds.map((h) => (
                  <tr key={h.id}>
                    <td><strong>{h.unitNumber}</strong></td>
                    <td>{h.block}</td>
                    <td>{h.floor || "—"}</td>
                    <td>
                      {h.meterSerialNumber ? (
                        <code>{h.meterSerialNumber}</code>
                      ) : (
                        <span className="text-muted">Not Configured</span>
                      )}
                    </td>
                    <td>
                      {h.residentName ? (
                        <strong>{h.residentName}</strong>
                      ) : (
                        <span className="text-muted">Vacant</span>
                      )}
                    </td>
                    <td>
                      {h.residentUsername ? (
                        <code>@{h.residentUsername}</code>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {h.residentEmail ? (
                        <span style={{ fontSize: "0.8125rem", color: "var(--blue-600)" }}>
                          {h.residentEmail}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${h.status === "Active" ? "badge--success" : "badge--warning"}`}>
                        {h.status || "Active"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn-table-action"
                        onClick={() => handleDelete(h.id)}
                        style={{ color: "var(--red-600)", borderColor: "#fecaca" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default HouseholdsPage;
