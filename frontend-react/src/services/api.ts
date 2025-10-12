export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const get = <T>(path: string) => api<T>(path)
export const post = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) })
export const put = <T>(path: string, body: unknown) => api<T>(path, { method: 'PUT', body: JSON.stringify(body) })
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
export const del = <T>(path: string) => api<T>(path, { method: 'DELETE' })