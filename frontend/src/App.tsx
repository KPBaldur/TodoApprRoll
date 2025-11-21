import React from "react";
// App component and ProtectedRoute
import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./services/auth";

// Paginas
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AlarmsPage from "./pages/AlarmsPage";
import MediaPage from "./pages/MediaPage";

// Estilos especificos del proyecto
import "./styles/login.css";
import "./styles/header.css";
import "./styles/sidebar.css";
import "./styles/dashboard.css";

// Componente para proteger rutas
function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route 
        path="/dashboard/alarms"
        element={
          <ProtectedRoute>
            <AlarmsPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/alarms" 
        element={
          <ProtectedRoute>
            <AlarmsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/media" 
        element={
          <ProtectedRoute>
            <MediaPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
