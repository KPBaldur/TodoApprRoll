"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getUserById = void 0;
const prismaService_1 = __importDefault(require("./prismaService"));
// Obtiene la informacion completa de un usuario por su ID
const getUserById = async (id) => {
    try {
        return await prismaService_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                createdAt: true,
                updatedAt: true,
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true,
                    },
                },
                alarms: {
                    select: {
                        id: true,
                        name: true,
                        enabled: true,
                        scheduleAt: true,
                    },
                },
            },
        });
    }
    catch (error) {
        console.error("[userService] Error al obtener al usuario por ID:", error);
        throw new Error("No se pudo obtener la informacion del usuario.");
    }
};
exports.getUserById = getUserById;
//Actualiza el perfil de usuario por su ID
const updateUser = async (id, data) => {
    try {
        const updated = await prismaService_1.default.user.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                updatedAt: true,
            },
        });
        return updated;
    }
    catch (error) {
        console.error("[userService] Error al actualizar el usuario:", error);
        throw new Error("No se pudo actualizar el perfil del usuario.");
    }
};
exports.updateUser = updateUser;
