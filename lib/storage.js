/* =========================================================================
   FILE: lib/storage.js
   Simple file-based storage for Vercel serverless functions
   ========================================================================= */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const STORAGE_DIR = "/tmp";
const REGISTRATIONS_FILE = join(STORAGE_DIR, "registrations.json");
const SETTINGS_FILE = join(STORAGE_DIR, "booth-settings.json");

// Helper functions
function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000 / 60);

  if (diff < 1) return "now";
  if (diff === 1) return "1 min ago";
  if (diff < 60) return `${diff} mins ago`;
  if (diff < 120) return "1 hour ago";
  const hours = Math.floor(diff / 60);
  return `${hours} hours ago`;
}

function calculateStats(registrations) {
  const now = new Date();
  const today = now.toDateString();

  const todayRegistrations = registrations.filter(
    (r) => new Date(r.timestamp).toDateString() === today
  );

  const pending = registrations.filter((r) => r.status === "pending");
  const completed = registrations.filter((r) => r.status === "completed");

  return {
    pending: pending.length,
    today: todayRegistrations.length,
    revenue: completed.length * 20,
    total: registrations.length,
    completionRate:
      registrations.length > 0
        ? Math.round((completed.length / registrations.length) * 100)
        : 0,
  };
}

// Storage functions
function loadRegistrations() {
  try {
    if (existsSync(REGISTRATIONS_FILE)) {
      const data = readFileSync(REGISTRATIONS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading registrations:", error);
  }
  return [];
}

function saveRegistrations(registrations) {
  try {
    writeFileSync(REGISTRATIONS_FILE, JSON.stringify(registrations, null, 2));
    console.log(`💾 Saved ${registrations.length} registrations to storage`);
  } catch (error) {
    console.error("Error saving registrations:", error);
  }
}

function loadBoothSettings() {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const data = readFileSync(SETTINGS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading booth settings:", error);
  }
  return {
    location: "Rothschild Boulevard",
    status: "active",
    openTime: new Date().toISOString(),
    dailyGoal: 100,
  };
}

function saveBoothSettings(settings) {
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error saving booth settings:", error);
  }
}

// API functions
export function addRegistration(data) {
  const registrations = loadRegistrations();
  const newRegistration = {
    id: generateId(),
    name: data.name,
    email: data.email,
    language: data.language || "en",
    timestamp: data.timestamp || new Date().toISOString(),
    status: "pending",
    source: data.source || "manual",
  };

  registrations.unshift(newRegistration);
  saveRegistrations(registrations);

  console.log(`📝 New registration: ${data.name} (${data.email})`);
  return newRegistration;
}

export function getAllData() {
  const registrations = loadRegistrations();
  const boothSettings = loadBoothSettings();
  const stats = calculateStats(registrations);

  const enrichedRegistrations = registrations.map((reg) => ({
    ...reg,
    timeAgo: timeAgo(reg.timestamp),
  }));

  return {
    registrations: enrichedRegistrations,
    stats,
    boothSettings,
    lastUpdated: new Date().toISOString(),
  };
}

export function updateRegistration(id, updates) {
  const registrations = loadRegistrations();
  const registrationIndex = registrations.findIndex((r) => r.id === id);

  if (registrationIndex === -1) {
    throw new Error("Registration not found");
  }

  registrations[registrationIndex] = {
    ...registrations[registrationIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveRegistrations(registrations);

  console.log(
    `✅ Registration updated: ${registrations[registrationIndex].name} -> ${updates.status}`
  );

  return registrations[registrationIndex];
}

export function removeRegistration(id) {
  const registrations = loadRegistrations();
  const initialLength = registrations.length;
  const removedReg = registrations.find((r) => r.id === id);
  const filteredRegistrations = registrations.filter((r) => r.id !== id);

  if (filteredRegistrations.length === initialLength) {
    throw new Error("Registration not found");
  }

  saveRegistrations(filteredRegistrations);

  console.log(
    `🗑️ Registration removed: ${removedReg?.name} (${removedReg?.email})`
  );

  return removedReg;
}

export function updateBoothSettings(settings) {
  const currentSettings = loadBoothSettings();
  const newSettings = { ...currentSettings, ...settings };
  saveBoothSettings(newSettings);
  return newSettings;
}
