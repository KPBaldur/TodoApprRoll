// src/pages/AlarmsPage.tsx
import { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAlarms } from "../hooks/useAlarms";
import AlarmList from "../components/alarms/AlarmList";
import AlarmModal from "../components/alarms/AlarmModal";
import AlarmForm from "../components/alarms/AlarmForm";
import { useAlarmPopup } from "../components/alarms/AlarmProvider";
import type { Alarm, AlarmCreatePayload, AlarmUpdatePayload } from "../services/alarmService";
import "../styles/dashboard.css";

export default function AlarmsPage() {
  const { alarms, media, loading, error, refresh, create, update, toggle, remove } = useAlarms();

  const { triggerAlarmPopup } = useAlarmPopup();  // NUEVO

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Alarm | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => ({
    pending: 0,
    inProgress: 0,
    completed: 0,
    archived: 0,
    activeAlarms: alarms.filter((a) => a.enabled).length,
  }), [alarms]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (alarm: Alarm) => {
    setEditing(alarm);
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const onSubmit = async (payload: AlarmCreatePayload | AlarmUpdatePayload) => {
    if (editing) {
      await update(editing.id, payload as AlarmUpdatePayload);
    } else {
      await create(payload as AlarmCreatePayload);
    }
    setOpen(false);
  };

  const onToggle = async (alarm: Alarm) => {
    await toggle(alarm.id);
  };

  const onDelete = async (alarm: Alarm) => {
    if (!confirm(`¿Eliminar la alarma "${alarm.name}"?`)) return;
    await remove(alarm.id);
  };

  // 👉 Reemplaza el test local por el popup global
  const openTest = (alarm: Alarm) => {
    triggerAlarmPopup(alarm);
  };

  return (
    <div className="dashboard">
      <Sidebar stats={stats} />

      <main className="dashboard-main">
        <Header />

        <div className="work-area">
          <div className="alarms-header-row">
            <h3 className="list-title">Alarmas</h3>

            <button
              type="button"
              onClick={openCreate}
              className="alarm-new-btn"
            >
              + Nueva Alarma
            </button>
          </div>

          {loading ? <p className="muted">Cargando…</p> : null}
          {error ? <p className="error">{error}</p> : null}

          {!loading && !error && alarms.length === 0 && (
            <div className="alarms-empty-grid">
              <div className="alarms-empty-card">
                <h4>No hay alarmas creadas</h4>
                <p>Usa el botón “Nueva Alarma” para empezar</p>
              </div>
              <div className="alarms-empty-card">
                <h4>No hay alarmas activas</h4>
                <p>Activa una alarma para verla aquí</p>
              </div>
            </div>
          )}

          {alarms.length > 0 && (
            <AlarmList
              alarms={alarms}
              onEdit={openEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              onTest={openTest}
            />
          )}

          <AlarmModal
            open={open}
            title={editing ? "Editar alarma" : "Crear alarma"}
            onClose={closeModal}
          >
            <AlarmForm
              initial={editing ?? null}
              media={media}
              onSubmit={onSubmit}
              onCancel={closeModal}
            />
          </AlarmModal>
        </div>
      </main>
    </div>
  );
}
