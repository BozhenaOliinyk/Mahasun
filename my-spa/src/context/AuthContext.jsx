import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { apiFetch } from "../api/client";

const AuthContext = createContext(null);

const emptySession = {
  isAdmin: false,
  isAuthenticated: false,
  hasClientSession: false,
  loaded: false,
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(emptySession);

  const refreshSession = useCallback(async () => {
    try {
      const s = await apiFetch("/session/", { method: "GET" });
      setSession({
        isAdmin: Boolean(s?.is_admin),
        isAuthenticated: Boolean(s?.is_authenticated),
        hasClientSession: Boolean(s?.has_client_session),
        loaded: true,
      });
      return s;
    } catch {
      setSession({ ...emptySession, loaded: true });
      return null;
    }
  }, []);

  const login = useCallback(async (payload) => {
    // payload = {email, password}
    await apiFetch("/login/", { method: "POST", body: payload });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/logout/", { method: "POST", body: {} });
    } finally {
      await refreshSession();
    }
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      session,
      setSession,
      refreshSession,
      login,
      logout,
    }),
    [session, refreshSession, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}