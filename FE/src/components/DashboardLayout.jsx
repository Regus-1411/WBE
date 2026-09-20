import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import DashboardTopBar from "./DashboardTopBar";
import "./DashboardLayout.css";

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard-layout" id="dashboard-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`dashboard-layout__main ${collapsed ? "dashboard-layout__main--expanded" : ""}`}>
        <DashboardTopBar />
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
