import Storage from '../services/storage.js';

const getHistory = async (req, res, next) => {
  try {
    const items = await Storage.getHistory();
    res.json({ success: true, data: { history: items } });
  } catch (err) { next(err); }
};

export { getHistory };