import React, { useState } from "react";
import { API_BASE } from "../config";

export default function UserProfile({ user, onClose, onSaveSuccess }) {
  const [profileUsername, setProfileUsername] = useState(user?.username || "");
  const [profilePassword, setProfilePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    if (!profileUsername.trim() || !profilePassword.trim()) {
      setProfileError("Username and password are required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          username: profileUsername.trim(),
          password: profilePassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        onSaveSuccess(data.user);
        onClose();
      } else {
        setProfileError(data.error || "Update failed");
      }
    } catch (err) {
      setProfileError("Could not connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
        <h3>👤 User Profile</h3>
        <p className="text-muted mb-2">View and update your login credentials.</p>
        <form onSubmit={handleSaveProfile}>
          {profileError && (
            <div className="form-error mb-2">
              <span>❌</span> {profileError}
            </div>
          )}
          <div className="form-group mb-2">
            <label>Username</label>
            <input
              type="text"
              value={profileUsername}
              onChange={(e) => setProfileUsername(e.target.value)}
              className="search-input"
              style={{ paddingLeft: "14px" }}
              required
            />
          </div>
          <div className="form-group mb-2">
            <label>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={profilePassword}
                placeholder="Enter new password"
                onChange={(e) => setProfilePassword(e.target.value)}
                className="search-input"
                style={{ paddingLeft: "14px", paddingRight: "40px" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  padding: "4px"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: "24px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
