/**
 * Controlador de Biblioteca Multimedia
 * Persistencia en media.json con items { id, type: 'mp3'|'gif', name, path }
 */
const { v4: uuidv4 } = require('uuid');
const Storage = require('../services/storage');

const list = async (req, res, next) => {
  try {
    const media = await Storage.getMedia();
    res.json({ success: true, data: { media, count: media.length } });
  } catch (err) { next(err); }
};

const add = async (req, res, next) => {
  try {
    const { type, name, path } = req.body;
    if (!['mp3', 'gif'].includes(type)) return res.status(400).json({ success: false, message: 'Tipo inválido' });
    if (!name || !path) return res.status(400).json({ success: false, message: 'name y path son requeridos' });

    const media = await Storage.getMedia();
    const item = { id: uuidv4(), type, name, path };
    media.push(item);
    await Storage.saveMedia(media);

    res.status(201).json({ success: true, message: 'Item agregado', data: { item } });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const media = await Storage.getMedia();
    const idx = media.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item no encontrado' });
    media.splice(idx, 1);
    await Storage.saveMedia(media);
    res.json({ success: true, message: 'Item eliminado' });
  } catch (err) { next(err); }
};

module.exports = { list, add, remove };