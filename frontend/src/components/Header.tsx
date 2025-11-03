// src/components/Header.tsx
import "./../styles/dashboard.css";

export default function Header() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="app-header">
      <div className="brand">
        <strong>TodoApp Roll v3.0</strong>
      </div>
      <button className="btn btn-primary" onClick={logout}>Cerrar sesión</button>
    </header>
  );
}
