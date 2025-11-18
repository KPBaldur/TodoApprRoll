// src/pages/AlarmsPage.tsx
import { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { fetchAlarms, type Alarm } from "../services/alarms";
import "../styles/dashboard.css";

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAlarms()
      .then((list) => {
        if (!mounted) return;
        setAlarms(list);
        setError("");
      })
      .catch((err: any) => {
        console.error("Error al cargar alarmas:", err);
        setError(err?.message || "No se pudieron cargar las alarmas");
      })
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      pending: 0,
      inProgress: 0,
      completed: 0,
      archived: 0,
      activeAlarms: alarms.filter((a) => a.enabled).length,
    };
  }, [alarms]);

  return (
    <div className="dashboard">
      <Sidebar stats={stats} />
      <main className="dashboard-main">
        <Header />
        <div className="work-area">
          <h3 className="list-title">Alarmas</h3>
          {loading ? <p className="muted">Cargando…</p> : null}
          {error ? <p className="error">{error}</p> : null}

          <div className="task-list">
            {alarms.map((alarm) => (
              <div key={alarm.id} className="task-card">
                <div className="task-header">
                  <h4 className="task-title">{alarm.name}</h4>
                  <span
                    className={`badge ${alarm.enabled ? "success" : "muted"}`}
                    title={alarm.enabled ? "Activada" : "Desactivada"}
                  >
                    {alarm.enabled ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div className="task-meta">
                  {alarm.scheduleAt ? (
                    <span>Programada: {new Date(alarm.scheduleAt).toLocaleString()}</span>
                  ) : alarm.cronExpr ? (
                    <span>Cron: {alarm.cronExpr}</span>
                  ) : (
                    <span className="muted">Sin programación</span>
                  )}
                </div>
              </div>
            ))}

            {!loading && !error && alarms.length === 0 && (
              <p className="muted">No hay alarmas registradas.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}