import { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import MediaDashboard from "../components/media/MediaDashboard";
import { fetchTasks } from "../services/tasks";
import type { Task } from "../services/tasks";
import "../styles/dashboard.css";

export default function MediaPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  // Cargar todas las tareas para estadísticas
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await fetchTasks({ status: "all" });
        setAllTasks(data);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
        setAllTasks([]);
      }
    };
    loadTasks();
  }, []);

  // Calcular estadísticas (igual que en Dashboard)
  const stats = useMemo(() => {
    const toK = (s: string) => s.toLowerCase();
    // Filtrar tareas NO archivadas para el resumen de estados activos
    const activeTasks = allTasks.filter((t) => toK(String(t.status)) !== "archived");

    return {
      pending: activeTasks.filter((t) => toK(String(t.status)) === "pending").length,
      inProgress: activeTasks.filter((t) => toK(String(t.status)) === "in_progress")
        .length,
      // Completadas incluye las que están en 'completed' Y las 'archived'
      completed: allTasks.filter((t) => {
        const s = toK(String(t.status));
        return s === "completed" || s === "archived";
      }).length,
      archived: allTasks.filter((t) => toK(String(t.status)) === "archived").length,
    };
  }, [allTasks]);

  return (
    <div className="dashboard">
      <Sidebar stats={stats} />
      <main className="dashboard-main">
        <Header />
        <div className="work-area">
          <h3 className="list-title">Administrador Multimedia</h3>
          <MediaDashboard />
        </div>
      </main>
    </div>
  );
}