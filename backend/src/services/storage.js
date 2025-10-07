const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../../../database/json');

function ensureDir() {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
}

function ensureFile(file, defaultContent) {
  ensureDir();
  const filePath = path.join(baseDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
  }
  return filePath;
}

async function readJson(file) {
  const filePath = ensureFile(file, file === 'config.json' ? {} : []);
  const content = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(content || (file === 'config.json' ? '{}' : '[]'));
}

async function writeJson(file, data) {
  ensureDir();
  const filePath = ensureFile(file, file === 'config.json' ? {} : []);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  readJson,
  writeJson,
  // Helpers específicos
  async getTasks() { return readJson('tasks.json'); },
  async saveTasks(tasks) { return writeJson('tasks.json', tasks); },
  async getMedia() { return readJson('media.json'); },
  async saveMedia(media) { return writeJson('media.json', media); },
  async getConfig() { return readJson('config.json'); },
  async saveConfig(config) { return writeJson('config.json', config); }
};