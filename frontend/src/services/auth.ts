// src/services/auth.ts
const API_URL = "https://todoapprroll.onrender.com/api";

export async function loginUser(username: string, password: string) {
  console.log("🔹 Enviando login a:", `${API_URL}/auth/login`);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 🔑 importante para CORS + cookies
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.message || `Error de autenticación (${response.status})`;
      throw new Error(message);
    }

    const data = await response.json();
    console.log("✅ Login correcto:", data);
    return data; // { accessToken, refreshToken, ... }

  } catch (err: any) {
    console.error("❌ Error en loginUser:", err);
    throw new Error(
      err.message || "Error de red o problema de conexión con el servidor."
    );
  }
}

export function logoutUser() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  window.location.href = "/login";
}

export function getToken() {
  return localStorage.getItem("accessToken");
}
