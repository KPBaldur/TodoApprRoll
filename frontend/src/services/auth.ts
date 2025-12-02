// src/services/auth.ts
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://todoapprroll.onrender.com";
const API_URL = `${BACKEND_URL}/api`;

export async function loginUser(username: string, password: string) {
  console.log("🔹 Enviando login a:", `${API_URL}/auth/login`);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.message || `Error de autenticación (${response.status})`;
      throw new Error(message);
    }

    const data = await response.json();
    console.log("✅ Respuesta del backend:", data);

    // El backend devuelve { message, session: { accessToken, refreshToken, ... } }
    const session = data.session || data;
    const accessToken = session.accessToken;
    const refreshToken = session.refreshToken;

    if (!accessToken) {
      console.error("❌ No se recibió accessToken:", data);
      throw new Error("Error: No se recibió token de acceso del servidor");
    }

    // Guardar tokens
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    console.log("✅ Tokens guardados correctamente");

    return {
      accessToken,
      refreshToken,
      user: session.user,
    };

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

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

/**
 * Renueva el access token usando el refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/token/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      logoutUser();
      return null;
    }

    const data = await response.json();
    // El backend devuelve { accessToken, ... } directamente
    const accessToken = data.accessToken || (data.session && data.session.accessToken);

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      return accessToken;
    }

    console.warn("Respuesta de refresh token inesperada:", data);
    return null;
  } catch (error) {
    console.error("Error al renovar token:", error);
    logoutUser();
    return null;
  }
}
