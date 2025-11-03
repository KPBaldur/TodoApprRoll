import { NavLink } from "react-router-dom";
import { FaTasks, FaBell, FaImage, FaHistory, FaCog } from "react-icons/fa";
import "../styles/sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="app-title">TodoAppRoll</h2>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/dashboard/tasks" className="menu-item">
          <FaTasks /> Tareas
        </NavLink>
        <NavLink to="/dashboard/alarms" className="menu-item">
          <FaBell /> Alarmas
        </NavLink>
        <NavLink to="/dashboard/media" className="menu-item">
          <FaImage /> Media
        </NavLink>
        <NavLink to="/dashboard/history" className="menu-item">
          <FaHistory /> Historial
        </NavLink>
        <NavLink to="/dashboard/settings" className="menu-item">
          <FaCog /> Configuración
        </NavLink>
      </nav>
    </aside>
  );
}