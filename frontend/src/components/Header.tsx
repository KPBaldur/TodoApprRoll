import "../styles/header.css";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Limpia los tokens guardados en el navegador
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    sessionStorage.clear();

    // Redirige al login
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-header">
      <h1 className="app-title">TodoApp Roll v3.0</h1>
      <button className="logout-btn" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </header>
  );
}