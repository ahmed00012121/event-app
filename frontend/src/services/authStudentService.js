import api from "./api";

const handleRequest = async (promise) => {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    throw {
      status: err.response?.status,
      message: err.response?.data?.message || "Something went wrong",
    };
  }
};

export const signupStudent = async (data) => {
  return handleRequest(api.post("/student/signup", data));
};

export const loginStudent = async ({ email, password }) => {
  return handleRequest(api.post("/student/login", { email, password }));
};

export const requestPasswordReset = async ({ email }) => {
  return handleRequest(api.post("/student/forgot-password", { email }));
};

export const resetPassword = async (token, { password }) => {
  return handleRequest(
    api.post(`/student/reset-password/${token}`, { password })
  );
};
