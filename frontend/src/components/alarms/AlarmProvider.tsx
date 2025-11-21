import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

import AlarmModal from "./AlarmModal";
import AlarmTriggerContent from "./AlarmTriggerContent";
import type { Alarm } from "../../services/alarmService";

type AlarmContextType = {
  /** Llamado por cualquier módulo para mostrar el popup */
  triggerAlarmPopup: (alarm: Alarm) => void;

  /** Para cerrar popup manualmente */
  closeAlarmPopup: () => void;

  /** Sistema de cola usado por el scheduler */
  enqueueAlarmTrigger: (alarm: Alarm) => void;
};

const AlarmContext = createContext<AlarmContextType | null>(null);

export const useAlarmPopup = () => {
  const ctx = useContext(AlarmContext);
  if (!ctx)
    throw new Error("useAlarmPopup debe usarse dentro de un <AlarmProvider>");
  return ctx;
};

function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [currentAlarm, setCurrentAlarm] = useState<Alarm | null>(null);

  /** Cola de alarmas pendientes (por si se disparan varias en poco tiempo) */
  const queueRef = useRef<Alarm[]>([]);

  /** Evita abrir otro popup si ya hay uno */
  const isOpenRef = useRef(false);

  /** Maneja el “siguiente” de la cola */
  const processQueue = useCallback(() => {
    if (isOpenRef.current) return; // si el popup está abierto, no abrir otro

    const next = queueRef.current.shift();
    if (!next) return;

    setCurrentAlarm(next);
    setOpen(true);
    isOpenRef.current = true;
  }, []);

  /** Encolado seguro para alarmas programadas */
  const enqueueAlarmTrigger = useCallback(
    (alarm: Alarm) => {
      queueRef.current.push(alarm);
      processQueue();
    },
    [processQueue]
  );

  /** Trigger explícito desde botones (Probar alarma) */
  const triggerAlarmPopup = useCallback(
    (alarm: Alarm) => {
      enqueueAlarmTrigger(alarm);
    },
    [enqueueAlarmTrigger]
  );

  /** Cerrar el popup */
  const closeAlarmPopup = useCallback(() => {
    setOpen(false);
    setCurrentAlarm(null);
    isOpenRef.current = false;

    // Ver si hay siguientes en cola
    processQueue();
  }, [processQueue]);

  /** Cleanup general por si se desmonta el componente */
  useEffect(() => {
    return () => {
      queueRef.current = [];
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

      <AlarmModal
        open={open}
        onClose={closeAlarmPopup}
        title={currentAlarm?.name ?? "Alarma"}
      >
        {currentAlarm && (
          <AlarmTriggerContent alarm={currentAlarm} onClose={closeAlarmPopup} />
        )}
      </AlarmModal>
    </AlarmContext.Provider>
  );

  // Suscripción SSE global: convierte el payload del servidor a un objeto Alarm mínimo y lo encola
  useAlarmEvents((payload) => {
    try {
      const { id, name, audioUrl } = payload || {};
      if (!id || !name) return;
  
      const alarmFromServer: Alarm = {
        id,
        name,
        enabled: true,
        scheduleAt: null,
        snoozeMins: 5,
        audioId: null,
        imageId: null,
        audio: audioUrl ? { id: "event-audio", name: "Audio de alarma", url: audioUrl } : null,
        image: null,
      };
  
      enqueueAlarmTrigger(alarmFromServer);
    } catch (err) {
      console.error("Error procesando evento de alarma:", err);
    }
  });
}

export default AlarmProvider;
