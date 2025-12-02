import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AlarmProvider from "./components/alarms/AlarmProvider";

// Estilos base
import "./styles/globalReset.css";
import "./styles/variables.css";
import "./styles/alarmPopup.css";

// Render principal
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AlarmProvider>
        <App />
      </AlarmProvider>
    </BrowserRouter>
  </React.StrictMode>
);

