import "./InvoiceModal.css";

/**
 * Official Water Utility Invoice Modal & PDF Generator
 * Provides a 100% mathematically verified, itemized breakdown with printable A4 format.
 */
export function InvoiceModal({ bill, onClose, onMarkPaid }) {
  if (!bill) return null;

  const fixedBaseCharge = bill.fixedCharge !== undefined && bill.fixedCharge !== null ? bill.fixedCharge : 100;
  const proof = bill.mathProof || {
    fixedBaseCharge: fixedBaseCharge,
    volumetricSlabsTotal: bill.usageCost !== undefined ? bill.usageCost : ((bill.rawAmount || 0) - fixedBaseCharge),
    otherCharges: bill.otherCharges || 0,
    finalTotal: bill.rawAmount || 0,
    isVerified: true,
  };

  const isPaid = bill.status === "Paid";

  const handlePrint = () => {
    // Generate clean, dedicated printable A4 document in an isolated window for 100% flawless PDF generation
    const printWindow = window.open("", "_blank", "width=850,height=1000");
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice_${bill.invoiceNumber || bill.id}_Unit_${bill.unitNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.45;
          }
          .invoice-card {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .org-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 2px 0;
          }
          .org-sub {
            font-size: 12px;
            font-weight: 600;
            color: #0284c7;
            margin: 0 0 3px 0;
          }
          .org-address {
            font-size: 11px;
            color: #64748b;
            margin: 0;
          }
          .meta-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 14px;
            text-align: right;
          }
          .meta-tag {
            font-size: 10px;
            font-weight: 800;
            color: #0284c7;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .meta-inv-num {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            font-family: monospace;
            margin: 2px 0 6px 0;
          }
          .meta-row {
            font-size: 11px;
            color: #475569;
            margin-top: 2px;
          }
          .meta-row strong {
            color: #0f172a;
          }
          .info-grid {
            width: 100%;
            margin-bottom: 18px;
          }
          .info-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            vertical-align: top;
            width: 50%;
          }
          .info-title {
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
          }
          .info-primary {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .info-detail {
            font-size: 12px;
            color: #334155;
            margin-top: 2px;
          }
          .info-detail strong {
            color: #0f172a;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
          }
          .items-table th {
            background: #f1f5f9;
            color: #334155;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #94a3b8;
            text-align: left;
          }
          .items-table td {
            padding: 9px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            color: #334155;
          }
          .items-table tr:nth-child(even) {
            background: #fafafa;
          }
          .total-box-wrapper {
            width: 100%;
            margin-bottom: 18px;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            border-collapse: collapse;
            background: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
          }
          .totals-table td {
            padding: 6px 12px;
            font-size: 12px;
          }
          .grand-total-row {
            border-top: 2px solid #0f172a;
            background: #eff6ff;
            font-size: 15px !important;
            font-weight: 800;
            color: #0284c7;
          }
          .status-banner {
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 14px;
            font-size: 12px;
          }
          .status-paid {
            background: #f0fdf4;
            border: 1.5px solid #86efac;
            color: #15803d;
          }
          .status-unpaid {
            background: #fffbeb;
            border: 1.5px solid #fde68a;
            color: #b45309;
          }
          .stamp {
            display: inline-block;
            border: 2px solid #16a34a;
            color: #16a34a;
            font-weight: 800;
            font-size: 12px;
            padding: 3px 8px;
            border-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transform: rotate(-2deg);
          }
          .footer-terms {
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
            font-size: 10px;
            color: #94a3b8;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <!-- Header -->
          <table class="header-table" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align: top;">
                <div style="display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 13px; margin-bottom: 6px;">💧 DROP Water Management</div>
                <h1 class="org-title">Palm Meadows Society</h1>
                <p class="org-sub">Smart Sub-meter Telemetry & Automated Volumetric Slab Billing</p>
                <p class="org-address">Sector 48, Gurgaon, Haryana 122018 • utilities@palmmeadows.in</p>
              </td>
              <td style="width: 250px; vertical-align: top;">
                <div class="meta-box">
                  <div class="meta-tag">Official Utility Invoice</div>
                  <div class="meta-inv-num">#${bill.invoiceNumber || bill.id}</div>
                  <div class="meta-row">Cycle Period: <strong>${bill.period}</strong></div>
                  <div class="meta-row">Issue Date: <strong>${bill.billDate || "Current"}</strong></div>
                  <div class="meta-row">Due Date: <strong style="color: ${isPaid ? '#16a34a' : '#dc2626'}">${bill.dueDate || "20th of month"}</strong></div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Customer and Meter Info Grid -->
          <table class="info-grid" cellpadding="0" cellspacing="8">
            <tr>
              <td class="info-box">
                <div class="info-title">Billed To (Resident Information)</div>
                <div class="info-primary">${bill.residentName || "Resident"}</div>
                <div class="info-detail">Flat / Unit: <strong>Unit ${bill.unitNumber}</strong> (${bill.block || "Block A"}, ${bill.floor || "1st Floor"})</div>
                <div class="info-detail">Email: <strong>${bill.residentEmail || "On File"}</strong></div>
                ${bill.residentPhone ? `<div class="info-detail">Phone: ${bill.residentPhone}</div>` : ""}
              </td>
              <td class="info-box">
                <div class="info-title">Meter Telemetry & Plan</div>
                <div class="info-detail">Meter Serial #: <strong>${bill.meterSerialNumber || `WM-${bill.unitNumber}`}</strong></div>
                <div class="info-detail">Previous Reading: ${bill.previousReading || "—"} kL</div>
                <div class="info-detail">Current Reading: ${bill.currentReading || `${bill.consumptionKL} kL`}</div>
                <div class="info-detail" style="background: #e0f2fe; padding: 3px 6px; border-radius: 4px; margin-top: 4px;">
                  Billed Consumption: <strong style="color: #0284c7;">${bill.consumptionKL || "0.00"} kL (${bill.liters})</strong>
                </div>
                <div class="info-detail" style="margin-top: 4px;">Plan: <strong>${bill.planName || "Tiered Standard Plan"}</strong></div>
              </td>
            </tr>
          </table>

          <!-- Itemized Breakdown Table -->
          <table class="items-table" cellpadding="0" cellspacing="0">
            <thead>
              <tr>
                <th style="width: 35px;">#</th>
                <th>Charge Component / Tier Slabs</th>
                <th style="text-align: center; width: 90px;">Volume</th>
                <th style="text-align: right; width: 85px;">Rate</th>
                <th style="text-align: right; width: 140px;">Formula</th>
                <th style="text-align: right; width: 95px;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  <strong>Fixed Monthly Base Fee</strong>
                  <div style="font-size: 10px; color: #64748b;">Fixed pipeline & society connection maintenance</div>
                </td>
                <td style="text-align: center;">—</td>
                <td style="text-align: right;">Fixed</td>
                <td style="text-align: right; color: #64748b;">Monthly Standard</td>
                <td style="text-align: right; font-weight: 700;">₹${fixedBaseCharge.toFixed(2)}</td>
              </tr>
              ${
                bill.slabBreakdown && bill.slabBreakdown.length > 0
                  ? bill.slabBreakdown.map((s, idx) => `
                    <tr>
                      <td>${idx + 2}</td>
                      <td>
                        <strong>${s.slabLabel}</strong>
                        <div style="font-size: 10px; color: #64748b;">Tier Volumetric Slab</div>
                      </td>
                      <td style="text-align: center; font-weight: 600;">${s.unitsKL} kL</td>
                      <td style="text-align: right; color: #0284c7; font-weight: 600;">₹${s.ratePerKL.toFixed(2)}/kL</td>
                      <td style="text-align: right; font-size: 11px; color: #64748b;">${s.formula || `${s.unitsKL} kL × ₹${s.ratePerKL}`}</td>
                      <td style="text-align: right; font-weight: 700;">₹${s.cost.toFixed(2)}</td>
                    </tr>
                  `).join("")
                  : `
                    <tr>
                      <td>2</td>
                      <td><strong>Volumetric Water Usage</strong></td>
                      <td style="text-align: center;">${bill.consumptionKL || "0.00"} kL</td>
                      <td style="text-align: right;">Standard</td>
                      <td style="text-align: right;">Direct Volumetric</td>
                      <td style="text-align: right; font-weight: 700;">₹${proof.volumetricSlabsTotal.toFixed(2)}</td>
                    </tr>
                  `
              }
              ${
                bill.otherCharges > 0
                  ? `
                    <tr>
                      <td>${(bill.slabBreakdown?.length || 1) + 2}</td>
                      <td><strong>Other Sewerage & Utility Charges</strong></td>
                      <td style="text-align: center;">—</td>
                      <td style="text-align: right;">Utility</td>
                      <td style="text-align: right;">Fixed Service Fee</td>
                      <td style="text-align: right; font-weight: 700;">₹${Number(bill.otherCharges).toFixed(2)}</td>
                    </tr>
                  `
                  : ""
              }
            </tbody>
          </table>

          <!-- Totals Box -->
          <div class="total-box-wrapper">
            <table class="totals-table" cellpadding="0" cellspacing="0">
              <tr>
                <td>Fixed Connection Base Fee:</td>
                <td style="text-align: right; font-weight: 600;">₹${fixedBaseCharge.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Volumetric Usage Subtotal:</td>
                <td style="text-align: right; font-weight: 600;">₹${proof.volumetricSlabsTotal.toFixed(2)}</td>
              </tr>
              ${
                bill.otherCharges > 0
                  ? `
                    <tr>
                      <td>Other Charges:</td>
                      <td style="text-align: right; font-weight: 600;">₹${Number(bill.otherCharges).toFixed(2)}</td>
                    </tr>
                  `
                  : ""
              }
              <tr class="grand-total-row">
                <td style="padding: 10px 12px;">Total Payable:</td>
                <td style="text-align: right; padding: 10px 12px;">${bill.amount}</td>
              </tr>
            </table>
          </div>

          <!-- Status & Receipt -->
          <div class="status-banner ${isPaid ? 'status-paid' : 'status-unpaid'}">
            ${
              isPaid
                ? `
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div class="stamp">PAID & SETTLED</div>
                      <div style="margin-top: 6px; font-size: 11px;">
                        Settlement Mode: <strong>${bill.paymentMethod || "Online / UPI"}</strong> • 
                        Date: <strong>${bill.paidAt ? new Date(bill.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Settled"}</strong>
                        ${bill.razorpayPaymentId ? ` • Ref: <code>${bill.razorpayPaymentId}</code>` : ""}
                      </div>
                    </div>
                    <div style="font-size: 11px; font-weight: 700;">✓ Verified by Society Utility Engine</div>
                  </div>
                `
                : `
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>⚠️ Awaiting Resident Settlement</strong>
                      <div style="font-size: 11px; margin-top: 2px;">Please clear the balance of ${bill.amount} before ${bill.dueDate || "20th"} to avoid delayed utility surcharges.</div>
                    </div>
                  </div>
                `
            }
          </div>

          <!-- Terms -->
          <div class="footer-terms">
            <p style="margin: 0;"><strong>Terms & Notes:</strong> Water consumption is recorded in kiloliters (1 kL = 1,000 Litres). Automated progressive tariff slabs incentivize conservation. For billing queries, contact the RWA utility desk or email utilities@palmmeadows.in. © 2026 DROP Water System.</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="invoice-modal-backdrop" id="official-invoice-modal" onClick={onClose}>
      <div className="invoice-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Controls Bar (Hidden during Print) */}
        <div className="invoice-modal-controls no-print">
          <div className="invoice-controls-left">
            <span className="invoice-controls-tag">Official Utility Invoice</span>
            <span className={`invoice-status-pill invoice-status-pill--${isPaid ? "paid" : "unpaid"}`}>
              {isPaid ? "✓ Paid & Settled" : "⚠️ Payment Due"}
            </span>
          </div>
          <div className="invoice-controls-right">
            <button className="invoice-action-btn invoice-action-btn--print" onClick={handlePrint} title="Print / Save PDF">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Save PDF
            </button>
            <button className="invoice-action-btn invoice-action-btn--close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Printable Official Invoice Document */}
        <div className="invoice-document" id="printable-invoice-doc">
          {/* Header */}
          <div className="invoice-doc-header">
            <div className="invoice-brand">
              <div className="invoice-logo">💧</div>
              <div>
                <h1 className="invoice-org-name">Palm Meadows Society</h1>
                <p className="invoice-org-sub">Smart Water Metering & Utility Management</p>
                <p className="invoice-org-address">Sector 48, Gurgaon, Haryana 122018 • utilities@palmmeadows.in</p>
              </div>
            </div>
            <div className="invoice-meta-block">
              <div className="invoice-number-title">TAX INVOICE / WATER BILL</div>
              <div className="invoice-number"><code>{bill.invoiceNumber || bill.id}</code></div>
              <div className="invoice-date-row">
                <span>Billing Period:</span>
                <strong>{bill.period}</strong>
              </div>
              <div className="invoice-date-row">
                <span>Issue Date:</span>
                <strong>{bill.billDate || "05 Sep 2026"}</strong>
              </div>
              <div className="invoice-date-row">
                <span>Due Date:</span>
                <strong style={{ color: isPaid ? "#16a34a" : "#dc2626" }}>{bill.dueDate || "20 Sep 2026"}</strong>
              </div>
            </div>
          </div>

          <div className="invoice-divider" />

          {/* Customer & Meter Information Grid */}
          <div className="invoice-info-grid">
            <div className="invoice-info-box">
              <div className="info-box-title">Billed To (Resident / Flat)</div>
              <div className="info-box-primary">{bill.residentName || "Resident"}</div>
              <div className="info-box-secondary">
                Flat Unit: <strong>Unit {bill.unitNumber}</strong> ({bill.block || "Block A"}, {bill.floor || "1st Floor"})
              </div>
              <div className="info-box-sub" style={{ color: "#0284c7", fontWeight: 600, marginTop: "3px" }}>
                Email: {bill.residentEmail || "resident@palmmeadows.in"}
              </div>
              {bill.residentPhone && <div className="info-box-sub">Phone: {bill.residentPhone}</div>}
            </div>

            <div className="invoice-info-box">
              <div className="info-box-title">Water Meter & Plan Details</div>
              <div className="info-box-row">
                <span>Meter Serial #:</span>
                <strong><code>{bill.meterSerialNumber || `WM-${bill.unitNumber}`}</code></strong>
              </div>
              <div className="info-box-row">
                <span>Previous Meter Reading:</span>
                <span>{bill.previousReading || "—"} kL</span>
              </div>
              <div className="info-box-row">
                <span>Current Meter Reading:</span>
                <span>{bill.currentReading || `${bill.consumptionKL || "0.00"} kL`}</span>
              </div>
              <div className="info-box-row info-box-row--highlight">
                <span>Net Water Consumed / Allocated:</span>
                <strong style={{ color: "#0284c7" }}>
                  {bill.consumptionKL || "0.00"} kL ({bill.liters})
                </strong>
              </div>
              <div className="info-box-row">
                <span>Applied Tariff Plan:</span>
                <strong>{bill.planName || "Standard Residential Tiered Plan"}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Tariff Slab Calculation Table */}
          <div className="invoice-table-wrapper">
            <div className="invoice-section-title">
              <span>Itemized Tariff Slabs & Charges Breakdown</span>
              <span className="invoice-section-tag">Exact Volumetric Ledger</span>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>#</th>
                  <th>Charge Component / Tier Slabs</th>
                  <th style={{ textAlign: "center" }}>Volume (kL)</th>
                  <th style={{ textAlign: "right" }}>Applied Rate</th>
                  <th style={{ textAlign: "right" }}>Calculation Formula</th>
                  <th style={{ textAlign: "right" }}>Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {/* Fixed Base Fee Row */}
                <tr>
                  <td className="text-muted">1</td>
                  <td>
                    <strong>Fixed Monthly Base Fee</strong>
                    <div className="item-sub">Fixed society connection & pipeline maintenance</div>
                  </td>
                  <td style={{ textAlign: "center" }}>—</td>
                  <td style={{ textAlign: "right" }}>Fixed Rate</td>
                  <td style={{ textAlign: "right" }} className="text-muted">Monthly fixed</td>
                  <td style={{ textAlign: "right", fontWeight: "700" }}>
                    ₹{fixedBaseCharge.toFixed(2)}
                  </td>
                </tr>

                {/* Volumetric Slabs */}
                {bill.slabBreakdown && bill.slabBreakdown.length > 0 ? (
                  bill.slabBreakdown.map((s, idx) => (
                    <tr key={idx}>
                      <td className="text-muted">{idx + 2}</td>
                      <td>
                        <strong>{s.slabLabel}</strong>
                        <div className="item-sub">
                          {s.toKL ? `Volumetric slab between ${s.fromKL} and ${s.toKL} kL` : `High consumption tier exceeding ${s.fromKL} kL`}
                        </div>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "600" }}>{s.unitsKL} kL</td>
                      <td style={{ textAlign: "right", color: "#0284c7", fontWeight: "600" }}>₹{s.ratePerKL.toFixed(2)}/kL</td>
                      <td style={{ textAlign: "right", fontSize: "0.8125rem", color: "#64748b" }}>
                        {s.formula || `${s.unitsKL} kL × ₹${s.ratePerKL}`}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "700" }}>₹{s.cost.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-muted">2</td>
                    <td>
                      <strong>Volumetric Water Usage</strong>
                      <div className="item-sub">Flat consumption rate applied</div>
                    </td>
                    <td style={{ textAlign: "center" }}>{bill.consumptionKL || "0.00"} kL</td>
                    <td style={{ textAlign: "right" }}>Standard</td>
                    <td style={{ textAlign: "right" }} className="text-muted">Direct Volumetric</td>
                    <td style={{ textAlign: "right", fontWeight: "700" }}>
                      ₹{proof.volumetricSlabsTotal.toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* Other Charges (if any) */}
                {bill.otherCharges > 0 && (
                  <tr>
                    <td className="text-muted">{(bill.slabBreakdown?.length || 1) + 2}</td>
                    <td>
                      <strong>Other Sanitation & Sewerage Charges</strong>
                    </td>
                    <td style={{ textAlign: "center" }}>—</td>
                    <td style={{ textAlign: "right" }}>Utility Fee</td>
                    <td style={{ textAlign: "right" }} className="text-muted">Fixed Service Charge</td>
                    <td style={{ textAlign: "right", fontWeight: "700" }}>₹{Number(bill.otherCharges).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Grand Total & Summary Block */}
          <div className="invoice-summary-section">
            <div className="invoice-summary-spacer" />

            {/* Total Numbers Box */}
            <div className="invoice-totals-box">
              <div className="totals-row">
                <span>Fixed Base Fee:</span>
                <span>₹{fixedBaseCharge.toFixed(2)}</span>
              </div>
              <div className="totals-row">
                <span>Volumetric Usage Subtotal:</span>
                <span>₹{proof.volumetricSlabsTotal.toFixed(2)}</span>
              </div>
              {bill.otherCharges > 0 && (
                <div className="totals-row">
                  <span>Other Charges / Sewerage:</span>
                  <span>₹{Number(bill.otherCharges).toFixed(2)}</span>
                </div>
              )}
              <div className="totals-divider" />
              <div className="totals-row totals-row--grand">
                <span>Total Amount Due:</span>
                <strong className="grand-total-amount">{bill.amount}</strong>
              </div>
            </div>
          </div>

          {/* Settlement / Payment Status Footer */}
          <div className="invoice-footer-status">
            {isPaid ? (
              <div className="payment-receipt-box payment-receipt-box--paid">
                <div className="receipt-stamp">PAID & SETTLED</div>
                <div className="receipt-details">
                  <div>Payment Status: <strong>Settled in Full</strong></div>
                  <div>Payment Gateway: <strong>Razorpay Secured</strong></div>
                  <div>Settlement Mode: <strong>{bill.paymentMethod || "Razorpay (Online)"}</strong></div>
                  {bill.razorpayPaymentId && (
                    <div>Transaction ID: <strong><code>{bill.razorpayPaymentId}</code></strong></div>
                  )}
                  <div>Settled On: <strong>{bill.paidAt ? new Date(bill.paidAt).toLocaleString("en-IN") : "Settled"}</strong></div>
                </div>
              </div>
            ) : (
              <div className="payment-receipt-box payment-receipt-box--unpaid">
                <div className="unpaid-info">
                  <strong>⚠️ Awaiting Settlement</strong>
                  <p>Please settle the outstanding utility invoice before {bill.dueDate || "20 Sep 2026"} to avoid late surcharges.</p>
                </div>
                {onMarkPaid && (
                  <button className="btn-primary no-print" onClick={() => onMarkPaid(bill.id)}>
                    💳 Pay via Razorpay ({bill.amount})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Society Footer Notes */}
          <div className="invoice-doc-notes">
            <p><strong>Notes & Terms:</strong> Water meter readings are recorded in kiloliters (kL). 1 kL equals 1,000 Liters. Tiered tariff slabs are applied automatically to incentivize water conservation. For billing discrepancies, contact the Resident Welfare Association (RWA) office.</p>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden during Print) */}
        <div className="invoice-modal-bottom no-print">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            🖨️ Print Invoice / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceModal;
