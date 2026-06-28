import React, { useState, useEffect, useCallback } from "react";
import { API_BASE, ALLERGY_OPTIONS, AVATAR_COLORS } from "../config";
import IndianHealthGuide from "./IndianHealthGuide";

export default function TeacherPortal({ user, showToast }) {
  const [currentView, setCurrentView] = useState(() => {
    return sessionStorage.getItem("teacherPortalView") || "dashboard";
  });
  const [selectedChildId, setSelectedChildId] = useState(() => {
    const id = sessionStorage.getItem("teacherSelectedChildId");
    return id ? parseInt(id) : null;
  });

  const goToDashboard = () => {
    sessionStorage.setItem("teacherPortalView", "dashboard");
    sessionStorage.removeItem("teacherSelectedChildId");
    setCurrentView("dashboard");
    setSelectedChildId(null);
  };
  const goToDetail = (childId) => {
    sessionStorage.setItem("teacherPortalView", "detail");
    sessionStorage.setItem("teacherSelectedChildId", String(childId));
    setSelectedChildId(childId);
    setCurrentView("detail");
  };
  const goToAttendance = () => {
    sessionStorage.setItem("teacherPortalView", "attendance");
    setCurrentView("attendance");
  };
  const goToMeals = () => {
    sessionStorage.setItem("teacherPortalView", "meals");
    setCurrentView("meals");
  };
  const goToIndianGuide = () => {
    sessionStorage.setItem("teacherPortalView", "indianGuide");
    setCurrentView("indianGuide");
  };

  return (
    <div className="teacher-portal-layout">
      <nav className="sub-nav">
        <button
          className={`sub-nav-btn ${currentView === "dashboard" || currentView === "detail" ? "active" : ""}`}
          onClick={goToDashboard}
        >
          📋 Classroom Dashboard
        </button>
        <button
          className={`sub-nav-btn ${currentView === "attendance" ? "active" : ""}`}
          onClick={goToAttendance}
        >
          📅 Daily Attendance
        </button>
        <button className={`sub-nav-btn ${currentView === "meals" ? "active" : ""}`} onClick={goToMeals}>
          🍽️ Meals & Safety
        </button>
        <button className={`sub-nav-btn ${currentView === "indianGuide" ? "active" : ""}`} onClick={goToIndianGuide}>
          🇮🇳 Indian Health Guide
        </button>
      </nav>

      <div className="portal-content-area" style={{ marginTop: "16px" }}>
        {currentView === "dashboard" && (
          <TeacherDashboardView user={user} onViewChild={goToDetail} showToast={showToast} />
        )}
        {currentView === "detail" && (
          <TeacherDetailView childId={selectedChildId} onBack={goToDashboard} showToast={showToast} />
        )}
        {currentView === "attendance" && <TeacherAttendanceView user={user} showToast={showToast} />}
        {currentView === "meals" && <TeacherMealsView showToast={showToast} />}
        {currentView === "indianGuide" && (
          <div className="detail-card full-width">
            <IndianHealthGuide />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================
// TEACHER DASHBOARD VIEW
// =============================================================
function TeacherDashboardView({ user, onViewChild, showToast }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allergyFilter, setAllergyFilter] = useState("");
  const [classroomName, setClassroomName] = useState("");

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/children?teacher_username=${encodeURIComponent(user.username)}&`;
      if (allergyFilter) url += `allergy_type=${encodeURIComponent(allergyFilter)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setChildren(data);

      if (data.length > 0 && data[0].classroom_name) {
        setClassroomName(data[0].classroom_name);
      }
    } catch (err) {
      setError("Could not connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [user, allergyFilter, searchQuery]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const handleSearch = (e) => {
    if (e.key === "Enter" || e.type === "blur") fetchChildren();
  };
  const clearFilters = () => {
    setSearchQuery("");
    setAllergyFilter("");
  };

  const totalChildren = children.length;
  const highRiskCount = children.filter((c) => c.risk_status === "High Risk").length;
  const normalCount = totalChildren - highRiskCount;

  return (
    <section className="dashboard-section" style={{ padding: 0 }}>
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span>🏫</span> {classroomName || "My Classroom"} Dashboard
          <span className="child-count">{totalChildren} kids</span>
        </h1>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue">👶</div>
          <div className="stat-info">
            <h3>{totalChildren}</h3>
            <p>Class size</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🚨</div>
          <div className="stat-info">
            <h3>{highRiskCount}</h3>
            <p>High Risk</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <h3>{normalCount}</h3>
            <p>Normal Status</p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="teacher-search-input"
            type="text"
            className="search-input"
            placeholder="Search student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            onBlur={handleSearch}
          />
        </div>
        <select
          id="teacher-allergy-filter"
          className="filter-select"
          value={allergyFilter}
          onChange={(e) => setAllergyFilter(e.target.value)}
        >
          <option value="">All Allergies</option>
          <option value="has_allergies">🔴 Has Allergies</option>
          {ALLERGY_OPTIONS.map((allergy) => (
            <option key={allergy} value={allergy}>
              {allergy}
            </option>
          ))}
        </select>
        <button className="clear-filters-btn" onClick={clearFilters}>
          ✕ Clear
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading student database...</p>
        </div>
      )}
      {error && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Connection Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary mt-2" onClick={fetchChildren}>
            🔄 Retry
          </button>
        </div>
      )}
      {!loading && !error && children.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No Students Found</h3>
          <p>No students match your filter or are assigned to your class.</p>
        </div>
      )}

      {!loading && !error && children.length > 0 && (
        <div className="children-table-wrapper">
          <table className="children-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Age</th>
                <th>Allergies</th>
                <th>Safety Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {children.map((child, index) => (
                <tr key={child.id} onClick={() => onViewChild(child.id)}>
                  <td>
                    <div className="child-name-cell">
                      <div className={`child-avatar ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                        {child.first_name.charAt(0)}
                      </div>
                      <div>
                        <div className="child-name-text">
                          {child.first_name} {child.last_name}
                        </div>
                        <div className="child-classroom-text">{child.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td>{child.age} yrs</td>
                  <td>
                    <div className="allergy-badges">
                      {child.allergies && child.allergies.length > 0 ? (
                        child.allergies.map((allergy, i) => (
                          <span key={i} className="badge badge-allergy">
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        child.risk_status === "High Risk" ? "badge-high-risk" : "badge-normal"
                      }`}
                    >
                      {child.risk_status === "High Risk" ? "🔴" : "🟢"} {child.risk_status}
                    </span>
                  </td>
                  <td>
                    <span className="view-arrow">→</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// =============================================================
// TEACHER DETAILED VIEW (Read-only child profile)
// =============================================================
function TeacherDetailView({ childId, onBack, showToast }) {
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchChild = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/children/${childId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Student not found.");
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setChild(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    if (childId) fetchChild();
  }, [childId, fetchChild]);

  useEffect(() => {
    if (child && child.risk_status === "High Risk") {
      showToast(`⚠️ ${child.first_name} is HIGH RISK!`, "warning");
    }
  }, [child, showToast]);

  useEffect(() => {
    if (!childId) return;
    const fetchMilestones = async () => {
      try {
        const response = await fetch(`${API_BASE}/children/${childId}/milestones`);
        if (response.ok) setMilestones(await response.json());
      } catch (err) {
        /* ignore */
      }
    };
    fetchMilestones();
  }, [childId]);

  const updateMilestoneStatus = async (milestone, newStatus) => {
    try {
      await fetch(`${API_BASE}/children/${childId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: milestone.id,
          status: newStatus,
          achieved_date: newStatus === "Achieved" ? new Date().toISOString().split("T")[0] : null,
        }),
      });
      setMilestones(
        milestones.map((m) =>
          m.id === milestone.id
            ? {
                ...m,
                status: newStatus,
                achieved_date: newStatus === "Achieved" ? new Date().toISOString().split("T")[0] : null,
              }
            : m
        )
      );
      showToast(`Milestone "${milestone.milestone_name}" → ${newStatus}`, "success");
    } catch (err) {
      showToast("Failed to update milestone.", "error");
    }
  };

  if (loading) {
    return (
      <section className="detail-section" style={{ padding: 0 }}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading student profile & running safety checks...</p>
        </div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="detail-section" style={{ padding: 0 }}>
        <div className="empty-state">
          <div className="empty-state-icon">😔</div>
          <h3>Could Not Load Profile</h3>
          <p>{error}</p>
          <button className="btn btn-back mt-2" onClick={onBack}>
            ← Back
          </button>
        </div>
      </section>
    );
  }
  if (!child) return null;

  const milestoneCats = ["Physical", "Cognitive", "Social", "Language", "Emotional"];

  return (
    <section className="detail-section" style={{ padding: 0 }}>
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-info">
          <div className="detail-avatar">{child.first_name.charAt(0)}</div>
          <div>
            <h1 className="detail-name">
              {child.first_name} {child.last_name}{" "}
              <span
                className={`badge ${child.risk_status === "High Risk" ? "badge-high-risk" : "badge-normal"}`}
              >
                {child.risk_status === "High Risk" ? "🔴" : "🟢"} {child.risk_status}
              </span>
            </h1>
            <div className="detail-meta">
              <span>🎂 {child.age} years old</span>
              <span>🏫 {child.classroom_name}</span>
              <span>🩸 {child.blood_group || "N/A"}</span>
            </div>
          </div>
        </div>
        <div className="detail-header-actions">
          <button className="btn btn-back" onClick={onBack}>
            ← Back to List
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📋 Overview
        </button>
        <button
          className={`detail-tab ${activeTab === "meals" ? "active" : ""}`}
          onClick={() => setActiveTab("meals")}
        >
          🍽️ Meal Safety
        </button>
        <button
          className={`detail-tab ${activeTab === "milestones" ? "active" : ""}`}
          onClick={() => setActiveTab("milestones")}
        >
          🏆 Milestones
        </button>
        <button
          className={`detail-tab ${activeTab === "ai" ? "active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          🤖 AI Summary
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="detail-grid">
          <div className="detail-card">
            <div className="detail-card-title">👶 Personal Information</div>
            <div className="detail-row">
              <span className="label">Full Name</span>
              <span className="value">
                {child.first_name} {child.last_name}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Age</span>
              <span className="value">{child.age} years</span>
            </div>
            <div className="detail-row">
              <span className="label">Gender</span>
              <span className="value">{child.gender || "Not specified"}</span>
            </div>
            <div className="detail-row">
              <span className="label">Blood Group</span>
              <span className="value">{child.blood_group || "Not specified"}</span>
            </div>
            <div className="detail-row">
              <span className="label">Classroom</span>
              <span className="value">{child.classroom_name}</span>
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-card-title">📞 Emergency Contacts</div>
            {child.parents && child.parents.length > 0 ? (
              child.parents.map((p) => (
                <div className="contact-card" key={p.id}>
                  <div className="contact-icon">👤</div>
                  <div className="contact-info">
                    <h4>
                      {p.name}
                      {p.is_emergency_contact && <span className="emergency-badge">EMERGENCY</span>}
                    </h4>
                    <p>
                      {p.relation} • {p.phone}
                    </p>
                    {p.email && <p>✉️ {p.email}</p>}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">No contacts on file</div>
            )}
          </div>

          <div className="detail-card">
            <div className="detail-card-title">⚠️ Known Allergies</div>
            {child.allergies && child.allergies.length > 0 ? (
              child.allergies.map((a) => (
                <div className="allergy-detail-item" key={a.id}>
                  <span className="allergy-name">{a.allergy_type}</span>
                  <span className={`severity-badge severity-${a.severity.toLowerCase()}`}>
                    {a.severity}
                  </span>
                </div>
              ))
            ) : (
              <div className="no-data-message">✅ No known allergies</div>
            )}
          </div>

          <div className="detail-card">
            <div className="detail-card-title">🏥 Diagnosed Health Issues</div>
            {child.health_issues && child.health_issues.length > 0 ? (
              <div className="allergy-badges" style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                {child.health_issues.map((issue, i) => (
                  <span key={i} className="badge badge-allergy" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--color-primary)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                    ⚠️ {issue}
                  </span>
                ))}
              </div>
            ) : (
              <div className="no-data-message">✅ No diagnosed health issues</div>
            )}
          </div>

          <div className="detail-card">
            <div className="detail-card-title">💊 Active Medications</div>
            {child.medications && child.medications.length > 0 ? (
              child.medications.map((m) => (
                <div className="med-detail-item" key={m.id}>
                  <h4>{m.medicine_name}</h4>
                  <p>Dosage: {m.dosage || "Not specified"}</p>
                  <p>Schedule: {m.schedule || "As needed"}</p>
                </div>
              ))
            ) : (
              <div className="no-data-message">No active medications</div>
            )}
          </div>

          <div className="detail-card full-width">
            <div className="detail-card-title">📝 Additional Notes (Medical History)</div>
            <p style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              {child.doctor_notes || "No notes on record."}
            </p>
          </div>
        </div>
      )}

      {activeTab === "meals" && (
        <div className="detail-card full-width">
          <div className="detail-card-title">🍽️ Meal Safety Check (Rule Engine)</div>
          {child.meal_safety && child.meal_safety.length > 0 ? (
            <div className="meal-safety-grid">
              {child.meal_safety.map((meal, index) => (
                <div
                  key={index}
                  className={`meal-safety-item ${meal.status === "SAFE" ? "safe" : "restricted"}`}
                >
                  <div className="meal-name">
                    {meal.status === "SAFE" ? "✅" : "🚫"} {meal.meal_name}
                  </div>
                  <div className="meal-category">{meal.meal_category}</div>
                  <div className="meal-status">{meal.status}</div>
                  {meal.matched_allergens && meal.matched_allergens.length > 0 && (
                    <div className="meal-allergen-match">
                      ⚠️ Contains:{" "}
                      {meal.matched_allergens
                        .map((m) => `${m.matched_ingredient} (${m.allergy})`)
                        .join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-message">No meal data available</div>
          )}
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="detail-card full-width">
          <div className="detail-card-title">🏆 Developmental Milestones</div>
          {milestoneCats.map((cat) => {
            const items = milestones.filter((m) => m.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="milestone-category">
                <h4 className="milestone-cat-title">{cat}</h4>
                <div className="milestone-items">
                  {items.map((m) => (
                    <div
                      key={m.id}
                      className={`milestone-item status-${m.status.toLowerCase().replace(" ", "-")}`}
                    >
                      <div className="milestone-info">
                        <span className="milestone-name">{m.milestone_name}</span>
                        {m.achieved_date && <span className="milestone-date">📅 {m.achieved_date}</span>}
                      </div>
                      <select
                        className="milestone-status-select"
                        value={m.status}
                        onChange={(e) => updateMilestoneStatus(m, e.target.value)}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Achieved">Achieved</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {milestones.length === 0 && (
            <div className="no-data-message">No milestones recorded yet</div>
          )}
        </div>
      )}

      {activeTab === "ai" && (
        <div className="detail-card full-width ai-summary-card">
          <div className="detail-card-title">🤖 AI Safety Summary (Gemini)</div>
          {child.ai_summary ? (
            <>
              <div className="ai-summary-text">{child.ai_summary.summary}</div>
              {child.ai_summary.meal_suggestion && (
                <div className="ai-meal-suggestion">
                  <span>🥗</span>
                  <div>
                    <strong>Recommended Safe Meal: </strong>
                    {child.ai_summary.meal_suggestion}
                  </div>
                </div>
              )}
              <div className="ai-source">
                <span>ℹ️</span>Source:{" "}
                {child.ai_summary.source === "gemini"
                  ? "Google Gemini AI"
                  : child.ai_summary.source === "fallback"
                  ? "Fallback (API key not configured)"
                  : child.ai_summary.source === "none"
                  ? "No medical notes provided"
                  : "AI Assistant"}
              </div>
            </>
          ) : (
            <div className="no-data-message">AI summary not available</div>
          )}
        </div>
      )}
    </section>
  );
}

// =============================================================
// TEACHER ATTENDANCE VIEW
// =============================================================
function TeacherAttendanceView({ user, showToast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/attendance?date=${selectedDate}&teacher_username=${encodeURIComponent(
          user.username
        )}`
      );
      if (response.ok) setRecords(await response.json());
    } catch (err) {
      showToast("Failed to load attendance.", "error");
    } finally {
      setLoading(false);
    }
  }, [user.username, selectedDate, showToast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const markStatus = async (childId, status) => {
    try {
      await fetch(`${API_BASE}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: childId, date: selectedDate, status }),
      });
      setRecords(records.map((r) => (r.child_id === childId ? { ...r, status } : r)));
      showToast(`Marked as ${status}`, "success");
    } catch (err) {
      showToast("Failed to mark attendance.", "error");
    }
  };

  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const lateCount = records.filter((r) => r.status === "Late").length;

  return (
    <section className="dashboard-section" style={{ padding: 0 }}>
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span>📅</span> Daily Attendance
        </h1>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon green">🟢</div>
          <div className="stat-info">
            <h3>{presentCount}</h3>
            <p>Present</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🔴</div>
          <div className="stat-info">
            <h3>{absentCount}</h3>
            <p>Absent</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">🟡</div>
          <div className="stat-info">
            <h3>{lateCount}</h3>
            <p>Late</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">👶</div>
          <div className="stat-info">
            <h3>{records.length}</h3>
            <p>Total</p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="form-group" style={{ margin: 0, flex: "0 0 auto" }}>
          <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>📆 Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1.5px solid var(--color-border)",
              fontFamily: "var(--font-family)",
              fontSize: "0.88rem",
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading attendance sheets...</p>
        </div>
      ) : (
        <div className="attendance-grid">
          {records.map((rec) => (
            <div
              key={rec.child_id}
              className={`attendance-card status-att-${rec.status.toLowerCase().replace(" ", "-")}`}
            >
              <div className="attendance-child-info">
                <div
                  className="child-avatar avatar-blue"
                  style={{ width: 40, height: 40, fontSize: "0.9rem" }}
                >
                  {rec.first_name.charAt(0)}
                </div>
                <div>
                  <div className="child-name-text">
                    {rec.first_name} {rec.last_name}
                  </div>
                  <div className="child-classroom-text">{rec.classroom_name}</div>
                </div>
              </div>
              <div className="attendance-status-badge">
                {rec.status === "Present"
                  ? "🟢"
                  : rec.status === "Absent"
                  ? "🔴"
                  : rec.status === "Late"
                  ? "🟡"
                  : "⚪"}{" "}
                {rec.status}
              </div>
              <div className="attendance-actions">
                <button
                  className={`att-btn att-present ${rec.status === "Present" ? "active" : ""}`}
                  onClick={() => markStatus(rec.child_id, "Present")}
                >
                  Present
                </button>
                <button
                  className={`att-btn att-absent ${rec.status === "Absent" ? "active" : ""}`}
                  onClick={() => markStatus(rec.child_id, "Absent")}
                >
                  Absent
                </button>
                <button
                  className={`att-btn att-late ${rec.status === "Late" ? "active" : ""}`}
                  onClick={() => markStatus(rec.child_id, "Late")}
                >
                  Late
                </button>
              </div>
              {rec.check_in_time && <div className="attendance-time">🕐 Checked in: {rec.check_in_time}</div>}
            </div>
          ))}
          {records.length === 0 && (
            <div className="empty-state full-width" style={{ gridColumn: "1 / -1" }}>
              <div className="empty-state-icon">📋</div>
              <h3>No Attendance Records</h3>
              <p>There are no students listed for your classroom to mark attendance.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// =============================================================
// TEACHER MEALS VIEW
// =============================================================
function TeacherMealsView({ showToast }) {
  const [meals, setMeals] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMealName, setNewMealName] = useState("");
  const [newMealIngredients, setNewMealIngredients] = useState("");
  const [newMealCategory, setNewMealCategory] = useState("Lunch");

  const [checkChildId, setCheckChildId] = useState("");
  const [checkIngredients, setCheckIngredients] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mealsRes, childrenRes] = await Promise.all([
          fetch(`${API_BASE}/meals`),
          fetch(`${API_BASE}/children`),
        ]);
        if (mealsRes.ok) setMeals(await mealsRes.json());
        if (childrenRes.ok) setChildren(await childrenRes.json());
      } catch (err) {
        showToast("Failed to load meals data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const runSafetyCheck = async () => {
    if (!checkChildId || !checkIngredients.trim()) {
      showToast("Select a student and enter ingredients.", "warning");
      return;
    }
    setChecking(true);
    setCheckResult(null);
    try {
      const response = await fetch(`${API_BASE}/check-custom-meal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: parseInt(checkChildId),
          ingredients: checkIngredients,
          meal_name: "Custom Check",
        }),
      });
      if (response.ok) setCheckResult(await response.json());
    } catch (err) {
      showToast("Safety check failed.", "error");
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <section className="dashboard-section" style={{ padding: 0 }}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading allergen checks...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-section" style={{ padding: 0 }}>
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span>🍽️</span> Meals & Safety Check
        </h1>
      </div>

      <div className="detail-grid">
        {/* Custom Food Safety Checker */}
        <div className="detail-card full-width safety-checker-card">
          <div className="detail-card-title">🔍 Custom Food Safety Checker</div>
          <p className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>
            Select a student and type ingredients to verify if the food matches their allergen profiles.
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label>Select Student</label>
              <select value={checkChildId} onChange={(e) => setCheckChildId(e.target.value)}>
                <option value="">Choose a child...</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}{" "}
                    {c.allergies?.length > 0 ? `(${c.allergies.join(", ")})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={newMealCategory} onChange={(e) => setNewMealCategory(e.target.value)}>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Snack">Snack</option>
                <option value="Dinner">Dinner</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Ingredients (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. bread, peanut butter, honey, milk"
                value={checkIngredients}
                onChange={(e) => setCheckIngredients(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary mt-2" onClick={runSafetyCheck} disabled={checking}>
            {checking ? "⏳ Checking..." : "🔎 Verify Safety"}
          </button>

          {checkResult && (
            <div
              className={`safety-result ${
                checkResult.safety_status === "SAFE" ? "safe" : "restricted"
              }`}
            >
              <div className="safety-result-header">
                <span className="safety-result-icon">
                  {checkResult.safety_status === "SAFE" ? "✅" : "🚫"}
                </span>
                <div>
                  <h4>
                    {checkResult.safety_status === "SAFE"
                      ? "SAFE — This food is okay!"
                      : "RESTRICTED — Allergens detected!"}
                  </h4>
                  <p>
                    For: <strong>{checkResult.child_name}</strong>
                  </p>
                </div>
              </div>
              {checkResult.child_allergies?.length > 0 && (
                <div className="safety-result-detail">
                  <strong>Known allergies:</strong> {checkResult.child_allergies.join(", ")}
                </div>
              )}
              {checkResult.matched_allergens?.length > 0 && (
                <div className="safety-result-detail danger">
                  <strong>⚠️ Matches found:</strong>{" "}
                  {checkResult.matched_allergens
                    .map((m) => `${m.matched_ingredient} → ${m.allergy}`)
                    .join("; ")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Menu */}
        <div className="detail-card full-width">
          <div className="detail-card-title">📋 Current Daycare Menu ({meals.length} items)</div>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {meals.map((meal) => (
              <div key={meal.id} className="meal-menu-item">
                <div>
                  <strong>{meal.name}</strong>
                  <span className="badge badge-allergy" style={{ marginLeft: 8 }}>
                    {meal.category}
                  </span>
                </div>
                <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                  {meal.ingredients}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
