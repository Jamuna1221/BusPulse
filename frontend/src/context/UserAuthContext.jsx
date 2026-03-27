import { createContext, useContext, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user_info") || "null"); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("user_token") || null);

  const _persist = (tok, usr) => {
    localStorage.setItem("user_token", tok);
    localStorage.setItem("user_info", JSON.stringify(usr));
    setToken(tok); setUser(usr);
  };

  /** POST /auth/user/login — email + password */
  const loginEmail = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/user/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    _persist(data.token, data.user);
    return data;
  }, []);

  /** POST /auth/user/signup — sends OTP (Step 1) */
  const signupInit = useCallback(async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/user/signup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Signup failed");
    return data;
  }, []);

  /** POST /auth/user/verify-signup — verifies OTP, issues JWT (Step 2) */
  const verifySignup = useCallback(async (email, otp) => {
    const res = await fetch(`${API_BASE}/auth/user/verify-signup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Verification failed");
    _persist(data.token, data.user);
    return data;
  }, []);

  /** POST /auth/user/google */
  const loginGoogle = useCallback(async (googleToken) => {
    const res = await fetch(`${API_BASE}/auth/user/google`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: googleToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Google auth failed");
    _persist(data.token, data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_info");
    setToken(null); setUser(null);
  }, []);

  return (
    <UserAuthContext.Provider value={{ user, token, loginEmail, signupInit, verifySignup, loginGoogle, logout }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error("useUserAuth must be used within UserAuthProvider");
  return ctx;
}
