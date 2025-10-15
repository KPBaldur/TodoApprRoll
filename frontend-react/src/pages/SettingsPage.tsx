import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import type { AppConfig, AppThemeMode } from '../services/configService'

export default function SettingsPage() {
  const { config, mode, setMode, updateLocal, saveToBackend, restoreDefaults } = useTheme()
  const [local, setLocal] = useState<AppConfig>(config)
  const theme = local.theme || {}

  useEffect(() => { setLocal(config) }, [config])

  function onColorChange(key: keyof NonNullable<AppConfig['theme']>, value: string) {
    const next = { ...local, theme: { ...theme, [key]: value } }
    setLocal(next)
    updateLocal(next)
  }

  async function onSave() {
    await saveToBackend()
    alert('Configuración guardada.')
  }

  function onRestore() {
    restoreDefaults()
    alert('Configuración restaurada a valores por defecto.')
  }

  return (
    <section className="page">
      <h2 className="page-title">Configuración</h2>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-body">
          <div className="section-title">Tema</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              Modo:
              <select value={mode} onChange={(e) => setMode(e.target.value as AppThemeMode)}>
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="custom">Personalizado</option>
              </select>
            </label>

            <label>
              Color principal:
              <input type="color" value={theme.primary || '#5F0F40'} onChange={(e) => onColorChange('primary', e.target.value)} />
            </label>

            <label>
              Color acento:
              <input type="color" value={theme.accent || '#00A8E8'} onChange={(e) => onColorChange('accent', e.target.value)} />
            </label>

            <label>
              Color éxito:
              <input type="color" value={theme.success || '#3DDC97'} onChange={(e) => onColorChange('success', e.target.value)} />
            </label>

            <label>
              Fondo inicio:
              <input type="color" value={theme.bgStart || '#0B132B'} onChange={(e) => onColorChange('bgStart', e.target.value)} />
            </label>

            <label>
              Fondo fin:
              <input type="color" value={theme.bgEnd || '#3A506B'} onChange={(e) => onColorChange('bgEnd', e.target.value)} />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              Imagen de fondo (URL):
              <input type="text" placeholder="/uploads/mi-fondo.jpg o URL completa" value={theme.backgroundImage || ''} onChange={(e) => onColorChange('backgroundImage', e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={onSave}>Guardar</button>
        <button className="btn danger" onClick={onRestore}>Restaurar predeterminada</button>
      </div>
    </section>
  )
}