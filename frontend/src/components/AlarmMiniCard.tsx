// src/components/alarms/AlarmMiniCard.tsx
// import React from "react";
import type { Alarm } from "../services/alarmService";

type Props = {
  alarm: Alarm;
  onToggle?: (alarm: Alarm) => void;
  onClick?: (alarm: Alarm) => void;
  onTest?: (alarm: Alarm) => void;
};

export default function AlarmMiniCard({ alarm, onToggle, onClick, onTest }: Props) {
  // Próxima ejecución Pomodoro
  const nextRun = alarm.scheduleAt
    ? new Date(alarm.scheduleAt)
    : new Date(Date.now() + (alarm.snoozeMins ?? 1) * 60000);

  return (
    <div
      className={`p-3 rounded-lg cursor-pointer bg-slate-800/60 border ${alarm.enabled ? "border-green-500" : "border-slate-600"
        } hover:bg-slate-700/60 transition`}
      onClick={() => onClick?.(alarm)}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-md flex items-center gap-1">
          ⏳ {alarm.name}
        </h4>

        {onToggle && (
          <input
            type="checkbox"
            checked={alarm.enabled}
            onChange={() => onToggle(alarm)}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {/* Próxima ejecución */}
      <div className="text-xs text-slate-300 mt-1">
        Próxima: {nextRun.toLocaleString()}
      </div>

      {/* IMAGE + INFO */}
      <div className="flex items-center gap-2 mt-2">
        {/* IMAGEN MINI */}
        {alarm.image?.url ? (
          <img
            src={alarm.image.url}
            className="w-10 h-10 rounded object-cover border border-slate-600"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center text-xl">
            ⏱️
          </div>
        )}

        {/* INFO */}
        <div className="flex flex-col text-xs text-slate-300">
          <span>Audio: {alarm.audio?.name ?? "Ninguno"}</span>
          <span>Pomodoro: {alarm.snoozeMins} min</span>
        </div>
      </div>

      {/* BOTÓN TEST */}
      {onTest && (
        <button
          className="mt-2 w-full py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700"
          onClick={(e) => {
            e.stopPropagation();
            onTest(alarm);
          }}
        >
          Probar 🔊
        </button>
      )}
    </div>
  );
}
