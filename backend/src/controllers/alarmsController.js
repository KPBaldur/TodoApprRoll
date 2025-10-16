/**
 * Controlador de Alarmas
 * Persistencia en alarms.json con items { id, name, time, enabled, mediaId? }
 */
const { v4: uuidv4 } = require('uuid');
const Storage = require('../services/storage');

async function ensureValidMediaId(mediaId) {
    if (!mediaId) return null;
    try {
        const mediaList = await Storage.getMedia();
        const exists = mediaList.some(m => String(m.id) === String(mediaId));
        return exists ? mediaId : null;
    } catch {
        return null;
    }
}

const list = async (req, res, next) => {
  try {
    const alarms = await Storage.getAlarms();
    res.json({ success: true, data: { alarms, count: alarms.length } });
  } catch (err) { next(err); }
};

// add (crear alarma)
const add = async (req, res, next) => {
  try {
    const { name, time, enabled = true, mediaId, imageId, intervalMinutes } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }
    if (time && typeof time !== 'string') {
      return res.status(400).json({ success: false, message: 'El campo time debe ser string (ej. YYYY-MM-DDTHH:mm)' });
    }
    if (intervalMinutes !== undefined) {
      const v = Number(intervalMinutes);
      if (!Number.isFinite(v) || v <= 0) {
        return res.status(400).json({ success: false, message: 'intervalMinutes debe ser un número mayor a 0' });
      }
    }

    const alarms = await Storage.getAlarms();
    const alarm = {
      id: uuidv4(),
      name,
      time: time || '',
      enabled: !!enabled,
      mediaId: await ensureValidMediaId(mediaId),
      imageId: await ensureValidMediaId(imageId),
      intervalMinutes: intervalMinutes !== undefined ? Number(intervalMinutes) : undefined,
      snoozedUntil: null // inicializamos el nuevo campo opcional
    };
    alarms.push(alarm);
    await Storage.saveAlarms(alarms);

    res.status(201).json({ success: true, message: 'Alarma creada', data: { alarm } });
  } catch (err) { next(err); }
};

// update (actualizar alarma)
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, time, enabled, mediaId, imageId, intervalMinutes, snoozedUntil } = req.body || {};


    const alarms = await Storage.getAlarms();
    const idx = alarms.findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Alarma no encontrada' });

    if (name !== undefined) {
      if (!name || typeof name !== 'string') return res.status(400).json({ success: false, message: 'Nombre inválido' });
      alarms[idx].name = name;
    }
    if (time !== undefined) {
      if (time && typeof time !== 'string') return res.status(400).json({ success: false, message: 'El campo time debe ser string' });
      alarms[idx].time = time || '';
    }
    if (enabled !== undefined) alarms[idx].enabled = !!enabled;
    if (mediaId !== undefined) {
      alarms[idx].mediaId = await ensureValidMediaId(mediaId);
    }

    if (imageId !== undefined) {
      alarms[idx].imageId = await ensureValidMediaId(imageId);
    }

    if (intervalMinutes !== undefined) {
      const v = Number(intervalMinutes);
      if (!Number.isFinite(v) || v <= 0) {
        return res.status(400).json({ success: false, message: 'intervalMinutes debe ser un número mayor a 0' });
      }
      alarms[idx].intervalMinutes = v;
    }

    if (snoozedUntil !== undefined) {
      if (snoozedUntil === null || snoozedUntil === '') {
        alarms[idx].snoozedUntil = null;
      } else {
        const t = Date.parse(snoozedUntil);
        if (Number.isNaN(t)) {
          return res.status(400).json({ success: false, message: 'snoozedUntil debe ser una fecha ISO válida o null' });
        }
        alarms[idx].snoozedUntil = new Date(t).toISOString();
      }
    }

    await Storage.saveAlarms(alarms);
    res.json({ success: true, message: 'Alarma actualizada', data: { alarm: alarms[idx] } });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alarms = await Storage.getAlarms();
    const idx = alarms.findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Alarma no encontrada' });

    alarms.splice(idx, 1);
    await Storage.saveAlarms(alarms);
    res.json({ success: true, message: 'Alarma eliminada' });
  } catch (err) { next(err); }
};

// PATCH /api/alarms/:id/snooze
const snooze = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { snoozedUntil } = req.body || {};

    if (typeof snoozedUntil !== 'string' || Number.isNaN(new Date(snoozedUntil).getTime())) {
      return res.status(400).json({ success: false, message: 'snoozedUntil debe ser una fecha ISO válida' });
    }

    const alarms = await Storage.getAlarms();
    const idx = alarms.findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Alarma no encontrada' });

    alarms[idx].snoozedUntil = new Date(snoozedUntil).toISOString();
    await Storage.saveAlarms(alarms);

    res.json({ success: true, message: 'Snooze actualizado', data: { alarm: alarms[idx] } });
  } catch (err) { next(err); }
};


module.exports = { list, add, update, remove, snooze };