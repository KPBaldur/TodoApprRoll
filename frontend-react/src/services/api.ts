const API_BASE = import.meta.env.VITE_API_URL || ''

function buildUrl(path: string): string {
  if (!path) return API_BASE
  // If already absolute (http/https), pass-through
  if (/^https?:\/\//i.test(path)) return path
  // Ensure single slash between base and path
  const base = API_BASE.replace(/\/$/, '')
  const rel = path.startsWith('/') ? path : `/${path}`
  return `${base}${rel}`
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path)
  const headers = new Headers(init?.headers as HeadersInit | undefined)
  const hasBody = typeof init?.body !== 'undefined'
  const isMultipart = typeof FormData !== 'undefined' && (init?.body instanceof FormData)
  if (hasBody && !isMultipart && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(url, {
    ...init,
    headers,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const get = <T>(path: string) => api<T>(path)
export const post = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) })
export const put = <T>(path: string, body: unknown) => api<T>(path, { method: 'PUT', body: JSON.stringify(body) })
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
export const del = <T>(path: string) => api<T>(path, { method: 'DELETE' })

// For multipart/FormData uploads
export const postForm = <T>(path: string, formData: FormData) => api<T>(path, { method: 'POST', body: formData })