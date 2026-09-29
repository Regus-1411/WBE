import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import DashboardLayout from "./components/DashboardLayout";
import AIChatbot from "./components/AIChatbot";

// Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Admin Pages
import DashboardPage from "./pages/DashboardPage";
import HouseholdsPage from "./pages/admin/HouseholdsPage";
import ReadingsPage from "./pages/admin/ReadingsPage";
import BillsPage from "./pages/admin/BillsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import LeakagePage from "./pages/admin/LeakagePage";
import PlansPage from "./pages/admin/PlansPage";
import BulkPurchasePage from "./pages/admin/BulkPurchasePage";
import SettingsPage from "./pages/admin/SettingsPage";

// Resident Pages
import ResidentDashboardPage from "./pages/ResidentDashboardPage";

// Super Admin (Main Admin) Pages
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AdminApprovalsPage from "./pages/superadmin/AdminApprovalsPage";
import AllAdminsPage from "./pages/superadmin/AllAdminsPage";
import AllSocietiesPage from "./pages/superadmin/AllSocietiesPage";
import AllResidentsPage from "./pages/superadmin/AllResidentsPage";
import GlobalFinancialsPage from "./pages/superadmin/GlobalFinancialsPage";
import GlobalAnalyticsPage from "./pages/superadmin/GlobalAnalyticsPage";
import AuditLogsPage from "./pages/superadmin/AuditLogsPage";

import PWAInstallBanner from "./components/PWAInstallBanner";

function AppContent() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/resident") ||
    location.pathname.startsWith("/superadmin");

  return (
    <>
      {/* PWA In-App Install Prompt & Offline Connectivity Banner */}
      <PWAInstallBanner />

      {/* Only show the public top header on public landing/login/register pages */}
      {!isDashboardRoute && <Header />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Super Admin (Main Admin) routes ── */}
        <Route path="/superadmin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="approvals" element={<AdminApprovalsPage />} />
          <Route path="admins" element={<AllAdminsPage />} />
          <Route path="apartments" element={<AllSocietiesPage />} />
          <Route path="residents" element={<AllResidentsPage />} />
          <Route path="financials" element={<GlobalFinancialsPage />} />
          <Route path="analytics" element={<GlobalAnalyticsPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
        </Route>

        {/* ── Community Admin routes ── */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="households" element={<HouseholdsPage />} />
          <Route path="readings" element={<ReadingsPage />} />
          <Route path="bills" element={<BillsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="leakage" element={<LeakagePage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="bulk-purchases" element={<BulkPurchasePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* ── Resident Portal routes ── */}
        <Route path="/resident" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/resident/dashboard" replace />} />
          <Route path="dashboard" element={<ResidentDashboardPage />} />
          <Route path="usage" element={<ResidentDashboardPage />} />
          <Route path="bills" element={<ResidentDashboardPage />} />
          <Route path="reports" element={<ResidentDashboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Global AI Chatbot with Page-Specific Scope and Backend Integration */}
      <AIChatbot />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;