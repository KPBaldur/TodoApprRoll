import { useEffect, useState } from 'react';
import type { MediaItem } from '../services/mediaService'
import { addMediaByUrl, deleteMedia, listMedia, renameMedia, uploadMedia } from '../services/mediaService'

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [urlPath, setUrlPath] = useState('');
  const [urlName, setUrlName] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'audio'>('all');
  const [nameQuery, setNameQuery] = useState('');

  async function reload() {
    setLoading(true); setError(undefined);
    try {
      const data = await listMedia();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar multimedia');
    } finally { setLoading(false); }
  }

  useEffect(() => { reload(); }, []);

  async function handleUpload() {
    if (!file) return;
    setLoading(true); setError(undefined);
    try {
      await uploadMedia(file, fileName || undefined);
      setFile(null); setFileName('');
      await reload();
    } catch (e: any) {
      setError(e?.message || 'Error al subir archivo');
    } finally { setLoading(false); }
  }

  async function handleAddUrl() {
    if (!urlPath || !urlName) return;
    setLoading(true); setError(undefined);
    try {
      await addMediaByUrl(urlPath, urlName);
      setUrlPath(''); setUrlName('');
      await reload();
    } catch (e: any) {
      setError(e?.message || 'Error al registrar URL');
    } finally { setLoading(false); }
  }

  async function handleRename(id: string, name: string) {
    setLoading(true); setError(undefined);
    try {
      await renameMedia(id, name);
      await reload();
    } catch (e: any) {
      setError(e?.message || 'Error al renombrar');
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar definitivamente este elemento?')) return;
    setLoading(true); setError(undefined);
    try {
      await deleteMedia(id);
      await reload();
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar');
    } finally { setLoading(false); }
  }

  const visibleItems = items
    .filter(i => (typeFilter === 'all' ? true : i.type === typeFilter))
    .filter(i => {
      const q = nameQuery.trim().toLowerCase();
      return q === '' ? true : i.name.toLowerCase().includes(q);
    });

  return (
    <section className="page">
      <h2 className="page-title">Multimedia</h2>
      {loading && <p>Cargando…</p>}
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <details open style={{ marginBottom: 16 }}>
        <summary><strong>Subir archivo</strong></summary>
        <div className="panel" style={{ marginTop: 8 }}>
          <div className="panel-body" style={{ display: 'grid', gap: 8 }}>
            <input type="file" accept="audio/*,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Nombre opcional…" />
            <div style={{ textAlign: 'right' }}>
              <button className="btn" onClick={handleUpload} disabled={!file}>Subir</button>
            </div>
          </div>
        </div>
      </details>

      <details style={{ marginBottom: 16 }}>
        <summary><strong>Registrar URL</strong> (GIF/imagen/audio ya alojado)</summary>
        <div className="panel" style={{ marginTop: 8 }}>
          <div className="panel-body" style={{ display: 'grid', gap: 8 }}>
            <input type="text" value={urlPath} onChange={(e) => setUrlPath(e.target.value)} placeholder="URL https://…" />
            <input type="text" value={urlName} onChange={(e) => setUrlName(e.target.value)} placeholder="Nombre visible…" />
            <div style={{ textAlign: 'right' }}>
              <button className="btn" onClick={handleAddUrl} disabled={!urlPath || !urlName}>Registrar</button>
            </div>
          </div>
        </div>
      </details>

      <h3 className="section-title">Contenido</h3>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ opacity: 0.8 }}>Filtro:</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | 'image' | 'audio')}>
            <option value="all">Todo</option>
            <option value="image">Solo imágenes</option>
            <option value="audio">Solo audio</option>
          </select>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ opacity: 0.8 }}>Buscar por nombre:</span>
          <input
            type="text"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Escribe el nombre…"
            style={{ minWidth: 200 }}
          />
        </label>
      </div>

      <ul className="task-list">
        {visibleItems.map(item => (
          <li key={item.id} className="task-item">
            <div className="title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge status ${item.type}`}>{item.type}</span>
              <input
                type="text"
                defaultValue={item.name}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next && next !== item.name) handleRename(item.id, next);
                }}
                style={{ flex: 1 }}
                title="Escribe y quita el foco para renombrar"
              />
              <button className="btn danger" onClick={() => handleDelete(item.id)}>Eliminar</button>
            </div>
            <div className="details" style={{ display: 'grid', gap: 8 }}>
              <div style={{ opacity: 0.8, fontSize: 12 }}>Path: {item.path}</div>
              {item.type === 'audio' ? (
                <audio src={item.path} controls />
              ) : (
                <img src={item.path} alt={item.name} style={{ maxWidth: 260, borderRadius: 8, border: '1px solid var(--color-border)' }} />
              )}
            </div>
          </li>
        ))}
      </ul>
      {visibleItems.length === 0 && <p style={{ opacity: 0.8 }}>No hay contenido para el filtro seleccionado.</p>}
    </section>
  );
}