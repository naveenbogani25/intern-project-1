// =============================================================
// FirstCry Intellitots: Child Health & Allergy Tracker
// Main App Shell Router (Refactored & Modularized)
// =============================================================

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "./config";
import UserProfile from "./components/UserProfile";
import ParentPortal from "./components/ParentPortal";
import TeacherPortal from "./components/TeacherPortal";
import AdminPortal from "./components/AdminPortal";

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [toast, setToast] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  // Apply theme class to <html> element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    showToast("Welcome back! 👋", "success");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    sessionStorage.clear();
  };

  const handleOpenProfile = () => {
    setShowProfileModal(true);
  };

  const handleSaveProfileSuccess = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    showToast("Profile details updated successfully!", "success");
  };

  // Render Login gateway if not authenticated
  if (!user) {
    return (
      <div className="app">
        {toast && (
          <div className={`toast-alert ${toast.type}`}>
            {toast.message}
          </div>
        )}
        <LoginView onLogin={handleLogin} showToast={showToast} theme={theme} toggleTheme={toggleTheme} />
      </div>
    );
  }

  return (
    <div className="app">
      {/* ---- HEADER / NAVIGATION BAR ---- */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <span className="header-logo">🧒</span>
            <div>
              <div className="header-title">FirstCry Intellitots</div>
              <div className="header-subtitle">Child Health & Allergy Tracker</div>
            </div>
          </div>
          
          <div className="header-nav-label" style={{ flexGrow: 1, textAlign: "center" }}>
            {user.role === "parent" && (
              <span className="portal-label" style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.02em" }}>🏡 Parent Portal</span>
            )}
            {user.role === "teacher" && (
              <span className="portal-label" style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.02em" }}>🏫 Teacher Portal</span>
            )}
            {user.role === "admin" && (
              <span className="portal-label" style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.02em" }}>🛡️ Admin Control Panel</span>
            )}
          </div>
          
          <div className="header-user-menu">
            {/* Theme Toggle Button */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label="Toggle theme"
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <span className={`theme-icon ${theme === "light" ? "sun-active" : "moon-active"}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {theme === "light" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </span>
            </button>

            <div className="user-badge" onClick={handleOpenProfile} style={{ cursor: "pointer" }}>
              👤 <span className="user-username" style={{ textDecoration: "underline" }}>{user.username}</span>
              <span className="badge badge-allergy" style={{ textTransform: "capitalize", marginLeft: "6px" }}>{user.role}</span>
            </div>
            <button className="btn btn-secondary logout-btn" onClick={handleLogout} style={{ marginLeft: "12px", padding: "6px 12px", fontSize: "0.85rem" }}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* ---- MAIN CONTENT AREA ---- */}
      <main className="app-container" style={{ paddingTop: "24px" }}>
        {toast && (
          <div className={`toast-alert ${toast.type}`}>
            {toast.type === "success" && "✅ "}
            {toast.type === "error" && "❌ "}
            {toast.type === "warning" && "⚠️ "}
            {toast.message}
          </div>
        )}

        {/* User Profile Modal */}
        {showProfileModal && (
          <UserProfile
            user={user}
            onClose={() => setShowProfileModal(false)}
            onSaveSuccess={handleSaveProfileSuccess}
          />
        )}

        {/* Portals selection based on user role */}
        {user.role === "parent" && <ParentPortal user={user} showToast={showToast} />}
        {user.role === "teacher" && <TeacherPortal user={user} showToast={showToast} />}
        {user.role === "admin" && <AdminPortal user={user} showToast={showToast} />}
      </main>
    </div>
  );
}

// =============================================================
// LOGIN VIEW COMPONENT
// =============================================================
function LoginView({ onLogin, showToast, theme, toggleTheme }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Username/Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password })
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <button
          className="theme-toggle-btn login-theme-toggle"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle theme"
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <span className={`theme-icon ${theme === "light" ? "sun-active" : "moon-active"}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {theme === "light" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
          </span>
        </button>
        <div className="login-brand">
          <span className="login-logo">🧒</span>
          <h2>FirstCry Intellitots</h2>
          <p>Child Health & Allergy Tracker Portal</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="form-error"><span>❌</span> {error}</div>}
          <div className="form-group">
            <label>Username or Email</label>
            <input
              type="text"
              placeholder="Enter username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  color: "var(--color-text-secondary)"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "15px" }} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;

