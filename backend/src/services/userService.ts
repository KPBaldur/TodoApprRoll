import prisma from "./prismaService";

export const getUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            createdAt: true,
            tasks: {select: { id: true, title: true, status: true } };
        }
    })
}