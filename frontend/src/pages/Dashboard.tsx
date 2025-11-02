import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Bienvenido, <span className="user-name">BaldurDev</span> TodoApp Roll v3.0</h1>
        <button onClick={handleLogout} className="logout-btn">Cerrar sesión</button>
      </header>

      <section className="dashboard-content">
        <article className="card">
          <h2>Tareas</h2>
          <p>Aquí se mostrarán tus tareas.</p>
        </article>

        <article className="card">
          <h2>Alarmas</h2>
          <p>Gestión de alarmas activas y próximas.</p>
        </article>

        <article className="card">
          <h2>Multimedia</h2>
          <p>Sube y gestiona tus archivos multimedia.</p>
        </article>

        <article className="card">
          <h2>Perfil</h2>
          <p>Información de usuario y configuración.</p>
        </article>
      </section>
    </main>
  );
}