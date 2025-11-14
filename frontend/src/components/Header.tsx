// src/components/Header.tsx
import "./../styles/header.css";

export default function Header() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <strong>TodoApp Roll v3.0</strong>
        </div>
        <button className="header-logout-btn" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
