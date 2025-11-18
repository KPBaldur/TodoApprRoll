import React from "react";
import type { Alarm } from "../../services/alarmService";
import AlarmToggle from "./AlarmToggle";
import AudioPreviewPlayer from "./AudioPreviewPlayer";
import { getNextRunFromCron } from "../../utils/cron";

type Props = {
  alarms: Alarm[];
  onEdit: (alarm: Alarm) => void;
  onDelete: (alarm: Alarm) => void;
  onToggle: (alarm: Alarm) => void;
};

export default function AlarmList({ alarms, onEdit, onDelete, onToggle }: Props) {
  if (!alarms.length) {
    return <p className="text-sm text-gray-300">No hay alarmas creadas.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {alarms.map((a) => {
        const isCron = !!a.cronExpr;
        const nextRun = isCron
          ? getNextRunFromCron(a.cronExpr!)
          : a.scheduleAt
          ? new Date(a.scheduleAt)
          : null;

        return (
          <div
            key={a.id}
            className={`p-4 rounded-lg border shadow-sm bg-slate-800/60 text-slate-100 ${
              a.enabled ? "border-green-500" : "border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                {isCron ? "🔁" : "⏰"} {a.name}
              </h4>
              <AlarmToggle enabled={a.enabled} onToggle={() => onToggle(a)} />
            </div>

            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="px-2 py-0.5 rounded bg-slate-700">
                {isCron ? "CRON" : "PROGRAMADA"}
              </span>
              {nextRun ? (
                <span className="text-slate-300">
                  Próxima: {nextRun.toLocaleString()}
                </span>
              ) : (
                <span className="text-slate-400">Sin próxima ejecución</span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span>🔊</span>
                <span className="text-sm">{a.audio?.name ?? "Sin audio"}</span>
                <AudioPreviewPlayer url={a.audio?.url} />
              </div>
              <div className="flex items-center gap-2">
                <span>🖼️</span>
                <span className="text-sm">{a.image?.name ?? "Sin imagen"}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(a)}
                className="px-3 py-1 rounded bg-blue-600 text-white hover:opacity-90"
                title="Editar"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDelete(a)}
                className="px-3 py-1 rounded bg-red-600 text-white hover:opacity-90"
                title="Eliminar"
              >
                Eliminar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}