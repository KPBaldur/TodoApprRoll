// frontend-react/src/services/mediaService.ts

export type MediaKind = 'audio' | 'image' | 'video' | 'file';

export type MediaItem = {
  id: string;
  type: MediaKind;
  name: string;
  path: string;          // URL absoluta (Cloudinary)
  cloudinaryId?: string; // public_id (si existe)
};

type ApiListResp = { success: boolean; data: { media: MediaItem[]; count: number } };
type ApiSimpleResp<T = unknown> = { success: boolean; message?: string; data?: T };

// Base de API (prod = Vercel → Render; dev = proxy de Vite)
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  '';

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${path} → ${res.status} ${text}`);
  }
  return res.json();
}

async function apiJson<T>(path: string, method: 'POST'|'PUT'|'DELETE', body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → ${res.status} ${text}`);
  }
  return res.json();
}

async function apiForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData, // fetch se encarga del boundary y content-type
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${path} → ${res.status} ${text}`);
  }
  return res.json();
}

/** Listado completo de la biblioteca multimedia */
export async function listMedia(): Promise<MediaItem[]> {
  const json = await apiGet<ApiListResp>('/api/media');
  return json.data.media;
}

/** Registrar un recurso ya alojado (URL directa de Cloudinary o externa) */
export async function addMediaByUrl(path: string, name: string, type?: MediaKind): Promise<MediaItem> {
  const json = await apiJson<ApiSimpleResp<{ item: MediaItem }>>('/api/media', 'POST', { path, name, type });
  return json.data!.item;
}

/** Subir archivo real (multipart/form-data; campo "file") */
export async function uploadMedia(file: File, name?: string): Promise<MediaItem> {
  const form = new FormData();
  form.append('file', file);
  if (name) form.append('name', name);

  const json = await apiForm<ApiSimpleResp<{ item: MediaItem }>>('/api/media/upload', form);
  return json.data!.item;
}

/** Renombrar un item */
export async function renameMedia(id: string, name: string): Promise<MediaItem> {
  const json = await apiJson<ApiSimpleResp<{ item: MediaItem }>>(`/api/media/${id}`, 'PUT', { name });
  return json.data!.item;
}

/** Eliminar un item */
export async function deleteMedia(id: string): Promise<void> {
  await apiJson<ApiSimpleResp>(`/api/media/${id}`, 'DELETE');
}

/** Obtener URL completa para un item de media */
export function getMediaUrl(media: MediaItem): string {
  if (!media.path) return '';
  // Si ya es una URL completa (Cloudinary o externa), usarla directamente
  if (media.path.startsWith('http')) return media.path;
  // Para rutas locales (compatibilidad con archivos antiguos)
  return `${API_BASE}${media.path}`;
}
