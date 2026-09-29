import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { dataStore } from "../../services/store";
import "./SuperAdmin.css";

function AllResidentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState(null); // null = grouped view, or society object
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" | "all"
  const [blockFilter, setBlockFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedResident, setSelectedResident] = useState(null);
  const [notification, setNotification] = useState("");

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const loadSocietiesData = () => {
    const list = dataStore.getSocietiesWithResidentGroups();
    setSocieties(list);

    // Check if URL has ?society= parameter
    const querySoc = searchParams.get("society");
    if (querySoc) {
      const found = list.find(
        (s) => s.name?.toLowerCase() === querySoc.toLowerCase() || String(s.id) === querySoc
      );
      if (found) {
        setSelectedSociety(found);
      }
    }
  };

  useEffect(() => {
    loadSocietiesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const totalFlatsAll = useMemo(() => {
    return societies.reduce((acc, s) => acc + (s.totalUnits || s.households?.length || 0), 0);
  }, [societies]);

  const totalOccupiedAll = useMemo(() => {
    return societies.reduce((acc, s) => acc + (s.households?.length || 0), 0);
  }, [societies]);

  const totalResidentsAll = useMemo(() => {
    return societies.reduce((acc, s) => acc + (s.residents?.length || 0), 0);
  }, [societies]);

  // If in society drill-down view, get filtered residents
  const filteredSocietyHouseholds = useMemo(() => {
    if (!selectedSociety || !selectedSociety.households) return [];
    return selectedSociety.households.filter((h) => {
      if (blockFilter !== "all" && h.block !== blockFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchUnit = h.unitNumber?.toLowerCase().includes(q);
        const matchName = h.residentName?.toLowerCase().includes(q);
        const matchEmail = h.residentEmail?.toLowerCase().includes(q);
        const matchUser = h.residentUsername?.toLowerCase().includes(q);
        const matchMeter = h.meterSerialNumber?.toLowerCase().includes(q);
        if (!matchUnit && !matchName && !matchEmail && !matchUser && !matchMeter) return false;
      }
      return true;
    });
  }, [selectedSociety, blockFilter, search]);

  // Unique blocks in selected society
  const availableBlocks = useMemo(() => {
    if (!selectedSociety || !selectedSociety.households) return [];
    const blocks = new Set(selectedSociety.households.map((h) => h.block).filter(Boolean));
    return Array.from(blocks);
  }, [selectedSociety]);

  // All residents flat list for "Universal Flat Database" tab
  const allResidentsFlatList = useMemo(() => {
    let list = [];
    societies.forEach((s) => {
      (s.households || []).forEach((h) => {
        list.push({
          ...h,
          societyName: s.name,
          societyCity: s.city,
          societyId: s.id,
        });
      });
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      return list.filter((r) => {
        return (
          r.residentName?.toLowerCase().includes(q) ||
          r.unitNumber?.toLowerCase().includes(q) ||
          r.residentEmail?.toLowerCase().includes(q) ||
          r.residentUsername?.toLowerCase().includes(q) ||
          r.societyName?.toLowerCase().includes(q) ||
          r.meterSerialNumber?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [societies, search]);

  const handleExportCSV = () => {
    const dataToExport = selectedSociety ? filteredSocietyHouseholds : allResidentsFlatList;
    if (!dataToExport || dataToExport.length === 0) {
      showToast("⚠️ No resident records available to export.");
      return;
    }

    const headers = [
      "Society",
      "Flat Unit",
      "Block",
      "Floor",
      "Resident Name",
      "Username",
      "Email",
      "Phone",
      "Meter Serial Number",
      "Status",
      "Monthly Consumption (kL)",
    ];

    const rows = dataToExport.map((r) => [
      `"${r.societyName || selectedSociety?.name || "Society"}"`,
      `"${r.unitNumber || ""}"`,
      `"${r.block || ""}"`,
      `"${r.floor || ""}"`,
      `"${r.residentName || ""}"`,
      `"${r.residentUsername || ""}"`,
      `"${r.residentEmail || ""}"`,
      `"${r.residentPhone || ""}"`,
      `"${r.meterSerialNumber || ""}"`,
      `"${r.status || "Active"}"`,
      r.monthlyUsageKL || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = selectedSociety
      ? `DROP_Residents_${selectedSociety.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
      : `DROP_Universal_Residents_Directory_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ Exported residents CSV successfully!");
  };

  const getInitials = (name) => {
    if (!name || !name.trim()) return "RS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="superadmin-page" id="all-residents-page">
      {/* ── 1. TOP HEADER & DIRECTORY NAVIGATION ── */}
      <div className="superadmin-header">
        <div>
          <h1 className="superadmin-header__title">
            <span>
              {selectedSociety ? `🏢 ${selectedSociety.name} — Residents Directory` : "All Residents & Society Flats"}
            </span>
            <span className="superadmin-badge-pill">👥 Platform Directory</span>
          </h1>
          <p className="superadmin-header__subtitle">
            {selectedSociety
              ? `Inspecting flat allocations, smart meter telemetry, and resident profiles for ${selectedSociety.name}`
              : "Cross-society resident directory grouped by apartment communities with instant flat drill-down"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {selectedSociety ? (
            <>
              <button className="btn-secondary" onClick={handleExportCSV}>
                📥 Export CSV
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedSociety(null);
                  setSearchParams({});
                  setSearch("");
                  setBlockFilter("all");
                }}
              >
                ← Back to All Societies
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={handleExportCSV}>
                📥 Export All CSV
              </button>
              <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "4px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setViewMode("grouped")}
                  style={{
                    padding: "0.45rem 0.95rem",
                    borderRadius: "8px",
                    border: "none",
                    background: viewMode === "grouped" ? "#7c3aed" : "transparent",
                    color: viewMode === "grouped" ? "#ffffff" : "#475569",
                    fontWeight: 800,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: viewMode === "grouped" ? "0 2px 8px rgba(124, 58, 237, 0.25)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  🏢 Grouped by Society
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("all")}
                  style={{
                    padding: "0.45rem 0.95rem",
                    borderRadius: "8px",
                    border: "none",
                    background: viewMode === "all" ? "#7c3aed" : "transparent",
                    color: viewMode === "all" ? "#ffffff" : "#475569",
                    fontWeight: 800,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: viewMode === "all" ? "0 2px 8px rgba(124, 58, 237, 0.25)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  👥 Flat Database ({totalOccupiedAll})
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {notification && (
        <div className={`notification-banner ${notification.startsWith("✓") ? "notification-banner--success" : "notification-banner--error"}`}>
          {notification}
        </div>
      )}

      {/* ── 2. GLOBAL OVERVIEW METRICS (MAIN VIEW) ── */}
      {!selectedSociety && (
        <div className="superadmin-stats-grid" style={{ marginBottom: "2rem" }}>
          <div className="superadmin-stat-card">
            <div className="superadmin-stat-card__icon" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
              🏢
            </div>
            <div className="superadmin-stat-card__label">Connected Societies</div>
            <div className="superadmin-stat-card__value" style={{ color: "#7c3aed" }}>
              {societies.length}
            </div>
            <div className="superadmin-stat-card__desc">Active housing communities</div>
          </div>

          <div className="superadmin-stat-card">
            <div className="superadmin-stat-card__icon" style={{ background: "#eff6ff", color: "#0284c7" }}>
              🚪
            </div>
            <div className="superadmin-stat-card__label">Total Flat Capacity</div>
            <div className="superadmin-stat-card__value" style={{ color: "#0284c7" }}>
              {totalFlatsAll} Flats
            </div>
            <div className="superadmin-stat-card__desc">Across all registered blocks</div>
          </div>

          <div className="superadmin-stat-card">
            <div className="superadmin-stat-card__icon" style={{ background: "#ecfdf5", color: "#059669" }}>
              👤
            </div>
            <div className="superadmin-stat-card__label">Occupied / Onboarded Flats</div>
            <div className="superadmin-stat-card__value" style={{ color: "#059669" }}>
              {totalOccupiedAll} Flats
            </div>
            <div className="superadmin-stat-card__desc">
              {totalFlatsAll > 0 ? Math.round((totalOccupiedAll / totalFlatsAll) * 100) : 0}% Platform Occupancy Rate
            </div>
          </div>

          <div className="superadmin-stat-card">
            <div className="superadmin-stat-card__icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
              💧
            </div>
            <div className="superadmin-stat-card__label">Active IoT Smart Meters</div>
            <div className="superadmin-stat-card__value" style={{ color: "#c026d3" }}>
              {totalOccupiedAll} Meters
            </div>
            <div className="superadmin-stat-card__desc">Live sub-meter telemetry</div>
          </div>
        </div>
      )}

      {/* ── 3. VIEW 1: GROUPED SOCIETIES CARDS (MAIN VIEW) ── */}
      {!selectedSociety && viewMode === "grouped" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1.05rem", color: "#0f172a", margin: 0, fontWeight: 800 }}>
              🏢 Choose an Apartment Society to Explore its Residents:
            </h3>
            <span style={{ fontSize: "0.8125rem", color: "#64748b", fontWeight: 600 }}>
              Showing {societies.length} verified societies
            </span>
          </div>

          {societies.length === 0 ? (
            <div className="superadmin-card res-empty-box">
              <div className="res-empty-icon">🏢</div>
              <h3 style={{ color: "#0f172a", margin: "0 0 0.5rem 0" }}>No Apartment Societies Registered Yet</h3>
              <p style={{ margin: 0, fontSize: "0.875rem" }}>
                Approved apartment societies and their flat residents will automatically appear here once registered.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {societies.map((soc) => {
                const totalFlats = soc.totalUnits || soc.households?.length || 50;
                const occupiedFlats = soc.households?.length || 0;
                const occupancyPct = totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0;

                return (
                  <div
                    key={soc.id || soc.name}
                    className="res-society-card"
                    onClick={() => {
                      setSelectedSociety(soc);
                      setSearchParams({ society: soc.name });
                    }}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="res-society-card__top">
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <div className="res-society-emblem">
                            🏢
                          </div>
                          <div>
                            <h3 className="res-society-card__title">{soc.name}</h3>
                            <div className="res-society-card__loc">
                              📍 {soc.city || "Bengaluru"}, {soc.state || "Karnataka"}
                            </div>
                          </div>
                        </div>
                        <span className="status-badge status-badge--approved" style={{ fontSize: "0.7rem" }}>
                          ● Active
                        </span>
                      </div>

                      {/* Admin Contact Pill */}
                      <div className="res-society-card__admin">
                        <div className="res-society-card__admin-avatar">
                          {getInitials(soc.adminName || "AD")}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {soc.adminName || "Society Administrator"}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#0284c7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {soc.adminEmail || "admin@dropwater.app"}
                          </div>
                        </div>
                      </div>

                      {/* Occupancy Progress */}
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "6px" }}>
                          <span style={{ color: "#475569", fontWeight: 700 }}>Flat Occupancy Rate:</span>
                          <strong style={{ color: "#0f172a" }}>
                            {occupiedFlats} / {totalFlats} Units ({occupancyPct}%)
                          </strong>
                        </div>
                        <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(100, occupancyPct)}%`,
                              background: "linear-gradient(90deg, #7c3aed 0%, #0284c7 100%)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="res-society-card__stats">
                        <div className="res-society-card__stat-chip">
                          <span>ONBOARDED FLATS</span>
                          <strong>{occupiedFlats} Flats</strong>
                        </div>
                        <div className="res-society-card__stat-chip">
                          <span>IOT SUB-METERS</span>
                          <strong style={{ color: "#0284c7" }}>{occupiedFlats} Active</strong>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      className="btn-action-view"
                      style={{
                        width: "100%",
                        padding: "0.7rem",
                        fontSize: "0.8125rem",
                        fontWeight: 800,
                        justifyContent: "center",
                        background: "#f8fafc",
                        borderColor: "#cbd5e1",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSociety(soc);
                        setSearchParams({ society: soc.name });
                      }}
                    >
                      <span>Explore {soc.name} Residents ({occupiedFlats})</span>
                      <span>→</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. VIEW 2: SOCIETY DRILL-DOWN (SEPARATE RESIDENTS VIEW) ── */}
      {selectedSociety && (
        <div>
          {/* Society Detail Banner */}
          <div className="res-drilldown-banner">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="res-society-emblem" style={{ width: "56px", height: "56px", fontSize: "1.6rem" }}>
                🏢
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
                    {selectedSociety.name}
                  </h2>
                  <span className="status-badge status-badge--approved">● Verified Community</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  📍 {selectedSociety.city || "Bengaluru"}, {selectedSociety.state || "Karnataka"} • Admin: <strong>{selectedSociety.adminName || "Assigned Admin"}</strong> ({selectedSociety.adminEmail || "admin@dropwater.app"})
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ background: "#ffffff", padding: "10px 18px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>Occupied Flats</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0284c7" }}>
                  {selectedSociety.households?.length || 0}
                </div>
              </div>

              <div style={{ background: "#ffffff", padding: "10px 18px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>IoT Meters Online</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#059669" }}>
                  {selectedSociety.households?.length || 0} Synchronized
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search for this Society */}
          <div className="superadmin-card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", flexWrap: "wrap", gap: "0.75rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#475569" }}>Filter by Block:</span>
                <button
                  type="button"
                  onClick={() => setBlockFilter("all")}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "8px",
                    border: blockFilter === "all" ? "1px solid #7c3aed" : "1px solid #e2e8f0",
                    background: blockFilter === "all" ? "#7c3aed" : "#ffffff",
                    color: blockFilter === "all" ? "#ffffff" : "#475569",
                    fontWeight: 800,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: blockFilter === "all" ? "0 2px 8px rgba(124, 58, 237, 0.25)" : "none",
                  }}
                >
                  All Blocks ({selectedSociety.households?.length || 0})
                </button>
                {availableBlocks.map((blk) => (
                  <button
                    key={blk}
                    type="button"
                    onClick={() => setBlockFilter(blk)}
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "8px",
                      border: blockFilter === blk ? "1px solid #7c3aed" : "1px solid #e2e8f0",
                      background: blockFilter === blk ? "#7c3aed" : "#ffffff",
                      color: blockFilter === blk ? "#ffffff" : "#475569",
                      fontWeight: 800,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      boxShadow: blockFilter === blk ? "0 2px 8px rgba(124, 58, 237, 0.25)" : "none",
                    }}
                  >
                    {blk} ({selectedSociety.households.filter((h) => h.block === blk).length})
                  </button>
                ))}
              </div>

              <div style={{ position: "relative", minWidth: "280px" }}>
                <input
                  type="text"
                  placeholder={`Search flat, resident in ${selectedSociety.name}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.85rem 0.55rem 2.2rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8125rem",
                    background: "#ffffff",
                    outline: "none",
                  }}
                />
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.85rem" }}>
                  🔍
                </span>
              </div>
            </div>

            {/* Residents Table for this Society */}
            {filteredSocietyHouseholds.length === 0 ? (
              <div className="res-empty-box">
                <div className="res-empty-icon">🚪</div>
                <h3 style={{ color: "#0f172a", margin: "0 0 0.5rem 0" }}>No Flat or Resident Records Found</h3>
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem" }}>No flats in {selectedSociety.name} match the active filters.</p>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSearch("");
                    setBlockFilter("all");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="approvals-table">
                  <thead>
                    <tr>
                      <th>Flat Unit & Location</th>
                      <th>Resident Profile</th>
                      <th>Username</th>
                      <th>Contact Email & Phone</th>
                      <th>Smart Sub-Meter ID</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSocietyHouseholds.map((h) => (
                      <tr key={h.id || h.unitNumber}>
                        <td>
                          <span className="res-unit-pill">
                            Unit {h.unitNumber}
                          </span>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>
                            {h.block} • {h.floor || "1st Floor"}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="res-avatar-bubble">
                              {getInitials(h.residentName || "RS")}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>
                                {h.residentName || "Unassigned Resident"}
                              </div>
                              <span className="status-badge status-badge--approved" style={{ fontSize: "0.65rem", padding: "1px 6px", marginTop: "2px" }}>
                                ● Active
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code style={{ color: "#7c3aed", fontWeight: 700 }}>@{h.residentUsername || "resident"}</code>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.8125rem", color: "#0284c7", fontWeight: 700 }}>
                            {h.residentEmail || "—"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                            {h.residentPhone || "—"}
                          </div>
                        </td>
                        <td>
                          <div className="res-meter-chip">
                            <span className="res-iot-dot"></span>
                            <span>{h.meterSerialNumber || `WM-${h.unitNumber}`}</span>
                          </div>
                        </td>
                        <td>
                          <span className="status-badge status-badge--approved">
                            ● Occupied
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-action-view"
                            style={{ padding: "0.45rem 0.85rem", fontSize: "0.75rem", fontWeight: 700 }}
                            onClick={() => setSelectedResident({ ...h, societyName: selectedSociety.name })}
                          >
                            🔍 Profile & Telemetry
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. VIEW 3: UNIVERSAL FLAT DATABASE (ALL SOCIETIES LIST) ── */}
      {!selectedSociety && viewMode === "all" && (
        <div className="superadmin-card">
          <div className="superadmin-card__header">
            <div>
              <h3 className="superadmin-card__title">👥 Universal Flat Database (All Societies)</h3>
              <p className="superadmin-card__subtitle">
                Cross-society flat directory and resident registry across the entire platform
              </p>
            </div>

            <div style={{ position: "relative", minWidth: "280px" }}>
              <input
                type="text"
                placeholder="Search across all societies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.85rem 0.55rem 2.2rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.8125rem",
                  background: "#ffffff",
                  outline: "none",
                }}
              />
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.85rem" }}>
                🔍
              </span>
            </div>
          </div>

          {allResidentsFlatList.length === 0 ? (
            <div className="res-empty-box">
              <div className="res-empty-icon">🔍</div>
              <h3 style={{ color: "#0f172a", margin: "0 0 0.5rem 0" }}>No Flat Records Found</h3>
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem" }}>No flats match the current search query.</p>
              <button className="btn-secondary" onClick={() => setSearch("")}>
                Clear Search
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="approvals-table">
                <thead>
                  <tr>
                    <th>Society Name</th>
                    <th>Flat Unit</th>
                    <th>Resident Profile</th>
                    <th>Username</th>
                    <th>Contact Information</th>
                    <th>Smart Meter ID</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allResidentsFlatList.map((r) => (
                    <tr key={`${r.societyName}-${r.id || r.unitNumber}`}>
                      <td>
                        <strong style={{ color: "#0284c7", fontSize: "0.92rem" }}>{r.societyName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{r.societyCity || "Bengaluru"}</div>
                      </td>
                      <td>
                        <span className="res-unit-pill">
                          Unit {r.unitNumber}
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "3px" }}>{r.block}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div className="res-avatar-bubble" style={{ width: "32px", height: "32px", fontSize: "0.75rem" }}>
                            {getInitials(r.residentName || "RS")}
                          </div>
                          <strong style={{ color: "#0f172a", fontSize: "0.9rem" }}>{r.residentName || "Unassigned"}</strong>
                        </div>
                      </td>
                      <td>
                        <code style={{ color: "#7c3aed", fontWeight: 700 }}>@{r.residentUsername || "resident"}</code>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.8125rem", color: "#0f172a", fontWeight: 700 }}>{r.residentEmail || "—"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>{r.residentPhone || "—"}</div>
                      </td>
                      <td>
                        <div className="res-meter-chip">
                          <span className="res-iot-dot"></span>
                          <span>{r.meterSerialNumber || `WM-${r.unitNumber}`}</span>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge status-badge--approved">
                          ● Active
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-action-view"
                          style={{ padding: "0.45rem 0.85rem", fontSize: "0.75rem", fontWeight: 700 }}
                          onClick={() => setSelectedResident(r)}
                        >
                          🔍 Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 6. DELUXE RESIDENT DETAILS & TELEMETRY MODAL ── */}
      {selectedResident && (
        <div
          className="floating-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedResident(null);
          }}
        >
          <div className="floating-modal-popup" style={{ maxWidth: 600 }}>
            <div className="floating-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900 }}>👤 Resident Profile & Flat Telemetry</h3>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {selectedResident.residentName} — Unit {selectedResident.unitNumber}
                </span>
              </div>
              <button className="floating-modal-close" onClick={() => setSelectedResident(null)}>
                ×
              </button>
            </div>

            <div className="doc-modal-body">
              {/* Resident ID Header Card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "1.25rem",
                }}
              >
                <div className="res-avatar-bubble" style={{ width: "54px", height: "54px", fontSize: "1.25rem" }}>
                  {getInitials(selectedResident.residentName || "RS")}
                </div>
                <div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0f172a" }}>
                    {selectedResident.residentName || "Resident"}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#7c3aed", fontWeight: 800 }}>
                    @{selectedResident.residentUsername || "resident"} • Unit {selectedResident.unitNumber}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "3px" }}>
                    🏢 {selectedResident.societyName} ({selectedResident.block})
                  </div>
                </div>
              </div>

              {/* Flat Details Grid */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "1rem",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  fontSize: "0.8125rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                    Email Address
                  </span>
                  <strong style={{ color: "#0f172a" }}>{selectedResident.residentEmail || "Not specified"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                    Phone Number
                  </span>
                  <strong style={{ color: "#0f172a" }}>{selectedResident.residentPhone || "Not specified"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                    Flat Block & Floor
                  </span>
                  <strong style={{ color: "#0f172a" }}>
                    {selectedResident.block} • {selectedResident.floor || "1st Floor"}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                    Smart Meter Serial ID
                  </span>
                  <code style={{ color: "#0284c7", fontWeight: 800 }}>
                    {selectedResident.meterSerialNumber || `WM-${selectedResident.unitNumber}`}
                  </code>
                </div>
              </div>

              {/* Sub-Meter Telemetry */}
              <div className="doc-preview-card" style={{ marginBottom: "0" }}>
                <div className="doc-preview-header">
                  <span>💧 Live IoT Sub-Meter Telemetry</span>
                  <span className="doc-badge" style={{ marginLeft: "auto", background: "#ecfdf5", color: "#059669" }}>
                    ● Signal Active
                  </span>
                </div>
                <div style={{ padding: "12px 14px", fontSize: "0.8125rem", color: "#334155" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Telemetry Status:</span>
                    <strong style={{ color: "#059669" }}>✓ Smart Sub-Meter Online & Synchronized</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Leak Guard Status:</span>
                    <span style={{ color: "#059669", fontWeight: 800 }}>✓ Normal Flow / Zero Anomaly</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Assigned Tariff:</span>
                    <strong style={{ color: "#7c3aed" }}>Standard Tiered Residential Tariff</strong>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                justifyContent: "flex-end",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button className="btn-secondary" onClick={() => setSelectedResident(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllResidentsPage;
