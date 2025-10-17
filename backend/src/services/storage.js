import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'database/json');
fs.mkdirSync(dataDir, { recursive: true });

function file(p) { return path.join(dataDir, p); }

async function readJson(p, fallback) {
  const f = file(p);
  try {
    const raw = await fs.promises.readFile(f, 'utf8');
    return JSON.parse(raw);
  } catch {
    // Semilla inicial si no existe
    if (fallback !== undefined) {
      await fs.promises.writeFile(f, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    return [];
  }
}

async function writeJson(p, data) {
  const f = file(p);
  await fs.promises.writeFile(f, JSON.stringify(data, null, 2));
}

// Ejemplos concretos según tu código:
async function getAlarms() { return readJson('alarms.json', []); }
async function saveAlarms(arr) { return writeJson('alarms.json', arr); }
async function getMedia() { return readJson('media.json', []); }
async function saveMedia(arr) { return writeJson('media.json', arr); }
async function getTasks() { return readJson('tasks.json', []); }
async function saveTasks(arr) { return writeJson('tasks.json', arr); }
async function getConfig() { return readJson('config.json', { theme: { mode: 'dark' } }); }
async function saveConfig(obj) { return writeJson('config.json', obj); }
async function getHistory() { return readJson('history.json', []); }
async function saveHistory(arr) { return writeJson('history.json', arr); }

export default {
  getAlarms, saveAlarms,
  getMedia, saveMedia,
  getTasks, saveTasks,
  getConfig, saveConfig,
  getHistory, saveHistory,
  dataDir,
};