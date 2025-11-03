import { useState } from "react";
import "../styles/login.css";
import { loginUser } from "../services/auth";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginUser(usuario, contrasena);
      if (res) {
        localStorage.setItem("token", res.accessToken);
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Credenciales incorrectas. Intenta nuevamente.");
    }
  };

  return (
    <main className="center">
      <section className="login-card" aria-label="Formulario de inicio de sesión">
        <header className="brand">
          <h1>Inicio de sesión</h1>
          <p className="subtitle">Ingresa tus credenciales</p>
        </header>

        <form className="form" autoComplete="on" onSubmit={handleSubmit}>
          <label htmlFor="usuario">Usuario</label>
          <input
            type="text"
            id="usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder=""
            required
            autoComplete="username"
          />

          <label htmlFor="contrasena">Contraseña</label>
          <input
            type="password"
            id="contrasena"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder=""
            required
            autoComplete="current-password"
          />

          {error && <p style={{ color: "salmon", textAlign: "center" }}>{error}</p>}

          <div className="actions">
            <button className="btn" type="submit">Login</button>
          </div>
        </form>
      </section>
    </main>
  );
}
