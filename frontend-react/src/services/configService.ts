import { get, patch } from './api'

export type AppThemeMode = 'light' | 'dark' | 'custom'

export type AppConfig = {
  theme?: {
    mode?: AppThemeMode
    primary?: string
    accent?: string
    success?: string
    danger?: string
    bgStart?: string
    bgEnd?: string
    backgroundImage?: string
  },
  ui?: {
    responsive?: boolean
    animations?: boolean
  }
}

export async function getConfig() {
  return get<{ success: boolean; data: { config: AppConfig } }>('/api/config')
}

export async function updateConfig(payload: Partial<AppConfig>) {
  return patch<{ success: boolean; data: { config: AppConfig } }>('/api/config', payload)
}