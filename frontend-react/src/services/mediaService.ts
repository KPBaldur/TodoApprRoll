import { get, post, put, del, postForm } from './api'
export type MediaItem = {
  id: string;
  type: 'audio' | 'image' | 'video' | 'file';
  name: string;
  path: string; // p.e. /uploads/123-file.mp3 o URL externa
};

const BASE = '/api/media';

export async function listMedia(): Promise<MediaItem[]> {
  const json = await get<{ success: boolean; data: { media: MediaItem[] }; message?: string }>(`${BASE}`)

  if (!json.success) throw new Error(json.message || 'Error al listar media');
  return (json.data.media as MediaItem[]).filter(m =>
  ['audio', 'image', 'video'].includes(m.type));
}

export async function uploadMedia(file: File, name?: string) {
  const allowedTypes = ['audio/', 'image/', 'video/'];
  if (!allowedTypes.some(prefix => file.type.startsWith(prefix))) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }

  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);

  const json = await postForm<{ success: boolean; data: { item: MediaItem } }>('/api/media/upload', formData)
  if (!json.success) throw new Error('Error al subir archivo multimedia');
  return json
}

// Alta por JSON (URL existente)
export async function addMediaByUrl(path: string, name: string, type?: MediaItem['type']): Promise<MediaItem> {
  const json = await post<{ success: boolean; data: { item: MediaItem } }>(`${BASE}`, { path, name, type })
  if (!json.success) throw new Error('Error al registrar URL');
  return json.data.item as MediaItem;
}

export async function renameMedia(id: string, name: string): Promise<MediaItem> {
  const json = await put<{ success: boolean; data: { item: MediaItem } }>(`${BASE}/${id}`, { name })
  if (!json.success) throw new Error('Error al renombrar');
  return json.data.item as MediaItem;
}

export async function deleteMedia(id: string): Promise<void> {
  const json = await del<{ success: boolean }>(`${BASE}/${id}`)
  if (!json.success) throw new Error('Error al eliminar');
}

export function filterMediaByType(media: MediaItem[], type: 'audio' | 'image' | 'video'): MediaItem[]{
  return media.filter(m => m.type === type);
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export function getMediaUrl(media: MediaItem): string {
  if (!media.path) return '';
  if (media.path.startsWith('http')) return media.path;
  return `${API_BASE}${media.path}`;
}
