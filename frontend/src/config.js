// =============================================================
// FirstCry Intellitots: Child Health & Allergy Tracker
// Shared Frontend Constants
// =============================================================

export const API_BASE = window.location.origin.includes("localhost")
  ? "http://localhost:5000/api"
  : "/api";

export const ALLERGY_OPTIONS = [
  "Peanuts", "Dairy", "Eggs", "Gluten", "Soy",
  "Shellfish", "Tree Nuts", "Fish", "Sesame",
  "Mustard", "Legumes",
];

export const HEALTH_ISSUE_OPTIONS = [
  "Asthma", "Eczema", "Lactose Intolerance", "Celiac Disease",
  "Type 1 Diabetes", "Allergic Rhinitis (Dust/Pollen)", "G6PD Deficiency",
];

export const AVATAR_COLORS = ["avatar-blue", "avatar-amber", "avatar-green", "avatar-purple"];
