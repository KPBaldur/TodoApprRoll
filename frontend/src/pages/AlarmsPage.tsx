// src/pages/AlarmsPage.tsx
import { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAlarms } from "../hooks/useAlarms";
import AlarmList from "../components/alarms/AlarmList";
import AlarmModal from "../components/alarms/AlarmModal";
import AlarmForm from "../components/alarms/AlarmForm";
import type { Alarm, AlarmCreatePayload, AlarmUpdatePayload } from "../services/alarmService";
import AlarmTriggerContent from "../components/alarms/AlarmTriggerContent"; // Nuevo
import "../styles/dashboard.css";

export default function AlarmsPage() {
  const { alarms, media, loading, error, refresh, create, update, toggle, remove } = useAlarms();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [testing, setTesting] = useState<Alarm | null>(null); // Nuevo

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    return {
      pending: 0,
      inProgress: 0,
      completed: 0,
      archived: 0,
      activeAlarms: alarms.filter((a) => a.enabled).length,
    };
  }, [alarms]);

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

  const openTest = (alarm: Alarm) => setTesting(alarm); // Nuevo
  const closeTest = () => setTesting(null); // Nuevo

  return (
    <div className="dashboard">
      <Sidebar stats={stats} />
      <main className="dashboard-main">
        <Header />
        <div className="work-area">
          <div className="alarms-header-row">
            <h3 className="list-title">Alarmas</h3>
            {/* Botón a la izquierda según requerimiento */}
            <button
              type="button"
              onClick={openCreate}
              className="alarm-new-btn"
              title="Nueva alarma"
            >
              + Nueva Alarma
            </button>
          </div>

          {loading ? <p className="muted">Cargando…</p> : null}
          {error ? <p className="error">{error}</p> : null}

          {/* Estado vacío con dos tarjetas grandes */}
          {!loading && !error && alarms.length === 0 && (
            <div className="alarms-empty-grid">
              <div className="alarms-empty-card">
                <h4>No hay alarmas Creadas</h4>
                <p>Usa el botón "Nueva Alarma" para empezar</p>
              </div>
              <div className="alarms-empty-card">
                <h4>No hay alarmas Activas</h4>
                <p>Activa una alarma para verla aquí</p>
              </div>
            </div>
          )}

          {/* Lista de alarmas si existen */}
          {alarms.length > 0 && (
            <>
              <AlarmList
                alarms={alarms}
                onEdit={openEdit}
                onDelete={onDelete}
                onToggle={onToggle}
                onTest={openTest} // Nuevo
              />
            </>
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

          {/* Nuevo: Modal para probar alarma */}
          <AlarmModal
            open={!!testing}
            title="Probar alarma"
            onClose={closeTest}
          >
            {testing ? <AlarmTriggerContent alarm={testing} /> : null}
          </AlarmModal>
        </div>
      </main>
    </div>
  );
}