import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styling/LoginPage.css";

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email.trim() || !password) {
          setError("Please enter email and password");
          return;
        }
        const result = await login(email.trim(), password);
        if (result.success) {
          navigate("/home");
        } else {
          setError(result.error || "Invalid email or password");
        }
      } else {
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
          setError("Please fill in all fields");
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          return;
        }
        const result = await register(name.trim(), email.trim(), password);
        if (result.success) {
          navigate("/home");
        } else {
          setError(result.error || "An account with this email already exists");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Put it on my tab</h1>
        <p className="login-subtitle">
          {mode === "login"
            ? "Welcome back. Log in to continue."
            : "Create an account to get started."}
        </p>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => mode !== "login" && switchMode()}
          >
            Log in
          </button>
          <button
            type="button"
            className={`login-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => mode !== "register" && switchMode()}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <p className="login-error">{error}</p>}

          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
