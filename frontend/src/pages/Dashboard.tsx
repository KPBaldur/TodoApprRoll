import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TasksPage from "../pages/TasksPage";

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* Menú lateral */}
      <Sidebar />

      {/* Sección principal */}
      <main className="dashboard-main">
        <Header />
        <TasksPage />
        <section className="dashboard-content">
          <h2>Panel principal</h2>
          <p>
            Aquí pronto verás tus tareas, alarmas y recordatorios.
            Este será el centro de control principal de la aplicación.
          </p>
        </section>
      </main>
    </div>
  );
}