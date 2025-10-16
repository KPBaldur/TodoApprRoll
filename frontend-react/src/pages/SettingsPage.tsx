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
    <section className="page settings-page">
      <h2 className="page-title">Configuración</h2>

      <div className="panel settings-panel">
        <div className="panel-body">
          <div className="section-title">Tema</div>

          <div className="settings-grid">
            <label className="form-field">
              <span className="form-label">Modo:</span>
              <select value={mode} onChange={(e) => setMode(e.target.value as AppThemeMode)}>
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="custom">Personalizado</option>
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Color principal:</span>
              <input type="color" value={theme.primary || '#5F0F40'}
                    onChange={(e) => onColorChange('primary', e.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">Color acento:</span>
              <input type="color" value={theme.accent || '#00A8E8'}
                    onChange={(e) => onColorChange('accent', e.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">Color éxito:</span>
              <input type="color" value={theme.success || '#3DDC97'}
                    onChange={(e) => onColorChange('success', e.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">Fondo inicio:</span>
              <input type="color" value={theme.bgStart || '#0B132B'}
                    onChange={(e) => onColorChange('bgStart', e.target.value)} />
            </label>

            <label className="form-field">
              <span className="form-label">Fondo fin:</span>
              <input type="color" value={theme.bgEnd || '#3A506B'}
                    onChange={(e) => onColorChange('bgEnd', e.target.value)} />
            </label>

            <label className="form-field full">
              <span className="form-label">Imagen de fondo (URL):</span>
              <input type="text" placeholder="/uploads/mi-fondo.jpg o URL completa"
                    value={theme.backgroundImage || ''}
                    onChange={(e) => onColorChange('backgroundImage', e.target.value)} />
            </label>
          </div>

          <div className="settings-actions">
            <button className="btn" onClick={onSave}>Guardar</button>
            <button className="btn danger" onClick={onRestore}>Restaurar predeterminada</button>
          </div>
        </div>
      </div>
    </section>
  )
}