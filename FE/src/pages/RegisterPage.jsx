import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../services/api";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1); // 1: Info, 2: Society, 3: Documents
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
    apartmentName: "",
    societyRegistrationNumber: "",
    societyAddress: "",
    city: "Bengaluru",
    state: "Karnataka",
    totalUnits: "50",
    documentBond: "",
    documentCertificate: "",
    documentIdProof: "",
    documentNotes: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    bond: null,
    certificate: null,
    idProof: null,
  });

  const [activePreviewDoc, setActivePreviewDoc] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (type, e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      // Validate file size (under 12MB)
      if (file.size > 12 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Please select a document under 12MB.`);
        return;
      }

      setError("");
      const reader = new FileReader();
      reader.onload = () => {
        const fileObj = {
          name: file.name,
          size: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
          dataUrl: reader.result,
          uploadedAt: new Date().toISOString(),
        };

        const jsonStr = JSON.stringify(fileObj);

        setUploadedFiles((prev) => ({ ...prev, [type]: fileObj }));
        if (type === "bond") setFormData((prev) => ({ ...prev, documentBond: jsonStr }));
        if (type === "certificate") setFormData((prev) => ({ ...prev, documentCertificate: jsonStr }));
        if (type === "idProof") setFormData((prev) => ({ ...prev, documentIdProof: jsonStr }));
      };

      reader.onerror = () => {
        setError("Failed to read the selected file. Please try another document.");
      };

      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = (type) => {
    setUploadedFiles((prev) => ({ ...prev, [type]: null }));
    if (type === "bond") setFormData((prev) => ({ ...prev, documentBond: "" }));
    if (type === "certificate") setFormData((prev) => ({ ...prev, documentCertificate: "" }));
    if (type === "idProof") setFormData((prev) => ({ ...prev, documentIdProof: "" }));
  };

  const validateStep1 = () => {
    const { firstName, lastName, email, username, password, confirmPassword } = formData;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setError("Please fill in all required admin information fields.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    const { apartmentName, societyRegistrationNumber } = formData;
    if (!apartmentName.trim()) {
      setError("Please provide your Society / Apartment Name.");
      return false;
    }
    if (!societyRegistrationNumber.trim()) {
      setError("Please enter the Society Registration / Certificate Number.");
      return false;
    }
    setError("");
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1 && validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2()) return;

    if (!formData.documentBond || !formData.documentCertificate) {
      setError("Please ensure both Society Bond and Apartment Registration Certificate documents are attached.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone.trim(),
        role: "APARTMENT_ADMIN",
        apartmentName: formData.apartmentName.trim(),
        societyRegistrationNumber: formData.societyRegistrationNumber.trim(),
        societyAddress: formData.societyAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        totalUnits: Number(formData.totalUnits) || 50,
        documentBond: formData.documentBond,
        documentCertificate: formData.documentCertificate,
        documentIdProof: formData.documentIdProof,
        documentNotes: formData.documentNotes.trim(),
      };

      const result = await register(payload);

      // Trigger notification email dispatch
      try {
        await notificationApi.sendAdminRegistrationSubmitted({
          email: payload.email,
          adminName: payload.fullName,
          apartmentName: payload.apartmentName,
        });
      } catch (mailErr) {
        console.warn("Mail dispatch notice:", mailErr.message);
      }

      setSubmittedApplication({
        fullName: payload.fullName,
        email: payload.email,
        username: payload.username,
        apartmentName: payload.apartmentName,
        bond: formData.documentBond,
        certificate: formData.documentCertificate,
        idProof: formData.documentIdProof,
      });

    } catch (err) {
      setError(err.message || "Registration submission failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page" id="register-page">
      {/* Background decoration */}
      <div className="register-page__bg">
        <div className="register-page__bg-orb register-page__bg-orb--1" />
        <div className="register-page__bg-orb register-page__bg-orb--2" />
      </div>

      <div className="register-page__content">
        <div className="register-card" id="register-card" style={{ maxWidth: submittedApplication ? 640 : 680 }}>
          
          {/* Submission Success Confirmation Screen */}
          {submittedApplication ? (
            <div className="reg-success-view">
              <div className="reg-success-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>

              <span className="reg-success-pill">⏳ APPLICATION SUBMITTED & PENDING AUDIT</span>
              <h2 className="reg-success-title">Society Registration Received!</h2>
              <p className="reg-success-desc">
                Your Apartment Admin application for <strong>{submittedApplication.apartmentName}</strong> has been submitted to the <strong>Main Administrator</strong> along with your verified documents.
              </p>

              <div className="reg-success-summary-box">
                <div className="reg-summary-row">
                  <span className="summary-label">Society Name:</span>
                  <span className="summary-val">{submittedApplication.apartmentName}</span>
                </div>
                <div className="reg-summary-row">
                  <span className="summary-label">Applicant Admin:</span>
                  <span className="summary-val">{submittedApplication.fullName}</span>
                </div>
                <div className="reg-summary-row">
                  <span className="summary-label">Registered Email:</span>
                  <span className="summary-val" style={{ color: "#0284c7" }}>{submittedApplication.email}</span>
                </div>
                <div className="reg-summary-row">
                  <span className="summary-label">Username:</span>
                  <span className="summary-val"><code>@{submittedApplication.username}</code></span>
                </div>
                <div className="reg-summary-row">
                  <span className="summary-label">Submitted Documents:</span>
                  <span className="summary-val" style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 600 }}>
                    ✓ Bond ({uploadedFiles.bond?.name || "Society_Bond.pdf"})<br/>
                    ✓ Certificate ({uploadedFiles.certificate?.name || "Registration_Certificate.pdf"})
                    {uploadedFiles.idProof && (
                      <>
                        <br />✓ ID Proof ({uploadedFiles.idProof.name})
                      </>
                    )}
                  </span>
                </div>
                <div className="reg-summary-row" style={{ borderBottom: "none", paddingTop: "8px" }}>
                  <span className="summary-label">Approval Status:</span>
                  <span className="summary-val" style={{ color: "#d97706", fontWeight: 700 }}>🟡 Pending Main Admin Approval</span>
                </div>
              </div>

              <div className="reg-success-notice">
                <div className="notice-icon">📧</div>
                <div className="notice-text">
                  <strong>What happens next?</strong> The Main Admin will verify your legal documents on their management dashboard. Once approved, you will receive an <strong>Account Creation Confirmation Email</strong> with full access to your society portal.
                </div>
              </div>

              <div className="reg-success-actions">
                <Link to="/login" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  Return to Sign In Page →
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="register-card__header">
                <div className="register-card__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <h1 className="register-card__title">Register Apartment Society</h1>
                <p className="register-card__subtitle">
                  Apply for Apartment Admin account with document verification
                </p>

                {/* Stepper Wizard */}
                <div className="reg-stepper">
                  <div className={`step-item ${step >= 1 ? "step-item--active" : ""}`}>
                    <div className="step-circle">{step > 1 ? "✓" : "1"}</div>
                    <span className="step-label">Admin Info</span>
                  </div>
                  <div className={`step-line ${step >= 2 ? "step-line--active" : ""}`} />
                  <div className={`step-item ${step >= 2 ? "step-item--active" : ""}`}>
                    <div className="step-circle">{step > 2 ? "✓" : "2"}</div>
                    <span className="step-label">Society Details</span>
                  </div>
                  <div className={`step-line ${step >= 3 ? "step-line--active" : ""}`} />
                  <div className={`step-item ${step >= 3 ? "step-item--active" : ""}`}>
                    <div className="step-circle">3</div>
                    <span className="step-label">Submit Documents</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form className="register-card__form" onSubmit={step === 3 ? handleSubmit : handleNext} id="register-form">

                {/* ── STEP 1: Admin Personal Info ── */}
                {step === 1 && (
                  <div className="reg-step-section">
                    <div className="register-card__row">
                      <div className="register-card__field">
                        <label htmlFor="reg-firstName">First Name *</label>
                        <div className="register-card__input-wrapper">
                          <input
                            id="reg-firstName"
                            name="firstName"
                            type="text"
                            placeholder="e.g. Ramesh"
                            value={formData.firstName}
                            onChange={handleChange}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="register-card__field">
                        <label htmlFor="reg-lastName">Last Name *</label>
                        <div className="register-card__input-wrapper">
                          <input
                            id="reg-lastName"
                            name="lastName"
                            type="text"
                            placeholder="e.g. Patel"
                            value={formData.lastName}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="register-card__row">
                      <div className="register-card__field">
                        <label htmlFor="reg-email">Official Admin Email *</label>
                        <div className="register-card__input-wrapper">
                          <input
                            id="reg-email"
                            name="email"
                            type="email"
                            placeholder="admin@society.org"
                            value={formData.email}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="register-card__field">
                        <label htmlFor="reg-phone">Contact Phone Number</label>
                        <div className="register-card__input-wrapper">
                          <input
                            id="reg-phone"
                            name="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="register-card__field">
                      <label htmlFor="reg-username">Login Username (User ID) *</label>
                      <div className="register-card__input-wrapper">
                        <input
                          id="reg-username"
                          name="username"
                          type="text"
                          placeholder="e.g. society_admin"
                          value={formData.username}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="register-card__row">
                      <div className="register-card__field">
                        <label htmlFor="reg-password">Create Password *</label>
                        <div className="register-card__input-wrapper">
                          <input
                            id="reg-password"
                            name="password"
                            type="password"
                            placeholder="Min. 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="register-card__field">
                        <label htmlFor="reg-confirmPassword">Confirm Password *</label>
                        <div className="register-card__input-wrapper">
                          <input
                            id="reg-confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Re-enter password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Society Details ── */}
                {step === 2 && (
                  <div className="reg-step-section">
                    <div className="register-card__field">
                      <label htmlFor="reg-apartmentName">Apartment / Society Name *</label>
                      <div className="register-card__input-wrapper">
                        <input
                          id="reg-apartmentName"
                          name="apartmentName"
                          type="text"
                          placeholder="e.g. Greenwood Heights Cooperative Society"
                          value={formData.apartmentName}
                          onChange={handleChange}
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="register-card__field">
                      <label htmlFor="reg-societyReg">Society Registration / RERA / Govt Number *</label>
                      <div className="register-card__input-wrapper">
                        <input
                          id="reg-societyReg"
                          name="societyRegistrationNumber"
                          type="text"
                          placeholder="e.g. REG-KA-BLR-2025-7890"
                          value={formData.societyRegistrationNumber}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="register-card__field">
                      <label htmlFor="reg-societyAddress">Society Street Address</label>
                      <div className="register-card__input-wrapper">
                        <input
                          id="reg-societyAddress"
                          name="societyAddress"
                          type="text"
                          placeholder="e.g. Plot 12, Sarjapur Main Road"
                          value={formData.societyAddress}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="register-card__row">
                      <div className="register-card__field">
                        <label htmlFor="reg-city">City</label>
                        <div className="register-card__input-wrapper">
                          <input
                            id="reg-city"
                            name="city"
                            type="text"
                            placeholder="Bengaluru"
                            value={formData.city}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="register-card__field">
                        <label htmlFor="reg-state">State</label>
                        <div className="register-card__input-wrapper">
                          <input
                            id="reg-state"
                            name="state"
                            type="text"
                            placeholder="Karnataka"
                            value={formData.state}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="register-card__field">
                        <label htmlFor="reg-units">Total Flats / Units</label>
                        <div className="register-card__input-wrapper">
                          <input
                            id="reg-units"
                            name="totalUnits"
                            type="number"
                            min="1"
                            placeholder="50"
                            value={formData.totalUnits}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Document Uploads & Verification ── */}
                {step === 3 && (
                  <div className="reg-step-section">
                    <div className="doc-upload-intro">
                      <div className="doc-intro-icon">🛡️</div>
                      <div className="doc-intro-text">
                        <strong>Main Admin Verification Documents:</strong> Please attach legal verification files (PDF, DOC, PNG, JPG). The Main Admin will audit these credentials to approve and activate your society portal.
                      </div>
                    </div>

                    {/* Document 1: Society Bond / Indemnity Agreement */}
                    <div className={`doc-upload-box ${uploadedFiles.bond ? "doc-upload-box--attached" : ""}`}>
                      <div className="doc-upload-header">
                        <span className="doc-badge">Required</span>
                        <h4>📜 1. Society Bond / Legal Agreement</h4>
                      </div>
                      <p className="doc-help-text">
                        Attach signed society indemnity bond, MC authorization resolution, or legal agreement.
                      </p>
                      
                      {uploadedFiles.bond ? (
                        <div className="doc-file-row">
                          <div className="doc-file-status">
                            <span className="doc-check-icon">✓</span>
                            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                              <span className="doc-filename">{uploadedFiles.bond.name}</span>
                              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{uploadedFiles.bond.size} • Attached</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              className="btn-preview-file"
                              onClick={() => setActivePreviewDoc(uploadedFiles.bond)}
                            >
                              👁️ Preview
                            </button>
                            <label className="btn-upload-file" title="Change file">
                              <span>Change</span>
                              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => handleFileUpload("bond", e)} style={{ display: "none" }} />
                            </label>
                            <button
                              type="button"
                              className="btn-remove-file"
                              onClick={() => handleRemoveFile("bond")}
                              title="Remove document"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="doc-dropzone">
                          <div className="doc-dropzone-inner">
                            <span style={{ fontSize: "1.5rem" }}>📄</span>
                            <div className="doc-dropzone-text">
                              <strong>Select Society Bond Document *</strong>
                              <span>PDF, DOCX, PNG or JPG (Max 12MB)</span>
                            </div>
                            <span className="btn-select-file">Browse File</span>
                          </div>
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => handleFileUpload("bond", e)} style={{ display: "none" }} />
                        </label>
                      )}
                    </div>

                    {/* Document 2: Apartment Registration Certificate */}
                    <div className={`doc-upload-box ${uploadedFiles.certificate ? "doc-upload-box--attached" : ""}`}>
                      <div className="doc-upload-header">
                        <span className="doc-badge">Required</span>
                        <h4>📑 2. Apartment Registration Certificate</h4>
                      </div>
                      <p className="doc-help-text">
                        Upload government registration certificate, RERA registration certificate, or society incorporation deed.
                      </p>

                      {uploadedFiles.certificate ? (
                        <div className="doc-file-row">
                          <div className="doc-file-status">
                            <span className="doc-check-icon">✓</span>
                            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                              <span className="doc-filename">{uploadedFiles.certificate.name}</span>
                              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{uploadedFiles.certificate.size} • Attached</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              className="btn-preview-file"
                              onClick={() => setActivePreviewDoc(uploadedFiles.certificate)}
                            >
                              👁️ Preview
                            </button>
                            <label className="btn-upload-file" title="Change file">
                              <span>Change</span>
                              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => handleFileUpload("certificate", e)} style={{ display: "none" }} />
                            </label>
                            <button
                              type="button"
                              className="btn-remove-file"
                              onClick={() => handleRemoveFile("certificate")}
                              title="Remove document"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="doc-dropzone">
                          <div className="doc-dropzone-inner">
                            <span style={{ fontSize: "1.5rem" }}>📑</span>
                            <div className="doc-dropzone-text">
                              <strong>Select Registration Certificate *</strong>
                              <span>PDF, DOCX, PNG or JPG (Max 12MB)</span>
                            </div>
                            <span className="btn-select-file">Browse File</span>
                          </div>
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => handleFileUpload("certificate", e)} style={{ display: "none" }} />
                        </label>
                      )}
                    </div>

                    {/* Document 3: Identity Proof / Admin NOC */}
                    <div className={`doc-upload-box ${uploadedFiles.idProof ? "doc-upload-box--attached" : ""}`}>
                      <div className="doc-upload-header">
                        <span className="doc-badge doc-badge--opt">Optional / Recommended</span>
                        <h4>🪪 3. Admin Identity Proof / Society NOC</h4>
                      </div>
                      <p className="doc-help-text">
                        Government ID proof (Aadhaar / PAN / Passport) or NOC letter from society president.
                      </p>

                      {uploadedFiles.idProof ? (
                        <div className="doc-file-row">
                          <div className="doc-file-status">
                            <span className="doc-check-icon">✓</span>
                            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                              <span className="doc-filename">{uploadedFiles.idProof.name}</span>
                              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{uploadedFiles.idProof.size} • Attached</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              className="btn-preview-file"
                              onClick={() => setActivePreviewDoc(uploadedFiles.idProof)}
                            >
                              👁️ Preview
                            </button>
                            <label className="btn-upload-file" title="Change file">
                              <span>Change</span>
                              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => handleFileUpload("idProof", e)} style={{ display: "none" }} />
                            </label>
                            <button
                              type="button"
                              className="btn-remove-file"
                              onClick={() => handleRemoveFile("idProof")}
                              title="Remove document"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="doc-dropzone">
                          <div className="doc-dropzone-inner">
                            <span style={{ fontSize: "1.5rem" }}>🪪</span>
                            <div className="doc-dropzone-text">
                              <strong>Select Identity Proof (Optional)</strong>
                              <span>PDF, PNG or JPG (Max 12MB)</span>
                            </div>
                            <span className="btn-select-file">Browse File</span>
                          </div>
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => handleFileUpload("idProof", e)} style={{ display: "none" }} />
                        </label>
                      )}
                    </div>

                    {/* Additional Notes */}
                    <div className="register-card__field" style={{ marginTop: "0.5rem" }}>
                      <label htmlFor="reg-notes">Additional Society Notes / Remarks</label>
                      <div className="register-card__input-wrapper">
                        <textarea
                          id="reg-notes"
                          name="documentNotes"
                          rows="2"
                          placeholder="e.g. Existing meter details, pipeline layout notes, or urgent activation request..."
                          value={formData.documentNotes}
                          onChange={handleChange}
                          style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="register-card__error" id="register-error" role="alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Button Controls */}
                <div className="reg-button-group">
                  {step > 1 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setStep(step - 1)}
                    >
                      ← Back
                    </button>
                  )}

                  <button
                    type="submit"
                    className="btn-primary register-card__submit"
                    disabled={isLoading}
                    id="register-submit"
                    style={{ flex: 1 }}
                  >
                    {isLoading ? (
                      "Submitting Documents..."
                    ) : step === 3 ? (
                      "🚀 Submit Application for Main Admin Verification"
                    ) : (
                      "Continue to Next Step →"
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="register-card__divider">
                  <div className="register-card__divider-line" />
                  <span className="register-card__divider-text">Already registered?</span>
                  <div className="register-card__divider-line" />
                </div>

                {/* Login Link */}
                <p className="register-card__login">
                  Have an account?
                  <Link to="/login" className="register-card__login-link" id="login-link">
                    Sign In
                  </Link>
                </p>
              </form>
            </>
          )}

          {/* In-Registration Document Preview Modal */}
          {activePreviewDoc && (
            <div className="floating-modal-backdrop" onClick={(e) => {
              if (e.target === e.currentTarget) setActivePreviewDoc(null);
            }}>
              <div className="floating-modal-popup" style={{ maxWidth: 680 }}>
                <div className="floating-modal-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>📄 Document Preview: {activePreviewDoc.name}</h3>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{activePreviewDoc.size} • {activePreviewDoc.type}</span>
                  </div>
                  <button className="floating-modal-close" onClick={() => setActivePreviewDoc(null)}>×</button>
                </div>
                <div style={{ padding: "16px", maxHeight: "60vh", overflowY: "auto" }}>
                  {activePreviewDoc.dataUrl && activePreviewDoc.dataUrl.startsWith("data:image/") ? (
                    <div style={{ textAlign: "center", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <img src={activePreviewDoc.dataUrl} alt={activePreviewDoc.name} style={{ maxWidth: "100%", maxHeight: "380px", borderRadius: "6px", objectFit: "contain" }} />
                    </div>
                  ) : activePreviewDoc.dataUrl && activePreviewDoc.dataUrl.startsWith("data:application/pdf") ? (
                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <iframe src={activePreviewDoc.dataUrl} title={activePreviewDoc.name} style={{ width: "100%", height: "380px", border: "none", borderRadius: "6px" }} />
                    </div>
                  ) : (
                    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📄</div>
                      <h4 style={{ margin: "0 0 6px", color: "#0369a1" }}>{activePreviewDoc.name}</h4>
                      <p style={{ margin: "0 0 12px", fontSize: "0.8125rem", color: "#64748b" }}>
                        Document loaded and ready for Main Admin verification audit ({activePreviewDoc.size}).
                      </p>
                      {activePreviewDoc.dataUrl && (
                        <a
                          href={activePreviewDoc.dataUrl}
                          download={activePreviewDoc.name}
                          className="btn-primary"
                          style={{ textDecoration: "none", display: "inline-flex", fontSize: "0.8125rem", padding: "0.4rem 0.9rem" }}
                        >
                          📥 Download Local Copy
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ padding: "12px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn-secondary" onClick={() => setActivePreviewDoc(null)}>Close Preview</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
