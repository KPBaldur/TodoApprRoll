// ✅ frontend-react/src/services/mediaService.ts

export type MediaKind = 'audio' | 'image' | 'video' | 'file';

export interface MediaItem {
  id: string;
  type: MediaKind;
  name: string;
  path: string;
  cloudinaryId?: string;
}

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** Listar todos los elementos multimedia */
export async function listMedia(): Promise<MediaItem[]> {
  const res = await fetch(`${API_BASE}/api/media`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Error al listar medios: ${res.status}`);
  const json = await res.json();
  return json.data?.media || [];
}

/** Agregar un medio existente (por URL) */
export async function addMediaByUrl(payload: {
  name: string;
  path: string;
  type?: MediaKind;
}): Promise<MediaItem> {
  const res = await fetch(`${API_BASE}/api/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Error al agregar medio: ${res.status}`);
  const json = await res.json();
  return json.data?.item;
}

/** Subir archivo (multipart/form-data con campo "file") */
export async function uploadMedia(file: File, name?: string): Promise<MediaItem> {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);

  const res = await fetch(`${API_BASE}/api/media/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error(`Error al subir medio: ${res.status}`);
  const json = await res.json();
  return json.data?.item;
}

/** Renombrar un medio */
export async function renameMedia(id: string, name: string): Promise<MediaItem> {
  const res = await fetch(`${API_BASE}/api/media/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Error al renombrar medio: ${res.status}`);
  const json = await res.json();
  return json.data?.item;
}

/** Eliminar un medio */
export async function deleteMedia(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/media/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Error al eliminar medio: ${res.status}`);
}
