/**
 * Modelo de Usuario
 * Define la estructura y operaciones para los usuarios del sistema
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Database = require('./Database');

class User {
    constructor(userData) {
        this.id = userData.id || uuidv4();
        this.username = userData.username;
        this.email = userData.email;
        this.password = userData.password; // Se hasheará antes de guardar
        this.role = userData.role || 'user'; // 'user' o 'admin'
        this.createdAt = userData.createdAt || new Date().toISOString();
        this.updatedAt = userData.updatedAt || new Date().toISOString();
    }

    /**
     * Hashear la contraseña antes de guardar
     */
    async hashPassword() {
        if (this.password) {
            const saltRounds = 12;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
    }

    /**
     * Verificar contraseña
     * @param {string} plainPassword - Contraseña en texto plano
     * @returns {boolean} - True si la contraseña es correcta
     */
    async verifyPassword(plainPassword) {
        return await bcrypt.compare(plainPassword, this.password);
    }

    /**
     * Convertir a objeto JSON (sin contraseña)
     */
    toJSON() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }

    /**
     * Validar datos del usuario
     */
    validate() {
        const errors = [];

        if (!this.username || this.username.length < 3) {
            errors.push('El nombre de usuario debe tener al menos 3 caracteres');
        }

        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('El email debe tener un formato válido');
        }

        if (!this.password || this.password.length < 6) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }

        if (!['user', 'admin'].includes(this.role)) {
            errors.push('El rol debe ser "user" o "admin"');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ===================
    // MÉTODOS ESTÁTICOS
    // ===================

    /**
     * Crear un nuevo usuario
     */
    static async create(userData) {
        const user = new User(userData);
        
        // Validar datos
        const validation = user.validate();
        if (!validation.isValid) {
            throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
        }

        // Verificar que el email no exista
        const existingUser = await Database.findUserByEmail(user.email);
        if (existingUser) {
            throw new Error('El email ya está registrado');
        }

        // Hashear contraseña
        await user.hashPassword();

        // Guardar en la base de datos
        await Database.createUser(user);
        
        return user;
    }

    /**
     * Buscar usuario por ID
     */
    static async findById(id) {
        const userData = await Database.findUserById(id);
        return userData ? new User(userData) : null;
    }

    /**
     * Buscar usuario por email
     */
    static async findByEmail(email) {
        const userData = await Database.findUserByEmail(email);
        return userData ? new User(userData) : null;
    }

    /**
     * Obtener todos los usuarios
     */
    static async findAll() {
        const users = await Database.getUsers();
        return users.map(userData => new User(userData));
    }

    /**
     * Autenticar usuario (login)
     */
    static async authenticate(email, password) {
        const user = await User.findByEmail(email);
        
        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        const isValidPassword = await user.verifyPassword(password);
        if (!isValidPassword) {
            throw new Error('Credenciales inválidas');
        }

        return user;
    }
}

module.exports = User;