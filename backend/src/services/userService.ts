import prisma from "./prismaService";

export const getUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            createdAt: true,
            tasks: { select: { id: true, title: true, status: true } },
            alarms: { select: { id: true, name: true, enabled: true } },
        },
    });
};

export const updateUser = async (id: string, data: any) => {
    return prisma.user.update({
        where: { id },
        data,
    });
};