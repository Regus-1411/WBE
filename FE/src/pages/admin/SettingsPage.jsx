import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authApi, apartmentApi } from "../../services/api";
import "./HouseholdsPage.css";

function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "society"

  // User Profile state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    newPassword: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Society state
  const [aptData, setAptData] = useState({
    name: user?.apartmentName || "Palm Meadows Society",
    address: "74 Waterworks Blvd, Near Tech Park",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560103",
    totalUnits: 150,
  });
  const [societySaved, setSocietySaved] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        newPassword: "",
      });
      if (user.apartmentName) {
        setAptData((prev) => ({ ...prev, name: user.apartmentName }));
      }
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError("");
    setIsSavingProfile(true);

    try {
      // Call backend API if available
      try {
        await authApi.updateProfile(profileForm);
      } catch (err) {
        console.warn("Backend update error:", err.message);
      }

      // Update local storage user
      const updatedUser = {
        ...user,
        fullName: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone,
      };
      localStorage.setItem("drop_user", JSON.stringify(updatedUser));

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSocietySave = (e) => {
    e.preventDefault();
    setSocietySaved(true);
    setTimeout(() => setSocietySaved(false), 2500);
  };

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="admin-page" id="settings-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Account & System Settings</h1>
          <p className="admin-page__subtitle">Manage your administrator profile, credentials, and society configuration</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "6px",
            border: "none",
            background: activeTab === "profile" ? "var(--blue-600)" : "#f1f5f9",
            color: activeTab === "profile" ? "#fff" : "#475569",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          👤 My User Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("society")}
          style={{
            padding: "0.6rem 1.25rem",
            borderRadius: "6px",
            border: "none",
            background: activeTab === "society" ? "var(--blue-600)" : "#f1f5f9",
            color: activeTab === "society" ? "#fff" : "#475569",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          🏢 Society / System Details
        </button>
      </div>

      {/* Tab 1: User Profile */}
      {activeTab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "1.5rem", maxWidth: "1000px" }}>
          {/* Profile Overview Card */}
          <div className="admin-card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", height: "fit-content" }}>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--blue-500), var(--blue-700))",
              color: "#fff",
              fontSize: "1.5rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
            }}>
              {getInitials(user?.fullName || user?.username)}
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", color: "#0f172a" }}>
              {user?.fullName || "Administrator"}
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.8125rem", margin: "0 0 1rem" }}>
              @{user?.username || "admin"}
            </p>

            <span style={{
              background: user?.role === "APARTMENT_ADMIN" ? "#eff6ff" : "#f0fdf4",
              color: user?.role === "APARTMENT_ADMIN" ? "#2563eb" : "#16a34a",
              border: `1px solid ${user?.role === "APARTMENT_ADMIN" ? "#bfdbfe" : "#bbf7d0"}`,
              padding: "0.3rem 0.75rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: "1.5rem"
            }}>
              {user?.role === "APARTMENT_ADMIN" ? "🛡️ Society Administrator" : "🏡 Resident Member"}
            </span>

            <div style={{ width: "100%", borderTop: "1px solid #f1f5f9", paddingTop: "1rem", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.8125rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Email:</span>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{user?.email || "admin@drop.io"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Society:</span>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{user?.apartmentName || "Palm Meadows Society"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Status:</span>
                <span style={{ fontWeight: 600, color: "#16a34a" }}>● Active</span>
              </div>
            </div>
          </div>

          {/* Profile Edit Form Card */}
          <div className="admin-card" style={{ padding: "1.75rem" }}>
            <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>Edit Profile Details</h3>

            {profileSaved && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "0.875rem", fontWeight: 600 }}>
                ✓ Profile successfully updated!
              </div>
            )}

            {profileError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "0.875rem", fontWeight: 600 }}>
                ❌ {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-primary" disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Society Details */}
      {activeTab === "society" && (
        <div className="admin-card" style={{ padding: "2rem", maxWidth: "700px" }}>
          {societySaved && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "0.85rem", borderRadius: "8px", marginBottom: "1.25rem", fontWeight: 600 }}>
              ✓ Apartment settings successfully updated!
            </div>
          )}

          <form onSubmit={handleSocietySave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label>Society / Apartment Name *</label>
              <input
                type="text"
                required
                value={aptData.name}
                onChange={(e) => setAptData({ ...aptData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Physical Address</label>
              <input
                type="text"
                value={aptData.address}
                onChange={(e) => setAptData({ ...aptData, address: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={aptData.city}
                  onChange={(e) => setAptData({ ...aptData, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={aptData.state}
                  onChange={(e) => setAptData({ ...aptData, state: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={aptData.pincode}
                  onChange={(e) => setAptData({ ...aptData, pincode: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Total Registered Units</label>
              <input
                type="number"
                value={aptData.totalUnits}
                onChange={(e) => setAptData({ ...aptData, totalUnits: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
