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
        <LoginView onLogin={handleLogin} showToast={showToast} />
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
function LoginView({ onLogin, showToast }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
