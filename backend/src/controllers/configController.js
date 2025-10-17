/**
 * Controlador de Configuración visual y preferencias
 * Persistencia en config.json
 */
import Storage from '../services/storage.js';

const getConfig = async (req, res, next) => {
  try {
    const config = await Storage.getConfig();
    res.json({ success: true, data: { config } });
  } catch (err) { next(err); }
};

const setConfig = async (req, res, next) => {
  try {
    const current = await Storage.getConfig();
    const incoming = req.body || {};
    const merged = { ...current, ...incoming };
    await Storage.saveConfig(merged);
    await Storage.appendHistory({
      time: Date.now(),
      type: 'config.update',
      detail: { changedKeys: Object.keys(incoming || {}) }
    });
    res.json({ success: true, message: 'Configuración actualizada', data: { config: merged } });
  } catch (err) { next(err); }
};

export { getConfig, setConfig };