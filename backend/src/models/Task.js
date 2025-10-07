/**
 * Modelo de Tarea: define estructura, validación y operaciones
 */
const { v4: uuidv4 } = require('uuid');
const Storage = require('../services/storage');

const VALID_STATUSES = ['pending', 'working', 'completed', 'archived'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

class Task {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.description = data.description || '';
    this.priority = data.priority || 'medium';
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.completedAt = data.completedAt; // ISO string
    this.subtasks = Array.isArray(data.subtasks) ? data.subtasks : [];
    this.remember = !!data.remember;
  }

  touch() {
    this.updatedAt = new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length < 3) {
      errors.push('El título debe tener al menos 3 caracteres');
    }

    if (!VALID_STATUSES.includes(this.status)) {
      errors.push(`Estado inválido: ${this.status}`);
    }

    if (!VALID_PRIORITIES.includes(this.priority)) {
      errors.push(`Prioridad inválida: ${this.priority}`);
    }

    if (typeof this.subtasks !== 'undefined') {
      if (!Array.isArray(this.subtasks)) errors.push('Las subtareas deben ser un arreglo');
      else {
        for (const st of this.subtasks) {
          if (!st || typeof st.title !== 'string' || st.title.trim().length === 0) {
            errors.push('Cada subtarea debe tener un título');
            break;
          }
          if (typeof st.completed !== 'undefined' && typeof st.completed !== 'boolean') {
            errors.push('El campo "completed" de la subtarea debe ser booleano');
            break;
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static async findAll() {
    const tasks = await Storage.getTasks();
    return tasks.map(t => new Task(t));
  }

  static async findById(id) {
    const tasks = await Storage.getTasks();
    const found = tasks.find(t => t.id === id);
    return found ? new Task(found) : null;
  }

  static async create(payload) {
    const tasks = await Storage.getTasks();
    const task = new Task(payload);
    const validation = task.validate();
    if (!validation.isValid) throw new Error(validation.errors.join(', '));

    tasks.push(task);
    await Storage.saveTasks(tasks);
    return task;
  }

  static async update(id, updateData) {
    const tasks = await Storage.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tarea no encontrada');

    const existing = new Task(tasks[idx]);
    const cleanUpdate = {};
    for (const [k, v] of Object.entries(updateData || {})) {
      if (typeof v !== 'undefined') cleanUpdate[k] = v;
    }

    // Detectar cambio de estado para completedAt
    const statusChange = typeof cleanUpdate.status !== 'undefined' && cleanUpdate.status !== existing.status;

    const updated = new Task({ ...existing, ...cleanUpdate });
    if (statusChange) {
      if (cleanUpdate.status === 'completed') updated.completedAt = new Date().toISOString();
      else updated.completedAt = undefined;
    }

    // Validar
    updated.touch();
    const validation = updated.validate();
    if (!validation.isValid) throw new Error(validation.errors.join(', '));

    tasks[idx] = updated;
    await Storage.saveTasks(tasks);
    return updated;
  }

  static nextStatus(current) {
    return current === 'pending'
      ? 'working'
      : current === 'working'
        ? 'completed'
        : 'pending';
  }

  static async cycleStatus(id) {
    const task = await Task.findById(id);
    if (!task) throw new Error('Tarea no encontrada');

    const next = Task.nextStatus(task.status);
    return Task.update(id, { status: next });
  }

  static async delete(id) {
    const tasks = await Storage.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tarea no encontrada');
    tasks.splice(idx, 1);
    await Storage.saveTasks(tasks);
  }
}

module.exports = Task;