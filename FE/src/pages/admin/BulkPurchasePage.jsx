import { useState, useEffect } from "react";
import { dataStore } from "../../services/store";
import Pagination from "../../components/Pagination";
import "./HouseholdsPage.css";
import "./BulkPurchasePage.css";

function BulkPurchasePage() {
  const [purchases, setPurchases] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [notification, setNotification] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form State with versatile custom inputs
  const [formData, setFormData] = useState({
    itemName: "",
    category: "Water Supply",
    vendorName: "",
    referenceNumber: "",
    quantity: "",
    unitOfMeasure: "kL",
    totalCost: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    targetType: "ALL", // "ALL" | "BLOCK" | "SELECTED"
    targetBlock: "Block A",
    selectedUnits: [],
    billToResidents: true,
    notes: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = () => {
    setPurchases(dataStore.getBulkPurchases());
    setHouseholds(dataStore.getHouseholds());
  };

  useEffect(() => {
    loadData();
  }, []);

  const uniqueBlocks = Array.from(new Set(households.map((h) => h.block).filter(Boolean)));

  // Calculate target units count for live preview
  let previewUnitsCount = households.length;
  if (formData.targetType === "BLOCK") {
    previewUnitsCount = households.filter((h) => h.block === formData.targetBlock).length;
  } else if (formData.targetType === "SELECTED") {
    previewUnitsCount = formData.selectedUnits.length;
  }

  const costNumber = Number(formData.totalCost) || 0;
  const previewCostPerUnit = previewUnitsCount > 0 ? (costNumber / previewUnitsCount).toFixed(2) : "0.00";

  const handleUnitToggle = (unitNumber) => {
    setFormData((prev) => {
      const exists = prev.selectedUnits.includes(unitNumber);
      return {
        ...prev,
        selectedUnits: exists
          ? prev.selectedUnits.filter((u) => u !== unitNumber)
          : [...prev.selectedUnits, unitNumber],
      };
    });
  };

  const handleSelectAllUnits = () => {
    setFormData((prev) => ({
      ...prev,
      selectedUnits: households.map((h) => h.unitNumber),
    }));
  };

  const handleDeselectAllUnits = () => {
    setFormData((prev) => ({
      ...prev,
      selectedUnits: [],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemName.trim() || !formData.vendorName.trim() || !formData.totalCost) {
      setNotification("❌ Please enter item name, vendor, and total cost.");
      return;
    }

    if (formData.billToResidents && formData.targetType === "SELECTED" && formData.selectedUnits.length === 0) {
      setNotification("❌ Please select at least one unit to bill.");
      return;
    }

    const result = dataStore.addBulkPurchase({
      itemName: formData.itemName,
      category: formData.category,
      vendorName: formData.vendorName,
      referenceNumber: formData.referenceNumber,
      quantity: formData.quantity,
      unitOfMeasure: formData.unitOfMeasure,
      totalCost: formData.totalCost,
      purchaseDate: formData.purchaseDate,
      targetType: formData.targetType,
      targetBlock: formData.targetBlock,
      selectedUnits: formData.selectedUnits,
      notes: formData.notes,
      billToResidents: formData.billToResidents,
    });

    loadData();
    setShowModal(false);
    setFormData({
      itemName: "",
      category: "Water Supply",
      vendorName: "",
      referenceNumber: "",
      quantity: "",
      unitOfMeasure: "kL",
      totalCost: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      targetType: "ALL",
      targetBlock: uniqueBlocks[0] || "Block A",
      selectedUnits: [],
      billToResidents: true,
      notes: "",
    });
    setCurrentPage(1);
    const billCount = result?.bills?.length || 0;
    if (billCount > 0) {
      setNotification(`✓ Recorded bulk purchase and generated ${billCount} plain slab invoice(s) directly to involved residents & Bill Management!`);
    } else {
      setNotification("✓ External bulk purchase recorded as internal society utility expense.");
    }
    setTimeout(() => setNotification(""), 5000);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this purchase record?")) {
      dataStore.deleteBulkPurchase(id);
      loadData();
      setNotification("✓ Purchase record removed.");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  // Filtered by category
  const filteredPurchases = purchases.filter((p) => {
    if (categoryFilter === "all") return true;
    return p.category === categoryFilter;
  });

  // KPI Calculations
  const totalExpenditure = purchases.reduce((acc, p) => acc + (Number(p.totalCost) || 0), 0);
  const totalBilledToResidents = purchases
    .filter((p) => p.billToResidents)
    .reduce((acc, p) => acc + (Number(p.totalCost) || 0), 0);
  const totalInternalExpense = totalExpenditure - totalBilledToResidents;

  // Pagination slice
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPurchases = filteredPurchases.slice(startIndex, startIndex + pageSize);

  return (
    <div className="admin-page" id="bulk-purchase-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Bulk & External Purchases</h1>
          <p className="admin-page__subtitle">
            Record any external utility procurement (water tankers, maintenance supplies, treatment chemicals, fuel) and allocate billing to all or selected flats
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setShowModal(true)}
          id="btn-record-purchase-top"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Record External Purchase</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification-banner ${notification.startsWith("✓") ? "notification-banner--success" : "notification-banner--error"}`}>
          {notification}
        </div>
      )}

      {/* KPI Cards */}
      <div className="bulk-kpi-grid">
        <div className="bulk-kpi-card">
          <div className="bulk-kpi-icon blue">📦</div>
          <div className="bulk-kpi-info">
            <span className="bulk-kpi-label">Total Procurements</span>
            <span className="bulk-kpi-val">{purchases.length} Orders</span>
            <span className="bulk-kpi-sub blue-sub">External Utility Services</span>
          </div>
        </div>

        <div className="bulk-kpi-card">
          <div className="bulk-kpi-icon amber">💰</div>
          <div className="bulk-kpi-info">
            <span className="bulk-kpi-label">Total Expenditure</span>
            <span className="bulk-kpi-val">₹{totalExpenditure.toLocaleString()}</span>
            <span className="bulk-kpi-sub">Total External Outflow</span>
          </div>
        </div>

        <div className="bulk-kpi-card">
          <div className="bulk-kpi-icon green">📑</div>
          <div className="bulk-kpi-info">
            <span className="bulk-kpi-label">Billed to Residents</span>
            <span className="bulk-kpi-val">₹{totalBilledToResidents.toLocaleString()}</span>
            <span className="bulk-kpi-sub green-sub">
              {purchases.filter((p) => p.billToResidents).length} Orders Allocated
            </span>
          </div>
        </div>

        <div className="bulk-kpi-card">
          <div className="bulk-kpi-icon teal">🏢</div>
          <div className="bulk-kpi-info">
            <span className="bulk-kpi-label">Society Absorbed</span>
            <span className="bulk-kpi-val">₹{totalInternalExpense.toLocaleString()}</span>
            <span className="bulk-kpi-sub">Internal Maintenance Fund</span>
          </div>
        </div>
      </div>

      {/* Table Section with Category Filters */}
      <div className="admin-card">
        <div className="bulk-table-header">
          <div>
            <h2>External Procurement & Surcharge Ledger</h2>
            <p>Complete audit of external purchases and resident surcharge allocations</p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="admin-page__select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ fontSize: "0.8125rem", padding: "6px 12px" }}
            >
              <option value="all">All Categories</option>
              <option value="Water Supply">Water Supply / Tankers</option>
              <option value="Maintenance & Repairs">Maintenance & Repairs</option>
              <option value="Treatment & Chemicals">Treatment & Chemicals</option>
              <option value="Fuel & Energy">Fuel & Energy</option>
              <option value="Plumbing Materials">Plumbing Materials</option>
              <option value="Other">Other Services</option>
            </select>
            <span className="bulk-records-tag">{filteredPurchases.length} records</span>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">📦</div>
            <h3>No External Purchases In This View</h3>
            <p>Click "Record External Purchase" to log any bulk supply, tanker, chemical, or maintenance purchase.</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Item / Purchase Title</th>
                  <th>Category</th>
                  <th>Supplier / Vendor</th>
                  <th>Custom Quantity</th>
                  <th>Total Cost</th>
                  <th>Allocation Target</th>
                  <th>Cost / Flat</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPurchases.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.id}</code></td>
                    <td>
                      <strong>{p.itemName || "External Purchase"}</strong>
                      {p.referenceNumber && (
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: "2px" }}>
                          Ref: <code>{p.referenceNumber}</code>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="category-chip">
                        {p.category || "General"}
                      </span>
                    </td>
                    <td>{p.vendorName}</td>
                    <td>
                      <span className="badge badge--info" style={{ fontWeight: 700 }}>
                        {p.quantity} {p.unitOfMeasure}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--gray-900)", fontSize: "0.95rem" }}>
                        ₹{Number(p.totalCost).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      {p.targetType === "ALL" && (
                        <span className="target-pill target-pill--all">All Flats ({p.billedUnits?.length || 0})</span>
                      )}
                      {p.targetType === "BLOCK" && (
                        <span className="target-pill target-pill--block">{p.targetBlock} ({p.billedUnits?.length || 0})</span>
                      )}
                      {p.targetType === "SELECTED" && (
                        <span className="target-pill target-pill--selected">Selected Flats ({p.billedUnits?.length || 0})</span>
                      )}
                    </td>
                    <td>
                      {p.billToResidents ? (
                        <strong style={{ color: "var(--blue-600)" }}>₹{p.costPerUnit}</strong>
                      ) : (
                        <span style={{ color: "var(--gray-400)", fontSize: "0.8rem" }}>Society Fund</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.billToResidents ? "badge--success" : "badge--warning"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.purchaseDate}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button 
                          className="btn-table-action"
                          onClick={() => setSelectedPurchase(p)}
                          title="View Allocation Breakdown"
                        >
                          Details
                        </button>
                        <button 
                          className="btn-table-action"
                          style={{ color: "var(--red-600)", borderColor: "#fecaca" }}
                          onClick={() => handleDelete(p.id)}
                          title="Delete Record"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredPurchases.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </>
        )}
      </div>

      {/* Floating Action Button in bottom right */}
      <button 
        className="floating-add-btn" 
        onClick={() => setShowModal(true)} 
        title="Record New External Bulk Purchase"
        id="fab-add-purchase"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Record Purchase</span>
      </button>

      {/* ── FLOATING POPUP MODAL FOR RECORDING BULK PURCHASE ── */}
      {showModal && (
        <div className="floating-modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) setShowModal(false);
        }}>
          <div className="floating-modal-popup">
            <div className="floating-modal-header">
              <div className="modal-title-col">
                <div className="modal-badge-pill">
                  <span className="dot"></span>
                  <span>External Utility Procurement</span>
                </div>
                <h2>Record External Purchase</h2>
                <p>Fill in any service, supply, or repair purchase and choose resident allocation</p>
              </div>
              <button 
                className="floating-modal-close" 
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="floating-modal-body">
              {/* Row 1: Item Name & Category */}
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Purchase / Item / Service Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Water Tanker Sump Refill, Borewell Pump Repair, STP Chemical Salt"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Water Supply">Water Supply / Tankers</option>
                    <option value="Maintenance & Repairs">Maintenance & Repairs</option>
                    <option value="Treatment & Chemicals">Treatment & Chemicals</option>
                    <option value="Fuel & Energy">Fuel & Energy</option>
                    <option value="Plumbing Materials">Plumbing Materials</option>
                    <option value="Other">Other Services</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Supplier / Vendor & Reference / Invoice # */}
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier / Vendor / Contractor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Kaveri Water Supplies, AquaTech Engineers"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Invoice / Vehicle / Reference # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-8940, KA-01-E-4589"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3: Custom Quantity, Custom Unit, Total Cost, Date */}
              <div className="form-row form-row-4col">
                <div className="form-group">
                  <label>Custom Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    placeholder="e.g. 12, 1, 500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kL, Litres, Kg, Units, Trips, Job, Hours"
                    value={formData.unitOfMeasure}
                    onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Total Cost (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 1800"
                    value={formData.totalCost}
                    onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Resident Billing Configuration Card */}
              <div className="bulk-billing-config-box">
                <div className="bulk-billing-toggle-row">
                  <div>
                    <strong>Generate Plain Slab Invoices to Residents</strong>
                    <p style={{ fontSize: "0.78rem", color: "var(--gray-500)", margin: 0 }}>
                      Directly generates plain slab invoices for all involved residents and logs bills in Bill Management
                    </p>
                  </div>
                  <label className="switch-toggle">
                    <input
                      type="checkbox"
                      checked={formData.billToResidents}
                      onChange={(e) => setFormData({ ...formData, billToResidents: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                {formData.billToResidents && (
                  <div className="bulk-target-options">
                    <div className="form-group">
                      <label>Select Allocation Target Group:</label>
                      <div className="target-radio-group">
                        <label className={`target-radio-card ${formData.targetType === "ALL" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="targetType"
                            value="ALL"
                            checked={formData.targetType === "ALL"}
                            onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                          />
                          <div>
                            <span className="target-title">All Society Flats</span>
                            <span className="target-desc">Equal split across all {households.length} units</span>
                          </div>
                        </label>

                        <label className={`target-radio-card ${formData.targetType === "BLOCK" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="targetType"
                            value="BLOCK"
                            checked={formData.targetType === "BLOCK"}
                            onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                          />
                          <div>
                            <span className="target-title">Specific Block</span>
                            <span className="target-desc">Only units in selected residential block</span>
                          </div>
                        </label>

                        <label className={`target-radio-card ${formData.targetType === "SELECTED" ? "active" : ""}`}>
                          <input
                            type="radio"
                            name="targetType"
                            value="SELECTED"
                            checked={formData.targetType === "SELECTED"}
                            onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                          />
                          <div>
                            <span className="target-title">Custom Flat Selection</span>
                            <span className="target-desc">Manually select participating flats</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Block Selector */}
                    {formData.targetType === "BLOCK" && (
                      <div className="form-group" style={{ marginTop: "12px" }}>
                        <label>Select Block to Charge:</label>
                        <select
                          value={formData.targetBlock}
                          onChange={(e) => setFormData({ ...formData, targetBlock: e.target.value })}
                        >
                          {uniqueBlocks.map((blk) => (
                            <option key={blk} value={blk}>
                              {blk} ({households.filter((h) => h.block === blk).length} flats)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Manual Unit Checkboxes */}
                    {formData.targetType === "SELECTED" && (
                      <div className="unit-selector-container">
                        <div className="unit-selector-header">
                          <label>Select Participating Flats ({formData.selectedUnits.length} chosen):</label>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button type="button" className="btn-table-action" onClick={handleSelectAllUnits}>Select All</button>
                            <button type="button" className="btn-table-action" onClick={handleDeselectAllUnits}>Clear</button>
                          </div>
                        </div>

                        <div className="unit-checkbox-grid">
                          {households.map((h) => {
                            const isChecked = formData.selectedUnits.includes(h.unitNumber);
                            return (
                              <label key={h.id} className={`unit-check-pill ${isChecked ? "checked" : ""}`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleUnitToggle(h.unitNumber)}
                                />
                                <span>{h.unitNumber}</span>
                                <small>({h.block})</small>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Calculation Summary Box */}
                    <div className="bulk-calc-preview">
                      <div className="calc-preview-row">
                        <span>Total Expense:</span>
                        <strong>₹{costNumber.toLocaleString()}</strong>
                      </div>
                      <div className="calc-preview-row">
                        <span>Allocated Volume / Quantity:</span>
                        <span>{formData.quantity} {formData.unitOfMeasure}</span>
                      </div>
                      <div className="calc-preview-row">
                        <span>Target Units:</span>
                        <span>{previewUnitsCount} Flats</span>
                      </div>
                      <div className="calc-preview-row grand">
                        <span>Calculated Charge Per Flat:</span>
                        <span className="highlight-price">₹{previewCostPerUnit}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Notes / Work Description / Comments (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sump replenishment or scheduled pump overhaul"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Modal Actions */}
              <div className="floating-modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Save & Allocate Surcharge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Inspector Modal */}
      {selectedPurchase && (
        <div className="floating-modal-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedPurchase(null);
        }}>
          <div className="floating-modal-popup" style={{ maxWidth: 560 }}>
            <div className="floating-modal-header">
              <div>
                <h2>Order Allocation Breakdown</h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--gray-500)", margin: 0 }}>
                  Order: <code>{selectedPurchase.id}</code> • {selectedPurchase.itemName}
                </p>
              </div>
              <button className="floating-modal-close" onClick={() => setSelectedPurchase(null)}>×</button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div className="details-kpi-row">
                <div>
                  <span className="label">Total Cost</span>
                  <div className="val">₹{Number(selectedPurchase.totalCost).toLocaleString()}</div>
                </div>
                <div>
                  <span className="label">Quantity</span>
                  <div className="val">{selectedPurchase.quantity} {selectedPurchase.unitOfMeasure}</div>
                </div>
                <div>
                  <span className="label">Charge Per Flat</span>
                  <div className="val highlight">₹{selectedPurchase.costPerUnit}</div>
                </div>
              </div>

              <div style={{ marginTop: "16px", fontSize: "0.8125rem", color: "var(--gray-600)" }}>
                <div><strong>Category:</strong> {selectedPurchase.category}</div>
                <div><strong>Supplier:</strong> {selectedPurchase.vendorName}</div>
                {selectedPurchase.referenceNumber && <div><strong>Ref #:</strong> {selectedPurchase.referenceNumber}</div>}
              </div>

              <h3 style={{ fontSize: "0.9375rem", margin: "1.25rem 0 0.5rem", color: "var(--gray-900)" }}>
                Billed Units List ({selectedPurchase.billedUnits?.length || 0} flats):
              </h3>
              
              <div className="billed-units-pills">
                {(selectedPurchase.billedUnits || []).map((unit) => (
                  <span key={unit} className="billed-unit-chip">
                    Unit #{unit} • ₹{selectedPurchase.costPerUnit}
                  </span>
                ))}
              </div>

              {selectedPurchase.notes && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--gray-50)", borderRadius: "8px", fontSize: "0.8125rem", color: "var(--gray-600)" }}>
                  <strong>Notes:</strong> {selectedPurchase.notes}
                </div>
              )}

              <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-primary" onClick={() => setSelectedPurchase(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkPurchasePage;
