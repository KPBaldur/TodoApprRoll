export const API_URL = "https://todoapproll-backend.onrender.com/api";

export async function loginUser(username: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || "Error de autenticación";
    throw new Error(message);
  }

  return response.json(); // { accessToken, refreshToken, ... }
}

export function logoutUser() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export function getToken() {
  return localStorage.getItem("token");
}