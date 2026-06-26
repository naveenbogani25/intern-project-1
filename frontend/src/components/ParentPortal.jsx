import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config";

export default function ParentPortal({ user, showToast }) {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState("health");

  const fetchChildDetails = useCallback(async (childId) => {
    setLoading(true);
    try {
      const [childRes, attRes] = await Promise.all([
        fetch(`${API_BASE}/children/${childId}`),
        fetch(`${API_BASE}/children/${childId}/attendance`),
      ]);
      if (childRes.ok) setSelectedChild(await childRes.json());
      if (attRes.ok) setAttendance(await attRes.json());
    } catch (err) {
      showToast("Failed to load child details", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const fetchParentChildren = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/parent/children?email=${encodeURIComponent(user.email)}`
        );
        if (response.ok) {
          const data = await response.json();
          setChildren(data);
          if (data.length > 0) {
            await fetchChildDetails(data[0].id);
          }
        }
      } catch (err) {
        showToast("Failed to load children list", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchParentChildren();
  }, [user.email, fetchChildDetails, showToast]);

  const handleChildChange = (e) => {
    const childId = parseInt(e.target.value);
    const child = children.find((c) => c.id === childId);
    if (child) fetchChildDetails(childId);
  };

  if (loading && !selectedChild) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading portal updates...</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🧒</div>
        <h3>No Children Linked</h3>
        <p>
          Your email ({user.email}) is not linked to any registered children yet. Please contact the
          administrator.
        </p>
      </div>
    );
  }

  return (
    <section className="parent-portal-section">
      <div className="parent-portal-header">
        <div className="parent-portal-welcome">
          <h2>Parent Portal Dashboard</h2>
          <p>Real-time health, meals, and attendance tracker updates</p>
        </div>
        {children.length > 1 && (
          <div className="child-selector-wrapper">
            <label style={{ fontWeight: 600, marginRight: "8px" }}>Select Child: </label>
            <select
              className="filter-select"
              onChange={handleChildChange}
              value={selectedChild?.id || ""}
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedChild && (
        <div className="parent-child-details">
          <div className="detail-header" style={{ marginTop: 0 }}>
            <div className="detail-header-info">
              <div className="detail-avatar">{selectedChild.first_name.charAt(0)}</div>
              <div>
                <h1 className="detail-name">
                  {selectedChild.first_name} {selectedChild.last_name}
                  <span
                    className={`badge ${
                      selectedChild.risk_status === "High Risk"
                        ? "badge-high-risk"
                        : "badge-normal"
                    }`}
                    style={{ marginLeft: "12px" }}
                  >
                    {selectedChild.risk_status === "High Risk" ? "🔴" : "🟢"}{" "}
                    {selectedChild.risk_status}
                  </span>
                </h1>
                <div className="detail-meta">
                  <span>🎂 {selectedChild.age} years old</span>
                  <span>🏫 {selectedChild.classroom_name}</span>
                  <span>🩸 {selectedChild.blood_group || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-tabs">
            <button
              className={`detail-tab ${activeTab === "health" ? "active" : ""}`}
              onClick={() => setActiveTab("health")}
            >
              🏥 Health & AI Summary
            </button>
            <button
              className={`detail-tab ${activeTab === "attendance" ? "active" : ""}`}
              onClick={() => setActiveTab("attendance")}
            >
              📅 Attendance History
            </button>
            <button
              className={`detail-tab ${activeTab === "meals" ? "active" : ""}`}
              onClick={() => setActiveTab("meals")}
            >
              🍽️ Meal Safety Checks
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Refreshing data...</p>
            </div>
          ) : (
            <div className="parent-tab-content" style={{ marginTop: "20px" }}>
              {activeTab === "health" && (
                <div className="detail-grid">
                  <div className="detail-card">
                    <div className="detail-card-title">⚠️ Known Allergies</div>
                    {selectedChild.allergies && selectedChild.allergies.length > 0 ? (
                      selectedChild.allergies.map((a, i) => (
                        <div className="allergy-detail-item" key={i}>
                          <span className="allergy-name">{a.allergy_type || a}</span>
                          {a.severity && (
                            <span className={`severity-badge severity-${a.severity.toLowerCase()}`}>
                              {a.severity}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-data-message">✅ No known allergies</div>
                    )}
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-title">💊 Active Medications</div>
                    {selectedChild.medications && selectedChild.medications.length > 0 ? (
                      selectedChild.medications.map((m) => (
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

                  {selectedChild.ai_summary && (
                    <div className="detail-card full-width ai-summary-card">
                      <div className="detail-card-title">🤖 AI Safety Summary (Gemini)</div>
                      <div className="ai-summary-text">{selectedChild.ai_summary.summary}</div>
                      {selectedChild.ai_summary.meal_suggestion && (
                        <div className="ai-meal-suggestion">
                          <span>🥗</span>
                          <div>
                            <strong>Recommended Safe Meal: </strong>
                            {selectedChild.ai_summary.meal_suggestion}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "attendance" && (
                <div className="detail-card full-width">
                  <div className="detail-card-title">📅 30-Day Attendance Log</div>
                  {attendance.length > 0 ? (
                    <div className="children-table-wrapper">
                      <table className="children-table" style={{ width: "100%" }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Check In Time</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map((a) => (
                            <tr key={a.id}>
                              <td>{a.date}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    a.status === "Present" ? "badge-normal" : "badge-high-risk"
                                  }`}
                                >
                                  {a.status === "Present" ? "🟢" : "🔴"} {a.status}
                                </span>
                              </td>
                              <td>{a.check_in_time || "—"}</td>
                              <td>{a.notes || <span className="text-muted">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-data-message">No attendance logged yet</div>
                  )}
                </div>
              )}

              {activeTab === "meals" && (
                <div className="detail-card full-width">
                  <div className="detail-card-title">🍽️ Meal Safety Checklists</div>
                  {selectedChild.meal_safety && selectedChild.meal_safety.length > 0 ? (
                    <div className="meal-safety-grid">
                      {selectedChild.meal_safety.map((meal, index) => (
                        <div
                          key={index}
                          className={`meal-safety-item ${
                            meal.status === "SAFE" ? "safe" : "restricted"
                          }`}
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
            </div>
          )}
        </div>
      )}
    </section>
  );
}
