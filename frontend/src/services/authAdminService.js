// 📦 src/services/authAdminService.js
import api from "./api";

export const loginAdmin = async ({ email, password }) => {
  console.log("🛰️ Sending admin login request to:", api.defaults.baseURL + "/admin/login");
  console.log("� Request data:", { 
    email,
    password: password ? "********" : "empty",
    passwordLength: password ? password.length : 0
  });

  try {
    const res = await api.post("/admin/login", { 
      email: email.trim(),
      password: password
    });
    console.log("✅ Login successful, response:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Login failed:", {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });
    throw error;
  }
};
