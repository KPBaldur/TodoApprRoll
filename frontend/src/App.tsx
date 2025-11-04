import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Paginas
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

// Estilos especificos del proyecto
import "./styles/login.css";
import "./styles/header.css";
import "./styles/sidebar.css";
import "./styles/dashboard.css";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
