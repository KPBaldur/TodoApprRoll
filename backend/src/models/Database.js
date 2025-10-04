/**
 * Modelo de Base de Datos JSON
 * Esta clase maneja la lectura y escritura de archivos JSON
 * Simula las operaciones básicas de una base de datos
 */

const fs = require('fs').promises;
const path = require('path');

class Database {
    constructor() {
        const rootDir = path.resolve(__dirname, '../../..');
        this.usersFile = path.join(rootDir, 'database', 'json', 'users.json');
        this.tasksFile = path.join(rootDir, 'database', 'json', 'tasks.json');
    }

    /**
     * Leer datos de un archivo JSON
     * @param {string} filePath - Ruta del archivo
     * @returns {Array} - Array de datos
     */
    async readFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error leyendo archivo ${filePath}:`, error.message);
            return [];
        }
    }

    /**
     * Escribir datos a un archivo JSON
     * @param {string} filePath - Ruta del archivo
     * @param {Array} data - Datos a escribir
     */
    async writeFile(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error(`Error escribiendo archivo ${filePath}:`, error.message);
            throw error;
        }
    }

    // ===================
    // OPERACIONES USUARIOS
    // ===================

    async getUsers() {
        return await this.readFile(this.usersFile);
    }

    async saveUsers(users) {
        await this.writeFile(this.usersFile, users);
    }

    async findUserById(id) {
        const users = await this.getUsers();
        return users.find(user => user.id === id);
    }

    async findUserByEmail(email) {
        const users = await this.getUsers();
        return users.find(user => user.email === email);
    }

    async createUser(userData) {
        const users = await this.getUsers();

        // Guardar como objeto plano para incluir el hash de password y evitar toJSON de la clase
        const toSave = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            password: userData.password,  // hash ya aplicado por User.hashPassword()
            role: userData.role,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
        };

        users.push(toSave);
        await this.saveUsers(users);
        return toSave;
    }

    // ===================
    // OPERACIONES TAREAS
    // ===================

    async getTasks() {
        return await this.readFile(this.tasksFile);
    }

    async saveTasks(tasks) {
        await this.writeFile(this.tasksFile, tasks);
    }

    async findTaskById(id) {
        const tasks = await this.getTasks();
        return tasks.find(task => task.id === id);
    }

    async findTasksByUserId(userId) {
        const tasks = await this.getTasks();
        return tasks.filter(task => task.userId === userId);
    }

    async createTask(taskData) {
        const tasks = await this.getTasks();
        tasks.push(taskData);
        await this.saveTasks(tasks);
        return taskData;
    }

    async updateTask(id, updateData) {
        const tasks = await this.getTasks();
        const index = tasks.findIndex(task => task.id === id);
        
        if (index === -1) {
            throw new Error('Tarea no encontrada');
        }

        tasks[index] = { ...tasks[index], ...updateData, updatedAt: new Date().toISOString() };
        await this.saveTasks(tasks);
        return tasks[index];
    }

    async deleteTask(id) {
        const tasks = await this.getTasks();
        const filteredTasks = tasks.filter(task => task.id !== id);
        
        if (tasks.length === filteredTasks.length) {
            throw new Error('Tarea no encontrada');
        }

        await this.saveTasks(filteredTasks);
        return true;
    }
}

// Exportar una instancia única (Singleton)
module.exports = new Database();