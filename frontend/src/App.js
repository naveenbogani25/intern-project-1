// =============================================================
// FirstCry Intellitots: Child Health & Allergy Tracker
// Main React Frontend Application
// Written by: CSE 1st Year Student Project
//
// This file handles 7 views:
//   1. Dashboard View - Table of all children with filters
//   2. Form View - Add a new child health profile
//   3. Detail View - Full child info + AI summary + meal safety + milestones
//   4. Edit View - Modify existing child profile
//   5. Attendance View - Mark daily attendance
//   6. Meals View - Manage meals + custom food safety checker
//   7. Fees View - Track and update fee payments
// =============================================================

import React, { useState, useEffect, useCallback } from "react";

// ---- Configuration ----
const API_BASE = window.location.origin.includes("localhost") ? "http://localhost:5000/api" : "/api";

// List of common allergies for the checkbox selector in the form
const ALLERGY_OPTIONS = [
  "Peanuts", "Dairy", "Eggs", "Gluten", "Soy",
  "Shellfish", "Tree Nuts", "Fish", "Sesame",
];

// Avatar color options
const AVATAR_COLORS = ["avatar-blue", "avatar-amber", "avatar-green", "avatar-purple"];

// =============================================================
// MAIN APP COMPONENT
// =============================================================

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [editChildData, setEditChildData] = useState(null);
  const [toast, setToast] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileError, setProfileError] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    if (loggedInUser.role === "parent") {
      setCurrentView("parent");
    } else {
      setCurrentView("dashboard");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setCurrentView("dashboard");
  };

  const handleOpenProfile = () => {
    setProfileUsername(user.username);
    setProfilePassword("");
    setProfileError("");
    setShowPassword(false);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    if (!profileUsername.trim() || !profilePassword.trim()) {
      setProfileError("Username and password are required");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username: profileUsername.trim(), password: profilePassword })
      });
      const data = await response.json();
      if (response.ok) {
        const updatedUser = data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setShowProfileModal(false);
        showToast("Profile details updated successfully!", "success");
      } else {
        setProfileError(data.error || "Update failed");
      }
    } catch (err) {
      setProfileError("Could not connect to the server.");
    }
  };

  const goToDashboard = () => { setCurrentView("dashboard"); setSelectedChildId(null); setEditChildData(null); };
  const goToForm = () => { setCurrentView("form"); };
  const goToDetail = (childId) => { setSelectedChildId(childId); setCurrentView("detail"); };
  const goToEdit = (childData) => { setEditChildData(childData); setCurrentView("edit"); };
  const goToAttendance = () => { setCurrentView("attendance"); };
  const goToMeals = () => { setCurrentView("meals"); };
  const goToFees = () => { setCurrentView("fees"); };
  const goToUserMgmt = () => { setCurrentView("usermgmt"); };

  // Sync currentView based on role when user changes (e.g. after refresh)
  useEffect(() => {
    if (user) {
      if (user.role === "parent") {
        setCurrentView("parent");
      } else if (currentView === "parent") {
        setCurrentView("dashboard");
      }
    }
  }, [user]);

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
          <nav className="header-nav">
            {user.role !== "parent" && (
              <>
                <button id="nav-dashboard" className={`nav-btn ${currentView === "dashboard" ? "active" : ""}`} onClick={goToDashboard}>📋 Dashboard</button>
                {user.role === "admin" && (
                  <button id="nav-add-child" className={`nav-btn ${currentView === "form" ? "active" : ""}`} onClick={goToForm}>➕ Add Child</button>
                )}
                <button id="nav-attendance" className={`nav-btn ${currentView === "attendance" ? "active" : ""}`} onClick={goToAttendance}>📅 Attendance</button>
                <button id="nav-meals" className={`nav-btn ${currentView === "meals" ? "active" : ""}`} onClick={goToMeals}>🍽️ Meals</button>
                {user.role === "admin" && (
                  <>
                    <button id="nav-fees" className={`nav-btn ${currentView === "fees" ? "active" : ""}`} onClick={goToFees}>💰 Fees</button>
                    <button id="nav-users" className={`nav-btn ${currentView === "usermgmt" ? "active" : ""}`} onClick={goToUserMgmt}>👥 Users</button>
                  </>
                )}
              </>
            )}
            {user.role === "parent" && (
              <span className="portal-label">🏡 Parent Portal</span>
            )}
          </nav>
          
          <div className="header-user-menu">
            <div className="user-badge" onClick={handleOpenProfile}>
              👤 <span className="user-username">{user.username}</span>
              <span className="badge badge-allergy" style={{ textTransform: "capitalize", marginLeft: "6px" }}>{user.role}</span>
            </div>
            <button className="btn btn-secondary logout-btn" onClick={handleLogout} style={{ marginLeft: "12px", padding: "6px 12px", fontSize: "0.85rem" }}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* ---- MAIN CONTENT AREA ---- */}
      <main className="app-container">
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
          <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
              <h3>👤 User Profile</h3>
              <p className="text-muted mb-2">View and update your login credentials.</p>
              <form onSubmit={handleSaveProfile}>
                {profileError && <div className="form-error mb-2"><span>❌</span> {profileError}</div>}
                <div className="form-group mb-2">
                  <label>Username</label>
                  <input
                    type="text"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
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
                        fontSize: "0.9rem"
                      }}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <div className="modal-actions" style={{ marginTop: "20px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentView === "parent" && <ParentView user={user} showToast={showToast} />}
        {currentView === "dashboard" && <DashboardView user={user} onViewChild={goToDetail} showToast={showToast} />}
        {currentView === "form" && <FormView onSuccess={goToDashboard} showToast={showToast} />}
        {currentView === "detail" && <DetailView childId={selectedChildId} onBack={goToDashboard} onEdit={goToEdit} showToast={showToast} />}
        {currentView === "edit" && <EditView childData={editChildData} onSuccess={goToDashboard} onCancel={goToDashboard} showToast={showToast} />}
        {currentView === "attendance" && <AttendanceView user={user} showToast={showToast} />}
        {currentView === "meals" && <MealsView showToast={showToast} />}
        {currentView === "fees" && <FeesView showToast={showToast} />}
        {currentView === "usermgmt" && <UserManagementView showToast={showToast} />}
      </main>
    </div>
  );
}


// =============================================================
// DASHBOARD VIEW COMPONENT
// =============================================================

function DashboardView({ user, onViewChild, showToast }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [allergyFilter, setAllergyFilter] = useState("");
  const [classrooms, setClassrooms] = useState([]);

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/children?`;
      if (classroomFilter) url += `classroom=${encodeURIComponent(classroomFilter)}&`;
      if (allergyFilter) url += `allergy_type=${encodeURIComponent(allergyFilter)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (user && user.role === 'teacher') {
        url += `teacher_username=${encodeURIComponent(user.username)}&`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setChildren(data);
    } catch (err) {
      setError("Could not connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [user, classroomFilter, allergyFilter, searchQuery]);

  useEffect(() => { fetchChildren(); }, [fetchChildren]);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await fetch(`${API_BASE}/classrooms`);
        if (response.ok) { setClassrooms(await response.json()); }
      } catch (err) { /* ignore */ }
    };
    fetchClassrooms();
  }, []);

  const handleSearch = (e) => { if (e.key === "Enter" || e.type === "blur") fetchChildren(); };
  const clearFilters = () => { setSearchQuery(""); setClassroomFilter(""); setAllergyFilter(""); };

  const totalChildren = children.length;
  const highRiskCount = children.filter((c) => c.risk_status === "High Risk").length;
  const normalCount = totalChildren - highRiskCount;
  const classroomCount = [...new Set(children.map((c) => c.classroom_name))].length;

  return (
    <section className="dashboard-section">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span>📋</span> Children Dashboard
          <span className="child-count">{totalChildren} total</span>
        </h1>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-icon blue">👶</div><div className="stat-info"><h3>{totalChildren}</h3><p>Total Children</p></div></div>
        <div className="stat-card"><div className="stat-icon red">🚨</div><div className="stat-info"><h3>{highRiskCount}</h3><p>High Risk</p></div></div>
        <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-info"><h3>{normalCount}</h3><p>Normal Status</p></div></div>
        <div className="stat-card"><div className="stat-icon amber">🏫</div><div className="stat-info"><h3>{classroomCount}</h3><p>Classrooms</p></div></div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input id="search-input" type="text" className="search-input" placeholder="Search by child name..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} onBlur={handleSearch} />
        </div>
        <select id="classroom-filter" className="filter-select" value={classroomFilter} onChange={(e) => setClassroomFilter(e.target.value)}>
          <option value="">All Classrooms</option>
          {classrooms.map((room) => (<option key={room.id} value={room.name}>{room.name}</option>))}
        </select>
        <select id="allergy-filter" className="filter-select" value={allergyFilter} onChange={(e) => setAllergyFilter(e.target.value)}>
          <option value="">All Allergies</option>
          {ALLERGY_OPTIONS.map((allergy) => (<option key={allergy} value={allergy}>{allergy}</option>))}
        </select>
        <button id="clear-filters" className="clear-filters-btn" onClick={clearFilters}>✕ Clear</button>
      </div>

      {loading && (<div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading children data...</p></div>)}
      {error && !loading && (<div className="empty-state"><div className="empty-state-icon">⚠️</div><h3>Connection Error</h3><p>{error}</p><button className="btn btn-primary mt-2" onClick={fetchChildren}>🔄 Retry</button></div>)}
      {!loading && !error && children.length === 0 && (<div className="empty-state"><div className="empty-state-icon">📭</div><h3>No Children Found</h3><p>{searchQuery || classroomFilter || allergyFilter ? "No children match your current filters." : "No children registered yet. Click 'Add Child'."}</p></div>)}

      {!loading && !error && children.length > 0 && (
        <div className="children-table-wrapper">
          <table className="children-table">
            <thead><tr><th>Child</th><th>Age</th><th>Classroom</th><th>Allergies</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {children.map((child, index) => (
                <tr key={child.id} id={`child-row-${child.id}`} onClick={() => onViewChild(child.id)}>
                  <td><div className="child-name-cell"><div className={`child-avatar ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>{child.first_name.charAt(0)}</div><div><div className="child-name-text">{child.first_name} {child.last_name}</div><div className="child-classroom-text">{child.gender}</div></div></div></td>
                  <td>{child.age} yrs</td>
                  <td>{child.classroom_name}</td>
                  <td><div className="allergy-badges">{child.allergies && child.allergies.length > 0 ? child.allergies.map((allergy, i) => (<span key={i} className="badge badge-allergy">{allergy}</span>)) : (<span className="text-muted">None</span>)}</div></td>
                  <td><span className={`badge ${child.risk_status === "High Risk" ? "badge-high-risk" : "badge-normal"}`}>{child.risk_status === "High Risk" ? "🔴" : "🟢"} {child.risk_status}</span></td>
                  <td><span className="view-arrow">→</span></td>
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
// FORM VIEW COMPONENT (Add new child)
// =============================================================

function FormView({ onSuccess, showToast }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentRelation, setParentRelation] = useState("Father");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [allergySeverities, setAllergySeverities] = useState({});
  const [medications, setMedications] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await fetch(`${API_BASE}/classrooms`);
        if (response.ok) { setClassrooms(await response.json()); }
      } catch (err) {
        setClassrooms([{ id: 1, name: "Butterfly Room" }, { id: 2, name: "Sunshine Class" }, { id: 3, name: "Rainbow Room" }]);
      }
    };
    fetchClassrooms();
  }, []);

  const toggleAllergy = (allergy) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter((a) => a !== allergy));
      const s = { ...allergySeverities }; delete s[allergy]; setAllergySeverities(s);
    } else {
      setSelectedAllergies([...selectedAllergies, allergy]);
      setAllergySeverities({ ...allergySeverities, [allergy]: "Moderate" });
    }
  };
  const updateSeverity = (allergy, severity) => setAllergySeverities({ ...allergySeverities, [allergy]: severity });
  const addMedication = () => setMedications([...medications, { name: "", dosage: "", schedule: "" }]);
  const removeMedication = (index) => setMedications(medications.filter((_, i) => i !== index));
  const updateMedication = (index, field, value) => { const u = [...medications]; u[index][field] = value; setMedications(u); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(""); setFormSuccess(""); setSubmitting(true);
    if (!firstName.trim()) { setFormError("Please enter the child's first name."); setSubmitting(false); return; }
    if (!age) { setFormError("Please select the child's age."); setSubmitting(false); return; }
    if (!classroomId) { setFormError("Please select a classroom."); setSubmitting(false); return; }
    if (!parentName.trim()) { setFormError("Please enter the parent's name."); setSubmitting(false); return; }
    if (!parentPhone.trim()) { setFormError("Please enter the parent's phone."); setSubmitting(false); return; }
    if (!parentEmail.trim()) { setFormError("Please enter the parent's email address."); setSubmitting(false); return; }

    const body = {
      first_name: firstName.trim(), last_name: lastName.trim(), age: parseInt(age), gender, blood_group: bloodGroup,
      classroom_id: parseInt(classroomId), parent_name: parentName.trim(), parent_phone: parentPhone.trim(),
      parent_email: parentEmail.trim(), parent_relation: parentRelation, doctor_notes: doctorNotes.trim(),
      allergies: selectedAllergies, allergy_severities: selectedAllergies.map((a) => allergySeverities[a] || "Moderate"),
      medications: medications.filter((m) => m.name.trim() !== ""),
    };

    try {
      const response = await fetch(`${API_BASE}/children`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (response.ok) {
        setFormSuccess(`Profile created for ${firstName}! 🎉`);
        showToast(`${firstName}'s health profile has been saved!`, "success");
        setTimeout(() => onSuccess(), 1500);
      } else { 
        if (data.error === "parent not registered") {
          setFormError("parent not registered");
        } else {
          setFormError(data.message || "Failed to create profile.");
        }
      }
    } catch (err) { setFormError("Could not connect to the server."); }
    finally { setSubmitting(false); }
  };


  return (
    <section className="form-section">
      <div className="form-container">
        <h1 className="form-title">📝 Register New Child</h1>
        <p className="form-subtitle">Fill in the child's health and contact information below. Fields marked with * are required.</p>
        {formError && <div className="form-error"><span>❌</span> {formError}</div>}
        {formSuccess && <div className="form-success"><span>✅</span> {formSuccess}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section-label">👶 Child Information</div>
          <div className="form-grid">
            <div className="form-group"><label>First Name <span className="required">*</span></label><input id="input-first-name" type="text" placeholder="e.g. Aarav" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div className="form-group"><label>Last Name</label><input id="input-last-name" type="text" placeholder="e.g. Patel" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            <div className="form-group"><label>Age <span className="required">*</span></label><select id="input-age" value={age} onChange={(e) => setAge(e.target.value)}><option value="">Select age</option>{[1,2,3,4,5,6].map(a => <option key={a} value={a}>{a} year{a>1?"s":""}</option>)}</select></div>
            <div className="form-group"><label>Gender</label><select id="input-gender" value={gender} onChange={(e) => setGender(e.target.value)}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            <div className="form-group"><label>Blood Group</label><select id="input-blood-group" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}><option value="">Select</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b} value={b}>{b}</option>)}</select></div>
            <div className="form-group"><label>Classroom <span className="required">*</span></label><select id="input-classroom" value={classroomId} onChange={(e) => setClassroomId(e.target.value)}><option value="">Select classroom</option>{classrooms.map((room) => (<option key={room.id} value={room.id}>{room.name}</option>))}</select></div>
          </div>

          <div className="form-divider"></div>
          <div className="form-section-label">👨‍👩‍👧 Parent / Guardian</div>
          <div className="form-grid">
            <div className="form-group"><label>Parent Name <span className="required">*</span></label><input id="input-parent-name" type="text" placeholder="e.g. Raj Patel" value={parentName} onChange={(e) => setParentName(e.target.value)} /></div>
            <div className="form-group"><label>Relation</label><select id="input-relation" value={parentRelation} onChange={(e) => setParentRelation(e.target.value)}><option value="Father">Father</option><option value="Mother">Mother</option><option value="Guardian">Guardian</option></select></div>
            <div className="form-group"><label>Phone Number <span className="required">*</span></label><input id="input-parent-phone" type="tel" placeholder="e.g. +91-9876543210" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} /></div>
            <div className="form-group"><label>Email</label><input id="input-parent-email" type="email" placeholder="e.g. parent@email.com" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} /></div>
          </div>

          <div className="form-divider"></div>
          <div className="form-section-label">⚠️ Known Allergies</div>
          <p className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>Select all allergies that apply.</p>
          <div className="allergy-checkbox-grid">
            {ALLERGY_OPTIONS.map((allergy) => (
              <label key={allergy} className={`allergy-checkbox-item ${selectedAllergies.includes(allergy) ? "checked" : ""}`}>
                <input type="checkbox" checked={selectedAllergies.includes(allergy)} onChange={() => toggleAllergy(allergy)} />{allergy}
              </label>
            ))}
          </div>
          {selectedAllergies.length > 0 && (<div className="form-grid mt-2">{selectedAllergies.map((allergy) => (<div className="form-group" key={allergy}><label>{allergy} Severity</label><select value={allergySeverities[allergy] || "Moderate"} onChange={(e) => updateSeverity(allergy, e.target.value)}><option value="Mild">Mild</option><option value="Moderate">Moderate</option><option value="Severe">Severe</option></select></div>))}</div>)}

          <div className="form-divider"></div>
          <div className="form-section-label">💊 Current Medications</div>
          {medications.map((med, index) => (
            <div className="medication-entry" key={index}>
              <input type="text" placeholder="Medicine name" value={med.name} onChange={(e) => updateMedication(index, "name", e.target.value)} />
              <input type="text" placeholder="Dosage" value={med.dosage} onChange={(e) => updateMedication(index, "dosage", e.target.value)} />
              <input type="text" placeholder="Schedule" value={med.schedule} onChange={(e) => updateMedication(index, "schedule", e.target.value)} />
              <button type="button" className="remove-med-btn" onClick={() => removeMedication(index)}>✕</button>
            </div>
          ))}
          <button type="button" className="add-med-btn" onClick={addMedication}>+ Add Medication</button>

          <div className="form-divider"></div>
          <div className="form-section-label">📋 Doctor / Medical Notes</div>
          <div className="form-group full-width"><label>Raw Medical Notes</label><textarea id="input-doctor-notes" placeholder="Paste or type the child's medical history..." value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} rows={5} /></div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onSuccess}>Cancel</button>
            <button id="submit-form" type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "⏳ Saving..." : "💾 Save Profile"}</button>
          </div>
        </form>
      </div>
    </section>
  );
}


// =============================================================
// EDIT VIEW COMPONENT (Modify existing child)
// =============================================================

function EditView({ childData, onSuccess, onCancel, showToast }) {
  const [firstName, setFirstName] = useState(childData?.first_name || "");
  const [lastName, setLastName] = useState(childData?.last_name || "");
  const [age, setAge] = useState(String(childData?.age || ""));
  const [gender, setGender] = useState(childData?.gender || "Male");
  const [bloodGroup, setBloodGroup] = useState(childData?.blood_group || "");
  const [classroomId, setClassroomId] = useState(String(childData?.classroom_id || ""));
  const [doctorNotes, setDoctorNotes] = useState(childData?.doctor_notes || "");
  const [parentName, setParentName] = useState(childData?.parents?.[0]?.name || "");
  const [parentPhone, setParentPhone] = useState(childData?.parents?.[0]?.phone || "");
  const [parentEmail, setParentEmail] = useState(childData?.parents?.[0]?.email || "");
  const [parentRelation, setParentRelation] = useState(childData?.parents?.[0]?.relation || "Parent");
  const [selectedAllergies, setSelectedAllergies] = useState((childData?.allergies || []).map(a => a.allergy_type));
  const [allergySeverities, setAllergySeverities] = useState(
    (childData?.allergies || []).reduce((acc, a) => { acc[a.allergy_type] = a.severity; return acc; }, {})
  );
  const [classrooms, setClassrooms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await fetch(`${API_BASE}/classrooms`);
        if (response.ok) setClassrooms(await response.json());
      } catch (err) { setClassrooms([{ id: 1, name: "Butterfly Room" }, { id: 2, name: "Sunshine Class" }, { id: 3, name: "Rainbow Room" }]); }
    };
    fetchClassrooms();
  }, []);

  const toggleAllergy = (allergy) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== allergy));
      const s = { ...allergySeverities }; delete s[allergy]; setAllergySeverities(s);
    } else {
      setSelectedAllergies([...selectedAllergies, allergy]);
      setAllergySeverities({ ...allergySeverities, [allergy]: "Moderate" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(""); setSubmitting(true);

    const body = {
      first_name: firstName.trim(), last_name: lastName.trim(), age: parseInt(age), gender, blood_group: bloodGroup,
      classroom_id: parseInt(classroomId), doctor_notes: doctorNotes.trim(),
      parent_name: parentName.trim(), parent_phone: parentPhone.trim(), parent_email: parentEmail.trim(), parent_relation: parentRelation,
      allergies: selectedAllergies, allergy_severities: selectedAllergies.map(a => allergySeverities[a] || "Moderate"),
    };

    try {
      const response = await fetch(`${API_BASE}/children/${childData.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (response.ok) {
        showToast(`${firstName}'s profile updated!`, "success");
        onSuccess();
      } else { const data = await response.json(); setFormError(data.error || "Update failed."); }
    } catch (err) { setFormError("Could not connect to the server."); }
    finally { setSubmitting(false); }
  };

  return (
    <section className="form-section">
      <div className="form-container">
        <h1 className="form-title">✏️ Edit Child Profile</h1>
        <p className="form-subtitle">Update {childData?.first_name}'s health profile information below.</p>
        {formError && <div className="form-error"><span>❌</span> {formError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section-label">👶 Child Information</div>
          <div className="form-grid">
            <div className="form-group"><label>First Name <span className="required">*</span></label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div className="form-group"><label>Last Name</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            <div className="form-group"><label>Age <span className="required">*</span></label><select value={age} onChange={(e) => setAge(e.target.value)}><option value="">Select age</option>{[1,2,3,4,5,6].map(a => <option key={a} value={a}>{a} year{a>1?"s":""}</option>)}</select></div>
            <div className="form-group"><label>Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            <div className="form-group"><label>Blood Group</label><select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}><option value="">Select</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b} value={b}>{b}</option>)}</select></div>
            <div className="form-group"><label>Classroom <span className="required">*</span></label><select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}><option value="">Select classroom</option>{classrooms.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}</select></div>
          </div>

          <div className="form-divider"></div>
          <div className="form-section-label">👨‍👩‍👧 Parent / Guardian</div>
          <div className="form-grid">
            <div className="form-group"><label>Parent Name</label><input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} /></div>
            <div className="form-group"><label>Relation</label><select value={parentRelation} onChange={(e) => setParentRelation(e.target.value)}><option value="Father">Father</option><option value="Mother">Mother</option><option value="Guardian">Guardian</option></select></div>
            <div className="form-group"><label>Phone</label><input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} /></div>
          </div>

          <div className="form-divider"></div>
          <div className="form-section-label">⚠️ Known Allergies</div>
          <div className="allergy-checkbox-grid">
            {ALLERGY_OPTIONS.map((allergy) => (
              <label key={allergy} className={`allergy-checkbox-item ${selectedAllergies.includes(allergy) ? "checked" : ""}`}>
                <input type="checkbox" checked={selectedAllergies.includes(allergy)} onChange={() => toggleAllergy(allergy)} />{allergy}
              </label>
            ))}
          </div>
          {selectedAllergies.length > 0 && (<div className="form-grid mt-2">{selectedAllergies.map(a => (<div className="form-group" key={a}><label>{a} Severity</label><select value={allergySeverities[a] || "Moderate"} onChange={(e) => setAllergySeverities({...allergySeverities, [a]: e.target.value})}><option value="Mild">Mild</option><option value="Moderate">Moderate</option><option value="Severe">Severe</option></select></div>))}</div>)}

          <div className="form-divider"></div>
          <div className="form-section-label">📋 Doctor / Medical Notes</div>
          <div className="form-group full-width"><label>Raw Medical Notes</label><textarea value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} rows={5} /></div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "⏳ Saving..." : "💾 Update Profile"}</button>
          </div>
        </form>
      </div>
    </section>
  );
}


// =============================================================
// DETAIL VIEW COMPONENT
// =============================================================

function DetailView({ childId, onBack, onEdit, showToast }) {
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchChild = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE}/children/${childId}`);
      if (!response.ok) { if (response.status === 404) throw new Error("Child not found."); throw new Error(`Server error: ${response.status}`); }
      const data = await response.json();
      setChild(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [childId]);

  useEffect(() => { if (childId) fetchChild(); }, [childId, fetchChild]);

  // Show high-risk toast when child data loads
  useEffect(() => {
    if (child && child.risk_status === "High Risk") {
      showToast(`⚠️ ${child.first_name} is HIGH RISK!`, "warning");
    }
  }, [child]);

  // Fetch milestones
  useEffect(() => {
    if (!childId) return;
    const fetchMilestones = async () => {
      try {
        const response = await fetch(`${API_BASE}/children/${childId}/milestones`);
        if (response.ok) setMilestones(await response.json());
      } catch (err) { /* ignore */ }
    };
    fetchMilestones();
  }, [childId]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE}/children/${childId}`, { method: "DELETE" });
      if (response.ok) { showToast("Child profile deleted.", "success"); onBack(); }
      else showToast("Failed to delete.", "error");
    } catch (err) { showToast("Server error.", "error"); }
  };

  const updateMilestoneStatus = async (milestone, newStatus) => {
    try {
      await fetch(`${API_BASE}/children/${childId}/milestones`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: milestone.id, status: newStatus, achieved_date: newStatus === "Achieved" ? new Date().toISOString().split("T")[0] : null }),
      });
      setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, status: newStatus, achieved_date: newStatus === "Achieved" ? new Date().toISOString().split("T")[0] : null } : m));
      showToast(`Milestone "${milestone.milestone_name}" → ${newStatus}`, "success");
    } catch (err) { showToast("Failed to update milestone.", "error"); }
  };

  if (loading) return (<section className="detail-section"><div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading child profile & running safety checks...</p></div></section>);
  if (error) return (<section className="detail-section"><div className="empty-state"><div className="empty-state-icon">😔</div><h3>Could Not Load Profile</h3><p>{error}</p><button className="btn btn-back mt-2" onClick={onBack}>← Back</button></div></section>);
  if (!child) return null;

  const milestoneCats = ["Physical", "Cognitive", "Social", "Language", "Emotional"];

  return (
    <section className="detail-section">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🗑️</div>
            <h3>Delete {child.first_name}'s Profile?</h3>
            <p>This action cannot be undone. All records for this child will be permanently removed.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-info">
          <div className="detail-avatar">{child.first_name.charAt(0)}</div>
          <div>
            <h1 className="detail-name">{child.first_name} {child.last_name} <span className={`badge ${child.risk_status === "High Risk" ? "badge-high-risk" : "badge-normal"}`}>{child.risk_status === "High Risk" ? "🔴" : "🟢"} {child.risk_status}</span></h1>
            <div className="detail-meta">
              <span>🎂 {child.age} years old</span>
              <span>🏫 {child.classroom_name}</span>
              <span>🩸 {child.blood_group || "N/A"}</span>
            </div>
          </div>
        </div>
        <div className="detail-header-actions">
          <button className="btn btn-back" onClick={() => onEdit(child)}>✏️ Edit</button>
          <button className="btn btn-danger-outline" onClick={() => setShowDeleteConfirm(true)}>🗑️ Delete</button>
          <button id="back-to-dashboard" className="btn btn-back" onClick={onBack}>← Back</button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="detail-tabs">
        <button className={`detail-tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>📋 Overview</button>
        <button className={`detail-tab ${activeTab === "meals" ? "active" : ""}`} onClick={() => setActiveTab("meals")}>🍽️ Meal Safety</button>
        <button className={`detail-tab ${activeTab === "milestones" ? "active" : ""}`} onClick={() => setActiveTab("milestones")}>🏆 Milestones</button>
        <button className={`detail-tab ${activeTab === "ai" ? "active" : ""}`} onClick={() => setActiveTab("ai")}>🤖 AI Summary</button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="detail-grid">
          <div className="detail-card">
            <div className="detail-card-title">👶 Personal Information</div>
            <div className="detail-row"><span className="label">Full Name</span><span className="value">{child.first_name} {child.last_name}</span></div>
            <div className="detail-row"><span className="label">Age</span><span className="value">{child.age} years</span></div>
            <div className="detail-row"><span className="label">Gender</span><span className="value">{child.gender || "Not specified"}</span></div>
            <div className="detail-row"><span className="label">Blood Group</span><span className="value">{child.blood_group || "Not specified"}</span></div>
            <div className="detail-row"><span className="label">Classroom</span><span className="value">{child.classroom_name}</span></div>
            <div className="detail-row"><span className="label">Status</span><span className="value">{child.status || "Active"}</span></div>
          </div>

          <div className="detail-card">
            <div className="detail-card-title">📞 Emergency Contacts</div>
            {child.parents && child.parents.length > 0 ? child.parents.map((p) => (
              <div className="contact-card" key={p.id}><div className="contact-icon">👤</div><div className="contact-info"><h4>{p.name}{p.is_emergency_contact && <span className="emergency-badge">EMERGENCY</span>}</h4><p>{p.relation} • {p.phone}</p>{p.email && <p>✉️ {p.email}</p>}</div></div>
            )) : <div className="no-data-message">No contacts on file</div>}
          </div>

          <div className="detail-card">
            <div className="detail-card-title">⚠️ Known Allergies</div>
            {child.allergies && child.allergies.length > 0 ? child.allergies.map((a) => (
              <div className="allergy-detail-item" key={a.id}><span className="allergy-name">{a.allergy_type}</span><span className={`severity-badge severity-${a.severity.toLowerCase()}`}>{a.severity}</span></div>
            )) : <div className="no-data-message">✅ No known allergies</div>}
          </div>

          <div className="detail-card">
            <div className="detail-card-title">💊 Active Medications</div>
            {child.medications && child.medications.length > 0 ? child.medications.map((m) => (
              <div className="med-detail-item" key={m.id}><h4>{m.medicine_name}</h4><p>Dosage: {m.dosage || "Not specified"}</p><p>Schedule: {m.schedule || "As needed"}</p></div>
            )) : <div className="no-data-message">No active medications</div>}
          </div>

          {child.doctor_notes && (
            <div className="detail-card full-width">
              <div className="detail-card-title">📋 Doctor / Medical Notes (Raw)</div>
              <div className="ai-summary-text" style={{ whiteSpace: "pre-wrap" }}>{child.doctor_notes}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === "meals" && (
        <div className="detail-card full-width">
          <div className="detail-card-title">🍽️ Meal Safety Check (Rule Engine)</div>
          {child.meal_safety && child.meal_safety.length > 0 ? (
            <div className="meal-safety-grid">
              {child.meal_safety.map((meal, index) => (
                <div key={index} className={`meal-safety-item ${meal.status === "SAFE" ? "safe" : "restricted"}`}>
                  <div className="meal-name">{meal.status === "SAFE" ? "✅" : "🚫"} {meal.meal_name}</div>
                  <div className="meal-category">{meal.meal_category}</div>
                  <div className="meal-status">{meal.status}</div>
                  {meal.matched_allergens && meal.matched_allergens.length > 0 && (
                    <div className="meal-allergen-match">⚠️ Contains: {meal.matched_allergens.map((m) => `${m.matched_ingredient} (${m.allergy})`).join(", ")}</div>
                  )}
                </div>
              ))}
            </div>
          ) : <div className="no-data-message">No meal data available</div>}
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="detail-card full-width">
          <div className="detail-card-title">🏆 Developmental Milestones</div>
          {milestoneCats.map(cat => {
            const items = milestones.filter(m => m.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="milestone-category">
                <h4 className="milestone-cat-title">{cat}</h4>
                <div className="milestone-items">
                  {items.map(m => (
                    <div key={m.id} className={`milestone-item status-${m.status.toLowerCase().replace(" ", "-")}`}>
                      <div className="milestone-info">
                        <span className="milestone-name">{m.milestone_name}</span>
                        {m.achieved_date && <span className="milestone-date">📅 {m.achieved_date}</span>}
                      </div>
                      <select className="milestone-status-select" value={m.status} onChange={(e) => updateMilestoneStatus(m, e.target.value)}>
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
          {milestones.length === 0 && <div className="no-data-message">No milestones recorded yet</div>}
        </div>
      )}

      {activeTab === "ai" && (
        <div className="detail-card full-width ai-summary-card">
          <div className="detail-card-title">🤖 AI Safety Summary (Gemini)</div>
          {child.ai_summary ? (
            <>
              <div className="ai-summary-text">{child.ai_summary.summary}</div>
              {child.ai_summary.meal_suggestion && (
                <div className="ai-meal-suggestion"><span>🥗</span><div><strong>Recommended Safe Meal: </strong>{child.ai_summary.meal_suggestion}</div></div>
              )}
              <div className="ai-source"><span>ℹ️</span>Source: {child.ai_summary.source === "gemini" ? "Google Gemini AI" : child.ai_summary.source === "fallback" ? "Fallback (API key not configured)" : child.ai_summary.source === "none" ? "No medical notes provided" : "AI Assistant"}</div>
            </>
          ) : <div className="no-data-message">AI summary not available</div>}
        </div>
      )}
    </section>
  );
}


// =============================================================
// ATTENDANCE VIEW COMPONENT
// =============================================================

function AttendanceView({ user, showToast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/attendance?date=${selectedDate}`;
      if (user && user.role === 'teacher') {
        url += `&teacher_username=${encodeURIComponent(user.username)}`;
      }
      const response = await fetch(url);
      if (response.ok) setRecords(await response.json());
    } catch (err) { showToast("Failed to load attendance.", "error"); }
    finally { setLoading(false); }
  }, [user, selectedDate, showToast]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const markStatus = async (childId, status) => {
    try {
      await fetch(`${API_BASE}/attendance`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: childId, date: selectedDate, status }),
      });
      setRecords(records.map(r => r.child_id === childId ? { ...r, status } : r));
      showToast(`Marked as ${status}`, "success");
    } catch (err) { showToast("Failed to mark attendance.", "error"); }
  };

  const presentCount = records.filter(r => r.status === "Present").length;
  const absentCount = records.filter(r => r.status === "Absent").length;
  const lateCount = records.filter(r => r.status === "Late").length;

  return (
    <section className="dashboard-section">
      <div className="dashboard-header">
        <h1 className="dashboard-title"><span>📅</span> Daily Attendance</h1>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-icon green">🟢</div><div className="stat-info"><h3>{presentCount}</h3><p>Present</p></div></div>
        <div className="stat-card"><div className="stat-icon red">🔴</div><div className="stat-info"><h3>{absentCount}</h3><p>Absent</p></div></div>
        <div className="stat-card"><div className="stat-icon amber">🟡</div><div className="stat-info"><h3>{lateCount}</h3><p>Late</p></div></div>
        <div className="stat-card"><div className="stat-icon blue">👶</div><div className="stat-info"><h3>{records.length}</h3><p>Total</p></div></div>
      </div>

      <div className="filter-bar">
        <div className="form-group" style={{ margin: 0, flex: "0 0 auto" }}>
          <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>📆 Select Date</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--color-border)", fontFamily: "var(--font-family)", fontSize: "0.88rem" }} />
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading attendance...</p></div>
      ) : (
        <div className="attendance-grid">
          {records.map((rec) => (
            <div key={rec.child_id} className={`attendance-card status-att-${rec.status.toLowerCase().replace(" ", "-")}`}>
              <div className="attendance-child-info">
                <div className="child-avatar avatar-blue" style={{ width: 40, height: 40, fontSize: "0.9rem" }}>{rec.first_name.charAt(0)}</div>
                <div>
                  <div className="child-name-text">{rec.first_name} {rec.last_name}</div>
                  <div className="child-classroom-text">{rec.classroom_name}</div>
                </div>
              </div>
              <div className="attendance-status-badge">{rec.status === "Present" ? "🟢" : rec.status === "Absent" ? "🔴" : rec.status === "Late" ? "🟡" : "⚪"} {rec.status}</div>
              <div className="attendance-actions">
                <button className={`att-btn att-present ${rec.status === "Present" ? "active" : ""}`} onClick={() => markStatus(rec.child_id, "Present")}>Present</button>
                <button className={`att-btn att-absent ${rec.status === "Absent" ? "active" : ""}`} onClick={() => markStatus(rec.child_id, "Absent")}>Absent</button>
                <button className={`att-btn att-late ${rec.status === "Late" ? "active" : ""}`} onClick={() => markStatus(rec.child_id, "Late")}>Late</button>
              </div>
              {rec.check_in_time && <div className="attendance-time">🕐 Checked in: {rec.check_in_time}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


// =============================================================
// MEALS VIEW COMPONENT (Meal Management + Custom Safety Checker)
// =============================================================

function MealsView({ showToast }) {
  const [meals, setMeals] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMealName, setNewMealName] = useState("");
  const [newMealIngredients, setNewMealIngredients] = useState("");
  const [newMealCategory, setNewMealCategory] = useState("Lunch");

  // Custom checker state
  const [checkChildId, setCheckChildId] = useState("");
  const [checkIngredients, setCheckIngredients] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mealsRes, childrenRes] = await Promise.all([
          fetch(`${API_BASE}/meals`), fetch(`${API_BASE}/children`),
        ]);
        if (mealsRes.ok) setMeals(await mealsRes.json());
        if (childrenRes.ok) setChildren(await childrenRes.json());
      } catch (err) { showToast("Failed to load data.", "error"); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [showToast]);

  const addMeal = async () => {
    if (!newMealName.trim() || !newMealIngredients.trim()) { showToast("Enter meal name and ingredients.", "warning"); return; }
    try {
      const response = await fetch(`${API_BASE}/meals`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMealName, ingredients: newMealIngredients, category: newMealCategory }),
      });
      if (response.ok) {
        const data = await response.json();
        setMeals([...meals, { id: data.meal_id, name: newMealName, ingredients: newMealIngredients, category: newMealCategory }]);
        setNewMealName(""); setNewMealIngredients("");
        showToast("Meal added to the menu!", "success");
      }
    } catch (err) { showToast("Failed to add meal.", "error"); }
  };

  const runSafetyCheck = async () => {
    if (!checkChildId || !checkIngredients.trim()) { showToast("Select a child and enter ingredients.", "warning"); return; }
    setChecking(true); setCheckResult(null);
    try {
      const response = await fetch(`${API_BASE}/check-custom-meal`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: parseInt(checkChildId), ingredients: checkIngredients, meal_name: "Custom Check" }),
      });
      if (response.ok) setCheckResult(await response.json());
    } catch (err) { showToast("Safety check failed.", "error"); }
    finally { setChecking(false); }
  };

  if (loading) return (<section className="dashboard-section"><div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading meals...</p></div></section>);

  return (
    <section className="dashboard-section">
      <div className="dashboard-header"><h1 className="dashboard-title"><span>🍽️</span> Meals & Food Safety</h1></div>

      <div className="detail-grid">
        {/* Custom Food Safety Checker */}
        <div className="detail-card full-width safety-checker-card">
          <div className="detail-card-title">🔍 Custom Food Safety Checker</div>
          <p className="text-muted mb-2" style={{ fontSize: "0.85rem" }}>Select a child and type ingredients to check if the food is safe for them.</p>
          <div className="form-grid">
            <div className="form-group">
              <label>Select Child</label>
              <select value={checkChildId} onChange={(e) => setCheckChildId(e.target.value)}>
                <option value="">Choose a child...</option>
                {children.map(c => (<option key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.allergies?.length > 0 ? `(${c.allergies.join(", ")})` : ""}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={newMealCategory} onChange={(e) => setNewMealCategory(e.target.value)}>
                <option value="Breakfast">Breakfast</option><option value="Lunch">Lunch</option><option value="Snack">Snack</option><option value="Dinner">Dinner</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Ingredients (comma-separated)</label>
              <input type="text" placeholder="e.g. bread, peanut butter, honey, milk" value={checkIngredients} onChange={(e) => setCheckIngredients(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary mt-2" onClick={runSafetyCheck} disabled={checking}>{checking ? "⏳ Checking..." : "🔎 Verify Safety"}</button>

          {checkResult && (
            <div className={`safety-result ${checkResult.safety_status === "SAFE" ? "safe" : "restricted"}`}>
              <div className="safety-result-header">
                <span className="safety-result-icon">{checkResult.safety_status === "SAFE" ? "✅" : "🚫"}</span>
                <div>
                  <h4>{checkResult.safety_status === "SAFE" ? "SAFE — This food is okay!" : "RESTRICTED — Allergens detected!"}</h4>
                  <p>For: <strong>{checkResult.child_name}</strong></p>
                </div>
              </div>
              {checkResult.child_allergies?.length > 0 && (
                <div className="safety-result-detail"><strong>Known allergies:</strong> {checkResult.child_allergies.join(", ")}</div>
              )}
              {checkResult.matched_allergens?.length > 0 && (
                <div className="safety-result-detail danger"><strong>⚠️ Matches found:</strong> {checkResult.matched_allergens.map(m => `${m.matched_ingredient} → ${m.allergy}`).join("; ")}</div>
              )}
            </div>
          )}
        </div>

        {/* Add New Meal */}
        <div className="detail-card">
          <div className="detail-card-title">➕ Add New Meal</div>
          <div className="form-group mb-2"><label>Meal Name</label><input type="text" placeholder="e.g. Veggie Wrap" value={newMealName} onChange={(e) => setNewMealName(e.target.value)} /></div>
          <div className="form-group mb-2"><label>Ingredients</label><input type="text" placeholder="e.g. tortilla, lettuce, tomato" value={newMealIngredients} onChange={(e) => setNewMealIngredients(e.target.value)} /></div>
          <div className="form-group mb-2"><label>Category</label><select value={newMealCategory} onChange={(e) => setNewMealCategory(e.target.value)}><option value="Breakfast">Breakfast</option><option value="Lunch">Lunch</option><option value="Snack">Snack</option><option value="Dinner">Dinner</option></select></div>
          <button className="btn btn-primary" onClick={addMeal}>➕ Add to Menu</button>
        </div>

        {/* Current Menu */}
        <div className="detail-card">
          <div className="detail-card-title">📋 Current Menu ({meals.length} items)</div>
          {meals.map((meal) => (
            <div key={meal.id} className="meal-menu-item">
              <div><strong>{meal.name}</strong><span className="badge badge-allergy" style={{ marginLeft: 8 }}>{meal.category}</span></div>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>{meal.ingredients}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// =============================================================
// FEES VIEW COMPONENT
// =============================================================

function FeesView({ showToast }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/fees?`;
      if (statusFilter) url += `status=${statusFilter}`;
      const response = await fetch(url);
      if (response.ok) setFees(await response.json());
    } catch (err) { showToast("Failed to load fees.", "error"); }
    finally { setLoading(false); }
  }, [statusFilter, showToast]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const markAsPaid = async (feeId, method) => {
    try {
      await fetch(`${API_BASE}/fees/${feeId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Paid", paid_date: new Date().toISOString().split("T")[0], payment_method: method }),
      });
      setFees(fees.map(f => f.id === feeId ? { ...f, status: "Paid", paid_date: new Date().toISOString().split("T")[0], payment_method: method } : f));
      showToast("Fee marked as paid!", "success");
    } catch (err) { showToast("Failed to update fee.", "error"); }
  };

  const totalDue = fees.filter(f => f.status !== "Paid").reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fees.filter(f => f.status === "Paid").reduce((sum, f) => sum + (f.amount || 0), 0);
  const overdueCount = fees.filter(f => f.status === "Overdue").length;

  return (
    <section className="dashboard-section">
      <div className="dashboard-header"><h1 className="dashboard-title"><span>💰</span> Fee Management</h1></div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-icon green">💚</div><div className="stat-info"><h3>₹{totalPaid.toLocaleString()}</h3><p>Total Collected</p></div></div>
        <div className="stat-card"><div className="stat-icon amber">💛</div><div className="stat-info"><h3>₹{totalDue.toLocaleString()}</h3><p>Total Outstanding</p></div></div>
        <div className="stat-card"><div className="stat-icon red">❗</div><div className="stat-info"><h3>{overdueCount}</h3><p>Overdue</p></div></div>
        <div className="stat-card"><div className="stat-icon blue">📄</div><div className="stat-info"><h3>{fees.length}</h3><p>Total Records</p></div></div>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading fees...</p></div>
      ) : (
        <div className="fees-grid">
          {fees.map((fee) => (
            <div key={fee.id} className={`fee-card fee-status-${fee.status.toLowerCase()}`}>
              <div className="fee-header">
                <div>
                  <h4 className="fee-child-name">{fee.child_name}</h4>
                  <span className="badge badge-allergy">{fee.fee_type}</span>
                </div>
                <div className="fee-amount">₹{(fee.amount || 0).toLocaleString()}</div>
              </div>
              <div className="fee-details">
                <div><span className="label">Due Date:</span> <span className="value">{fee.due_date}</span></div>
                {fee.paid_date && <div><span className="label">Paid:</span> <span className="value">{fee.paid_date}</span></div>}
                {fee.payment_method && <div><span className="label">Method:</span> <span className="value">{fee.payment_method}</span></div>}
              </div>
              <div className="fee-footer">
                <span className={`badge ${fee.status === "Paid" ? "badge-normal" : fee.status === "Overdue" ? "badge-high-risk" : "badge-allergy"}`}>
                  {fee.status === "Paid" ? "✅" : fee.status === "Overdue" ? "🔴" : "🟡"} {fee.status}
                </span>
                {fee.status !== "Paid" && (
                  <div className="fee-pay-actions">
                    <button className="att-btn att-present" onClick={() => markAsPaid(fee.id, "UPI")}>UPI</button>
                    <button className="att-btn att-present" onClick={() => markAsPaid(fee.id, "Cash")}>Cash</button>
                    <button className="att-btn att-present" onClick={() => markAsPaid(fee.id, "Card")}>Card</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {fees.length === 0 && <div className="empty-state"><div className="empty-state-icon">💰</div><h3>No Fee Records</h3><p>No fee records match your filters.</p></div>}
        </div>
      )}
    </section>
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
        showToast("Welcome back! 👋", "success");
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


// =============================================================
// USER MANAGEMENT VIEW COMPONENT
// =============================================================

function UserManagementView({ showToast }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (response.ok) setUsers(await response.json());
    } catch (err) { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !email.trim() || !password || !role) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password, role })
      });
      const data = await response.json();
      if (response.ok) {
        showToast("User registered successfully! 🎉", "success");
        setUsername("");
        setEmail("");
        setPassword("");
        fetchUsers();
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch (err) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="dashboard-section">
      <div className="dashboard-header">
        <h1 className="dashboard-title">👥 User Management</h1>
      </div>
      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-card-title">➕ Register New User</div>
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error mb-2"><span>❌</span> {error}</div>}
            <div className="form-group mb-2">
              <label>Username</label>
              <input type="text" placeholder="e.g. priya" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="form-group mb-2">
              <label>Email Address</label>
              <input type="email" placeholder="e.g. priya@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group mb-2">
              <label>Password</label>
              <input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-group mb-2">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }} disabled={loading}>
              {loading ? "Registering..." : "Register User"}
            </button>
          </form>
        </div>
        <div className="detail-card">
          <div className="detail-card-title">📋 Registered Users</div>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="children-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-high-risk' : u.role === 'teacher' ? 'badge-allergy' : 'badge-normal'}`}>{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}


// =============================================================
// PARENT PORTAL VIEW COMPONENT
// =============================================================

function ParentView({ user, showToast }) {
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
        fetch(`${API_BASE}/children/${childId}/attendance`)
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
        const response = await fetch(`${API_BASE}/parent/children?email=${encodeURIComponent(user.email)}`);
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
    const child = children.find(c => c.id === childId);
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
        <p>Your email ({user.email}) is not linked to any registered children yet. Please contact the administrator.</p>
      </div>
    );
  }

  return (
    <section className="parent-portal-section">
      <div className="parent-portal-header">
        <div className="parent-portal-welcome">
          <h2>👨‍👩‍👧 Parent Portal Dashboard</h2>
          <p>Real-time health, meals, and attendance tracker updates</p>
        </div>
        {children.length > 1 && (
          <div className="child-selector-wrapper">
            <label style={{ fontWeight: 600, marginRight: "8px" }}>Select Child: </label>
            <select className="filter-select" onChange={handleChildChange} value={selectedChild?.id || ""}>
              {children.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
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
                  <span className={`badge ${selectedChild.risk_status === "High Risk" ? "badge-high-risk" : "badge-normal"}`} style={{ marginLeft: "12px" }}>
                    {selectedChild.risk_status === "High Risk" ? "🔴" : "🟢"} {selectedChild.risk_status}
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
            <button className={`detail-tab ${activeTab === "health" ? "active" : ""}`} onClick={() => setActiveTab("health")}>🏥 Health & AI Summary</button>
            <button className={`detail-tab ${activeTab === "attendance" ? "active" : ""}`} onClick={() => setActiveTab("attendance")}>📅 Attendance History</button>
            <button className={`detail-tab ${activeTab === "meals" ? "active" : ""}`} onClick={() => setActiveTab("meals")}>🍽️ Meal Safety Checks</button>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner"></div><p>Refreshing data...</p></div>
          ) : (
            <div className="parent-tab-content" style={{ marginTop: "20px" }}>
              {activeTab === "health" && (
                <div className="detail-grid">
                  <div className="detail-card">
                    <div className="detail-card-title">⚠️ Known Allergies</div>
                    {selectedChild.allergies && selectedChild.allergies.length > 0 ? selectedChild.allergies.map((a, i) => (
                      <div className="allergy-detail-item" key={i}>
                        <span className="allergy-name">{a.allergy_type || a}</span>
                        {a.severity && <span className={`severity-badge severity-${a.severity.toLowerCase()}`}>{a.severity}</span>}
                      </div>
                    )) : <div className="no-data-message">✅ No known allergies</div>}
                  </div>

                  <div className="detail-card">
                    <div className="detail-card-title">💊 Active Medications</div>
                    {selectedChild.medications && selectedChild.medications.length > 0 ? selectedChild.medications.map((m) => (
                      <div className="med-detail-item" key={m.id}>
                        <h4>{m.medicine_name}</h4>
                        <p>Dosage: {m.dosage || "Not specified"}</p>
                        <p>Schedule: {m.schedule || "As needed"}</p>
                      </div>
                    )) : <div className="no-data-message">No active medications</div>}
                  </div>

                  {selectedChild.ai_summary && (
                    <div className="detail-card full-width ai-summary-card">
                      <div className="detail-card-title">🤖 AI Safety Summary (Gemini)</div>
                      <div className="ai-summary-text">{selectedChild.ai_summary.summary}</div>
                      {selectedChild.ai_summary.meal_suggestion && (
                        <div className="ai-meal-suggestion">
                          <span>🥗</span>
                          <div><strong>Recommended Safe Meal: </strong>{selectedChild.ai_summary.meal_suggestion}</div>
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
                          {attendance.map(a => (
                            <tr key={a.id}>
                              <td>{a.date}</td>
                              <td>
                                <span className={`badge ${a.status === "Present" ? "badge-normal" : "badge-high-risk"}`}>
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
                  ) : <div className="no-data-message">No attendance logged yet</div>}
                </div>
              )}

              {activeTab === "meals" && (
                <div className="detail-card full-width">
                  <div className="detail-card-title">🍽️ Meal Safety Checklists</div>
                  {selectedChild.meal_safety && selectedChild.meal_safety.length > 0 ? (
                    <div className="meal-safety-grid">
                      {selectedChild.meal_safety.map((meal, index) => (
                        <div key={index} className={`meal-safety-item ${meal.status === "SAFE" ? "safe" : "restricted"}`}>
                          <div className="meal-name">{meal.status === "SAFE" ? "✅" : "🚫"} {meal.meal_name}</div>
                          <div className="meal-category">{meal.meal_category}</div>
                          <div className="meal-status">{meal.status}</div>
                          {meal.matched_allergens && meal.matched_allergens.length > 0 && (
                            <div className="meal-allergen-match">
                              ⚠️ Contains: {meal.matched_allergens.map((m) => `${m.matched_ingredient} (${m.allergy})`).join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <div className="no-data-message">No meal data available</div>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default App;
