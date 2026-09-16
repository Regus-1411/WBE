import React, { useState, useId } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  // Calculator State for community water conservation
  const [flatCount, setFlatCount] = useState(60);
  const [activeTab, setActiveTab] = useState("admin"); // 'admin' | 'resident'
  const [openFaq, setOpenFaq] = useState(null);
  const flatSliderId = useId();

  // Realistic estimates based on volumetric sub-metering
  const estimatedWaterSaved = Math.round(flatCount * 1450); // Litres per month (avg 15-20% conservation per flat)
  const estimatedHoursSaved = Math.round(flatCount * 0.4); // Hours of manual meter recording & billing saved
  const estimatedCostSaved = Math.round(flatCount * 165); // Monetary savings from reduced water loss & energy

  const faqs = [
    {
      q: "How does DROP detect pipeline leakages?",
      a: "DROP tracks sub-meter flow trends against baseline thresholds. If an unexplained continuous non-stop flow or anomalous surge occurs during quiet hours, it flags the unit or block for inspection."
    },
    {
      q: "Can we configure tiered volumetric tariff slabs?",
      a: "Yes. Administrators can set progressive slabs (e.g. Base, Moderate, and Penalty tiers) per kilolitre, configure fixed maintenance charges, and automate monthly billing runs."
    },
    {
      q: "What features are available in the Resident Portal?",
      a: "Residents can view their daily and monthly water usage charts, inspect itemized billing breakdowns, download official PDF invoices, and track payment history."
    },
    {
      q: "How long does setup take for an apartment society?",
      a: "Setup is straightforward. Create your society account, add your blocks and flat numbers in the Household Directory, assign initial meter readings, and invite residents."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="landing-page" id="landing-page">
      {/* ── HERO SECTION ── */}
      <section className="hero-section" id="hero">
        <div className="landing-container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge__dot"></span>
              <span>Smart Community Water Management</span>
            </div>
            
            <h1 className="hero-title">
              Intelligent Water Metering & Billing for Modern Societies
            </h1>
            
            <p className="hero-subtitle">
              Automate sub-meter tracking, detect pipeline leakages early, calculate verified tiered tariff invoices, and provide transparent portal access for every resident.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="hero-btn-primary" id="hero-cta-register">
                Register Your Community
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link to="/login" className="hero-btn-secondary" id="hero-cta-login">
                Sign In to Portal
              </Link>
            </div>

            <div className="hero-trust-badges">
              <div className="trust-badge-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Automated Slabs</span>
              </div>
              <div className="trust-badge-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Role-Based Access</span>
              </div>
              <div className="trust-badge-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
                <span>Instant Invoicing</span>
              </div>
            </div>
          </div>

          {/* Hero Live Mockup Card */}
          <div className="hero-preview">
            <div className="preview-card">
              <div className="preview-header">
                <div className="preview-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="preview-title">DROP Community Water Network</div>
                <div className="preview-status-pill">
                  <span className="pulse-indicator"></span> Operational
                </div>
              </div>

              <div className="preview-body">
                <div className="preview-stat-grid">
                  <div className="preview-stat-box">
                    <span className="preview-stat-label">Daily Consumption</span>
                    <span className="preview-stat-val">18.42 <small>kL</small></span>
                    <span className="preview-stat-change positive">Within expected baseline</span>
                  </div>
                  <div className="preview-stat-box">
                    <span className="preview-stat-label">Active Meters</span>
                    <span className="preview-stat-val">48 / 48</span>
                    <span className="preview-stat-sub">100% Online</span>
                  </div>
                </div>

                {/* Simulated Block telemetry */}
                <div className="preview-chart-box">
                  <div className="preview-chart-header">
                    <span>Block Consumption Flow (kL)</span>
                    <span className="preview-chart-tag">Volumetric Slabs</span>
                  </div>
                  <div className="preview-bars">
                    <div className="preview-bar-col">
                      <div className="bar-fill" style={{ height: "62%" }}></div>
                      <span>Blk A</span>
                    </div>
                    <div className="preview-bar-col">
                      <div className="bar-fill highlight" style={{ height: "78%" }}></div>
                      <span>Blk B</span>
                    </div>
                    <div className="preview-bar-col">
                      <div className="bar-fill" style={{ height: "48%" }}></div>
                      <span>Blk C</span>
                    </div>
                    <div className="preview-bar-col">
                      <div className="bar-fill" style={{ height: "70%" }}></div>
                      <span>Blk D</span>
                    </div>
                  </div>
                </div>

                {/* Pipeline Alert Status */}
                <div className="preview-alert-row">
                  <div className="preview-alert-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  </div>
                  <div className="preview-alert-info">
                    <strong>All Pipeline Nodes Stable</strong>
                    <p>No continuous abnormal leakage detected</p>
                  </div>
                  <span className="preview-alert-badge">Normal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS STRIP ── */}
      <section className="metrics-strip">
        <div className="landing-container">
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-number">100%</span>
              <span className="metric-title">Verified Calculation</span>
              <span className="metric-desc">Automated tier mathematics with transparent slab formulas</span>
            </div>
            <div className="metric-item">
              <span className="metric-number">20–35%</span>
              <span className="metric-title">Water Conserved</span>
              <span className="metric-desc">Through heightened awareness and rapid leak resolution</span>
            </div>
            <div className="metric-item">
              <span className="metric-number">1-Click</span>
              <span className="metric-title">Billing Cycles</span>
              <span className="metric-desc">Generate community-wide monthly invoices in seconds</span>
            </div>
            <div className="metric-item">
              <span className="metric-number">Zero</span>
              <span className="metric-title">Billing Disputes</span>
              <span className="metric-desc">Auditable reading snapshots and itemized PDF receipts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ── */}
      <section className="features-section" id="features">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-subtitle">Core Platform Capabilities</span>
            <h2 className="section-title">Built Specifically for Housing Societies & Apartments</h2>
            <p className="section-desc">
              From household directory management to automated slab billing, everything you need is unified.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="feature-title">Tiered Volumetric Tariffs</h3>
              <p className="feature-desc">
                Configure customized tiered slabs (Base, Standard, and High usage) per kilolitre to incentivize water conservation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="feature-title">Leakage & Anomaly Detection</h3>
              <p className="feature-desc">
                Baseline flow tracking detects continuous trickle or abnormal overnight spikes before water is wasted or structural damage occurs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className="feature-title">Digital PDF Invoicing</h3>
              <p className="feature-desc">
                Generate itemized invoices showing previous vs current meter readings, volumetric slab calculations, and payment statuses.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="feature-title">Resident Self-Service</h3>
              <p className="feature-desc">
                Each flat resident has their own portal to review historical consumption graphs, statement details, and settle dues.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3 className="feature-title">Consumption Trends & Audits</h3>
              <p className="feature-desc">
                Comprehensive reporting modules allow committee members to export CSV and PDF summaries for society audits.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="feature-title">Household Directory</h3>
              <p className="feature-desc">
                Organize units by block and floor, register sub-meter serial numbers, and assign resident user credentials seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PORTAL ROLE SHOWCASE (INTERACTIVE TABS) ── */}
      <section className="showcase-section" id="portals">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-subtitle">Dedicated Portals</span>
            <h2 className="section-title">Engineered for Administrators & Residents</h2>
            <p className="section-desc">Tailored views for committee management and individual flat owners.</p>
          </div>

          <div className="showcase-tabs">
            <button 
              className={`showcase-tab ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
              type="button"
              id="tab-admin"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
              Society Administrators
            </button>
            <button 
              className={`showcase-tab ${activeTab === "resident" ? "active" : ""}`}
              onClick={() => setActiveTab("resident")}
              type="button"
              id="tab-resident"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Residents & Flat Owners
            </button>
          </div>

          <div className="showcase-content-box">
            {activeTab === "admin" ? (
              <div className="showcase-view admin-view">
                <div className="showcase-text">
                  <h3>Society Administration & Meter Management</h3>
                  <p>
                    Full administrative governance over every block, meter serial, monthly billing run, and leakage threshold.
                  </p>
                  <ul className="showcase-list">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      <span><strong>Batch Reading Entry:</strong> Quick tabular entry and CSV import for rapid month-end closing.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      <span><strong>Custom Tariff Plans:</strong> Configure base allowances and progressive rate slabs.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      <span><strong>Leakage Incident Hub:</strong> Log, track, and resolve plumbing alerts with status tags.</span>
                    </li>
                  </ul>
                  <Link to="/register" className="showcase-cta-btn">
                    Set Up Admin Portal
                  </Link>
                </div>
                <div className="showcase-mockup">
                  <div className="mockup-header-bar">
                    <span className="mockup-tag">Admin Directory Preview</span>
                    <span className="mockup-status">APARTMENT_ADMIN</span>
                  </div>
                  <div className="mockup-inner-table">
                    <div className="table-row-head">
                      <span>Unit</span>
                      <span>Readings (kL)</span>
                      <span>Volume</span>
                      <span>Amount</span>
                      <span>Status</span>
                    </div>
                    <div className="table-row">
                      <span>#B-402</span>
                      <span>144.2 → 158.4</span>
                      <span className="badge-blue">14.2 kL</span>
                      <span>₹397.60</span>
                      <span className="badge-pending">Unpaid</span>
                    </div>
                    <div className="table-row">
                      <span>#A-101</span>
                      <span>202.0 → 220.5</span>
                      <span className="badge-blue">18.5 kL</span>
                      <span>₹518.00</span>
                      <span className="badge-paid">Paid</span>
                    </div>
                    <div className="table-row">
                      <span>#C-301</span>
                      <span>89.3 → 98.1</span>
                      <span className="badge-blue">8.8 kL</span>
                      <span>₹258.40</span>
                      <span className="badge-paid">Paid</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="showcase-view resident-view">
                <div className="showcase-text">
                  <h3>Transparent Usage & Itemized Statements</h3>
                  <p>
                    Residents can review consumption details, examine itemized calculations, and download invoices directly.
                  </p>
                  <ul className="showcase-list">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      <span><strong>Monthly Consumption Trends:</strong> Interactive monthly bar graphs comparing usage.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      <span><strong>Itemized Invoices:</strong> Complete breakdown of fixed base charges and slab tiers.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      <span><strong>Online Status Tracking:</strong> Clear indicators for settled and pending dues.</span>
                    </li>
                  </ul>
                  <Link to="/login" className="showcase-cta-btn">
                    Resident Sign In
                  </Link>
                </div>
                <div className="showcase-mockup">
                  <div className="mockup-header-bar">
                    <span className="mockup-tag">Resident Statement Preview</span>
                    <span className="mockup-status">Unit B-402</span>
                  </div>
                  <div className="resident-mockup-card">
                    <div className="resident-due-box">
                      <div>
                        <span className="res-label">Current Statement (Sep 2026)</span>
                        <div className="res-amount">₹397.60</div>
                      </div>
                      <span className="badge-paid-pill">Awaiting Payment</span>
                    </div>
                    <div className="resident-breakdown">
                      <div className="res-row">
                        <span>Fixed Base Charge</span>
                        <strong>₹100.00</strong>
                      </div>
                      <div className="res-row">
                        <span>Tier 1 (0 – 10 kL @ ₹18)</span>
                        <strong>₹180.00</strong>
                      </div>
                      <div className="res-row">
                        <span>Tier 2 (4.2 kL @ ₹28)</span>
                        <strong>₹117.60</strong>
                      </div>
                      <div className="res-row total">
                        <span>Net Payable Amount</span>
                        <span className="blue-text">₹397.60</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CALCULATOR SECTION ── */}
      <section className="calculator-section" id="calculator">
        <div className="landing-container">
          <div className="calculator-card">
            <div className="calculator-header">
              <span className="section-subtitle">Community Estimator</span>
              <h2 className="calc-title">Estimate Monthly Conservation For Your Society</h2>
              <p className="calc-desc">
                Select the number of residential units in your community.
              </p>
            </div>

            <div className="calculator-body">
              <div className="calc-slider-group">
                <div className="calc-slider-header">
                  <label htmlFor={flatSliderId}>Number of Flats in Society:</label>
                  <span className="calc-slider-value">{flatCount} Flats</span>
                </div>
                <input
                  id={flatSliderId}
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={flatCount}
                  onChange={(e) => setFlatCount(parseInt(e.target.value, 10))}
                  className="calc-range-input"
                />
                <div className="calc-slider-markers">
                  <span>10 Flats</span>
                  <span>100 Flats</span>
                  <span>250 Flats</span>
                  <span>500+ Flats</span>
                </div>
              </div>

              <div className="calc-results-grid">
                <div className="calc-result-box">
                  <span className="result-label">Estimated Water Conserved</span>
                  <div className="result-val">{estimatedWaterSaved.toLocaleString()} <small>Litres / mo</small></div>
                  <span className="result-note">Via sub-metering awareness and leak alerts</span>
                </div>

                <div className="calc-result-box">
                  <span className="result-label">Admin Hours Saved</span>
                  <div className="result-val">{estimatedHoursSaved} <small>Hours / mo</small></div>
                  <span className="result-note">Eliminating paper logs and manual calculations</span>
                </div>

                <div className="calc-result-box highlight">
                  <span className="result-label">Estimated Cost Saved</span>
                  <div className="result-val">₹{estimatedCostSaved.toLocaleString()} <small>/ mo</small></div>
                  <span className="result-note">Lower pumping overhead and reduced water loss</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-subtitle">Workflow</span>
            <h2 className="section-title">How DROP Operates In Your Society</h2>
            <p className="section-desc">Straightforward integration with any existing water meters.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Register Society & Flats</h3>
              <p className="step-desc">
                Add residential blocks, flat numbers, sub-meter serials, and create resident user profiles.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Record Monthly Readings</h3>
              <p className="step-desc">
                Enter meter values manually or upload CSV files. DROP automatically calculates volumetric consumption.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Issue Invoices & Track</h3>
              <p className="step-desc">
                Generate monthly invoices with 1 click. Residents log in to review statements and settle dues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="faq-section" id="faq">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-subtitle">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className={`faq-item ${isOpen ? "open" : ""}`}
                  onClick={() => toggleFaq(index)}
                  id={`faq-item-${index}`}
                >
                  <button className="faq-question" type="button">
                    <span>{faq.q}</span>
                    <svg 
                      className={`faq-arrow ${isOpen ? "rotate" : ""}`} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="cta-banner">
        <div className="landing-container">
          <div className="cta-box">
            <div className="cta-text">
              <h2>Modernize Your Community’s Water Today</h2>
              <p>Join residential societies managing sub-meters and automating billing with precision.</p>
            </div>
            <div className="cta-buttons">
              <Link to="/register" className="btn-cta-primary" id="cta-bottom-register">
                Register Community
              </Link>
              <Link to="/login" className="btn-cta-outline" id="cta-bottom-login">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className="footer-brand-name">DR<span className="accent">OP</span></span>
            </div>
            <p className="footer-tagline">
              Sub-meter tracking, leakage detection, and automated volumetric utility billing for residential societies.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#portals">Portals</a>
              <a href="#calculator">Estimator</a>
              <a href="#how-it-works">How It Works</a>
            </div>
            <div className="footer-col">
              <h4>Portals</h4>
              <Link to="/login">Resident Portal</Link>
              <Link to="/login">Admin Dashboard</Link>
              <Link to="/register">Create Community</Link>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="#faq">FAQ</a>
              <span>System: Operational</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="landing-container footer-bottom-inner">
            <p>© {new Date().getFullYear()} DROP Smart Water Utilities. All rights reserved.</p>
            <div className="footer-bottom-links">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
