import { useCallback, useMemo, useState, useEffect } from "react";
import { uploadMedia } from "../../services/media";
import type { Media } from "../../types/media.types";

type Props = {
  open: boolean;
  onClose: () => void;
  onUploaded: (item: Media) => void;
};

const allowedImage = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const allowedAudio = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/m4a"];

export default function MediaUploadModal({ open, onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Resetear estado al abrir el modal para no mostrar el último archivo subido
  useEffect(() => {
    if (open) {
      setFile(null);
      setError("");
      setUploading(false);
    }
  }, [open]);

  const type: "image" | "audio" | null = useMemo(() => {
    if (!file) return null;
    if (allowedImage.includes(file.type)) return "image";
    if (allowedAudio.includes(file.type)) return "audio";
    return null;
  }, [file]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSet(f);
  }, []);

  const validateAndSet = (f: File) => {
    const ok = allowedImage.includes(f.type) || allowedAudio.includes(f.type);
    if (!ok) {
      setError("Formato no soportado. Usa imágenes (jpg, png, webp, gif) o audios (mp3, wav, ogg, m4a).");
      setFile(null);
      return;
    }
    setError("");
    setFile(f);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSet(f);
  };

  const submit = async () => {
    if (!file || !type) {
      setError("Selecciona un archivo válido para subir.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const created = await uploadMedia(fd);
      onUploaded(created);
      // Limpiar estado antes de cerrar
      setFile(null);
      setError("");
      setUploading(false);
      onClose();
    } catch (e: any) {
      setError(e.message || "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal" onClick={(e) => e.stopPropagation()}>
        <button className="media-modal-close" onClick={onClose} title="Cerrar">✖</button>
        <h3 className="media-modal-title">Subir archivo</h3>

        <div
          className="drag-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          {file && type === "image" ? (
            <img src={URL.createObjectURL(file)} alt="preview" className="drag-preview-image" />
          ) : file && type === "audio" ? (
            <div className="drag-preview-audio">🎵 {file.name}</div>
          ) : (
            <div className="drag-hint">
              Arrastra y suelta tu archivo aquí, o selecciona abajo.
            </div>
          )}
        </div>

        <input type="file" onChange={onFileChange} className="input-file" />

        {error ? <p className="error-text">{error}</p> : null}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={submit} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir archivo"}
          </button>
          <button className="btn btn-muted" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}