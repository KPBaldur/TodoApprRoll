type Props = {
  open: boolean
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onClose: () => void
}

export default function SubtaskModal({ open, value, onChange, onSubmit, onClose }: Props) {
  if (!open) return null
  return createPortal(
    <div className="modal-root">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Nueva subtarea" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Nueva subtarea</div>
        <div className="modal-body">
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Título de la subtarea" />
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onSubmit} disabled={!value.trim()}>Añadir</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
import { createPortal } from 'react-dom'