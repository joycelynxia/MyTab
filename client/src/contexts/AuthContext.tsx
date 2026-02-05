import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "mytab_user";
const TOKEN_KEY = "mytab_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setIsReady(true);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Login failed" };
      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_KEY, data.token);
      return { success: true };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Registration failed" };
      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_KEY, data.token);
      return { success: true };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
