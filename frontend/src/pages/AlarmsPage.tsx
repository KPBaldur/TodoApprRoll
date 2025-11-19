// src/pages/AlarmsPage.tsx
import { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAlarms } from "../hooks/useAlarms";
import AlarmList from "../components/alarms/AlarmList";
import AlarmModal from "../components/alarms/AlarmModal";
import AlarmForm from "../components/alarms/AlarmForm";
import type { Alarm, AlarmCreatePayload, AlarmUpdatePayload } from "../services/alarmService";
import "../styles/dashboard.css";

export default function AlarmsPage() {
  const { alarms, media, loading, error, refresh, create, update, toggle, remove } = useAlarms();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Alarm | null>(null);

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

  return (
    <div className="dashboard">
      <Sidebar stats={stats} />
      <main className="dashboard-main">
        <Header />
        <div className="work-area">
          <div className="flex items-center justify-between">
            <h3 className="list-title">Alarmas</h3>
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 rounded bg-green-600 text-white hover:opacity-90"
              title="Nueva alarma"
            >
              + Nueva alarma
            </button>
          </div>

          {loading ? <p className="muted">Cargando…</p> : null}
          {error ? <p className="error">{error}</p> : null}

          <AlarmList
            alarms={alarms}
            onEdit={openEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />

          {!loading && !error && alarms.length === 0 && (
            <p className="muted">No hay alarmas registradas.</p>
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