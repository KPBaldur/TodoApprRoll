import prisma from "@services/prismaService";

export const logHistory = async (
    userId: string,
    entity: string,
    action: string,
    payload: any
) => {
    try {
        await prisma.history.create({
            data: {
                userId,
                entity,
                action,
                payloadJson: JSON.stringify(payload),
            },
        });

        console.log(`[HISTORY] ${entity} -> ${action}`);
    } catch (error) {
        console.error("[HISTORY] Error registrando evento:", error);
    }
};