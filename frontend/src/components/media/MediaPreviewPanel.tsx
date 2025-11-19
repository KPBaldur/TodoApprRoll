import type { Media } from "../../types/media.types";

type Props = {
  item: Media | null;
  onDelete: (item: Media) => void;
};

export default function MediaPreviewPanel({ item, onDelete }: Props) {
  if (!item) {
    return (
      <aside className="media-preview" onClick={(e) => e.stopPropagation()}>
        <div className="muted">Selecciona un archivo para previsualizar.</div>
      </aside>
    );
  }

  const isImage = item.type === "image";

  return (
    <aside className="media-preview" onClick={(e) => e.stopPropagation()}>
      <div className="preview-header">
        <h4 className="preview-title">{item.name}</h4>
      </div>
      <div className="preview-body">
        {isImage ? (
          <div className="preview-image-wrap">
            <img src={item.url} alt={item.name} className="preview-image" />
          </div>
        ) : (
          <div className="preview-audio-wrap">
            <audio className="audio-player" controls src={item.url}>
              Tu navegador no soporta audio.
            </audio>
          </div>
        )}
      </div>

      <div className="preview-actions">
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onDelete(item)}
        >
          Eliminar
        </button>
      </div>
    </aside>
  );
}