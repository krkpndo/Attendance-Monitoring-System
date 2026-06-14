import { Prisma } from "@prisma/client";
import { AuditLogInput } from "../interfaces/audit.interface";
import prisma from "../config/prisma";

class AuditService {

    static async log(
        input: AuditLogInput,
        client: Prisma.TransactionClient = prisma
    ) {
        return client.auditLog.create({
            data: {
                userId: input.actorId,
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId,
                description: input.description,
                oldValue: input.oldValue,
                newValue: input.newValue,
                ipAddress: input.ipAddress
            }
        });
    }
}

export default AuditService;