// AlarmModal component
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export default function AlarmModal({ open, title, children, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="alarm-modal" role="dialog" aria-modal="true">
      <div className="alarm-modal-card">

        <button
          type="button"
          onClick={onClose}
          className="alarm-modal-close"
          title="Cerrar"
        >
          ✖
        </button>

        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>

        <div className="modal-body">
          {children}
        </div>

      </div>
    </div>
  );
}
