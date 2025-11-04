import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "https://todoapproll.onrender.com/api/auth/login",
        { username, password },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );

      // Guardar tokens en localStorage
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("username", username);

      // Redirigir al Dashboard
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err);
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <img src="/logo.svg" alt="TodoAppRoll" className="logo" />
          <h1>TodoAppRoll</h1>
          <p className="subtitle">Mi espacio personal de organización</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="username">Nombre de usuario</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="User name"
            autoFocus
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />

          <button type="submit" className="btn">Ingresar</button>
        </form>

        {error && <p style={{ color: "#f87171", marginTop: "10px" }}>{error}</p>}

        <div className="actions">
          <p>Bienvenido de nuevo, Baldur ✨</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
