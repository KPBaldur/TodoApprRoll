import { useEffect, useMemo, useState, useCallback } from "react";
import { getMedia, deleteMedia } from "../../services/media";
import type { Media } from "../../types/media.types";
import MediaItemCard from "./MediaItemCard";
import MediaPreviewPanel from "./MediaPreviewPanel";
import MediaUploadModal from "./MediaUploadModal";
import "../../styles/media.css";

type Filter = "all" | "image" | "audio";

export default function MediaDashboard() {
  const [items, setItems] = useState<Media[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Media | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getMedia();
      setItems(list);
      if (list.length) setSelected(list[0]);
      else setSelected(null);
    } catch (e: any) {
      setError(e.message || "No se pudo cargar la multimedia");
      setItems([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => it.type === filter);
  }, [items, filter]);

  const onDelete = async (it: Media) => {
    if (!confirm(`¿Eliminar "${it.name}"?`)) return;
    const prev = items;
    setItems((list) => list.filter((m) => m.id !== it.id));
    if (selected?.id === it.id) setSelected(null);
    try {
      await deleteMedia(it.id);
    } catch (e: any) {
      setItems(prev);
      alert(e.message || "No se pudo eliminar el archivo");
    }
  };

  const onUploaded = (it: Media) => {
    setItems((list) => [it, ...list]);
    setSelected(it);
  };

  return (
    <div className="media-dashboard">
      <div className="media-toolbar">
        <div className="media-filters">
          <button
            className={`toggle-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todo
          </button>
          <button
            className={`toggle-btn ${filter === "image" ? "active" : ""}`}
            onClick={() => setFilter("image")}
          >
            Imágenes
          </button>
          <button
            className={`toggle-btn ${filter === "audio" ? "active" : ""}`}
            onClick={() => setFilter("audio")}
          >
            Audios
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowUploadModal(true)}
        >
          + Subir archivo
        </button>
      </div>

      {loading ? <p className="muted">Cargando…</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !visible.length ? (
        <div className="media-empty">
          <div className="media-empty-card">
            <div>⚠ No hay archivos multimedia cargados</div>
          </div>
        </div>
      ) : (
        <div className="media-content">
          <div className="media-grid">
            {visible.map((it) => (
              <MediaItemCard
                key={it.id}
                item={it}
                selected={selected?.id === it.id}
                onClick={() => setSelected(it)}
                onDelete={() => onDelete(it)}
              />
            ))}
          </div>
          <MediaPreviewPanel item={selected} onDelete={onDelete} />
        </div>
      )}

      <MediaUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploaded={onUploaded}
      />
    </div>
  );
}