import React from "react";

type Props = {
  enabled: boolean;
  onToggle: () => void;
};

export default function AlarmToggle({ enabled, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
        enabled ? "bg-green-600 text-white" : "bg-gray-600 text-white"
      }`}
      title={enabled ? "Desactivar" : "Activar"}
    >
      <span className="text-sm">{enabled ? "Activo" : "Inactivo"}</span>
      <span
        className={`w-4 h-4 rounded-full transition-transform ${
          enabled ? "bg-white translate-x-0" : "bg-gray-300 translate-x-1"
        }`}
      />
    </button>
  );
}