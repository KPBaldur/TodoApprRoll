// src/components/alarms/AlarmList.tsx
import React from "react";
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
    return <p className="text-sm text-gray-300">No hay alarmas creadas.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {alarms.map((a) => {
        // Próxima ejecución real
        const nextRun = a.scheduleAt
          ? new Date(a.scheduleAt)
          : new Date(Date.now() + (a.snoozeMins ?? 1) * 60000);

        const nextRunStr = nextRun.toLocaleString();

        return (
          <div
            key={a.id}
            className={`p-4 rounded-lg border shadow-sm bg-slate-800/60 text-slate-100 ${
              a.enabled ? "border-green-500" : "border-slate-600"
            }`}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                ⏳ {a.name}
              </h4>

              <AlarmToggle
                enabled={a.enabled}
                onToggle={() => onToggle(a)}
              />
            </div>

            {/* TAGS */}
            <div className="mt-2 flex flex-col gap-1 text-sm">
              <span className="px-2 py-0.5 w-fit rounded bg-orange-700">
                Pomodoro {a.snoozeMins} min
              </span>

              <span className="text-slate-300">
                Próxima ejecución: {nextRunStr}
              </span>
            </div>

            {/* RESOURCE INFO */}
            <div className="mt-3 flex flex-col gap-2">
              {/* Audio */}
              <div className="flex items-center gap-2">
                <span>🔊</span>
                <span className="text-sm">
                  {a.audio?.name ?? "Sin audio"}
                </span>
                <AudioPreviewPlayer url={a.audio?.url} />
              </div>

              {/* Imagen */}
              <div className="flex items-center gap-2">
                <span>🖼️</span>
                <span className="text-sm">
                  {a.image?.name ?? "Sin imagen"}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(a)}
                className="px-3 py-1 rounded bg-blue-600 text-white hover:opacity-90"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => onDelete(a)}
                className="px-3 py-1 rounded bg-red-600 text-white hover:opacity-90"
              >
                Eliminar
              </button>

              {onTest && (
                <button
                  type="button"
                  onClick={() => onTest(a)}
                  className="px-3 py-1 rounded bg-green-600 text-white hover:opacity-90"
                >
                  Probar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
