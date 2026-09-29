import { createContext, useContext, useState } from "react";
import { authApi } from "../services/api";
import { dataStore } from "../services/store";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("drop_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("drop_token"));
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username, password) => {
    setIsLoading(true);

    try {
      // 1. Try real backend API first
      try {
        const res = await authApi.login({ username, password });
        if (res.success && res.data) {
          const authData = res.data;
          if (authData.token) {
            setToken(authData.token);
            localStorage.setItem("drop_token", authData.token);
          }
          setUser(authData);
          localStorage.setItem("drop_user", JSON.stringify(authData));
          return authData;
        }
      } catch (err) {
        console.warn("Backend auth attempt failed:", err.message);
        // If it's a verification or approval restriction, throw it to user directly
        if (err.message && (err.message.includes("PENDING") || err.message.includes("verification") || err.message.includes("rejected"))) {
          throw err;
        }
      }

      // 2. Offline / local fallback: check Super Admin (Main Admin)
      const uLower = username.trim().toLowerCase();
      if ((uLower === "mainadmin" || uLower === "superadmin" || uLower === "mainadmin@dropwater.app") && (password === "password" || password === "Admin@123")) {
        const mainAdminUser = {
          id: 9999,
          username: "mainadmin",
          email: "mainadmin@dropwater.app",
          fullName: "Platform Super Administrator",
          role: "MAIN_ADMIN",
          token: "mainadmin-jwt-token-9999",
        };
        setToken(mainAdminUser.token);
        setUser(mainAdminUser);
        localStorage.setItem("drop_token", mainAdminUser.token);
        localStorage.setItem("drop_user", JSON.stringify(mainAdminUser));
        return mainAdminUser;
      }

      // 3. Offline / local fallback: check Apartment Admin Applications
      const applications = dataStore.getAdminApplications();
      const matchedApp = applications.find(
        (a) => (a.username.toLowerCase() === uLower || a.email.toLowerCase() === uLower)
      );

      if (matchedApp) {
        if (matchedApp.approvalStatus === "PENDING") {
          throw new Error(`Your Apartment Admin account for "${matchedApp.apartmentName}" is currently PENDING Main Admin verification. Your submitted documents (Bond & Registration Certificate) are under review.`);
        }
        if (matchedApp.approvalStatus === "REJECTED") {
          throw new Error(`Your Apartment Admin application for "${matchedApp.apartmentName}" was rejected: ${matchedApp.rejectionReason || "Please contact Main Admin."}`);
        }
        if (password === (matchedApp.password || "password") || password === "password") {
          const aptAdminUser = {
            id: matchedApp.id,
            username: matchedApp.username,
            email: matchedApp.email,
            fullName: matchedApp.fullName,
            phone: matchedApp.phone,
            role: "APARTMENT_ADMIN",
            apartmentId: 1,
            apartmentName: matchedApp.apartmentName,
            token: `apt-jwt-${matchedApp.id}`,
          };
          setToken(aptAdminUser.token);
          setUser(aptAdminUser);
          localStorage.setItem("drop_token", aptAdminUser.token);
          localStorage.setItem("drop_user", JSON.stringify(aptAdminUser));
          return aptAdminUser;
        }
      }

      // Default fallback admin check
      if ((uLower === "admin" || uLower === "admin@dropwater.app") && (password === "password" || password === "admin")) {
        const defaultAdminUser = {
          id: 1,
          username: "admin",
          email: "admin@dropwater.app",
          fullName: "Palm Meadows Admin",
          role: "APARTMENT_ADMIN",
          apartmentId: 1,
          apartmentName: "Palm Meadows Society",
          token: "apt-admin-jwt-1",
        };
        setToken(defaultAdminUser.token);
        setUser(defaultAdminUser);
        localStorage.setItem("drop_token", defaultAdminUser.token);
        localStorage.setItem("drop_user", JSON.stringify(defaultAdminUser));
        return defaultAdminUser;
      }

      // 4. Offline / local fallback: check if it matches an admin-created resident account
      const createdResident = dataStore.findResidentByCredentials(username, password);
      if (createdResident) {
        const residentUser = {
          id: createdResident.id,
          username: createdResident.username,
          email: createdResident.email || `${createdResident.username}@drop.io`,
          fullName: createdResident.fullName,
          role: "RESIDENT",
          householdId: createdResident.householdId,
          householdUnitNumber: createdResident.householdUnitNumber,
          householdBlock: createdResident.householdBlock,
          householdMeter: createdResident.householdMeter,
          token: `res-jwt-${createdResident.id}`,
        };
        setToken(residentUser.token);
        setUser(residentUser);
        localStorage.setItem("drop_token", residentUser.token);
        localStorage.setItem("drop_user", JSON.stringify(residentUser));
        return residentUser;
      }

      throw new Error("Invalid username or password. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      // 1. Try real backend API
      let backendRes = null;
      try {
        const res = await authApi.register(userData);
        if (res.success && res.data) {
          backendRes = res.data;
          if (backendRes.approvalStatus === "PENDING" || userData.role === "APARTMENT_ADMIN") {
            // Save application in local store as well
            dataStore.addAdminApplication(userData);
            return { ...backendRes, approvalStatus: "PENDING" };
          }
          setToken(backendRes.token);
          setUser(backendRes);
          localStorage.setItem("drop_token", backendRes.token);
          localStorage.setItem("drop_user", JSON.stringify(backendRes));
          return backendRes;
        }
      } catch (err) {
        console.warn("Backend registration fallback:", err.message);
        if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
          throw err;
        }
      }

      // 2. Offline / mock handling
      if (userData.role === "APARTMENT_ADMIN") {
        const savedApp = dataStore.addAdminApplication(userData);
        return {
          id: savedApp.id,
          username: savedApp.username,
          email: savedApp.email,
          fullName: savedApp.fullName,
          role: "APARTMENT_ADMIN",
          apartmentName: savedApp.apartmentName,
          approvalStatus: "PENDING",
          message: "Application submitted with documents. Pending Main Admin approval.",
        };
      }

      const newUser = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role || "RESIDENT",
        apartmentId: 1,
        apartmentName: "Palm Meadows Society",
        householdId: 101,
        householdUnitNumber: "A-101",
        token: "jwt-token-" + Date.now(),
      };
      setToken(newUser.token);
      setUser(newUser);
      localStorage.setItem("drop_token", newUser.token);
      localStorage.setItem("drop_user", JSON.stringify(newUser));
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("drop_token");
    localStorage.removeItem("drop_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
