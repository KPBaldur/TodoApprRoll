// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import "../styles/dashboard.css";

type Stats = {
  pending: number;
  inProgress: number;
  completed: number;
  archived: number;
  activeAlarms?: number;
};

export default function Sidebar({ stats }: { stats?: Stats }) {
  return (
    <aside className="sidebar">
      {/* Usar las clases de estilo definidas en sidebar.css */}
      <nav className="sidebar-menu">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
        >
          Tareas
        </NavLink>
        {/* <NavLink
          to="/alarms"
          className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
        >
          Alarmas
        </NavLink> */}
        <NavLink
          to="/media"
          className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
        >
          Multimedia
        </NavLink>
        {/* <NavLink
          to="/history"
          className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
        >
          Historial
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}
        >
          Configuración
        </NavLink> */}
      </nav>

      <div className="sidebar-meta">
        <h4 className="sidebar-meta-title">Estados</h4>
        <ul className="state-list">
          <li>Pendientes <span>{stats?.pending ?? 0}</span></li>
          <li>En curso <span>{stats?.inProgress ?? 0}</span></li>
          <li>Completadas <span>{stats?.completed ?? 0}</span></li>
          <li>Archivadas <span>{stats?.archived ?? 0}</span></li>
        </ul>

        {/* <div className="alarm-mini">
          <div className="alarm-dot" />
          <div>
            <div className="alarm-title">Alarmas activas</div>
            <div className="alarm-count">{stats?.activeAlarms ?? 0}</div>
          </div>
        </div> */}
      </div>
    </aside>
  );
}
