import prisma from "./prismaService";

// Obtiene la informacion completa de un usuario por su ID
export const getUserById = async (id: string) => {
    try {
        return await prisma.user.findUnique({
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
                        active: true,
                        scheduleAt: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error("[userService] Error al obtener al usuario por ID:", error);
        throw new Error("No se pudo obtener la informacion del usuario.");
    }
};


//Actualiza el perfil de usuario por su ID
export const updateUser = async (id: string, data: any) => {
    try {
        const updated = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                updatedAt: true,
            },
        });

        return updated;
    } catch (error) {
        console.error("[userService] Error al actualizar el usuario:", error);
        throw new Error("No se pudo actualizar el perfil del usuario.");
    }
};