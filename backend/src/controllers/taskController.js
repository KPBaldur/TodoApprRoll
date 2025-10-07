/**
 * Controlador de Tareas
 */
const Task = require('../models/task');

const getTasks = async (req, res, next) => {
  try {
    const { status } = req.query;
    let tasks = await Task.findAll();
    if (status && ['pending', 'working', 'completed', 'archived'].includes(status)) {
      tasks = tasks.filter(t => t.status === status);
    }
    res.json({ success: true, data: { tasks, count: tasks.length } });
  } catch (err) { next(err); }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    res.json({ success: true, data: { task } });
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, subtasks, remember } = req.body;
    const task = await Task.create({ title, description, priority, status, subtasks, remember });
    res.status(201).json({ success: true, message: 'Tarea creada', data: { task } });
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const payload = {};
    if (typeof body.title !== 'undefined') payload.title = body.title;
    if (typeof body.description !== 'undefined') payload.description = body.description;
    if (typeof body.priority !== 'undefined') payload.priority = body.priority;
    if (typeof body.status !== 'undefined') payload.status = body.status;
    if (typeof body.subtasks !== 'undefined') payload.subtasks = body.subtasks;
    if (typeof body.remember !== 'undefined') payload.remember = body.remember;

    const task = await Task.update(id, payload);
    res.json({ success: true, message: 'Tarea actualizada', data: { task } });
  } catch (err) { next(err); }
};

const toggleTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.cycleStatus(id);
    res.json({ success: true, message: `Estado actualizado a ${task.status}`, data: { task } });
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Task.delete(id);
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (err) { next(err); }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask
};