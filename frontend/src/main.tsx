// Root render (ReactDOM.createRoot(...).render(...))
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AlarmProvider from "./components/alarms/AlarmProvider";

// Estilos base
import "./styles/globalReset.css";
import "./styles/variables.css";

// Render principal
ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AlarmProvider>
        <App />
      </AlarmProvider>
    </BrowserRouter>
  </StrictMode>
);

