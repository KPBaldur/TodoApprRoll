import { v2 as cloudinary } from "cloudinary";
import prisma from "../services/prismaService";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// SUBE UN ARCHIVO A cLOUDINARY Y DEVUELVE LA METADA DATA NECESARIA
export const uploadToCloudinary = async (filePath: string, folder = "TodoAppRoll") => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: "auto",
        });

        return {
            publicId: result.public_id,
            url: result.secure_url,
            type: result.resource_type,
        };
    } catch (error) {
        console.error("Error al subir a Cloudinary:", error);
        throw new Error("Error al subir el archivo a Cloudinary");
    }
};

// Erliminar un archivo remoto de Cloudinary
export const deleteFromCloudinary = async (publicId: string) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Error al eliminar de Cloudinary:", error);
        throw new Error("Error al eliminar el archivo en Cloudinary");
    }
};

// Crear el registro en la base de datos para un nuevo archivo multimedia
export const saveMediaRecord = async (
    userId: string,
    name: string,
    url: string,
    type: string,
    publicId: string
) => {
    return await prisma.media.create({
        data: {
            userId,
            name,
            url,
            type,
            publicId,
        },
    });
};

export const deleteMediaRecord = async (mediaId: string, userId: string) => {
    const existing = await prisma.media.findFirst({ where: { id: mediaId, userId } });
    if (!existing) return null;

    await prisma.media.delete({ where: { id: mediaId } });
    return existing;
};