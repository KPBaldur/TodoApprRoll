import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

import { getAlarms, type Alarm } from "../../services/alarmService";
import { updateAlarm, toggleAlarm } from "../../services/alarmService";
import { getToken, refreshAccessToken } from "../../services/auth";

type AlarmContextType = {
  triggerAlarmPopup: (alarm: Alarm) => void;
  closeAlarmPopup: () => void;
  enqueueAlarmTrigger: (alarm: Alarm) => void;
};

const AlarmContext = createContext<AlarmContextType | null>(null);

export const useAlarmPopup = () => {
  const ctx = useContext(AlarmContext);
  if (!ctx) {
    // Return dummy functions if context is missing or disabled
    return {
      triggerAlarmPopup: () => { },
      closeAlarmPopup: () => { },
      enqueueAlarmTrigger: () => { },
    };
  }
  return ctx;
};

function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [currentAlarm, setCurrentAlarm] = useState<Alarm | null>(null);
  const [queue, setQueue] = useState<Alarm[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const triggerAlarmPopup = useCallback((alarm: Alarm) => {
    setCurrentAlarm(alarm);

    // Reproducir audio automáticamente si existe
    if (alarm.audio?.url) {
      // Detener audio anterior si existe
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

      const audio = new Audio(alarm.audio.url);
      audioRef.current = audio;
      audio.loop = true; // Loop until user acts

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name === "AbortError") {
            console.log("ℹ️ [AUDIO] Reproducción interrumpida (usuario detuvo alarma).");
          } else {
            console.error("❌ [AUDIO] Error de reproducción:", err);
          }
        });
      }
    }
  }, []);

  const closeAlarmPopup = useCallback(() => {
    // Stop audio robustamente
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ""; // Liberar recurso
      audioRef.current = null;
    }

    setCurrentAlarm(null);

    // Process queue
    setQueue((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        setTimeout(() => triggerAlarmPopup(next), 500); // Pequeño delay para evitar conflictos de audio
        return rest;
      }
      return prev;
    });
  }, [triggerAlarmPopup]);

  const enqueueAlarmTrigger = useCallback((alarm: Alarm) => {
    setQueue((prev) => {
      // Evitar duplicados en la cola
      if (prev.some(a => a.id === alarm.id)) {
        console.log("⚠️ [POPUP] Alarma ya en cola, ignorando duplicado:", alarm.name);
        return prev;
      }
      return [...prev, alarm];
    });
  }, []);

  const handlePostpone = async () => {
    if (!currentAlarm) return;

    try {
      // Validar snoozeMins
      const snooze = Number(currentAlarm.snoozeMins) || 5; // Default 5 min si falla
      console.log(`⏸️ Posponiendo alarma '${currentAlarm.name}' por ${snooze} minutos`);

      // Postpone: set next alarm time based on snoozeMins
      const nextTime = new Date(Date.now() + snooze * 60000);

      if (isNaN(nextTime.getTime())) {
        throw new Error("Fecha calculada inválida");
      }

      await updateAlarm(currentAlarm.id, {
        scheduleAt: nextTime.toISOString(),
      });
      closeAlarmPopup();
    } catch (error) {
      console.error("Error postponing alarm:", error);
      alert("No se pudo postponer la alarma");
    }
  };

  const handleStop = async () => {
    if (!currentAlarm) return;

    try {
      console.log(`⏹️ Deteniendo alarma '${currentAlarm.name}'`);
      // Stop: deactivate the alarm
      await toggleAlarm(currentAlarm.id);
      closeAlarmPopup();
    } catch (error) {
      console.error("Error stopping alarm:", error);
      alert("No se pudo detener la alarma");
    }
  };

  // SSE Connection Logic
  useEffect(() => {
    const backend = import.meta.env.VITE_BACKEND_URL || "https://todoapprroll.onrender.com";
    let es: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectSSE = async () => {
      // Si ya hay conexión activa, no hacer nada
      if (es && es.readyState !== EventSource.CLOSED) return;

      const token = getToken();
      if (!token) {
        console.log("⏳ [SSE] Esperando autenticación...");
        return;
      }

      const url = `${backend}/api/alarms/events?token=${encodeURIComponent(token)}`;
      console.log("🔌 [SSE] Conectando...");

      es = new EventSource(url);

      es.onopen = () => {
        console.log("🟢 [SSE] Conexión establecida");
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id) {
            console.log("🔍 [SSE] Evento recibido, buscando detalles:", data.id);

            // Usar getAlarms del servicio para asegurar el mapeo correcto de datos
            getAlarms()
              .then((alarms: Alarm[]) => {
                const alarm = alarms.find((a: Alarm) => a.id === data.id);

                if (alarm) {
                  console.log(`🔔 [POPUP] Alarma encontrada: ${alarm.name} (Snooze: ${alarm.snoozeMins}m)`);

                  setCurrentAlarm((prev) => {
                    // 1. Si la alarma YA está sonando, ignorar este evento
                    if (prev && prev.id === alarm.id) {
                      console.log("⚠️ [POPUP] La alarma ya está activa, ignorando duplicado.");
                      return prev;
                    }

                    // 2. Si hay OTRA alarma sonando, encolar (pero evitar duplicados en cola)
                    if (prev) {
                      setQueue((q) => {
                        if (q.some(a => a.id === alarm.id)) {
                          console.log("⚠️ [POPUP] Alarma ya en cola, ignorando.");
                          return q;
                        }
                        console.log("📥 [POPUP] Encolando alarma:", alarm.name);
                        return [...q, alarm];
                      });
                      return prev;
                    }

                    // 3. Reproducir audio de forma segura
                    if (alarm.audio?.url) {
                      // Detener anterior si existe
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.src = "";
                        audioRef.current = null;
                      }

                      console.log("🔊 [AUDIO] Iniciando reproducción:", alarm.audio.url);
                      const audio = new Audio(alarm.audio.url);
                      audioRef.current = audio;
                      audio.loop = true;

                      const playPromise = audio.play();
                      if (playPromise !== undefined) {
                        playPromise.catch((error) => {
                          if (error.name === "AbortError") {
                            console.log("ℹ️ [AUDIO] Reproducción interrumpida (usuario detuvo alarma).");
                          } else {
                            console.error("❌ [AUDIO] Error de reproducción:", error);
                          }
                        });
                      }
                    } else {
                      console.log("🔇 [AUDIO] Alarma sin audio configurado");
                    }

                    return alarm;
                  });
                } else {
                  console.warn("⚠️ [POPUP] Alarma ID no encontrada en la lista del usuario:", data.id);
                }
              })
              .catch((err) => console.error("❌ [API] Error fetching alarm details:", err));
          }
        } catch (e) {
          console.error("❌ [SSE] Error procesando evento:", e);
        }
      };

      es.onerror = async (err) => {
        console.error("❌ [SSE] Error en conexión. Intentando recuperar...");
        es?.close();
        es = null;

        // Intentar renovar token por si expiró (causa común de error 401 en SSE)
        const newToken = await refreshAccessToken();
        if (newToken) {
          console.log("🔄 [SSE] Token renovado, reconectando en 1s...");
          reconnectTimeout = setTimeout(connectSSE, 1000);
        } else {
          console.log("⚠️ [SSE] No se pudo renovar token. Esperando login...");
        }
      };
    };

    // Intentar conectar inicial
    connectSSE();

    // Polling para detectar login (si no hay conexión)
    const checkInterval = setInterval(() => {
      if (!es && getToken()) {
        console.log("🔐 Token detectado, reconectando SSE...");
        connectSSE();
      }
    }, 3000);

    return () => {
      es?.close();
      clearInterval(checkInterval);
      clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <AlarmContext.Provider
      value={{
        triggerAlarmPopup,
        closeAlarmPopup,
        enqueueAlarmTrigger,
      }}
    >
      {children}

      {/* Alarm Popup Modal */}
      {currentAlarm && (
        <div
          className="alarm-popup-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Don't close on overlay click - user must choose action
            }
          }}
        >
          <div className="alarm-popup">
            <div className="alarm-popup-header">
              <h2 className="alarm-popup-title">⏰ {currentAlarm.name}</h2>
            </div>

            <div className="alarm-popup-body">
              {currentAlarm.image?.url ? (
                <img
                  src={currentAlarm.image.url}
                  alt={currentAlarm.name}
                  className="alarm-popup-image"
                />
              ) : (
                <div className="alarm-popup-icon">⏰</div>
              )}

              <p className="alarm-popup-text">
                {currentAlarm.snoozeMins > 0
                  ? `Se repetirá cada ${currentAlarm.snoozeMins} minutos`
                  : "Alarma activada"}
              </p>
            </div>

            <div className="alarm-popup-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePostpone}
              >
                ⏸️ Postponer ({currentAlarm.snoozeMins} min)
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleStop}
              >
                ⏹️ Detener
              </button>
            </div>
          </div>
        </div>
      )}
    </AlarmContext.Provider>
  );
}

export default AlarmProvider;
