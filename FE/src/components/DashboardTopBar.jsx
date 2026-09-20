import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LanguageSelector from "./LanguageSelector";
import "./DashboardTopBar.css";

const routeNames = {
  "/admin/dashboard": "Society Overview & Telemetry",
  "/admin/households": "Household Directory & Meters",
  "/admin/readings": "IoT Meter Readings & Logs",
  "/admin/bills": "Volumetric Bills & Invoicing",
  "/admin/reports": "Audits & Consumption Analytics",
  "/admin/leakage": "Leakage Detection & Anomaly Alerts",
  "/admin/plans": "Tariff Plans & Pricing Slabs",
  "/admin/bulk-purchases": "Bulk Tanker Logistics",
  "/admin/settings": "Society Configuration & Rules",
  "/resident/dashboard": "Resident Water Dashboard",
  "/resident/usage": "Usage History & Telemetry",
  "/resident/bills": "My Invoices & Payment Receipts",
  "/resident/reports": "Tariff Slabs & Conservation Insights",
};

export function DashboardTopBar() {
  const location = useLocation();
  const { user } = useAuth();
  const isResident = location.pathname.startsWith("/resident");

  const pageTitle = routeNames[location.pathname] || (isResident ? "Resident Portal" : "Admin Console");

  return (
    <header className="dash-topbar" id="dashboard-topbar">
      <div className="dash-topbar__left">
        <div className="dash-topbar__breadcrumbs">
          <span className="dash-topbar__portal-tag">
            {isResident ? "Resident Portal" : "Community Management"}
          </span>
          <span className="dash-topbar__slash">/</span>
          <span className="dash-topbar__page-title">{pageTitle}</span>
        </div>
      </div>

      <div className="dash-topbar__right">
        {/* Live Network Pulse */}
        <div className="dash-topbar__status" title="IoT Water Telemetry Network Online">
          <span className="dash-topbar__pulse"></span>
          <span className="dash-topbar__status-text">Live Sync</span>
        </div>

        {/* Multi-Language Google Translator Switcher on Right of Top Bar */}
        <LanguageSelector id="dashboard-language-selector" />

        {/* User Identity Chip */}
        <div className="dash-topbar__user notranslate" id="dash-topbar-user" translate="no">
          <div className="dash-topbar__avatar notranslate" translate="no">
            {user?.fullName ? user.fullName[0].toUpperCase() : isResident ? "R" : "A"}
          </div>
          <div className="dash-topbar__user-text notranslate" translate="no">
            <span className="dash-topbar__user-name notranslate" translate="no">
              {user?.fullName || user?.username || (isResident ? "Resident" : "Admin")}
            </span>
            <span className="dash-topbar__user-sub notranslate" translate="no">
              {isResident ? `Unit ${user?.householdUnitNumber || "B-402"}` : (user?.apartmentName || "Palm Meadows")}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardTopBar;
