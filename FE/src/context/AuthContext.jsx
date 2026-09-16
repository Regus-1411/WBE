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
          setToken(authData.token);
          setUser(authData);
          localStorage.setItem("drop_token", authData.token);
          localStorage.setItem("drop_user", JSON.stringify(authData));
          return authData;
        }
      } catch (err) {
        console.warn("Backend auth attempt failed:", err.message);
      }

      // 2. Offline / local fallback: check if it matches an admin-created resident account
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
      try {
        const res = await authApi.register(userData);
        if (res.success && res.data) {
          const authData = res.data;
          setToken(authData.token);
          setUser(authData);
          localStorage.setItem("drop_token", authData.token);
          localStorage.setItem("drop_user", JSON.stringify(authData));
          return authData;
        }
      } catch (err) {
        console.warn("Backend registration failed or offline:", err.message);
        // If it's a real validation error or 400 from backend, throw it to user
        if (err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
          throw err;
        }
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
