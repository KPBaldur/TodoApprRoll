"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMediaRecord = exports.saveMediaRecord = exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const prismaService_1 = __importDefault(require("../services/prismaService"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// SUBE UN ARCHIVO A cLOUDINARY Y DEVUELVE LA METADA DATA NECESARIA
const uploadToCloudinary = async (filePath, folder = "TodoAppRoll") => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(filePath, {
            folder,
            resource_type: "auto",
        });
        return {
            publicId: result.public_id,
            url: result.secure_url,
            type: result.resource_type,
        };
    }
    catch (error) {
        console.error("Error al subir a Cloudinary:", error);
        throw new Error("Error al subir el archivo a Cloudinary");
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
// Erliminar un archivo remoto de Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        return result;
    }
    catch (error) {
        console.error("Error al eliminar de Cloudinary:", error);
        throw new Error("Error al eliminar el archivo en Cloudinary");
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
// Crear el registro en la base de datos para un nuevo archivo multimedia
const saveMediaRecord = async (userId, name, url, type, publicId) => {
    return await prismaService_1.default.media.create({
        data: {
            userId,
            name,
            url,
            type,
            publicId,
        },
    });
};
exports.saveMediaRecord = saveMediaRecord;
const deleteMediaRecord = async (mediaId, userId) => {
    const existing = await prismaService_1.default.media.findFirst({ where: { id: mediaId, userId } });
    if (!existing)
        return null;
    await prismaService_1.default.media.delete({ where: { id: mediaId } });
    return existing;
};
exports.deleteMediaRecord = deleteMediaRecord;
