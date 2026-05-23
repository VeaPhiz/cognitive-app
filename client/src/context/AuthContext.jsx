import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // true until localStorage is read

  // ── Rehydrate session on first load ──────────────────────────────────────
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser  = localStorage.getItem("user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Persist helpers ───────────────────────────────────────────────────────
  const persistSession = (jwt, userData) => {
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // ── Auth actions ──────────────────────────────────────────────────────────
  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post("/auth/register", { username, email, password });
    persistSession(data.token, data.user);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    persistSession(data.token, data.user);
    return data;
  } catch (err) {
    throw err; // re-throw so Login.jsx catch block still receives it
  }
}, []);

  const logout = useCallback(() => {
    clearSession();
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const { data } = await api.post("/auth/google", { id_token: idToken });
    persistSession(data.token, data.user);
    return data;
  }, []);

  const value = { user, token, loading, register, login, googleLogin, logout };

  // Don't render children until localStorage has been read
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}