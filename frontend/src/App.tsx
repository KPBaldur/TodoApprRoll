import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./services/auth";

// Paginas
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

// Estilos especificos del proyecto
import "./styles/login.css";
import "./styles/header.css";
import "./styles/sidebar.css";
import "./styles/dashboard.css";

// Componente para proteger rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
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
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
