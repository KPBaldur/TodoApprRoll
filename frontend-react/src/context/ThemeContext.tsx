import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AppConfig, AppThemeMode } from '../services/configService'
import { getConfig, updateConfig } from '../services/configService'


type ThemeContextValue = {
  config: AppConfig
  mode: AppThemeMode
  setMode: (mode: AppThemeMode) => void
  updateLocal: (partial: Partial<AppConfig>) => void
  apply: () => void
  saveToBackend: () => Promise<void>
  restoreDefaults: () => void
}

const DEFAULTS: AppConfig = {
  theme: {
    mode: 'dark',
    primary: '#5F0F40',
    accent: '#00A8E8',
    success: '#3DDC97',
    danger: '#EF4444',
    bgStart: '#0B132B',
    bgEnd: '#3A506B',
    backgroundImage: ''
  },
  ui: { responsive: true, animations: true }
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULTS)

  useEffect(() => {
    const local = localStorage.getItem('app:config')
    if (local) {
      try { setConfig(JSON.parse(local)) } catch {}
    }
    (async () => {
      try {
        const res = await getConfig()
        if (res.success && res.data?.config) {
          const merged = { ...DEFAULTS, ...res.data.config }
          setConfig(merged)
          localStorage.setItem('app:config', JSON.stringify(merged))
        }
      } catch { /* backend puede no estar disponible */ }
    })()
  }, [])

  const mode = useMemo<AppThemeMode>(() => config.theme?.mode || 'dark', [config])

  function applyVars() {
    const root = document.documentElement
    const t = { ...DEFAULTS.theme, ...(config.theme || {}) }
    // Colores base
    root.style.setProperty('--color-primary', t.primary || DEFAULTS.theme!.primary!)
    root.style.setProperty('--color-accent', t.accent || DEFAULTS.theme!.accent!)
    root.style.setProperty('--color-success', t.success || DEFAULTS.theme!.success!)
    // Fondo
    const bgStart = t.bgStart || DEFAULTS.theme!.bgStart!
    const bgEnd = t.bgEnd || DEFAULTS.theme!.bgEnd!
    const gradAurora = `linear-gradient(135deg, ${bgStart} 0%, ${bgStart} 50%, ${bgEnd} 100%)`
    const gradNebula = `linear-gradient(180deg, ${bgStart} 0%, ${t.primary} 100%)`
    const gradDeepSky = `linear-gradient(90deg, ${bgStart} 0%, ${t.accent} 100%)`
    const gradEvent = `linear-gradient(90deg, ${bgStart} 0%, ${t.success} 100%)`
    root.style.setProperty('--grad-aurora', gradAurora)
    root.style.setProperty('--grad-nebula', gradNebula)
    root.style.setProperty('--grad-deep-sky', gradDeepSky)
    root.style.setProperty('--grad-event-horizon', gradEvent)

    if (t.backgroundImage) {
      document.body.style.backgroundImage = `url(${t.backgroundImage})`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
    } else {
      document.body.style.backgroundImage = ''
    }

    // Modo claro/oscuro (ajuste mínimo de texto y panel)
    if ((config.theme?.mode || 'dark') === 'light') {
      root.style.setProperty('--color-bg', '#ffffff')
      root.style.setProperty('--color-panel', '#f9fafb')
      root.style.setProperty('--color-border', '#e5e7eb')
      root.style.setProperty('--color-text', '#111827')
      root.style.setProperty('--color-subtext', '#374151')
    } else {
      root.style.setProperty('--color-bg', '#0B132B')
      root.style.setProperty('--color-panel', '#1C2541')
      root.style.setProperty('--color-border', '#3A506B')
      root.style.setProperty('--color-text', '#F8FAFC')
      root.style.setProperty('--color-subtext', '#CBD5E1')
    }
  }

  useEffect(() => { applyVars() }, [config])

  const value: ThemeContextValue = {
    config,
    mode,
    setMode(next) {
      setConfig(prev => {
        const merged = { ...prev, theme: { ...prev.theme, mode: next } }
        localStorage.setItem('app:config', JSON.stringify(merged))
        return merged
      })
    },
    updateLocal(partial) {
      setConfig(prev => {
        const merged = { ...prev, ...partial }
        localStorage.setItem('app:config', JSON.stringify(merged))
        return merged
      })
    },
    apply: applyVars,
    async saveToBackend() {
      const res = await updateConfig(config)
      if (res.success && res.data?.config) {
        const merged = { ...DEFAULTS, ...res.data.config }
        setConfig(merged)
        localStorage.setItem('app:config', JSON.stringify(merged))
      }
    },
    restoreDefaults() {
      setConfig(DEFAULTS)
      localStorage.setItem('app:config', JSON.stringify(DEFAULTS))
    }
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}