import { UserType } from "@prisma/client";

export interface TokenPayload {
    userId: string;
    type: 'access' | 'refresh';
    role: UserType;
    jti?: string;
}