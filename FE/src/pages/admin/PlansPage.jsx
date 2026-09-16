import { useState, useEffect, useRef } from "react";
import { dataStore } from "../../services/store";
import Pagination from "../../components/Pagination";
import "./HouseholdsPage.css";
import "./PlansPage.css";

// Helper to validate slab chain and return specific error messages per slab field
function getSlabErrors(slabs, planType) {
  if (planType !== "TIERED" || !slabs) return {};
  const errors = {};

  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    const sErrors = {};
    const fromNum = s.fromKL !== "" && s.fromKL !== null && s.fromKL !== undefined ? Number(s.fromKL) : NaN;
    const toNum = s.toKL !== "" && s.toKL !== null && s.toKL !== undefined ? Number(s.toKL) : null;
    const rateNum = s.ratePerKL !== "" && s.ratePerKL !== null && s.ratePerKL !== undefined ? Number(s.ratePerKL) : NaN;

    // Validate fromKL
    if (s.fromKL === "" || isNaN(fromNum) || fromNum < 0) {
      sErrors.fromKL = "Must be ≥ 0";
    } else if (i === 0 && fromNum !== 0) {
      sErrors.fromKL = "Tier 1 must start at 0";
    } else if (i > 0) {
      const prev = slabs[i - 1];
      const prevToNum = prev.toKL !== "" && prev.toKL !== null && prev.toKL !== undefined ? Number(prev.toKL) : null;
      if (prevToNum !== null && fromNum !== prevToNum) {
        sErrors.fromKL = `Must match Tier ${i} upper limit (${prevToNum})`;
      }
    }

    // Validate toKL
    const isLast = i === slabs.length - 1;
    if (!isLast && (s.toKL === "" || s.toKL === null || s.toKL === undefined)) {
      sErrors.toKL = "Upper limit is required";
    } else if (toNum !== null) {
      if (isNaN(toNum)) {
        sErrors.toKL = "Must be a valid number";
      } else if (!isNaN(fromNum) && toNum <= fromNum) {
        sErrors.toKL = `Must be > ${fromNum}`;
      }
    }

    // Validate ratePerKL
    if (s.ratePerKL === "" || isNaN(rateNum) || rateNum < 0) {
      sErrors.ratePerKL = "Must be ≥ 0";
    }

    if (Object.keys(sErrors).length > 0) {
      errors[s.id] = sErrors;
    }
  }

  return errors;
}

function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [notification, setNotification] = useState("");
  const [editingPlanId, setEditingPlanId] = useState(null);
  const editorRef = useRef(null);

  // Pagination state (3 columns per row)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Live test simulator state
  const [testLiters, setTestLiters] = useState(18000);

  // Plan Form default state
  const defaultFormState = {
    name: "",
    description: "",
    type: "TIERED",
    fixedCharge: 100,
    freeAllowanceKL: 0,
    flatRate: 20,
    isDefault: false,
    slabs: [
      { id: 1, fromKL: 0, toKL: 10, ratePerKL: 15, label: "0 - 10 kL" },
      { id: 2, fromKL: 10, toKL: 25, ratePerKL: 25, label: "10 - 25 kL" },
      { id: 3, fromKL: 25, toKL: null, ratePerKL: 40, label: "Above 25 kL" },
    ],
  };

  const [form, setForm] = useState(defaultFormState);

  const loadPlans = () => {
    const list = dataStore.getTariffPlans();
    setPlans(list);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const showMsg = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 5000);
  };

  const handleResetToCreate = () => {
    setEditingPlanId(null);
    setForm(defaultFormState);
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOpenEdit = (plan) => {
    setEditingPlanId(plan.id);
    const rawSlabs =
      plan.slabs && plan.slabs.length > 0
        ? plan.slabs.map((s, idx) => ({
            id: s.id || idx + 1,
            fromKL: s.fromKL !== undefined ? s.fromKL : 0,
            toKL: s.toKL !== undefined ? s.toKL : null,
            ratePerKL: s.ratePerKL !== undefined ? s.ratePerKL : 20,
            label: s.label || (s.toKL ? `${s.fromKL} - ${s.toKL} kL` : `Above ${s.fromKL} kL`),
          }))
        : [
            { id: 1, fromKL: 0, toKL: 10, ratePerKL: 15, label: "0 - 10 kL" },
            { id: 2, fromKL: 10, toKL: null, ratePerKL: 25, label: "Above 10 kL" },
          ];

    setForm({
      name: plan.name || "",
      description: plan.description || "",
      type: plan.type || "TIERED",
      fixedCharge: plan.fixedCharge !== undefined ? plan.fixedCharge : 100,
      freeAllowanceKL: plan.freeAllowanceKL !== undefined ? plan.freeAllowanceKL : 0,
      flatRate: plan.flatRate !== undefined ? plan.flatRate : 20,
      isDefault: !!plan.isDefault,
      slabs: rawSlabs,
    });

    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // Freeform change handler: Allows user to type any values freely without blocking
  const handleSlabChange = (id, field, value) => {
    const updatedSlabs = form.slabs.map((s, idx) => {
      if (String(s.id) === String(id)) {
        return {
          ...s,
          [field]: field === "toKL" && value === "" ? "" : value,
        };
      }
      return s;
    });

    setForm({ ...form, slabs: updatedSlabs });
  };

  // Quick auto-chain helper button to align boundaries if user wants one-click sync
  const handleAutoChainAll = () => {
    const slabs = [...form.slabs];
    for (let i = 0; i < slabs.length; i++) {
      if (i === 0) {
        slabs[i].fromKL = 0;
      } else {
        const prevTo = slabs[i - 1].toKL !== "" && slabs[i - 1].toKL !== null ? Number(slabs[i - 1].toKL) : Number(slabs[i - 1].fromKL) + 10;
        slabs[i].fromKL = prevTo;
      }

      if (slabs[i].toKL !== null && slabs[i].toKL !== "") {
        if (Number(slabs[i].toKL) <= Number(slabs[i].fromKL)) {
          slabs[i].toKL = Number(slabs[i].fromKL) + 10;
        }
      }

      slabs[i].label =
        slabs[i].toKL !== null && slabs[i].toKL !== ""
          ? `${slabs[i].fromKL} - ${slabs[i].toKL} kL`
          : `Above ${slabs[i].fromKL} kL`;
    }

    setForm({ ...form, slabs });
    showMsg("✓ Slab boundaries auto-synchronized sequentially!");
  };

  const handleAddSlab = () => {
    const currentSlabs = [...(form.slabs || [])];
    if (currentSlabs.length === 0) {
      setForm({
        ...form,
        slabs: [{ id: Date.now(), fromKL: 0, toKL: 10, ratePerKL: 15, label: "0 - 10 kL" }],
      });
      return;
    }

    const lastIdx = currentSlabs.length - 1;
    const lastSlab = currentSlabs[lastIdx];
    const prevTo = lastSlab.toKL !== "" && lastSlab.toKL !== null ? Number(lastSlab.toKL) : Number(lastSlab.fromKL) + 15;

    // Cap the previous slab if it was null
    if (lastSlab.toKL === null || lastSlab.toKL === "") {
      currentSlabs[lastIdx] = {
        ...lastSlab,
        toKL: prevTo,
        label: `${lastSlab.fromKL} - ${prevTo} kL`,
      };
    }

    const newSlab = {
      id: Date.now(),
      fromKL: prevTo,
      toKL: null,
      ratePerKL: Number(lastSlab.ratePerKL) > 0 ? Number(lastSlab.ratePerKL) + 10 : 20,
      label: `Above ${prevTo} kL`,
    };

    setForm({ ...form, slabs: [...currentSlabs, newSlab] });
  };

  const handleRemoveSlab = (id) => {
    if (form.slabs.length <= 1) {
      alert("A tiered plan must have at least one slab tier.");
      return;
    }

    const remaining = form.slabs.filter((s) => String(s.id) !== String(id));
    setForm({ ...form, slabs: remaining });
  };

  const handleSavePlan = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showMsg("❌ Please enter a plan name.");
      return;
    }

    // Perform Ironclad validation
    const errors = getSlabErrors(form.slabs, form.type);
    const errorIds = Object.keys(errors);
    if (errorIds.length > 0) {
      const firstErrorKey = Object.keys(errors[errorIds[0]])[0];
      const firstErrorMsg = errors[errorIds[0]][firstErrorKey];
      showMsg(`❌ Please correct the red-marked boxes: ${firstErrorMsg}`);
      return;
    }

    try {
      // Clean and format numeric slabs before saving
      const formattedSlabs = form.slabs.map((s) => ({
        id: s.id,
        fromKL: Number(s.fromKL),
        toKL: s.toKL !== null && s.toKL !== "" && s.toKL !== undefined ? Number(s.toKL) : null,
        ratePerKL: Number(s.ratePerKL),
        label: s.label || (s.toKL ? `${s.fromKL} - ${s.toKL} kL` : `Above ${s.fromKL} kL`),
      }));

      const planToSave = {
        ...form,
        id: editingPlanId,
        slabs: formattedSlabs,
      };

      const saved = dataStore.saveTariffPlan(planToSave);
      loadPlans();
      const wasEdit = !!editingPlanId;
      setEditingPlanId(null);
      setForm(defaultFormState);
      showMsg(`✓ Tariff Plan "${saved.name}" ${wasEdit ? "updated" : "created"} successfully!`);
    } catch (err) {
      showMsg(`❌ Error: ${err.message}`);
    }
  };

  const handleDeletePlan = (id, name) => {
    if (window.confirm(`Are you sure you want to delete the tariff plan "${name}"?`)) {
      dataStore.deleteTariffPlan(id);
      if (String(editingPlanId) === String(id)) {
        setEditingPlanId(null);
        setForm(defaultFormState);
      }
      loadPlans();
      showMsg(`✓ Tariff Plan "${name}" removed.`);
    }
  };

  const handleSetDefault = (id, name) => {
    dataStore.setDefaultTariffPlan(id);
    loadPlans();
    showMsg(`✓ Plan "${name}" is now the Default Active Tariff.`);
  };

  // Live calculation of errors for real-time red marks
  const slabErrors = getSlabErrors(form.slabs, form.type);
  const hasAnyErrors = Object.keys(slabErrors).length > 0;

  // Pagination slicing (3 side-by-side per row)
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPlans = plans.slice(startIndex, startIndex + pageSize);

  // Live simulation for a plan
  const calculateSim = (plan, liters) => {
    return dataStore.calculateBillAmount(liters, plan);
  };

  return (
    <div className="admin-page" id="plans-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Plans & Tariff Pricing</h1>
          <p className="admin-page__subtitle">
            Configure dynamic volumetric pricing slabs, fixed maintenance fees, and calculate consumption charges
          </p>
        </div>
        <button className="btn-primary" onClick={handleResetToCreate} id="create-plan-btn">
          + New Tariff Plan
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`notification-banner ${notification.startsWith("✓") ? "notification-banner--success" : "notification-banner--error"}`}>
          {notification}
        </div>
      )}

      {/* ── TARIFF PLAN CREATION & EDITOR CONTAINER ── */}
      <div
        className="admin-card input-creation-card"
        ref={editorRef}
        id="tariff-editor-container"
        style={{
          border: editingPlanId ? "2px solid #0284c7" : "1px solid #e2e8f0",
          boxShadow: editingPlanId ? "0 4px 16px rgba(2, 132, 199, 0.15)" : "none",
          transition: "all 0.3s ease",
          marginBottom: "2rem",
        }}
      >
        <div className="input-creation-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <span>{editingPlanId ? "✏️" : "⚡"}</span>
              {editingPlanId ? `Edit Tariff Plan: ${form.name || "Selected Plan"}` : "Create New Tariff Plan & Rate Slabs"}
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#64748b" }}>
              {editingPlanId
                ? "Modify consumption brackets, slab rates, fixed base fees, or free allowance units."
                : "Enter any custom values freely. Invalid or colliding boxes are marked in red until corrected."}
            </p>
          </div>
          {editingPlanId && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetToCreate}
              style={{ fontSize: "0.8125rem", padding: "0.35rem 0.75rem" }}
            >
              ✕ Cancel Editing (New Plan)
            </button>
          )}
        </div>

        <form onSubmit={handleSavePlan} className="direct-form">
          <div className="direct-form__grid">
            <div className="form-group">
              <label>Plan Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Standard Telescopic Slab Plan, Eco Tiered"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Pricing Model *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="TIERED">⚡ Tiered Volumetric Slabs (Recommended)</option>
                <option value="FLAT_RATE">🔹 Flat Uniform Rate per kL</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fixed Monthly Base Fee (₹) *</label>
              <input
                type="number"
                min="0"
                required
                placeholder="e.g. 100"
                value={form.fixedCharge}
                onChange={(e) => setForm({ ...form, fixedCharge: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Free Water Allowance (kL)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.freeAllowanceKL}
                onChange={(e) => setForm({ ...form, freeAllowanceKL: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label>Description / Usage Category</label>
              <input
                type="text"
                placeholder="e.g. Tiered consumption pricing for residential towers"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          {/* Dynamic Slabs Configurator Container */}
          {form.type === "TIERED" ? (
            <div
              style={{
                marginTop: "1.25rem",
                background: "#f8fafc",
                padding: "1.25rem",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                    📊 Volumetric Rate Slabs & Tiers
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    You can type any numbers freely. Invalid/colliding bounds will show a <strong style={{ color: "#dc2626" }}>red border</strong> until corrected.
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: "0.78rem", padding: "0.35rem 0.65rem", color: "#0284c7" }}
                    onClick={handleAutoChainAll}
                    title="Automatically align all slab boundaries sequentially"
                  >
                    ⚡ Auto-Align Tiers
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: "0.8125rem", padding: "0.4rem 0.85rem", fontWeight: 600 }}
                    onClick={handleAddSlab}
                  >
                    + Add Next Slab Tier
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {form.slabs.map((slab, index) => {
                  const sErr = slabErrors[slab.id] || {};
                  return (
                    <div
                      key={slab.id || index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr 44px",
                        gap: "0.6rem",
                        alignItems: "flex-start",
                        background: "#ffffff",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: Object.keys(sErr).length > 0 ? "1.5px solid #fca5a5" : "1px solid #cbd5e1",
                        boxShadow: Object.keys(sErr).length > 0 ? "0 2px 8px rgba(239, 68, 68, 0.08)" : "none",
                      }}
                    >
                      {/* Tier Label */}
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginBottom: "0.2rem" }}>
                          Tier Label
                        </div>
                        <input
                          type="text"
                          placeholder={`Tier ${index + 1}`}
                          value={slab.label}
                          onChange={(e) => handleSlabChange(slab.id, "label", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            fontSize: "0.84rem",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                          }}
                        />
                      </div>

                      {/* From (kL) */}
                      <div>
                        <div style={{ fontSize: "0.72rem", color: sErr.fromKL ? "#dc2626" : "#64748b", fontWeight: 600, marginBottom: "0.2rem" }}>
                          From (kL) {sErr.fromKL && "⚠️"}
                        </div>
                        <input
                          type="number"
                          step="any"
                          value={slab.fromKL}
                          onChange={(e) => handleSlabChange(slab.id, "fromKL", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            fontSize: "0.84rem",
                            border: sErr.fromKL ? "2px solid #ef4444" : "1px solid #cbd5e1",
                            background: sErr.fromKL ? "#fef2f2" : "#ffffff",
                            borderRadius: "6px",
                            outline: sErr.fromKL ? "none" : "",
                          }}
                        />
                        {sErr.fromKL && (
                          <div style={{ color: "#dc2626", fontSize: "0.68rem", fontWeight: 600, marginTop: "0.2rem", lineHeight: 1.2 }}>
                            {sErr.fromKL}
                          </div>
                        )}
                      </div>

                      {/* To (kL) */}
                      <div>
                        <div style={{ fontSize: "0.72rem", color: sErr.toKL ? "#dc2626" : "#64748b", fontWeight: 600, marginBottom: "0.2rem" }}>
                          To (kL) {index === form.slabs.length - 1 ? "(Blank=∞)" : ""} {sErr.toKL && "⚠️"}
                        </div>
                        <input
                          type="number"
                          step="any"
                          placeholder="Above / ∞"
                          value={slab.toKL === null || slab.toKL === undefined ? "" : slab.toKL}
                          onChange={(e) => handleSlabChange(slab.id, "toKL", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            fontSize: "0.84rem",
                            border: sErr.toKL ? "2px solid #ef4444" : "1px solid #cbd5e1",
                            background: sErr.toKL ? "#fef2f2" : "#ffffff",
                            borderRadius: "6px",
                            outline: sErr.toKL ? "none" : "",
                          }}
                        />
                        {sErr.toKL && (
                          <div style={{ color: "#dc2626", fontSize: "0.68rem", fontWeight: 600, marginTop: "0.2rem", lineHeight: 1.2 }}>
                            {sErr.toKL}
                          </div>
                        )}
                      </div>

                      {/* Rate (₹/kL) */}
                      <div>
                        <div style={{ fontSize: "0.72rem", color: sErr.ratePerKL ? "#dc2626" : "#64748b", fontWeight: 600, marginBottom: "0.2rem" }}>
                          Rate (₹ / 1,000L) {sErr.ratePerKL && "⚠️"}
                        </div>
                        <input
                          type="number"
                          step="any"
                          required
                          value={slab.ratePerKL}
                          onChange={(e) => handleSlabChange(slab.id, "ratePerKL", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.45rem",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            color: sErr.ratePerKL ? "#dc2626" : "#0284c7",
                            border: sErr.ratePerKL ? "2px solid #ef4444" : "1px solid #cbd5e1",
                            background: sErr.ratePerKL ? "#fef2f2" : "#ffffff",
                            borderRadius: "6px",
                            outline: sErr.ratePerKL ? "none" : "",
                          }}
                        />
                        {sErr.ratePerKL && (
                          <div style={{ color: "#dc2626", fontSize: "0.68rem", fontWeight: 600, marginTop: "0.2rem", lineHeight: 1.2 }}>
                            {sErr.ratePerKL}
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
                      <div style={{ textAlign: "center", paddingTop: "1.2rem" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlab(slab.id)}
                          style={{
                            background: "#fee2e2",
                            border: "1px solid #fca5a5",
                            borderRadius: "6px",
                            color: "#dc2626",
                            width: "32px",
                            height: "32px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                          title="Delete Slab"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "1rem", background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div className="form-group">
                <label>Flat Volumetric Rate per 1,000 Liters (₹ / kL) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={form.flatRate}
                  onChange={(e) => setForm({ ...form, flatRate: e.target.value })}
                  style={{ maxWidth: "300px" }}
                />
              </div>
            </div>
          )}

          {/* Form Bottom Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              <span>Set as Default Active Tariff Plan for Society Invoicing</span>
            </label>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {hasAnyErrors && (
                <span style={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 600 }}>
                  ⚠️ Fix red-marked fields before saving
                </span>
              )}
              {editingPlanId && (
                <button type="button" className="btn-secondary" onClick={handleResetToCreate}>
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  minWidth: "160px",
                  opacity: hasAnyErrors ? 0.7 : 1,
                }}
              >
                {editingPlanId ? "💾 Save Changes to Plan" : "✓ Save Tariff Plan"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── INTERACTIVE SLAB COST SIMULATOR ── */}
      {plans.length > 0 && (
        <div className="admin-card" style={{ padding: "1.1rem 1.25rem", marginBottom: "1.5rem", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🧮</span> Live Slab Rate Simulator
              </h3>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                Test how your configured tariff slabs calculate charges across various consumption volumes
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#334155" }}>Test Consumption:</label>
              <input
                type="number"
                step="1000"
                min="0"
                value={testLiters}
                onChange={(e) => setTestLiters(Number(e.target.value) || 0)}
                style={{ width: "120px", padding: "0.3rem 0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: 600 }}
              />
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Liters ({(testLiters / 1000).toFixed(1)} kL)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIGURED TARIFF PLANS (3 SIDE BY SIDE IN GRID) ── */}
      <div style={{ marginBottom: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#0f172a" }}>Configured Tariff Plans ({plans.length})</h2>
        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>3 plans per row</span>
      </div>

      {plans.length === 0 ? (
        <div className="admin-card">
          <div className="empty-state-card" style={{ padding: "3rem 1.5rem" }}>
            <div className="empty-state-icon" style={{ fontSize: "2.5rem" }}>🏷️</div>
            <h3 style={{ fontSize: "1.15rem", marginTop: "0.75rem" }}>No Tariff Plans Configured</h3>
            <p style={{ color: "#64748b", maxWidth: "420px", margin: "0.5rem auto 1.25rem" }}>
              Use the container above to configure your first custom tariff plan with rate slabs.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 3-Column Grid */}
          <div className="plans-grid-3col">
            {paginatedPlans.map((p) => {
              const simResult = calculateSim(p, testLiters);
              const isCurrentlyEditing = String(editingPlanId) === String(p.id);

              return (
                <div
                  key={p.id}
                  className={`plan-card-compact ${isCurrentlyEditing ? "plan-card-compact--editing" : ""} ${p.isDefault ? "plan-card-compact--default" : ""}`}
                >
                  <div>
                    {/* Header Badges */}
                    <div className="plan-card-compact__header">
                      <span className={`badge ${p.type === "TIERED" ? "badge--success" : "badge--neutral"}`} style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>
                        {p.type === "TIERED" ? "⚡ Tiered Slabs" : "🔹 Flat Rate"}
                      </span>
                      {p.isDefault ? (
                        <span style={{ background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                          ★ Default Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(p.id, p.name)}
                          style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.72rem", cursor: "pointer", textDecoration: "underline" }}
                        >
                          Make Default
                        </button>
                      )}
                    </div>

                    {/* Plan Title & Desc */}
                    <h3 className="plan-card-compact__title">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="plan-card-compact__desc">
                        {p.description}
                      </p>
                    )}

                    {/* Compact Meta Row */}
                    <div className="plan-card-compact__meta">
                      <div>Base: <strong style={{ color: "#0f172a" }}>₹{p.fixedCharge || 0}/mo</strong></div>
                      {p.freeAllowanceKL > 0 && <div>Free: <strong style={{ color: "#16a34a" }}>{p.freeAllowanceKL} kL</strong></div>}
                      <div>Tiers: <strong style={{ color: "#0284c7" }}>{p.type === "TIERED" ? (p.slabs?.length || 0) : 1}</strong></div>
                    </div>

                    {/* Compact Slabs List */}
                    {p.type === "TIERED" && p.slabs && p.slabs.length > 0 ? (
                      <div className="plan-card-compact__slabs-list">
                        {p.slabs.map((s, idx) => (
                          <div key={s.id || idx} className="plan-card-compact__slab-row">
                            <span style={{ fontWeight: 600, color: "#334155" }}>
                              {s.label || (s.toKL ? `${s.fromKL} - ${s.toKL} kL` : `Above ${s.fromKL} kL`)}
                            </span>
                            <span style={{ fontWeight: 700, color: "#0284c7" }}>
                              ₹{s.ratePerKL} <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#64748b" }}>/ kL</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ margin: "0 0 0.75rem", padding: "0.5rem", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd", fontSize: "0.78rem", color: "#0369a1" }}>
                        Flat Rate: <strong>₹{p.flatRate || 20} / kL</strong>
                      </div>
                    )}
                  </div>

                  {/* Simulator Snippet & Actions at Card Bottom */}
                  <div>
                    <div className="plan-card-compact__sim">
                      <span style={{ color: "#1e40af" }}>Simulated {(testLiters / 1000).toFixed(1)} kL:</span>
                      <strong style={{ color: "#1e3a8a", fontSize: "0.86rem" }}>₹{simResult.totalAmount.toLocaleString()}</strong>
                    </div>

                    <div className="plan-card-compact__actions">
                      <button
                        className="btn-secondary"
                        style={{
                          flex: 1,
                          padding: "0.35rem 0.5rem",
                          fontSize: "0.78rem",
                          background: isCurrentlyEditing ? "#0284c7" : "",
                          color: isCurrentlyEditing ? "#fff" : "",
                        }}
                        onClick={() => handleOpenEdit(p)}
                      >
                        {isCurrentlyEditing ? "✏️ Editing Above" : "✏️ Edit Slabs"}
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ color: "#dc2626", borderColor: "#fecaca", padding: "0.35rem 0.55rem", fontSize: "0.78rem" }}
                        onClick={() => handleDeletePlan(p.id, p.name)}
                        title="Delete this plan"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="admin-card" style={{ padding: 0 }}>
            <Pagination
              currentPage={currentPage}
              totalItems={plans.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[3, 6, 9, 12]}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default PlansPage;
