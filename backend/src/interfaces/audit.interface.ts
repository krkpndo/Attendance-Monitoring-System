import { AuditAction, Prisma } from "@prisma/client";

export interface AuditLogInput {
    actorId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    description?: string;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
    ipAddress?: string;
}