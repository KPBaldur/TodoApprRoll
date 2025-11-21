// frontend/src/components/alarms/AlarmTriggerContent.tsx
// Popup de disparo de Pomodoro con aplazos

/*import React, { useEffect, useRef, useState } from "react";*/
import type { Alarm } from "../../services/alarmService";
import { updateAlarm } from "../../services/alarmService";

type Props = {
  alarm: Alarm;
  onClose?: () => void; // opcional, para usarlo tanto en Provider como en "Probar"
};

export default function AlarmTriggerContent({ alarm, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup del audio al desmontar o cambiar de alarma
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
      }
      audioRef.current = null;
      setPlaying(false);
    };
  }, [alarm]);

  const play = () => {
    if (!alarm.audio?.url) return;

    try {
      const audio = new Audio(alarm.audio.url);
      audioRef.current = audio;

      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false);
          alert("No se pudo reproducir el audio.");
        });

      audio.onended = () => setPlaying(false);
    } catch {
      alert("Error al reproducir audio.");
    }
  };

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
      setPlaying(false);
    }
  };

  /**
   * Aplazar Pomodoro N minutos.
   * No se toca snoozeMins, sólo scheduleAt → el backend mantiene el ciclo.
   */
  const scheduleIn = async (minutes: number) => {
    setLoadingAction(true);
    setError(null);

    try {
      const next = new Date(Date.now() + minutes * 60000).toISOString();

      await updateAlarm(alarm.id, {
        scheduleAt: next,
        enabled: true,
      });

      stop();
      setLoadingAction(false);
      if (onClose) onClose();
    } catch (e: any) {
      setLoadingAction(false);
      setError(e.message || "Error al aplazar");
    }
  };

  /**
   * Detener temporizador Pomodoro (deshabilitar).
   */
  const stopPomodoro = async () => {
    setLoadingAction(true);
    setError(null);

    try {
      await updateAlarm(alarm.id, {
        enabled: false,
        scheduleAt: null,
      });

      stop();
      setLoadingAction(false);
      if (onClose) onClose();
    } catch (e: any) {
      setLoadingAction(false);
      setError(e.message || "Error al detener");
    }
  };

  const baseSnooze = alarm.snoozeMins || 5;

  return (
    <div className="alarm-trigger-body" style={{ display: "grid", gap: 18 }}>
      {/* Imagen */}
      <div className="image-preview-card" style={{ minHeight: 240 }}>
        {alarm.image?.url ? (
          <img src={alarm.image.url} alt={alarm.image.name ?? "Imagen"} />
        ) : (
          <div style={{ fontSize: 48 }}>⏰</div>
        )}
        <div className="file-name">{alarm.image?.name ?? "Sin imagen"}</div>
      </div>

      {/* Info */}
      <h3 style={{ margin: 0 }}>{alarm.name}</h3>

      <p className="muted" style={{ marginTop: -6 }}>
        {alarm.audio?.name ? `Sonido: ${alarm.audio.name}` : "Sin sonido asignado"}
      </p>

      {/* Reproductor */}
      <div className="audio-preview-actions" style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-green"
          onClick={play}
          disabled={!alarm.audio?.url || playing}
        >
          🔊 Reproducir
        </button>

        <button
          type="button"
          className="btn btn-muted"
          onClick={stop}
          disabled={!playing}
        >
          ⏹️ Detener
        </button>
      </div>

      <hr style={{ borderColor: "rgba(255,255,255,0.15)" }} />

      {/* Acciones Pomodoro */}
      <h4 style={{ margin: "4px 0" }}>Opciones de aplazo</h4>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <button
          className="btn btn-blue"
          disabled={loadingAction}
          onClick={() => scheduleIn(baseSnooze)}
        >
          ⏱️ Próxima ejecución (+{baseSnooze} min)
        </button>

        <button
          className="btn btn-blue"
          disabled={loadingAction}
          onClick={() => scheduleIn(5)}
        >
          +5 min
        </button>

        <button
          className="btn btn-blue"
          disabled={loadingAction}
          onClick={() => scheduleIn(10)}
        >
          +10 min
        </button>

        <button
          className="btn btn-blue"
          disabled={loadingAction}
          onClick={() => scheduleIn(15)}
        >
          +15 min
        </button>
      </div>

      <button
        className="btn btn-red"
        style={{ marginTop: 12 }}
        disabled={loadingAction}
        onClick={stopPomodoro}
      >
        🛑 Detener temporizador
      </button>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
