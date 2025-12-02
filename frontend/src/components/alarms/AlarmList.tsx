// src/components/alarms/AlarmList.tsx
import type { Alarm } from "../../services/alarmService";
import AlarmToggle from "./AlarmToggle";
import AudioPreviewPlayer from "./AudioPreviewPlayer";

type Props = {
  alarms: Alarm[];
  onEdit: (alarm: Alarm) => void;
  onDelete: (alarm: Alarm) => void;
  onToggle: (alarm: Alarm) => void;
  onTest?: (alarm: Alarm) => void;
};

export default function AlarmList({
  alarms,
  onEdit,
  onDelete,
  onToggle,
  onTest,
}: Props) {
  if (!alarms.length) {
    return (
      <div className="alarms-empty-card">
        <h4>No hay alarmas creadas</h4>
        <p>Crea tu primera alarma para empezar a gestionar tu tiempo.</p>
      </div>
    );
  }

  return (
    <div className="alarms-grid">
      {alarms.map((a) => {
        // Próxima ejecución real
        const nextRun = a.scheduleAt
          ? new Date(a.scheduleAt)
          : new Date(Date.now() + (a.snoozeMins ?? 1) * 60000);

        const nextRunStr = nextRun.toLocaleString([], {
          dateStyle: 'short',
          timeStyle: 'short'
        });

        return (
          <div
            key={a.id}
            className={`alarm-card ${a.enabled ? "active" : "inactive"}`}
          >
            {/* IMAGE PREVIEW BANNER */}
            <div className="alarm-card-image">
              {a.image?.url ? (
                <img src={a.image.url} alt={a.name} loading="lazy" />
              ) : (
                <div className="alarm-card-image-placeholder">
                  <span>⏰</span>
                </div>
              )}
              <div className="alarm-card-overlay">
                <span className="alarm-type-badge">
                  Pomodoro {a.snoozeMins} min
                </span>
              </div>
            </div>

            <div className="alarm-card-content">
              {/* HEADER */}
              <div className="alarm-card-header">
                <h4 className="alarm-title" title={a.name}>
                  {a.name}
                </h4>
                <AlarmToggle
                  enabled={a.enabled}
                  onToggle={() => onToggle(a)}
                />
              </div>

              {/* INFO */}
              <div className="alarm-info-row">
                <span className="info-label">Próxima:</span>
                <span className="info-value">{nextRunStr}</span>
              </div>

              {/* RESOURCES */}
              <div className="alarm-resources">
                <div className="resource-item">
                  <span className="resource-icon">🔊</span>
                  <span className="resource-name text-truncate">
                    {a.audio?.name ?? "Sin audio"}
                  </span>
                  {a.audio?.url && (
                    <div className="mini-player-wrapper">
                      <AudioPreviewPlayer url={a.audio.url} />
                    </div>
                  )}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="alarm-card-actions">
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className="btn-icon edit"
                  title="Editar"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(a)}
                  className="btn-icon delete"
                  title="Eliminar"
                >
                  🗑️
                </button>

                {onTest && (
                  <button
                    type="button"
                    onClick={() => onTest(a)}
                    className="btn-icon test"
                    title="Probar Alarma"
                  >
                    ▶️
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
