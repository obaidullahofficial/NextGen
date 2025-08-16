const API_URL = "http://localhost:5000/api";

// 🔹 Helper: validate and decode token
function getValidToken() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found in localStorage");
    throw new Error("No authentication token found. Please log in again.");
  }

  // Basic format validation
  if (!token.includes(".") || token.split(".").length !== 3) {
    console.error("Invalid token format");
    localStorage.removeItem("token");
    throw new Error("Invalid token format. Please log in again.");
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    console.log("Token validation (CLIENT-SIDE CHECK DISABLED):", {
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : "Never",
      now: new Date(currentTime * 1000).toISOString(),
    });

    // 🚨 Expiry check disabled (server handles validation)
  } catch (err) {
    console.error("Error decoding token:", err);
    localStorage.removeItem("token");
    throw new Error("Invalid token format. Please log in again.");
  }

  return token;
}

// 🔹 Generic request wrapper
async function apiRequest(endpoint, method = "GET", body = null, options = {}) {
  const { auth = false, isFormData = false } = options;

  let headers = {};
  if (auth) {
    headers["Authorization"] = `Bearer ${getValidToken()}`;
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : null,
      credentials: "include",
    });

    const result = await response.json().catch(() => ({}));

    // 🔹 Handle auth errors globally
    if (response.status === 401 || result.msg === "Missing Authorization Header") {
      localStorage.removeItem("token");
      throw new Error("Authentication failed. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(result.error || result.message || `Error: ${response.status}`);
    }

    return result;
  } catch (err) {
    console.error(`[API Error] ${method} ${endpoint}:`, err);
    throw err;
  }
}

//
// 🔹 Public API Functions
//

// Auth & User
export const checkEmail = (email) => apiRequest("/check-email", "POST", { email });
export const signupUser = (data) => apiRequest("/signup", "POST", data);
export const loginUser = (data) => apiRequest("/login", "POST", data);

// Societies
export const societySignup = (data) => apiRequest("/signup-society", "POST", data);
export const getMySociety = () => apiRequest("/my-society", "GET", null, { auth: true });

// Society Profile
export const getSocietyProfile = () => apiRequest("/society-profile", "GET", null, { auth: true });
export const updateSocietyProfile = (data) =>
  apiRequest("/society-profile", "POST", data, {
    auth: true,
    isFormData: data instanceof FormData,
  });
export const checkProfileCompleteness = () =>
  apiRequest("/society-profile/completeness", "GET", null, { auth: true });
export const initializeSocietyProfile = () =>
  apiRequest("/society-profile/initialize", "POST", null, { auth: true });
export const getMissingFields = () =>
  apiRequest("/society-profile/missing-fields", "GET", null, { auth: true });
export const debugSocietyProfile = () =>
  apiRequest("/society-profile/debug", "GET", null, { auth: true });

// Token Testing
export const testTokenValidity = () =>
  apiRequest("/society-profile/simple-test", "POST", { test: "data" }, { auth: true });

// Session Helpers
export function getSessionTimeRemaining() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return 0;

    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    if (payload.exp && payload.exp > currentTime) {
      return Math.round((payload.exp - currentTime) / 60);
    }

    return 0;
  } catch {
    return 0;
  }
}

export function isSessionExpiringSoon() {
  const mins = getSessionTimeRemaining();
  return mins > 0 && mins <= 5;
}
